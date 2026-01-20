-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create avaliacoes (assessments/evaluations) table for quiz responses
CREATE TABLE public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    respostas JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'bloqueado', 'em_revisao')),
    imc NUMERIC,
    score_risco INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own assessments"
ON public.avaliacoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
ON public.avaliacoes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all assessments"
ON public.avaliacoes
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all assessments"
ON public.avaliacoes
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create prescriptions table
CREATE TABLE public.prescricoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
    tratamento TEXT NOT NULL,
    dosagem TEXT,
    observacoes TEXT,
    aprovado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prescricoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own prescriptions"
ON public.prescricoes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all prescriptions"
ON public.prescricoes
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create impediment notes table
CREATE TABLE public.notas_impedimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    avaliacao_id UUID REFERENCES public.avaliacoes(id) ON DELETE CASCADE,
    nota TEXT NOT NULL,
    criado_por UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notas_impedimento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own impediment notes"
ON public.notas_impedimento
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all impediment notes"
ON public.notas_impedimento
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create product settings table for dynamic pricing
CREATE TABLE public.configuracoes_produtos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    preco NUMERIC NOT NULL,
    preco_original NUMERIC,
    ativo BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.configuracoes_produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products"
ON public.configuracoes_produtos
FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins can manage products"
ON public.configuracoes_produtos
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create coupons table
CREATE TABLE public.cupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo TEXT NOT NULL UNIQUE,
    desconto_percentual INTEGER NOT NULL CHECK (desconto_percentual > 0 AND desconto_percentual <= 100),
    ativo BOOLEAN NOT NULL DEFAULT true,
    validade TIMESTAMP WITH TIME ZONE,
    uso_maximo INTEGER,
    uso_atual INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons"
ON public.cupons
FOR SELECT
USING (ativo = true);

CREATE POLICY "Admins can manage coupons"
ON public.cupons
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create analytics/metrics table for tracking
CREATE TABLE public.metricas_funil (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL CHECK (tipo IN ('acesso_quiz', 'conclusao_quiz', 'venda')),
    valor NUMERIC,
    data DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.metricas_funil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view metrics"
ON public.metricas_funil
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert metrics"
ON public.metricas_funil
FOR INSERT
WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_avaliacoes_updated_at
BEFORE UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_configuracoes_produtos_updated_at
BEFORE UPDATE ON public.configuracoes_produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default products
INSERT INTO public.configuracoes_produtos (nome, preco, preco_original) VALUES
('Wegovy 0.25mg', 799.00, 999.00),
('Wegovy 0.5mg', 899.00, 1099.00),
('Wegovy 1.0mg', 999.00, 1199.00),
('Ozempic 0.25mg', 699.00, 899.00),
('Ozempic 0.5mg', 799.00, 999.00);

-- Insert default coupon
INSERT INTO public.cupons (codigo, desconto_percentual, ativo) VALUES
('TRATTUM30', 30, true);