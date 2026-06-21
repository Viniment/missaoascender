import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
}

const VALUE_SUGGESTIONS = [
  'Honra', 'Coragem', 'Disciplina', 'Amor-próprio', 'Lealdade',
  'Verdade', 'Presença', 'Foco', 'Calma', 'Gratidão',
];

export default function IdentityOnboarding({ open, onClose }: Props) {
  const { state, updateAlterEgo, completeIdentityOnboarding } = useGame();
  const [step, setStep] = useState<0 | 1 | 2>(0);

  const ae = state.alterEgo ?? { name: '', values: [], lifeMission: '', identityPhrase: '', habits: [], goals: [], favoritePhrases: [], completed: false };

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
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[10px] tracking-[0.3em] text-primary/70 uppercase">
                Etapa {step + 1} de 3
              </p>
              <h2 className="font-display text-xl tracking-wider text-primary glow-text-purple mt-1">
                {step === 0 && 'A IDENTIDADE QUE VOCÊ ESTÁ CONSTRUINDO'}
                {step === 1 && 'SEU ALTER EGO'}
                {step === 2 && 'PRONTO'}
              </h2>
            </div>
            <button onClick={skip} className="text-foreground/40 hover:text-foreground transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {step === 0 && (
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <p>
                Toda evolução começa com uma decisão: <span className="text-primary">quem você quer se tornar?</span>
              </p>
              <div className="rpg-panel border-primary/30 flex gap-3 items-start">
                <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm text-primary">Seu Alter Ego</p>
                  <p className="text-xs text-foreground/70 mt-1">
                    A versão de você que já existe em potencial — disciplinada, amorosa, presente, fiel à própria palavra.
                    Não é fantasia, é o seu eu que está nascendo.
                  </p>
                </div>
              </div>
              <p className="text-xs text-foreground/60 italic">
                Vamos dar nome e forma a essa identidade. Cada escolha alinhada é uma prova de que ela é real.
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
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <div className="rpg-panel border-primary/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="font-display text-sm text-primary">{ae.name || 'Evolux'}</p>
                </div>
                <p className="text-xs italic text-foreground/70">"{ae.identityPhrase}"</p>
              </div>
              <p className="text-xs text-foreground/60 italic">
                Cada hábito cumprido, cada missão honrada, cada escolha amorosa é uma prova de que essa identidade já vive em você.
              </p>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              onClick={skip}
              className="text-[11px] text-foreground/40 hover:text-foreground/70 transition-colors"
            >
              Pular agora
            </button>
            <div className="flex gap-2">
              {step > 0 && step < 2 && (
                <Button variant="outline" size="sm" onClick={() => setStep((step - 1) as 0 | 1)}>
                  Voltar
                </Button>
              )}
              {step < 2 && (
                <Button size="sm" onClick={() => setStep((step + 1) as 1 | 2)}>
                  {step === 0 ? 'Começar' : 'Continuar'}
                </Button>
              )}
              {step === 2 && (
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
