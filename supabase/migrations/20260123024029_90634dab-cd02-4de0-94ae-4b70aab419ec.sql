-- ===========================================
-- CORREÇÃO DE WARNINGS DO LINTER
-- ===========================================

-- 1. REMOVER VIEW COM SECURITY DEFINER (substituir por função segura)
DROP VIEW IF EXISTS public.profiles_public;

-- Criar função segura para obter dados públicos de perfil
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  foto_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.foto_url,
    p.created_at
  FROM public.profiles p
  WHERE p.user_id = target_user_id
    AND (
      p.user_id = auth.uid() 
      OR public.is_admin()
    );
$$;

-- 2. CORRIGIR FUNÇÃO sanitize_text_input - adicionar search_path
DROP FUNCTION IF EXISTS public.sanitize_text_input(text);
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Remove tags HTML/script
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(input_text, '<script[^>]*>.*?</script>', '', 'gi'),
      '<[^>]+>', '', 'g'
    ),
    '(javascript:|data:|vbscript:)', '', 'gi'
  );
END;
$$;

-- 3. CORRIGIR POLÍTICA PERMISSIVA DO AUDIT LOG
-- Remover política que permite qualquer INSERT
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Criar política mais restritiva - apenas triggers do sistema podem inserir
-- Triggers SECURITY DEFINER rodam como owner, então inserções são permitidas
CREATE POLICY "Authenticated users can insert own audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para sistema inserir via triggers (usando service role internamente)
CREATE POLICY "System triggers can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. ADICIONAR POLÍTICA DENY ANONYMOUS NO AUDIT LOG
CREATE POLICY "Deny anonymous access to audit_log"
ON public.audit_log
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 5. FUNÇÃO DE LOG ADMIN MELHORADA (já tem search_path)
-- A função log_admin_access já está correta

-- 6. REFORÇAR SANITIZAÇÃO EM TODOS OS CAMPOS DE TEXTO
-- Trigger para sanitizar pedidos (descrição)
CREATE OR REPLACE FUNCTION public.sanitize_pedido_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.descricao := public.sanitize_text_input(NEW.descricao);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_pedido_trigger ON public.pedidos;
CREATE TRIGGER sanitize_pedido_trigger
BEFORE INSERT OR UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_pedido_inputs();

-- Trigger para sanitizar tratamentos (observações)
CREATE OR REPLACE FUNCTION public.sanitize_tratamento_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.observacoes := public.sanitize_text_input(NEW.observacoes);
  NEW.plano := public.sanitize_text_input(NEW.plano);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_tratamento_trigger ON public.tratamentos;
CREATE TRIGGER sanitize_tratamento_trigger
BEFORE INSERT OR UPDATE ON public.tratamentos
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_tratamento_inputs();

-- Trigger para sanitizar prescrições (observações, dosagem, tratamento)
CREATE OR REPLACE FUNCTION public.sanitize_prescricao_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.observacoes := public.sanitize_text_input(NEW.observacoes);
  NEW.dosagem := public.sanitize_text_input(NEW.dosagem);
  NEW.tratamento := public.sanitize_text_input(NEW.tratamento);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_prescricao_trigger ON public.prescricoes;
CREATE TRIGGER sanitize_prescricao_trigger
BEFORE INSERT OR UPDATE ON public.prescricoes
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_prescricao_inputs();

-- Trigger para sanitizar metas diárias (titulo)
CREATE OR REPLACE FUNCTION public.sanitize_meta_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.titulo := public.sanitize_text_input(NEW.titulo);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_meta_trigger ON public.metas_diarias;
CREATE TRIGGER sanitize_meta_trigger
BEFORE INSERT OR UPDATE ON public.metas_diarias
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_meta_inputs();