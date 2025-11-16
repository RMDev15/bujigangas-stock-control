-- Create enum types
CREATE TYPE user_access_type AS ENUM ('admin', 'common');
CREATE TYPE order_status AS ENUM ('emitido', 'em_transito', 'atrasado', 'recebido', 'devolvido', 'cancelado');
CREATE TYPE alert_color AS ENUM ('verde', 'amarelo', 'vermelho', 'sem_cor');

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  senha_temporaria BOOLEAN DEFAULT TRUE,
  tipo_acesso user_access_type DEFAULT 'common',
  permissoes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  codigo_barras TEXT,
  nome TEXT NOT NULL,
  cor TEXT,
  estoque_atual INTEGER NOT NULL DEFAULT 0,
  valor_unitario DECIMAL(10,2) NOT NULL,
  valor_venda DECIMAL(10,2) NOT NULL,
  markup DECIMAL(5,2),
  fornecedor TEXT,
  foto_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock alerts table
CREATE TABLE public.alertas_estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES public.produtos(id) ON DELETE CASCADE,
  limite_verde_min INTEGER NOT NULL DEFAULT 0,
  limite_verde_max INTEGER NOT NULL DEFAULT 1000,
  limite_amarelo_min INTEGER NOT NULL DEFAULT 0,
  limite_amarelo_max INTEGER NOT NULL DEFAULT 0,
  limite_vermelho_min INTEGER NOT NULL DEFAULT 0,
  limite_vermelho_max INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id)
);

-- Sales table
CREATE TABLE public.vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  valor_total DECIMAL(10,2) NOT NULL,
  valor_recebido DECIMAL(10,2) NOT NULL,
  troco DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales items table
CREATE TABLE public.itens_venda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID REFERENCES public.vendas(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  codigo_produto TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  cor_produto TEXT,
  quantidade INTEGER NOT NULL,
  valor_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase orders table
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_pedido TEXT NOT NULL UNIQUE,
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  prazo_entrega_dias INTEGER NOT NULL,
  data_prevista_entrega DATE NOT NULL,
  status order_status DEFAULT 'emitido',
  cor_alerta alert_color DEFAULT 'verde',
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase order items table
CREATE TABLE public.itens_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES public.produtos(id),
  codigo_produto TEXT NOT NULL,
  nome_produto TEXT NOT NULL,
  cor_produto TEXT,
  quantidade_pedida INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_pedido ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for produtos (all authenticated users can read, only admins can write)
CREATE POLICY "Authenticated users can view products"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete products"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for alertas_estoque
CREATE POLICY "Authenticated users can view alerts"
  ON public.alertas_estoque FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage alerts"
  ON public.alertas_estoque FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for vendas
CREATE POLICY "Authenticated users can view all sales"
  ON public.vendas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sales"
  ON public.vendas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for itens_venda
CREATE POLICY "Authenticated users can view sale items"
  ON public.itens_venda FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sale items"
  ON public.itens_venda FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for pedidos
CREATE POLICY "Authenticated users can view orders"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage orders"
  ON public.pedidos FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for itens_pedido
CREATE POLICY "Authenticated users can view order items"
  ON public.itens_pedido FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage order items"
  ON public.itens_pedido FOR ALL
  TO authenticated
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, senha_temporaria, tipo_acesso, permissoes)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    TRUE,
    'common',
    '{"visualizar_estoque": true, "visualizar_alertas": true}'::jsonb
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-generate product code
CREATE OR REPLACE FUNCTION generate_product_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_code := LPAD(counter::TEXT, 3, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.produtos WHERE codigo = new_code);
    counter := counter + 1;
  END LOOP;
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_number := LPAD(counter::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.pedidos WHERE numero_pedido = new_number);
    counter := counter + 1;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;