import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate JWT and return user ID
async function validateAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims?.sub) {
    return null;
  }

  return { userId: data.claims.sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code } = await req.json();
    
    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid coupon code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize the coupon code
    const sanitizedCode = code.trim().toUpperCase();
    
    // Create admin client to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Query only the specific coupon - never expose all coupons
    const { data: coupon, error } = await supabaseAdmin
      .from("cupons")
      .select("id, codigo, desconto_percentual, ativo, validade, uso_maximo, uso_atual")
      .eq("codigo", sanitizedCode)
      .eq("ativo", true)
      .maybeSingle();

    if (error) {
      return new Response(
        JSON.stringify({ error: "Error validating coupon" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!coupon) {
      return new Response(
        JSON.stringify({ valid: false, message: "Cupom inválido ou expirado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check expiration
    if (coupon.validade && new Date(coupon.validade) < new Date()) {
      return new Response(
        JSON.stringify({ valid: false, message: "Cupom expirado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check usage limit
    if (coupon.uso_maximo !== null && coupon.uso_atual >= coupon.uso_maximo) {
      return new Response(
        JSON.stringify({ valid: false, message: "Cupom atingiu o limite de uso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return only necessary information - never expose all coupon details
    return new Response(
      JSON.stringify({
        valid: true,
        discount: coupon.desconto_percentual,
        message: `Desconto de ${coupon.desconto_percentual}% aplicado!`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
