import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Gift, Coins, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function RewardsShop() {
  const { state, addReward, redeemReward, deleteReward } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState(50);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => {
    if (submittingRef.current) return;
    if (!name.trim() || cost <= 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addReward({ name, cost });
      setName('');
      setCost(50);
      setShowForm(false);
      toast.success('Recompensa criada!');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const handleRedeem = (id: string) => {
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;
    if (reward.redeemed) {
      toast.info('Já resgatada!');
      return;
    }
    if (state.gold < reward.cost) {
      toast.error('Ouro insuficiente!');
      return;
    }
    redeemReward(id);
    toast.success(`🎁 ${reward.name} resgatado!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Gift className="w-5 h-5" /> RECOMPENSAS
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-gold font-display">
        <Coins className="w-4 h-4" /> {state.gold} ouro disponível
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel space-y-3">
          <Input placeholder="Nome da recompensa" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
          <div>
            <label className="text-xs text-muted-foreground">Custo em ouro</label>
            <Input type="number" min={1} value={cost} onChange={e => setCost(Number(e.target.value))} className="bg-secondary border-border" />
          </div>
          <Button className="w-full" onClick={handleAdd} disabled={submitting}>Criar Recompensa</Button>
        </motion.div>
      )}

      {state.rewards.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recompensa criada. Crie a sua!</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {state.rewards.map(r => (
          <motion.div
            key={r.id}
            whileHover={{ scale: 1.02 }}
            className={`rpg-panel flex flex-col items-center gap-2 text-center ${r.redeemed ? 'opacity-50' : ''}`}
          >
            <span className="text-sm font-semibold text-foreground">{r.name}</span>
            <span className="text-xs text-gold font-display">{r.cost} 🪙</span>
            {r.redeemed ? (
              <span className="text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Resgatada</span>
            ) : (
              <Button
                size="sm"
                className="w-full"
                variant={state.gold >= r.cost ? 'default' : 'secondary'}
                onClick={() => handleRedeem(r.id)}
                disabled={state.gold < r.cost}
              >
                Resgatar
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => deleteReward(r.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
