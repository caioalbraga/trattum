-- Add theme preference column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tema_preferencia text DEFAULT 'system' CHECK (tema_preferencia IN ('light', 'dark', 'system'));