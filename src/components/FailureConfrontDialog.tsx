import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skull, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';

type Trigger = 'mission' | 'habit' | 'protocol_expired';

interface Props {
  open: boolean;
  onClose: () => void;
  trigger: Trigger | null;
  itemName: string;
  xpLost?: number;
}

const triggerLabel: Record<Trigger, string> = {
  mission: 'MISSÃO QUEBRADA',
  habit: 'ACORDO ROMPIDO',
  protocol_expired: 'PROTOCOLO ABANDONADO',
};

const READ_LOCK_MS = 4000; // anti-skip reflexo

export default function FailureConfrontDialog({ open, onClose, trigger, itemName, xpLost }: Props) {
  const { state, setState, appendAiAngle } = useGame();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [angle, setAngle] = useState<string>('');
  const [unlockedAt, setUnlockedAt] = useState<number>(0); // quando o botão libera
  const [now, setNow] = useState<number>(Date.now());

  // tick para countdown do botão
  useEffect(() => {
    if (!open) return;
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open || !trigger) return;
    let cancelled = false;
    setLoading(true);
    setMessage('');
    setAngle('');
    setUnlockedAt(0);

    const ctx = buildAiContext(state);

    supabase.functions.invoke('failure-confrontation', {
      body: { trigger, itemName, context: ctx },
    })
      .then(({ data, error }) => {
        if (cancelled) return;
        const msg: string = (data && (data.message as string)) || `Você quebrou "${itemName}". Não foi tempo. Foi escolha.`;
        const ang: string = (data && (data.angle as string)) || 'autotraicao';
        if (error) console.warn('[failure-confrontation] error', error);
        setMessage(msg);
        setAngle(ang);
        appendAiAngle(ang);
        // persistir histórico (compat: mantém schema antigo)
        setState(prev => ({
          ...prev,
          confrontationHistory: [
            ...((prev.confrontationHistory || []).slice(-19)),
            { date: new Date().toISOString(), trigger, itemName, message: msg, dureza: 'medio' },
          ],
        }));
        setUnlockedAt(Date.now() + READ_LOCK_MS);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[failure-confrontation] exception', err);
        setMessage(`Você quebrou "${itemName}". Não foi tempo. Foi escolha.`);
        setUnlockedAt(Date.now() + READ_LOCK_MS);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, trigger, itemName]);

  if (!trigger) return null;

  const lines = message.split('\n').filter(l => l.trim().length > 0);
  const headLine = lines[0] || message;
  const restLines = lines.slice(1);

  const remainingMs = Math.max(0, unlockedAt - now);
  const canConfirm = !loading && remainingMs === 0 && message.length > 0;

  return (
    <Dialog open={open} onOpenChange={() => { /* travado: só fecha pelo botão */ }}>
      <DialogContent
        className="bg-card border-destructive shadow-[0_0_60px_-4px_hsl(var(--destructive)/0.9)] w-[95vw] max-w-lg p-0 max-h-[92vh] overflow-y-auto rounded-xl gap-0 [&>button]:hidden"
      >
        {/* Pulso vermelho de fundo */}
        <motion.div
          aria-hidden
          className="absolute inset-0 pointer-events-none rounded-xl"
          initial={{ opacity: 0.35 }}
          animate={{ opacity: [0.25, 0.5, 0.25] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: 'radial-gradient(ellipse at center, hsl(var(--destructive) / 0.18) 0%, transparent 70%)',
          }}
        />

        <div className="relative p-5 sm:p-7 space-y-5">
          <DialogHeader className="space-y-3">
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="flex justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-destructive/15 border border-destructive flex items-center justify-center shadow-[0_0_28px_hsl(var(--destructive)/0.7)]">
                <Skull className="w-8 h-8 text-destructive animate-pulse" />
              </div>
            </motion.div>
            <DialogTitle className="text-center font-display text-destructive text-xs tracking-[0.3em] uppercase">
              {triggerLabel[trigger]}
            </DialogTitle>
            <div className="text-center">
              <span className="text-base sm:text-lg font-display text-foreground break-words">{itemName}</span>
              {typeof xpLost === 'number' && xpLost !== 0 && (
                <span className="block mt-1 text-[11px] font-display text-destructive/80">⚡ {xpLost} XP perdidos</span>
              )}
            </div>
          </DialogHeader>

          {/* Mensagem */}
          <div className="rpg-panel border-destructive/60 p-4 sm:p-5 bg-background/60 backdrop-blur-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-6 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-display tracking-wider uppercase">Reconstruindo o que você fez…</span>
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
                    className="text-sm sm:text-base leading-relaxed text-foreground/85 whitespace-pre-line"
                    style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                  >
                    {restLines.join('\n')}
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Botão único — bloqueado por READ_LOCK_MS */}
          <Button
            variant="destructive"
            onClick={onClose}
            disabled={!canConfirm}
            className="w-full h-14 font-display text-sm sm:text-base tracking-[0.15em] uppercase disabled:opacity-50"
          >
            {loading
              ? 'Aguarde…'
              : remainingMs > 0
                ? `Leia. (${Math.ceil(remainingMs / 1000)}s)`
                : 'Eu reconheço. Eu escolhi isso.'}
          </Button>

          {angle && !loading && (
            <p className="text-center text-[10px] font-display text-muted-foreground/50 tracking-wider uppercase">
              Espelho · {angle.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
