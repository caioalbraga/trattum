-- Tornar bucket de fotos da anamnese privado
UPDATE storage.buckets SET public = false WHERE id = 'anamnese-fotos';

-- Permitir leitura por equipe clínica (medico, assistente, nutricionista)
-- Policies existentes (owner pode ver as próprias; admin pode ver todas) permanecem.
CREATE POLICY "Clinical staff can view all anamnese photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anamnese-fotos'
  AND (
    public.has_role(auth.uid(), 'medico'::public.app_role)
    OR public.has_role(auth.uid(), 'assistente'::public.app_role)
    OR public.has_role(auth.uid(), 'nutricionista'::public.app_role)
  )
);