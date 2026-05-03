-- Tabela para registrar tentativas de anamnese inelegíveis
CREATE TABLE public.inelegibilidade_tentativas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  motivo text NOT NULL,
  idade integer,
  imc numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.inelegibilidade_tentativas ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer visitante (autenticado ou não) registre uma tentativa
CREATE POLICY "Anyone can log ineligibility attempt"
ON public.inelegibilidade_tentativas
FOR INSERT
TO anon, authenticated
WITH CHECK (motivo IN ('idade_minima','idade_maxima','imc_minimo'));

-- Apenas admins podem visualizar
CREATE POLICY "Admins can view all ineligibility attempts"
ON public.inelegibilidade_tentativas
FOR SELECT
TO authenticated
USING (is_admin());