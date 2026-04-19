import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Compass, Loader2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/lib/GameContext';
import { computeMonsterHp, type CounselTone } from '@/lib/gameStore';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const TONE_OPTIONS: { value: CounselTone; label: string; desc: string }[] = [
  { value: 'direto', label: 'Direto e duro', desc: 'Sem rodeios, confronto firme' },
  { value: 'analitico', label: 'Analítico', desc: 'Racional, baseado em dados' },
  { value: 'firme', label: 'Compassivo mas firme', desc: 'Empático sem condescendência' },
];

function buildContext(state: ReturnType<typeof useGame>['state'], includeJournal: boolean) {
  const now = Date.now();
  const DAY = 86400000;

  // Habits with metrics
  const habits = (state.habits || []).map(h => {
    const entries = Object.entries(h.history || {});
    const last30 = entries.filter(([d]) => (now - new Date(d + 'T12:00:00').getTime()) / DAY <= 30);
    const done30 = last30.filter(([, s]) => s === 'done').length;
    const failed30 = last30.filter(([, s]) => s === 'failed').length;
    const total30 = done30 + failed30;
    // Streak: count consecutive 'done' from today backward
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now - i * DAY).toISOString().slice(0, 10);
      if (h.history?.[d] === 'done') streak++;
      else if (h.history?.[d] === 'failed') break;
      else if (i > 0) break;
    }
    return {
      name: h.name,
      streak,
      done30d: done30,
      failed30d: failed30,
      completionRate30d: total30 ? Math.round((done30 / total30) * 100) : null,
    };
  });

  const missions = (state.missions || []).map(m => {
    const ch = m.completionHistory || [];
    const recent = ch.filter(e => (now - new Date(e.date).getTime()) / DAY <= 30);
    return {
      title: m.name,
      status: m.status,
      category: m.category,
      difficulty: m.difficulty,
      type: m.missionType,
      completions30d: recent.filter(e => !e.failed).length,
      fails30d: recent.filter(e => e.failed).length,
    };
  });

  const recentJournal = includeJournal
    ? (state.journal || [])
        .slice(0, 10)
        .map(j => ({
          date: j.date,
          emotion: j.emotion,
          intensity: j.intensity,
          deepMode: j.deepMode,
          snippet: (j.text || '').replace(/<[^>]+>/g, '').slice(0, 280),
        }))
    : [];

  const recentCounsels = (state.counselHistory || []).slice(0, 5).map(c => ({
    question: c.question,
    snippet: c.advice.slice(0, 200),
  }));

  const monsterHp = computeMonsterHp(state);
  const monsterStage =
    monsterHp === 0 ? 'Adormecido' :
    monsterHp < 20 ? 'Agonizante' :
    monsterHp < 40 ? 'Fraco' :
    monsterHp < 60 ? 'Crescendo' :
    monsterHp < 80 ? 'Ativo' : 'Colosso';

  // Aggregate metrics
  const allHabitEntries = (state.habits || []).flatMap(h =>
    Object.entries(h.history || {}).filter(([d]) => (now - new Date(d + 'T12:00:00').getTime()) / DAY <= 30)
  );
  const totalDone = allHabitEntries.filter(([, s]) => s === 'done').length;
  const totalFailed = allHabitEntries.filter(([, s]) => s === 'failed').length;
  const completionRate30d = (totalDone + totalFailed) ? Math.round((totalDone / (totalDone + totalFailed)) * 100) : null;

  // Recurring failures: habits with >=3 fails in 30d
  const recurringFailures = habits.filter(h => h.failed30d >= 3).map(h => h.name);

  return {
    awakening: state.awakening,
    level: state.level,
    rank: state.rank,
    title: state.title,
    xp: state.xp,
    xpToNext: state.xpToNext,
    streak: state.streak,
    missedDays: state.missedDays,
    gold: state.gold,
    monsterHp,
    monsterStage,
    monsterLastReason: state.monster?.lastReason,
    habits,
    missions,
    recentJournal,
    recentCounsels,
    pendingFailureProtocols: (state.failureProtocols || []).filter(fp => fp.status === 'Pendente').length,
    metrics: {
      completionRate30d,
      recurringFailures,
      totalDone30d: totalDone,
      totalFailed30d: totalFailed,
    },
  };
}

export default function CounselPanel() {
  const { state, addCounsel, deleteCounsel } = useGame();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [tone, setTone] = useState<CounselTone>('direto');
  const [includeJournal, setIncludeJournal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState<string | null>(null);
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set());

  const history = state.counselHistory || [];

  const askCounsel = async () => {
    const q = question.trim();
    if (q.length < 5) {
      toast({ title: 'Pergunta muito curta', description: 'Descreva melhor sobre o que você quer conselho.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setCurrentAdvice(null);

    try {
      const context = buildContext(state, includeJournal);
      const { data, error } = await supabase.functions.invoke('counsel', {
        body: { question: q, tone, context },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const advice = data?.advice as string;
      if (!advice) throw new Error('Resposta vazia');

      setCurrentAdvice(advice);
      addCounsel({ question: q, tone, advice, includedJournal: includeJournal });
      setQuestion('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar conselho';
      toast({ title: 'Não foi possível pedir o conselho', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedHistory(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display tracking-wide">
            <Compass className="w-5 h-5 text-primary" />
            Conselho
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Coach realista. Vai analisar seus dados (hábitos, missões, despertar, monstro) e te dar uma resposta honesta — não suaviza.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="counsel-q" className="text-xs text-muted-foreground">
              Sobre o que você precisa de conselho hoje?
            </Label>
            <Textarea
              id="counsel-q"
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="Ex: Tô travado pra começar a estudar. Toda vez que sento, abro o celular e perco 1h..."
              className="mt-1 min-h-[120px] resize-y"
              disabled={loading}
              maxLength={2000}
            />
            <p className="text-[10px] text-muted-foreground mt-1 text-right">{question.length}/2000</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Tom</Label>
              <Select value={tone} onValueChange={v => setTone(v as CounselTone)} disabled={loading}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex flex-col">
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2 pb-2">
                <Switch id="include-journal" checked={includeJournal} onCheckedChange={setIncludeJournal} disabled={loading} />
                <Label htmlFor="include-journal" className="text-xs cursor-pointer">
                  Incluir diário recente
                </Label>
              </div>
            </div>
          </div>

          <Button onClick={askCounsel} disabled={loading || question.trim().length < 5} className="w-full">
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Pensando...</>
            ) : (
              <>Pedir conselho</>
            )}
          </Button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {currentAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-primary/40 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-display tracking-wide text-primary">Conselho recebido</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none prose-headings:text-primary prose-headings:font-display prose-strong:text-foreground">
                  <ReactMarkdown>{currentAdvice}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-display tracking-wide">Histórico ({history.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {history.map(entry => {
              const expanded = expandedHistory.has(entry.id);
              return (
                <div key={entry.id} className="border border-border rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleExpand(entry.id)}
                    className="w-full p-3 flex items-start gap-2 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                        {' · '}{TONE_OPTIONS.find(t => t.value === entry.tone)?.label}
                      </p>
                      <p className="text-sm font-medium truncate mt-0.5">{entry.question}</p>
                    </div>
                    {expanded ? <ChevronUp className="w-4 h-4 mt-1 shrink-0" /> : <ChevronDown className="w-4 h-4 mt-1 shrink-0" />}
                  </button>
                  {expanded && (
                    <div className="px-3 pb-3 border-t border-border">
                      <div className="prose prose-sm prose-invert max-w-none mt-2 prose-headings:text-primary prose-headings:font-display prose-strong:text-foreground">
                        <ReactMarkdown>{entry.advice}</ReactMarkdown>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-destructive hover:text-destructive"
                        onClick={() => deleteCounsel(entry.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
