import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useGame } from '@/lib/GameContext';
import { ChevronLeft, ChevronRight, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import type { AwakeningExerciseType } from '@/lib/gameStore';

export interface GeneratedExercise {
  title: string;
  prompt: string;
  type: AwakeningExerciseType;
  objective: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  detectedState: string;
  exercises: GeneratedExercise[];
}

const TYPE_META: Record<AwakeningExerciseType, { label: string; emoji: string }> = {
  consciencia: { label: 'Consciência', emoji: '🔎' },
  confronto: { label: 'Confronto', emoji: '⚔️' },
  reprogramacao: { label: 'Reprogramação', emoji: '🧬' },
  direcionamento: { label: 'Direcionamento', emoji: '🧭' },
  quebra: { label: 'Quebra de padrão', emoji: '🔥' },
};

export default function AwakeningExerciseDialog({ open, onOpenChange, detectedState, exercises }: Props) {
  const { addReflection } = useGame();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<string[]>(() => exercises.map(() => ''));
  const [confirmClose, setConfirmClose] = useState(false);

  const total = exercises.length;
  const current = exercises[idx];
  const isLast = idx === total - 1;
  const hasAny = answers.some(a => a.trim().length > 0);

  const setAnswer = (v: string) => {
    setAnswers(prev => prev.map((a, i) => i === idx ? v : a));
  };

  const handleClose = () => {
    if (hasAny) setConfirmClose(true);
    else onOpenChange(false);
  };

  const handleFinish = useCallback(() => {
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = [
      `<p><strong>🌅 Despertar Guiado — ${dateStr}</strong></p>`,
      `<p><em>Estado detectado: ${detectedState}</em></p>`,
      `<p></p>`,
      ...exercises.flatMap((ex, i) => {
        const meta = TYPE_META[ex.type] || { emoji: '✦', label: ex.type };
        const ans = (answers[i] || '').trim() || '<em>(sem resposta)</em>';
        return [
          `<p><strong>${i + 1}. ${meta.emoji} ${ex.title}</strong></p>`,
          `<p><em>${ex.prompt}</em></p>`,
          `<p>${ans.replace(/\n/g, '<br/>')}</p>`,
          `<p></p>`,
        ];
      }),
    ].join('');

    addReflection({
      question: `Despertar guiado — ${detectedState}`,
      answerHtml: html,
      date: new Date().toISOString(),
    });
    toast.success('Despertar concluído. +15 XP');
    onOpenChange(false);
    setIdx(0);
    setAnswers(exercises.map(() => ''));
  }, [answers, exercises, detectedState, addReflection, onOpenChange]);

  if (!current) return null;
  const meta = TYPE_META[current.type] || { emoji: '✦', label: current.type };

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
        <DialogContent className="max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6">
          <DialogHeader className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="font-display text-base sm:text-lg text-primary glow-text-purple flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Despertar Guiado
              </DialogTitle>
              <span className="text-xs text-foreground/60 font-mono">{idx + 1}/{total}</span>
            </div>
            <p className="text-xs text-foreground/70">
              Estado detectado: <span className="text-primary font-semibold">{detectedState}</span>
            </p>
            <div className="h-1 w-full bg-secondary rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((idx + 1) / total) * 100}%` }}
              />
            </div>
          </DialogHeader>

          <AnimatePresence mode="wait">
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.15 }}
              className="mt-4 space-y-3"
            >
              <Badge variant="outline" className="text-[10px]">
                {meta.emoji} {meta.label}
              </Badge>
              <h3 className="font-display text-base text-foreground">{current.title}</h3>
              <p className="text-xs text-foreground/60 italic">{current.objective}</p>
              <div className="rpg-panel p-3 bg-primary/5 border-primary/30">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{current.prompt}</p>
              </div>
              <Textarea
                value={answers[idx]}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Escreva aqui sua resposta..."
                className="min-h-[180px] bg-secondary/50 text-sm"
              />
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={idx === 0}
              onClick={() => setIdx(i => Math.max(0, i - 1))}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            {isLast ? (
              <Button size="sm" onClick={handleFinish}>
                <Check className="w-4 h-4 mr-1" /> Concluir Despertar
              </Button>
            ) : (
              <Button size="sm" onClick={() => setIdx(i => Math.min(total - 1, i + 1))}>
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem respostas não salvas. Sair vai descartá-las.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar escrevendo</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmClose(false);
                onOpenChange(false);
                setIdx(0);
                setAnswers(exercises.map(() => ''));
              }}
            >
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
