
-- Create documentos table for storing generated prescriptions and instructions
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  avaliacao_id UUID REFERENCES public.avaliacoes(id),
  tipo TEXT NOT NULL DEFAULT 'receita_instrucoes',
  titulo TEXT NOT NULL,
  conteudo JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;

-- Users can only view their own documents
CREATE POLICY "Users can view their own documents"
ON public.documentos FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all documents
CREATE POLICY "Admins can view all documents"
ON public.documentos FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert documents
CREATE POLICY "Admins can insert documents"
ON public.documentos FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can update documents
CREATE POLICY "Admins can update documents"
ON public.documentos FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to documentos"
ON public.documentos FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_documentos_updated_at
BEFORE UPDATE ON public.documentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
