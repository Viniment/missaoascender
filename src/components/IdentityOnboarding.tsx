import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Skull, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

const VALUE_SUGGESTIONS = [
  'Honra', 'Coragem', 'Disciplina', 'Amor-próprio', 'Lealdade',
  'Verdade', 'Presença', 'Foco', 'Calma', 'Gratidão',
];

const SABOTAGE_SUGGESTIONS = [
  'Você merece descansar.',
  'Começa amanhã.',
  'Uma vez não faz diferença.',
  'Você nunca consegue mesmo.',
  'Come só hoje.',
  'Não precisa hoje, está cansado.',
];

const TRAIT_SUGGESTIONS = [
  'Manipulador', 'Sedutor', 'Mentiroso', 'Covarde',
  'Especialista em desculpas', 'Sempre urgente', 'Sempre vítima',
];

export default function IdentityOnboarding({ open, onClose }: Props) {
  const { state, updateAlterEgo, updateInnerEnemy, completeIdentityOnboarding } = useGame();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);

  const ae = state.alterEgo ?? { name: '', values: [], lifeMission: '', identityPhrase: '', habits: [], goals: [], favoritePhrases: [], completed: false };
  const ie = state.innerEnemy ?? { name: '', traits: [], sabotagePhrases: [], completed: false };

  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const finish = () => {
    completeIdentityOnboarding();
    onClose();
    setStep(0);
  };

  const skip = () => {
    completeIdentityOnboarding();
    onClose();
    setStep(0);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-primary/30 max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[10px] tracking-[0.3em] text-primary/70 uppercase">
                Etapa {step + 1} de 4
              </p>
              <h2 className="font-display text-xl tracking-wider text-primary glow-text-purple mt-1">
                {step === 0 && 'A BATALHA INTERIOR'}
                {step === 1 && 'SEU ALTER EGO'}
                {step === 2 && 'SEU INIMIGO INTERNO'}
                {step === 3 && 'PRONTO'}
              </h2>
            </div>
            <button onClick={skip} className="text-foreground/40 hover:text-foreground transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {step === 0 && (
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <p>
                Existem duas versões de você lutando todos os dias.
              </p>
              <div className="rpg-panel border-primary/30 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm text-primary">O Alter Ego</p>
                  <p className="text-xs text-foreground/70 mt-1">Sua melhor versão. Cumpre promessas. Age mesmo sem motivação. Se ama.</p>
                </div>
              </div>
              <div className="rpg-panel border-destructive/30 flex gap-3 items-start">
                <Skull className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm text-destructive">O Inimigo Interno</p>
                  <p className="text-xs text-foreground/70 mt-1">Procrastina, cria desculpas, foge do desconforto. Quer te manter pequeno.</p>
                </div>
              </div>
              <p className="text-xs text-foreground/60 italic">
                Vamos dar nome e rosto a cada um. Isso muda tudo.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <Field label="Nome do Alter Ego">
                <Input
                  value={ae.name}
                  onChange={e => updateAlterEgo({ name: e.target.value })}
                  placeholder="Evolux"
                  className="bg-secondary border-border"
                  maxLength={30}
                />
              </Field>

              <Field label='Frase de identidade ("Sou alguém que...")'>
                <Textarea
                  value={ae.identityPhrase}
                  onChange={e => updateAlterEgo({ identityPhrase: e.target.value })}
                  placeholder="Sou alguém que honra a própria palavra."
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={140}
                />
              </Field>

              <Field label="Valores (toque para escolher)">
                <div className="flex flex-wrap gap-1.5">
                  {VALUE_SUGGESTIONS.map(v => {
                    const active = ae.values.includes(v);
                    return (
                      <button
                        key={v}
                        onClick={() => updateAlterEgo({ values: toggleInArray(ae.values, v) })}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-all',
                          active
                            ? 'bg-primary/20 border-primary/60 text-primary'
                            : 'bg-secondary border-border text-foreground/70 hover:border-primary/40'
                        )}
                      >
                        {v}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Missão de vida">
                <Textarea
                  value={ae.lifeMission}
                  onChange={e => updateAlterEgo({ lifeMission: e.target.value })}
                  placeholder="O que essa versão de você vive para fazer..."
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={300}
                />
              </Field>

              <Field label="Rotina ideal (opcional)">
                <Textarea
                  value={ae.idealRoutine || ''}
                  onChange={e => updateAlterEgo({ idealRoutine: e.target.value })}
                  placeholder="Como seria um dia perfeito dessa versão..."
                  className="bg-secondary border-border min-h-[60px]"
                  maxLength={400}
                />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-foreground/60">
                Dar nome ao inimigo é tirar o poder dele. Quando você o reconhecer, ele perde força.
              </p>

              <Field label="Nome do Inimigo Interno">
                <Input
                  value={ie.name}
                  onChange={e => updateInnerEnemy({ name: e.target.value })}
                  placeholder="EndMan"
                  className="bg-secondary border-border"
                  maxLength={30}
                />
              </Field>

              <Field label="Características (até 5)">
                <div className="flex flex-wrap gap-1.5">
                  {TRAIT_SUGGESTIONS.map(t => {
                    const active = ie.traits.includes(t);
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          if (!active && ie.traits.length >= 5) return;
                          updateInnerEnemy({ traits: toggleInArray(ie.traits, t) });
                        }}
                        className={cn(
                          'text-xs px-2.5 py-1 rounded-full border transition-all',
                          active
                            ? 'bg-destructive/20 border-destructive/60 text-destructive'
                            : 'bg-secondary border-border text-foreground/70 hover:border-destructive/40'
                        )}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Frases típicas de sabotagem (toque para escolher)">
                <div className="space-y-1.5">
                  {SABOTAGE_SUGGESTIONS.map(p => {
                    const active = ie.sabotagePhrases.includes(p);
                    return (
                      <button
                        key={p}
                        onClick={() => updateInnerEnemy({ sabotagePhrases: toggleInArray(ie.sabotagePhrases, p) })}
                        className={cn(
                          'w-full text-left text-xs px-3 py-2 rounded-md border transition-all',
                          active
                            ? 'bg-destructive/10 border-destructive/50 text-destructive'
                            : 'bg-secondary border-border text-foreground/70 hover:border-destructive/30'
                        )}
                      >
                        "{p}"
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <div className="rpg-panel border-primary/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="font-display text-sm text-primary">{ae.name || 'Evolux'}</p>
                </div>
                <p className="text-xs italic text-foreground/70">"{ae.identityPhrase}"</p>
              </div>
              <div className="rpg-panel border-destructive/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Skull className="w-4 h-4 text-destructive" />
                  <p className="font-display text-sm text-destructive">{ie.name || 'EndMan'}</p>
                </div>
                {ie.sabotagePhrases[0] && (
                  <p className="text-xs italic text-foreground/60">"{ie.sabotagePhrases[0]}"</p>
                )}
              </div>
              <p className="text-xs text-foreground/60 italic">
                A cada decisão, uma dessas versões fica mais forte. Qual delas vencerá hoje?
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={skip}
              className="text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Pular agora
            </button>
            <div className="flex gap-2">
              {step > 0 && step < 3 && (
                <Button variant="outline" size="sm" onClick={() => setStep((step - 1) as 0 | 1 | 2)}>
                  Voltar
                </Button>
              )}
              {step < 3 && (
                <Button size="sm" onClick={() => setStep((step + 1) as 1 | 2 | 3)}>
                  {step === 0 ? 'Começar' : 'Continuar'}
                </Button>
              )}
              {step === 3 && (
                <Button size="sm" onClick={finish}>
                  Iniciar a jornada
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-display tracking-widest text-foreground/60 uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}
