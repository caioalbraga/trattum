-- Drop the overly permissive public coupon policy
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.cupons;

-- Create a new policy that requires authentication to view active coupons
CREATE POLICY "Authenticated users can view active coupons"
ON public.cupons
FOR SELECT
USING (ativo = true AND auth.uid() IS NOT NULL);