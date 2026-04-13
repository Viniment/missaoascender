import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, User, Trash2, RotateCcw, Upload, LogOut, ArrowLeft, Layout } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FailureProtocolSettings from '@/components/FailureProtocolSettings';

export default function Settings() {
  const { user, signOut } = useAuth();
  const { state, updateProfile, resetProgress, deleteAccount, setState } = useGame();
  const navigate = useNavigate();

  const [name, setName] = useState(state.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    if (!name.trim() || !user) return;
    updateProfile({ name: name.trim() });
    await supabase
      .from('profiles')
      .update({ display_name: name.trim() })
      .eq('user_id', user.id);
    toast.success('Nome atualizado!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      updateProfile({ avatar: publicUrl });
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      toast.success('Avatar atualizado!');
    } catch (err: any) {
      toast.error('Erro ao enviar avatar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    await resetProgress();
    toast.success('Progresso reiniciado!');
    setShowResetConfirm(false);
  };

  const handleDelete = async () => {
    await deleteAccount();
    toast.success('Conta excluída.');
    setShowDeleteConfirm(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Até a próxima!');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg tracking-widest text-primary glow-text-purple flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" /> CONFIGURAÇÕES
          </h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile */}
        <div className="rpg-panel space-y-4">
          <h2 className="font-display text-sm text-primary flex items-center gap-2">
            <User className="w-4 h-4" /> PERFIL
          </h2>

          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {state.avatar ? (
                <img src={state.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Clique para alterar avatar</p>
              <p className="text-xs text-muted-foreground">{uploading ? 'Enviando...' : 'Max 2MB'}</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Nome</label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                className="bg-secondary border-border"
                maxLength={30}
              />
              <Button size="sm" onClick={handleSaveName} disabled={!name.trim()}>
                Salvar
              </Button>
            </div>
          </div>

          <div className="text-xs text-muted-foreground">
            Email: {user?.email}
          </div>
        </div>

        {/* Tab Visibility */}
        <div className="rpg-panel space-y-4">
          <h2 className="font-display text-sm text-primary flex items-center gap-2">
            <Layout className="w-4 h-4" /> ABAS VISÍVEIS
          </h2>
          <p className="text-xs text-muted-foreground">Desative as abas que você não usa para simplificar a interface.</p>
          {[
            { id: 'challenges', label: 'Desafios' },
            { id: 'journal', label: 'Diário' },
            { id: 'timer', label: 'Timer' },
            { id: 'awakening', label: 'Despertar' },
          ].map(tab => {
            const disabled = (state.disabledTabs || []).includes(tab.id);
            return (
              <div key={tab.id} className="flex items-center justify-between">
                <span className="text-sm font-body">{tab.label}</span>
                <Switch
                  checked={!disabled}
                  onCheckedChange={(checked) => {
                    const current = state.disabledTabs || [];
                    const next = checked
                      ? current.filter(t => t !== tab.id)
                      : [...current, tab.id];
                    setState(prev => ({ ...prev, disabledTabs: next }));
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Failure Protocol */}
        <FailureProtocolSettings />

        {/* Actions */}
        <div className="rpg-panel space-y-3">
          <h2 className="font-display text-sm text-primary">AÇÕES</h2>

          <Button
            variant="outline"
            className="w-full justify-start text-warning border-warning/30 hover:bg-warning/10"
            onClick={() => setShowResetConfirm(true)}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar Progresso
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>
      </div>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-warning">Reiniciar Progresso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reiniciar todo o progresso? XP, nível, rank, ouro, missões, hábitos e histórico serão apagados. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleReset}>
              Reiniciar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir sua conta? Todos os dados serão permanentemente apagados. Esta ação NÃO pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>
              Excluir Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
