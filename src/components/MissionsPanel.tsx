import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import type { Mission, MissionType, MissionCategory, MissionDifficulty } from '@/lib/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Swords, Play, Square, Hash, Video, ExternalLink, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function MissionsPanel() {
  const { state, addMission, startTimeMission, completeTimeMission, completeDailyMission, incrementCountMission, failMission, deleteMission } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MissionCategory>('Estudo');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('Normal');
  const [missionType, setMissionType] = useState<MissionType>('Tempo');
  const [targetCount, setTargetCount] = useState(2);
  const [dailyXp, setDailyXp] = useState(10);
  const [dailyGold, setDailyGold] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');

  // Finish time mission dialog
  const [finishDialog, setFinishDialog] = useState<string | null>(null);
  const [finishTime, setFinishTime] = useState('');
  const [finishStartedAt, setFinishStartedAt] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addMission({
      name,
      category,
      difficulty,
      missionType,
      videoUrl: videoUrl.trim() || undefined,
      startedAt: null,
      executedHours: 0,
      lastCompletedDate: null,
      dailyXp: missionType === 'Diária' ? dailyXp : undefined,
      dailyGold: missionType === 'Diária' ? dailyGold : undefined,
      targetCount: missionType === 'Contagem' ? targetCount : undefined,
      currentCount: missionType === 'Contagem' ? 0 : undefined,
    });
    setName('');
    setVideoUrl('');
    setShowForm(false);
    toast.success('Missão adicionada!');
  };

  const handleOpenFinishDialog = (mission: Mission) => {
    const now = new Date();
    setFinishTime(formatTime(now));
    setFinishStartedAt(mission.startedAt || now.toISOString());
    setFinishDialog(mission.id);
  };

  const handleFinishTimeMission = () => {
    if (!finishDialog) return;

    const startDate = new Date(finishStartedAt);
    const [endH, endM] = finishTime.split(':').map(Number);

    // Build end date using same day as start, with user-provided time
    const endDate = new Date(startDate);
    endDate.setHours(endH, endM, 0, 0);

    // If end time is earlier than start, check if it's next day scenario
    if (endDate.getTime() <= startDate.getTime()) {
      toast.error('Horário inválido — o horário final deve ser posterior ao início.');
      return;
    }

    const hours = (endDate.getTime() - startDate.getTime()) / 3600000;
    completeTimeMission(finishDialog, hours);

    const startStr = formatTime(startDate);
    toast.success(`Missão concluída! ${startStr} → ${finishTime} (${hours.toFixed(1)}h)`);
    setFinishDialog(null);
  };

  const today = new Date().toISOString().split('T')[0];
  const active = state.missions.filter(m => m.status === 'Ativa');
  const completed = state.missions.filter(m => m.status === 'Concluída');
  const failed = state.missions.filter(m => m.status === 'Falhada');

  // Get start time for dialog display
  const dialogMission = finishDialog ? state.missions.find(m => m.id === finishDialog) : null;

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

            {/* Video URL */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>

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
            onFinish={() => handleOpenFinishDialog(m)}
            onCompleteDaily={() => { completeDailyMission(m.id); toast.success('Diária concluída!'); }}
            onIncrementCount={() => { incrementCountMission(m.id); toast.success('+2 XP!'); }}
            onFail={() => failMission(m.id)}
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
            <DialogTitle className="font-display text-primary">Finalizar Missão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {dialogMission?.startedAt && (
              <div className="text-sm text-muted-foreground">
                ⏱ Início: <span className="text-foreground font-display">{formatTime(new Date(dialogMission.startedAt))}</span>
              </div>
            )}
            <div>
              <label className="text-sm text-muted-foreground">Hora que finalizei a tarefa</label>
              <Input
                type="time"
                value={finishTime}
                onChange={e => setFinishTime(e.target.value)}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Ajuste se necessário. O sistema calcula a duração automaticamente.</p>
            </div>
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
  const [showVideo, setShowVideo] = useState(false);
  const isDone = mission.status === 'Concluída';
  const isDailyDone = mission.missionType === 'Diária' && mission.lastCompletedDate === today;
  const isRunning = mission.missionType === 'Tempo' && !!mission.startedAt;
  const embedUrl = mission.videoUrl ? getEmbedUrl(mission.videoUrl) : null;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rpg-panel space-y-2 ${isDone || isDailyDone ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-3">
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
            {isRunning && (
              <span className="text-primary animate-pulse-glow">
                ⏱ Iniciado às {formatTime(new Date(mission.startedAt!))}
              </span>
            )}
            {mission.missionType === 'Contagem' && (
              <span>{mission.currentCount || 0}/{mission.targetCount || 0}</span>
            )}
            {isDone && mission.xpEarned !== undefined && (
              <span className="text-primary">+{mission.xpEarned} XP{mission.goldEarned ? ` | +${mission.goldEarned} 🪙` : ''}</span>
            )}
            {isDailyDone && <span className="text-success">✔️ Feita hoje</span>}
            {mission.videoUrl && (
              <button
                onClick={() => setShowVideo(!showVideo)}
                className="flex items-center gap-1 text-neon-blue hover:text-primary transition-colors"
              >
                <Video className="w-3 h-3" />
                {showVideo ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
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
      </div>

      {/* Video embed */}
      <AnimatePresence>
        {showVideo && mission.videoUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="pt-2 border-t border-border"
          >
            {embedUrl ? (
              <div className="aspect-video rounded-md overflow-hidden border border-border">
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Video"
                />
              </div>
            ) : (
              <a
                href={mission.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-neon-blue hover:text-primary transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Abrir vídeo
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
