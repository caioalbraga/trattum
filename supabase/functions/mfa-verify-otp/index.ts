import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface VerifyRequest {
  code: string;
  device_fingerprint: string;
  device_name?: string;
  trust_device?: boolean;
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

    const { code, device_fingerprint, device_name, trust_device }: VerifyRequest = await req.json();

    if (!code || !device_fingerprint) {
      throw new Error("Code and device fingerprint are required");
    }

    // Find valid OTP code
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from("mfa_otp_codes")
      .select("*")
      .eq("user_id", user.id)
      .eq("code", code)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      throw new Error("Código inválido ou expirado");
    }

    // Mark OTP as used
    await supabaseAdmin
      .from("mfa_otp_codes")
      .update({ used: true })
      .eq("id", otpData.id);

    // Get client IP and user agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // If trust_device is true, add to trusted devices
    if (trust_device) {
      // Remove existing device with same fingerprint
      await supabaseAdmin
        .from("trusted_devices")
        .delete()
        .eq("user_id", user.id)
        .eq("device_fingerprint", device_fingerprint);

      // Add new trusted device
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      const { error: trustError } = await supabaseAdmin
        .from("trusted_devices")
        .insert({
          user_id: user.id,
          device_fingerprint,
          device_name: device_name || "Dispositivo desconhecido",
          expires_at: expiresAt.toISOString(),
          ip_address: ip,
          user_agent: userAgent,
        });

      if (trustError) {
        console.error("Error adding trusted device:", trustError);
      }
    }

    // Clean up expired data
    await supabaseAdmin.rpc("cleanup_expired_mfa_data");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Verificação concluída com sucesso",
        device_trusted: trust_device || false
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("MFA Verify OTP Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
