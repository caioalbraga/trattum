// Wrapper mantido por compatibilidade.
// Toda lógica de envio agora vive em `send-email`. Esta função:
//  1. Mantém o registro idempotente em `consent_logs` (TCLE digital).
//  2. Atualiza `profiles.has_accepted_terms`.
//  3. Dispara o template `cadastro_confirmado` via `send-email`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ConsentEmailRequest {
  user_id: string;
  user_name: string;
  user_email: string;
  user_cpf?: string;
  consent_timestamp: string;
  ip_address: string;
  terms_version: string;
  document_hash: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ConsentEmailRequest = await req.json();
    const { user_id, user_name, user_email, consent_timestamp, ip_address, terms_version, document_hash } = body;

    if (!user_id || !user_email || !consent_timestamp || !ip_address || !terms_version || !document_hash) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Idempotent consent log
    const { data: existingLog } = await supabaseAdmin
      .from("consent_logs")
      .select("id, email_sent")
      .eq("user_id", user_id)
      .eq("terms_version", terms_version)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let consentId = existingLog?.id;
    if (!existingLog) {
      const { data: newLog, error: insertError } = await supabaseAdmin
        .from("consent_logs")
        .insert({
          user_id,
          consent_timestamp,
          ip_address,
          terms_version,
          document_hash,
          user_agent: req.headers.get("user-agent") || "unknown",
          checkboxes_accepted: { terms_accepted: true, age_verification: true },
          scroll_completed: true,
        })
        .select("id")
        .single();
      if (insertError) {
        return new Response(JSON.stringify({ success: false, error: "Failed to save consent" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      consentId = newLog.id;
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        has_accepted_terms: true,
        terms_version_accepted: terms_version,
        terms_accepted_at: consent_timestamp,
      })
      .eq("user_id", user_id);

    // Delegate to centralized send-email
    let emailWarning: string | undefined;
    if (!existingLog?.email_sent) {
      const { data: sendData, error: sendErr } = await supabaseAdmin.functions.invoke("send-email", {
        body: {
          template_codigo: "cadastro_confirmado",
          destinatario: user_email,
          variaveis: { nome_paciente: user_name || "Paciente" },
        },
      });
      if (sendErr || !sendData?.success) {
        emailWarning = "E-mail será reenviado em breve";
      } else {
        await supabaseAdmin
          .from("consent_logs")
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            email_resend_id: sendData?.resend_id ?? null,
          })
          .eq("id", consentId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, consent_id: consentId, ...(emailWarning && { email_warning: emailWarning }) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-consent-email error:", err);
    return new Response(JSON.stringify({ success: false, error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
