import { useEffect, useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { Swords, CheckCircle2, Clock, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { RARITY_STYLES } from '@/lib/loot';
import { ATTRIBUTE_MAP } from '@/lib/attributes';
import { getTodayBrasilia } from '@/lib/utils';
import { rollDungeonChallenges } from '@/lib/dungeon';

export default function DungeonPanel() {
  const { state, completeDungeonChallenge, regenerateDungeon, ensureTodayDungeon } = useGame();
  const today = getTodayBrasilia();

  useEffect(() => {
    ensureTodayDungeon(today);
  }, [today, ensureTodayDungeon]);

  const dungeon = useMemo(() => {
    const existing = (state.dungeons || []).find(d => d.date === today);
    if (existing) return existing;
    return { date: today, challenges: rollDungeonChallenges(today), cleared: false as boolean | undefined, lootId: undefined as string | undefined };
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
