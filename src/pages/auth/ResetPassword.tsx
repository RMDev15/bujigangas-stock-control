import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

export default function ResetPassword() {
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmaSenha, setConfirmaSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Senha deve ter no mínimo 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Senha deve conter letra maiúscula';
    if (!/[a-z]/.test(password)) return 'Senha deve conter letra minúscula';
    if (!/[0-9]/.test(password)) return 'Senha deve conter número';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Senha deve conter caractere especial';
    return null;
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const validation = validatePassword(novaSenha);
    if (validation) {
      toast.error(validation);
      setLoading(false);
      return;
    }

    if (novaSenha !== confirmaSenha) {
      toast.error('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: novaSenha,
      });

      if (error) throw error;

      // Update profile to mark password as not temporary
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ senha_temporaria: false })
          .eq('id', user.id);
      }

      toast.success('Senha alterada com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:block w-1/4 bg-auth-background"></div>
      
      <div className="flex-1 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <img src={logo} alt="Só Bujigangas" className="w-40 h-auto mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Gerenciador de Estoque</h1>
            <h2 className="text-xl text-auth font-semibold">Finalize sua Nova Senha</h2>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Senha com no mínimo 8 Caracteres, Latina Maiúscula, Latina Minúscula, Números e Símbolos
            </p>

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmaSenha">Confirme Nova Senha</Label>
              <Input
                id="confirmaSenha"
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/auth/login')}
                className="text-sm text-auth hover:underline"
              >
                Voltar
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-auth hover:bg-auth/90"
            >
              {loading ? 'Alterando...' : 'Continuar'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            2025 Release | Beto Noreto
          </p>
        </div>
      </div>

      <div className="hidden lg:block w-1/4 bg-auth-background"></div>
    </div>
  );
}
