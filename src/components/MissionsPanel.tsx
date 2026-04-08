import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import type { Mission } from '@/lib/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, Trash2, Clock, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const TYPES = ['Estudo', 'Treino', 'Leitura', 'Trabalho', 'Pessoal'] as const;
const DIFFICULTIES = ['Fácil', 'Normal', 'Difícil'] as const;
const diffColors = { 'Fácil': 'text-success', 'Normal': 'text-warning', 'Difícil': 'text-destructive' };

export default function MissionsPanel() {
  const { state, addMission, completeMission, deleteMission } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<typeof TYPES[number]>('Estudo');
  const [difficulty, setDifficulty] = useState<typeof DIFFICULTIES[number]>('Normal');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');

  const handleAdd = () => {
    if (!name.trim()) return;
    addMission({ name, type, difficulty, startTime, endTime });
    setName('');
    setShowForm(false);
    toast.success('Missão adicionada!');
  };

  const handleComplete = (id: string) => {
    completeMission(id);
    const mission = state.missions.find(m => m.id === id);
    if (mission) {
      toast.success(`Missão concluída! +XP +Ouro`);
    }
  };

  const pending = state.missions.filter(m => !m.completed);
  const completed = state.missions.filter(m => m.completed);

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
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rpg-panel space-y-3"
          >
            <Input placeholder="Nome da missão" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
            <div className="grid grid-cols-2 gap-2">
              <Select value={type} onValueChange={(v) => setType(v as any)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v as any)}>
                <SelectTrigger className="bg-secondary"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Início</label>
                <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Fim</label>
                <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-secondary border-border" />
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd}>Adicionar Missão</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {pending.map(m => (
          <MissionCard key={m.id} mission={m} onComplete={() => handleComplete(m.id)} onDelete={() => deleteMission(m.id)} />
        ))}
        {pending.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma missão pendente.</p>
        )}
      </div>

      {completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Concluídas</h3>
          {completed.slice(0, 5).map(m => (
            <MissionCard key={m.id} mission={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function MissionCard({ mission, onComplete, onDelete }: { mission: Mission; onComplete?: () => void; onDelete?: () => void }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rpg-panel flex items-center gap-3 ${mission.completed ? 'opacity-60' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${mission.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {mission.name}
          </span>
          <span className={`text-[10px] font-display ${diffColors[mission.difficulty]}`}>
            {mission.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
          <span>{mission.type}</span>
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{mission.startTime}-{mission.endTime}</span>
          {mission.completed && mission.xpEarned !== undefined && (
            <span className="text-primary">+{mission.xpEarned} XP | +{mission.goldEarned} 🪙</span>
          )}
        </div>
      </div>
      {!mission.completed && (
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success" onClick={onComplete}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );
}
