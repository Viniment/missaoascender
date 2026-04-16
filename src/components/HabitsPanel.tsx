import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import type { MissionDifficulty } from '@/lib/gameStore';
import { getTodayBrasilia } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Sparkles, Video, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { VideoDialog, DescriptionDialog } from '@/components/ContentViewerDialog';
import RichEditor from '@/components/RichEditor';
import RewardPopup from '@/components/RewardPopup';
import { toast } from 'sonner';

const ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🎯', '🧠', '✍️', '🌅', '💤'];
const COLORS = ['#7B2FF7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const DIFFICULTIES: MissionDifficulty[] = ['Fácil', 'Normal', 'Difícil'];
const XP_MAP: Record<MissionDifficulty, number> = { 'Fácil': 3, 'Normal': 5, 'Difícil': 8 };
const GOLD_MAP: Record<MissionDifficulty, number> = { 'Fácil': 1, 'Normal': 2, 'Difícil': 3 };
const diffColors: Record<MissionDifficulty, string> = { 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' };

export default function HabitsPanel() {
  const { state, addHabit, markHabit, deleteHabit, editHabit } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [hasDescription, setHasDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState(COLORS[0]);
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('Normal');
  const [videoUrl, setVideoUrl] = useState('');
  const today = getTodayBrasilia();

  // Reward popup
  const [rewardPopup, setRewardPopup] = useState<{ open: boolean; xp: number; gold: number; title: string }>({ open: false, xp: 0, gold: 0, title: '' });
  // Edit habit dialog
  const [editDialog, setEditDialog] = useState<typeof state.habits[number] | null>(null);
  const [editName, setEditName] = useState('');
  const [editHasDescription, setEditHasDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');
  const [editIcon, setEditIcon] = useState('💪');
  const [editColor, setEditColor] = useState(COLORS[0]);
  const [editDifficulty, setEditDifficulty] = useState<MissionDifficulty>('Normal');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const openEditHabit = (h: typeof state.habits[number]) => {
    setEditDialog(h);
    setEditName(h.name);
    setEditHasDescription(!!h.description);
    setEditDescription(h.description || '');
    setEditIcon(h.icon);
    setEditColor(h.color);
    setEditDifficulty(h.difficulty);
    setEditVideoUrl(h.videoUrl || '');
  };

  const handleEditHabit = () => {
    if (submittingRef.current) return;
    if (!editDialog || !editName.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      editHabit(editDialog.id, { name: editName, description: editHasDescription && editDescription.trim() ? editDescription : undefined, icon: editIcon, color: editColor, difficulty: editDifficulty, videoUrl: editVideoUrl.trim() || undefined });
      setEditDialog(null);
      toast.success('Hábito editado!');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const handleAdd = () => {
    if (submittingRef.current) return;
    if (!name.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      // Auto-calculate end date: today + 30 days
      const todayDate = new Date(getTodayBrasilia() + 'T12:00:00');
      todayDate.setDate(todayDate.getDate() + 30);
      const endDate = todayDate.toISOString().split('T')[0];
      addHabit({ name, description: hasDescription && description.trim() ? description : undefined, icon, color, endDate, difficulty, videoUrl: videoUrl.trim() || undefined });
      setName('');
      setDescription('');
      setHasDescription(false);
      setVideoUrl('');
      setShowForm(false);
      toast.success('Hábito criado!');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const handleMark = (id: string, status: 'done' | 'failed', habitName: string, habitDifficulty: MissionDifficulty) => {
    const baseXp = XP_MAP[habitDifficulty] || 5;
    const baseGold = GOLD_MAP[habitDifficulty] || 2;
    markHabit(id, status);
    if (status === 'done') {
      setRewardPopup({ open: true, xp: baseXp, gold: baseGold, title: '✨ HÁBITO CONCLUÍDO' });
    } else {
      setRewardPopup({ open: true, xp: -(baseXp * 2), gold: 0, title: '💀 HÁBITO FALHADO' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Sparkles className="w-5 h-5" /> HÁBITOS
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Novo
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rpg-panel space-y-3">
            <Input placeholder="Nome do hábito" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={hasDescription} onCheckedChange={(v) => setHasDescription(!!v)} />
                <FileText className="w-3 h-3" /> Adicionar descrição
              </label>
              {hasDescription && (
                <RichEditor content={description} onChange={setDescription} placeholder="Descreva o hábito..." />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setIcon(i)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg ${icon === i ? 'bg-primary/20 ring-1 ring-primary' : 'bg-secondary'}`}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cor</label>
              <div className="flex gap-1 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-foreground' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Dificuldade</label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as MissionDifficulty)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Reward preview */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 py-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                Recompensa: <span className="text-primary font-display">+{XP_MAP[difficulty]} XP</span> + <span className="text-warning font-display">+{GOLD_MAP[difficulty]} 💰 {GOLD_MAP[difficulty] === 1 ? 'Moeda' : 'Moedas'}</span> | Falha: <span className="text-destructive font-display">-{XP_MAP[difficulty] * 2} XP</span>
              </span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Button className="w-full" onClick={handleAdd} disabled={submitting}>Criar Hábito</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {state.habits.map(h => (
          <HabitCard key={h.id} habit={h} today={today} onMark={handleMark} onEdit={() => openEditHabit(h)} />
        ))}
        {state.habits.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito criado.</p>
        )}
      </div>

      {state.habits.length > 0 && <HeatmapSection />}

      {/* Edit Habit Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Editar Hábito</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome do hábito" value={editName} onChange={e => setEditName(e.target.value)} className="bg-secondary border-border" />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={editHasDescription} onCheckedChange={(v) => setEditHasDescription(!!v)} />
                <FileText className="w-3 h-3" /> Adicionar descrição
              </label>
              {editHasDescription && (
                <RichEditor content={editDescription} onChange={setEditDescription} placeholder="Descreva o hábito..." />
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Ícone</label>
              <div className="flex gap-1 flex-wrap mt-1">
                {ICONS.map(i => (
                  <button key={i} onClick={() => setEditIcon(i)} className={`w-8 h-8 rounded-md flex items-center justify-center text-lg ${editIcon === i ? 'bg-primary/20 ring-1 ring-primary' : 'bg-secondary'}`}>{i}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Cor</label>
              <div className="flex gap-1 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setEditColor(c)} className={`w-7 h-7 rounded-full ${editColor === c ? 'ring-2 ring-foreground' : ''}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Dificuldade</label>
              <Select value={editDifficulty} onValueChange={(v) => setEditDifficulty(v as MissionDifficulty)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleEditHabit} disabled={submitting}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RewardPopup
        open={rewardPopup.open}
        onClose={() => setRewardPopup(p => ({ ...p, open: false }))}
        xp={rewardPopup.xp}
        gold={rewardPopup.gold}
        title={rewardPopup.title}
      />
    </div>
  );
}

function HabitCard({ habit: h, today, onMark, onEdit }: { habit: ReturnType<typeof useGame>['state']['habits'][number]; today: string; onMark: (id: string, status: 'done' | 'failed', name: string, diff: MissionDifficulty) => void; onEdit: () => void }) {
  const { deleteHabit } = useGame();
  const [showVideo, setShowVideo] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const todayStatus = h.history[today];
  const xp = XP_MAP[h.difficulty] || 5;
  const gold = GOLD_MAP[h.difficulty] || 2;
  const diffColor = diffColors[h.difficulty] || '';

  return (
    <motion.div layout className="rpg-panel glow-purple space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${h.color})` }}>{h.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-foreground truncate">{h.name}</span>
            <span className={`text-[10px] font-display ${diffColor}`}>{h.difficulty}</span>
            {h.description && (
              <button
                onClick={() => setShowDescription(true)}
                className="flex items-center gap-0.5 text-neon-blue hover:text-primary transition-colors"
                title="Ver descrição"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
            {h.videoUrl && (
              <button
                onClick={() => setShowVideo(true)}
                className="text-neon-blue hover:text-primary transition-colors"
                title="Ver vídeo"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {!todayStatus ? (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => onMark(h.id, 'done', h.name, h.difficulty)}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => onMark(h.id, 'failed', h.name, h.difficulty)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <span className={`text-xs font-display ${todayStatus === 'done' ? 'text-success' : 'text-destructive'}`}>
            {todayStatus === 'done' ? '✔️' : '❌'}
          </span>
        )}
        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit} title="Editar">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteHabit(h.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded font-display text-[10px]">⚡ +{xp} XP</span>
        <span className="inline-flex items-center gap-1 bg-warning/15 text-warning px-1.5 py-0.5 rounded font-display text-[10px]">💰 +{gold} {gold === 1 ? 'Moeda' : 'Moedas'}</span>
        <span className="inline-flex items-center gap-1 bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-display text-[10px]">💀 -{xp * 2} XP</span>
      </div>
      {h.description && (
        <DescriptionDialog
          open={showDescription}
          onOpenChange={setShowDescription}
          html={h.description}
          title={`📝 ${h.name}`}
        />
      )}
      {h.videoUrl && (
        <VideoDialog
          open={showVideo}
          onOpenChange={setShowVideo}
          videoUrl={h.videoUrl}
          title={`🎥 ${h.name}`}
        />
      )}
    </motion.div>
  );
}

function HeatmapSection() {
  const { state } = useGame();

  if (state.habits.length === 0) return null;

  const today = getTodayBrasilia();

  return (
    <div className="rpg-panel">
      <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Heatmap (30 dias)</h4>
      {state.habits.slice(0, 5).map(h => {
        // Start from earliest history date, or today if no history yet
        const dates = Object.keys(h.history).sort();
        const firstDate = new Date((dates[0] || today) + 'T12:00:00');
        const days = Array.from({ length: 30 }, (_, i) => {
          const d = new Date(firstDate);
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
        });

        return (
          <div key={h.id} className="mb-2">
            <div className="text-xs text-foreground mb-1">{h.icon} {h.name}</div>
            <div className="flex flex-row gap-0.5 flex-wrap">
              {days.map(d => {
                const status = h.history[d];
                return (
                  <div
                    key={d}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      backgroundColor: status === 'done' ? '#10B981' : status === 'failed' ? '#EF4444' : 'hsl(222 30% 14%)',
                    }}
                    title={`${d}: ${status || 'vazio'}`}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
