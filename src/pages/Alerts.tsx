import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Search } from 'lucide-react';

interface ProductWithAlert {
  id: string;
  codigo: string;
  nome: string;
  estoque_atual: number;
  alertLevel: 'verde' | 'amarelo' | 'vermelho';
  alertas_estoque?: any;
}

export default function Alerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductWithAlert[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithAlert | null>(null);
  const [limites, setLimites] = useState({
    verde_min: '501',
    verde_max: '1000',
    amarelo_min: '201',
    amarelo_max: '500',
    vermelho_min: '0',
    vermelho_max: '200',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    loadProducts();
  }, [user, navigate]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('*, alertas_estoque(*)');

    if (data) {
      const productsWithAlerts = data.map((product) => {
        const alert = product.alertas_estoque?.[0];
        let alertLevel: 'verde' | 'amarelo' | 'vermelho' = 'verde';

        if (alert) {
          if (
            product.estoque_atual >= alert.limite_vermelho_min &&
            product.estoque_atual <= alert.limite_vermelho_max
          ) {
            alertLevel = 'vermelho';
          } else if (
            product.estoque_atual >= alert.limite_amarelo_min &&
            product.estoque_atual <= alert.limite_amarelo_max
          ) {
            alertLevel = 'amarelo';
          }
        }

        return {
          ...product,
          alertLevel,
        };
      });

      setProducts(productsWithAlerts);
    }
  };

  const handleSaveAlert = async () => {
    if (!selectedProduct) return;

    try {
      const alertData = {
        produto_id: selectedProduct.id,
        limite_verde_min: parseInt(limites.verde_min),
        limite_verde_max: parseInt(limites.verde_max),
        limite_amarelo_min: parseInt(limites.amarelo_min),
        limite_amarelo_max: parseInt(limites.amarelo_max),
        limite_vermelho_min: parseInt(limites.vermelho_min),
        limite_vermelho_max: parseInt(limites.vermelho_max),
      };

      const { error } = await supabase
        .from('alertas_estoque')
        .upsert(alertData, { onConflict: 'produto_id' });

      if (error) throw error;

      toast.success('Faixas de alerta atualizadas!');
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      toast.error('Erro ao salvar alertas');
    }
  };

  const selectProduct = (product: ProductWithAlert) => {
    setSelectedProduct(product);
    const alert = product.alertas_estoque?.[0];
    if (alert) {
      setLimites({
        verde_min: alert.limite_verde_min.toString(),
        verde_max: alert.limite_verde_max.toString(),
        amarelo_min: alert.limite_amarelo_min.toString(),
        amarelo_max: alert.limite_amarelo_max.toString(),
        vermelho_min: alert.limite_vermelho_min.toString(),
        vermelho_max: alert.limite_vermelho_max.toString(),
      });
    }
  };

  const vermelhoProducts = products.filter((p) => p.alertLevel === 'vermelho').slice(0, 3);
  const amareloProducts = products.filter((p) => p.alertLevel === 'amarelo').slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Alertas</h1>
        </div>
      </header>

      <div className="container mx-auto p-8">
        {!selectedProduct ? (
          <Card className="bg-primary p-8">
            <h2 className="text-xl text-primary-foreground text-center mb-6">
              Selecione o item para editar a faixa de alerta
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left - Product list */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Busque pelo Código ou Produto"
                    className="pl-10"
                  />
                </div>

                <div className="bg-danger text-danger-foreground rounded-lg p-4">
                  <h3 className="font-bold mb-2">Vermelho</h3>
                  <p className="text-sm mb-3">Produtos com alerta</p>
                  {vermelhoProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="grid grid-cols-3 gap-2 p-2 hover:bg-danger/80 rounded cursor-pointer"
                    >
                      <div>{product.codigo}</div>
                      <div>{product.nome}</div>
                      <div>
                        <Button size="sm" variant="outline">
                          🛒
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-warning text-warning-foreground rounded-lg p-4">
                  <h3 className="font-bold mb-2">AMARELO</h3>
                  <p className="text-sm mb-3">Produtos com alerta</p>
                  {amareloProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => selectProduct(product)}
                      className="grid grid-cols-3 gap-2 p-2 hover:bg-warning/80 rounded cursor-pointer"
                    >
                      <div>{product.codigo}</div>
                      <div>{product.nome}</div>
                      <div>
                        <Button size="sm" variant="outline">
                          🛒
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right - Alert levels info */}
              <div className="space-y-4">
                <div className="bg-success text-success-foreground rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">VERDE</h3>
                  <p>Quantidade em estoque</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-background text-foreground rounded p-2">0</div>
                    <div className="flex items-center justify-center">Até</div>
                    <div className="bg-background text-foreground rounded p-2">1000</div>
                  </div>
                </div>

                <div className="bg-warning text-warning-foreground rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">AMARELO</h3>
                  <p>Quantidade em estoque</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-background text-foreground rounded p-2">0</div>
                    <div className="flex items-center justify-center">Até</div>
                    <div className="bg-background text-foreground rounded p-2">0</div>
                  </div>
                </div>

                <div className="bg-danger text-danger-foreground rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-4">Vermelho</h3>
                  <p>Quantidade em estoque</p>
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-background text-foreground rounded p-2">0</div>
                    <div className="flex items-center justify-center">Até</div>
                    <div className="bg-background text-foreground rounded p-2">0</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6 justify-center">
              <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
              <Button className="bg-accent">Concluir</Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-primary p-8">
            <h2 className="text-xl text-primary-foreground text-center mb-6">
              Editar faixas de alerta - {selectedProduct.nome}
            </h2>

            <div className="bg-card rounded-lg p-6 space-y-6">
              <div className="bg-success text-success-foreground rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">VERDE</h3>
                <Label>Quantidade em estoque</Label>
                <div className="grid grid-cols-3 gap-2 mt-4 items-center">
                  <Input
                    type="number"
                    value={limites.verde_min}
                    onChange={(e) => setLimites({ ...limites, verde_min: e.target.value })}
                    className="bg-background text-foreground"
                  />
                  <div className="text-center">Até</div>
                  <Input
                    type="number"
                    value={limites.verde_max}
                    onChange={(e) => setLimites({ ...limites, verde_max: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="bg-warning text-warning-foreground rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">AMARELO</h3>
                <Label>Quantidade em estoque</Label>
                <div className="grid grid-cols-3 gap-2 mt-4 items-center">
                  <Input
                    type="number"
                    value={limites.amarelo_min}
                    onChange={(e) => setLimites({ ...limites, amarelo_min: e.target.value })}
                    className="bg-background text-foreground"
                  />
                  <div className="text-center">Até</div>
                  <Input
                    type="number"
                    value={limites.amarelo_max}
                    onChange={(e) => setLimites({ ...limites, amarelo_max: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>

              <div className="bg-danger text-danger-foreground rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4">Vermelho</h3>
                <Label>Quantidade em estoque</Label>
                <div className="grid grid-cols-3 gap-2 mt-4 items-center">
                  <Input
                    type="number"
                    value={limites.vermelho_min}
                    onChange={(e) => setLimites({ ...limites, vermelho_min: e.target.value })}
                    className="bg-background text-foreground"
                  />
                  <div className="text-center">Até</div>
                  <Input
                    type="number"
                    value={limites.vermelho_max}
                    onChange={(e) => setLimites({ ...limites, vermelho_max: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6 justify-center">
              <Button onClick={() => setSelectedProduct(null)}>Voltar</Button>
              <Button onClick={handleSaveAlert} className="bg-accent">
                Concluir
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
