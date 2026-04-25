import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send, ChevronDown, ChevronUp, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';
import RichEditor from './RichEditor';
type AwakeningExerciseType = 'consciencia' | 'confronto' | 'reprogramacao' | 'direcionamento' | 'quebra';

interface GeneratedExercise {
  title: string;
  prompt: string;
  type: AwakeningExerciseType;
  objective: string;
}

const TYPE_EMOJI: Record<AwakeningExerciseType, string> = {
  consciencia: '🔎',
  confronto: '⚔️',
  reprogramacao: '🧬',
  direcionamento: '🧭',
  quebra: '🔥',
};

export default function AwakeningPage() {
  const { state, addReflection, deleteReflection, appendAiAngle } = useGame();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const buildExercisesHtml = useCallback((
    detectedState: string,
    exercises: GeneratedExercise[],
    blocks: {
      situationReading?: string;
      patternsAndDistortions?: string;
      repositioning?: string;
      confrontation?: string;
      microAction?: string;
      identityReinforcement?: string;
    } = {},
  ) => {
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const parts: string[] = [
      `<h3>🌅 Despertar — ${detectedState}</h3>`,
      `<p><em>${dateStr}</em></p>`,
      `<hr/>`,
    ];

    const block = (emoji: string, title: string, content?: string) => {
      if (!content || !content.trim()) return;
      parts.push(`<h4>${emoji} ${title}</h4>`);
      parts.push(`<p>${content.replace(/\n/g, '<br/>')}</p>`);
    };

    block('🧠', 'Leitura da situação', blocks.situationReading);
    block('🔍', 'Padrões e distorções', blocks.patternsAndDistortions);
    block('⚖️', 'Reposicionamento', blocks.repositioning);
    block('⚔️', 'Confronto', blocks.confrontation);

    if (blocks.situationReading || blocks.patternsAndDistortions || blocks.repositioning || blocks.confrontation) {
      parts.push(`<hr/>`);
    }

    parts.push(`<h4>✍️ Escrita terapêutica</h4>`);
    exercises.forEach((ex, i) => {
      const emoji = TYPE_EMOJI[ex.type] || '✦';
      parts.push(`<h5>${i + 1}. ${emoji} ${ex.title}</h5>`);
      if (ex.objective) parts.push(`<p><em>${ex.objective}</em></p>`);
      parts.push(`<blockquote><p>${ex.prompt}</p></blockquote>`);
      parts.push(`<p><strong>Sua resposta:</strong></p>`);
      parts.push(`<p></p>`);
      parts.push(`<p></p>`);
    });

    if (blocks.microAction || blocks.identityReinforcement) {
      parts.push(`<hr/>`);
    }
    block('🔥', 'Micro-ação imediata', blocks.microAction);
    block('🧬', 'Reforço de identidade', blocks.identityReinforcement);

    return parts.join('');
  }, []);

  const handleGenerate = useCallback(async () => {
    if (loadingAI) return;

    // Confirm overwrite if editor has meaningful content
    const hasContent = answer && answer.replace(/<[^>]+>/g, '').trim().length > 0;
    if (hasContent) {
      const ok = window.confirm('O campo já tem conteúdo. Substituir pelas perguntas geradas?');
      if (!ok) return;
    }

    setLoadingAI(true);
    try {
      const ctx = buildAiContext(state);
      const { data, error } = await supabase.functions.invoke('awakening-questions', {
        body: {
          // Compat: mantém campos antigos que a edge ainda lê
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
          // NOVO: contexto rico + ângulos
          context: ctx,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const exs: GeneratedExercise[] = data?.exercises || [];
      if (exs.length < 3) throw new Error('Não foi possível gerar exercícios.');

      const detectedState = data.detectedState || 'Reflexão profunda';
      if (data.angle) appendAiAngle(data.angle);
      const html = buildExercisesHtml(detectedState, exs);

      setQuestion(`Despertar — ${detectedState}`);
      setAnswer(html);

      // Toast diferenciado por modo (reconhece evolução em vez do genérico)
      const mode = data.mode as string | undefined;
      if (mode === 'evolution') toast.success('✨ Reconhecendo sua evolução. Responda os exercícios abaixo.');
      else if (mode === 'expansion') toast.success('🚀 Modo expansão ativado. Próximo nível.');
      else if (mode === 'mirror') toast.success('🪞 Modo espelho — confronte o que aconteceu esta semana.');
      else toast.success('Perguntas inseridas. Responda abaixo de cada uma.');

      // Scroll to editor
      setTimeout(() => {
        const el = document.querySelector('.ProseMirror') as HTMLElement | null;
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || 'Erro ao gerar exercícios.';
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
  }, [loadingAI, state, answer, buildExercisesHtml]);

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

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
        <Eye className="w-8 h-8 text-primary mx-auto animate-pulse-glow" />
        <h2 className="font-display text-xl text-primary glow-text-purple">DESPERTAR</h2>
        <p className="text-xs text-foreground/60">Seu espaço. Suas perguntas. Suas respostas.</p>
      </motion.div>

      {/* New reflection block */}
      <div className="rpg-panel space-y-4">
        <Button
          variant="outline"
          className="w-full border-primary/40 hover:bg-primary/10 text-[11px] sm:text-sm font-display uppercase tracking-wider px-2 sm:px-4"
          onClick={handleGenerate}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" /> <span className="truncate">Analisando...</span></>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
              <span className="truncate">Gerador de Exercícios</span>
            </>
          )}
        </Button>
        <p className="text-[10px] text-foreground/40 text-center -mt-2">
          Tom e quantidade controlados em <span className="text-primary">Configurações → IA Comportamental</span>.
        </p>

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

      {/* History */}
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
