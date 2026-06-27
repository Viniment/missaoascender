import { motion } from 'framer-motion';
import { useGame } from '@/lib/GameContext';
import { ATTRIBUTES, xpForAttrLevel, totalAttributeLevel, defaultAttributes } from '@/lib/attributes';
import { Activity } from 'lucide-react';

export default function AttributesPanel() {
  const { state } = useGame();
  const attrs = state.attributes || defaultAttributes;
  const total = totalAttributeLevel(attrs);

  return (
    <div className="space-y-5">
      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-lg tracking-wider text-primary">ATRIBUTOS DE VIDA</h2>
            <p className="text-xs text-muted-foreground">Cada ação real treina um pedaço de quem você está se tornando.</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-muted-foreground font-display tracking-wider">TOTAL</div>
            <div className="font-display text-xl text-gold">{total}</div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {ATTRIBUTES.map((a, i) => {
            const s = attrs[a.id] || { xp: 0, level: 1 };
            const need = xpForAttrLevel(s.level);
            const pct = Math.min(100, (s.xp / need) * 100);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`p-4 rounded-lg border ${a.border} ${a.bg}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-2xl">{a.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-display tracking-wider ${a.color}`}>{a.label}</div>
                    <div className="text-[11px] text-foreground/60">{a.description}</div>
                  </div>
                  <div className={`font-display text-2xl ${a.color}`}>Lv {s.level}</div>
                </div>
                <div className="relative h-2 bg-background/60 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${a.bg.replace('/10', '/80')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-foreground/50 mt-1">
                  <span>{s.xp} / {need} XP</span>
                  <span>{a.short}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="rpg-panel text-xs text-foreground/70 space-y-1">
        <p className="font-display text-primary text-sm tracking-wider mb-1">COMO TREINAR CADA ATRIBUTO</p>
        <p>⚔️ <b>Força</b> — missões de Treino e Saúde.</p>
        <p>🧠 <b>Mente</b> — Estudo, Leitura, Trabalho, Criatividade.</p>
        <p>✨ <b>Espírito</b> — Despertar, Diário, missões Espirituais.</p>
        <p>🤝 <b>Social</b> — missões e hábitos sociais.</p>
        <p>🛡️ <b>Disciplina</b> — todo hábito feito + ritual diário.</p>
        <p>❤️‍🔥 <b>Vitalidade</b> — missões de Saúde, sono, alimentação.</p>
      </div>
    </div>
  );
}
