
-- Tabela de notificações do paciente
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  avaliacao_id uuid REFERENCES public.avaliacoes(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Pacientes podem ver suas notificações
CREATE POLICY "Users can view their own notifications"
ON public.notificacoes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Pacientes podem marcar como lida
CREATE POLICY "Users can update their own notifications"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Admins podem gerenciar todas
CREATE POLICY "Admins can manage all notifications"
ON public.notificacoes FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Deny anonymous
CREATE POLICY "Deny anonymous access to notificacoes"
ON public.notificacoes FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Tabela de ajustes clínicos (thread médico-paciente)
CREATE TABLE public.ajustes_clinicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id uuid NOT NULL REFERENCES public.avaliacoes(id),
  user_id uuid NOT NULL,
  autor text NOT NULL,
  mensagem text NOT NULL,
  criado_por uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ajustes_clinicos ENABLE ROW LEVEL SECURITY;

-- Pacientes podem ver seus ajustes
CREATE POLICY "Users can view their own adjustments"
ON public.ajustes_clinicos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Pacientes podem inserir respostas (autor='paciente')
CREATE POLICY "Users can insert their own adjustment responses"
ON public.ajustes_clinicos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND autor = 'paciente');

-- Admins podem gerenciar todos
CREATE POLICY "Admins can manage all adjustments"
ON public.ajustes_clinicos FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Deny anonymous
CREATE POLICY "Deny anonymous access to ajustes_clinicos"
ON public.ajustes_clinicos FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Sanitization triggers
CREATE OR REPLACE FUNCTION public.sanitize_notificacao_inputs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.titulo := public.sanitize_text_input(NEW.titulo);
  NEW.mensagem := public.sanitize_text_input(NEW.mensagem);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_notificacao_before_insert
BEFORE INSERT OR UPDATE ON public.notificacoes
FOR EACH ROW EXECUTE FUNCTION public.sanitize_notificacao_inputs();

CREATE OR REPLACE FUNCTION public.sanitize_ajuste_inputs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.mensagem := public.sanitize_text_input(NEW.mensagem);
  RETURN NEW;
END;
$$;

CREATE TRIGGER sanitize_ajuste_before_insert
BEFORE INSERT OR UPDATE ON public.ajustes_clinicos
FOR EACH ROW EXECUTE FUNCTION public.sanitize_ajuste_inputs();
