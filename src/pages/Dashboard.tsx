import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo.jpg';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StockChart } from '@/components/StockChart';
import { ProductSearch } from '@/components/ProductSearch';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
  };

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = async () => {
    await signOut();
  };

  const hasPermission = (permission: string) => {
    return profile?.permissoes?.[permission] === true;
  };

  const isAdmin = profile?.tipo_acesso === 'admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <h1 className="text-3xl font-bold text-center">Gerenciador de Estoque</h1>
      </header>

      <div className="container mx-auto p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left side - Admin charts or User logo */}
          <div className="bg-primary rounded-lg p-8 space-y-6">
            {isAdmin ? (
              <div className="space-y-4">
                <ProductSearch onSelectProduct={setSelectedProduct} />
                <StockChart produtoId={selectedProduct || undefined} />
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <img src={logo} alt="Só Bujigangas" className="w-64 h-auto" />
              </div>
            )}
          </div>

          {/* Right side - Menu */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-primary">
                Bem Vindo {profile?.nome?.split(' ')[0]}
              </h2>
            </div>

            <div className="space-y-3">
              {isAdmin && (
                <Button
                  onClick={() => navigate('/usuarios')}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-hover"
                >
                  Gerenciar Usuário
                </Button>
              )}

              {(isAdmin || hasPermission('visualizar_cadastro')) && (
                <Button
                  onClick={() => navigate('/produtos')}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-hover"
                >
                  Cadastro de Produtos
                </Button>
              )}

              {(isAdmin || hasPermission('visualizar_terminal')) && (
                <Button
                  onClick={() => navigate('/terminal')}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-hover"
                >
                  Terminal de Vendas
                </Button>
              )}

              {(isAdmin || hasPermission('visualizar_pedidos')) && (
                <Button
                  onClick={() => navigate('/pedidos')}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-hover"
                >
                  Pedidos
                </Button>
              )}

              {(isAdmin || hasPermission('visualizar_alertas')) && (
                <Button
                  onClick={() => navigate('/alertas')}
                  className="w-full h-14 text-lg bg-primary hover:bg-primary-hover"
                >
                  Alertas
                </Button>
              )}
            </div>

            {isAdmin && (
              <div className="bg-muted rounded-lg p-4 text-center space-y-2">
                <p className="text-sm">Tempo restante SAIR?</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm">SIM</Button>
                  <Button variant="outline" size="sm">NÃO</Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleExit}
              variant="outline"
              className="w-full"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente sair?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>NÃO</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit}>SIM</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
