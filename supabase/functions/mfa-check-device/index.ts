import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CheckRequest {
  device_fingerprint: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { device_fingerprint }: CheckRequest = await req.json();

    if (!device_fingerprint) {
      throw new Error("Device fingerprint is required");
    }

    // Check if user has MFA enabled
    const { data: mfaSettings } = await supabaseAdmin
      .from("mfa_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // If MFA is not enabled, no verification needed
    if (!mfaSettings || !mfaSettings.mfa_enabled) {
      return new Response(
        JSON.stringify({ 
          mfa_required: false,
          reason: "mfa_not_enabled"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check for trusted device
    const { data: trustedDevice } = await supabaseAdmin
      .from("trusted_devices")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_fingerprint", device_fingerprint)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (trustedDevice) {
      // Update last_used_at
      await supabaseAdmin
        .from("trusted_devices")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", trustedDevice.id);

      return new Response(
        JSON.stringify({ 
          mfa_required: false,
          reason: "trusted_device",
          device_name: trustedDevice.device_name,
          expires_at: trustedDevice.expires_at
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // MFA is required
    return new Response(
      JSON.stringify({ 
        mfa_required: true,
        preferred_method: mfaSettings.preferred_method,
        totp_configured: mfaSettings.totp_verified || false
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("MFA Check Device Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
