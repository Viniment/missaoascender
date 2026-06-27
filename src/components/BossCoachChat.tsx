import { useEffect, useRef, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Send, Loader2, Swords } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { getTodayBrasilia } from '@/lib/utils';
import { toast } from 'sonner';

interface Msg { id: string; role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'Como derroto esse inimigo hoje?',
  'Estou travado, me ajude.',
  'Por que isso é tão difícil?',
  'Reforça quem eu estou virando.',
];

export default function BossCoachChat({ bossId }: { bossId: string }) {
  const { state } = useGame();
  const boss = (state.bosses || []).find(b => b.id === bossId);
  const today = getTodayBrasilia();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && boss) {
      const pct = Math.round((boss.hp / boss.maxHp) * 100);
      const intro = `**Estou contigo nessa.** Você está enfrentando **${boss.name}** ${boss.emoji} — ${pct}% de HP ainda de pé, combo ${boss.combo || 0}.\n\nMe diga: o que está pesando agora?`;
      setMessages([{ id: 'intro', role: 'assistant', content: intro }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bossId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading || !boss) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: 'user', content: text.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);

    try {
      const ctxBoss = {
        name: boss.name,
        emoji: boss.emoji,
        description: boss.description,
        weakness: boss.weakness,
        hp: boss.hp,
        maxHp: boss.maxHp,
        combo: boss.combo,
        bestCombo: boss.bestCombo,
        days: boss.days,
        tasksPerDay: boss.tasksPerDay,
        tasks: (boss.tasks || []).map(t => ({
          title: t.title,
          doneToday: t.doneDates.includes(today),
        })),
      };
      const context = {
        boss: ctxBoss,
        name: state.name,
        level: state.level,
        rank: state.rank,
        streak: state.streak,
        alterEgo: state.alterEgo,
        habits: (state.habits || []).slice(0, 8).map(h => ({ name: h.name, intention: h.intention })),
        missions: (state.missions || []).filter(m => m.status === 'Ativa').slice(0, 6).map(m => ({ name: m.name, category: m.category })),
        defeatedBosses: (state.bosses || []).filter(b => b.defeatedAt).slice(-3).map(b => ({ name: b.name, days: b.defeatStats?.daysTaken })),
      };

      const { data, error } = await supabase.functions.invoke('boss-coach', {
        body: {
          messages: next.map(m => ({ role: m.role, content: m.content })),
          context,
        },
      });
      if (error) throw error;
      const reply = (data as any)?.reply || '';
      if (!reply) throw new Error('Resposta vazia');
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply }]);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao falar com o estrategista');
    } finally {
      setLoading(false);
    }
  };

  if (!boss) return null;

  return (
    <div className="rpg-panel border-red-500/30">
      <div className="flex items-center gap-2 mb-3">
        <Swords className="w-4 h-4 text-red-400" />
        <h3 className="font-display tracking-wider text-red-300 text-sm">ESTRATEGISTA DE COMBATE</h3>
        <span className="ml-auto text-[10px] text-foreground/50 hidden sm:inline">IA conhece seu inimigo</span>
      </div>

      <div
        ref={scrollRef}
        className="max-h-[340px] overflow-y-auto space-y-3 pr-1 mb-3"
      >
        <AnimatePresence initial={false}>
          {messages.map(m => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-primary/20 border border-primary/30 text-foreground'
                    : 'bg-red-950/30 border border-red-500/30 text-foreground/90'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-sm prose-invert max-w-none [&>*]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-foreground/60"
            >
              <Loader2 className="w-3 h-3 animate-spin" /> Lendo o campo de batalha...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {QUICK_PROMPTS.map(q => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="text-[11px] px-2 py-1 rounded-full border border-red-500/30 bg-red-500/5 hover:bg-red-500/15 text-red-200 transition disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />{q}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Fale com o estrategista..."
          rows={1}
          className="text-sm resize-none min-h-[40px]"
          disabled={loading}
        />
        <Button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
