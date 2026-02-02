-- Add policies to allow service role to manage OTP codes (edge functions use service role)
-- The mfa_otp_codes table needs INSERT policy for edge functions

-- Allow authenticated users to have OTP codes inserted on their behalf (via edge functions)
CREATE POLICY "Allow OTP code insertion for authenticated users"
  ON public.mfa_otp_codes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to have their trusted devices managed
CREATE POLICY "Allow trusted device management for authenticated users"
  ON public.trusted_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- Allow updates to OTP codes (marking as used)
CREATE POLICY "Allow OTP code updates"
  ON public.mfa_otp_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow deletion of old OTP codes
CREATE POLICY "Allow OTP code deletion"
  ON public.mfa_otp_codes FOR DELETE
  USING (auth.uid() = user_id);