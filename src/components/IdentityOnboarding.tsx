import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Shield, Sparkles, X, Flame, Loader2, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onClose: () => void;
}

const VALUE_SUGGESTIONS = [
  'Honra', 'Coragem', 'Disciplina', 'Amor-próprio', 'Lealdade',
  'Verdade', 'Presença', 'Foco', 'Calma', 'Gratidão',
];

// Perguntas brutais — usadas pela IA para forjar o Alter Ego.
const BRUTAL_QUESTIONS: { key: string; label: string; placeholder: string }[] = [
  { key: 'sonho_oculto', label: 'Qual é o sonho mais ousado que você ainda não admite em voz alta?', placeholder: 'Diga em voz alta aqui. Sem filtro.' },
  { key: 'versao_poderosa', label: 'Se você acordasse amanhã sendo a sua versão mais poderosa, o que estaria fazendo agora?', placeholder: 'Descreva a cena.' },
  { key: 'talento_sabotado', label: 'Que talento ou habilidade você sabota há anos?', placeholder: 'O que existe em você que você teima em apagar?' },
  { key: 'odio_espelho', label: 'O que você mais odeia ver quando se olha no espelho hoje?', placeholder: 'Sem suavizar.' },
  { key: 'quem_morre', label: 'Quem você precisa parar de ser para virar essa versão?', placeholder: 'Padrões, máscaras, desculpas — nomeie.' },
  { key: 'habitos_diarios', label: 'Quais 3 hábitos diários definem a vida dessa versão?', placeholder: 'Concretos. Executáveis.' },
  { key: 'areas_reconstruir', label: 'Quais áreas (corpo, mente, dinheiro, relações, propósito, espiritual) precisam ser destruídas e reconstruídas?', placeholder: 'Liste e diga porquê.' },
  { key: 'frase_diaria', label: 'Qual frase você precisa ouvir todos os dias até virar verdade na sua carne?', placeholder: 'Uma frase. Direta.' },
  { key: 'valores_inegociaveis', label: 'Quais valores essa versão NÃO negocia em nenhuma circunstância?', placeholder: 'Liste com firmeza.' },
  { key: 'preco_de_nao_virar', label: 'O que a vida vai cobrar de você daqui a 5 anos se você NÃO se tornar essa pessoa?', placeholder: 'Olhe esse futuro de frente.' },
];

type Mode = 'intro' | 'interview' | 'forging' | 'review' | 'manual' | 'done';

export default function IdentityOnboarding({ open, onClose }: Props) {
  const { state, updateAlterEgo, completeIdentityOnboarding } = useGame();
  const [mode, setMode] = useState<Mode>('intro');
  const [qIdx, setQIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [forging, setForging] = useState(false);

  const ae = state.alterEgo ?? { name: '', values: [], lifeMission: '', identityPhrase: '', habits: [], goals: [], favoritePhrases: [], completed: false };

  const toggleInArray = (arr: string[], v: string) =>
    arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v];

  const reset = () => { setMode('intro'); setQIdx(0); };

  const finish = () => {
    completeIdentityOnboarding();
    onClose();
    reset();
  };

  const skip = () => {
    completeIdentityOnboarding();
    onClose();
    reset();
  };

  const forgeWithAI = async () => {
    const filled = Object.entries(answers).filter(([, v]) => v && v.trim().length > 5);
    if (filled.length < 4) {
      toast.error('Responda pelo menos 4 perguntas com profundidade antes de forjar.');
      return;
    }
    setForging(true);
    setMode('forging');
    try {
      const labeledAnswers: Record<string, string> = {};
      BRUTAL_QUESTIONS.forEach(q => {
        if (answers[q.key]?.trim()) labeledAnswers[q.label] = answers[q.key].trim();
      });
      const { data, error } = await supabase.functions.invoke('alter-ego-architect', {
        body: {
          userName: state.name || '',
          answers: labeledAnswers,
          currentAlterEgo: ae,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      updateAlterEgo({
        name: data.name || ae.name,
        identityPhrase: data.identityPhrase || ae.identityPhrase,
        values: Array.isArray(data.values) ? data.values : ae.values,
        lifeMission: data.lifeMission || ae.lifeMission,
        idealRoutine: data.idealRoutine || ae.idealRoutine,
        favoritePhrases: Array.isArray(data.favoritePhrases) ? data.favoritePhrases : ae.favoritePhrases,
        habits: Array.isArray(data.habits) ? data.habits : ae.habits,
        goals: Array.isArray(data.goals) ? data.goals : ae.goals,
        appearance: data.appearance || ae.appearance,
        lifestyle: data.lifestyle || ae.lifestyle,
        notes: data.notes || ae.notes,
      });
      toast.success('🔥 Alter Ego forjado.');
      setMode('review');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao forjar Alter Ego.');
      setMode('interview');
    } finally {
      setForging(false);
    }
  };

  const headerTitle = (() => {
    switch (mode) {
      case 'intro': return 'A IDENTIDADE QUE VOCÊ ESTÁ FORJANDO';
      case 'interview': return 'ENTREVISTA BRUTAL';
      case 'forging': return 'FORJANDO...';
      case 'review': return 'SEU ALTER EGO';
      case 'manual': return 'AJUSTE MANUAL';
      case 'done': return 'PRONTO';
    }
  })();

  const current = BRUTAL_QUESTIONS[qIdx];
  const answeredCount = Object.values(answers).filter(v => v && v.trim().length > 5).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-primary/30 max-w-xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-[10px] tracking-[0.3em] text-primary/70 uppercase">
                {mode === 'interview' ? `Pergunta ${qIdx + 1} de ${BRUTAL_QUESTIONS.length}` : 'Forja de Identidade'}
              </p>
              <h2 className="font-display text-xl tracking-wider text-primary glow-text-purple mt-1">
                {headerTitle}
              </h2>
            </div>
            <button onClick={skip} className="text-foreground/40 hover:text-foreground transition-colors p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          {mode === 'intro' && (
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <p>
                Toda evolução começa com uma decisão: <span className="text-primary">quem você precisa se tornar?</span>
              </p>
              <div className="rpg-panel border-primary/30 flex gap-3 items-start">
                <Flame className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-display text-sm text-primary">Forja com IA</p>
                  <p className="text-xs text-foreground/70 mt-1">
                    A IA vai te fazer perguntas brutalmente honestas sobre seus sonhos, sabotagens e o que você precisa
                    destruir em si. Com base nas suas respostas, ela forja o seu Alter Ego — nome, frase de identidade,
                    valores, hábitos, rotina e manifesto diário.
                  </p>
                </div>
              </div>
              <p className="text-xs text-foreground/60 italic">
                Responda sem filtro. Quanto mais verdade, mais poderosa a forja.
              </p>
            </div>
          )}

          {mode === 'interview' && current && (
            <div className="space-y-4">
              <div className="rpg-panel border-primary/30 space-y-3">
                <p className="font-display text-sm text-primary leading-relaxed">{current.label}</p>
                <Textarea
                  value={answers[current.key] || ''}
                  onChange={e => setAnswers(a => ({ ...a, [current.key]: e.target.value }))}
                  placeholder={current.placeholder}
                  className="bg-secondary border-border min-h-[120px] text-sm"
                  maxLength={800}
                  autoFocus
                />
                <p className="text-[10px] text-foreground/40 text-right">{(answers[current.key] || '').length}/800</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-foreground/50">
                <span>{answeredCount} respondidas · mínimo 4 para forjar</span>
                <button
                  onClick={() => setMode('manual')}
                  className="underline hover:text-foreground/80"
                >
                  prefiro preencher manualmente
                </button>
              </div>
            </div>
          )}

          {mode === 'forging' && (
            <div className="py-10 flex flex-col items-center gap-4 text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="font-display text-sm text-primary tracking-wider">FORJANDO SUA IDENTIDADE...</p>
              <p className="text-xs text-foreground/60 max-w-sm">
                A IA está lendo suas respostas e moldando a versão mais poderosa de você. Isso pode levar alguns segundos.
              </p>
            </div>
          )}

          {(mode === 'review' || mode === 'manual') && (
            <div className="space-y-4">
              {mode === 'review' && (
                <p className="text-xs text-foreground/60 italic">
                  Revise, ajuste o que quiser e siga. Tudo pode ser editado depois.
                </p>
              )}
              <Field label="Nome do Alter Ego">
                <Input
                  value={ae.name}
                  onChange={e => updateAlterEgo({ name: e.target.value })}
                  placeholder="Forjado pela IA ou escolha o seu"
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
                  {Array.from(new Set([...(ae.values || []), ...VALUE_SUGGESTIONS])).map(v => {
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

              <Field label="Rotina ideal">
                <Textarea
                  value={ae.idealRoutine || ''}
                  onChange={e => updateAlterEgo({ idealRoutine: e.target.value })}
                  placeholder="Como seria um dia perfeito dessa versão..."
                  className="bg-secondary border-border min-h-[80px]"
                  maxLength={400}
                />
              </Field>

              {(ae.notes || mode === 'review') && (
                <Field label="Manifesto diário (leia todo dia)">
                  <Textarea
                    value={ae.notes || ''}
                    onChange={e => updateAlterEgo({ notes: e.target.value })}
                    placeholder="Manifesto curto em 2ª pessoa que confronta seus padrões e ancora a nova identidade."
                    className="bg-secondary border-border min-h-[100px]"
                  />
                </Field>
              )}
            </div>
          )}

          {mode === 'done' && (
            <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
              <div className="rpg-panel border-primary/40 space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  <p className="font-display text-sm text-primary">{ae.name || 'Sem nome ainda'}</p>
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
              {mode === 'intro' && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setMode('manual')}>Preencher manual</Button>
                  <Button size="sm" onClick={() => setMode('interview')}>
                    <Flame className="w-3.5 h-3.5 mr-1.5" /> Começar entrevista
                  </Button>
                </>
              )}

              {mode === 'interview' && (
                <>
                  {qIdx > 0 && (
                    <Button variant="outline" size="sm" onClick={() => setQIdx(i => Math.max(0, i - 1))}>Voltar</Button>
                  )}
                  {qIdx < BRUTAL_QUESTIONS.length - 1 && (
                    <Button size="sm" onClick={() => setQIdx(i => Math.min(BRUTAL_QUESTIONS.length - 1, i + 1))}>
                      Próxima
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant={qIdx === BRUTAL_QUESTIONS.length - 1 ? 'default' : 'secondary'}
                    onClick={forgeWithAI}
                    disabled={forging || answeredCount < 4}
                  >
                    <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                    Forjar Alter Ego
                  </Button>
                </>
              )}

              {(mode === 'review' || mode === 'manual') && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setMode('interview')}>
                    {mode === 'review' ? 'Reentrevistar' : 'Usar IA'}
                  </Button>
                  <Button size="sm" onClick={() => setMode('done')} disabled={!ae.name?.trim() || !ae.identityPhrase?.trim()}>
                    Continuar
                  </Button>
                </>
              )}

              {mode === 'done' && (
                <Button size="sm" onClick={finish}>Iniciar a jornada</Button>
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
