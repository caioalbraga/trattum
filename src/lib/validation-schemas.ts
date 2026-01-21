import { z } from 'zod';

// CPF validation (Brazilian tax ID)
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

// WhatsApp/phone validation (Brazilian format)
const phoneRegex = /^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$|^\d{10,11}$/;

// CEP validation (Brazilian postal code)
const cepRegex = /^\d{5}-?\d{3}$/;

// Profile form validation
export const profileSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
    .max(100, { message: 'Nome deve ter no máximo 100 caracteres' }),
  whatsapp: z
    .string()
    .trim()
    .regex(phoneRegex, { message: 'WhatsApp inválido. Use: (11) 99999-9999' })
    .or(z.literal('')),
  cpf: z
    .string()
    .trim()
    .regex(cpfRegex, { message: 'CPF inválido. Use: 000.000.000-00' })
    .or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

// Address form validation
export const enderecoSchema = z.object({
  cep: z
    .string()
    .trim()
    .regex(cepRegex, { message: 'CEP inválido. Use: 00000-000' })
    .or(z.literal('')),
  logradouro: z
    .string()
    .trim()
    .max(200, { message: 'Logradouro muito longo' }),
  numero: z
    .string()
    .trim()
    .max(20, { message: 'Número muito longo' }),
  complemento: z
    .string()
    .trim()
    .max(100, { message: 'Complemento muito longo' }),
  bairro: z
    .string()
    .trim()
    .max(100, { message: 'Bairro muito longo' }),
  cidade: z
    .string()
    .trim()
    .max(100, { message: 'Cidade muito longa' }),
  estado: z
    .string()
    .trim()
    .length(2, { message: 'Use sigla do estado (ex: SP)' })
    .toUpperCase()
    .or(z.literal('')),
});

export type EnderecoFormData = z.infer<typeof enderecoSchema>;

// Impediment note validation
export const impedimentNoteSchema = z.object({
  nota: z
    .string()
    .trim()
    .min(10, { message: 'A nota deve ter pelo menos 10 caracteres' })
    .max(1000, { message: 'A nota deve ter no máximo 1000 caracteres' }),
});

export type ImpedimentNoteData = z.infer<typeof impedimentNoteSchema>;

// Coupon code validation
export const couponCodeSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(3, { message: 'Código deve ter pelo menos 3 caracteres' })
    .max(30, { message: 'Código deve ter no máximo 30 caracteres' })
    .toUpperCase(),
  desconto_percentual: z
    .number()
    .min(1, { message: 'Desconto mínimo é 1%' })
    .max(100, { message: 'Desconto máximo é 100%' }),
  uso_maximo: z
    .number()
    .int()
    .positive({ message: 'Uso máximo deve ser positivo' })
    .nullable(),
});

export type CouponCodeData = z.infer<typeof couponCodeSchema>;
