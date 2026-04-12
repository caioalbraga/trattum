
CREATE TABLE IF NOT EXISTS public.user_consents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  termo text NOT NULL,
  aceito boolean NOT NULL DEFAULT true,
  aceito_em timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own consents"
  ON public.user_consents FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Medicos can view all consents"
  ON public.user_consents FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'medico'::app_role));

CREATE UNIQUE INDEX idx_user_consents_unique ON public.user_consents (user_id, termo);
