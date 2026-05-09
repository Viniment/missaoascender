import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Flame } from 'lucide-react';
import { toast } from 'sonner';

const PATTERN_BREAK_LINES = [
  'Outro dia gasto. Quanto valor seu tempo tem pra você?',
  'Você prometeu — e fugiu. De novo.',
  'A vida que você quer não vai vir te buscar.',
  'Cada hora rolando feed é uma hora roubada do seu futuro.',
  'Você está se acostumando a perder. Isso vira identidade.',
];

const PATTERN_BREAK_QUESTIONS = [
  'O que você está fingindo não ver hoje?',
  'Que dor você está evitando agora?',
  'Quem você se torna se continuar exatamente como está?',
  'Onde você quebrou sua palavra esta semana?',
];

const DEFAULT_IDENTITIES = ['Disciplinado', 'Focado', 'Honrado', 'Implacável', 'Presente', 'Soberano'];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function DailyRitualDialog({ open, onClose }: Props) {
  const { state, completeDailyRitual } = useGame();
  const [step, setStep] = useState(0);

  // Step 1
  const [breakAnswer, setBreakAnswer] = useState('');
  // Step 2
  const [pain1, setPain1] = useState('');
  const [pain2, setPain2] = useState('');
  // Step 3
  const [identityChosen, setIdentityChosen] = useState('');
  // Step 4
  const [commitment, setCommitment] = useState('');

  const opening = useMemo(() => PATTERN_BREAK_LINES[Math.floor(Math.random() * PATTERN_BREAK_LINES.length)], [open]);
  const breakQ = useMemo(() => PATTERN_BREAK_QUESTIONS[Math.floor(Math.random() * PATTERN_BREAK_QUESTIONS.length)], [open]);

  // Pain questions baseadas em dados recentes (sem chamar IA — local)
  const painQuestions = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    let recurring: string | undefined;
    const habitFails: Record<string, number> = {};
    for (const h of state.habits || []) {
      for (const [d, s] of Object.entries(h.history || {})) {
        if (s === 'failed' && Date.now() - new Date(`${d}T12:00:00`).getTime() <= 7 * 86400000) {
          habitFails[h.name] = (habitFails[h.name] || 0) + 1;
        }
      }
    }
    const top = Object.entries(habitFails).sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) recurring = top[0];

    const become = state.awakening?.become?.trim();

    const q1 = recurring
      ? `Você falhou "${recurring}" ${top![1]} vezes esta semana. Qual é o preço real disso daqui 1 ano?`
      : 'O que você está perdendo todo dia por não agir? Liste em específico.';
    const q2 = become
      ? `Você jurou se tornar "${become}". A pessoa que você foi ontem está se aproximando ou se afastando dessa versão?`
      : 'Se você continuar exatamente como hoje por 1 ano, o que vai acontecer com seu corpo, sua mente e seus relacionamentos?';
    return [q1, q2];
  }, [open, state]);

  const close = () => {
    setStep(0);
    setBreakAnswer(''); setPain1(''); setPain2(''); setIdentityChosen(''); setCommitment('');
    onClose();
  };

  const finish = () => {
    if (!identityChosen || !commitment.trim()) {
      toast.error('Escolha uma identidade e escreva um compromisso.');
      return;
    }
    completeDailyRitual({ identityChosen, commitment: commitment.trim() });
    toast.success(`🔥 ${identityChosen} ativado. +25 XP, +5 Honra.`);
    close();
  };

  const canNext = (() => {
    if (step === 0) return true;
    if (step === 1) return pain1.trim().length > 5 && pain2.trim().length > 5;
    if (step === 2) return !!identityChosen;
    if (step === 3) return commitment.trim().length > 3;
    return false;
  })();

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-primary glow-text-purple flex items-center gap-2">
            <Flame className="w-4 h-4" /> Ritual de Despertar — Passo {step + 1} de 4
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-2"
          >
            {step === 0 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-primary/70 font-display">Quebra de Padrão</p>
                <p className="text-lg font-display text-foreground leading-snug">{opening}</p>
                <div className="rpg-panel border-primary/30">
                  <p className="text-sm text-foreground/90 mb-2">{breakQ}</p>
                  <Textarea
                    value={breakAnswer}
                    onChange={e => setBreakAnswer(e.target.value)}
                    placeholder="Responda em 1-2 frases (não obrigatório)..."
                    className="bg-secondary/40 min-h-[80px]"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-destructive/80 font-display">💀 Dor da Inação</p>
                <p className="text-sm text-foreground/80 italic">Sem fugir. Olhe direto para o custo do que você não está fazendo.</p>
                {painQuestions.map((q, i) => (
                  <div key={i} className="rpg-panel border-destructive/20">
                    <p className="text-sm text-foreground/90 mb-2">{q}</p>
                    <Textarea
                      value={i === 0 ? pain1 : pain2}
                      onChange={e => i === 0 ? setPain1(e.target.value) : setPain2(e.target.value)}
                      placeholder="Escreva a verdade..."
                      className="bg-secondary/40 min-h-[80px]"
                    />
                  </div>
                ))}
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-primary/80 font-display">✨ Identidade do Dia</p>
                <p className="text-sm text-foreground/80">Quem você ativa agora? Escolha — e aja como essa pessoa pelas próximas horas.</p>
                <div className="flex flex-wrap gap-2">
                  {[...DEFAULT_IDENTITIES, ...(state.identity?.dominantTraits || [])].map(id => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setIdentityChosen(id)}
                      className={`px-3 py-2 rounded-md text-sm font-display uppercase tracking-wider transition-all ${
                        identityChosen === id
                          ? 'bg-primary text-primary-foreground border border-primary shadow-[0_0_12px_hsl(var(--primary)/0.5)]'
                          : 'bg-secondary/50 text-foreground/70 border border-border hover:border-primary/40'
                      }`}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <p className="text-[10px] uppercase tracking-wider text-gold/80 font-display">⚡ Compromisso de Ação</p>
                <p className="text-sm text-foreground/80">UMA ação concreta para as próximas horas. Pequena. Específica. Inegociável.</p>
                <Input
                  value={commitment}
                  onChange={e => setCommitment(e.target.value)}
                  placeholder="Ex: 30 min de leitura antes do almoço"
                  className="bg-secondary/40"
                />
                <p className="text-[11px] text-foreground/50 italic">
                  Como <strong className="text-primary">{identityChosen || '...'}</strong>, eu vou: {commitment || '___'}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={close}>Sair</Button>
          {step < 3 ? (
            <Button size="sm" disabled={!canNext} onClick={() => setStep(s => s + 1)}>
              Próximo <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <Button size="sm" disabled={!canNext} onClick={finish}>
              <Flame className="w-3.5 h-3.5 mr-1" /> Ativar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
