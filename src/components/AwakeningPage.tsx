import { useState, useCallback, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send, ChevronDown, ChevronUp, Trash2, Sparkles, Loader2, Pencil, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';
import RichEditor from './RichEditor';

interface AwakeningQuestion {
  zone?: 'acolhimento' | 'identidade' | 'futuro' | 'reenquadramento';
  title: string;
  prompt: string;
  objective: string;
}

interface AwakeningResponse {
  detectedState?: string;
  intensity?: 'leve' | 'medio' | 'brutal';
  checkIn?: string;
  alterEgoEmergence?: string;
  futureGlimpse?: string;
  currentSelfPattern?: string;
  alterEgoTruth?: string;
  questions?: AwakeningQuestion[];
  internalDialogue?: { currentSelfSays?: string; alterEgoReplies?: string };
  reframe?: string;
  identityProof?: string;
  identityProofSuggestions?: string[];
  identityAnchor?: string;
  alterEgoName?: string;
  currentSelfName?: string;
}

const ZONE_META: Record<string, { emoji: string; label: string }> = {
  acolhimento: { emoji: '🤍', label: 'Acolhimento' },
  identidade: { emoji: '⚡', label: 'Identidade' },
  futuro: { emoji: '🌅', label: 'Futuro' },
  reenquadramento: { emoji: '🪞', label: 'Reenquadramento' },
};

export default function AwakeningPage() {
  const { state, addReflection, deleteReflection, updateReflection } = useGame();
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);

  const buildExperienceHtml = useCallback((r: AwakeningResponse) => {
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
    const intensityLabel = r.intensity === 'brutal' ? '🔥 VERDADE COM AMOR' : r.intensity === 'leve' ? '🌱 SUSSURRO' : '⚡ ESPELHO GENTIL';
    const ae = r.alterEgoName || 'seu Alter Ego';
    const cs = r.currentSelfName || 'Eu Atual';
    const parts: string[] = [
      `<h3>🌅 Despertar — ${r.detectedState || ae}</h3>`,
      `<p><em>${dateStr} · ${intensityLabel} · ${ae} guiando</em></p>`,
      `<hr/>`,
    ];

    const block = (emoji: string, title: string, content?: string) => {
      if (!content || !content.trim()) return;
      parts.push(`<h4>${emoji} ${title}</h4>`);
      parts.push(`<p>${content.replace(/\n/g, '<br/>')}</p>`);
    };

    block('🤍', `Como você está hoje`, r.checkIn);
    block('⚡', `Onde o ${ae} já está vivo`, r.alterEgoEmergence);
    block('🌅', `Vislumbre do futuro próximo`, r.futureGlimpse);
    block('🌱', `Um padrão do ${cs} para olhar com carinho`, r.currentSelfPattern);
    block('💜', `A verdade do ${ae}`, r.alterEgoTruth);

    if (r.internalDialogue && (r.internalDialogue.currentSelfSays || r.internalDialogue.alterEgoReplies)) {
      parts.push(`<hr/>`);
      parts.push(`<h4>💬 Diálogo interno saudável</h4>`);
      if (r.internalDialogue.currentSelfSays) {
        parts.push(`<p><strong>${cs}:</strong> <em>"${r.internalDialogue.currentSelfSays}"</em></p>`);
      }
      if (r.internalDialogue.alterEgoReplies) {
        parts.push(`<p><strong>${ae}:</strong> <em>"${r.internalDialogue.alterEgoReplies}"</em></p>`);
      }
    }

    if (r.reframe) {
      parts.push(`<hr/>`);
      block('🪞', `Reenquadramento do ${ae}`, r.reframe);
    }

    if (r.questions && r.questions.length > 0) {
      parts.push(`<hr/>`);
      parts.push(`<h4>✍️ Perguntas para você</h4>`);
      r.questions.forEach((q, i) => {
        const zone = q.zone && ZONE_META[q.zone] ? ZONE_META[q.zone] : null;
        const zoneTag = zone ? `<em style="opacity:0.7">${zone.emoji} ${zone.label}</em> · ` : '';
        parts.push(`<h5>${i + 1}. ${q.title}</h5>`);
        if (q.objective) parts.push(`<p>${zoneTag}<em>${q.objective}</em></p>`);
        parts.push(`<blockquote><p>${q.prompt}</p></blockquote>`);
        parts.push(`<p><strong>Sua resposta:</strong></p>`);
        parts.push(`<p></p>`);
      });
    }

    if (r.identityProof || (r.identityProofSuggestions && r.identityProofSuggestions.length > 0)) {
      parts.push(`<hr/>`);
      parts.push(`<h4>🧬 Prova de identidade (próximas 24h)</h4>`);
      if (r.identityProof) parts.push(`<blockquote><p>${r.identityProof}</p></blockquote>`);
      if (r.identityProofSuggestions && r.identityProofSuggestions.length > 0) {
        parts.push(`<p><em>Pequenos gestos de cuidado ou coragem:</em></p>`);
        parts.push(`<ul>${r.identityProofSuggestions.map(s => `<li>${s}</li>`).join('')}</ul>`);
      }
      parts.push(`<p><strong>Meu gesto de hoje:</strong></p>`);
      parts.push(`<p></p>`);
    }

    if (r.identityAnchor) {
      parts.push(`<hr/>`);
      block('🪞', `Hoje eu escolho ser (âncora · ${ae})`, r.identityAnchor);
    }

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

      const html = buildExperienceHtml(res);


      setQuestion(`Despertar — ${res.detectedState || 'Reflexão'}`);
      setAnswer(html);

      if (res.intensity === 'brutal') toast.success('💜 Verdade dita com amor.');
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
  }, [loadingAI, state, answer, buildExperienceHtml]);

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
        <p className="text-xs text-foreground/60 italic">Você não precisa lutar contra si mesmo. Lidere-se com amor.</p>
      </motion.div>

      {/* Gerador automático — IA lê seus últimos 7 dias */}
      <div className="rpg-panel space-y-3 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <p className="text-xs text-foreground/70 italic text-center">
          A IA lê seus últimos 7 dias e cria seu despertar de hoje — sem você escolher nada.
        </p>
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
