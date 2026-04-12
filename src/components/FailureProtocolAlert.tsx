import { useState, useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import type { FailurePenaltyType } from '@/lib/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Skull, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PENALTY_TYPES: FailurePenaltyType[] = ['Exercício', 'Meditação', 'Reflexão', 'Outro'];

function formatCountdown(ms: number): string {
  if (ms <= 0) return 'EXPIRADO';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
}

export default function FailureProtocolAlert() {
  const { state, completeFailureProtocol, updateFailureProtocolPenalty, checkExpiredProtocols } = useGame();
  const [, setTick] = useState(0);

  const pending = state.failureProtocols.filter(fp => fp.status === 'Pendente');

  // Tick every minute to update countdown
  useEffect(() => {
    if (pending.length === 0) return;
    const interval = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(interval);
  }, [pending.length]);

  // Check expired on mount and each tick
  useEffect(() => {
    checkExpiredProtocols();
  }, [checkExpiredProtocols]);

  if (pending.length === 0) return null;

  const now = Date.now();

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {pending.map(fp => {
          const remaining = new Date(fp.deadline).getTime() - now;
          const isUrgent = remaining < 3600000; // less than 1h
          const isExpired = remaining <= 0;

          return (
            <motion.div
              key={fp.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rpg-panel border-2 ${
                isExpired ? 'border-destructive bg-destructive/10' :
                isUrgent ? 'border-warning bg-warning/10 animate-pulse' :
                'border-destructive/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {isExpired ? (
                  <Skull className="w-5 h-5 text-destructive" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-warning" />
                )}
                <span className="font-display text-sm text-destructive tracking-wider">
                  ⚠️ PROTOCOLO DE FALHA ATIVO
                </span>
              </div>

              <p className="text-xs text-muted-foreground mb-2">{fp.reason}</p>

              {fp.punishment && (
                <div className="mb-2 p-2 rounded bg-secondary/50 border border-border">
                  <p className="text-xs font-display text-warning">💀 PUNIÇÃO: {fp.punishment.name}</p>
                  {fp.punishment.description && (
                    <p className="text-[10px] text-muted-foreground">{fp.punishment.description}</p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    {fp.punishment.category} • {fp.punishment.intensity}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className={`text-xs font-display ${isUrgent ? 'text-destructive' : 'text-warning'}`}>
                  {formatCountdown(remaining)}
                </span>
              </div>

              {!fp.punishment && (
                <div className="flex items-center gap-2 mb-3">
                  <Select
                    value={fp.penaltyType}
                    onValueChange={(v) => updateFailureProtocolPenalty(fp.id, v as FailurePenaltyType)}
                  >
                    <SelectTrigger className="bg-secondary h-8 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PENALTY_TYPES.map(pt => (
                        <SelectItem key={pt} value={pt}>{pt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fp.penaltyType === 'Outro' && (
                    <Input
                      placeholder="Descreva..."
                      value={fp.customPenalty || ''}
                      onChange={e => updateFailureProtocolPenalty(fp.id, 'Outro', e.target.value)}
                      className="bg-secondary border-border h-8 text-xs flex-1"
                    />
                  )}
                </div>
              )}

              <Button
                size="sm"
                className="w-full"
                onClick={() => {
                  completeFailureProtocol(fp.id);
                  toast.success('Protocolo de Falha concluído!');
                }}
              >
                <Check className="w-4 h-4 mr-1" /> Concluir Protocolo
              </Button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
