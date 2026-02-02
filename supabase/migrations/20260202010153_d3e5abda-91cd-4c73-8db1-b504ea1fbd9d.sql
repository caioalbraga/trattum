-- Create table for trusted devices (7-day trust window)
CREATE TABLE public.trusted_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  trusted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user MFA settings
CREATE TABLE public.mfa_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  preferred_method TEXT DEFAULT 'email', -- 'email' or 'totp'
  totp_secret TEXT, -- encrypted TOTP secret for authenticator apps
  totp_verified BOOLEAN DEFAULT false,
  backup_codes TEXT[], -- encrypted backup codes
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for pending OTP codes
CREATE TABLE public.mfa_otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_otp_codes ENABLE ROW LEVEL SECURITY;

-- Policies for trusted_devices
CREATE POLICY "Users can view their own trusted devices"
  ON public.trusted_devices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own trusted devices"
  ON public.trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own trusted devices"
  ON public.trusted_devices FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own trusted devices"
  ON public.trusted_devices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to trusted_devices"
  ON public.trusted_devices FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies for mfa_settings
CREATE POLICY "Users can view their own MFA settings"
  ON public.mfa_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own MFA settings"
  ON public.mfa_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own MFA settings"
  ON public.mfa_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to mfa_settings"
  ON public.mfa_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policies for mfa_otp_codes (only system can manage, users verify via edge function)
CREATE POLICY "Users can view their own OTP codes"
  ON public.mfa_otp_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Deny anonymous access to mfa_otp_codes"
  ON public.mfa_otp_codes FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX idx_trusted_devices_fingerprint ON public.trusted_devices(device_fingerprint);
CREATE INDEX idx_trusted_devices_expires ON public.trusted_devices(expires_at);
CREATE INDEX idx_mfa_settings_user_id ON public.mfa_settings(user_id);
CREATE INDEX idx_mfa_otp_codes_user_id ON public.mfa_otp_codes(user_id);
CREATE INDEX idx_mfa_otp_codes_expires ON public.mfa_otp_codes(expires_at);

-- Trigger to update updated_at on mfa_settings
CREATE TRIGGER update_mfa_settings_updated_at
  BEFORE UPDATE ON public.mfa_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to clean up expired OTP codes and trusted devices
CREATE OR REPLACE FUNCTION public.cleanup_expired_mfa_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete expired OTP codes
  DELETE FROM public.mfa_otp_codes WHERE expires_at < now();
  
  -- Delete expired trusted devices
  DELETE FROM public.trusted_devices WHERE expires_at < now();
END;
$$;