
-- Add new roles to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'medico';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'assistente';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'nutricionista';
