import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Brain, Plus, Trash2, Send, Loader2, History, ArrowDown, CheckCircle2,
  Sparkles, BarChart3, ChevronLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { CbtSession, CbtStage, CbtDistortion } from '@/lib/gameStore';

const STAGE_LABELS: Record<CbtStage, string> = {
  'check-in': 'Check-in emocional',
  'situacao': 'Situação do dia',
  'pensamentos': 'Pensamentos automáticos',
  'crencas': 'Crenças profundas',
  'distorcoes': 'Distorções cognitivas',
  'socratico': 'Questionamento socrático',
  'reframe': 'Novo pensamento',
  'experimento': 'Experimento comportamental',
  'valores': 'Valores',
  'identidade': 'Identidade fortalecida',
  'concluida': 'Sessão concluída',
};

const STAGE_ORDER: CbtStage[] = [
  'check-in', 'situacao', 'pensamentos', 'crencas', 'distorcoes',
  'socratico', 'reframe', 'experimento', 'valores', 'identidade', 'concluida',
];

const DISTORTION_LABELS: Record<CbtDistortion, string> = {
  'tudo-ou-nada': 'Tudo ou nada',
  'catastrofizacao': 'Catastrofização',
  'generalizacao': 'Generalização',
  'leitura-mental': 'Leitura mental',
  'adivinhacao': 'Adivinhação do futuro',
  'raciocinio-emocional': 'Raciocínio emocional',
  'rotulacao': 'Rotulação',
  'personalizacao': 'Personalização',
  'desqualificacao-positivo': 'Desqualificação do positivo',
  'deverias': '"Deverias"',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CbtImmersionPanel() {
  const { state, createCbtSession, appendCbtMessage, updateCbtSession, deleteCbtSession } = useGame();
  const sessions = state.cbtSessions || [];
  const ae = state.alterEgo;

  const [view, setView] = useState<'home' | 'session' | 'insights'>('home');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const active: CbtSession | undefined = useMemo(
    () => sessions.find(s => s.id === activeId),
    [sessions, activeId],
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottom = useRef(true);
  const [unread, setUnread] = useState(0);
  const lastCount = useRef(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const d = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottom.current = d < 120;
    if (isNearBottom.current) setUnread(0);
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    isNearBottom.current = true;
    setUnread(0);
  }, []);

  useEffect(() => {
    if (!active) return;
    const len = active.messages.length;
    if (len > lastCount.current) {
      if (isNearBottom.current) scrollToBottom();
      else {
        const last = active.messages[len - 1];
        if (last?.role === 'assistant') setUnread(u => u + (len - lastCount.current));
      }
    }
    lastCount.current = len;
  }, [active?.messages.length, active, scrollToBottom]);

  useEffect(() => {
    if (view === 'session') {
      lastCount.current = active?.messages.length || 0;
      requestAnimationFrame(() => scrollToBottom());
      taRef.current?.focus();
    }
  }, [view, activeId, active?.messages.length, scrollToBottom]);

  const startNewSession = useCallback(() => {
    const id = createCbtSession();
    setActiveId(id);
    setView('session');
    setInput('');
    // greet
    setTimeout(async () => {
      await sendToAI(id, 'check-in', []);
    }, 200);
  }, [createCbtSession]);

  const openSession = (id: string) => {
    setActiveId(id);
    setView('session');
  };

  const sendToAI = async (sessionId: string, currentStage: CbtStage, history: { role: 'user' | 'assistant'; content: string }[]) => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('cbt-immersion', {
        body: {
          messages: history,
          currentStage,
          context: {
            name: state.profile?.displayName,
            alterEgo: ae,
            previousSummaries: sessions
              .filter(s => s.id !== sessionId && s.summary)
              .slice(0, 3)
              .map(s => ({ date: s.createdAt, summary: s.summary })),
          },
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const reply: string = data?.reply || '';
      const nextStage: CbtStage | null = data?.nextStage || null;
      const summary = data?.summary;

      if (reply) {
        appendCbtMessage(sessionId, { role: 'assistant', content: reply, stage: currentStage });
      }
      if (summary) {
        updateCbtSession(sessionId, { summary, stage: 'concluida', completedAt: new Date().toISOString() });
      } else if (nextStage) {
        updateCbtSession(sessionId, { stage: nextStage });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao falar com o guia';
      toast.error(msg);
    } finally {
      setSending(false);
      requestAnimationFrame(() => taRef.current?.focus());
    }
  };

  const handleSend = async () => {
    if (!active || sending) return;
    const text = input.trim();
    if (!text) return;
    setInput('');
    appendCbtMessage(active.id, { role: 'user', content: text, stage: active.stage });
    isNearBottom.current = true;
    const history = [
      ...active.messages.map(m => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: text },
    ];
    await sendToAI(active.id, active.stage, history);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // === INSIGHTS / EVOLUTION ===
  const completed = sessions.filter(s => s.summary);
  const insights = useMemo(() => {
    const thoughtFreq = new Map<string, number>();
    const beliefFreq = new Map<string, number>();
    const distFreq = new Map<CbtDistortion, number>();
    const identityFreq = new Map<string, number>();
    const emotionFreq = new Map<string, number>();
    completed.forEach(s => {
      s.summary?.automaticThoughts?.forEach(t => thoughtFreq.set(t, (thoughtFreq.get(t) || 0) + 1));
      s.summary?.coreBeliefs?.forEach(b => beliefFreq.set(b, (beliefFreq.get(b) || 0) + 1));
      s.summary?.distortions?.forEach(d => distFreq.set(d, (distFreq.get(d) || 0) + 1));
      if (s.summary?.identityTrained) identityFreq.set(s.summary.identityTrained, (identityFreq.get(s.summary.identityTrained) || 0) + 1);
      s.summary?.emotions?.forEach(em => emotionFreq.set(em.toLowerCase(), (emotionFreq.get(em.toLowerCase()) || 0) + 1));
    });
    const top = <K,>(m: Map<K, number>, n = 5) => Array.from(m.entries()).sort((a, b) => b[1] - a[1]).slice(0, n);
    // weekly
    const byWeek = new Map<string, { count: number; distortions: number }>();
    completed.forEach(s => {
      const d = new Date(s.completedAt || s.createdAt);
      const y = d.getFullYear();
      const onejan = new Date(y, 0, 1);
      const week = Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
      const key = `${y}-S${week}`;
      const cur = byWeek.get(key) || { count: 0, distortions: 0 };
      cur.count += 1;
      cur.distortions += s.summary?.distortions?.length || 0;
      byWeek.set(key, cur);
    });
    const weeks = Array.from(byWeek.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-8);
    return {
      thoughts: top(thoughtFreq), beliefs: top(beliefFreq), distortions: top(distFreq),
      identities: top(identityFreq), emotions: top(emotionFreq), weeks,
    };
  }, [completed]);

  // === HOME VIEW ===
  if (view === 'home') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-xl tracking-wider text-primary glow-text-purple">DESPERTAR TCC</h2>
              <p className="text-sm text-foreground/75 mt-1 leading-relaxed">
                Sua imersão diária de Terapia Cognitivo-Comportamental. Um espaço calmo para reestruturar pensamentos,
                explorar crenças e fortalecer a identidade que você está construindo.
              </p>
              <p className="text-xs text-foreground/55 mt-2 italic">
                Não substitui acompanhamento profissional. Em crise, procure ajuda especializada — CVV 188.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <Button onClick={startNewSession} className="h-12 gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Nova sessão</span>
            </Button>
            <Button variant="outline" onClick={() => setView('insights')} className="h-12 gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Evolução</span>
            </Button>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-primary/70" />
            <h3 className="font-display text-sm tracking-widest text-foreground/70">HISTÓRICO ({sessions.length})</h3>
          </div>
          {sessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/55">
              Você ainda não tem sessões. Comece quando estiver pronto — sem pressa.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map(s => {
                const idx = STAGE_ORDER.indexOf(s.stage);
                const pct = Math.round((idx / (STAGE_ORDER.length - 1)) * 100);
                const done = s.stage === 'concluida';
                return (
                  <div key={s.id} className="rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <button onClick={() => openSession(s.id)} className="w-full text-left p-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                          done ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground/60'
                        )}>
                          {done ? <CheckCircle2 className="w-4 h-4" /> : <Brain className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium truncate">{fmtDate(s.createdAt)}</p>
                            <span className="text-[10px] text-foreground/50 shrink-0">{pct}%</span>
                          </div>
                          <p className="text-xs text-foreground/55 truncate mt-0.5">
                            {done && s.summary?.identityTrained
                              ? `Identidade: ${s.summary.identityTrained}`
                              : STAGE_LABELS[s.stage]}
                          </p>
                          <div className="h-1 mt-2 rounded-full bg-secondary overflow-hidden">
                            <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }}
                          className="text-foreground/40 hover:text-destructive p-1 shrink-0"
                          aria-label="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir sessão?</AlertDialogTitle>
              <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { if (confirmDelete) deleteCbtSession(confirmDelete); setConfirmDelete(null); }}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // === INSIGHTS VIEW ===
  if (view === 'insights') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('home')} className="gap-1">
            <ChevronLeft className="w-4 h-4" /> Voltar
          </Button>
          <h2 className="font-display text-lg tracking-wider text-primary">EVOLUÇÃO COGNITIVA</h2>
        </div>

        {completed.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-foreground/55">
            Conclua sua primeira sessão para começar a ver padrões.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InsightCard title="Identidades fortalecidas" items={insights.identities} accent />
            <InsightCard title="Emoções mais frequentes" items={insights.emotions} />
            <InsightCard
              title="Distorções cognitivas recorrentes"
              items={insights.distortions.map(([k, v]) => [DISTORTION_LABELS[k as CbtDistortion] || k, v] as [string, number])}
            />
            <InsightCard title="Crenças repetidas" items={insights.beliefs} />
            <InsightCard title="Pensamentos automáticos recorrentes" items={insights.thoughts} className="md:col-span-2" />

            <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
              <h3 className="font-display text-sm tracking-widest text-foreground/70 mb-4">SESSÕES POR SEMANA</h3>
              {insights.weeks.length === 0 ? (
                <p className="text-sm text-foreground/55">Sem dados suficientes ainda.</p>
              ) : (
                <div className="flex items-end gap-2 h-32">
                  {insights.weeks.map(([k, v]) => {
                    const max = Math.max(...insights.weeks.map(w => w[1].count), 1);
                    const h = Math.round((v.count / max) * 100);
                    return (
                      <div key={k} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-primary/70 rounded-t transition-all" style={{ height: `${h}%`, minHeight: '4px' }} />
                        <span className="text-[9px] text-foreground/50">{k.split('-')[1]}</span>
                        <span className="text-[10px] font-medium text-foreground/70">{v.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="md:col-span-2 rounded-xl border border-primary/20 bg-primary/5 p-5">
              <p className="text-sm text-foreground/80">
                <strong className="text-primary">{completed.length}</strong> sessões concluídas.
                Cada uma fortaleceu uma identidade. Continue — a transformação acontece no acúmulo.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // === SESSION VIEW ===
  if (!active) return null;
  const stageIdx = STAGE_ORDER.indexOf(active.stage);
  const progress = Math.round((stageIdx / (STAGE_ORDER.length - 1)) * 100);
  const isDone = active.stage === 'concluida';

  return (
    <div className="flex flex-col h-[calc(100dvh-200px)] min-h-[500px] rounded-2xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-border bg-card/95 backdrop-blur px-4 py-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setView('home')} className="gap-1 -ml-2">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Brain className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{STAGE_LABELS[active.stage]}</p>
            <p className="text-[10px] text-foreground/50">Etapa {Math.min(stageIdx + 1, 10)} de 10</p>
          </div>
        </div>
        <div className="h-1 mt-2 rounded-full bg-secondary overflow-hidden">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 relative">
        {active.messages.length === 0 && sending && (
          <div className="text-center text-sm text-foreground/55 py-8">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
            Preparando seu espaço…
          </div>
        )}
        {active.messages.map(m => (
          <div key={m.id} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
              m.role === 'user'
                ? 'bg-primary/15 border border-primary/30 text-foreground'
                : 'bg-secondary/60 border border-border text-foreground/90'
            )}>
              {m.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-strong:text-primary">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}
        {sending && active.messages.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-secondary/60 border border-border rounded-2xl px-4 py-3 text-sm text-foreground/60 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Refletindo…
            </div>
          </div>
        )}

        {isDone && active.summary && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <h4 className="font-display text-sm tracking-widest text-primary">SESSÃO CONCLUÍDA</h4>
            </div>
            <dl className="text-xs space-y-2">
              {active.summary.identityTrained && (
                <div><dt className="text-foreground/55">Identidade fortalecida</dt><dd className="font-medium text-primary">{active.summary.identityTrained}</dd></div>
              )}
              {active.summary.reframe && (
                <div><dt className="text-foreground/55">Novo pensamento</dt><dd>{active.summary.reframe}</dd></div>
              )}
              {active.summary.experiment && (
                <div><dt className="text-foreground/55">Experimento</dt><dd>{active.summary.experiment}</dd></div>
              )}
              {active.summary.distortions && active.summary.distortions.length > 0 && (
                <div><dt className="text-foreground/55 mb-1">Distorções identificadas</dt>
                  <dd className="flex flex-wrap gap-1">
                    {active.summary.distortions.map(d => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border">
                        {DISTORTION_LABELS[d]}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {unread > 0 && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-24 z-10 flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-xs shadow-lg"
        >
          <ArrowDown className="w-3.5 h-3.5" /> +{unread}
        </button>
      )}

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-card/95 backdrop-blur p-3">
        {isDone ? (
          <Button onClick={() => { setView('home'); }} className="w-full gap-2">
            <CheckCircle2 className="w-4 h-4" /> Encerrar e voltar
          </Button>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              ref={taRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Responda no seu tempo…"
              rows={1}
              className="flex-1 min-h-[44px] max-h-32 resize-none"
              disabled={sending}
            />
            <Button onClick={handleSend} disabled={sending || !input.trim()} size="icon" className="h-11 w-11 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function InsightCard({
  title, items, accent, className,
}: { title: string; items: [string, number][]; accent?: boolean; className?: string }) {
  return (
    <div className={cn('rounded-xl border bg-card p-5', accent ? 'border-primary/30 bg-primary/5' : 'border-border', className)}>
      <h3 className="font-display text-xs tracking-widest text-foreground/70 mb-3">{title.toUpperCase()}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-foreground/50">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-2">
          {items.map(([k, v]) => (
            <li key={k} className="flex items-center justify-between gap-3">
              <span className={cn('text-sm truncate', accent && 'text-primary font-medium')}>{k}</span>
              <span className="text-xs text-foreground/55 shrink-0">{v}×</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
