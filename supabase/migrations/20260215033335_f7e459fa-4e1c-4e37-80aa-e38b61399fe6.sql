
-- Create consent_logs table for LGPD compliance
CREATE TABLE public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  consent_timestamp TIMESTAMPTZ NOT NULL,
  ip_address TEXT NOT NULL,
  terms_version TEXT NOT NULL DEFAULT '1.0',
  document_hash TEXT NOT NULL,
  user_agent TEXT,
  checkboxes_accepted JSONB NOT NULL DEFAULT '{}',
  scroll_completed BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMPTZ,
  email_resend_id TEXT,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX idx_consent_logs_user_id ON public.consent_logs(user_id);
CREATE INDEX idx_consent_logs_timestamp ON public.consent_logs(consent_timestamp);
CREATE INDEX idx_consent_logs_version ON public.consent_logs(terms_version);

-- Enable RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to consent_logs"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can view their own consent logs
CREATE POLICY "Users can view their own consent logs"
  ON public.consent_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own consent logs
CREATE POLICY "Users can insert their own consent logs"
  ON public.consent_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all consent logs
CREATE POLICY "Admins can view all consent logs"
  ON public.consent_logs FOR SELECT
  USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER consent_logs_updated_at
  BEFORE UPDATE ON public.consent_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add consent tracking columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_accepted_terms BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_version_accepted TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
