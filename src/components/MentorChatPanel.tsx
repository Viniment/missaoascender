import { useState, useRef, useEffect, useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  MessageCircleHeart, Plus, Trash2, Send, Loader2, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import type { MentorConversation, MentorMessage } from '@/lib/gameStore';

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(); yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Hoje';
  if (sameDay(d, yest)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

export default function MentorChatPanel() {
  const { state, createMentorConversation, appendMentorMessage, deleteMentorConversation } = useGame();
  const conversations = state.mentorConversations || [];
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const active: MentorConversation | undefined = useMemo(
    () => conversations.find(c => c.id === activeId),
    [conversations, activeId],
  );

  // group by day
  const grouped = useMemo(() => {
    const map = new Map<string, MentorConversation[]>();
    for (const c of conversations) {
      const k = dayKey(c.updatedAt || c.createdAt);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(c);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([k, items]) => ({ key: k, label: formatDayLabel(items[0].updatedAt || items[0].createdAt), items }));
  }, [conversations]);

  useEffect(() => {
    if (!activeId && conversations.length > 0) setActiveId(conversations[0].id);
  }, [conversations, activeId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [active?.messages.length, sending]);

  useEffect(() => { taRef.current?.focus(); }, [activeId]);

  const handleNew = () => {
    const id = createMentorConversation();
    setActiveId(id);
    setShowList(false);
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const handleDelete = (id: string) => {
    deleteMentorConversation(id);
    if (activeId === id) {
      const next = conversations.find(c => c.id !== id);
      setActiveId(next?.id ?? null);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    let convoId = activeId;
    if (!convoId) {
      convoId = createMentorConversation(text);
      setActiveId(convoId);
    }

    appendMentorMessage(convoId!, { role: 'user', content: text });
    setInput('');
    setSending(true);

    try {
      const baseMessages: { role: 'user' | 'assistant'; content: string }[] =
        (conversations.find(c => c.id === convoId)?.messages || []).map(m => ({ role: m.role, content: m.content }));
      const messages = [...baseMessages, { role: 'user' as const, content: text }];

      const context = {
        name: state.name,
        level: state.level,
        rank: state.rank,
        streak: state.streak,
        alterEgo: state.alterEgo,
        missions: (state.missions || []).filter(m => m.status === 'Ativa').slice(0, 8).map(m => ({
          name: m.name, category: m.category, difficulty: m.difficulty, type: m.missionType,
        })),
        habits: (state.habits || []).slice(0, 10).map(h => ({
          name: h.name, intention: h.intention, difficulty: h.difficulty,
        })),
        recentJournal: (state.journal || []).slice(-5).map(j => ({
          date: j.date, title: j.title, emotion: j.emotion, intensity: j.intensity,
        })),
        awakening: state.awakening,
      };

      const { data, error } = await supabase.functions.invoke('mentor-chat', {
        body: { messages, context },
      });

      if (error) throw error;
      const reply = (data as any)?.reply || '';
      if (!reply) throw new Error('Resposta vazia');

      appendMentorMessage(convoId!, { role: 'assistant', content: reply });
    } catch (e: any) {
      const msg = e?.message || 'Erro ao falar com o mentor';
      toast.error(msg);
      appendMentorMessage(convoId!, {
        role: 'assistant',
        content: `_Ops, tive uma dificuldade técnica agora (${msg}). Tente novamente em instantes._`,
      });
    } finally {
      setSending(false);
      setTimeout(() => taRef.current?.focus(), 50);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={handleNew} size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Nova conversa
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {grouped.length === 0 && (
            <p className="text-xs text-foreground/40 px-2 py-6 text-center">
              Nenhuma conversa ainda.
            </p>
          )}
          {grouped.map(group => (
            <div key={group.key}>
              <div className="flex items-center gap-1.5 px-2 mb-1.5">
                <Calendar className="w-3 h-3 text-foreground/40" />
                <p className="text-[10px] tracking-widest uppercase text-foreground/40 font-display">
                  {group.label}
                </p>
              </div>
              <div className="space-y-1">
                {group.items.map(c => {
                  const isActive = c.id === activeId;
                  return (
                    <div
                      key={c.id}
                      className={cn(
                        'group flex items-center gap-1 rounded-md border transition-all',
                        isActive ? 'bg-primary/10 border-primary/40' : 'border-transparent hover:bg-secondary/60'
                      )}
                    >
                      <button
                        onClick={() => { setActiveId(c.id); setShowList(false); }}
                        className="flex-1 text-left px-2.5 py-2 min-w-0"
                      >
                        <p className={cn('text-xs truncate', isActive ? 'text-primary' : 'text-foreground/80')}>
                          {c.title || 'Sem título'}
                        </p>
                        <p className="text-[10px] text-foreground/40">
                          {new Date(c.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          {' · '}{c.messages.length} msg
                        </p>
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-foreground/40 hover:text-destructive"
                        aria-label="Excluir conversa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="rpg-panel p-0 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50">
        <MessageCircleHeart className="w-4 h-4 text-primary" />
        <h2 className="font-display text-sm tracking-widest text-primary uppercase">Mentor Interno</h2>
        <button
          className="md:hidden ml-auto text-[11px] text-foreground/60 underline-offset-2 hover:underline"
          onClick={() => setShowList(s => !s)}
        >
          {showList ? 'Voltar ao chat' : 'Histórico'}
        </button>
      </div>

      <div className="grid md:grid-cols-[260px_1fr] h-[calc(100vh-220px)] min-h-[500px]">
        {/* Sidebar */}
        <div className={cn('border-r border-border bg-background/40', showList ? 'block' : 'hidden md:block')}>
          {sidebar}
        </div>

        {/* Chat */}
        <div className={cn('flex flex-col min-w-0', showList ? 'hidden md:flex' : 'flex')}>
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
              <MessageCircleHeart className="w-10 h-10 text-primary/60" />
              <p className="font-display text-sm tracking-wider text-foreground/70">
                Comece uma conversa com seu Mentor Interno
              </p>
              <p className="text-xs text-foreground/50 max-w-sm">
                Um espaço seguro para refletir, ressignificar e fortalecer sua identidade.
                O mentor conhece seu Alter Ego, hábitos e missões.
              </p>
              <Button onClick={handleNew} className="mt-2">
                <Plus className="w-4 h-4 mr-2" /> Nova conversa
              </Button>
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {active.messages.length === 0 && (
                  <div className="text-center py-10 px-4">
                    <p className="text-sm text-foreground/60">
                      O que você gostaria de explorar hoje?
                    </p>
                    <p className="text-xs text-foreground/40 mt-2">
                      Compartilhe um pensamento, um desafio ou uma vitória.
                    </p>
                  </div>
                )}
                {active.messages.map(m => <MessageBubble key={m.id} msg={m} />)}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-foreground/50 px-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Pensando…
                  </div>
                )}
              </div>

              <div className="border-t border-border p-3 bg-card/40">
                <div className="flex items-end gap-2">
                  <Textarea
                    ref={taRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKey}
                    placeholder="Escreva para seu mentor… (Enter envia, Shift+Enter quebra linha)"
                    rows={2}
                    className="bg-secondary border-border resize-none min-h-[44px] max-h-40"
                    disabled={sending}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    size="icon"
                    className="shrink-0 h-11 w-11"
                    aria-label="Enviar"
                  >
                    {sending
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: MentorMessage }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-sm'
            : 'bg-secondary/70 text-foreground rounded-bl-sm border border-border'
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-strong:text-primary">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
