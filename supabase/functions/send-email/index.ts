import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReqBody {
  template_codigo: string;
  destinatario: string;
  variaveis?: Record<string, string>;
  forcar_modo_teste?: boolean;
  source?: string;
}

function renderTemplate(input: string, vars: Record<string, string>): string {
  return input.replace(/\{\{\s*([\w_]+)\s*\}\}/g, (_m, key) => {
    const v = vars[key];
    return v == null ? "" : String(v);
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const admin = createClient(supabaseUrl, serviceKey);

  try {
    const body = (await req.json()) as ReqBody;
    if (!body?.template_codigo || !body?.destinatario) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try to identify the caller (admin) for test-mode override
    let callerEmail: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      // Skip if it's the anon key (trigger calls)
      if (token !== anonKey) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await userClient.auth.getUser(token);
        callerEmail = data?.user?.email ?? null;
      }
    }

    const { data: tpl, error: tplErr } = await admin
      .from("email_templates")
      .select("*")
      .eq("codigo", body.template_codigo)
      .maybeSingle();

    if (tplErr || !tpl) {
      await admin.from("email_log").insert({
        template_codigo: body.template_codigo,
        destinatario: body.destinatario,
        assunto: "(template não encontrado)",
        status: "falhou",
        erro: `Template ${body.template_codigo} não encontrado`,
      });
      return new Response(JSON.stringify({ success: false, error: "template_not_found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!tpl.ativo) {
      await admin.from("email_log").insert({
        template_codigo: tpl.codigo,
        destinatario: body.destinatario,
        assunto: tpl.assunto,
        status: "falhou",
        erro: "Template inativo",
      });
      return new Response(JSON.stringify({ success: false, error: "template_inactive" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vars = body.variaveis ?? {};
    const subject = renderTemplate(tpl.assunto, vars);
    const html = renderTemplate(tpl.corpo_html, vars);

    const isTestMode = !!(tpl.modo_teste || body.forcar_modo_teste);
    let recipient = body.destinatario;
    if (isTestMode) {
      if (callerEmail) recipient = callerEmail;
    }

    if (!resendKey) {
      await admin.from("email_log").insert({
        template_codigo: tpl.codigo,
        destinatario: recipient,
        assunto: subject,
        status: "falhou",
        erro: "RESEND_API_KEY não configurada",
        modo_teste: isTestMode,
      });
      return new Response(JSON.stringify({ success: false, error: "no_resend_key" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Trattum <noreply@trattum.com>",
        to: [recipient],
        subject,
        html,
      }),
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      const { data: logRow } = await admin
        .from("email_log")
        .insert({
          template_codigo: tpl.codigo,
          destinatario: recipient,
          assunto: subject,
          status: "falhou",
          erro: JSON.stringify(data),
          modo_teste: isTestMode,
        })
        .select("id")
        .single();
      return new Response(JSON.stringify({ success: false, error: data, log_id: logRow?.id }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: logRow } = await admin
      .from("email_log")
      .insert({
        template_codigo: tpl.codigo,
        destinatario: recipient,
        assunto: subject,
        status: "enviado",
        resend_id: data?.id ?? null,
        modo_teste: isTestMode,
      })
      .select("id")
      .single();

    return new Response(JSON.stringify({ success: true, log_id: logRow?.id, resend_id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
