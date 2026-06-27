import { useGame } from '@/lib/GameContext';
import { getTodayBrasilia } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Swords, Gem, ScrollText, Scroll, CheckCircle2, Zap, TrendingUp } from 'lucide-react';
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
      toast.warning(`🩸 ${state.missedDays} dia(s) fora da arena. A jornada continua de onde você parou.`);
    } else {
      toast.success('⚔️ Presença selada no grimório. +10 XP');
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
    potentialPenalty < 0 ? `🩸 −${Math.abs(potentialPenalty)} XP ao registrar — o sistema cobra o silêncio, não você.` : null,
    state.streak >= 7 ? '🔥 Combo lendário ativo. A arena reconhece sua presença.' : null,
    state.streak === 0 ? '🌑 Combo zerado. Toda saga começa com um passo de volta à arena.' : null,
    pendingMissions > 0 ? `📜 ${pendingMissions} missão(ões) aguardando no painel.` : null,
    pendingHabits > 0 ? `⚡ ${pendingHabits} ritual(is) diário(s) ainda não executado(s).` : null,
    xpNeeded > 0 ? `🗝️ ${xpNeeded} XP até o Nível ${nextLevel}.` : null,
  ].filter(Boolean);

  const bonus = state.streak >= 7 ? '1.5x XP' : state.streak >= 3 ? '1.2x XP' : 'Nenhum';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="rpg-panel neon-glow space-y-4"
    >
      <h3 className="font-display text-sm text-primary glow-text-purple tracking-wider uppercase">
        ⚔ STATUS DO HERÓI
      </h3>

      {/* Daily Check-in */}
      <Button
        onClick={handleCheckIn}
        disabled={state.todayCheckedIn}
        className="w-full font-display tracking-wide"
        variant={state.todayCheckedIn ? 'secondary' : 'default'}
      >
        {state.todayCheckedIn ? (
          <><CheckCircle2 className="w-4 h-4 mr-2" /> Presença Selada</>
        ) : (
          <><Swords className="w-4 h-4 mr-2" /> Registrar Presença</>
        )}
      </Button>

      <div className="space-y-3 text-sm">
        <InfoRow icon={<Swords className="w-4 h-4 text-destructive" />} label="Combo de batalha" value={`${state.streak} dia(s)`} />
        <InfoRow icon={<Gem className="w-4 h-4 text-primary" />} label="Bônus de XP" value={bonus} />
        <InfoRow icon={<ScrollText className="w-4 h-4 text-neon-blue" />} label="Missões" value={`${completedMissions} ✔ / ${pendingMissions} ativa(s)`} />
        <InfoRow icon={<Zap className="w-4 h-4 text-primary" />} label="Rituais diários" value={`${doneHabits} ✔ / ${pendingHabits} pendente(s)`} />
        <InfoRow icon={<TrendingUp className="w-4 h-4 text-gold" />} label="Próximo nível" value={`${xpNeeded} XP`} />
      </div>

      {/* System Messages */}
      {systemMessages.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Scroll className="w-3 h-3" /> DECRETO DO SISTEMA
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
