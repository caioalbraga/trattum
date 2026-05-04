
ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_pedido_legacy_id_key UNIQUE (pedido_legacy_id);

CREATE OR REPLACE FUNCTION public.create_pedido_from_legacy_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente_id uuid;
  v_status_pago text := 'pago';
BEGIN
  IF NEW.status IS DISTINCT FROM v_status_pago THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = v_status_pago THEN
    RETURN NEW;
  END IF;

  -- TODO: Acoplado a pedidos_legacy para preservar fluxo atual.
  -- Migrar para evento próprio quando a refatoração financeira acontecer.
  SELECT id INTO v_paciente_id
  FROM public.profiles
  WHERE user_id = NEW.user_id
  LIMIT 1;

  IF v_paciente_id IS NULL THEN
    RAISE EXCEPTION 'Profile não encontrado para user_id % ao criar pedido operacional', NEW.user_id;
  END IF;

  INSERT INTO public.pedidos (paciente_id, pedido_legacy_id, status)
  VALUES (v_paciente_id, NEW.id, 'aguardando_pedido')
  ON CONFLICT (pedido_legacy_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_pedido_from_legacy ON public.pedidos_legacy;
DROP TRIGGER IF EXISTS trg_create_pedido_from_legacy_ins ON public.pedidos_legacy;
DROP TRIGGER IF EXISTS trg_create_pedido_from_legacy_upd ON public.pedidos_legacy;

CREATE TRIGGER trg_create_pedido_from_legacy_ins
  AFTER INSERT ON public.pedidos_legacy
  FOR EACH ROW EXECUTE FUNCTION public.create_pedido_from_legacy_payment();

CREATE TRIGGER trg_create_pedido_from_legacy_upd
  AFTER UPDATE OF status ON public.pedidos_legacy
  FOR EACH ROW EXECUTE FUNCTION public.create_pedido_from_legacy_payment();

INSERT INTO public.pedidos (paciente_id, pedido_legacy_id, status)
SELECT p.id, pl.id, 'aguardando_pedido'
FROM public.pedidos_legacy pl
JOIN public.profiles p ON p.user_id = pl.user_id
WHERE pl.status = 'pago'
ON CONFLICT (pedido_legacy_id) DO NOTHING;
