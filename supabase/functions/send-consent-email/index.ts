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
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  });
}

function maskCPF(cpf: string): string {
  // Remove non-digits
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return "***.***.***-**";
  // Show only middle digits: ***.456.789-**
  return `***.${digits.substring(3, 6)}.${digits.substring(6, 9)}-**`;
}

function buildTCLEEmailHtml(data: ConsentEmailRequest): string {
  const formattedDate = formatDate(data.consent_timestamp);
  const formattedTime = formatTime(data.consent_timestamp);
  const shortHash = data.document_hash.substring(0, 16);
  const maskedCpf = data.user_cpf ? maskCPF(data.user_cpf) : "Não informado";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TCLE — Termo de Consentimento Livre e Esclarecido</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F5F0;font-family:'Georgia','Times New Roman',serif;color:#1A1A1A;">
<div style="display:none;max-height:0;overflow:hidden;">Cópia do seu Termo de Consentimento Livre e Esclarecido — Trattum</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F0;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background-color:#FFFFFF;border-radius:4px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="padding:40px 48px 24px;border-bottom:2px solid #1B5E8C;">
  <h1 style="margin:0 0 4px;font-size:13px;font-weight:400;color:#1B5E8C;letter-spacing:3px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Trattum Saúde Digital</h1>
  <h2 style="margin:0;font-size:22px;font-weight:700;color:#1A1A1A;line-height:1.3;">Termo de Consentimento Livre e Esclarecido</h2>
  <p style="margin:8px 0 0;font-size:12px;color:#888;font-family:Arial,Helvetica,sans-serif;">TCLE • Versão ${data.terms_version} • Documento gerado automaticamente</p>
</td></tr>

<!-- Identification -->
<tr><td style="padding:32px 48px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E0;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:14px 20px;background-color:#FAFAF8;border-bottom:1px solid #E5E5E0;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#888;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Identificação do Titular</p>
    </td></tr>
    <tr><td style="padding:20px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:0 0 12px;width:50%;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:11px;color:#999;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Nome</p>
            <p style="margin:0;font-size:15px;color:#1A1A1A;font-weight:600;">${data.user_name}</p>
          </td>
          <td style="padding:0 0 12px;width:50%;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:11px;color:#999;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">CPF</p>
            <p style="margin:0;font-size:15px;color:#1A1A1A;font-weight:600;font-family:'Courier New',monospace;">${maskedCpf}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0;width:50%;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:11px;color:#999;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">E-mail</p>
            <p style="margin:0;font-size:14px;color:#1A1A1A;">${data.user_email}</p>
          </td>
          <td style="padding:0;width:50%;vertical-align:top;">
            <p style="margin:0 0 2px;font-size:11px;color:#999;font-family:Arial,sans-serif;text-transform:uppercase;letter-spacing:0.5px;">Data do Aceite</p>
            <p style="margin:0;font-size:14px;color:#1A1A1A;">${formattedDate}</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- Declaration -->
<tr><td style="padding:28px 48px 0;">
  <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;font-weight:700;">Declaração de Consentimento</h3>
  <p style="margin:0 0 12px;font-size:14px;color:#333;line-height:1.7;">
    Eu, <strong>${data.user_name}</strong>, portador(a) do CPF <strong>${maskedCpf}</strong>, declaro que em <strong>${formattedDate}</strong> às <strong>${formattedTime}</strong> (horário de Brasília), li integralmente e aceito os seguintes documentos da plataforma Trattum:
  </p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td style="padding:8px 0 8px 16px;font-size:14px;color:#333;border-left:3px solid #1B5E8C;">
      ✓ &nbsp;Termos de Uso da Plataforma Trattum
    </td></tr>
    <tr><td style="padding:8px 0 8px 16px;font-size:14px;color:#333;border-left:3px solid #1B5E8C;">
      ✓ &nbsp;Política de Privacidade e Proteção de Dados (LGPD)
    </td></tr>
    <tr><td style="padding:8px 0 8px 16px;font-size:14px;color:#333;border-left:3px solid #1B5E8C;">
      ✓ &nbsp;Termo de Consentimento Livre e Esclarecido (TCLE)
    </td></tr>
  </table>

  <p style="margin:16px 0 0;font-size:14px;color:#333;line-height:1.7;">
    Declaro ainda ter mais de 18 (dezoito) anos de idade e que todas as informações biométricas e clínicas fornecidas são verídicas e atualizadas.
  </p>
</td></tr>

<!-- Consent Details -->
<tr><td style="padding:28px 48px 0;">
  <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;font-weight:700;">Dados Coletados para Tratamento</h3>
  <p style="margin:0 0 8px;font-size:13px;color:#555;line-height:1.6;">
    Autorizo a coleta e o tratamento dos seguintes dados pessoais, exclusivamente para fins de avaliação clínica personalizada e acompanhamento de saúde:
  </p>
  <ul style="margin:0 0 0 0;padding:0 0 0 20px;font-size:13px;color:#555;line-height:2;">
    <li>Dados pessoais de identificação (nome, CPF, e-mail, telefone)</li>
    <li>Dados sensíveis de saúde (peso, altura, histórico clínico, sintomas, hábitos)</li>
    <li>Dados técnicos para segurança (IP, timestamps, logs de navegação)</li>
  </ul>
</td></tr>

<!-- Rights -->
<tr><td style="padding:28px 48px 0;">
  <h3 style="margin:0 0 12px;font-size:15px;color:#1A1A1A;font-weight:700;">Seus Direitos como Titular</h3>
  <p style="margin:0;font-size:13px;color:#555;line-height:1.7;">
    Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você pode a qualquer momento: acessar, corrigir, portar ou solicitar a exclusão dos seus dados. Você também pode revogar este consentimento sem prejuízo da legalidade do tratamento já realizado.
  </p>
  <p style="margin:12px 0 0;font-size:13px;color:#555;line-height:1.7;">
    Para exercer seus direitos, entre em contato com nosso DPO: <a href="mailto:dpo@trattum.com" style="color:#1B5E8C;text-decoration:none;font-weight:600;">dpo@trattum.com</a>
  </p>
</td></tr>

<!-- Audit Trail -->
<tr><td style="padding:28px 48px 0;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E0;border-radius:8px;overflow:hidden;">
    <tr><td style="padding:14px 20px;background-color:#FAFAF8;border-bottom:1px solid #E5E5E0;">
      <p style="margin:0;font-size:11px;font-weight:700;color:#888;letter-spacing:1.5px;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;">Registro de Auditoria</p>
    </td></tr>
    <tr><td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;color:#555;">
        <tr>
          <td style="padding:4px 0;width:40%;color:#999;">Versão do documento</td>
          <td style="padding:4px 0;font-weight:600;">${data.terms_version}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#999;">Timestamp UTC</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;font-size:11px;">${data.consent_timestamp}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#999;">IP registrado</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;font-size:11px;">${data.ip_address}</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#999;">Hash SHA-256</td>
          <td style="padding:4px 0;font-family:'Courier New',monospace;font-size:11px;">${shortHash}…</td>
        </tr>
      </table>
    </td></tr>
  </table>
</td></tr>

<!-- Legal Footer -->
<tr><td style="padding:32px 48px;border-top:1px solid #E5E5E0;margin-top:32px;">
  <p style="margin:0 0 8px;font-size:11px;color:#999;line-height:1.6;font-family:Arial,Helvetica,sans-serif;">
    Este documento eletrônico possui validade jurídica conforme a Medida Provisória nº 2.200-2/2001, que equipara documentos eletrônicos assinados digitalmente a documentos originais. Os dados de saúde serão armazenados pelo período mínimo de 20 anos, conforme Resolução CFM nº 1.821/2007.
  </p>
  <p style="margin:0 0 12px;font-size:11px;color:#999;font-family:Arial,Helvetica,sans-serif;">
    <a href="https://trattum.com/termos" style="color:#1B5E8C;text-decoration:none;">Ver termos completos</a>
  </p>
  <hr style="border:none;border-top:1px solid #E8E8E5;margin:16px 0;">
  <p style="margin:0;font-size:10px;color:#BBB;text-align:center;font-family:Arial,Helvetica,sans-serif;">
    Trattum Saúde Digital · Fortaleza, CE · CNPJ: XX.XXX.XXX/0001-XX
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // User client - for auth validation
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client - for consent_logs INSERT/UPDATE (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Validate user with getUser (correct SDK method)
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Auth error:", userError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authenticatedUserId = userData.user.id;

    const body: ConsentEmailRequest = await req.json();
    const { user_id, user_name, user_email, user_cpf, consent_timestamp, ip_address, terms_version, document_hash } = body;

    if (!user_id || !user_email || !consent_timestamp || !ip_address || !terms_version || !document_hash) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user_id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: user_id mismatch" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check idempotency (using admin client to bypass RLS)
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
        console.error("Insert error:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to save consent" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      consentId = newLog.id;
    }

    // Update profile (using admin client)
    await supabaseAdmin
      .from("profiles")
      .update({
        has_accepted_terms: true,
        terms_version_accepted: terms_version,
        terms_accepted_at: consent_timestamp,
      })
      .eq("user_id", user_id);

    // Send TCLE email via Resend
    let emailWarning: string | undefined;

    if (resendApiKey && !(existingLog?.email_sent)) {
      try {
        const emailHtml = buildTCLEEmailHtml(body);

        // Use onboarding@resend.dev for testing until domain is verified
        const fromAddress = "Trattum <onboarding@resend.dev>";

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [user_email],
            subject: "Trattum — Cópia do seu Termo de Consentimento (TCLE)",
            html: emailHtml,
          }),
        });

        const resendData = await resendRes.json();
        console.log("Resend response:", JSON.stringify(resendData));

        if (resendRes.ok) {
          await supabaseAdmin
            .from("consent_logs")
            .update({
              email_sent: true,
              email_sent_at: new Date().toISOString(),
              email_resend_id: resendData.id,
            })
            .eq("id", consentId);
        } else {
          console.error("Resend error:", JSON.stringify(resendData));
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
