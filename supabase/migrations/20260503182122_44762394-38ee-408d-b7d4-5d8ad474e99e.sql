
-- 1) Renomear tabela pedidos atual para pedidos_legacy
ALTER TABLE public.pedidos RENAME TO pedidos_legacy;

-- Renomear policies para refletir novo nome (Postgres mantém policies, mas os nomes ficam)
-- Não é necessário renomear policies funcionalmente.

-- 2) Criar nova tabela pedidos (operacional)
CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pedido_legacy_id uuid REFERENCES public.pedidos_legacy(id) ON DELETE SET NULL,
  medicamento text,
  dosagem text,
  status text NOT NULL DEFAULT 'aguardando_pedido'
    CHECK (status IN (
      'aguardando_pedido',
      'pedido_realizado',
      'em_separacao',
      'enviado',
      'em_transito',
      'entregue',
      'problema'
    )),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_pedidos_paciente ON public.pedidos(paciente_id);
CREATE INDEX idx_pedidos_status ON public.pedidos(status);
CREATE UNIQUE INDEX idx_pedidos_legacy_unique
  ON public.pedidos(pedido_legacy_id)
  WHERE pedido_legacy_id IS NOT NULL;

-- 3) Tabela de log imutável
CREATE TABLE public.pedidos_status_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id uuid NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  status_anterior text,
  status_novo text NOT NULL,
  alterado_por uuid REFERENCES auth.users(id),
  alterado_em timestamptz NOT NULL DEFAULT now(),
  observacao text
);

CREATE INDEX idx_pedidos_log_pedido ON public.pedidos_status_log(pedido_id);

-- 4) Trigger: log de mudança de status
CREATE OR REPLACE FUNCTION public.log_pedido_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.pedidos_status_log (
      pedido_id, status_anterior, status_novo, alterado_por
    ) VALUES (
      NEW.id, OLD.status, NEW.status, auth.uid()
    );
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_pedido_status
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.log_pedido_status_change();

-- 5) Trigger: log inicial na criação
CREATE OR REPLACE FUNCTION public.log_pedido_status_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pedidos_status_log (
    pedido_id, status_anterior, status_novo, alterado_por
  ) VALUES (
    NEW.id, NULL, NEW.status, auth.uid()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_pedido_status_insert
  AFTER INSERT ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.log_pedido_status_insert();

-- 6) Trigger: criação automática a partir de pedidos_legacy quando pago
-- TODO: Acoplado a pedidos_legacy para preservar fluxo atual.
-- Migrar para evento próprio (ex.: gateway de pagamento ou tabela pagamentos)
-- quando a refatoração financeira acontecer.
CREATE OR REPLACE FUNCTION public.create_pedido_from_legacy_payment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_paciente_id uuid;
  v_existing_count int;
BEGIN
  -- Só dispara quando status passou para 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS DISTINCT FROM 'pago') THEN
    -- Idempotência: não duplica se já existe pedido vinculado
    SELECT COUNT(*) INTO v_existing_count
    FROM public.pedidos
    WHERE pedido_legacy_id = NEW.id;

    IF v_existing_count > 0 THEN
      RETURN NEW;
    END IF;

    -- Buscar profile.id correspondente ao user_id
    SELECT id INTO v_paciente_id
    FROM public.profiles
    WHERE user_id = NEW.user_id
    LIMIT 1;

    IF v_paciente_id IS NULL THEN
      RAISE WARNING 'Profile não encontrado para user_id %, pedido operacional não criado', NEW.user_id;
      RETURN NEW;
    END IF;

    INSERT INTO public.pedidos (paciente_id, pedido_legacy_id, status)
    VALUES (v_paciente_id, NEW.id, 'aguardando_pedido');
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_pedido_from_legacy
  AFTER UPDATE ON public.pedidos_legacy
  FOR EACH ROW EXECUTE FUNCTION public.create_pedido_from_legacy_payment();

-- 7) RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_status_log ENABLE ROW LEVEL SECURITY;

-- Deny anon
CREATE POLICY "Deny anonymous access to pedidos op"
  ON public.pedidos FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Deny anonymous access to pedidos_status_log"
  ON public.pedidos_status_log FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- pedidos: SELECT
CREATE POLICY "Patients view own operational orders"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (
    paciente_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins view all operational orders"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Medicos view all operational orders"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'medico'::app_role));

CREATE POLICY "Assistentes view all operational orders"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'assistente'::app_role));

-- pedidos: INSERT (clinical staff)
CREATE POLICY "Clinical staff can insert pedidos"
  ON public.pedidos FOR INSERT
  TO authenticated
  WITH CHECK (is_clinical_staff());

-- pedidos: UPDATE (clinical staff)
CREATE POLICY "Clinical staff can update pedidos"
  ON public.pedidos FOR UPDATE
  TO authenticated
  USING (is_clinical_staff());

-- pedidos: DELETE (admin only)
CREATE POLICY "Admins can delete pedidos"
  ON public.pedidos FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- pedidos_status_log: SELECT (clinical staff only — pacientes não veem)
CREATE POLICY "Clinical staff view status log"
  ON public.pedidos_status_log FOR SELECT
  TO authenticated
  USING (is_clinical_staff());

-- pedidos_status_log: INSERT permitido para clinical staff (triggers SECURITY DEFINER bypassam)
CREATE POLICY "Clinical staff can insert log"
  ON public.pedidos_status_log FOR INSERT
  TO authenticated
  WITH CHECK (is_clinical_staff());

-- 8) Realtime: habilitar para pedidos
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
