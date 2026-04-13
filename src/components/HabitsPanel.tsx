import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import type { MissionDifficulty } from '@/lib/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Sparkles, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VideoDialog } from '@/components/ContentViewerDialog';
import RewardPopup from '@/components/RewardPopup';
import { toast } from 'sonner';

const ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🎯', '🧠', '✍️', '🌅', '💤'];
const COLORS = ['#7B2FF7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
const DIFFICULTIES: MissionDifficulty[] = ['Fácil', 'Normal', 'Difícil'];
const XP_MAP: Record<MissionDifficulty, number> = { 'Fácil': 5, 'Normal': 10, 'Difícil': 20 };
const diffColors: Record<MissionDifficulty, string> = { 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' };

export default function HabitsPanel() {
  const { state, addHabit, markHabit, deleteHabit } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState(COLORS[0]);
  const [endDate, setEndDate] = useState('');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('Normal');
  const [videoUrl, setVideoUrl] = useState('');
  const today = new Date().toISOString().split('T')[0];

  // Reward popup
  const [rewardPopup, setRewardPopup] = useState<{ open: boolean; xp: number; gold: number; title: string }>({ open: false, xp: 0, gold: 0, title: '' });

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit({ name, icon, color, endDate, difficulty, videoUrl: videoUrl.trim() || undefined });
    setName('');
    setVideoUrl('');
    setShowForm(false);
    toast.success('Hábito criado!');
  };

  const handleMark = (id: string, status: 'done' | 'failed', habitName: string, habitDifficulty: MissionDifficulty) => {
    const baseXp = XP_MAP[habitDifficulty] || 10;
    markHabit(id, status);
    if (status === 'done') {
      setRewardPopup({ open: true, xp: baseXp, gold: 0, title: '✨ HÁBITO CONCLUÍDO' });
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
              <span>Recompensa: <span className="text-primary font-display">+{XP_MAP[difficulty]} XP</span> | Falha: <span className="text-destructive font-display">-{XP_MAP[difficulty] * 2} XP</span></span>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Data final</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Button className="w-full" onClick={handleAdd}>Criar Hábito</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {state.habits.map(h => (
          <HabitCard key={h.id} habit={h} today={today} onMark={handleMark} />
        ))}
        {state.habits.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito criado.</p>
        )}
      </div>

      {state.habits.length > 0 && <HeatmapSection />}

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

function HabitCard({ habit: h, today, onMark }: { habit: ReturnType<typeof useGame>['state']['habits'][number]; today: string; onMark: (id: string, status: 'done' | 'failed', name: string, diff: MissionDifficulty) => void }) {
  const { deleteHabit } = useGame();
  const [showVideo, setShowVideo] = useState(false);
  const todayStatus = h.history[today];
  const xp = ({ 'Fácil': 5, 'Normal': 10, 'Difícil': 20 } as Record<string, number>)[h.difficulty] || 10;
  const diffColor = ({ 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' } as Record<string, string>)[h.difficulty] || '';

  return (
    <motion.div layout className="rpg-panel flex items-center gap-3">
      <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${h.color})` }}>{h.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{h.name}</span>
          <span className={`text-[10px] font-display ${diffColor}`}>{h.difficulty}</span>
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
        <div className="text-xs text-muted-foreground">+{xp} XP / -{xp * 2} XP</div>
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
      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => deleteHabit(h.id)}>
        <Trash2 className="w-3.5 h-3.5" />
      </Button>

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
  const today = new Date();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 29 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="rpg-panel">
      <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Heatmap (30 dias)</h4>
      {state.habits.slice(0, 3).map(h => (
        <div key={h.id} className="mb-2">
          <div className="text-xs text-foreground mb-1">{h.icon} {h.name}</div>
          <div className="flex gap-0.5 flex-wrap">
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
      ))}
    </div>
  );
}
