ALTER TABLE public.tratamentos
DROP CONSTRAINT IF EXISTS tratamentos_status_check;

ALTER TABLE public.tratamentos
ADD CONSTRAINT tratamentos_status_check
CHECK (
  status = ANY (
    ARRAY[
      'nenhum'::text,
      'em_analise'::text,
      'aprovado'::text,
      'processamento'::text,
      'enviado'::text,
      'entregue'::text,
      'em_andamento'::text,
      'ativo'::text,
      'pausado'::text,
      'concluido'::text
    ]
  )
);

WITH latest_evaluations AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    status,
    created_at
  FROM public.avaliacoes
  ORDER BY user_id, created_at DESC
)
UPDATE public.tratamentos AS t
SET status = CASE
    WHEN t.status = 'ativo' THEN 'em_andamento'
    WHEN COALESCE(t.status, 'nenhum') = 'nenhum' AND le.status IN ('pendente', 'ajuste') THEN 'em_analise'
    WHEN COALESCE(t.status, 'nenhum') = 'nenhum' AND le.status = 'aprovado' THEN 'aprovado'
    ELSE t.status
  END,
  plano = CASE
    WHEN COALESCE(t.status, 'nenhum') = 'nenhum' AND le.status = 'aprovado' AND t.plano IS NULL THEN 'Protocolo de Gerenciamento Metabólico'
    ELSE t.plano
  END,
  updated_at = now()
FROM latest_evaluations le
WHERE t.user_id = le.user_id
  AND (
    t.status = 'ativo'
    OR (COALESCE(t.status, 'nenhum') = 'nenhum' AND le.status IN ('pendente', 'ajuste', 'aprovado'))
  );

WITH latest_evaluations AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    status,
    created_at
  FROM public.avaliacoes
  ORDER BY user_id, created_at DESC
)
INSERT INTO public.tratamentos (user_id, status, plano)
SELECT
  le.user_id,
  CASE
    WHEN le.status IN ('pendente', 'ajuste') THEN 'em_analise'
    WHEN le.status = 'aprovado' THEN 'aprovado'
    ELSE 'nenhum'
  END,
  CASE
    WHEN le.status = 'aprovado' THEN 'Protocolo de Gerenciamento Metabólico'
    ELSE NULL
  END
FROM latest_evaluations le
LEFT JOIN public.tratamentos t ON t.user_id = le.user_id
WHERE t.user_id IS NULL
  AND le.status IN ('pendente', 'ajuste', 'aprovado');