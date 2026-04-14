import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error('Erro ao alterar senha: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rpg-panel space-y-4">
      <h2 className="font-display text-sm text-primary flex items-center gap-2">
        <Lock className="w-4 h-4" /> ALTERAR SENHA
      </h2>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground">Nova senha</label>
          <div className="relative">
            <Input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="bg-secondary border-border pr-10"
              placeholder="Mínimo 6 caracteres"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Confirmar nova senha</label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="bg-secondary border-border"
            placeholder="Repita a nova senha"
          />
        </div>

        <Button
          size="sm"
          onClick={handleChangePassword}
          disabled={loading || !newPassword || !confirmPassword}
          className="w-full"
        >
          {loading ? 'Alterando...' : 'Alterar Senha'}
        </Button>
      </div>
    </div>
  );
}
