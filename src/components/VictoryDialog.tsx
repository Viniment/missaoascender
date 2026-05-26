import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';

type Trigger = 'mission' | 'habit';

interface Props {
  open: boolean;
  onClose: () => void;
  trigger: Trigger | null;
  itemName: string;
  xp: number;
  gold: number;
}

const triggerLabel: Record<Trigger, string> = {
  mission: 'MISSÃO HONRADA',
  habit: 'ACORDO MANTIDO',
};

export default function VictoryDialog({ open, onClose, trigger, itemName, xp, gold }: Props) {
  const { state } = useGame();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open || !trigger) return;
    let cancelled = false;
    setLoading(true);
    setMessage('');

    const ctx = buildAiContext(state);

    supabase.functions.invoke('victory-message', {
      body: { trigger, itemName, context: ctx },
    })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.warn('[victory-message] error', error);
        const msg: string = (data && (data.message as string)) || `Você cumpriu "${itemName}".\nHoje você não se abandonou.`;
        setMessage(msg);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[victory-message] exception', err);
        setMessage(`Você cumpriu "${itemName}".\nHoje você não se abandonou.`);
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trigger, itemName]);

  if (!trigger) return null;

  const lines = message.split('\n').filter(l => l.trim().length > 0);
  const headLine = lines[0] || message;
  const restLines = lines.slice(1);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-card border-primary shadow-[0_0_60px_-4px_hsl(var(--primary)/0.7)] w-[95vw] max-w-lg p-0 max-h-[92vh] overflow-y-auto rounded-xl gap-0 [&>button]:hidden">
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-xl"
          initial={{ opacity: 0.25 }}
          animate={{ opacity: [0.2, 0.45, 0.2] }}
          transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'radial-gradient(ellipse at center, hsl(var(--primary) / 0.14) 0%, transparent 70%)' }}
        />

        <div className="relative p-5 sm:p-7 space-y-5">
          <DialogHeader className="space-y-3">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary flex items-center justify-center shadow-[0_0_28px_hsl(var(--primary)/0.55)]">
                <Heart className="w-7 h-7 text-primary" />
              </div>
            </motion.div>
            <DialogTitle className="text-center font-display text-primary text-xs tracking-[0.3em] uppercase">
              {triggerLabel[trigger]}
            </DialogTitle>
            <div className="text-center">
              <span className="text-base sm:text-lg font-display text-foreground break-words">{itemName}</span>
              {(xp > 0 || gold > 0) && (
                <span className="block mt-1 text-[11px] font-display text-primary/80">
                  {xp > 0 && `+${xp} XP`}{xp > 0 && gold > 0 && ' · '}{gold > 0 && `+${gold} 💰`}
                </span>
              )}
            </div>
          </DialogHeader>

          <div className="rpg-panel border-primary/60 p-4 sm:p-5 bg-background/60 backdrop-blur-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-display tracking-wider uppercase">Lendo o que você acabou de provar a si mesmo…</span>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                <p
                  className="font-display text-lg sm:text-xl leading-snug text-foreground"
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  {headLine}
                </p>
                {restLines.length > 0 && (
                  <p
                    className="text-sm sm:text-base leading-relaxed text-foreground/85 whitespace-pre-line italic"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {restLines.join('\n')}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          <Button
            onClick={onClose}
            disabled={loading}
            className="w-full h-12 font-display text-sm tracking-[0.15em] uppercase"
          >
            {loading ? 'Aguarde…' : 'Eu vi. E eu sei.'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
