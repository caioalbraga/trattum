import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Validate JWT and return user ID
async function validateAuth(req: Request): Promise<{ userId: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  
  if (error || !data?.claims?.sub) {
    return null;
  }

  return { userId: data.claims.sub as string };
}

// AES-256-GCM encryption
async function encrypt(text: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );
  
  // Combine IV + encrypted data and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

async function getKey(): Promise<CryptoKey> {
  const keyRaw = Deno.env.get("ENCRYPTION_KEY");
  if (!keyRaw) {
    throw new Error("ENCRYPTION_KEY not configured");
  }

  let keyBytes: Uint8Array;

  try {
    keyBytes = Uint8Array.from(atob(keyRaw), c => c.charCodeAt(0));
  } catch {
    keyBytes = new TextEncoder().encode(keyRaw);
  }

  if (keyBytes.length !== 32) {
    const hash = await crypto.subtle.digest("SHA-256", keyBytes);
    keyBytes = new Uint8Array(hash);
  }

  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );
}

// Fields to encrypt per table
const encryptableFields: Record<string, string[]> = {
  profiles: ["nome", "cpf", "whatsapp"],
  enderecos: ["cep", "logradouro", "numero", "complemento", "bairro", "cidade"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authentication
    const auth = await validateAuth(req);
    if (!auth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { table, data } = await req.json();
    
    if (!table || !data) {
      return new Response(
        JSON.stringify({ error: "Missing table or data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fields = encryptableFields[table];
    if (!fields) {
      return new Response(
        JSON.stringify({ error: `Unknown table: ${table}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const key = await getKey();
    const encryptedData: Record<string, any> = { ...data };

    for (const field of fields) {
      if (data[field] && typeof data[field] === "string" && data[field].trim() !== "") {
        encryptedData[field] = await encrypt(data[field], key);
      }
    }

    return new Response(
      JSON.stringify({ encryptedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Encryption error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
