-- ============================================
-- CORREÇÃO DE SEGURANÇA: Function Search Path
-- ============================================

-- Corrigir todas as funções para ter search_path definido

CREATE OR REPLACE FUNCTION public.calculate_product_values()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.calculate_order_alert_color(
  data_criacao DATE,
  prazo_entrega_dias INTEGER
)
RETURNS alert_color 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.set_order_alert_color()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.cor_alerta := calculate_order_alert_color(NEW.data_criacao, NEW.prazo_entrega_dias);
  NEW.data_prevista_entrega := NEW.data_criacao + NEW.prazo_entrega_dias;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Subtrai a quantidade vendida do estoque (permite negativo)
  UPDATE public.produtos 
  SET estoque_atual = estoque_atual - NEW.quantidade
  WHERE id = NEW.produto_id;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_order_deletion()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.data_criacao < CURRENT_DATE THEN
    RAISE EXCEPTION 'Pedidos só podem ser excluídos no mesmo dia de criação';
  END IF;
  RETURN OLD;
END;
$$;

-- Corrigir funções existentes também
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_product_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;