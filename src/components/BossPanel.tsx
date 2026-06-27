import { useEffect, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Plus, Trophy, X, Pencil, Check, Flame, Zap, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { getTodayBrasilia } from '@/lib/utils';
import BossCoachChat from '@/components/BossCoachChat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';



const BOSS_TEMPLATES: Array<{
  name: string; emoji: string; desc: string; weakness?: string;
  days: number; tasks: string[];
}> = [
  { name: 'O Procrastinador', emoji: '🕷️', desc: 'Adia o que importa com promessas vazias.',
    weakness: 'Iniciar antes de pensar. Pomodoros curtos.',
    days: 21, tasks: ['Iniciar a tarefa principal em até 5min após acordar', '1 Pomodoro de 25min sem celular', 'Anotar a próxima ação concreta antes de dormir'] },
  { name: 'O Sedentário', emoji: '🦥', desc: 'Mantém você grudado na cadeira e no sofá.',
    weakness: 'Movimento curto, frequente, fora de casa.',
    days: 30, tasks: ['10min de caminhada', '20 polichinelos', '5min de alongamento', 'Beber 2L de água'] },
  { name: 'O Sabotador', emoji: '🐍', desc: 'Sussurra "não vai dar certo" antes de cada passo.',
    weakness: 'Registrar vitórias e reler.',
    days: 21, tasks: ['Anotar 1 vitória do dia', 'Falar uma frase de identidade em voz alta', 'Reler 1 vitória antiga'] },
  { name: 'Viciado em Dopamina', emoji: '📱', desc: 'Cobra rolagem, açúcar, notificações.',
    weakness: 'Atrito + substituição saudável.',
    days: 30, tasks: ['Sem redes antes do meio-dia', 'Ler 10min em vez de rolar', 'Beber água quando bater vontade', 'Pausa de 5min antes de ceder'] },
  { name: 'A Ansiedade', emoji: '🌪️', desc: 'Acelera o peito e turva o futuro.',
    weakness: 'Respiração, corpo, presente.',
    days: 21, tasks: ['5min de respiração 4-7-8', '5min de caminhada lenta', 'Anotar o pensamento que ataca'] },
  { name: 'O Mestre das Desculpas', emoji: '🎭', desc: 'Tem uma justificativa pronta pra tudo.',
    weakness: 'Ação mínima imediata.',
    days: 21, tasks: ['Fazer a tarefa mínima de 2min', 'Marcar 1 hábito mesmo cansado', 'Anotar a desculpa antes de obedecê-la'] },
];

export default function BossPanel() {
  const {
    state, addBoss, updateBoss, clearBossMockery, completeBossTask, uncompleteBossTask,
    addBossTask, editBossTask, removeBossTask, settleBossesForToday,
    defeatBoss, removeBoss, recordBossReinforcement,
  } = useGame();
  const bosses = state.bosses || [];
  const active = bosses.filter(b => !b.defeatedAt);
  const defeated = bosses.filter(b => b.defeatedAt);
  const today = getTodayBrasilia();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hitFx, setHitFx] = useState<Record<string, number>>({});
  const [lastAngle, setLastAngle] = useState<string>('');
  const [mockeryShown, setMockeryShown] = useState<Record<string, string>>({});

  useEffect(() => { settleBossesForToday(); }, [settleBossesForToday]);

  // === Reagir a regen do boss → buscar deboche da IA ===
  useEffect(() => {
    active.forEach(async (b) => {
      if (!b.pendingMockery) return;
      const key = `${b.id}:${b.pendingMockery.at}`;
      if (mockeryShown[key]) return;
      setMockeryShown(s => ({ ...s, [key]: 'loading' }));
      try {
        const ctx = {
          boss: {
            nome: b.name, emoji: b.emoji, descricao: b.description,
            hpAtual: b.hp, hpMax: b.maxHp, hpRecuperado: b.pendingMockery.hpRegained,
            diasFalhados: b.pendingMockery.missedDays,
            historia: b.story, frasesPersonalizadas: b.customPhrases || [],
            comoAfeta: b.howItAffectsMe, porQueDerrotar: b.whyDefeat,
          },
          player: {
            nivel: state.level, streak: state.streak,
            alterEgo: state.alterEgo ? {
              nome: state.alterEgo.name, valores: state.alterEgo.values,
              frase: state.alterEgo.identityPhrase, sonhos: state.alterEgo.notes,
            } : null,
          },
        };
        const { data, error } = await supabase.functions.invoke('boss-mockery', { body: { context: ctx } });
        const msg: string = (!error && data?.message) ? data.message : `*Você sumiu de novo…* Eu agradeço. Cada dia que você me alimenta, mais perto fico de enterrar aquilo que você jura querer ser.`;
        clearBossMockery(b.id, msg);
        if ('vibrate' in navigator) navigator.vibrate?.([60, 40, 60]);
        toast.custom(() => (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="rpg-panel max-w-sm border-red-500/60 bg-gradient-to-br from-red-950/80 via-background to-red-950/40"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{b.emoji}</span>
              <span className="font-display text-xs tracking-[0.2em] text-red-400">VOZ DE {b.name.toUpperCase()}</span>
            </div>
            <div className="text-sm text-red-100 leading-relaxed italic">
              <ReactMarkdown>{msg}</ReactMarkdown>
            </div>
            <p className="text-[10px] text-red-300/70 mt-2">+{b.pendingMockery?.hpRegained} HP recuperados em {b.pendingMockery?.missedDays} dia(s) sem ação.</p>
          </motion.div>
        ), { duration: 11000 });
      } catch (e) {
        console.error('boss-mockery error', e);
        clearBossMockery(b.id);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.map(b => b.pendingMockery?.at || '').join('|')]);

  const damageFor = (combo: number) => combo >= 20 ? 4 : combo >= 10 ? 3 : combo >= 5 ? 2 : 1;

  const askReinforcement = async (boss: typeof bosses[number], taskTitle: string) => {
    try {
      const areas = (state.lifeAreas || []).filter(a => (boss.affectedAreaIds || []).includes(a.id));
      const totalDone = (boss.tasks || []).reduce((s, t) => s + t.doneDates.length, 0);
      const ctx = {
        ultimoAngulo: lastAngle || null,
        tarefaConcluida: taskTitle,
        boss: {
          nome: boss.name, emoji: boss.emoji, hpAtual: boss.hp, hpMax: boss.maxHp,
          combo: boss.combo, melhorCombo: boss.bestCombo, dias: boss.days,
          comoAfeta: boss.howItAffectsMe, porQueDerrotar: boss.whyDefeat,
          areasAfetadas: areas.map(a => `${a.icon} ${a.name} (nível ${a.level})`),
          frasesPersonalizadas: boss.customPhrases || [],
        },
        player: {
          nivel: state.level, rank: state.rank, streak: state.streak,
          alterEgo: state.alterEgo ? { nome: state.alterEgo.name, valores: state.alterEgo.values, frase: state.alterEgo.identityPhrase, notas: state.alterEgo.notes } : null,
          totalHabitos: (state.habits || []).length,
          tarefasConcluidasNesteBoss: totalDone + 1,
        },
      };
      const { data, error } = await supabase.functions.invoke('attack-reinforcement', { body: { context: ctx } });
      if (error || !data?.message) return;
      const msg: string = data.message;
      setLastAngle(msg.slice(0, 80));
      recordBossReinforcement(boss.id, msg, taskTitle);
      toast.custom(() => (
        <div className="rpg-panel max-w-sm border-primary/50">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display text-xs tracking-wider text-primary">VOZ DO ALTER EGO</span>
          </div>
          <div className="text-sm text-foreground leading-relaxed">
            <ReactMarkdown>{msg}</ReactMarkdown>
          </div>
        </div>
      ), { duration: 7000 });
    } catch (e) {
      console.error('reinforcement error', e);
    }
  };

  const onComplete = (boss: typeof bosses[number], taskId: string, combo: number) => {
    const task = (boss.tasks || []).find(t => t.id === taskId);
    completeBossTask(boss.id, taskId);
    setHitFx(s => ({ ...s, [taskId]: damageFor(combo) }));
    if ('vibrate' in navigator) navigator.vibrate?.(40);
    setTimeout(() => setHitFx(s => { const n = { ...s }; delete n[taskId]; return n; }), 900);
    if (task) askReinforcement(boss, task.title);
  };


  return (
    <div className="space-y-5">
      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-3">
          <Skull className="w-5 h-5 text-red-400" />
          <div className="min-w-0">
            <h2 className="font-display text-lg tracking-wider text-red-400">BOSS BATTLES</h2>
            <p className="text-xs text-foreground/60">Cada tarefa cumprida fere o comportamento. Combos multiplicam o dano.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40">
            <Plus className="w-3 h-3 mr-1" /> Invocar Boss
          </Button>
        </div>

        {active.length === 0 ? (
          <p className="text-sm text-foreground/60">Nenhum boss ativo. Escolha um comportamento que quer eliminar e invoque-o como inimigo externo.</p>
        ) : (
          <div className="space-y-4">
            {active.map(b => (
              <div key={b.id} className="space-y-3">
                <BossCard
                  boss={b}
                  today={today}
                  hitFx={hitFx}
                  onComplete={(taskId, combo) => onComplete(b, taskId, combo)}
                  onUncomplete={(taskId) => uncompleteBossTask(b.id, taskId)}
                  onAddTask={(title) => addBossTask(b.id, title)}
                  onEditTask={(taskId, title) => editBossTask(b.id, taskId, title)}
                  onRemoveTask={(taskId) => removeBossTask(b.id, taskId)}
                  onDefeat={() => defeatBoss(b.id)}
                  onRemove={() => removeBoss(b.id)}
                  onEdit={() => setEditingId(b.id)}
                />
                <BossCoachChat bossId={b.id} />
              </div>
            ))}

          </div>
        )}
      </div>

      {defeated.length > 0 && (
        <div className="rpg-panel">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="font-display tracking-wider text-gold">BOSSES DERROTADOS</h3>
          </div>
          <div className="space-y-2">
            {defeated.map(b => (
              <div key={b.id} className="p-3 rounded-lg border border-gold/30 bg-gold/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{b.emoji}</span>
                  <span className="font-display text-sm text-gold">{b.name}</span>
                  <span className="ml-auto text-[11px] text-foreground/50">
                    {b.defeatedAt ? new Date(b.defeatedAt).toLocaleDateString('pt-BR') : ''}
                  </span>
                </div>
                {b.defeatStats && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-foreground/70 mt-2">
                    <span>⏱ {b.defeatStats.daysTaken} dias</span>
                    <span>✅ {b.defeatStats.totalTasksDone} tarefas</span>
                    <span className="text-primary">+{b.defeatStats.xp} XP</span>
                    <span className="text-gold">+{b.defeatStats.gold} ouro</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <BossFormDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={(payload) => { addBoss(payload); setOpen(false); }}
      />
      <BossFormDialog
        open={!!editingId}
        onOpenChange={(o) => { if (!o) setEditingId(null); }}
        editBoss={active.find(b => b.id === editingId) || null}
        onSubmit={(payload) => {
          if (!editingId) return;
          updateBoss(editingId, {
            name: payload.name, emoji: payload.emoji, description: payload.description,
            weakness: payload.weakness, days: payload.days,
            tasks: payload.tasks.map(t => ({ id: crypto.randomUUID(), title: t.title, doneDates: [] })),
            imageUrl: payload.imageUrl, story: payload.story,
            affectedAreaIds: payload.affectedAreaIds,
            howItAffectsMe: payload.howItAffectsMe, whyDefeat: payload.whyDefeat,
            customPhrases: payload.customPhrases,
            difficulty: payload.difficulty, mainColor: payload.mainColor, hpBarColor: payload.hpBarColor,
          });
          setEditingId(null);
        }}
      />
    </div>
  );
}

// ====== Boss Card ======
function BossCard({
  boss, today, hitFx, onComplete, onUncomplete, onAddTask, onEditTask, onRemoveTask, onDefeat, onRemove, onEdit,
}: {
  boss: NonNullable<ReturnType<typeof useGame>['state']['bosses']>[number];
  today: string;
  hitFx: Record<string, number>;
  onComplete: (taskId: string, combo: number) => void;
  onUncomplete: (taskId: string) => void;
  onAddTask: (title: string) => void;
  onEditTask: (taskId: string, title: string) => void;
  onRemoveTask: (taskId: string) => void;
  onDefeat: () => void;
  onRemove: () => void;
  onEdit: () => void;
}) {
  const tasks = boss.tasks || [];
  const combo = boss.combo || 0;
  const dmg = combo >= 20 ? 4 : combo >= 10 ? 3 : combo >= 5 ? 2 : 1;
  const pct = Math.max(0, (boss.hp / boss.maxHp) * 100);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [newTask, setNewTask] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const lowHp = pct <= 25;

  return (
    <motion.div
      layout
      className="p-4 rounded-lg border bg-gradient-to-br from-red-950/40 via-background to-background relative overflow-hidden"
      style={{ borderColor: boss.mainColor || 'rgba(239,68,68,0.4)' }}
      animate={Object.keys(hitFx).length ? { x: [0, -3, 3, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start gap-3 mb-3">
        {boss.imageUrl ? (
          <img src={boss.imageUrl} alt={boss.name} className="w-14 h-14 rounded-lg object-cover border border-red-500/40" />
        ) : (
          <motion.div
            className="text-4xl"
            animate={lowHp ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >{boss.emoji}</motion.div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-display text-base text-red-300 flex items-center gap-2">
            {boss.name}
            {boss.difficulty && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40">{boss.difficulty}</span>}
          </div>
          <p className="text-xs text-foreground/70">{boss.description}</p>
          {boss.weakness && <p className="text-[11px] text-gold mt-1">⚡ Fraqueza: {boss.weakness}</p>}
        </div>
        <button onClick={onEdit} className="text-foreground/40 hover:text-primary" title="Editar boss"><Pencil className="w-4 h-4" /></button>
        <button onClick={onRemove} className="text-foreground/40 hover:text-red-400" title="Remover boss"><X className="w-4 h-4" /></button>
      </div>


      {/* (Bloco "Área afetada / COMO ME AFETA / POR QUE DERROTAR" removido do card ativo —
           informações permanecem salvas e são usadas pela IA + Editar boss) */}


      {/* HP Bar */}
      <div className="relative h-4 bg-background/70 rounded-full overflow-hidden border border-red-500/40">
        <motion.div
          className="absolute inset-y-0 left-0"
          style={boss.hpBarColor ? { background: boss.hpBarColor } : undefined}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        >
          {!boss.hpBarColor && <div className="h-full bg-gradient-to-r from-red-700 via-red-500 to-red-400" />}
        </motion.div>

        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-display text-white drop-shadow">
          {boss.hp} / {boss.maxHp} HP
        </span>
      </div>

      {/* Combo + Stats */}
      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px]">
        <div className="rounded-md bg-orange-500/10 border border-orange-500/30 py-1.5">
          <div className="flex items-center justify-center gap-1 text-orange-300"><Flame className="w-3 h-3" /> Combo</div>
          <div className="font-display text-orange-200 text-base">{combo}</div>
        </div>
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/30 py-1.5">
          <div className="flex items-center justify-center gap-1 text-yellow-300"><Zap className="w-3 h-3" /> Dano</div>
          <div className="font-display text-yellow-100 text-base">{dmg}/tarefa</div>
        </div>
        <div className="rounded-md bg-secondary/60 border border-border py-1.5">
          <div className="text-foreground/60">Plano</div>
          <div className="font-display text-foreground text-base">{boss.days || '—'}d</div>
        </div>
      </div>

      {/* Tarefas do dia */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-display tracking-wider text-red-300/80">TAREFAS DE HOJE</p>
          <button onClick={() => setShowEdit(s => !s)} className="text-[11px] text-foreground/60 hover:text-foreground flex items-center gap-1">
            <Pencil className="w-3 h-3" /> {showEdit ? 'Pronto' : 'Editar'}
          </button>
        </div>
        <AnimatePresence>
          {tasks.map(t => {
            const done = t.doneDates.includes(today);
            const fx = hitFx[t.id];
            return (
              <motion.div
                key={t.id}
                layout
                className={`relative flex items-center gap-2 p-2 rounded-md border ${done ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-red-500/20 bg-background/50'}`}
              >
                {editingId === t.id ? (
                  <>
                    <Input value={editVal} onChange={e => setEditVal(e.target.value)} className="h-7 text-xs" />
                    <Button size="sm" variant="ghost" onClick={() => { if (editVal.trim()) onEditTask(t.id, editVal.trim()); setEditingId(null); }}>
                      <Check className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => done ? onUncomplete(t.id) : onComplete(t.id, combo)}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500/30 border-emerald-500 text-emerald-300' : 'border-red-400/50 hover:bg-red-500/10'}`}
                    >
                      {done && <Check className="w-3 h-3" />}
                    </button>
                    <span className={`flex-1 text-xs ${done ? 'line-through text-foreground/50' : 'text-foreground'}`}>{t.title}</span>
                    {showEdit && (
                      <>
                        <button onClick={() => { setEditingId(t.id); setEditVal(t.title); }} className="text-foreground/50 hover:text-foreground">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => onRemoveTask(t.id)} className="text-foreground/50 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </>
                )}
                <AnimatePresence>
                  {fx && (
                    <motion.div
                      initial={{ opacity: 0, y: 0, scale: 0.8 }}
                      animate={{ opacity: 1, y: -20, scale: 1.2 }}
                      exit={{ opacity: 0, y: -32 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 font-display text-red-300 text-sm pointer-events-none"
                    >
                      -{fx} HP
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {showEdit && (
          <div className="flex gap-2 mt-2">
            <Input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="Nova tarefa diária…" className="h-8 text-xs" />
            <Button size="sm" variant="ghost" onClick={() => { if (newTask.trim()) { onAddTask(newTask.trim()); setNewTask(''); } }}>
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {boss.hp <= 0 && (
        <Button onClick={onDefeat} className="w-full mt-3 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40">
          <Trophy className="w-4 h-4 mr-1" /> Selar a vitória
        </Button>
      )}
    </motion.div>
  );
}

// ====== Boss Form Dialog (Create + Edit + AI Assist) ======
type CreatePayload = {
  name: string; emoji: string; description: string; weakness?: string;
  days: number; tasks: { title: string }[];
  imageUrl?: string; story?: string; affectedAreaIds?: string[];
  howItAffectsMe?: string; whyDefeat?: string; customPhrases?: string[];
  difficulty?: 'Fácil' | 'Normal' | 'Difícil' | 'Brutal';
  mainColor?: string; hpBarColor?: string;
};

type BossDraft = Omit<CreatePayload, 'tasks'> & { tasksText: string[] };

function AssistButton({ loading, onClick, title = 'Gerar com IA' }: { loading?: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      title={title}
      className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-md border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary disabled:opacity-50"
    >
      <motion.span
        animate={loading ? { rotate: 360 } : { rotate: 0 }}
        transition={loading ? { repeat: Infinity, duration: 1, ease: 'linear' } : {}}
      >
        <Sparkles className="w-4 h-4" />
      </motion.span>
    </button>
  );
}

function BossFormDialog({ open, onOpenChange, onSubmit, editBoss }: {
  open: boolean; onOpenChange: (b: boolean) => void;
  onSubmit: (p: CreatePayload) => void;
  editBoss?: NonNullable<ReturnType<typeof useGame>['state']['bosses']>[number] | null;
}) {
  const { state } = useGame();
  const lifeAreas = state.lifeAreas || [];
  const isEdit = !!editBoss;
  const [tab, setTab] = useState<'preset' | 'custom'>(isEdit ? 'custom' : 'preset');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('👹');
  const [desc, setDesc] = useState('');
  const [weakness, setWeakness] = useState('');
  const [days, setDays] = useState(21);
  const [tasks, setTasks] = useState<string[]>(['', '', '']);
  const [imageUrl, setImageUrl] = useState('');
  const [story, setStory] = useState('');
  const [howItAffectsMe, setHowItAffectsMe] = useState('');
  const [whyDefeat, setWhyDefeat] = useState('');
  const [customPhrasesText, setCustomPhrasesText] = useState('');
  const [areaIds, setAreaIds] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<'Fácil' | 'Normal' | 'Difícil' | 'Brutal'>('Normal');
  const [mainColor, setMainColor] = useState('#ef4444');
  const [hpBarColor, setHpBarColor] = useState('#ef4444');
  const [assisting, setAssisting] = useState<string | null>(null);

  // Hidrata ao editar
  useEffect(() => {
    if (!open) return;
    if (editBoss) {
      setTab('custom');
      setName(editBoss.name);
      setEmoji(editBoss.emoji || '👹');
      setDesc(editBoss.description || '');
      setWeakness(editBoss.weakness || '');
      setDays(editBoss.days || 21);
      setTasks((editBoss.tasks || []).map(t => t.title));
      setImageUrl(editBoss.imageUrl || '');
      setStory(editBoss.story || '');
      setHowItAffectsMe(editBoss.howItAffectsMe || '');
      setWhyDefeat(editBoss.whyDefeat || '');
      setCustomPhrasesText((editBoss.customPhrases || []).join('\n'));
      setAreaIds(editBoss.affectedAreaIds || []);
      setDifficulty(editBoss.difficulty || 'Normal');
      setMainColor(editBoss.mainColor || '#ef4444');
      setHpBarColor(editBoss.hpBarColor || '#ef4444');
    } else {
      setTab('preset');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editBoss?.id]);

  const reset = () => {
    setName(''); setEmoji('👹'); setDesc(''); setWeakness(''); setDays(21); setTasks(['', '', '']);
    setImageUrl(''); setStory(''); setHowItAffectsMe(''); setWhyDefeat(''); setCustomPhrasesText('');
    setAreaIds([]); setDifficulty('Normal'); setMainColor('#ef4444'); setHpBarColor('#ef4444');
  };

  const toggleArea = (id: string) =>
    setAreaIds(arr => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);

  const currentDraft = (): Record<string, unknown> => ({
    name, emoji, description: desc, weakness, days,
    imageUrl, story, howItAffectsMe, whyDefeat,
    customPhrases: customPhrasesText.split('\n').map(s => s.trim()).filter(Boolean),
    tasks: tasks.filter(t => t.trim()),
    affectedAreas: lifeAreas.filter(a => areaIds.includes(a.id)).map(a => a.name),
    difficulty,
  });

  const playerCtx = () => ({
    nivel: state.level, rank: state.rank, streak: state.streak,
    alterEgo: state.alterEgo ? {
      nome: state.alterEgo.name, valores: state.alterEgo.values,
      frase: state.alterEgo.identityPhrase, sonhos: state.alterEgo.notes,
    } : null,
    areasDeVida: (state.lifeAreas || []).map(a => `${a.icon} ${a.name}`),
    totalHabitos: (state.habits || []).length,
  });

  const assist = async (field: string) => {
    setAssisting(field);
    try {
      const { data, error } = await supabase.functions.invoke('boss-assist', {
        body: { field, draft: currentDraft(), player: playerCtx() },
      });
      if (error || !data?.value) { toast.error('IA indisponível agora.'); return; }
      const v: string = data.value;
      switch (field) {
        case 'name': setName(v.replace(/^["']|["']$/g, '').trim()); break;
        case 'emoji': setEmoji(v.trim().slice(0, 2)); break;
        case 'description': setDesc(v); break;
        case 'story': setStory(v); break;
        case 'howItAffectsMe': setHowItAffectsMe(v); break;
        case 'whyDefeat': setWhyDefeat(v); break;
        case 'weakness': setWeakness(v.replace(/^["']|["']$/g, '').trim()); break;
        case 'customPhrases': setCustomPhrasesText(v); break;
        case 'tasks': {
          const lines = v.split('\n').map(s => s.replace(/^[-•\d.)\s]+/, '').trim()).filter(Boolean);
          if (lines.length) setTasks(lines.slice(0, 8));
          break;
        }
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro ao chamar IA.');
    } finally {
      setAssisting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o && !isEdit) reset(); }}>
      <DialogContent className="bg-background border-red-500/40 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider text-red-400">
            {isEdit ? 'EDITAR BOSS' : 'INVOCAR BOSS'}
          </DialogTitle>
        </DialogHeader>

        {!isEdit && (
          <div className="flex gap-2 mb-3 border-b border-border">
            {(['preset', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 text-xs font-display tracking-wider border-b-2 -mb-px ${tab === t ? 'border-red-400 text-red-300' : 'border-transparent text-foreground/50'}`}>
                {t === 'preset' ? 'PRESETS' : 'CUSTOM'}
              </button>
            ))}
          </div>
        )}

        {(!isEdit && tab === 'preset') ? (
          <div className="grid sm:grid-cols-2 gap-2">
            {BOSS_TEMPLATES.map(t => {
              const hp = t.days * t.tasks.length;
              return (
                <button
                  key={t.name}
                  onClick={() => onSubmit({ name: t.name, emoji: t.emoji, description: t.desc, weakness: t.weakness, days: t.days, tasks: t.tasks.map(x => ({ title: x })) })}
                  className="text-left p-3 rounded-lg border border-red-500/30 bg-red-950/10 hover:bg-red-950/30 transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{t.emoji}</span>
                    <span className="font-display text-sm text-red-300">{t.name}</span>
                  </div>
                  <p className="text-[11px] text-foreground/60">{t.desc}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {t.tasks.map(tk => (
                      <span key={tk} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 border border-border text-foreground/70">{tk}</span>
                    ))}
                  </div>
                  <div className="text-[10px] text-gold mt-2">{t.days} dias × {t.tasks.length} tarefas = {hp} HP</div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-[60px_1fr_auto_auto] gap-2 items-center">
              <Input value={emoji} onChange={e => setEmoji(e.target.value.slice(0, 2))} className="text-center text-xl" />
              <Input placeholder="Nome do boss (ex: O Indeciso)" value={name} onChange={e => setName(e.target.value)} />
              <AssistButton loading={assisting === 'emoji'} onClick={() => assist('emoji')} title="Sugerir emoji" />
              <AssistButton loading={assisting === 'name'} onClick={() => assist('name')} title="Sugerir nome" />
            </div>

            <Input placeholder="URL da imagem (opcional)" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="text-xs" />

            <div className="flex gap-2 items-start">
              <Textarea placeholder="Como ele te ataca? Quando aparece?" value={desc} onChange={e => setDesc(e.target.value)} rows={2} className="text-xs flex-1" />
              <AssistButton loading={assisting === 'description'} onClick={() => assist('description')} />
            </div>

            <div className="flex gap-2 items-start">
              <Textarea placeholder="História / origem deste inimigo (opcional)" value={story} onChange={e => setStory(e.target.value)} rows={2} className="text-xs flex-1" />
              <AssistButton loading={assisting === 'story'} onClick={() => assist('story')} />
            </div>

            <div className="flex gap-2 items-start">
              <Textarea
                placeholder="Como este inimigo influencia minha vida?"
                value={howItAffectsMe} onChange={e => setHowItAffectsMe(e.target.value)} rows={3} className="text-xs flex-1"
              />
              <AssistButton loading={assisting === 'howItAffectsMe'} onClick={() => assist('howItAffectsMe')} />
            </div>

            <div className="flex gap-2 items-start">
              <Textarea
                placeholder="Por que quero derrotá-lo?"
                value={whyDefeat} onChange={e => setWhyDefeat(e.target.value)} rows={3} className="text-xs flex-1"
              />
              <AssistButton loading={assisting === 'whyDefeat'} onClick={() => assist('whyDefeat')} />
            </div>

            <div className="flex gap-2 items-center">
              <Input placeholder="Fraqueza (opcional)" value={weakness} onChange={e => setWeakness(e.target.value)} className="text-xs flex-1" />
              <AssistButton loading={assisting === 'weakness'} onClick={() => assist('weakness')} />
            </div>

            <div className="flex gap-2 items-start">
              <Textarea
                placeholder="Frases personalizadas (uma por linha)"
                value={customPhrasesText} onChange={e => setCustomPhrasesText(e.target.value)} rows={3} className="text-xs flex-1"
              />
              <AssistButton loading={assisting === 'customPhrases'} onClick={() => assist('customPhrases')} />
            </div>

            {/* Áreas afetadas */}
            <div>
              <p className="text-xs font-display tracking-wider text-red-300 mb-1">ÁREAS DE VIDA AFETADAS</p>
              {lifeAreas.length === 0 ? (
                <p className="text-[11px] text-foreground/50">Crie áreas na aba "Áreas" para conectar evolução pessoal.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {lifeAreas.map(a => {
                    const on = areaIds.includes(a.id);
                    return (
                      <button
                        key={a.id} type="button" onClick={() => toggleArea(a.id)}
                        className={`text-[11px] px-2 py-1 rounded border transition ${on ? 'border-primary bg-primary/15' : 'border-border bg-background/40 hover:bg-secondary/40'}`}
                        style={on ? { borderColor: a.color, background: a.color + '22' } : undefined}
                      >
                        <span className="mr-1">{a.icon}</span>{a.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dificuldade + Cores */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[11px] text-foreground/70">Dificuldade</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as 'Fácil' | 'Normal' | 'Difícil' | 'Brutal')} className="w-full h-9 rounded-md border border-border bg-background text-xs px-2">
                  {(['Fácil', 'Normal', 'Difícil', 'Brutal'] as const).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] text-foreground/70">Cor principal</label>
                <input type="color" value={mainColor} onChange={e => setMainColor(e.target.value)} className="w-full h-9 rounded-md border border-border bg-background" />
              </div>
              <div>
                <label className="text-[11px] text-foreground/70">Cor HP</label>
                <input type="color" value={hpBarColor} onChange={e => setHpBarColor(e.target.value)} className="w-full h-9 rounded-md border border-border bg-background" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs text-foreground/70">Dias da batalha:</label>
              <Input type="number" min={7} max={120} value={days} onChange={e => setDays(Math.max(1, parseInt(e.target.value) || 1))} className="w-24 text-center" />
              <span className="text-[11px] text-foreground/50">HP = {days} × {tasks.filter(t => t.trim()).length || 1} = <strong className="text-red-300">{days * (tasks.filter(t => t.trim()).length || 1)}</strong></span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-display tracking-wider text-red-300">TAREFAS DIÁRIAS</p>
                <div className="flex gap-1">
                  <AssistButton loading={assisting === 'tasks'} onClick={() => assist('tasks')} title="Sugerir tarefas" />
                  <Button size="sm" variant="ghost" onClick={() => setTasks(t => [...t, ''])} className="text-xs"><Plus className="w-3 h-3 mr-1" />Adicionar</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                {tasks.map((t, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={t} onChange={e => setTasks(arr => arr.map((x, j) => j === i ? e.target.value : x))} placeholder={`Tarefa ${i + 1}`} className="text-xs" />
                    <Button size="sm" variant="ghost" onClick={() => setTasks(arr => arr.filter((_, j) => j !== i))}><X className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            </div>
            <Button
              disabled={!name.trim() || tasks.filter(t => t.trim()).length === 0}
              onClick={() => onSubmit({
                name: name.trim(), emoji: emoji || '👹', description: desc.trim() || 'Padrão pessoal.',
                weakness: weakness.trim() || undefined, days,
                tasks: tasks.filter(t => t.trim()).map(t => ({ title: t.trim() })),
                imageUrl: imageUrl.trim() || undefined,
                story: story.trim() || undefined,
                howItAffectsMe: howItAffectsMe.trim() || undefined,
                whyDefeat: whyDefeat.trim() || undefined,
                customPhrases: customPhrasesText.split('\n').map(s => s.trim()).filter(Boolean),
                affectedAreaIds: areaIds,
                difficulty, mainColor, hpBarColor,
              })}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200"
            >
              {isEdit ? 'Salvar alterações' : 'Invocar Boss'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );


}
