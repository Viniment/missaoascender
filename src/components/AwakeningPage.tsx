import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send, ChevronDown, ChevronUp, Trash2, Sparkles, Loader2, AlertTriangle, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';
import RichEditor from './RichEditor';
import SabotageConfrontDialog from './SabotageConfrontDialog';

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

export default function AwakeningPage() {
  const { state, addReflection, deleteReflection, updateReflection, appendAiAngle } = useGame();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  // IA decide tudo a partir do contexto dos últimos 7 dias
  const [activeSabotage, setActiveSabotage] = useState<any>(null);
  const activePatterns = (state.sabotagePatterns || []).filter(p => !p.resolved);

  const buildExperienceHtml = useCallback((r: AwakeningResponse) => {
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const intensityLabel = r.intensity === 'brutal' ? '🔥 VERDADE NUA' : r.intensity === 'leve' ? '🌱 SUSSURRO' : '⚡ ESPELHO';
    const parts: string[] = [
      `<h3>🌅 Despertar — ${r.detectedState || 'Voltando para mim'}</h3>`,
      `<p><em>${dateStr} · ${intensityLabel}${r.theme && r.theme !== 'auto' ? ` · ${r.theme}` : ''}</em></p>`,
      `<hr/>`,
    ];

    const block = (emoji: string, title: string, content?: string) => {
      if (!content || !content.trim()) return;
      parts.push(`<h4>${emoji} ${title}</h4>`);
      parts.push(`<p>${content.replace(/\n/g, '<br/>')}</p>`);
    };

    block('🪞', 'Onde você está', r.opening);
    block('💧', 'O que tem sido perdido em silêncio', r.painOfInaction);
    block('🤍', 'A verdade dita com amor', r.confrontation);
    block('✨', 'Quem você se torna ao voltar pra si', r.pleasureOfAction);

    if (r.questions && r.questions.length > 0) {
      parts.push(`<hr/>`);
      parts.push(`<h4>✍️ Perguntas para se reencontrar</h4>`);
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
    block('🌱', 'Pequeno ato de amor-próprio hoje', r.microAction);
    block('🧬', 'Quem eu sou quando me escolho', r.identityAnchor);

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

      if (res.intensity === 'brutal') toast.success('🤍 Verdade nua, dita com amor.');
      else if (res.intensity === 'leve') toast.success('🌱 Respira. Você voltou.');
      else toast.success('✨ Olha pra você com carinho.');

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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="text-center space-y-2">
        <Eye className="w-8 h-8 text-primary mx-auto animate-pulse-glow" />
        <h2 className="font-display text-xl text-primary glow-text-purple">DESPERTAR</h2>
        <p className="text-xs text-foreground/60 italic">Hoje você se escolhe novamente?</p>
      </motion.div>



      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`rpg-panel ${ritualDoneToday ? 'border-success/30 bg-success/5' : 'border-primary/40 bg-primary/5'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-primary/80 font-display">🌅 Ritual de Hoje</p>
            {ritualDoneToday ? (
              <>
                <p className="text-sm text-foreground/90 mt-1">✅ Cumprido. Identidade: <strong className="text-primary">{state.dailyRitual?.identityChosen}</strong></p>
                <p className="text-[11px] text-foreground/60 italic mt-1">"{state.dailyRitual?.commitment}"</p>
              </>
            ) : (
              <p className="text-sm text-foreground/80 mt-1">4 passos. 3 minutos. Ativa quem você quer ser hoje.</p>
            )}
          </div>
          <Button size="sm" variant={ritualDoneToday ? 'outline' : 'default'} onClick={() => setRitualOpen(true)}>
            <Flame className="w-3.5 h-3.5 mr-1" />{ritualDoneToday ? 'Refazer' : 'Iniciar'}
          </Button>
        </div>
        {(state.dailyRitual?.streak ?? 0) > 0 && (
          <p className="text-[10px] text-foreground/50 mt-2">🔥 {state.dailyRitual!.streak} dias consecutivos</p>
        )}
      </motion.div>

      {activePatterns.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel border-destructive/40 bg-destructive/5">
          <p className="text-[10px] uppercase tracking-wider text-destructive font-display flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" /> 🩸 {activePatterns.length} padrão{activePatterns.length > 1 ? 'ões' : ''} de fuga detectado{activePatterns.length > 1 ? 's' : ''}
          </p>
          <ul className="space-y-1.5 mt-2">
            {activePatterns.slice(0, 3).map(p => (
              <li key={p.id}>
                <button type="button" onClick={() => setActiveSabotage(p)} className="w-full text-left text-xs text-foreground/85 hover:text-foreground p-2 rounded bg-background/40 border border-border/40 hover:border-destructive/40 transition">
                  {p.pattern}
                </button>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <DailyRitualDialog open={ritualOpen} onClose={() => setRitualOpen(false)} />
      <SabotageConfrontDialog pattern={activeSabotage} onClose={() => setActiveSabotage(null)} />

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
            const isEditing = editingId === entry.id;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rpg-panel"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => { if (!isEditing) setExpandedId(isExpanded ? null : entry.id); }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{entry.question}</p>
                    <span className="text-xs text-foreground/50">
                      {new Date(entry.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isEditing && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-foreground/50 hover:text-primary"
                        onClick={e => {
                          e.stopPropagation();
                          setEditingId(entry.id);
                          setEditQuestion(entry.question);
                          setEditAnswer(entry.answerHtml);
                          setExpandedId(entry.id);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    )}
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
                      {isEditing ? (
                        <div className="space-y-3">
                          <Input
                            value={editQuestion}
                            onChange={e => setEditQuestion(e.target.value)}
                            className="bg-secondary/50 border-border font-display text-base"
                            placeholder="Pergunta..."
                          />
                          <RichEditor
                            content={editAnswer}
                            onChange={setEditAnswer}
                            placeholder="Edite sua reflexão..."
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1"
                              onClick={() => {
                                if (!editQuestion.trim() || !editAnswer.trim() || editAnswer === '<p></p>') {
                                  toast.error('Preencha pergunta e resposta.');
                                  return;
                                }
                                updateReflection(entry.id, { question: editQuestion, answerHtml: editAnswer });
                                setEditingId(null);
                                toast.success('Reflexão atualizada.');
                              }}
                            >
                              <Save className="w-3.5 h-3.5 mr-1.5" /> Salvar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              <X className="w-3.5 h-3.5 mr-1.5" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="prose prose-invert prose-sm max-w-none text-foreground"
                          dangerouslySetInnerHTML={{ __html: entry.answerHtml }}
                        />
                      )}
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
