-- Allow users to update their own legacy orders (e.g. status pendente -> pago in checkout)
CREATE POLICY "Users can update their own orders"
  ON public.pedidos_legacy
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Backfill: mark the stuck order as paid; trigger will create operational pedido
UPDATE public.pedidos_legacy
SET status = 'pago'
WHERE id = '99d6a407-414a-4252-8c9b-f7dafb89b736'
  AND status = 'pendente';