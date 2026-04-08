import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const ICONS = ['💪', '📚', '🧘', '🏃', '💧', '🎯', '🧠', '✍️', '🌅', '💤'];
const COLORS = ['#7B2FF7', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

export default function HabitsPanel() {
  const { state, addHabit, markHabit, deleteHabit } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💪');
  const [color, setColor] = useState(COLORS[0]);
  const [endDate, setEndDate] = useState('');
  const today = new Date().toISOString().split('T')[0];

  const handleAdd = () => {
    if (!name.trim()) return;
    addHabit({ name, icon, color, endDate });
    setName('');
    setShowForm(false);
    toast.success('Hábito criado!');
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
              <label className="text-xs text-muted-foreground">Data final</label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-secondary border-border" />
            </div>
            <Button className="w-full" onClick={handleAdd}>Criar Hábito</Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {state.habits.map(h => {
          const todayStatus = h.history[today];
          return (
            <motion.div key={h.id} layout className="rpg-panel flex items-center gap-3">
              <span className="text-xl" style={{ filter: `drop-shadow(0 0 4px ${h.color})` }}>{h.icon}</span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-semibold text-foreground">{h.name}</span>
                <div className="text-xs text-muted-foreground">+50 XP / -100 XP</div>
              </div>
              {!todayStatus ? (
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-success" onClick={() => { markHabit(h.id, 'done'); toast.success('+50 XP!'); }}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => { markHabit(h.id, 'failed'); toast.error('-100 XP!'); }}>
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
            </motion.div>
          );
        })}
        {state.habits.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum hábito criado.</p>
        )}
      </div>

      {/* Heatmap */}
      {state.habits.length > 0 && <HeatmapSection />}
    </div>
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
