import { useGame } from '@/lib/GameContext';
import { getTodayBrasilia } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Flame, Gift, AlertTriangle, Target, Lock, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SystemPanel() {
  const { state, dailyCheckIn } = useGame();

  const pendingMissions = state.missions.filter(m => m.status === 'Ativa').length;
  const completedMissions = state.missions.filter(m => m.status === 'Concluída').length;
  const today = getTodayBrasilia();
  const pendingHabits = state.habits.filter(h => !h.history[today]).length;
  const doneHabits = state.habits.filter(h => h.history[today] === 'done').length;
  const nextLevel = state.level + 1;
  const xpNeeded = state.xpToNext - state.xp;

  const handleCheckIn = () => {
    if (state.todayCheckedIn) {
      toast.info('Dia já registrado.');
      return;
    }
    dailyCheckIn();
    if (state.missedDays > 0) {
      toast.warning(`⚠️ ${state.missedDays} dia(s) perdido(s) — XP reduzido`);
    } else {
      toast.success('✔️ Dia registrado! +10 XP');
    }
  };

  // Calculate potential penalty for warning
  const potentialPenalty = (() => {
    if (state.todayCheckedIn || !state.lastLogin) return 0;
    const lastDate = new Date(state.lastLogin);
    const todayDate = new Date(today);
    const diff = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) return 0;
    const missed = diff - 1;
    return missed === 1 ? -20 : -50;
  })();

  const systemMessages = [
    potentialPenalty < 0 ? `⚠️ Penalidade de ${potentialPenalty} XP será aplicada ao registrar o dia.` : null,
    state.streak >= 7 ? '🔥 Sequência impressionante. Continue.' : null,
    state.streak === 0 ? '⚠️ Seu progresso está instável. Continue ou regrida.' : null,
    pendingMissions > 0 ? `🎯 ${pendingMissions} missão(ões) pendente(s).` : null,
    pendingHabits > 0 ? `✨ ${pendingHabits} hábito(s) pendente(s) hoje.` : null,
    xpNeeded > 0 ? `🔓 Faltam ${xpNeeded} XP para o nível ${nextLevel}.` : null,
  ].filter(Boolean);

  const bonus = state.streak >= 7 ? '1.5x XP' : state.streak >= 3 ? '1.2x XP' : 'Nenhum';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rpg-panel neon-glow space-y-4"
    >
      <h3 className="font-display text-sm text-primary glow-text-purple tracking-wider uppercase">
        ⟐ PAINEL DO SISTEMA
      </h3>

      {/* Daily Check-in */}
      <Button
        onClick={handleCheckIn}
        disabled={state.todayCheckedIn}
        className="w-full font-display tracking-wide"
        variant={state.todayCheckedIn ? 'secondary' : 'default'}
      >
        {state.todayCheckedIn ? (
          <><CheckCircle2 className="w-4 h-4 mr-2" /> Dia Registrado</>
        ) : (
          '⚔️ Registrar Dia'
        )}
      </Button>

      <div className="space-y-3 text-sm">
        <InfoRow icon={<Flame className="w-4 h-4 text-destructive" />} label="Sequência" value={`${state.streak} dias`} />
        <InfoRow icon={<Gift className="w-4 h-4 text-primary" />} label="Bônus" value={bonus} />
        <InfoRow icon={<Target className="w-4 h-4 text-neon-blue" />} label="Missões" value={`${completedMissions} ✔️ / ${pendingMissions} pendente(s)`} />
        <InfoRow icon={<Sparkles className="w-4 h-4 text-primary" />} label="Hábitos" value={`${doneHabits} ✔️ / ${pendingHabits} pendente(s)`} />
        <InfoRow icon={<Lock className="w-4 h-4 text-gold" />} label="Próximo nível" value={`${xpNeeded} XP`} />
      </div>

      {/* System Messages */}
      {systemMessages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3" /> AVISOS DO SISTEMA
          </div>
          {systemMessages.map((msg, i) => (
            <p key={i} className="text-xs text-foreground/80 font-body leading-relaxed">{msg}</p>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className="font-display text-foreground">{value}</span>
    </div>
  );
}
