import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload } from 'lucide-react';

export default function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cor: '',
    quantidade: '',
    codigo_barras: '',
    fornecedor: '',
    valor_unitario: '',
    valor_venda: '',
    markup: '',
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
      .select('*')
      .order('codigo')
      .limit(10);
    
    setProducts(data || []);
  };

  const handleInputChange = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Auto-calculate markup or valor_venda
    if (field === 'valor_unitario' || field === 'valor_venda') {
      const unitario = parseFloat(newFormData.valor_unitario || '0');
      const venda = parseFloat(newFormData.valor_venda || '0');
      if (unitario > 0 && venda > 0) {
        newFormData.markup = ((venda - unitario) / unitario * 100).toFixed(2);
      }
    } else if (field === 'markup' && newFormData.valor_unitario) {
      const unitario = parseFloat(newFormData.valor_unitario);
      const markup = parseFloat(value || '0');
      newFormData.valor_venda = (unitario * (1 + markup / 100)).toFixed(2);
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome || !formData.quantidade || !formData.valor_unitario || !formData.valor_venda) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const productData = {
        codigo: selectedProduct?.codigo || await generateCode(),
        nome: formData.nome,
        cor: formData.cor,
        estoque_atual: parseInt(formData.quantidade),
        codigo_barras: formData.codigo_barras,
        fornecedor: formData.fornecedor,
        valor_unitario: parseFloat(formData.valor_unitario),
        valor_venda: parseFloat(formData.valor_venda),
        markup: parseFloat(formData.markup),
      };

      if (selectedProduct) {
        const { error } = await supabase
          .from('produtos')
          .update(productData)
          .eq('id', selectedProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase
          .from('produtos')
          .insert(productData);
        if (error) throw error;
        toast.success('Produto cadastrado!');
      }

      resetForm();
      loadProducts();
    } catch (error) {
      toast.error('Erro ao salvar produto');
    }
  };

  const generateCode = async () => {
    const { data } = await supabase.rpc('generate_product_code');
    return data;
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      cor: '',
      quantidade: '',
      codigo_barras: '',
      fornecedor: '',
      valor_unitario: '',
      valor_venda: '',
      markup: '',
    });
    setSelectedProduct(null);
    setShowForm(false);
  };

  const editProduct = (product: any) => {
    setSelectedProduct(product);
    setFormData({
      nome: product.nome,
      cor: product.cor || '',
      quantidade: product.estoque_atual.toString(),
      codigo_barras: product.codigo_barras || '',
      fornecedor: product.fornecedor || '',
      valor_unitario: product.valor_unitario.toString(),
      valor_venda: product.valor_venda.toString(),
      markup: product.markup?.toString() || '',
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Cadastro de Produto</h1>
        </div>
      </header>

      <div className="container mx-auto p-8">
        {!showForm ? (
          <Card className="bg-primary p-8">
            <h2 className="text-xl text-primary-foreground text-center mb-6">
              Selecione o produto para visualizar ou editar
            </h2>

            <div className="bg-card rounded-lg p-6">
              <div className="grid grid-cols-6 gap-4 mb-4 font-semibold text-center">
                <div>Código</div>
                <div>Nome</div>
                <div>Cor</div>
                <div>Quantidade</div>
                <div>Valor / UN</div>
                <div>Fornecedor</div>
              </div>

              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => editProduct(product)}
                  className="grid grid-cols-6 gap-4 p-3 hover:bg-muted rounded cursor-pointer text-center"
                >
                  <div>{product.codigo}</div>
                  <div>{product.nome}</div>
                  <div>{product.cor}</div>
                  <div>{product.estoque_atual}</div>
                  <div>R$ {product.valor_unitario}</div>
                  <div>{product.fornecedor}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-4 mt-6 justify-center">
              <Button onClick={() => navigate('/dashboard')}>Voltar</Button>
              <Button onClick={() => setShowForm(true)} className="bg-accent">
                Novo Cadastro
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="bg-primary p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl text-primary-foreground">
                Cadastre o produto preenchendo as lacunas em branco
              </h2>
              <Button variant="secondary" onClick={resetForm}>Voltar</Button>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 bg-muted rounded flex items-center justify-center">
                      <Upload className="text-muted-foreground" />
                    </div>
                    <Button type="button" size="sm" className="bg-auth">
                      Editar
                    </Button>
                  </div>
                  
                  {selectedProduct && (
                    <div>
                      <Label>Codigo: {selectedProduct.codigo}</Label>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nome:</Label>
                      <Input
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                      />
                    </div>
                    <div>
                      <Label>Cor:</Label>
                      <Input
                        value={formData.cor}
                        onChange={(e) => handleInputChange('cor', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Quant. em Estoque:</Label>
                      <Input
                        type="number"
                        value={formData.quantidade}
                        onChange={(e) => handleInputChange('quantidade', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Valor da unidade: R$</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_unitario}
                        onChange={(e) => handleInputChange('valor_unitario', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Fornecedor:</Label>
                      <Input
                        value={formData.fornecedor}
                        onChange={(e) => handleInputChange('fornecedor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Valor de venda: R$</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.valor_venda}
                        onChange={(e) => handleInputChange('valor_venda', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-right">
                    <Label>Markup: %</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.markup}
                      onChange={(e) => handleInputChange('markup', e.target.value)}
                      className="w-32 ml-auto"
                    />
                  </div>

                  <div>
                    <Label>Código de barras:</Label>
                    <Input
                      value={formData.codigo_barras}
                      onChange={(e) => handleInputChange('codigo_barras', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <Button type="submit" className="bg-auth">
                  Concluir
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
