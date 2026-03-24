
-- Create mensagens_acompanhamento table for doctor-patient chat
CREATE TABLE IF NOT EXISTS public.mensagens_acompanhamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  autor text NOT NULL CHECK (autor IN ('medico', 'paciente')),
  mensagem text,
  imagem_url text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mensagens_acompanhamento ENABLE ROW LEVEL SECURITY;

-- RLS: patients see only their own messages
CREATE POLICY "Users can view their own messages"
  ON public.mensagens_acompanhamento FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: patients can insert their own messages as 'paciente'
CREATE POLICY "Users can insert their own messages"
  ON public.mensagens_acompanhamento FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND autor = 'paciente');

-- RLS: patients can update their own messages (mark as read)
CREATE POLICY "Users can update their own messages"
  ON public.mensagens_acompanhamento FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS: admin full access
CREATE POLICY "Admins can manage all messages"
  ON public.mensagens_acompanhamento FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: medico full access
CREATE POLICY "Medicos can manage all messages"
  ON public.mensagens_acompanhamento FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'medico'::app_role));

-- RLS: deny anonymous
CREATE POLICY "Deny anonymous access"
  ON public.mensagens_acompanhamento FOR SELECT
  TO public
  USING (auth.uid() IS NOT NULL);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_acompanhamento;

-- Add tipo_ajuste column to ajustes_clinicos if not exists
ALTER TABLE public.ajustes_clinicos ADD COLUMN IF NOT EXISTS tipo_ajuste text DEFAULT 'anamnese';
ALTER TABLE public.ajustes_clinicos ADD COLUMN IF NOT EXISTS campos_ajuste jsonb DEFAULT '[]'::jsonb;
