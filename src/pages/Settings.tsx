import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { User, Trash2, RotateCcw, Upload, LogOut, ArrowLeft, Layout, Palette, Shield, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FailureProtocolSettings from '@/components/FailureProtocolSettings';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ThemeSelector from '@/components/ThemeSelector';
import type { ThemeId } from '@/components/ThemeSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const sections = [
  { id: 'account', label: 'Conta', description: 'Perfil, senha e sessão', icon: User },
  { id: 'appearance', label: 'Aparência', description: 'Tema e visual', icon: Palette },
  { id: 'interface', label: 'Interface', description: 'Abas visíveis', icon: Layout },
  { id: 'failure', label: 'Protocolo de Falha', description: 'Punições e penalidades', icon: Shield },
  { id: 'danger', label: 'Zona de Perigo', description: 'Ações irreversíveis', icon: AlertTriangle },
] as const;

type SectionId = (typeof sections)[number]['id'];

export default function Settings() {
  const { user, signOut } = useAuth();
  const { state, updateProfile, resetProgress, deleteAccount, setState } = useGame();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeSection, setActiveSection] = useState<SectionId>('account');
  const [name, setName] = useState(state.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveName = async () => {
    if (!name.trim() || !user) return;
    updateProfile({ name: name.trim() });
    await supabase.from('profiles').update({ display_name: name.trim() }).eq('user_id', user.id);
    toast.success('Nome atualizado!');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens são permitidas.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB.'); return; }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      updateProfile({ avatar: publicUrl });
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      toast.success('Avatar atualizado!');
    } catch (err: any) {
      toast.error('Erro ao enviar avatar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => { await resetProgress(); toast.success('Progresso reiniciado!'); setShowResetConfirm(false); };
  const handleDelete = async () => { await deleteAccount(); toast.success('Conta excluída.'); setShowDeleteConfirm(false); };
  const handleLogout = async () => { await signOut(); toast.success('Até a próxima!'); };

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <SectionHeader title="Conta" description="Gerencie seu perfil, credenciais e sessão." />
            <div className="rpg-panel space-y-4">
              <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase">Perfil</h3>
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
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Nome</label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" maxLength={30} />
                  <Button size="sm" onClick={handleSaveName} disabled={!name.trim()}>Salvar</Button>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Email: {user?.email}</div>
            </div>

            <div className="rpg-panel">
              <h3 className="font-display text-xs tracking-widest text-muted-foreground uppercase mb-4">Segurança</h3>
              <ChangePasswordForm />
            </div>

            <div className="rpg-panel">
              <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
              </Button>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <SectionHeader title="Aparência" description="Personalize o visual do sistema." />
            <ThemeSelector
              current={(state.theme || 'neon-purple') as ThemeId}
              onChange={(theme) => setState(prev => ({ ...prev, theme }))}
            />
          </div>
        );

      case 'interface':
        return (
          <div className="space-y-6">
            <SectionHeader title="Interface" description="Escolha quais abas ficam visíveis na navegação." />
            <div className="rpg-panel space-y-1">
              {[
                { id: 'challenges', label: 'Desafios' },
                { id: 'journal', label: 'Diário' },
                { id: 'timer', label: 'Timer' },
                { id: 'visualizar', label: 'Visualizar' },
                { id: 'awakening', label: 'Despertar' },
              ].map(tab => {
                const disabled = (state.disabledTabs || []).includes(tab.id);
                return (
                  <div key={tab.id} className="flex items-center justify-between py-2 px-1 rounded-md hover:bg-secondary/50 transition-colors">
                    <span className="text-sm font-body">{tab.label}</span>
                    <Switch
                      checked={!disabled}
                      onCheckedChange={(checked) => {
                        const current = state.disabledTabs || [];
                        const next = checked ? current.filter(t => t !== tab.id) : [...current, tab.id];
                        setState(prev => ({ ...prev, disabledTabs: next }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'failure':
        return (
          <div className="space-y-6">
            <FailureProtocolSettings />
          </div>
        );

      case 'danger':
        return (
          <div className="space-y-6">
            <SectionHeader title="Zona de Perigo" description="Ações irreversíveis. Proceda com cautela." />
            <div className="rpg-panel space-y-3 border-destructive/40">
              <Button
                variant="outline"
                className="w-full justify-start text-warning border-warning/30 hover:bg-warning/10"
                onClick={() => setShowResetConfirm(true)}
              >
                <RotateCcw className="w-4 h-4 mr-2" /> Reiniciar Progresso
              </Button>
              <p className="text-xs text-muted-foreground pl-1">XP, nível, rank, ouro, missões, hábitos e histórico serão apagados.</p>

              <div className="border-t border-border my-2" />

              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
              </Button>
              <p className="text-xs text-muted-foreground pl-1">Todos os dados serão permanentemente removidos.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg tracking-widest text-primary glow-text-purple">CONFIGURAÇÕES</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {isMobile ? (
          /* Mobile: Accordion sections */
          <div className="space-y-2">
            {sections.map(s => {
              const isOpen = activeSection === s.id;
              const isDanger = s.id === 'danger';
              return (
                <div key={s.id} className={cn(
                  'rpg-panel overflow-hidden transition-all',
                  isDanger && 'border-destructive/40'
                )}>
                  <button
                    onClick={() => setActiveSection(isOpen ? null as any : s.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-1 py-2 text-left transition-colors',
                      isOpen
                        ? isDanger ? 'text-destructive' : 'text-primary'
                        : 'text-foreground'
                    )}
                  >
                    <div className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      isOpen
                        ? isDanger ? 'bg-destructive/15 text-destructive' : 'bg-primary/15 text-primary'
                        : 'bg-secondary text-muted-foreground'
                    )}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display tracking-wider">{s.label}</p>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )} />
                  </button>
                  {isOpen && (
                    <div className="pt-3 border-t border-border mt-2 animate-accordion-down">
                      {renderContent()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Desktop: Sidebar + Content */
          <div className="flex gap-6">
            <nav className="w-56 shrink-0 space-y-1">
              {sections.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body transition-all text-left',
                    activeSection === s.id
                      ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_hsl(var(--glow-color)/0.15)]'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50',
                    s.id === 'danger' && activeSection === s.id && 'bg-destructive/15 text-destructive border-destructive/20 shadow-[0_0_12px_hsl(0_70%_50%/0.15)]'
                  )}
                >
                  <s.icon className="w-4 h-4" />
                  {s.label}
                </button>
              ))}
            </nav>
            <div className="flex-1 min-w-0">
              {renderContent()}
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-warning">Reiniciar Progresso</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? XP, nível, rank, ouro, missões, hábitos e histórico serão apagados. Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-warning text-warning-foreground hover:bg-warning/90" onClick={handleReset}>Reiniciar Tudo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Excluir Conta</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Todos os dados serão permanentemente apagados. Esta ação NÃO pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDelete}>Excluir Permanentemente</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-2">
      <h2 className="font-display text-base tracking-widest text-primary glow-text-purple">{title.toUpperCase()}</h2>
      <p className="text-xs text-muted-foreground mt-1">{description}</p>
    </div>
  );
}
