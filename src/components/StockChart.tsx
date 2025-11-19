import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StockChartProps {
  produtoId?: string;
}

export function StockChart({ produtoId }: StockChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [produtoId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Buscar vendas para calcular histórico de saída
      const vendasQuery = supabase
        .from('itens_venda')
        .select('created_at, quantidade, produto_id, produtos(nome)')
        .order('created_at', { ascending: true });

      if (produtoId) {
        vendasQuery.eq('produto_id', produtoId);
      }

      const { data: vendas } = await vendasQuery;

      // Buscar pedidos para calcular histórico de entrada
      const pedidosQuery = supabase
        .from('itens_pedido')
        .select('created_at, quantidade_pedida, produto_id, produtos(nome)')
        .order('created_at', { ascending: true });

      if (produtoId) {
        pedidosQuery.eq('produto_id', produtoId);
      }

      const { data: pedidos } = await pedidosQuery;

      // Agrupar por data
      const dataMap = new Map();

      vendas?.forEach((venda: any) => {
        const date = new Date(venda.created_at).toLocaleDateString('pt-BR');
        if (!dataMap.has(date)) {
          dataMap.set(date, { date, entradas: 0, saidas: 0 });
        }
        const entry = dataMap.get(date);
        entry.saidas += venda.quantidade;
      });

      pedidos?.forEach((pedido: any) => {
        const date = new Date(pedido.created_at).toLocaleDateString('pt-BR');
        if (!dataMap.has(date)) {
          dataMap.set(date, { date, entradas: 0, saidas: 0 });
        }
        const entry = dataMap.get(date);
        entry.entradas += pedido.quantidade_pedida;
      });

      const chartData = Array.from(dataMap.values()).slice(-30); // Últimos 30 dias
      setData(chartData);
    } catch (error) {
      console.error('Erro ao carregar dados do gráfico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entrada e Saída</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Entrada e Saída</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Sem dados para exibir</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Entrada e Saída</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="entradas" 
              stroke="hsl(var(--success))" 
              name="Entradas"
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="saidas" 
              stroke="hsl(var(--danger))" 
              name="Saídas"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
