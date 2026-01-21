import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const keyBase64 = Deno.env.get("ENCRYPTION_KEY");
  if (!keyBase64) {
    throw new Error("ENCRYPTION_KEY not configured");
  }
  
  // Decode base64 key
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  
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
