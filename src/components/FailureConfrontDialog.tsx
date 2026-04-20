import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skull, Loader2 } from 'lucide-react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { getTodayBrasilia } from '@/lib/utils';
import { defaultIdentity } from '@/lib/gameStore';

type Trigger = 'mission' | 'habit' | 'protocol_expired';
type Dureza = 'leve' | 'medio' | 'brutal';

interface Props {
  open: boolean;
  onClose: () => void;
  trigger: Trigger | null;
  itemName: string;
  xpLost?: number;
}

const triggerLabel: Record<Trigger, string> = {
  mission: 'MISSÃO FALHADA',
  habit: 'HÁBITO ABANDONADO',
  protocol_expired: 'PROTOCOLO EXPIRADO',
};

const durezaLabel: Record<Dureza, string> = {
  leve: 'LEVE',
  medio: 'MÉDIO',
  brutal: 'BRUTAL',
};

function daysAgo(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

export default function FailureConfrontDialog({ open, onClose, trigger, itemName, xpLost }: Props) {
  const { state, setState, addFailureReflection } = useGame();
  const identity = state.identity || defaultIdentity;
  const identityMode = identity.enabled && identity.newIdentity.trim().length > 0;
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [dureza, setDureza] = useState<Dureza>('leve');
  const [patternInput, setPatternInput] = useState('');

  useEffect(() => {
    if (!open || !trigger) return;
    setPatternInput('');
    let cancelled = false;
    setLoading(true);
    setMessage('');

    const today = getTodayBrasilia();

    // Build context
    const failedRecentMissions = state.missions
      .filter(m => m.status === 'Falhada' && m.completedAt)
      .map(m => ({ name: m.name, date: m.completedAt!, type: 'mission' as const }));

    const failedRepeatable = state.missions
      .filter(m => m.repeatable && m.completionHistory)
      .flatMap(m => (m.completionHistory || [])
        .filter(h => h.failed)
        .map(h => ({ name: m.name, date: h.date, type: 'mission' as const })));

    const failedHabits: { name: string; date: string; type: 'habit' }[] = [];
    state.habits.forEach(h => {
      Object.entries(h.history || {}).forEach(([date, status]) => {
        if (status === 'failed') failedHabits.push({ name: h.name, date, type: 'habit' });
      });
    });

    const failedProtocols = (state.failureProtocols || [])
      .filter(fp => fp.status === 'Concluído' && fp.deadline && new Date(fp.deadline) < new Date(fp.triggeredAt || fp.deadline))
      .map(fp => ({ name: fp.reason, date: fp.deadline, type: 'protocol' as const }));

    const allFailed = [...failedRecentMissions, ...failedRepeatable, ...failedHabits, ...failedProtocols]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const failureFrequency7d = allFailed.filter(f => daysAgo(f.date) <= 7).length;

    const completedMissions = state.missions
      .filter(m => m.status === 'Concluída' && m.completedAt)
      .map(m => ({ name: m.name, date: m.completedAt! }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    const habitsCtx = state.habits.map(h => {
      const entries = Object.entries(h.history || {}).sort((a, b) => b[0].localeCompare(a[0]));
      // streak from today backwards
      let streak = 0;
      let cursor = new Date(today);
      while (true) {
        const key = cursor.toISOString().slice(0, 10);
        const s = (h.history || {})[key];
        if (s === 'done') {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        } else break;
      }
      const failuresLast7d = entries.filter(([d, s]) => s === 'failed' && daysAgo(d) <= 7).length;
      return { name: h.name, streak, failuresLast7d };
    });

    const recentJournal = (state.journal || [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map(j => {
        const txt = (j.text || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        return txt;
      })
      .filter(Boolean);

    const activeMissions = state.missions
      .filter(m => m.status === 'Ativa')
      .map(m => ({ name: m.name, difficulty: m.difficulty }));

    const lastConfrontationMessages = (state.confrontationHistory || [])
      .slice(-3)
      .map(c => c.message);

    const payload = {
      trigger,
      itemName,
      context: {
        awakening: state.awakening,
        recentJournal,
        activeMissions,
        failedRecent: allFailed.slice(0, 10),
        completedRecent: completedMissions,
        habits: habitsCtx,
        rank: state.rank,
        level: state.level,
        streak: state.streak,
        failureFrequency7d,
        lastConfrontationMessages,
        monster: state.monster ? { hp: state.monster.hp, lastReason: state.monster.lastReason } : undefined,
        aiIntensity: state.aiSettings?.intensity ?? 'moderado',
      },
    };

    supabase.functions.invoke('failure-confrontation', { body: payload })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.message) {
          setMessage(`Você falhou em "${itemName}". Sem desculpa hoje. Reconhece e segue.`);
          setDureza('medio');
        } else {
          setMessage(data.message);
          setDureza((data.dureza as Dureza) || 'medio');
          // Persist in confrontationHistory (keep last 20)
          setState(prev => ({
            ...prev,
            confrontationHistory: [
              ...((prev.confrontationHistory || []).slice(-19)),
              { date: new Date().toISOString(), trigger, itemName, message: data.message, dureza: data.dureza || 'medio' },
            ],
          }));
        }
      })
      .catch(() => {
        if (cancelled) return;
        setMessage(`Você falhou em "${itemName}". Sem desculpa hoje. Reconhece e segue.`);
        setDureza('medio');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trigger, itemName]);

  if (!trigger) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-card border-destructive shadow-[0_0_36px_-4px_hsl(var(--destructive)/0.8)] w-[95vw] max-w-md p-4 sm:p-6 max-h-[92vh] overflow-y-auto rounded-xl gap-4">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between gap-2 pr-6">
            <DialogTitle className="font-display text-destructive flex items-center gap-2 text-sm sm:text-base min-w-0">
              <Skull className="w-5 h-5 shrink-0" />
              <span className="truncate">PROTOCOLO DE CONFRONTO</span>
            </DialogTitle>
            <span className="text-[10px] font-display px-2 py-0.5 rounded border bg-destructive text-destructive-foreground border-destructive shrink-0">
              {durezaLabel[dureza]}
            </span>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-display text-muted-foreground uppercase tracking-wider">
              {triggerLabel[trigger]}
            </span>
            <span className="text-sm font-display text-foreground break-words min-w-0 flex-1">{itemName}</span>
            {typeof xpLost === 'number' && xpLost !== 0 && (
              <span className="inline-flex items-center gap-1 bg-destructive/15 text-destructive px-1.5 py-0.5 rounded font-display text-[10px] whitespace-nowrap">
                ⚡ {xpLost} XP
              </span>
            )}
          </div>

          <div className="rpg-panel p-3 sm:p-4 border-destructive">
            {loading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando seu padrão de falha…
              </div>
            ) : (
              <p
                className="text-base sm:text-base leading-relaxed text-foreground whitespace-pre-line break-words"
                style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
              >
                {message}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            variant="destructive"
            className="w-full font-display h-12 text-base"
            onClick={onClose}
            disabled={loading}
          >
            Eu reconheço
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
