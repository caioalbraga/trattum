
-- 1. Trigger: anamnese recebida (após insert em avaliacoes)
CREATE OR REPLACE FUNCTION public.trg_email_anamnese_recebida()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_nome text;
BEGIN
  SELECT u.email, COALESCE(p.nome, 'Paciente')
    INTO v_email, v_nome
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = NEW.user_id;

  IF v_email IS NOT NULL THEN
    PERFORM public.invoke_send_email(
      'anamnese_recebida',
      v_email,
      jsonb_build_object('nome_paciente', v_nome)
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avaliacoes_email_recebida ON public.avaliacoes;
CREATE TRIGGER trg_avaliacoes_email_recebida
AFTER INSERT ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.trg_email_anamnese_recebida();

-- 2. Trigger: status muda → bloqueado ou ajuste
CREATE OR REPLACE FUNCTION public.trg_email_avaliacao_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text;
  v_nome text;
  v_template text;
  v_mensagem text;
  v_vars jsonb;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  IF NEW.status = 'bloqueado' AND OLD.status <> 'bloqueado' THEN
    v_template := 'anamnese_rejeitada';
  ELSIF NEW.status = 'ajuste' AND OLD.status <> 'ajuste' THEN
    v_template := 'anamnese_ajustes';
  ELSE
    RETURN NEW;
  END IF;

  SELECT u.email, COALESCE(p.nome, 'Paciente')
    INTO v_email, v_nome
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE u.id = NEW.user_id;

  IF v_email IS NULL THEN RETURN NEW; END IF;

  v_vars := jsonb_build_object('nome_paciente', v_nome);

  IF v_template = 'anamnese_ajustes' THEN
    SELECT mensagem INTO v_mensagem
    FROM public.ajustes_clinicos
    WHERE avaliacao_id = NEW.id AND autor = 'medico'
    ORDER BY created_at DESC
    LIMIT 1;
    v_vars := v_vars || jsonb_build_object('mensagem_ajuste', COALESCE(v_mensagem, ''));
  END IF;

  PERFORM public.invoke_send_email(v_template, v_email, v_vars);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_avaliacoes_email_status ON public.avaliacoes;
CREATE TRIGGER trg_avaliacoes_email_status
AFTER UPDATE OF status ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.trg_email_avaliacao_status();

-- 3. Trigger: pagamento confirmado (pedidos_legacy)
DROP TRIGGER IF EXISTS trg_pedidos_legacy_email_pago ON public.pedidos_legacy;
CREATE TRIGGER trg_pedidos_legacy_email_pago
AFTER INSERT OR UPDATE OF status ON public.pedidos_legacy
FOR EACH ROW
EXECUTE FUNCTION public.trg_email_pagamento_confirmado();

-- 4. Trigger: pedido operacional (a caminho / entregue)
DROP TRIGGER IF EXISTS trg_pedidos_email_status ON public.pedidos;
CREATE TRIGGER trg_pedidos_email_status
AFTER UPDATE OF status ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.trg_email_pedido_status();
