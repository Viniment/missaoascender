import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send, ChevronDown, ChevronUp, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import RichEditor from './RichEditor';

export default function AwakeningPage() {
  const { state, addReflection, deleteReflection } = useGame();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const handleSuggest = useCallback(async () => {
    if (loadingAI) return;
    setLoadingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke('awakening-questions', {
        body: {
          journal: (state.journal || []).slice(0, 3).map(j => ({
            title: j.title,
            text: j.text,
            emotion: j.emotion,
            intensity: j.intensity,
            deepMode: j.deepMode,
          })),
          awakening: state.awakening,
          rank: state.rank,
          reflections: (state.reflections || []).slice(0, 5).map(r => ({
            question: r.question,
            answerHtml: r.answerHtml,
            date: r.date,
          })),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const questions: string[] = data?.questions || [];
      if (questions.length === 0) throw new Error('Nenhuma pergunta gerada');

      const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
      const html = [
        `<p><strong>Reflexão guiada — ${dateStr}</strong></p>`,
        `<p></p>`,
        ...questions.flatMap((q, i) => [
          `<p><strong>${i + 1}. ${q}</strong></p>`,
          `<p><em>Responda aqui...</em></p>`,
          `<p></p>`,
        ]),
      ].join('');

      setQuestion('[IA] 5 perguntas de reflexão');
      setAnswer(html);
      toast.success('Perguntas geradas! Responda cada uma abaixo.');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao gerar perguntas.');
    } finally {
      setLoadingAI(false);
    }
  }, [loadingAI, state.journal, state.awakening, state.rank]);

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
          className="w-full border-primary/40 hover:bg-primary/10"
          onClick={handleSuggest}
          disabled={loadingAI}
        >
          {loadingAI ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando perguntas...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2 text-primary" /> Sugerir perguntas (IA)</>
          )}
        </Button>

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
