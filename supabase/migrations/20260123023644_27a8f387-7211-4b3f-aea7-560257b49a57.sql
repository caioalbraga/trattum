-- ===========================================
-- AUDITORIA DE SEGURANÇA TRATTUM - HIPAA/LGPD
-- ===========================================

-- 1. FUNÇÃO DE VALIDAÇÃO DE ADMIN (Anti-Burp Suite)
-- A função has_role() já existe, mas vamos criar uma versão otimizada para admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
  )
$$;

-- 2. CONSTRAINT DE IMUTABILIDADE PARA AVALIAÇÕES
-- Previne alteração manual de resultados de diagnóstico após criação
CREATE OR REPLACE FUNCTION public.protect_avaliacao_integrity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se não for admin, bloqueia alterações em campos críticos após criação
  IF NOT public.is_admin() THEN
    -- Bloqueia alteração de IMC e score_risco após serem definidos
    IF OLD.imc IS NOT NULL AND NEW.imc IS DISTINCT FROM OLD.imc THEN
      RAISE EXCEPTION 'Alteração de IMC não permitida após cálculo inicial';
    END IF;
    
    IF OLD.score_risco IS NOT NULL AND NEW.score_risco IS DISTINCT FROM OLD.score_risco THEN
      RAISE EXCEPTION 'Alteração de score de risco não permitida';
    END IF;
    
    -- Bloqueia alteração de respostas após aprovação/bloqueio
    IF OLD.status IN ('aprovado', 'bloqueado') AND NEW.respostas::text IS DISTINCT FROM OLD.respostas::text THEN
      RAISE EXCEPTION 'Alteração de respostas não permitida após finalização';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para proteger integridade
DROP TRIGGER IF EXISTS protect_avaliacao_integrity_trigger ON public.avaliacoes;
CREATE TRIGGER protect_avaliacao_integrity_trigger
BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.protect_avaliacao_integrity();

-- 3. VALIDAÇÃO DE IMC NO SERVIDOR
-- Função para calcular e validar IMC automaticamente
CREATE OR REPLACE FUNCTION public.validate_and_calculate_imc()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  peso numeric;
  altura numeric;
  imc_calculado numeric;
BEGIN
  -- Extrai peso e altura das respostas
  peso := (NEW.respostas->>'peso_atual')::numeric;
  altura := (NEW.respostas->>'altura')::numeric;
  
  -- Calcula IMC se peso e altura estão presentes
  IF peso IS NOT NULL AND altura IS NOT NULL AND altura > 0 THEN
    -- Converte altura de cm para metros se necessário
    IF altura > 3 THEN
      altura := altura / 100;
    END IF;
    
    imc_calculado := ROUND(peso / (altura * altura), 2);
    
    -- Valida range razoável de IMC (10-80)
    IF imc_calculado < 10 OR imc_calculado > 80 THEN
      RAISE EXCEPTION 'IMC calculado fora do range válido: %', imc_calculado;
    END IF;
    
    NEW.imc := imc_calculado;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar IMC na inserção
DROP TRIGGER IF EXISTS validate_imc_trigger ON public.avaliacoes;
CREATE TRIGGER validate_imc_trigger
BEFORE INSERT ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.validate_and_calculate_imc();

-- 4. FUNÇÃO DE SANITIZAÇÃO DE INPUT (Anti-XSS)
CREATE OR REPLACE FUNCTION public.sanitize_text_input(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
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

-- 5. TRIGGER DE SANITIZAÇÃO PARA PROFILES
CREATE OR REPLACE FUNCTION public.sanitize_profile_inputs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.nome := public.sanitize_text_input(NEW.nome);
  NEW.whatsapp := regexp_replace(COALESCE(NEW.whatsapp, ''), '[^0-9+]', '', 'g');
  NEW.cpf := regexp_replace(COALESCE(NEW.cpf, ''), '[^0-9.-]', '', 'g');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_profile_trigger ON public.profiles;
CREATE TRIGGER sanitize_profile_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_profile_inputs();

-- 6. TRIGGER DE SANITIZAÇÃO PARA NOTAS DE IMPEDIMENTO
CREATE OR REPLACE FUNCTION public.sanitize_impediment_notes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.nota := public.sanitize_text_input(NEW.nota);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sanitize_notes_trigger ON public.notas_impedimento;
CREATE TRIGGER sanitize_notes_trigger
BEFORE INSERT OR UPDATE ON public.notas_impedimento
FOR EACH ROW
EXECUTE FUNCTION public.sanitize_impediment_notes();

-- 7. VIEW SEGURA PARA DADOS PÚBLICOS (Data Minimization)
-- View que expõe apenas dados não-sensíveis para listagens públicas
DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT 
  id,
  user_id,
  foto_url,
  created_at
FROM public.profiles;

-- RLS na view não é suportado, mas a view já exclui dados sensíveis

-- 8. AUDIT LOG PARA ACESSO ADMIN A DADOS SENSÍVEIS
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS no audit log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de auditoria
CREATE POLICY "Admins can view audit logs"
ON public.audit_log
FOR SELECT
USING (public.is_admin());

-- Sistema pode inserir logs (via triggers)
CREATE POLICY "System can insert audit logs"
ON public.audit_log
FOR INSERT
WITH CHECK (true);

-- 9. FUNÇÃO PARA REGISTRAR ACESSO ADMIN
CREATE OR REPLACE FUNCTION public.log_admin_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Registra apenas acessos de admin a dados de outros usuários
  IF public.is_admin() AND OLD.user_id IS DISTINCT FROM auth.uid() THEN
    INSERT INTO public.audit_log (user_id, action, table_name, record_id, details)
    VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object('target_user_id', COALESCE(NEW.user_id, OLD.user_id))
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 10. ADICIONAR POLÍTICAS MAIS RESTRITIVAS PARA ENDEREÇOS (admin)
CREATE POLICY "Admins can view addresses for order fulfillment"
ON public.enderecos
FOR SELECT
USING (public.is_admin());

-- 11. RESTRIÇÃO: Usuários não podem atualizar próprias avaliações após submissão
DROP POLICY IF EXISTS "Users can update their own assessments" ON public.avaliacoes;

-- Apenas admins podem atualizar avaliações
CREATE POLICY "Only admins can update assessments"
ON public.avaliacoes
FOR UPDATE
USING (public.is_admin());

-- 12. ADICIONAR POLÍTICA PARA ADMINS ATUALIZAREM TRATAMENTOS
CREATE POLICY "Admins can update treatments"
ON public.tratamentos
FOR UPDATE
USING (public.is_admin());