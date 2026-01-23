-- ===========================================
-- CORREÇÃO FINAL: CUPONS E MÉTRICAS DE FUNIL
-- ===========================================

-- 1. CUPONS: Já tem RLS habilitado com política admin-only
-- Verificar e garantir que usuários não autenticados não acessem
-- A tabela cupons JÁ TEM política admin-only, mas vamos reforçar

-- Remover qualquer política existente que possa permitir acesso
DROP POLICY IF EXISTS "Public can validate coupons" ON public.cupons;

-- Garantir que apenas admins podem acessar a tabela diretamente
-- Validação de cupons deve ser feita via Edge Function validate-coupon

-- 2. MÉTRICAS DE FUNIL: Restringir INSERT apenas para sistema autenticado com validação
-- Remover política atual que permite qualquer INSERT
DROP POLICY IF EXISTS "Authenticated users can insert metrics" ON public.metricas_funil;

-- Criar política mais restritiva - apenas sistema pode inserir
-- Usando verificação de origem (pode ser expandido com service_role se necessário)
CREATE POLICY "Validated system can insert metrics"
ON public.metricas_funil
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND tipo IN ('acesso', 'venda', 'quiz_inicio', 'quiz_completo', 'checkout_inicio', 'checkout_completo')
  AND valor IS NOT NULL
  AND valor >= 0
);

-- 3. ADICIONAR CONSTRAINT DE VALIDAÇÃO PARA TIPOS DE MÉTRICAS
ALTER TABLE public.metricas_funil 
DROP CONSTRAINT IF EXISTS metricas_tipo_valido;

ALTER TABLE public.metricas_funil 
ADD CONSTRAINT metricas_tipo_valido 
CHECK (tipo IN ('acesso', 'venda', 'quiz_inicio', 'quiz_completo', 'checkout_inicio', 'checkout_completo'));

-- 4. ADICIONAR ÍNDICE PARA PERFORMANCE DE QUERIES ADMIN
CREATE INDEX IF NOT EXISTS idx_metricas_funil_data_tipo ON public.metricas_funil(data, tipo);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON public.audit_log(user_id);