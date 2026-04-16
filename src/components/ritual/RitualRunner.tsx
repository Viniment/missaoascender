import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useGame } from '@/lib/GameContext';
import { Pause, Play, SkipForward, X, Check } from 'lucide-react';
import { STEP_LABELS } from './ritualDefaults';
import type { Ritual, NarrationStyle, RitualIntensity } from '@/lib/gameStore';
import { toast } from 'sonner';

interface Props {
  ritual: Ritual;
  onExit: () => void;
}

const VOICE_PARAMS: Record<NarrationStyle, { rate: number; pitch: number; volume: number }> = {
  calmo: { rate: 0.85, pitch: 0.9, volume: 0.9 },
  motivador: { rate: 1.05, pitch: 1.1, volume: 1 },
  agressivo: { rate: 1.15, pitch: 0.85, volume: 1 },
  neutro: { rate: 1, pitch: 1, volume: 1 },
};

const INTENSITY_BG: Record<RitualIntensity, string> = {
  leve: 'from-primary/10 via-background to-background',
  medio: 'from-primary/25 via-background to-background',
  intenso: 'from-destructive/30 via-primary/20 to-background',
};

function speak(text: string, style: NarrationStyle) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const params = VOICE_PARAMS[style];
  u.rate = params.rate;
  u.pitch = params.pitch;
  u.volume = params.volume;
  u.lang = 'pt-BR';
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(v => v.lang.startsWith('pt'));
  if (ptVoice) u.voice = ptVoice;
  window.speechSynthesis.speak(u);
}

function bumpIntensity(i: RitualIntensity, cycle: number, enabled: boolean): RitualIntensity {
  if (!enabled || cycle === 0) return i;
  if (cycle === 1 && i === 'leve') return 'medio';
  if (cycle >= 1 && i === 'medio') return 'intenso';
  if (cycle >= 2) return 'intenso';
  return i;
}

export default function RitualRunner({ ritual, onExit }: Props) {
  const { state, logRitualSession } = useGame();
  const activeSteps = ritual.steps.filter(s => s.enabled).sort((a, b) => a.order - b.order);
  const visionItems = (state.visionItems || []).filter(
    v => v.type === 'image' && v.imageUrl && (ritual.visionItemIds || []).includes(v.id),
  );

  const [cycle, setCycle] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [remaining, setRemaining] = useState(activeSteps[0]?.durationSec || 0);
  const [paused, setPaused] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [done, setDone] = useState(false);
  const startTimeRef = useRef(Date.now());
  const completedRef = useRef(false);

  const currentStep = activeSteps[stepIdx];
  const effectiveIntensity = currentStep
    ? bumpIntensity(currentStep.intensity, cycle, ritual.loopIncreaseIntensity)
    : 'medio';

  // Speak on step change
  useEffect(() => {
    if (!currentStep || done) return;
    if (ritual.useTTS) speak(currentStep.text, ritual.narrationStyle);
    setRemaining(currentStep.durationSec);
    return () => { if (typeof window !== 'undefined') window.speechSynthesis?.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, cycle, done]);

  // Timer
  useEffect(() => {
    if (paused || done) return;
    const id = window.setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          window.clearInterval(id);
          advance();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, stepIdx, cycle, done]);

  // Image crossfade
  useEffect(() => {
    if (ritual.displayMode !== 'imagens' || visionItems.length < 2) return;
    const id = window.setInterval(() => setImgIdx(i => (i + 1) % visionItems.length), 4000);
    return () => window.clearInterval(id);
  }, [ritual.displayMode, visionItems.length]);

  const advance = () => {
    if (stepIdx + 1 < activeSteps.length) {
      setStepIdx(stepIdx + 1);
    } else if (cycle + 1 < ritual.loopCount) {
      // Gap then next cycle
      setTimeout(() => {
        setCycle(c => c + 1);
        setStepIdx(0);
      }, ritual.loopGapSec * 1000);
    } else {
      finish();
    }
  };

  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    setDone(true);
  };

  const handleConclude = (alsoJournal: boolean) => {
    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    logRitualSession(ritual, duration, alsoJournal);
    toast.success('Ritual concluído. +XP');
    onExit();
  };

  const handleExitEarly = () => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
    onExit();
  };

  if (activeSteps.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-muted-foreground">Este ritual não tem etapas ativas.</p>
        <Button onClick={onExit}>Voltar</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 mx-auto rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Check className="w-10 h-10 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-display text-primary">Ritual Concluído</h2>
        <p className="text-muted-foreground">Você atravessou. Você é mais forte agora.</p>
        <div className="flex flex-col gap-2 max-w-xs mx-auto">
          <Button onClick={() => handleConclude(true)}>Concluir e registrar no diário</Button>
          <Button variant="outline" onClick={() => handleConclude(false)}>Concluir sem registrar</Button>
        </div>
      </div>
    );
  }

  const progress = currentStep ? 1 - remaining / currentStep.durationSec : 0;
  const totalSteps = activeSteps.length * ritual.loopCount;
  const currentTotal = cycle * activeSteps.length + stepIdx + 1;

  return (
    <div className={`relative min-h-[60vh] rounded-lg bg-gradient-to-br ${INTENSITY_BG[effectiveIntensity]} p-6 overflow-hidden`}>
      {/* Background images */}
      {ritual.displayMode === 'imagens' && visionItems.length > 0 && (
        <AnimatePresence>
          <motion.img
            key={visionItems[imgIdx].id}
            src={visionItems[imgIdx].imageUrl}
            alt=""
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </AnimatePresence>
      )}

      <div className="relative z-10 flex flex-col h-full min-h-[60vh]">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{STEP_LABELS[currentStep.type]}</span>
          <span>
            Etapa {currentTotal}/{totalSteps}
            {ritual.loopCount > 1 && ` · Ciclo ${cycle + 1}/${ritual.loopCount}`}
          </span>
          <Button variant="ghost" size="icon" onClick={handleExitEarly}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
          <AnimatePresence mode="wait">
            <motion.p
              key={`${cycle}-${stepIdx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5 }}
              className="text-2xl md:text-3xl font-display text-foreground max-w-xl leading-snug"
            >
              {currentStep.text}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Timer ring */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-20 h-20">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray={`${progress * 100} 100`}
                pathLength="100"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-display text-lg text-primary">
              {remaining}s
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPaused(p => !p)}>
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {paused ? 'Retomar' : 'Pausar'}
            </Button>
            <Button variant="outline" size="sm" onClick={advance}>
              <SkipForward className="w-4 h-4" /> Próxima
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
