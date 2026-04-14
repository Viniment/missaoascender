import { useState, useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import type { Mission, MissionType, MissionCategory, MissionDifficulty } from '@/lib/gameStore';
import { getTodayBrasilia } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Swords, Play, Square, Hash, Video, FileText, XCircle, Coins, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { VideoDialog, DescriptionDialog } from '@/components/ContentViewerDialog';
import RichEditor from '@/components/RichEditor';
import RewardPopup from '@/components/RewardPopup';
import { toast } from 'sonner';

const CATEGORIES: MissionCategory[] = ['Estudo', 'Trabalho', 'Treino', 'Leitura', 'Espiritual', 'Social', 'Saúde', 'Mental', 'Financeiro', 'Criatividade'];
const DIFFICULTIES: MissionDifficulty[] = ['Fácil', 'Normal', 'Difícil'];
const MISSION_TYPES: MissionType[] = ['Tempo', 'Diária', 'Contagem'];
const diffColors: Record<MissionDifficulty, string> = { 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' };
const XP_PER_HOUR: Record<MissionDifficulty, number> = { 'Fácil': 3, 'Normal': 5, 'Difícil': 8 };
const GOLD_PER_HOUR: Record<MissionDifficulty, number> = { 'Fácil': 1, 'Normal': 2, 'Difícil': 3 };
const typeIcons: Record<MissionType, React.ReactNode> = {
  'Tempo': <Clock className="w-3 h-3" />,
  'Diária': <Check className="w-3 h-3" />,
  'Contagem': <Hash className="w-3 h-3" />,
};

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getNowTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export default function MissionsPanel() {
  const { state, addMission, editMission, startTimeMission, completeTimeMission, completeDailyMission, incrementCountMission, failMission, deleteMission } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MissionCategory>('Estudo');
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('Normal');
  const [missionType, setMissionType] = useState<MissionType>('Tempo');
  const [targetCount, setTargetCount] = useState(2);
  const [dailyXp, setDailyXp] = useState(10);
  const [dailyGold, setDailyGold] = useState(5);
  const [videoUrl, setVideoUrl] = useState('');
  const [hasDescription, setHasDescription] = useState(false);
  const [description, setDescription] = useState('');
  const [startTimeDialog, setStartTimeDialog] = useState<string | null>(null);
  const [startTimeInput, setStartTimeInput] = useState(getNowTimeString());

  // Finish time mission dialog
  const [finishDialog, setFinishDialog] = useState<string | null>(null);
  const [finishTime, setFinishTime] = useState('');
  const [finishStartedAt, setFinishStartedAt] = useState('');

  // Reward popup
  const [rewardPopup, setRewardPopup] = useState<{ open: boolean; xp: number; gold: number; title: string }>({ open: false, xp: 0, gold: 0, title: '' });

  // Edit mission dialog
  const [editDialog, setEditDialog] = useState<Mission | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<MissionCategory>('Estudo');
  const [editDifficulty, setEditDifficulty] = useState<MissionDifficulty>('Normal');
  const [editVideoUrl, setEditVideoUrl] = useState('');
  const [editDailyXp, setEditDailyXp] = useState(10);
  const [editDailyGold, setEditDailyGold] = useState(5);
  const [editTargetCount, setEditTargetCount] = useState(2);
  const [editHasDescription, setEditHasDescription] = useState(false);
  const [editDescription, setEditDescription] = useState('');

  const openEditDialog = (m: Mission) => {
    setEditDialog(m);
    setEditName(m.name);
    setEditCategory(m.category);
    setEditDifficulty(m.difficulty);
    setEditVideoUrl(m.videoUrl || '');
    setEditHasDescription(!!m.description);
    setEditDescription(m.description || '');
    setEditDailyXp(m.dailyXp || 10);
    setEditDailyGold(m.dailyGold || 5);
    setEditTargetCount(m.targetCount || 2);
  };

  const handleEdit = () => {
    if (!editDialog || !editName.trim()) return;
    editMission(editDialog.id, {
      name: editName,
      category: editCategory,
      difficulty: editDifficulty,
      videoUrl: editVideoUrl.trim() || undefined,
      description: editHasDescription && editDescription.trim() ? editDescription : undefined,
      ...(editDialog.missionType === 'Diária' ? { dailyXp: editDailyXp, dailyGold: editDailyGold } : {}),
      ...(editDialog.missionType === 'Contagem' ? { targetCount: editTargetCount } : {}),
    });
    setEditDialog(null);
    toast.success('Missão editada!');
  };

  const handleAdd = () => {
    if (!name.trim()) return;

    addMission({
      name,
      category,
      difficulty,
      missionType,
      videoUrl: videoUrl.trim() || undefined,
      description: hasDescription && description.trim() ? description : undefined,
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
    setDescription('');
    setHasDescription(false);
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

    const endDate = new Date(startDate);
    endDate.setHours(endH, endM, 0, 0);

    // Se o horário final parece anterior, assume que cruzou meia-noite
    if (endDate.getTime() <= startDate.getTime()) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const hours = (endDate.getTime() - startDate.getTime()) / 3600000;
    const mission = state.missions.find(m => m.id === finishDialog);
    if (mission) {
      const xp = Math.floor(hours * XP_PER_HOUR[mission.difficulty]);
      const gold = Math.floor(hours * GOLD_PER_HOUR[mission.difficulty]);
      completeTimeMission(finishDialog, hours);
      setRewardPopup({ open: true, xp, gold, title: '⚔️ MISSÃO CONCLUÍDA' });
    }

    setFinishDialog(null);
  };

  const handleCompleteDaily = (id: string) => {
    const mission = state.missions.find(m => m.id === id);
    if (!mission) return;
    const xp = mission.dailyXp || 5;
    const gold = mission.dailyGold || 5;
    completeDailyMission(id);
    setRewardPopup({ open: true, xp, gold, title: '⚔️ DIÁRIA CONCLUÍDA' });
  };

  const handleIncrementCount = (id: string) => {
    const mission = state.missions.find(m => m.id === id);
    if (!mission) return;
    const newCount = (mission.currentCount || 0) + 1;
    const target = mission.targetCount || 1;
    const isComplete = newCount >= target;
    const xp = isComplete ? 7 : 2;
    incrementCountMission(id);
    setRewardPopup({ open: true, xp, gold: 0, title: isComplete ? '⚔️ CONTAGEM COMPLETA' : '⚔️ +1 CONTAGEM' });
  };

  const handleFail = (id: string) => {
    const mission = state.missions.find(m => m.id === id);
    if (!mission) return;
    const baseXp = XP_PER_HOUR[mission.difficulty];
    const penaltyXp = -(baseXp * 2);
    failMission(id);
    setRewardPopup({ open: true, xp: penaltyXp, gold: 0, title: '💀 MISSÃO FALHADA' });
  };

  const today = getTodayBrasilia();
  const active = state.missions.filter(m => m.status === 'Ativa');
  const completed = state.missions.filter(m => m.status === 'Concluída');
  const failed = state.missions.filter(m => m.status === 'Falhada');

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

            {/* Reward preview */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground bg-secondary/50 rounded-md px-3 py-2">
              <Coins className="w-3.5 h-3.5 text-warning" />
              {missionType === 'Tempo' && <span>Recompensa: <span className="text-primary font-display">{XP_PER_HOUR[difficulty]} XP</span> / <span className="text-warning font-display">{GOLD_PER_HOUR[difficulty]} 💰 {GOLD_PER_HOUR[difficulty] === 1 ? 'Moeda' : 'Moedas'}</span> [ Por Hora ] | Falha: <span className="text-destructive font-display">-{XP_PER_HOUR[difficulty] * 2} XP</span></span>}
              {missionType === 'Diária' && <span>Recompensa: <span className="text-primary font-display">+{dailyXp} XP</span> + <span className="text-warning font-display">+{dailyGold} 💰 {dailyGold === 1 ? 'Moeda' : 'Moedas'}</span></span>}
              {missionType === 'Contagem' && <span>Recompensa: <span className="text-primary font-display">+2 XP/vez</span> + <span className="text-primary font-display">+5 XP bônus</span> ao completar</span>}
            </div>

            {/* Video URL */}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>

            {/* Description toggle + editor */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={hasDescription} onCheckedChange={(v) => setHasDescription(!!v)} />
                <FileText className="w-3 h-3" /> Adicionar descrição
              </label>
              {hasDescription && (
                <RichEditor content={description} onChange={setDescription} placeholder="Descreva a missão..." />
              )}
            </div>

            <Button className="w-full" onClick={handleAdd}>Adicionar Missão</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Time Mission Dialog */}
      <Dialog open={!!startTimeDialog} onOpenChange={() => setStartTimeDialog(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Iniciar Missão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-muted-foreground">Hora que iniciei a tarefa</label>
              <Input
                type="time"
                value={startTimeInput}
                onChange={e => setStartTimeInput(e.target.value)}
                className="bg-secondary border-border"
              />
              <p className="text-xs text-muted-foreground mt-1">Padrão: hora atual. Ajuste se já iniciou antes.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStartTimeDialog(null)}>Cancelar</Button>
            <Button onClick={() => {
              if (!startTimeDialog) return;
              const [h, m] = startTimeInput.split(':').map(Number);
              const now = new Date();
              now.setHours(h, m, 0, 0);
              startTimeMission(startTimeDialog, now.toISOString());
              setStartTimeDialog(null);
              toast.success('Missão iniciada!');
            }}>Iniciar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {active.map(m => (
          <MissionCard
            key={m.id}
            mission={m}
            today={today}
            onStart={() => { setStartTimeInput(getNowTimeString()); setStartTimeDialog(m.id); }}
            onFinish={() => handleOpenFinishDialog(m)}
            onCompleteDaily={() => handleCompleteDaily(m.id)}
            onIncrementCount={() => handleIncrementCount(m.id)}
            onFail={() => handleFail(m.id)}
            onDelete={() => deleteMission(m.id)}
            onEdit={() => openEditDialog(m)}
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

      {failed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-destructive uppercase tracking-wider">Falhadas</h3>
          {failed.slice(0, 5).map(m => (
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
            {dialogMission?.startedAt && finishTime && (() => {
              const startDate = new Date(dialogMission.startedAt);
              const [eh, em] = finishTime.split(':').map(Number);
              const endDate = new Date(startDate);
              endDate.setHours(eh, em, 0, 0);
              if (endDate.getTime() <= startDate.getTime()) endDate.setDate(endDate.getDate() + 1);
              if (endDate.getTime() > startDate.getTime()) {
                const hours = (endDate.getTime() - startDate.getTime()) / 3600000;
                const xp = Math.floor(hours * XP_PER_HOUR[dialogMission.difficulty]);
                const gold = Math.floor(hours * GOLD_PER_HOUR[dialogMission.difficulty]);
                return (
                  <div className="bg-secondary/50 rounded-md px-3 py-2 text-sm space-y-1">
                    <div className="text-muted-foreground">Duração: <span className="text-foreground font-display">{hours.toFixed(1)}h</span></div>
                    <div className="text-primary font-display">+{xp} XP</div>
                    <div className="text-warning font-display">+{gold} 💰 {gold === 1 ? 'Moeda' : 'Moedas'}</div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFinishDialog(null)}>Cancelar</Button>
            <Button onClick={handleFinishTimeMission}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Mission Dialog */}
      <Dialog open={!!editDialog} onOpenChange={() => setEditDialog(null)}>
        <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-primary">Editar Missão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nome da missão" value={editName} onChange={e => setEditName(e.target.value)} className="bg-secondary border-border" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={editCategory} onValueChange={(v) => setEditCategory(v as MissionCategory)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={editDifficulty} onValueChange={(v) => setEditDifficulty(v as MissionDifficulty)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {editDialog?.missionType === 'Diária' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">XP</label>
                  <Input type="number" min={5} max={15} value={editDailyXp} onChange={e => setEditDailyXp(Number(e.target.value))} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Ouro</label>
                  <Input type="number" min={5} max={10} value={editDailyGold} onChange={e => setEditDailyGold(Number(e.target.value))} className="bg-secondary border-border" />
                </div>
              </div>
            )}
            {editDialog?.missionType === 'Contagem' && (
              <div>
                <label className="text-xs text-muted-foreground">Quantidade</label>
                <Input type="number" min={1} value={editTargetCount} onChange={e => setEditTargetCount(Number(e.target.value))} className="bg-secondary border-border" />
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground flex items-center gap-1"><Video className="w-3 h-3" /> Vídeo (opcional)</label>
              <Input placeholder="https://youtube.com/watch?v=..." value={editVideoUrl} onChange={e => setEditVideoUrl(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox checked={editHasDescription} onCheckedChange={(v) => setEditHasDescription(!!v)} />
                <FileText className="w-3 h-3" /> Adicionar descrição
              </label>
              {editHasDescription && (
                <RichEditor content={editDescription} onChange={setEditDescription} placeholder="Descreva a missão..." />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditDialog(null)}>Cancelar</Button>
            <Button onClick={handleEdit}>Salvar</Button>
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

interface MissionCardProps {
  mission: Mission;
  today: string;
  onStart?: () => void;
  onFinish?: () => void;
  onCompleteDaily?: () => void;
  onIncrementCount?: () => void;
  onFail?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
}

function MissionCard({ mission, today, onStart, onFinish, onCompleteDaily, onIncrementCount, onFail, onDelete, onEdit }: MissionCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showFailConfirm, setShowFailConfirm] = useState(false);
  const [elapsed, setElapsed] = useState('');
  const isDone = mission.status === 'Concluída';
  const isFailed = mission.status === 'Falhada';
  const isDailyDone = mission.missionType === 'Diária' && mission.lastCompletedDate === today;
  const isRunning = mission.missionType === 'Tempo' && !!mission.startedAt;

  // Live timer for running time missions
  useEffect(() => {
    if (!isRunning || !mission.startedAt) return;
    const update = () => {
      const diff = Date.now() - new Date(mission.startedAt!).getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      if (h > 0) {
        setElapsed(`${h} h ${String(m).padStart(2, '0')} min`);
      } else {
        setElapsed(`${m} min`);
      }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [isRunning, mission.startedAt]);

  // Calculate live XP/gold for running time missions
  const liveRewards = isRunning && mission.startedAt ? (() => {
    const hours = (Date.now() - new Date(mission.startedAt).getTime()) / 3600000;
    return {
      xp: Math.floor(hours * XP_PER_HOUR[mission.difficulty]),
      gold: Math.floor(hours * GOLD_PER_HOUR[mission.difficulty]),
    };
  })() : null;

  // Reward info for non-running missions
  const rewardInfo = (() => {
    if (isDone || isFailed) return null;
    if (mission.missionType === 'Tempo' && !isRunning) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded font-display text-[10px]">⚡ {XP_PER_HOUR[mission.difficulty]} XP</span>
          <span className="inline-flex items-center gap-1 bg-warning/15 text-warning px-1.5 py-0.5 rounded font-display text-[10px]">💰 {GOLD_PER_HOUR[mission.difficulty]} {GOLD_PER_HOUR[mission.difficulty] === 1 ? 'Moeda' : 'Moedas'}</span>
          <span className="text-muted-foreground text-[10px] font-display">[ Por Hora ]</span>
        </span>
      );
    }
    if (mission.missionType === 'Diária' && !isDailyDone) {
      return (
        <span className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded font-display text-[10px]">⚡ +{mission.dailyXp || 5} XP</span>
          <span className="inline-flex items-center gap-1 bg-warning/15 text-warning px-1.5 py-0.5 rounded font-display text-[10px]">💰 +{mission.dailyGold || 5} {(mission.dailyGold || 5) === 1 ? 'Moeda' : 'Moedas'}</span>
        </span>
      );
    }
    if (mission.missionType === 'Contagem' && (mission.currentCount || 0) < (mission.targetCount || 0)) {
      return <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded font-display text-[10px]">⚡ +2 XP/vez</span>;
    }
    return null;
  })();

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`rpg-panel space-y-2 ${isDone || isDailyDone ? 'opacity-60' : ''} ${isFailed ? 'opacity-50 border-destructive/30' : ''}`}
    >
      {/* Linha 1: nome + dificuldade + ícones + botões de ação */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-sm font-semibold truncate ${isDone ? 'line-through text-muted-foreground' : isFailed ? 'line-through text-destructive' : 'text-foreground'}`}>
              {mission.name}
            </span>
            <span className={`text-[10px] font-display ${diffColors[mission.difficulty]}`}>{mission.difficulty}</span>
            {mission.description && (
              <button
                onClick={() => setShowDescription(true)}
                className="flex items-center gap-0.5 text-neon-blue hover:text-primary transition-colors"
                title="Ver descrição"
              >
                <FileText className="w-3.5 h-3.5" />
              </button>
            )}
            {mission.videoUrl && (
              <button
                onClick={() => setShowVideo(true)}
                className="flex items-center gap-0.5 text-neon-blue hover:text-primary transition-colors"
                title="Ver vídeo"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {!isDone && !isFailed && (
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
            <Button size="icon" variant="ghost" className="h-8 w-8 text-warning hover:text-destructive" onClick={() => setShowFailConfirm(true)} title="Marcar como falhada">
              <XCircle className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={onEdit} title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Linha 2: tipo, categoria, badges de XP/moedas, status */}
      <div className="flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
        <span className="flex items-center gap-1">{typeIcons[mission.missionType]} {mission.missionType}</span>
        <span>{mission.category}</span>
        {isRunning && liveRewards && (
          <span className="flex items-center gap-1 text-primary/70 font-display">
            <span className="inline-flex items-center gap-1 bg-primary/15 text-primary px-1.5 py-0.5 rounded text-[10px]">⚡ {liveRewards.xp} XP</span>
            <span className="inline-flex items-center gap-1 bg-warning/15 text-warning px-1.5 py-0.5 rounded text-[10px]">💰 {liveRewards.gold} {liveRewards.gold === 1 ? 'Moeda' : 'Moedas'}</span>
            <span className="text-muted-foreground text-[10px]">-</span> <span className="text-primary animate-pulse-glow">{elapsed}</span>
          </span>
        )}
        {mission.missionType === 'Contagem' && (
          <span>{mission.currentCount || 0}/{mission.targetCount || 0}</span>
        )}
        {isDone && mission.xpEarned !== undefined && (
          <span className="text-primary">+{mission.xpEarned} XP{mission.goldEarned ? ` | +${mission.goldEarned} 💰 ${mission.goldEarned === 1 ? 'Moeda' : 'Moedas'}` : ''}</span>
        )}
        {isDailyDone && <span className="text-success">✔️ Feita hoje</span>}
        {isFailed && <span className="text-destructive">❌ Falhada</span>}
        {rewardInfo}
      </div>

      {/* Fail confirmation dialog */}
      <AlertDialog open={showFailConfirm} onOpenChange={setShowFailConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Marcar como Falhada</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja marcar esta missão como falhada? Você perderá <span className="text-destructive font-display">-{XP_PER_HOUR[mission.difficulty] * 2} XP</span> e um Protocolo de Falha será ativado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onFail?.()}
            >
              Confirmar Falha
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Video modal */}
      {mission.videoUrl && (
        <VideoDialog
          open={showVideo}
          onOpenChange={setShowVideo}
          videoUrl={mission.videoUrl}
          title={`🎥 ${mission.name}`}
        />
      )}

      {/* Description modal */}
      {mission.description && (
        <DescriptionDialog
          open={showDescription}
          onOpenChange={setShowDescription}
          html={mission.description}
          title={`📝 ${mission.name}`}
        />
      )}
    </motion.div>
  );
}
