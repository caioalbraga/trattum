-- Fix permissive RLS policy on metricas_funil
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "System can insert metrics" ON public.metricas_funil;

-- Create a more restrictive policy - only authenticated users or admins can insert
CREATE POLICY "Authenticated users can insert metrics"
ON public.metricas_funil
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);