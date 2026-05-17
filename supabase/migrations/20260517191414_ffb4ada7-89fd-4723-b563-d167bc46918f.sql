ALTER TABLE public.tratamentos
ADD COLUMN IF NOT EXISTS aprovado_por uuid,
ADD COLUMN IF NOT EXISTS aprovado_em timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_tratamentos_aprovado_por ON public.tratamentos(aprovado_por);