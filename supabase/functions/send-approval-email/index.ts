import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminId = claimsData.claims.sub as string;
    const serviceClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: isAdmin } = await serviceClient.rpc("has_role", {
      _user_id: adminId,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { patientEmail, patientName } = await req.json();

    // Resolve email: if patientEmail looks like a UUID, fetch from auth
    let resolvedEmail = patientEmail;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(patientEmail)) {
      const { data: userData } = await serviceClient.auth.admin.getUserById(patientEmail);
      resolvedEmail = userData?.user?.email || '';
    }

    if (!resolvedEmail) {
      console.error("Could not resolve patient email");
      return new Response(JSON.stringify({ success: true, warning: "No email found" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const displayName = patientName || "Paciente";
    const dashboardUrl = "https://trattum.com/dashboard/tratamento";

    try {
      const { error: emailError } = await resend.emails.send({
        from: "Trattum <onboarding@resend.dev>",
        to: [resolvedEmail],
        subject: "Boas-vindas à Trattum: Seu plano de tratamento foi aprovado!",
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#0d9488;margin:0;">Trattum Saúde Digital</p>
      <h1 style="font-size:24px;color:#1a1a1a;margin:12px 0 0;">Seu tratamento foi aprovado!</h1>
    </div>
    
    <div style="border:1px solid #e5e7eb;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="font-size:16px;color:#374151;line-height:1.7;margin:0 0 16px;">
        Olá, <strong>${displayName}</strong>!
      </p>
      <p style="font-size:15px;color:#6b7280;line-height:1.7;margin:0 0 16px;">
        Temos ótimas notícias! Após uma análise cuidadosa do seu perfil clínico, 
        nossa equipe médica aprovou seu plano de tratamento personalizado.
      </p>
      <p style="font-size:15px;color:#6b7280;line-height:1.7;margin:0 0 24px;">
        As instruções de uso e sua receita médica já estão disponíveis na sua área logada. 
        Acesse agora para conferir todos os detalhes do seu protocolo.
      </p>
      
      <div style="text-align:center;">
        <a href="${dashboardUrl}" 
           style="display:inline-block;background-color:#0d9488;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">
          Acessar meu Tratamento →
        </a>
      </div>
    </div>
    
    <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;margin:0;">
        Este e-mail foi enviado automaticamente pela plataforma Trattum.<br/>
        Em caso de dúvidas, entre em contato pelo suporte.
      </p>
      <p style="font-size:11px;color:#d1d5db;margin:8px 0 0;">
        Trattum Saúde Digital · Fortaleza, CE
      </p>
    </div>
  </div>
</body>
</html>`,
      });

      if (emailError) {
        console.warn("Resend error (non-critical):", emailError);
        // Return success anyway — email failure should not block approval
        return new Response(
          JSON.stringify({ success: true, warning: `Email não enviado: ${emailError.message}` }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (emailErr: unknown) {
      console.warn("Email send exception (non-critical):", emailErr);
      return new Response(
        JSON.stringify({ success: true, warning: "Email não pôde ser enviado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in send-approval-email:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
