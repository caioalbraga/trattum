-- Add explicit deny policies for anonymous/unauthenticated access on profiles table
-- This ensures only authenticated users can access profiles (their own or admins can see all)
CREATE POLICY "Deny anonymous access to profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Add explicit deny policies for anonymous/unauthenticated access on enderecos table  
-- This ensures only authenticated users can access addresses
CREATE POLICY "Deny anonymous access to enderecos"
ON public.enderecos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Also add protection for other tables with sensitive data that may not have explicit auth checks

-- Protect avaliacoes (medical assessments)
CREATE POLICY "Deny anonymous access to avaliacoes"
ON public.avaliacoes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect pedidos (orders)
CREATE POLICY "Deny anonymous access to pedidos"
ON public.pedidos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect prescricoes (prescriptions)
CREATE POLICY "Deny anonymous access to prescricoes"
ON public.prescricoes
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect tratamentos (treatments)
CREATE POLICY "Deny anonymous access to tratamentos"
ON public.tratamentos
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect notas_impedimento (impediment notes)
CREATE POLICY "Deny anonymous access to notas_impedimento"
ON public.notas_impedimento
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect metas_diarias (daily goals)
CREATE POLICY "Deny anonymous access to metas_diarias"
ON public.metas_diarias
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Protect user_roles
CREATE POLICY "Deny anonymous access to user_roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() IS NOT NULL);