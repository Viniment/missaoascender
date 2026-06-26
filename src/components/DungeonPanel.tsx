import { useMemo, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Swords, CheckCircle2, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_STYLES } from '@/lib/loot';
import { ATTRIBUTE_MAP } from '@/lib/attributes';
import { getTodayBrasilia } from '@/lib/utils';
import { toast } from 'sonner';

// Templates de desafios — gerados localmente, sem IA
const TEMPLATE_BANK: { title: string; desc: string; minutes: number; attribute: keyof typeof ATTRIBUTE_MAP; xp: number }[] = [
  { title: '10 min de caminhada consciente', desc: 'Saia, respire, observe. Sem celular.', minutes: 10, attribute: 'forca', xp: 25 },
  { title: '20 polichinelos', desc: 'Movimento curto pra acordar o corpo.', minutes: 3, attribute: 'forca', xp: 15 },
  { title: '5 min de alongamento', desc: 'Pescoço, ombros, lombar.', minutes: 5, attribute: 'vitalidade', xp: 20 },
  { title: 'Beba 2 copos de água', desc: 'Pequeno gesto de cuidado.', minutes: 1, attribute: 'vitalidade', xp: 10 },
  { title: '15 min de leitura', desc: 'Um capítulo. Sem distração.', minutes: 15, attribute: 'mente', xp: 30 },
  { title: 'Estude 25 min com foco total', desc: 'Pomodoro inteiro num assunto só.', minutes: 25, attribute: 'mente', xp: 40 },
  { title: '5 min de respiração 4-7-8', desc: 'Inspira 4, segura 7, expira 8. Repete.', minutes: 5, attribute: 'espirito', xp: 25 },
  { title: 'Escreva 3 gratidões', desc: 'No diário ou no papel. Específicas.', minutes: 5, attribute: 'espirito', xp: 20 },
  { title: 'Mande mensagem pra alguém que ama', desc: 'Sem motivo. Só presença.', minutes: 3, attribute: 'social', xp: 25 },
  { title: 'Arrume seu espaço de trabalho', desc: 'Ordem externa, ordem interna.', minutes: 10, attribute: 'disciplina', xp: 20 },
  { title: 'Trataka de 3 minutos', desc: 'Olhar fixo num ponto. Mente quieta.', minutes: 3, attribute: 'espirito', xp: 30 },
  { title: 'Plano do próximo dia em 1 página', desc: '3 prioridades. Não mais.', minutes: 10, attribute: 'disciplina', xp: 25 },
];

interface DungeonChallenge {
  id: string;
  title: string;
  desc: string;
  minutes: number;
  attribute: keyof typeof ATTRIBUTE_MAP;
  xp: number;
  done?: boolean;
}

interface DungeonOfDay {
  date: string;
  challenges: DungeonChallenge[];
  cleared?: boolean;
  lootId?: string;
}

function rollDungeon(seed: string): DungeonChallenge[] {
  // Pseudo-random por seed (data) — mesma dungeon o dia todo
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const rng = () => {
    h = (h * 9301 + 49297) % 233280;
    return h / 233280;
  };
  const pool = [...TEMPLATE_BANK];
  const picked: typeof TEMPLATE_BANK = [];
  while (picked.length < 3 && pool.length) {
    const idx = Math.floor(rng() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked.map((t, i) => ({ id: `${seed}-${i}`, ...t }));
}

export default function DungeonPanel() {
  const { state, completeDungeonChallenge, regenerateDungeon } = useGame();
  const today = getTodayBrasilia();
  const dungeon: DungeonOfDay = useMemo(() => {
    const existing = (state.dungeons || []).find(d => d.date === today);
    if (existing) return existing;
    return { date: today, challenges: rollDungeon(today) };
  }, [state.dungeons, today]);

  const cleared = dungeon.challenges.every(c => c.done);
  const lootItem = dungeon.lootId ? (state.inventory || []).find(i => i.id === dungeon.lootId) : null;

  return (
    <div className="space-y-5">
      <div className="rpg-panel relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5 pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <Swords className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-display text-lg tracking-wider text-primary">DUNGEON DO DIA</h2>
              <p className="text-xs text-foreground/60">3 desafios. Curtos. Reais. Loot ao final.</p>
            </div>
            <Button size="sm" variant="ghost" className="ml-auto text-xs" onClick={() => regenerateDungeon(today)}>
              <RefreshCw className="w-3 h-3 mr-1" /> Refazer
            </Button>
          </div>

          <div className="space-y-2">
            {dungeon.challenges.map((c, i) => {
              const attr = ATTRIBUTE_MAP[c.attribute];
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    c.done ? 'border-emerald-500/40 bg-emerald-500/5 opacity-70' : `${attr.border} ${attr.bg}`
                  }`}
                >
                  <button
                    onClick={() => !c.done && completeDungeonChallenge(today, c.id)}
                    disabled={c.done}
                    className={`mt-0.5 w-6 h-6 rounded-md border flex items-center justify-center ${
                      c.done ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' : `${attr.border} hover:${attr.bg}`
                    }`}
                  >
                    {c.done && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg">{attr.emoji}</span>
                      <span className={`font-display text-sm ${c.done ? 'line-through text-foreground/50' : 'text-foreground'}`}>{c.title}</span>
                    </div>
                    <p className="text-xs text-foreground/60 mt-0.5">{c.desc}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-foreground/50">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.minutes}min</span>
                      <span className={attr.color}>+{c.xp} XP {attr.label}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
            {cleared && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-lg border border-gold/40 bg-gradient-to-br from-gold/10 to-primary/10 text-center"
              >
                <Sparkles className="w-6 h-6 text-gold mx-auto mb-2" />
                <div className="font-display text-gold tracking-wider mb-1">DUNGEON LIMPA</div>
                {lootItem ? (
                  <div className="mt-2">
                    <div className="text-3xl">{lootItem.emoji}</div>
                    <div className={`font-display text-sm ${RARITY_STYLES[lootItem.rarity].color}`}>{lootItem.name}</div>
                    <div className="text-[10px] text-foreground/60 uppercase">{RARITY_STYLES[lootItem.rarity].label}</div>
                    <div className="text-xs text-foreground/70 mt-1">{lootItem.description}</div>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/70">Sem drop hoje — mas o ganho real foi feito.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// expose helpers for store to compute today's dungeon when needed
export { rollDungeon };
