ALTER TABLE public.avaliacoes DROP CONSTRAINT avaliacoes_status_check;

ALTER TABLE public.avaliacoes ADD CONSTRAINT avaliacoes_status_check 
  CHECK (status = ANY (ARRAY['pendente', 'aprovado', 'bloqueado', 'em_revisao', 'ajuste', 'rejeitado']));