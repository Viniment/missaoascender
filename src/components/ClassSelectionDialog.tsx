import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CLASSES, type ClassId } from '@/lib/classes';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';

export default function ClassSelectionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { chooseClass } = useGame();
  const [picked, setPicked] = useState<ClassId | null>(null);

  const confirm = () => {
    if (!picked) return;
    chooseClass(picked);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl bg-background border-primary/40">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl tracking-widest text-primary glow-text-purple">⟐ ESCOLHA SUA CLASSE</DialogTitle>
          <DialogDescription>
            Você chegou ao Nível 5. Agora pode declarar quem está se tornando. A classe libera um bônus passivo permanente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
          {CLASSES.map(c => (
            <motion.button
              key={c.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setPicked(c.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                picked === c.id
                  ? `border-primary bg-primary/10 ${c.glow}`
                  : 'border-border bg-secondary/40 hover:bg-secondary/70'
              }`}
            >
              <div className="text-3xl mb-2">{c.emoji}</div>
              <div className={`font-display text-lg tracking-wider ${c.color} mb-1`}>{c.label}</div>
              <div className="text-xs text-foreground/70 mb-2">{c.description}</div>
              <div className="text-[11px] text-gold font-display">+ {c.passive}</div>
            </motion.button>
          ))}
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Decidir depois</Button>
          <Button disabled={!picked} onClick={confirm} className="bg-primary hover:bg-primary/90">
            Tornar-se {picked ? CLASSES.find(c => c.id === picked)?.label : '...'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
