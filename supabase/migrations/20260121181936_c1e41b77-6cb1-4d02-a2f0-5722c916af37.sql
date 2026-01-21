-- Add policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.pedidos
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add policy for admins to update orders (for status management)
CREATE POLICY "Admins can update orders"
ON public.pedidos
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));