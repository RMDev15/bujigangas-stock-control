import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    loadOrders();
  }, [user, navigate]);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('pedidos')
      .select('*')
      .order('data_criacao', { ascending: false });

    setOrders(data || []);
  };

  const getAlertColor = (corAlerta: string) => {
    switch (corAlerta) {
      case 'verde': return 'bg-success';
      case 'amarelo': return 'bg-warning';
      case 'vermelho': return 'bg-danger';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Pedidos</h1>
        </div>
      </header>

      <div className="container mx-auto p-8">
        <Card className="bg-primary p-8">
          <h2 className="text-xl text-primary-foreground text-center mb-6">
            Selecione o pedido para visualizar ou editar
          </h2>

          <div className="bg-card rounded-lg p-6">
            <div className="grid grid-cols-7 gap-4 mb-4 font-semibold text-center">
              <div>Pedido</div>
              <div>Data</div>
              <div>Status</div>
              <div>Alerta</div>
              <div>Abaixar</div>
              <div>Excluir</div>
            </div>

            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-7 gap-4 p-3 hover:bg-muted rounded cursor-pointer text-center items-center"
              >
                <div>{order.numero_pedido}</div>
                <div>{new Date(order.data_criacao).toLocaleDateString()}</div>
                <div className="capitalize">{order.status}</div>
                <div>
                  <div className={`h-6 ${getAlertColor(order.cor_alerta)} rounded`}></div>
                </div>
                <div>
                  <Button size="sm" variant="outline">📄</Button>
                </div>
                <div>
                  <Button size="sm" variant="destructive">🗑️</Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-6 justify-center">
            <Button onClick={() => navigate('/pedidos/novo')} className="bg-accent">
              Realizar Novo Pedido
            </Button>
            <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
