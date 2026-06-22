import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  MessageCircleHeart, Plus, Trash2, Send, Loader2, Calendar, History, ArrowDown, CheckCircle2,
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

function dayKey(iso: string): string { return iso.slice(0, 10); }

interface MentorAction { type: string; habit?: { name: string; intention?: string; difficulty: 'Fácil'|'Normal'|'Difícil' } }

export default function MentorChatPanel() {
  const {
    state, createMentorConversation, appendMentorMessage,
    deleteMentorConversation, deleteMentorMessage, addHabit,
  } = useGame();
  const conversations = state.mentorConversations || [];
  const [activeId, setActiveId] = useState<string | null>(conversations[0]?.id ?? null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ msgId: string } | null>(null);
  const [confirmDeleteConvo, setConfirmDeleteConvo] = useState<string | null>(null);
  const [createdHabitFor, setCreatedHabitFor] = useState<Record<string, string>>({}); // msgId -> habit name

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const isNearBottomRef = useRef(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const active: MentorConversation | undefined = useMemo(
    () => conversations.find(c => c.id === activeId),
    [conversations, activeId],
  );

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

  // Scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distance < 120;
    isNearBottomRef.current = near;
    if (near) setUnreadCount(0);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setUnreadCount(0);
    isNearBottomRef.current = true;
  }, []);

  // Snap to bottom on conversation switch
  useEffect(() => {
    if (active) {
      requestAnimationFrame(() => scrollToBottom(false));
    }
  }, [activeId]); // eslint-disable-line

  // Smart auto-scroll on new messages (Telegram-style)
  const lastCount = useRef(0);
  useEffect(() => {
    const count = active?.messages.length ?? 0;
    if (count > lastCount.current) {
      const delta = count - lastCount.current;
      if (isNearBottomRef.current) {
        requestAnimationFrame(() => scrollToBottom(false));
      } else {
        // Count only assistant messages as unread
        const newOnes = active?.messages.slice(-delta) ?? [];
        const assistantNew = newOnes.filter(m => m.role === 'assistant').length;
        if (assistantNew > 0) setUnreadCount(c => c + assistantNew);
      }
    }
    lastCount.current = count;
  }, [active?.messages.length, scrollToBottom, active?.messages]);

  useEffect(() => { taRef.current?.focus(); }, [activeId]);

  const handleNew = () => {
    const id = createMentorConversation();
    setActiveId(id);
    setSheetOpen(false);
    setTimeout(() => taRef.current?.focus(), 50);
  };

  const handleDeleteConvo = (id: string) => {
    deleteMentorConversation(id);
    if (activeId === id) {
      const next = conversations.find(c => c.id !== id);
      setActiveId(next?.id ?? null);
    }
    setConfirmDeleteConvo(null);
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
    isNearBottomRef.current = true; // user-initiated, follow

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
      const actions: MentorAction[] = (data as any)?.actions || [];
      if (!reply) throw new Error('Resposta vazia');

      // Append assistant message first
      const assistantMsgId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
        ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      appendMentorMessage(convoId!, { id: assistantMsgId, role: 'assistant', content: reply });

      // Execute actions
      for (const a of actions) {
        if (a.type === 'create_habit' && a.habit?.name) {
          try {
            addHabit({
              name: a.habit.name,
              intention: a.habit.intention,
              icon: '✨',
              color: 'hsl(var(--primary))',
              endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
              difficulty: a.habit.difficulty,
            });
            setCreatedHabitFor(prev => ({ ...prev, [assistantMsgId]: a.habit!.name }));
            toast.success(`Hábito criado: ${a.habit.name}`);
          } catch (err: any) {
            toast.error(`Não consegui criar o hábito: ${err?.message || 'erro'}`);
          }
        }
      }
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

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0">
      <div className="p-3 border-b border-border shrink-0">
        <Button onClick={handleNew} size="sm" className="w-full">
          <Plus className="w-4 h-4 mr-2" /> Nova conversa
        </Button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
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
                        onClick={() => { setActiveId(c.id); setSheetOpen(false); }}
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
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteConvo(c.id); }}
                        className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 text-foreground/40 hover:text-destructive"
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
      </div>
    </div>
  );

  return (
    <div className="rpg-panel p-0 overflow-hidden flex flex-col h-[calc(100dvh-180px)] min-h-[500px]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card/50 shrink-0">
        <button
          className="md:hidden flex items-center gap-1.5 text-foreground/70 hover:text-primary transition-colors"
          onClick={() => setSheetOpen(true)}
          aria-label="Abrir histórico"
        >
          <History className="w-4 h-4" />
          <span className="text-[11px] uppercase tracking-wider">Histórico</span>
        </button>
        <MessageCircleHeart className="w-4 h-4 text-primary md:ml-0 ml-2" />
        <h2 className="font-display text-sm tracking-widest text-primary uppercase">Mentor Interno</h2>
      </div>

      {/* Mobile sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] flex flex-col">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <SheetTitle className="font-display text-sm tracking-widest text-primary uppercase">
              Conversas
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0">{sidebarContent}</div>
        </SheetContent>
      </Sheet>

      <div className="grid md:grid-cols-[260px_1fr] flex-1 min-h-0">
        {/* Desktop sidebar */}
        <div className="hidden md:block border-r border-border bg-background/40 min-h-0 overflow-hidden">
          {sidebarContent}
        </div>

        {/* Chat */}
        <div className="flex flex-col min-w-0 min-h-0 relative">
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-3">
              <MessageCircleHeart className="w-10 h-10 text-primary/60" />
              <p className="font-display text-sm tracking-wider text-foreground/70">
                Comece uma conversa com seu Mentor Interno
              </p>
              <p className="text-xs text-foreground/50 max-w-sm">
                Um espaço seguro para refletir, ressignificar e fortalecer sua identidade.
              </p>
              <Button onClick={handleNew} className="mt-2">
                <Plus className="w-4 h-4 mr-2" /> Nova conversa
              </Button>
            </div>
          ) : (
            <>
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
              >
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
                {active.messages.map(m => (
                  <MessageBubble
                    key={m.id}
                    msg={m}
                    habitCreated={createdHabitFor[m.id]}
                    onDelete={() => setConfirmDelete({ msgId: m.id })}
                  />
                ))}
                {sending && (
                  <div className="flex items-center gap-2 text-xs text-foreground/50 px-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Pensando…
                  </div>
                )}
              </div>

              {/* Unread messages badge (Telegram-style) */}
              {unreadCount > 0 && (
                <button
                  onClick={() => scrollToBottom(true)}
                  className="absolute bottom-24 right-4 z-10 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs shadow-lg hover:bg-primary/90 transition-all animate-in fade-in slide-in-from-bottom-2"
                  aria-label={`${unreadCount} nova(s) mensagem(ns)`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span className="font-semibold">+{unreadCount}</span>
                </button>
              )}

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
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirm delete message */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir mensagem?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A mensagem será removida da conversa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDelete && activeId) deleteMentorMessage(activeId, confirmDelete.msgId);
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm delete conversation */}
      <AlertDialog open={!!confirmDeleteConvo} onOpenChange={(o) => !o && setConfirmDeleteConvo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as mensagens desta conversa serão apagadas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteConvo && handleDeleteConvo(confirmDeleteConvo)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MessageBubble({
  msg, habitCreated, onDelete,
}: { msg: MentorMessage; habitCreated?: string; onDelete: () => void }) {
  const isUser = msg.role === 'user';
  return (
    <div className={cn('group flex items-start gap-1.5', isUser ? 'justify-end' : 'justify-start')}>
      {isUser && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-foreground/30 hover:text-destructive self-center"
          aria-label="Excluir mensagem"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
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
          <>
            <div className="prose prose-sm prose-invert max-w-none prose-p:my-1.5 prose-strong:text-primary">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {habitCreated && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-primary border border-primary/30 bg-primary/10 rounded-md px-2 py-1 w-fit">
                <CheckCircle2 className="w-3 h-3" />
                Hábito criado: <span className="font-semibold">{habitCreated}</span>
              </div>
            )}
          </>
        )}
      </div>
      {!isUser && (
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-foreground/30 hover:text-destructive self-center"
          aria-label="Excluir mensagem"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
