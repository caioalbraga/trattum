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
  consent_timestamp: string;
  ip_address: string;
  terms_version: string;
  document_hash: string;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function buildEmailHtml(data: ConsentEmailRequest): string {
  const formattedDate = formatDate(data.consent_timestamp);
  const formattedTime = formatTime(data.consent_timestamp);
  const shortHash = data.document_hash.substring(0, 16) + "...";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Confirmação de Consentimento - Trattum</title>
</head>
<body style="margin:0;padding:0;background-color:#FFFDF9;font-family:Arial,Helvetica,sans-serif;color:#333333;">
<div style="display:none;max-height:0;overflow:hidden;">Seu consentimento foi registrado com sucesso na Trattum</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFDF9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td align="center" style="padding:24px 0 16px;">
<h1 style="margin:0;font-size:22px;font-weight:700;color:#333;letter-spacing:2px;">TRATTUM</h1>
</td></tr>
<tr><td><hr style="border:none;border-top:2px solid #1B5E8C;margin:0 0 24px;"></td></tr>

<!-- Greeting -->
<tr><td style="padding:0 24px;">
<p style="font-size:16px;color:#333;margin:0 0 8px;">Olá, <strong>${data.user_name}</strong></p>
<p style="font-size:14px;color:#555;line-height:1.6;margin:0 0 24px;">
Este e-mail confirma que você aceitou os Termos de Uso e a Política de Privacidade da plataforma Trattum em <strong>${formattedDate}</strong> às <strong>${formattedTime}</strong> (horário de Brasília).
</p>
</td></tr>

<!-- Summary Card -->
<tr><td style="padding:0 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F7F5;border:1px solid #E8E8E5;border-radius:12px;">
<tr><td style="padding:20px;">
<p style="margin:0 0 12px;font-size:14px;color:#333;">
📋 <strong>Documento aceito:</strong> Termos de Uso, Política de Privacidade e TCLE
</p>
<p style="margin:0 0 12px;font-size:14px;color:#333;">
📅 <strong>Data e hora:</strong> ${formattedDate} às ${formattedTime}
</p>
<p style="margin:0 0 12px;font-size:14px;color:#333;">
🔢 <strong>Versão do documento:</strong> ${data.terms_version}
</p>
<p style="margin:0 0 12px;font-size:14px;color:#333;">
🌐 <strong>IP registrado:</strong> ${data.ip_address}
</p>
<p style="margin:0;font-size:14px;color:#333;">
🔒 <strong>Hash de integridade:</strong> <code style="background:#E8E8E5;padding:2px 6px;border-radius:4px;font-size:12px;">${shortHash}</code>
</p>
</td></tr>
</table>
</td></tr>

<!-- Rights -->
<tr><td style="padding:24px;">
<h3 style="margin:0 0 8px;font-size:15px;color:#333;">Seus Direitos</h3>
<p style="font-size:13px;color:#555;line-height:1.6;margin:0 0 4px;">
Você pode revogar este consentimento a qualquer momento.
</p>
<p style="font-size:13px;color:#555;line-height:1.6;margin:0;">
Para exercer seus direitos, entre em contato: <a href="mailto:dpo@trattum.com.br" style="color:#1B5E8C;">dpo@trattum.com.br</a>
</p>
</td></tr>

<!-- Clinical Warning -->
<tr><td style="padding:0 24px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #F59E0B;border-radius:12px;background-color:#FFFBEB;">
<tr><td style="padding:16px;">
<p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">
⚠️ As indicações de tratamento estão sujeitas a revisão médica.<br>
<strong>NÃO SE AUTOMEDIQUE.</strong> Em caso de emergência, ligue para o SAMU: 192.
</p>
</td></tr>
</table>
</td></tr>

<!-- Footer -->
<tr><td style="padding:24px;text-align:center;border-top:1px solid #E8E8E5;margin-top:24px;">
<p style="font-size:11px;color:#999;line-height:1.5;margin:0 0 8px;">
Este é um documento gerado automaticamente para sua segurança jurídica.<br>
O aceite eletrônico possui validade conforme MP 2.200-2/2001.
</p>
<p style="font-size:11px;color:#999;margin:0 0 8px;">
<a href="https://trattum.com.br/termos" style="color:#1B5E8C;">Ver termos completos</a>
</p>
<p style="font-size:10px;color:#BBB;margin:0;">
Trattum Saúde Digital · Fortaleza, CE
</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = claims.claims.sub;

    // Parse body
    const body: ConsentEmailRequest = await req.json();
    const { user_id, user_name, user_email, consent_timestamp, ip_address, terms_version, document_hash } = body;

    // Validate required fields
    if (!user_id || !user_email || !consent_timestamp || !ip_address || !terms_version || !document_hash) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user_id matches authenticated user
    if (user_id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: user_id mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency
    const { data: existingLog } = await supabase
      .from("consent_logs")
      .select("id, email_sent")
      .eq("user_id", user_id)
      .eq("terms_version", terms_version)
      .is("revoked_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let consentId = existingLog?.id;

    // Insert consent log if not exists
    if (!existingLog) {
      const { data: newLog, error: insertError } = await supabase
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
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to save consent" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      consentId = newLog.id;
    }

    // Update profile
    await supabase
      .from("profiles")
      .update({
        has_accepted_terms: true,
        terms_version_accepted: terms_version,
        terms_accepted_at: consent_timestamp,
      })
      .eq("user_id", user_id);

    // Send email via Resend
    let emailWarning: string | undefined;

    if (resendApiKey && !(existingLog?.email_sent)) {
      try {
        const emailHtml = buildEmailHtml(body);

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Trattum <noreply@trattum.com.br>",
            to: [user_email],
            subject: "Trattum — Cópia do seu Termo de Consentimento",
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json();

        if (resendRes.ok) {
          // Update consent log with email status
          await supabase
            .from("consent_logs")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_resend_id: resendData.id,
            })
            .eq("id", consentId);
        } else {
          console.error("Resend error:", resendData);
          emailWarning = "E-mail será reenviado em breve";
        }
      } catch (emailError) {
        console.error("Email send error:", emailError);
        emailWarning = "E-mail será reenviado em breve";
      }
    } else if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      emailWarning = "Sistema de e-mail não configurado";
    }

    return new Response(
      JSON.stringify({
        success: true,
        consent_id: consentId,
        ...(emailWarning && { email_warning: emailWarning }),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
