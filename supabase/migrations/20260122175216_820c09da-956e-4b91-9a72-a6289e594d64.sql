-- Protect products table - only authenticated users can view
DROP POLICY IF EXISTS "Anyone can view active products" ON public.configuracoes_produtos;

CREATE POLICY "Authenticated users can view active products"
ON public.configuracoes_produtos
FOR SELECT
USING (ativo = true AND auth.uid() IS NOT NULL);

-- Remove direct coupon access for non-admins (coupons will be validated via edge function)
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON public.cupons;