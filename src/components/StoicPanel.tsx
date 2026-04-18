import { useMemo, useState, useCallback } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollText, Loader2, Sparkles, ChevronDown, ChevronUp, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getTodayBrasilia } from '@/lib/utils';
import type { StoicEntry } from '@/lib/gameStore';

export default function StoicPanel() {
  const { state, setState, addXp, addGold } = useGame();
  const today = getTodayBrasilia();

  const stoicEntries: StoicEntry[] = useMemo(() => (state as any).stoicEntries || [], [(state as any).stoicEntries]);
  const todayEntry = stoicEntries.find(e => e.date === today);

  const [loading, setLoading] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);
  const [draft, setDraft] = useState<string[]>(todayEntry?.answers && todayEntry.answers.length === 3 ? todayEntry.answers : ['', '', '']);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    try {
      const journalLite = (state.journal || []).slice(0, 3).map(j => ({
        title: j.title, text: j.text, emotion: j.emotion, intensity: j.intensity,
      }));
      const habitsLite = (state.habits || []).map(h => {
        const entries = Object.entries(h.history).sort((a, b) => b[0].localeCompare(a[0]));
        return { name: h.name, lastStatus: entries[0]?.[1] };
      });
      const missionsLite = (state.missions || []).map(m => ({
        name: m.name, category: m.category, difficulty: m.difficulty, status: m.status,
      }));
      const previous = stoicEntries.slice(0, 5).map(e => ({
        theme: e.theme, questions: e.questions, answers: e.answers,
      }));

      const { data, error } = await supabase.functions.invoke('stoic-questions', {
        body: {
          journal: journalLite,
          awakening: state.awakening,
          habits: habitsLite,
          missions: missionsLite,
          rank: state.rank,
          streak: state.streak,
          missedDays: state.missedDays,
          previousStoicEntries: previous,
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const newEntry: StoicEntry = {
        id: crypto.randomUUID(),
        date: today,
        theme: data.theme,
        questions: data.questions,
        answers: ['', '', ''],
        createdAt: new Date().toISOString(),
      };

      setState((prev: any) => ({
        ...prev,
        stoicEntries: [newEntry, ...(prev.stoicEntries || []).filter((e: StoicEntry) => e.date !== today)],
      }));
      setDraft(['', '', '']);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar reflexão estoica');
    } finally {
      setLoading(false);
    }
  }, [state, stoicEntries, setState, today]);

  const saveReflection = useCallback(async () => {
    if (!todayEntry) return;
    if (draft.every(a => !a.trim())) {
      toast.error('Responda ao menos uma pergunta antes de salvar.');
      return;
    }
    setSavingInsight(true);
    try {
      let insight: string | undefined;
      try {
        const { data, error } = await supabase.functions.invoke('stoic-insight', {
          body: {
            theme: todayEntry.theme,
            questions: todayEntry.questions,
            answers: draft,
            awakening: state.awakening,
          },
        });
        if (!error && !data?.error) insight = data?.insight;
      } catch { /* insight is optional */ }

      const alreadySavedToday = !!(todayEntry.answers && todayEntry.answers.some(a => a.trim()));

      setState((prev: any) => ({
        ...prev,
        stoicEntries: (prev.stoicEntries || []).map((e: StoicEntry) =>
          e.id === todayEntry.id ? { ...e, answers: draft, insight: insight || e.insight } : e
        ),
      }));

      if (!alreadySavedToday) {
        addXp(15, 'Reflexão Estoica concluída');
        addGold(5, 'Reflexão Estoica');
        toast.success('Reflexão salva! +15 XP / +5 Gold');
      } else {
        toast.success('Reflexão atualizada');
      }
    } finally {
      setSavingInsight(false);
    }
  }, [todayEntry, draft, state.awakening, setState, addXp, addGold]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2 min-w-0">
          <ScrollText className="w-5 h-5 shrink-0" /> ESTOICISMO
        </h2>
        <span className="text-xs text-muted-foreground font-body">
          {stoicEntries.length} reflexões
        </span>
      </div>

      <p className="text-xs text-muted-foreground font-body italic">
        "Tu tens poder sobre a tua mente — não sobre os eventos externos. Percebe isso, e encontrarás força." — Marco Aurélio
      </p>

      {!todayEntry && (
        <button
          onClick={generate}
          disabled={loading}
          className="rpg-panel glow-purple w-full flex items-center justify-center gap-3 py-5 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Sparkles className="w-6 h-6 text-primary" />}
          <span className="text-base font-display text-foreground uppercase tracking-wider">
            {loading ? 'Consultando os filósofos...' : '⟐ Gerar Reflexão Estoica do Dia'}
          </span>
        </button>
      )}

      {todayEntry && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel glow-purple-strong space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-display uppercase tracking-wider border border-primary/30">
              🏛️ {todayEntry.theme || 'Reflexão do dia'}
            </span>
            <span className="text-xs text-muted-foreground">{new Date(todayEntry.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>

          <div className="space-y-4">
            {todayEntry.questions.map((q, i) => (
              <div key={i} className="space-y-2">
                <p className="text-sm font-display text-foreground leading-relaxed">
                  <span className="text-primary mr-1.5">{i + 1}.</span>{q}
                </p>
                <Textarea
                  value={draft[i] || ''}
                  onChange={e => setDraft(prev => { const c = [...prev]; c[i] = e.target.value; return c; })}
                  placeholder="Reflita honestamente..."
                  rows={3}
                  className="bg-secondary border-border text-sm text-foreground"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={saveReflection} disabled={savingInsight} size="sm">
              {savingInsight ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {todayEntry.answers && todayEntry.answers.some(a => a.trim()) ? 'Atualizar' : 'Salvar Reflexão (+15 XP / +5 Gold)'}
            </Button>
          </div>

          {todayEntry.insight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel border-primary/30 bg-primary/5">
              <p className="text-xs text-primary font-display uppercase tracking-wider mb-2">✨ Insight Estoico</p>
              <p className="text-sm text-foreground/90 leading-relaxed italic">"{todayEntry.insight}"</p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* History */}
      {stoicEntries.length > (todayEntry ? 1 : 0) && (
        <div className="space-y-2">
          <h3 className="text-sm font-display tracking-wider text-foreground/80 mt-4">📜 Histórico</h3>
          <AnimatePresence initial={false}>
            {stoicEntries.filter(e => e.id !== todayEntry?.id).slice(0, 10).map(entry => {
              const isOpen = expandedId === entry.id;
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rpg-panel"
                >
                  <button
                    onClick={() => setExpandedId(isOpen ? null : entry.id)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </span>
                      <span className="text-sm font-display text-foreground truncate">
                        🏛️ {entry.theme || 'Reflexão'}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 space-y-3 overflow-hidden"
                    >
                      {entry.questions.map((q, i) => (
                        <div key={i} className="space-y-1">
                          <p className="text-xs font-display text-primary">{i + 1}. {q}</p>
                          <p className="text-sm text-foreground/80 italic whitespace-pre-wrap">
                            {entry.answers?.[i] || <span className="text-muted-foreground">— sem resposta —</span>}
                          </p>
                        </div>
                      ))}
                      {entry.insight && (
                        <div className="border-t border-border pt-2 mt-2">
                          <p className="text-xs text-primary font-display uppercase tracking-wider mb-1">✨ Insight</p>
                          <p className="text-sm text-foreground/90 italic">"{entry.insight}"</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
