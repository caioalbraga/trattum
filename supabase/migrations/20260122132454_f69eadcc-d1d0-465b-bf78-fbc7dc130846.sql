-- Add SELECT policy for admins to view all treatments
CREATE POLICY "Admins can view all treatments"
ON public.tratamentos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));