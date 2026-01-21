-- Add policy for admins to view all profiles (needed for clinical triage workflow)
-- This allows admins to see patient names and contact info in the AdminInbox
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));