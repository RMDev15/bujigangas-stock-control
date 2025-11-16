import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        toast.error('E-mail ou senha incorreta e ou não cadastrado');
        return;
      }

      // Check if temporary password
      const { data: profile } = await supabase
        .from('profiles')
        .select('senha_temporaria')
        .eq('id', data.user.id)
        .single();

      if (profile?.senha_temporaria) {
        navigate('/auth/reset-password');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left and right auth background */}
      <div className="hidden lg:block w-1/4 bg-auth-background"></div>
      
      {/* Center content */}
      <div className="flex-1 bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <img src={logo} alt="Só Bujigangas" className="w-40 h-auto mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Gerenciador de Estoque</h1>
            <h2 className="text-xl text-auth font-semibold">Login</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input
                id="senha"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="w-full"
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={() => navigate('/auth/forgot-password')}
                className="text-sm text-auth hover:underline"
              >
                Esqueci a senha
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-auth hover:bg-auth/90"
            >
              {loading ? 'Entrando...' : 'Continuar'}
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
