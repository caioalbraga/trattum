-- Allow anonymous/public access to active products (price display)
CREATE POLICY "Anyone can view active products"
ON public.configuracoes_produtos
FOR SELECT
USING (ativo = true);
