import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import type { Mission, MissionType, MissionCategory, MissionDifficulty } from '@/lib/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Swords, Play, Square, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

const CATEGORIES: MissionCategory[] = ['Estudo', 'Trabalho', 'Treino', 'Leitura', 'Espiritual', 'Social', 'Saúde', 'Mental', 'Financeiro', 'Criatividade'];
const DIFFICULTIES: MissionDifficulty[] = ['Fácil', 'Normal', 'Difícil'];
const MISSION_TYPES: MissionType[] = ['Tempo', 'Diária', 'Contagem'];
const diffColors: Record<MissionDifficulty, string> = { 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' };
const typeIcons: Record<MissionType, React.ReactNode> = {
  'Tempo': <Clock className="w-3 h-3" />,
  'Diária': <Check className="w-3 h-3" />,
  'Contagem': <Hash className="w-3 h-3" />,
};

export default function MissionsPanel() {
  const { state, addMission, startTimeMission, completeTimeMission, completeDailyMission, incrementCountMission, deleteMission } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MissionCategory>('Estudo');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('Normal');
  const [missionType, setMissionType] = useState<MissionType>('Tempo');
  const [targetCount, setTargetCount] = useState(2);
  const [dailyXp, setDailyXp] = useState(10);
  const [dailyGold, setDailyGold] = useState(5);

  // Finish time mission dialog
  const [finishDialog, setFinishDialog] = useState<string | null>(null);
  const [executedHours, setExecutedHours] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addMission({
      name,
      category,
      difficulty,
      missionType,
      startedAt: null,
      executedHours: 0,
      lastCompletedDate: null,
      dailyXp: missionType === 'Diária' ? dailyXp : undefined,
      dailyGold: missionType === 'Diária' ? dailyGold : undefined,
      targetCount: missionType === 'Contagem' ? targetCount : undefined,
      currentCount: missionType === 'Contagem' ? 0 : undefined,
    });
    setName('');
    setShowForm(false);
    toast.success('Missão adicionada!');
  };

  const handleFinishTimeMission = () => {
    if (!finishDialog) return;
    const hours = parseFloat(executedHours);
    if (isNaN(hours) || hours <= 0) {
      toast.error('Informe um tempo válido.');
      return;
    }
    completeTimeMission(finishDialog, hours);
    toast.success(`Missão concluída! ${hours.toFixed(1)}h executada(s)`);
    setFinishDialog(null);
    setExecutedHours('');
  };

  const today = new Date().toISOString().split('T')[0];
  const active = state.missions.filter(m => m.status === 'Ativa');
  const completed = state.missions.filter(m => m.status === 'Concluída');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Swords className="w-5 h-5" /> MISSÕES
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rpg-panel space-y-3">
            <Input placeholder="Nome da missão" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
            <div className="grid grid-cols-3 gap-2">
              <Select value={missionType} onValueChange={(v) => setMissionType(v as MissionType)}>
                <SelectTrigger className="bg-secondary"><SelectValue placeholder="Tipo" /></SelectTrigger>
                <SelectContent>
                  {MISSION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => setCategory(v as MissionCategory)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as MissionDifficulty)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {missionType === 'Contagem' && (
              <div>
                <label className="text-xs text-muted-foreground">Quantidade diária</label>
                <Input type="number" min={1} value={targetCount} onChange={e => setTargetCount(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
            )}

            {missionType === 'Diária' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">XP (5-15)</label>
                  <Input type="number" min={5} max={15} value={dailyXp} onChange={e => setDailyXp(Number(e.target.value))} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ouro (5-10)</label>
                  <Input type="number" min={5} max={10} value={dailyGold} onChange={e => setDailyGold(Number(e.target.value))} className="bg-secondary border-border" />
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleAdd}>Adicionar Missão</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {active.map(m => (
          <MissionCard
            key={m.id}
            mission={m}
            today={today}
            onStart={() => startTimeMission(m.id)}
            onFinish={() => {
              if (m.startedAt) {
                const elapsed = (Date.now() - new Date(m.startedAt).getTime()) / 3600000;
                setExecutedHours(elapsed.toFixed(1));
              }
              setFinishDialog(m.id);
            }}
            onCompleteDaily={() => { completeDailyMission(m.id); toast.success('Diária concluída!'); }}
            onIncrementCount={() => { incrementCountMission(m.id); toast.success('+2 XP!'); }}
            onDelete={() => deleteMission(m.id)}
          />
        ))}
        {active.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma missão ativa.</p>
        )}
      </div>

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Concluídas</h3>
          {completed.slice(0, 5).map(m => (
            <MissionCard key={m.id} mission={m} today={today} />
          ))}
        </div>
      )}

      {/* Finish Time Mission Dialog */}
      <Dialog open={!!finishDialog} onOpenChange={() => setFinishDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Quanto tempo você realmente executou?</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Tempo em horas (ex: 0.5 = 30min, 1.5 = 1h30)</label>
            <Input
              type="number"
              step="0.1"
              min="0.1"
              value={executedHours}
              onChange={e => setExecutedHours(e.target.value)}
              className="bg-secondary border-border"
              placeholder="Ex: 1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFinishDialog(null)}>Cancelar</Button>
            <Button onClick={handleFinishTimeMission}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface MissionCardProps {
  mission: Mission;
  today: string;
  onStart?: () => void;
  onFinish?: () => void;
  onCompleteDaily?: () => void;
  onIncrementCount?: () => void;
  onDelete?: () => void;
}

function MissionCard({ mission, today, onStart, onFinish, onCompleteDaily, onIncrementCount, onDelete }: MissionCardProps) {
  const isDone = mission.status === 'Concluída';
  const isDailyDone = mission.missionType === 'Diária' && mission.lastCompletedDate === today;
  const isRunning = mission.missionType === 'Tempo' && !!mission.startedAt;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rpg-panel flex items-center gap-3 ${isDone || isDailyDone ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isDone ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {mission.name}
          </span>
          <span className={`text-[10px] font-display ${diffColors[mission.difficulty]}`}>{mission.difficulty}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
          <span className="flex items-center gap-1">{typeIcons[mission.missionType]} {mission.missionType}</span>
          <span>{mission.category}</span>
          {isRunning && <span className="text-primary animate-pulse-glow">⏱ Em andamento</span>}
          {mission.missionType === 'Contagem' && (
            <span>{mission.currentCount || 0}/{mission.targetCount || 0}</span>
          )}
          {isDone && mission.xpEarned !== undefined && (
            <span className="text-primary">+{mission.xpEarned} XP{mission.goldEarned ? ` | +${mission.goldEarned} 🪙` : ''}</span>
          )}
          {isDailyDone && <span className="text-success">✔️ Feita hoje</span>}
        </div>
      </div>

      {!isDone && (
        <div className="flex gap-1 flex-shrink-0">
          {mission.missionType === 'Tempo' && !isRunning && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={onStart} title="Iniciar">
              <Play className="w-4 h-4" />
            </Button>
          )}
          {mission.missionType === 'Tempo' && isRunning && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-warning" onClick={onFinish} title="Finalizar">
              <Square className="w-4 h-4" />
            </Button>
          )}
          {mission.missionType === 'Diária' && !isDailyDone && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={onCompleteDaily} title="Completar">
              <Check className="w-4 h-4" />
            </Button>
          )}
          {mission.missionType === 'Contagem' && (mission.currentCount || 0) < (mission.targetCount || 0) && (
            <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={onIncrementCount} title="+1">
              <Plus className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
