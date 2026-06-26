import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/GameContext';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RedemptionQuestDialog() {
  const { state, completeRedemption, dismissRedemption } = useGame();
  const quest = (state.redemptionQuests || []).find(q => !q.completedAt && !q.dismissedAt);
  if (!quest) return null;

  return (
    <Dialog open={true} onOpenChange={(o) => !o && dismissRedemption(quest.id)}>
      <DialogContent className="bg-background border-amber-500/40 max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display tracking-widest text-amber-300">⟐ QUEST DE REDENÇÃO</DialogTitle>
          <DialogDescription className="text-foreground/80">
            Sem julgamento. Sem perda dura. Só um caminho pequeno pra você voltar pra si.
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/30"
        >
          <p className="text-sm text-foreground/90 italic mb-3">"{quest.reason}"</p>
          <p className="font-display text-amber-300 text-sm mb-2 tracking-wider">SEUS PASSOS</p>
          <ul className="space-y-2">
            {quest.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => dismissRedemption(quest.id)}>Depois</Button>
          <Button onClick={() => completeRedemption(quest.id)} className="bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 border border-amber-500/40">
            <CheckCircle2 className="w-4 h-4 mr-1" /> Estou de volta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
