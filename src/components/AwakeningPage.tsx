import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send, ChevronDown, ChevronUp, Trash2, Sparkles, Loader2, Flame, Zap, Sprout, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';
import RichEditor from './RichEditor';
import DailyRitualDialog from './DailyRitualDialog';
import SabotageConfrontDialog from './SabotageConfrontDialog';
import { getTodayBrasilia } from '@/lib/utils';

interface AwakeningQuestion {
  title: string;
  prompt: string;
  objective: string;
}

interface AwakeningResponse {
  detectedState?: string;
  theme?: string;
  intensity?: 'leve' | 'medio' | 'brutal';
  angle?: string;
  mode?: string;
  opening?: string;
  painOfInaction?: string;
  confrontation?: string;
  pleasureOfAction?: string;
  microAction?: string;
  identityAnchor?: string;
  questions?: AwakeningQuestion[];
}

const THEMES: Array<{ id: string; label: string }> = [
  { id: 'auto', label: '✨ Auto (IA decide)' },
  { id: 'procrastinacao', label: 'Procrastinação' },
  { id: 'disciplina', label: 'Disciplina' },
  { id: 'foco', label: 'Foco' },
  { id: 'consistencia', label: 'Consistência' },
  { id: 'academia', label: 'Academia' },
  { id: 'corpo', label: 'Corpo' },
  { id: 'emagrecimento', label: 'Emagrecimento' },
  { id: 'autossabotagem', label: 'Autossabotagem' },
  { id: 'autoestima', label: 'Autoestima' },
  { id: 'identidade', label: 'Identidade' },
  { id: 'futuro', label: 'Futuro' },
  { id: 'ansiedade', label: 'Ansiedade' },
  { id: 'medo', label: 'Medo' },
  { id: 'dopamina_barata', label: 'Dopamina barata' },
  { id: 'redes_sociais', label: 'Redes sociais' },
  { id: 'pornografia', label: 'Pornografia' },
  { id: 'vicios', label: 'Vícios' },
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'produtividade', label: 'Produtividade' },
  { id: 'relacionamentos', label: 'Relacionamentos' },
];

const LIFE_AREAS = ['Corpo', 'Mente', 'Carreira', 'Relacionamentos', 'Espiritual', 'Financeiro'];
const EMOTIONAL_GOALS = ['Urgência', 'Coragem', 'Orgulho', 'Foco', 'Raiva produtiva', 'Clareza'];

export default function AwakeningPage() {
  const { state, addReflection, deleteReflection, appendAiAngle } = useGame();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // Seletores
  const [theme, setTheme] = useState<string>('auto');
  const [intensity, setIntensity] = useState<'leve' | 'medio' | 'brutal'>('medio');
  const [lifeArea, setLifeArea] = useState<string>('');
  const [emotionalGoal, setEmotionalGoal] = useState<string>('');

  // Tony Robbins layer
  const [ritualOpen, setRitualOpen] = useState(false);
  const [activeSabotage, setActiveSabotage] = useState<any>(null);
  const today = getTodayBrasilia();
  const ritualDoneToday = state.dailyRitual?.lastCompletedDate === today;
  const activePatterns = (state.sabotagePatterns || []).filter(p => !p.resolved);

  const buildExperienceHtml = useCallback((r: AwakeningResponse) => {
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const intensityLabel = r.intensity === 'brutal' ? '🔥 BRUTAL' : r.intensity === 'leve' ? '🌱 LEVE' : '⚡ MÉDIO';
    const parts: string[] = [
      `<h3>🌅 Despertar — ${r.detectedState || 'Reflexão profunda'}</h3>`,
      `<p><em>${dateStr} · ${intensityLabel}${r.theme && r.theme !== 'auto' ? ` · ${r.theme}` : ''}</em></p>`,
      `<hr/>`,
    ];

    const block = (emoji: string, title: string, content?: string) => {
      if (!content || !content.trim()) return;
      parts.push(`<h4>${emoji} ${title}</h4>`);
      parts.push(`<p>${content.replace(/\n/g, '<br/>')}</p>`);
    };

    block('🎬', 'Abertura', r.opening);
    block('💀', 'Dor da inação', r.painOfInaction);
    block('🔥', 'Confronto', r.confrontation);
    block('✨', 'Prazer da ação', r.pleasureOfAction);

    if (r.questions && r.questions.length > 0) {
      parts.push(`<hr/>`);
      parts.push(`<h4>✍️ Perguntas de impacto</h4>`);
      r.questions.forEach((q, i) => {
        parts.push(`<h5>${i + 1}. ${q.title}</h5>`);
        if (q.objective) parts.push(`<p><em>${q.objective}</em></p>`);
        parts.push(`<blockquote><p>${q.prompt}</p></blockquote>`);
        parts.push(`<p><strong>Sua resposta:</strong></p>`);
        parts.push(`<p></p>`);
        parts.push(`<p></p>`);
      });
    }

    if (r.microAction || r.identityAnchor) parts.push(`<hr/>`);
    block('⚡', 'Ativação imediata', r.microAction);
    block('🧬', 'Âncora de identidade', r.identityAnchor);

    return parts.join('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (loadingAI) return;

    const hasContent = answer && answer.replace(/<[^>]+>/g, '').trim().length > 0;
    if (hasContent) {
      const ok = window.confirm('O campo já tem conteúdo. Substituir pelo despertar gerado?');
      if (!ok) return;
    }

    setLoadingAI(true);
    try {
      const ctx = buildAiContext(state);
      const { data, error } = await supabase.functions.invoke('awakening-questions', {
        body: {
          theme,
          intensity,
          lifeArea: lifeArea || undefined,
          emotionalGoal: emotionalGoal || undefined,
          journal: ctx.recentJournal.slice(0, 3),
          awakening: ctx.awakening,
          rank: ctx.rank,
          reflections: (state.reflections || []).slice(0, 5).map(r => ({
            question: r.question, answerHtml: r.answerHtml, date: r.date,
          })),
          missions: (state.missions || []).map(m => ({ name: m.name, status: m.status })),
          habits: (state.habits || []).map(h => ({ name: h.name, history: h.history })),
          punishments: (state.failureProtocols || []).map(p => ({ status: p.status, reason: p.reason })),
          aiSettings: state.aiSettings,
          context: ctx,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const res = data as AwakeningResponse;
      if (!res.questions || res.questions.length < 3) throw new Error('Não foi possível gerar o despertar.');

      if (res.angle) appendAiAngle(res.angle);
      const html = buildExperienceHtml(res);

      setQuestion(`Despertar — ${res.detectedState || 'Reflexão'}`);
      setAnswer(html);

      if (res.intensity === 'brutal') toast.success('🔥 Sem anestesia.');
      else if (res.intensity === 'leve') toast.success('🌱 Respira e olha.');
      else toast.success('⚡ Encare.');

      setTimeout(() => {
        const el = document.querySelector('.ProseMirror') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Erro ao gerar despertar.';
      if (msg.includes('429') || msg.toLowerCase().includes('limite')) {
        toast.error('Limite de requisições. Tente em alguns segundos.');
      } else if (msg.includes('402') || msg.toLowerCase().includes('crédito')) {
        toast.error('Créditos insuficientes na IA.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoadingAI(false);
    }
  }, [loadingAI, state, answer, theme, intensity, lifeArea, emotionalGoal, buildExperienceHtml, appendAiAngle]);

  const handleSave = useCallback(() => {
    if (submittingRef.current) return;
    if (!question.trim() || !answer.trim() || answer === '<p></p>') {
      toast.error('Preencha a pergunta e a resposta.');
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addReflection({ question, answerHtml: answer, date: new Date().toISOString() });
      setQuestion('');
      setAnswer('');
      toast.success('Reflexão salva! +15 XP');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  }, [question, answer, addReflection]);

  const Chip = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-display uppercase tracking-wider transition-all ${
        active
          ? 'bg-primary text-primary-foreground border border-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]'
          : 'bg-secondary/50 text-foreground/70 border border-border hover:border-primary/40 hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
        <Eye className="w-8 h-8 text-primary mx-auto animate-pulse-glow" />
        <h2 className="font-display text-xl text-primary glow-text-purple">DESPERTAR</h2>
        <p className="text-xs text-foreground/60">Quebre a procrastinação. Destrua a autossabotagem. Mova-se agora.</p>
      </motion.div>

      {/* Seletores */}
      <div className="rpg-panel space-y-4">
        {/* Intensidade */}
        <div>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-display mb-2">Intensidade</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setIntensity('leve')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display uppercase tracking-wider transition-all ${
                intensity === 'leve'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                  : 'bg-secondary/50 text-foreground/60 border border-border hover:border-emerald-500/30'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" /> Leve
            </button>
            <button
              type="button"
              onClick={() => setIntensity('medio')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display uppercase tracking-wider transition-all ${
                intensity === 'medio'
                  ? 'bg-primary/20 text-primary border border-primary/60 shadow-[0_0_12px_hsl(var(--primary)/0.4)]'
                  : 'bg-secondary/50 text-foreground/60 border border-border hover:border-primary/30'
              }`}
            >
              <Zap className="w-3.5 h-3.5" /> Médio
            </button>
            <button
              type="button"
              onClick={() => setIntensity('brutal')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-display uppercase tracking-wider transition-all ${
                intensity === 'brutal'
                  ? 'bg-red-500/20 text-red-300 border border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-secondary/50 text-foreground/60 border border-border hover:border-red-500/30'
              }`}
            >
              <Flame className="w-3.5 h-3.5" /> Brutal
            </button>
          </div>
        </div>

        {/* Tema */}
        <div>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-display mb-2">Tema</p>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map(t => (
              <Chip key={t.id} active={theme === t.id} onClick={() => setTheme(t.id)}>
                {t.label}
              </Chip>
            ))}
          </div>
        </div>

        {/* Área da vida (opcional) */}
        <div>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-display mb-2">Área da vida (opcional)</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={lifeArea === ''} onClick={() => setLifeArea('')}>Qualquer</Chip>
            {LIFE_AREAS.map(a => (
              <Chip key={a} active={lifeArea === a} onClick={() => setLifeArea(a)}>{a}</Chip>
            ))}
          </div>
        </div>

        {/* Objetivo emocional (opcional) */}
        <div>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wider font-display mb-2">Objetivo emocional (opcional)</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={emotionalGoal === ''} onClick={() => setEmotionalGoal('')}>IA decide</Chip>
            {EMOTIONAL_GOALS.map(g => (
              <Chip key={g} active={emotionalGoal === g} onClick={() => setEmotionalGoal(g)}>{g}</Chip>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full border-primary/40 hover:bg-primary/10 text-[11px] sm:text-sm font-display uppercase tracking-wider px-2 sm:px-4"
          onClick={handleGenerate}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> <span className="truncate">Despertando...</span></>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
              <span className="truncate">Gerar Despertar</span>
            </>
          )}
        </Button>
      </div>

      {/* Editor */}
      <div className="rpg-panel space-y-4">
        <Input
          placeholder="Sua pergunta..."
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="bg-secondary/50 border-border font-display text-base"
        />

        <RichEditor
          content={answer}
          onChange={setAnswer}
          placeholder="Escreva sua reflexão..."
        />

        <Button className="w-full" onClick={handleSave} disabled={!question.trim() || submitting}>
          <Send className="w-4 h-4 mr-2" /> Salvar Reflexão
        </Button>
      </div>

      {/* Histórico */}
      {state.reflections && state.reflections.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs text-foreground/50 uppercase tracking-wider font-display">
            📚 Registros ({state.reflections.length})
          </h3>

          {state.reflections.map(entry => {
            const isExpanded = expandedId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rpg-panel"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{entry.question}</p>
                    <span className="text-xs text-foreground/50">
                      {new Date(entry.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-foreground/50 hover:text-destructive"
                      onClick={e => { e.stopPropagation(); deleteReflection(entry.id); toast.info('Reflexão removida.'); }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/50" /> : <ChevronDown className="w-4 h-4 text-foreground/50" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-border"
                    >
                      <div
                        className="prose prose-invert prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: entry.answerHtml }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
