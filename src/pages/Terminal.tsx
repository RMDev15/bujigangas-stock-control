import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CartItem {
  codigo: string;
  nome: string;
  cor: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  produto_id: string;
}

export default function Terminal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [codigo, setCodigo] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [valorRecebido, setValorRecebido] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
  }, [user, navigate]);

  const handleAddItem = async () => {
    if (!codigo || !quantidade) {
      toast.error('Preencha código e quantidade');
      return;
    }

    const { data: product } = await supabase
      .from('produtos')
      .select('*')
      .or(`codigo.eq.${codigo},codigo_barras.eq.${codigo}`)
      .single();

    if (!product) {
      toast.error('Produto não encontrado');
      return;
    }

    const qtd = parseInt(quantidade);
    const subtotal = product.valor_venda * qtd;

    setCart([
      ...cart,
      {
        codigo: product.codigo,
        nome: product.nome,
        cor: product.cor,
        quantidade: qtd,
        valor_unitario: product.valor_venda,
        subtotal,
        produto_id: product.id,
      },
    ]);

    setCodigo('');
    setQuantidade('1');
  };

  const removeItem = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQtd: number) => {
    const newCart = [...cart];
    newCart[index].quantidade = newQtd;
    newCart[index].subtotal = newCart[index].valor_unitario * newQtd;
    setCart(newCart);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleFinalizarVenda = async () => {
    const valorRec = parseFloat(valorRecebido);
    const total = getTotal();

    if (valorRec < total) {
      toast.error('Valor recebido insuficiente');
      return;
    }

    try {
      // Create sale
      const { data: venda, error: vendaError } = await supabase
        .from('vendas')
        .insert({
          usuario_id: user?.id,
          valor_total: total,
          valor_recebido: valorRec,
          troco: valorRec - total,
        })
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Create sale items and update stock
      for (const item of cart) {
        await supabase.from('itens_venda').insert({
          venda_id: venda.id,
          produto_id: item.produto_id,
          codigo_produto: item.codigo,
          nome_produto: item.nome,
          cor_produto: item.cor,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          subtotal: item.subtotal,
        });

        // Update stock (allow negative)
        const { data: product } = await supabase
          .from('produtos')
          .select('estoque_atual')
          .eq('id', item.produto_id)
          .single();

        await supabase
          .from('produtos')
          .update({
            estoque_atual: product!.estoque_atual - item.quantidade,
          })
          .eq('id', item.produto_id);
      }

      toast.success(`Venda concluída! Troco: R$ ${(valorRec - total).toFixed(2)}`);
      setCart([]);
      setValorRecebido('');
      setShowPaymentDialog(false);
    } catch (error) {
      toast.error('Erro ao finalizar venda');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Terminal de Vendas</h1>
        </div>
      </header>

      <div className="container mx-auto p-8">
        <Card className="bg-primary p-8">
          <div className="bg-card rounded-lg p-6 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Código / Código de Barras</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleAddItem}
                  className="w-full bg-success hover:bg-success/90"
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Cart items */}
            <div className="space-y-2">
              <div className="grid grid-cols-6 gap-4 font-semibold text-center p-3 bg-muted rounded">
                <div>Código</div>
                <div>Nome</div>
                <div>Cor</div>
                <div>Quantidade</div>
                <div>Subtotal</div>
                <div>Ações</div>
              </div>

              {cart.map((item, index) => (
                <div key={index} className="grid grid-cols-6 gap-4 p-3 bg-muted/50 rounded text-center items-center">
                  <div>{item.codigo}</div>
                  <div>{item.nome}</div>
                  <div>{item.cor}</div>
                  <div>
                    <Input
                      type="number"
                      value={item.quantidade}
                      onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                      className="w-20 mx-auto"
                    />
                  </div>
                  <div>R$ {item.subtotal.toFixed(2)}</div>
                  <div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-2xl font-bold">
                Total: R$ {getTotal().toFixed(2)}
              </div>
              <Button
                onClick={() => setShowPaymentDialog(true)}
                disabled={cart.length === 0}
                className="bg-primary hover:bg-primary-hover"
              >
                Finalizar
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finalizar Venda</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Total: R$ {getTotal().toFixed(2)}</Label>
            </div>
            <div>
              <Label>Valor Recebido</Label>
              <Input
                type="number"
                step="0.01"
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFinalizarVenda()}
              />
            </div>
            {valorRecebido && parseFloat(valorRecebido) >= getTotal() && (
              <div className="text-lg font-semibold">
                Troco: R$ {(parseFloat(valorRecebido) - getTotal()).toFixed(2)}
              </div>
            )}
            <Button
              onClick={handleFinalizarVenda}
              className="w-full bg-success hover:bg-success/90"
            >
              Concluir Venda
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
