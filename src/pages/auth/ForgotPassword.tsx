import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error('Erro ao enviar e-mail de recuperação');
        console.error('Reset password error:', error);
        return;
      }

      setEmailSent(true);
      toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
    } catch (error) {
      toast.error('Erro ao processar solicitação');
      console.error('Reset password exception:', error);
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
            <h2 className="text-xl text-auth font-semibold">Recuperar Senha</h2>
          </div>

          {!emailSent ? (
            <form onSubmit={handleResetRequest} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full"
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Digite seu e-mail cadastrado. Você receberá um link para redefinir sua senha.
              </p>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-auth hover:bg-auth/90"
              >
                {loading ? 'Enviando...' : 'Enviar E-mail de Recuperação'}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <p className="text-sm text-green-800 dark:text-green-200">
                  E-mail enviado com sucesso! Verifique sua caixa de entrada e spam.
                </p>
              </div>

              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full bg-auth hover:bg-auth/90"
              >
                Voltar ao Login
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            2025 Release | Beto Noreto
          </p>
        </div>
      </div>

      <div className="hidden lg:block w-1/4 bg-auth-background"></div>
    </div>
  );
}
