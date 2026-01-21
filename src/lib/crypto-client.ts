import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type TableName = 'profiles' | 'enderecos';

interface EncryptResponse {
  encryptedData: Record<string, any>;
  error?: string;
}

interface DecryptResponse {
  decryptedData: Record<string, any>;
  error?: string;
}

interface DecryptBatchResponse {
  decryptedBatch: Record<string, any>[];
  error?: string;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

/**
 * Encrypt sensitive fields before saving to database
 */
export async function encryptData<T extends Record<string, any>>(
  table: TableName,
  data: T
): Promise<T> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/encrypt-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ table, data }),
    });

    if (!response.ok) {
      console.error('Encryption failed:', await response.text());
      return data; // Return original data if encryption fails
    }

    const result: EncryptResponse = await response.json();
    if (result.error) {
      console.error('Encryption error:', result.error);
      return data;
    }

    return result.encryptedData as T;
  } catch (error) {
    console.error('Encryption request failed:', error);
    return data; // Return original data on network errors
  }
}

/**
 * Decrypt sensitive fields after reading from database
 */
export async function decryptData<T extends Record<string, any>>(
  table: TableName,
  data: T | null
): Promise<T | null> {
  if (!data) return null;

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/decrypt-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ table, data }),
    });

    if (!response.ok) {
      console.error('Decryption failed:', await response.text());
      return data;
    }

    const result: DecryptResponse = await response.json();
    if (result.error) {
      console.error('Decryption error:', result.error);
      return data;
    }

    return result.decryptedData as T;
  } catch (error) {
    console.error('Decryption request failed:', error);
    return data;
  }
}

/**
 * Decrypt a batch of records (for admin views)
 */
export async function decryptBatch<T extends Record<string, any>>(
  table: TableName,
  batch: T[]
): Promise<T[]> {
  if (!batch || batch.length === 0) return [];

  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${SUPABASE_URL}/functions/v1/decrypt-data`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ table, batch }),
    });

    if (!response.ok) {
      console.error('Batch decryption failed:', await response.text());
      return batch;
    }

    const result: DecryptBatchResponse = await response.json();
    if (result.error) {
      console.error('Batch decryption error:', result.error);
      return batch;
    }

    return result.decryptedBatch as T[];
  } catch (error) {
    console.error('Batch decryption request failed:', error);
    return batch;
  }
}

// Type-specific helpers for better DX
export interface ProfileEncryptedFields {
  nome?: string;
  cpf?: string;
  whatsapp?: string;
}

export interface EnderecoEncryptedFields {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
}

export const encryptProfile = (data: ProfileEncryptedFields) => 
  encryptData('profiles', data);

export const decryptProfile = <T extends ProfileEncryptedFields>(data: T | null) => 
  decryptData('profiles', data);

export const decryptProfiles = <T extends ProfileEncryptedFields>(batch: T[]) => 
  decryptBatch('profiles', batch);

export const encryptEndereco = (data: EnderecoEncryptedFields) => 
  encryptData('enderecos', data);

export const decryptEndereco = <T extends EnderecoEncryptedFields>(data: T | null) => 
  decryptData('enderecos', data);

export const decryptEnderecos = <T extends EnderecoEncryptedFields>(batch: T[]) => 
  decryptBatch('enderecos', batch);
