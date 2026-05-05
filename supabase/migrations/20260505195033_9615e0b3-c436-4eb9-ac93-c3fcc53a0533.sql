
-- =========================================================================
-- Extensions
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =========================================================================
-- Tables
-- =========================================================================
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao text,
  gatilho text NOT NULL,
  assunto text NOT NULL,
  corpo_html text NOT NULL,
  variaveis_disponiveis text[] NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  modo_teste boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id)
);
CREATE INDEX idx_email_templates_codigo ON public.email_templates(codigo);
CREATE INDEX idx_email_templates_ativo ON public.email_templates(ativo);

CREATE TABLE public.email_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_codigo text NOT NULL,
  destinatario text NOT NULL,
  assunto text NOT NULL,
  status text NOT NULL CHECK (status IN ('enviado','falhou','em_rota')),
  resend_id text,
  erro text,
  modo_teste boolean NOT NULL DEFAULT false,
  enviado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_email_log_template ON public.email_log(template_codigo);
CREATE INDEX idx_email_log_data ON public.email_log(enviado_em DESC);

CREATE TABLE public.email_followup_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pedido_legacy_id uuid REFERENCES public.pedidos_legacy(id) ON DELETE CASCADE,
  template_codigo text NOT NULL,
  agendado_para timestamptz NOT NULL,
  enviado boolean NOT NULL DEFAULT false,
  cancelado boolean NOT NULL DEFAULT false,
  cancelado_motivo text,
  enviado_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_followup_pendentes ON public.email_followup_jobs(agendado_para)
  WHERE enviado = false AND cancelado = false;

-- =========================================================================
-- Trigger: updated_at
-- =========================================================================
CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- RLS
-- =========================================================================
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_followup_jobs ENABLE ROW LEVEL SECURITY;

-- email_templates
CREATE POLICY "Clinical staff can view templates"
  ON public.email_templates FOR SELECT TO authenticated
  USING (public.is_clinical_staff());
CREATE POLICY "Admins can insert templates"
  ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can update templates"
  ON public.email_templates FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins can delete templates"
  ON public.email_templates FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- email_log (insert via service role only; no user policies for write)
CREATE POLICY "Clinical staff can view email log"
  ON public.email_log FOR SELECT TO authenticated
  USING (public.is_clinical_staff());

-- email_followup_jobs
CREATE POLICY "Clinical staff can view followups"
  ON public.email_followup_jobs FOR SELECT TO authenticated
  USING (public.is_clinical_staff());
CREATE POLICY "Admins can delete followups"
  ON public.email_followup_jobs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Clinical staff can insert followups"
  ON public.email_followup_jobs FOR INSERT TO authenticated
  WITH CHECK (public.is_clinical_staff());

-- =========================================================================
-- Seed: 10 templates
-- =========================================================================
-- Helper: shared HTML wrapper inserted inline. Dark Forest Green #1A2E2A on #FDFCF8.
INSERT INTO public.email_templates (codigo, nome, descricao, gatilho, assunto, variaveis_disponiveis, corpo_html) VALUES
('cadastro_confirmado','Confirmação de cadastro','Enviado após o paciente criar sua conta.','Conta criada com sucesso',
 'Bem-vindo(a) à Trattum',
 ARRAY['{{nome_paciente}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#1A2E2A;margin:0">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">Bem-vindo(a), {{nome_paciente}}!</h1>
<p style="font-size:15px;line-height:1.7">Sua conta foi criada com sucesso. Em breve, nossa equipe revisará sua anamnese e entraremos em contato com os próximos passos do seu tratamento.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('anamnese_recebida','Anamnese recebida','Confirmação de submissão da anamnese.','Submissão da anamnese',
 'Recebemos sua anamnese',
 ARRAY['{{nome_paciente}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">Olá, {{nome_paciente}}</h1>
<p style="font-size:15px;line-height:1.7">Recebemos sua anamnese e ela está em análise pelo nosso time clínico. Em até 48 horas você receberá uma resposta sobre a aprovação do seu tratamento.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('anamnese_aprovada','Anamnese aprovada','Médico aprovou e liberou pagamento.','Aprovação clínica',
 'Sua anamnese foi aprovada — siga para o pagamento',
 ARRAY['{{nome_paciente}}','{{link_pagamento}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, sua anamnese foi aprovada!</h1>
<p style="font-size:15px;line-height:1.7">Nossa equipe médica analisou seu perfil e aprovou seu plano de tratamento personalizado. O próximo passo é confirmar o pagamento do Pacote Trattum.</p>
<div style="text-align:center;margin:32px 0">
<a href="{{link_pagamento}}" style="background:#1A2E2A;color:#FDFCF8;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600">Acessar pagamento</a>
</div>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('anamnese_rejeitada','Anamnese rejeitada','Paciente não atende critérios clínicos.','Bloqueio clínico',
 'Sobre sua avaliação na Trattum',
 ARRAY['{{nome_paciente}}','{{motivo}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">Olá, {{nome_paciente}}</h1>
<p style="font-size:15px;line-height:1.7">Após análise cuidadosa do seu perfil clínico, nossa equipe identificou que, neste momento, o tratamento Trattum não é o mais indicado para você.</p>
<p style="font-size:15px;line-height:1.7"><strong>Motivo:</strong> {{motivo}}</p>
<p style="font-size:15px;line-height:1.7">Recomendamos buscar acompanhamento médico presencial. Estamos à disposição para esclarecer dúvidas.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('anamnese_ajustes','Anamnese precisa de ajustes','Médico solicitou revisão de informações.','Solicitação de ajuste',
 'Precisamos de algumas informações adicionais',
 ARRAY['{{nome_paciente}}','{{observacao}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, precisamos de mais detalhes</h1>
<p style="font-size:15px;line-height:1.7">Nosso time clínico solicita um ajuste na sua anamnese para concluir a análise:</p>
<blockquote style="border-left:3px solid #1A2E2A;padding:8px 16px;margin:16px 0;font-style:italic;color:#374151">{{observacao}}</blockquote>
<p style="font-size:15px;line-height:1.7">Acesse seu painel para complementar as informações.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('followup_pagamento_dia3','Lembrete de pagamento (3 dias)','Cron — 3 dias sem pagar após aprovação.','Cron 72h',
 'Seu tratamento aprovado está esperando',
 ARRAY['{{nome_paciente}}','{{link_pagamento}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, seu tratamento está reservado</h1>
<p style="font-size:15px;line-height:1.7">Sua anamnese foi aprovada há alguns dias e o Pacote Trattum continua disponível. Confirme o pagamento para iniciar seu acompanhamento.</p>
<div style="text-align:center;margin:32px 0">
<a href="{{link_pagamento}}" style="background:#1A2E2A;color:#FDFCF8;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600">Confirmar pagamento</a>
</div>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('followup_pagamento_dia7','Último lembrete de pagamento (7 dias)','Cron — 7 dias sem pagar.','Cron 7d',
 'Última chance: seu tratamento expira em breve',
 ARRAY['{{nome_paciente}}','{{link_pagamento}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, este é o último aviso</h1>
<p style="font-size:15px;line-height:1.7">Sua aprovação clínica foi feita há uma semana. Caso não receba o pagamento nos próximos dias, será necessário refazer parte da avaliação.</p>
<div style="text-align:center;margin:32px 0">
<a href="{{link_pagamento}}" style="background:#1A2E2A;color:#FDFCF8;padding:14px 32px;text-decoration:none;border-radius:6px;font-size:15px;font-weight:600">Pagar agora</a>
</div>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('pagamento_confirmado','Pagamento confirmado','Pagamento registrado, pedido entrando em rota operacional.','pedidos_legacy.status=pago',
 'Pagamento confirmado — preparando seu tratamento',
 ARRAY['{{nome_paciente}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">Pagamento recebido, {{nome_paciente}}!</h1>
<p style="font-size:15px;line-height:1.7">Seu pagamento foi confirmado. Estamos preparando sua medicação e os materiais de acompanhamento. Em breve você receberá novidades sobre o envio.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('pedido_a_caminho','Seu tratamento está a caminho','Pedido despachado / em trânsito.','pedidos.status=enviado/em_transito',
 'Seu tratamento está a caminho',
 ARRAY['{{nome_paciente}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, seu tratamento foi enviado</h1>
<p style="font-size:15px;line-height:1.7">Sua medicação saiu para entrega e deve chegar em breve no endereço cadastrado. Acompanhe pelo seu painel para mais detalhes.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$),

('pedido_entregue','Tratamento entregue','Pedido marcado como entregue.','pedidos.status=entregue',
 'Seu tratamento foi entregue',
 ARRAY['{{nome_paciente}}'],
 $HTML$<!DOCTYPE html><html><body style="margin:0;background:#FDFCF8;font-family:Georgia,serif;color:#1A2E2A">
<div style="max-width:600px;margin:0 auto;padding:40px 32px">
<p style="font-size:11px;letter-spacing:3px;text-transform:uppercase">Trattum Saúde Digital</p>
<h1 style="font-size:26px;margin:16px 0 24px">{{nome_paciente}}, tudo entregue!</h1>
<p style="font-size:15px;line-height:1.7">Seu tratamento foi entregue. Acesse seu painel para conferir as instruções de uso e iniciar seu protocolo. Estamos aqui para qualquer dúvida.</p>
<p style="font-size:13px;color:#6b7280;margin-top:40px;border-top:1px solid #e5e5e0;padding-top:16px">Trattum · Fortaleza, CE</p>
</div></body></html>$HTML$);

-- =========================================================================
-- pg_net helper: invoke send-email
-- Anon key is public; edge function uses service role internally for DB writes
-- =========================================================================
CREATE OR REPLACE FUNCTION public.invoke_send_email(
  p_template_codigo text,
  p_destinatario text,
  p_variaveis jsonb DEFAULT '{}'::jsonb
) RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text := 'https://lkfgxtiezjnphxqlmmbm.supabase.co/functions/v1/send-email';
  v_anon text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrZmd4dGllempucGh4cWxtbWJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1ODIxNjUsImV4cCI6MjA4NDE1ODE2NX0.FRrVbn7YOr1aFv9t8SJ8x650m9uajnmDm5VQU5KVn4s';
  v_request_id bigint;
BEGIN
  IF p_destinatario IS NULL OR p_destinatario = '' THEN
    RETURN NULL;
  END IF;

  -- Idempotência: evita reenvios para mesmo template+destinatário em 24h
  IF EXISTS (
    SELECT 1 FROM public.email_log
    WHERE template_codigo = p_template_codigo
      AND destinatario = p_destinatario
      AND status = 'enviado'
      AND enviado_em > now() - interval '24 hours'
  ) THEN
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey', v_anon,
      'Authorization','Bearer '||v_anon
    ),
    body := jsonb_build_object(
      'template_codigo', p_template_codigo,
      'destinatario', p_destinatario,
      'variaveis', p_variaveis,
      'source','trigger'
    )
  ) INTO v_request_id;

  RETURN v_request_id;
END;
$$;

-- =========================================================================
-- Trigger: pagamento confirmado em pedidos_legacy
-- =========================================================================
CREATE OR REPLACE FUNCTION public.trg_email_pagamento_confirmado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_nome text;
BEGIN
  IF NEW.status <> 'pago' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'pago' THEN RETURN NEW; END IF;

  SELECT u.email, COALESCE(p.nome,'Paciente')
    INTO v_email, v_nome
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = NEW.user_id;

  IF v_email IS NOT NULL THEN
    PERFORM public.invoke_send_email(
      'pagamento_confirmado',
      v_email,
      jsonb_build_object('nome_paciente', v_nome)
    );
  END IF;

  -- Cancela follow-ups pendentes desse paciente
  UPDATE public.email_followup_jobs
  SET cancelado = true, cancelado_motivo = 'pagamento_realizado'
  WHERE paciente_id = (SELECT id FROM public.profiles WHERE user_id = NEW.user_id LIMIT 1)
    AND enviado = false AND cancelado = false;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_pagamento_legacy_upd
  AFTER UPDATE OF status ON public.pedidos_legacy
  FOR EACH ROW EXECUTE FUNCTION public.trg_email_pagamento_confirmado();
CREATE TRIGGER trg_email_pagamento_legacy_ins
  AFTER INSERT ON public.pedidos_legacy
  FOR EACH ROW EXECUTE FUNCTION public.trg_email_pagamento_confirmado();

-- =========================================================================
-- Trigger: pedidos.status -> enviado/em_transito/entregue
-- =========================================================================
CREATE OR REPLACE FUNCTION public.trg_email_pedido_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email text;
  v_nome text;
  v_template text;
  v_user_id uuid;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status IN ('enviado','em_transito') AND OLD.status NOT IN ('enviado','em_transito') THEN
    v_template := 'pedido_a_caminho';
  ELSIF NEW.status = 'entregue' AND OLD.status <> 'entregue' THEN
    v_template := 'pedido_entregue';
  ELSE
    RETURN NEW;
  END IF;

  SELECT p.user_id, COALESCE(p.nome,'Paciente')
    INTO v_user_id, v_nome
  FROM public.profiles p
  WHERE p.id = NEW.paciente_id;

  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  IF v_email IS NOT NULL THEN
    PERFORM public.invoke_send_email(
      v_template,
      v_email,
      jsonb_build_object('nome_paciente', v_nome)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_email_pedido_status
  AFTER UPDATE OF status ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.trg_email_pedido_status();

-- =========================================================================
-- Cron processor for follow-ups
-- =========================================================================
CREATE OR REPLACE FUNCTION public.process_pending_followups()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job RECORD;
  v_email text;
  v_nome text;
  v_count integer := 0;
BEGIN
  FOR job IN
    SELECT f.* FROM public.email_followup_jobs f
    WHERE f.enviado = false AND f.cancelado = false
      AND f.agendado_para <= now()
    LIMIT 100
  LOOP
    SELECT u.email, COALESCE(p.nome,'Paciente')
      INTO v_email, v_nome
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.user_id
    WHERE p.id = job.paciente_id;

    IF v_email IS NOT NULL THEN
      PERFORM public.invoke_send_email(
        job.template_codigo,
        v_email,
        jsonb_build_object(
          'nome_paciente', v_nome,
          'link_pagamento', 'https://trattum.com/checkout'
        )
      );
    END IF;

    UPDATE public.email_followup_jobs
    SET enviado = true, enviado_em = now()
    WHERE id = job.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

SELECT cron.schedule(
  'process_email_followups',
  '0 * * * *',
  $$ SELECT public.process_pending_followups(); $$
);
