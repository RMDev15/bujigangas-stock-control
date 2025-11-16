import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export default function Users() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('*****');
  const [tipoAcesso, setTipoAcesso] = useState('USUÁRIO');
  const [permissions, setPermissions] = useState({
    visualizar_valores: false,
    editar_valores: false,
    editar_alertas: false,
    editar_estoque: false,
    visualizar_pedidos: false,
    editar_pedidos: false,
    gerenciar_admin: false,
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth/login');
      return;
    }
    checkAdminAccess();
  }, [user, navigate]);

  const checkAdminAccess = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('tipo_acesso')
      .eq('id', user.id)
      .single();

    if (profile?.tipo_acesso !== 'admin') {
      toast.error('Acesso negado');
      navigate('/dashboard');
    }
  };

  const handleConfirmar = async () => {
    if (!nome || !email) {
      toast.error('Preencha nome e email');
      return;
    }

    const tempPassword = 'Ab102030@';

    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nome,
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            tipo_acesso: permissions.gerenciar_admin ? 'admin' : 'common',
            permissoes: permissions,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;
      }

      toast.success('Usuário criado com sucesso!');
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar usuário');
    }
  };

  const resetForm = () => {
    setNome('');
    setEmail('');
    setSenha('*****');
    setTipoAcesso('USUÁRIO');
    setPermissions({
      visualizar_valores: false,
      editar_valores: false,
      editar_alertas: false,
      editar_estoque: false,
      visualizar_pedidos: false,
      editar_pedidos: false,
      gerenciar_admin: false,
    });
  };

  const handlePermissionChange = (key: string, checked: boolean) => {
    const newPerms = { ...permissions, [key]: checked };
    
    // Auto-promote to admin if gerenciar_admin is checked
    if (key === 'gerenciar_admin' && checked) {
      setTipoAcesso('ADMINISTRADOR');
    } else if (key === 'gerenciar_admin' && !checked) {
      setTipoAcesso('USUÁRIO');
    }
    
    setPermissions(newPerms);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4">
        <div className="container mx-auto flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-6 w-6" />
          </Button>
          <h1 className="text-3xl font-bold">Gerênciar Usuário</h1>
        </div>
      </header>

      <div className="container mx-auto p-8">
        <Card className="bg-primary p-8">
          <h2 className="text-xl text-primary-foreground text-center mb-6">
            Edite as Funcionalidades do Usuário
          </h2>

          <div className="grid md:grid-cols-2 gap-8 bg-card rounded-lg p-6">
            {/* Left side - User Info */}
            <div className="space-y-4">
              <h3 className="font-semibold">Informações do Usuário</h3>
              
              <div>
                <Label>Nome:</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Digite o nome"
                />
              </div>

              <div>
                <Label>E-mail:</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite o email"
                />
              </div>

              <div>
                <Label>Senha:</Label>
                <Input
                  value={senha}
                  readOnly
                  className="bg-muted"
                />
              </div>

              <div>
                <Label>Tipo de Acesso:</Label>
                <Input
                  value={tipoAcesso}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            {/* Right side - Permissions */}
            <div className="space-y-4">
              <h3 className="font-semibold">Funcionalidades do Adm / Usuário</h3>
              <p className="text-sm text-muted-foreground">Marque uma ou mais opções</p>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizar_valores"
                    checked={permissions.visualizar_valores}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('visualizar_valores', checked as boolean)
                    }
                  />
                  <Label htmlFor="visualizar_valores">Visualizar / Editar valores e informações</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editar_alertas"
                    checked={permissions.editar_alertas}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('editar_alertas', checked as boolean)
                    }
                  />
                  <Label htmlFor="editar_alertas">Editar Alertas</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editar_estoque"
                    checked={permissions.editar_estoque}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('editar_estoque', checked as boolean)
                    }
                  />
                  <Label htmlFor="editar_estoque">Editar Estoque</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="visualizar_pedidos"
                    checked={permissions.visualizar_pedidos}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('visualizar_pedidos', checked as boolean)
                    }
                  />
                  <Label htmlFor="visualizar_pedidos">Visualizar pedido</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="editar_pedidos"
                    checked={permissions.editar_pedidos}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('editar_pedidos', checked as boolean)
                    }
                  />
                  <Label htmlFor="editar_pedidos">Editar pedidos</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="gerenciar_admin"
                    checked={permissions.gerenciar_admin}
                    onCheckedChange={(checked) => 
                      handlePermissionChange('gerenciar_admin', checked as boolean)
                    }
                  />
                  <Label htmlFor="gerenciar_admin">Gerênciar Adm / Usuário</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6 justify-center">
            <Button onClick={handleConfirmar} className="bg-success hover:bg-success/90">
              Confirmar
            </Button>
            <Button onClick={resetForm} variant="destructive">
              Excluir Cadastro
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
