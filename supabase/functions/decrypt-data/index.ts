import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption
async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  } catch {
    // If decryption fails, return original value (might not be encrypted)
    return encryptedBase64;
  }
}

async function getKey(): Promise<CryptoKey> {
  const keyBase64 = Deno.env.get("ENCRYPTION_KEY");
  if (!keyBase64) {
    throw new Error("ENCRYPTION_KEY not configured");
  }
  
  const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
  
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

// Fields to decrypt per table
const encryptableFields: Record<string, string[]> = {
  profiles: ["nome", "cpf", "whatsapp"],
  enderecos: ["cep", "logradouro", "numero", "complemento", "bairro", "cidade"],
};

// Check if a string looks like it might be encrypted (base64 with sufficient length)
function looksEncrypted(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  // Encrypted values are base64 and at least 28 chars (12 byte IV + 16 byte min ciphertext)
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return value.length >= 28 && base64Regex.test(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { table, data, batch } = await req.json();
    
    if (!table || (!data && !batch)) {
      return new Response(
        JSON.stringify({ error: "Missing table or data/batch" }),
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

    // Handle batch decryption
    if (batch && Array.isArray(batch)) {
      const decryptedBatch = await Promise.all(
        batch.map(async (item: Record<string, any>) => {
          const decryptedItem: Record<string, any> = { ...item };
          for (const field of fields) {
            if (item[field] && looksEncrypted(item[field])) {
              decryptedItem[field] = await decrypt(item[field], key);
            }
          }
          return decryptedItem;
        })
      );

      return new Response(
        JSON.stringify({ decryptedBatch }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle single record decryption
    const decryptedData: Record<string, any> = { ...data };
    for (const field of fields) {
      if (data[field] && looksEncrypted(data[field])) {
        decryptedData[field] = await decrypt(data[field], key);
      }
    }

    return new Response(
      JSON.stringify({ decryptedData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Decryption error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
