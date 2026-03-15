
-- Create storage bucket for anamnese photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('anamnese-fotos', 'anamnese-fotos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: Users can upload their own photos
CREATE POLICY "Users can upload own anamnese photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'anamnese-fotos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Users can view their own photos
CREATE POLICY "Users can view own anamnese photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anamnese-fotos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Admins can view all anamnese photos
CREATE POLICY "Admins can view all anamnese photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'anamnese-fotos' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);
