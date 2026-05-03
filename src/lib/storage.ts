import { supabase } from "@/integrations/supabase/client";

const BUCKET = "anamnese-fotos";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutos
const CACHE_TTL_MS = 4 * 60 * 1000; // 4 minutos

type CacheEntry = { url: string; expiresAt: number };
const cache = new Map<string, CacheEntry>();

/**
 * Extrai o path interno do bucket a partir de uma URL pública antiga
 * (ex: https://<proj>.supabase.co/storage/v1/object/public/anamnese-fotos/<path>)
 * ou retorna a string como path se já for um path.
 */
function extractPath(input: string): string | null {
  if (!input) return null;
  const marker = `/${BUCKET}/`;
  const idx = input.indexOf(marker);
  if (idx >= 0) {
    return input.substring(idx + marker.length).split("?")[0];
  }
  // Já é um path tipo "userId/foto-x.jpg"
  if (!input.startsWith("http")) return input;
  return null;
}

/**
 * Gera (ou retorna do cache) uma signed URL de curta duração
 * para uma foto da anamnese armazenada no bucket privado.
 */
export async function getSignedPhotoUrl(urlOrPath: string): Promise<string | null> {
  const path = extractPath(urlOrPath);
  if (!path) return null;

  const now = Date.now();
  const cached = cache.get(path);
  if (cached && cached.expiresAt > now) {
    return cached.url;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    console.error("getSignedPhotoUrl error:", error);
    return null;
  }

  cache.set(path, { url: data.signedUrl, expiresAt: now + CACHE_TTL_MS });
  return data.signedUrl;
}
