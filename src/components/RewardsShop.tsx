import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Gift, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RewardsShop() {
  const { state, redeemReward } = useGame();

  const handleRedeem = (id: string) => {
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;
    if (state.gold < reward.cost) {
      toast.error('Ouro insuficiente!');
      return;
    }
    redeemReward(id);
    toast.success(`🎁 ${reward.name} resgatado!`);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <Gift className="w-5 h-5" /> RECOMPENSAS
      </h2>
      <div className="flex items-center gap-2 text-sm text-gold font-display">
        <Coins className="w-4 h-4" /> {state.gold} ouro disponível
      </div>

      <div className="grid grid-cols-2 gap-3">
        {state.rewards.map(r => (
          <motion.div
            key={r.id}
            whileHover={{ scale: 1.02 }}
            className="rpg-panel flex flex-col items-center gap-2 text-center"
          >
            <span className="text-3xl">{r.icon}</span>
            <span className="text-sm font-semibold text-foreground">{r.name}</span>
            <span className="text-xs text-gold font-display">{r.cost} 🪙</span>
            <Button
              size="sm"
              className="w-full"
              variant={state.gold >= r.cost ? 'default' : 'secondary'}
              onClick={() => handleRedeem(r.id)}
              disabled={state.gold < r.cost}
            >
              Resgatar
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
