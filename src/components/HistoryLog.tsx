import { useGame } from '@/lib/GameContext';
import { ScrollText } from 'lucide-react';

export default function HistoryLog() {
  const { state } = useGame();

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <ScrollText className="w-5 h-5" /> HISTÓRICO
      </h2>

      <div className="space-y-1">
        {state.log.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro ainda.</p>
        )}
        {state.log.map((entry, i) => (
          <div key={i} className="rpg-panel flex items-center justify-between py-2 px-3">
            <div>
              <span className="text-sm text-foreground">{entry.action}</span>
              <div className="text-xs text-muted-foreground">
                {new Date(entry.date).toLocaleDateString('pt-BR')} {new Date(entry.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            <div className="flex gap-3 text-xs font-display">
              {entry.xp !== 0 && <span className={entry.xp > 0 ? 'text-primary' : 'text-destructive'}>{entry.xp > 0 ? '+' : ''}{entry.xp} XP</span>}
              {entry.gold !== 0 && <span className={entry.gold > 0 ? 'text-gold' : 'text-destructive'}>{entry.gold > 0 ? '+' : ''}{entry.gold} 🪙</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
