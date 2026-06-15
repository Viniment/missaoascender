import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { User, Trash2, RotateCcw, Upload, LogOut, ArrowLeft, Layout, Palette, Shield, AlertTriangle, ChevronDown, Settings2, Camera, CheckCircle2, Loader2, Brain, Skull } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import FailureProtocolSettings from '@/components/FailureProtocolSettings';
import ChangePasswordForm from '@/components/ChangePasswordForm';
import ThemeSelector from '@/components/ThemeSelector';
import type { ThemeId } from '@/components/ThemeSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { TAB_GROUPS, ALL_TABS } from '@/lib/tabs';


const sections = [
  { id: 'account', label: 'Conta', description: 'Perfil, senha e sessão', icon: User },
  { id: 'identity', label: 'Identidade', description: 'Alter Ego e Inimigo Interno', icon: Shield },
  { id: 'appearance', label: 'Aparência', description: 'Tema e visual', icon: Palette },
  { id: 'interface', label: 'Interface', description: 'Abas visíveis', icon: Layout },
  { id: 'ai', label: 'IA Comportamental', description: 'Tom e frequência de TODA IA do app', icon: Brain },
  { id: 'advanced', label: 'Avançado', description: 'Dificuldade e progressão', icon: Settings2 },
  { id: 'failure', label: 'Protocolo de Falha', description: 'Punições e penalidades', icon: Skull },
  { id: 'danger', label: 'Zona de Perigo', description: 'Ações irreversíveis', icon: AlertTriangle },
] as const;

type SectionId = (typeof sections)[number]['id'] | null;

export default function Settings() {
  const { user, signOut } = useAuth();
  const { state, updateProfile, resetProgress, deleteAccount, setState, updateAlterEgo, updateInnerEnemy } = useGame();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [activeSection, setActiveSection] = useState<SectionId>(null);

  useEffect(() => {
    if (isMobile === false && activeSection === null) {
      setActiveSection('account');
    }
    if (isMobile === true) {
      setActiveSection(null);
    }
  }, [isMobile]);
  const [name, setName] = useState(state.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
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
    setUploadSuccess(false);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const urlWithCache = `${publicUrl}?t=${Date.now()}`;
      updateProfile({ avatar: urlWithCache });
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      setUploadSuccess(true);
      toast.success('Avatar atualizado com sucesso!');
      setTimeout(() => setUploadSuccess(false), 3000);
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
              <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">Perfil</h3>
              
              {/* Avatar section - more visual */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative group">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full bg-secondary border-2 flex items-center justify-center overflow-hidden cursor-pointer transition-all duration-300",
                      uploading && "border-primary animate-pulse",
                      uploadSuccess && "border-success shadow-[0_0_20px_hsl(var(--success)/0.4)]",
                      !uploading && !uploadSuccess && "border-border hover:border-primary"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    ) : state.avatar ? (
                      <img src={state.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-8 h-8 text-foreground/40" />
                    )}
                  </div>
                  {uploadSuccess && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-success flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-success-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-foreground border-border hover:text-primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enviando...</>
                  ) : (
                    <><Upload className="w-3.5 h-3.5 mr-1.5" /> Trocar Foto</>
                  )}
                </Button>
                <p className="text-[11px] text-foreground/40">JPG, PNG · Max 2MB</p>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Nome</label>
                <div className="flex gap-2">
                  <Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" maxLength={30} />
                  <Button size="sm" onClick={handleSaveName} disabled={!name.trim()}>Salvar</Button>
                </div>
              </div>
              <div className="text-xs text-foreground/60">Email: {user?.email}</div>
            </div>

            <div className="rpg-panel">
              <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase mb-4">Segurança</h3>
              <ChangePasswordForm />
            </div>

            <div className="rpg-panel">
              <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" /> Sair da Conta
              </Button>
            </div>
          </div>
        );

      case 'identity': {
        const ae = state.alterEgo;
        const ie = state.innerEnemy;
        return (
          <div className="space-y-6">
            <SectionHeader title="Identidade" description="Sua dupla identidade — Alter Ego (sua melhor versão) e Inimigo Interno (a voz da sabotagem)." />

            <div className="rpg-panel border-primary/30 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <h3 className="font-display text-xs tracking-widest text-primary uppercase">Alter Ego</h3>
              </div>

              <div>
                <label className="text-xs text-foreground/60">Nome</label>
                <Input
                  value={ae?.name || ''}
                  onChange={e => updateAlterEgo({ name: e.target.value })}
                  className="bg-secondary border-border"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Frase de identidade</label>
                <Textarea
                  value={ae?.identityPhrase || ''}
                  onChange={e => updateAlterEgo({ identityPhrase: e.target.value })}
                  placeholder="Sou alguém que..."
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={140}
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Missão de vida</label>
                <Textarea
                  value={ae?.lifeMission || ''}
                  onChange={e => updateAlterEgo({ lifeMission: e.target.value })}
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={300}
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Valores (separados por vírgula)</label>
                <Input
                  value={(ae?.values || []).join(', ')}
                  onChange={e => updateAlterEgo({ values: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Rotina ideal</label>
                <Textarea
                  value={ae?.idealRoutine || ''}
                  onChange={e => updateAlterEgo({ idealRoutine: e.target.value })}
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={400}
                />
              </div>
            </div>

            <div className="rpg-panel border-destructive/30 space-y-4">
              <div className="flex items-center gap-2">
                <Skull className="w-4 h-4 text-destructive" />
                <h3 className="font-display text-xs tracking-widest text-destructive uppercase">Inimigo Interno</h3>
              </div>

              <div>
                <label className="text-xs text-foreground/60">Nome</label>
                <Input
                  value={ie?.name || ''}
                  onChange={e => updateInnerEnemy({ name: e.target.value })}
                  className="bg-secondary border-border"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Características (separadas por vírgula)</label>
                <Input
                  value={(ie?.traits || []).join(', ')}
                  onChange={e => updateInnerEnemy({ traits: e.target.value.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5) })}
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <label className="text-xs text-foreground/60">Frases de sabotagem (uma por linha)</label>
                <Textarea
                  value={(ie?.sabotagePhrases || []).join('\n')}
                  onChange={e => updateInnerEnemy({ sabotagePhrases: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })}
                  className="bg-secondary border-border min-h-[100px]"
                />
              </div>
            </div>
          </div>
        );
      }

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

      case 'interface': {
        const disabled = state.disabledTabs || [];
        const setDisabled = (next: string[]) => setState(prev => ({ ...prev, disabledTabs: next }));
        const enableAll = () => setDisabled([]);
        const onlyCore = () => setDisabled(ALL_TABS.filter(t => !t.core).map(t => t.id));
        return (
          <div className="space-y-6">
            <SectionHeader title="Interface" description="Escolha quais guias aparecem no menu principal." />

            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={enableAll} className="text-xs">
                Ativar todas
              </Button>
              <Button size="sm" variant="outline" onClick={onlyCore} className="text-xs">
                Só essenciais
              </Button>
            </div>
            <p className="text-[11px] text-foreground/50 -mt-3">
              Missões e Hábitos são o núcleo do sistema e não podem ser desativadas.
            </p>

            {TAB_GROUPS.map(group => (
              <div key={group.id} className="rpg-panel space-y-2">
                <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.tabs.map(tab => {
                    const isCore = !!tab.core;
                    const isOn = !disabled.includes(tab.id);
                    return (
                      <div
                        key={tab.id}
                        className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-secondary/50 transition-colors"
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                          isOn ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground/40'
                        )}>
                          <tab.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-display tracking-wider text-foreground flex items-center gap-2">
                            {tab.label}
                            {isCore && (
                              <span className="text-[9px] font-body tracking-widest text-primary/70 border border-primary/30 rounded px-1.5 py-0.5">
                                NÚCLEO
                              </span>
                            )}
                          </p>
                          <p className="text-[11px] text-foreground/50 truncate">{tab.description}</p>
                        </div>
                        <Switch
                          checked={isOn}
                          disabled={isCore}
                          onCheckedChange={(checked) => {
                            if (isCore) return;
                            const current = state.disabledTabs || [];
                            const next = checked
                              ? current.filter(t => t !== tab.id)
                              : [...current, tab.id];
                            setDisabled(next);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }

      case 'advanced':
        return (
          <div className="space-y-6">
            <SectionHeader title="Avançado" description="Ajuste a dificuldade de progressão do sistema." />
            <div className="rpg-panel space-y-4">
              <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">Dificuldade de Progressão</h3>
              <p className="text-xs text-foreground/60">Controla a quantidade de XP necessária para subir de nível. Divisores maiores tornam a progressão mais rápida.</p>
              <div className="space-y-2">
                {[
                  { value: 1, label: 'Normal', desc: 'XP padrão (ex: 1000 XP para Nível 2)' },
                  { value: 2, label: 'Fácil', desc: 'Metade do XP necessário (ex: 500 XP)' },
                  { value: 4, label: 'Muito Fácil', desc: 'Um quarto do XP necessário (ex: 250 XP)' },
                ].map(opt => {
                  const isSelected = (state.difficultyDivisor || 1) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setState(prev => {
                          const newDivisor = opt.value;
                          const newXpToNext = Math.floor(
                            prev.xpToNext * (prev.difficultyDivisor || 1) / newDivisor
                          );
                          const newXp = Math.min(prev.xp, newXpToNext - 1);
                          return { ...prev, difficultyDivisor: newDivisor, xpToNext: newXpToNext, xp: newXp };
                        });
                        toast.success(`Dificuldade alterada para ${opt.label}!`);
                      }}
                      className={cn(
                        'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                        isSelected
                          ? 'border-primary/50 bg-primary/10 shadow-[0_0_12px_hsl(var(--glow-color)/0.1)]'
                          : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                      )}
                    >
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 transition-colors',
                        isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                      )} />
                      <div>
                        <p className={cn('text-sm font-display tracking-wider text-foreground', isSelected && 'text-primary')}>{opt.label}</p>
                        <p className="text-xs text-foreground/60">{opt.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-foreground/40 italic">Trocar a dificuldade recalcula o XP necessário para o nível atual.</p>
            </div>
          </div>
        );

      case 'ai': {
        const ai = state.aiSettings || { intensity: 'moderado' as const, monsterEnabled: true, interventionFrequency: 'media' as const };
        const intensities = [
          { value: 'leve', label: 'Leve', desc: 'Tom firme mas contido. Sem agressividade.' },
          { value: 'moderado', label: 'Moderado', desc: 'Direto e firme (recomendado).' },
          { value: 'agressivo', label: 'Agressivo', desc: 'Brutal. Cada palavra dói porque é verdade.' },
        ] as const;
        const freqs = [
          { value: 'baixa', label: 'Baixa', desc: 'Menos perguntas, só intervém em padrão sério.' },
          { value: 'media', label: 'Média', desc: 'Quantidade equilibrada (recomendado).' },
          { value: 'alta', label: 'Alta', desc: 'Mais perguntas, intervém em toda falha.' },
        ] as const;
        return (
          <div className="space-y-6">
            <SectionHeader title="IA Comportamental" description="Calibra TODA IA do app: Despertar, Conselho, Confronto de Falhas e o Monstro." />

            <div className="rpg-panel space-y-3">
              <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">Intensidade do tom</h3>
              <p className="text-[11px] text-foreground/50">Define como a IA fala com você em todos os contextos.</p>
              {intensities.map(opt => {
                const sel = ai.intensity === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setState(prev => ({ ...prev, aiSettings: { ...(prev.aiSettings || ai), intensity: opt.value } }))}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                      sel ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 shrink-0', sel ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                    <div>
                      <p className={cn('text-sm font-display tracking-wider text-foreground', sel && 'text-primary')}>{opt.label}</p>
                      <p className="text-xs text-foreground/60">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rpg-panel space-y-3">
              <h3 className="font-display text-xs tracking-widest text-foreground/50 uppercase">Frequência de intervenção</h3>
              <p className="text-[11px] text-foreground/50">Quantos exercícios o Despertar gera e quando o Confronto dispara.</p>
              {freqs.map(opt => {
                const sel = ai.interventionFrequency === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setState(prev => ({ ...prev, aiSettings: { ...(prev.aiSettings || ai), interventionFrequency: opt.value } }))}
                    className={cn(
                      'w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all',
                      sel ? 'border-primary/50 bg-primary/10' : 'border-border hover:border-primary/30 hover:bg-secondary/50'
                    )}
                  >
                    <div className={cn('w-4 h-4 rounded-full border-2 mt-0.5 shrink-0', sel ? 'border-primary bg-primary' : 'border-muted-foreground')} />
                    <div>
                      <p className={cn('text-sm font-display tracking-wider text-foreground', sel && 'text-primary')}>{opt.label}</p>
                      <p className="text-xs text-foreground/60">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rpg-panel">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-display tracking-wider text-foreground">Monstro da Procrastinação</p>
                  <p className="text-xs text-foreground/60">Símbolo que cresce nas falhas e enfraquece nas ações.</p>
                </div>
                <Switch
                  checked={ai.monsterEnabled !== false}
                  onCheckedChange={(checked) => setState(prev => ({ ...prev, aiSettings: { ...(prev.aiSettings || ai), monsterEnabled: checked } }))}
                />
              </div>
            </div>
          </div>
        );
      }

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
              <p className="text-xs text-foreground/50 pl-1">XP, nível, rank, ouro, missões, hábitos e histórico serão apagados.</p>

              <div className="border-t border-border my-2" />

              <Button
                variant="outline"
                className="w-full justify-start text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Conta
              </Button>
              <p className="text-xs text-foreground/50 pl-1">Todos os dados serão permanentemente removidos.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-foreground/60 hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display text-lg tracking-widest text-primary glow-text-purple">CONFIGURAÇÕES</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {isMobile ? (
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
                        : 'bg-secondary text-foreground/50'
                    )}>
                      <s.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-display tracking-wider">{s.label}</p>
                      <p className="text-xs text-foreground/50">{s.description}</p>
                    </div>
                    <ChevronDown className={cn(
                      'w-4 h-4 text-foreground/50 shrink-0 transition-transform duration-200',
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
                      : 'text-foreground/60 hover:text-foreground hover:bg-secondary/50',
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
      <p className="text-xs text-foreground/60 mt-1">{description}</p>
    </div>
  );
}
