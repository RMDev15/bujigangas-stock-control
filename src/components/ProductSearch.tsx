import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';

interface ProductSearchProps {
  onSelectProduct: (productId: string | null) => void;
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (search) {
      const filtered = products.filter(
        (p) =>
          p.nome.toLowerCase().includes(search.toLowerCase()) ||
          p.codigo.includes(search) ||
          p.codigo_barras?.includes(search)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
      onSelectProduct(null);
    }
  }, [search, products]);

  const loadProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('nome');
    
    if (data) setProducts(data);
  };

  const handleSelect = (product: any) => {
    setSearch(`${product.nome} (${product.codigo})`);
    onSelectProduct(product.id);
    setFilteredProducts([]);
  };

  return (
    <div className="relative">
      <Label htmlFor="product-search" className="text-primary-foreground">
        Busque seu item para uma melhor análise
      </Label>
      <div className="relative mt-2">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="product-search"
          type="text"
          placeholder="Digite o nome, código ou código de barras..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {filteredProducts.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => handleSelect(product)}
              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
            >
              <div className="font-medium">{product.nome}</div>
              <div className="text-sm text-muted-foreground">
                Código: {product.codigo} | Estoque: {product.estoque_atual}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
