-- ============================================
-- SISTEMA SÓ BUJIGANGAS - AJUSTES DE ESTRUTURA
-- ============================================

-- 1. AJUSTAR TABELA PROFILES
-- Adicionar flag senha_temporaria e ajustar permissões
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_tipo_acesso_check;

-- Recriar com valores corretos
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_access_type_new') THEN
    CREATE TYPE user_access_type_new AS ENUM ('admin', 'comum');
  END IF;
END $$;

-- 2. AJUSTAR TABELA PRODUTOS
-- Garantir que markup é calculado automaticamente
ALTER TABLE public.produtos 
  ALTER COLUMN markup DROP NOT NULL;

-- Trigger para calcular markup e valor_venda automaticamente
CREATE OR REPLACE FUNCTION public.calculate_product_values()
RETURNS TRIGGER AS $$
BEGIN
  -- Calcular markup: ((valor_venda - valor_unitario) / valor_unitario) * 100
  IF NEW.valor_venda IS NOT NULL AND NEW.valor_unitario IS NOT NULL AND NEW.valor_unitario > 0 THEN
    NEW.markup := ((NEW.valor_venda - NEW.valor_unitario) / NEW.valor_unitario) * 100;
  END IF;
  
  -- Se informar markup e valor_unitario, calcular valor_venda
  IF NEW.markup IS NOT NULL AND NEW.valor_unitario IS NOT NULL AND NEW.valor_venda IS NULL THEN
    NEW.valor_venda := NEW.valor_unitario * (1 + NEW.markup / 100);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_product_values ON public.produtos;
CREATE TRIGGER trigger_calculate_product_values
  BEFORE INSERT OR UPDATE ON public.produtos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_product_values();

-- 3. AJUSTAR TABELA PEDIDOS
-- Adicionar campo numero_pedido se não existir e função de geração
CREATE OR REPLACE FUNCTION public.calculate_order_alert_color(
  data_criacao DATE,
  prazo_entrega_dias INTEGER
)
RETURNS alert_color AS $$
DECLARE
  dias_decorridos INTEGER;
  data_prevista DATE;
BEGIN
  data_prevista := data_criacao + prazo_entrega_dias;
  dias_decorridos := CURRENT_DATE - data_criacao;
  
  -- Primeiro dia = Verde
  IF dias_decorridos = 0 THEN
    RETURN 'verde'::alert_color;
  -- Último e penúltimo dia = Vermelho
  ELSIF dias_decorridos >= prazo_entrega_dias - 1 THEN
    RETURN 'vermelho'::alert_color;
  -- Dias intermediários = Amarelo
  ELSE
    RETURN 'amarelo'::alert_color;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger para calcular cor de alerta automaticamente
CREATE OR REPLACE FUNCTION public.set_order_alert_color()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cor_alerta := calculate_order_alert_color(NEW.data_criacao, NEW.prazo_entrega_dias);
  NEW.data_prevista_entrega := NEW.data_criacao + NEW.prazo_entrega_dias;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_alert_color ON public.pedidos;
CREATE TRIGGER trigger_set_order_alert_color
  BEFORE INSERT OR UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_alert_color();

-- 4. FUNÇÃO PARA ATUALIZAR ESTOQUE APÓS VENDA
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Subtrai a quantidade vendida do estoque (permite negativo)
  UPDATE public.produtos 
  SET estoque_atual = estoque_atual - NEW.quantidade
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_after_sale ON public.itens_venda;
CREATE TRIGGER trigger_update_stock_after_sale
  AFTER INSERT ON public.itens_venda
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stock_after_sale();

-- 5. FUNÇÃO PARA VERIFICAR EXCLUSÃO DE PEDIDO (apenas no mesmo dia)
CREATE OR REPLACE FUNCTION public.check_order_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.data_criacao < CURRENT_DATE THEN
    RAISE EXCEPTION 'Pedidos só podem ser excluídos no mesmo dia de criação';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_order_deletion ON public.pedidos;
CREATE TRIGGER trigger_check_order_deletion
  BEFORE DELETE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_deletion();

-- 6. ATUALIZAR RLS POLICIES PARA ADMIN MASTER
-- Policy para permitir admin master gerenciar todos os usuários
DROP POLICY IF EXISTS "Admin master can manage all profiles" ON public.profiles;
CREATE POLICY "Admin master can manage all profiles"
ON public.profiles
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE email = 'ramonmatos390@gmail.com'
  )
);

-- Policy para permitir admin master visualizar todos os perfis
DROP POLICY IF EXISTS "Admin master can view all profiles" ON public.profiles;
CREATE POLICY "Admin master can view all profiles"
ON public.profiles
FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM public.profiles 
    WHERE email = 'ramonmatos390@gmail.com'
  )
);

-- 7. INSERIR SEED INICIAL (Admin Master e Usuário Comum)
-- Nota: A inserção dos usuários será feita via Edge Function após a migration