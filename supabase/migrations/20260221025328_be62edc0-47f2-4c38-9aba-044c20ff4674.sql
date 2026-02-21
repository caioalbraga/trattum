-- Drop the restrictive policy that blocks anonymous users
DROP POLICY IF EXISTS "Authenticated users can view active products" ON public.configuracoes_produtos;
