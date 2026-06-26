import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Skull, Plus, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

const BOSS_TEMPLATES = [
  { name: 'Procrastinador', emoji: '🕷️', desc: 'O padrão que te faz adiar o que importa.', hp: 100, weakness: 'Pomodoros, missões iniciadas no primeiro impulso.' },
  { name: 'Crítico Interno', emoji: '👁️', desc: 'A voz que diz "não é bom o suficiente".', hp: 80, weakness: 'Diário, autocompaixão, registrar vitórias.' },
  { name: 'Cansaço Crônico', emoji: '🦇', desc: 'A névoa que pesa antes mesmo do dia começar.', hp: 120, weakness: 'Sono, água, movimento, sol da manhã.' },
  { name: 'Comparação', emoji: '🐍', desc: 'Aquele que mede sua vida pela alheia.', hp: 90, weakness: 'Foco no próprio progresso, sair de redes.' },
  { name: 'Vontade Doce', emoji: '🍩', desc: 'O impulso por açúcar e recompensa fácil.', hp: 70, weakness: 'Água, proteína, pausa de 5 min antes de ceder.' },
];

export default function BossPanel() {
  const { state, addBoss, damageBoss, defeatBoss, removeBoss } = useGame();
  const bosses = state.bosses || [];
  const active = bosses.filter(b => !b.defeatedAt);
  const defeated = bosses.filter(b => b.defeatedAt);
  const [open, setOpen] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  return (
    <div className="space-y-5">
      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-3">
          <Skull className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="font-display text-lg tracking-wider text-red-400">BOSS BATTLES</h2>
            <p className="text-xs text-foreground/60">Padrões reais que você está enfrentando. Cada ação contra eles tira HP.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="ml-auto bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40">
            <Plus className="w-3 h-3 mr-1" /> Invocar Boss
          </Button>
        </div>

        {active.length === 0 ? (
          <p className="text-sm text-foreground/60">Nenhum boss ativo. Quando notar um padrão te derrubando, invoque-o aqui pra começar a derrotá-lo conscientemente.</p>
        ) : (
          <div className="space-y-3">
            {active.map(b => {
              const pct = Math.max(0, (b.hp / b.maxHp) * 100);
              return (
                <motion.div
                  key={b.id}
                  layout
                  className="p-4 rounded-lg border border-red-500/40 bg-gradient-to-br from-red-950/30 to-background"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-3xl">{b.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-base text-red-300">{b.name}</div>
                      <p className="text-xs text-foreground/70">{b.description}</p>
                      {b.weakness && <p className="text-[11px] text-gold mt-1">⚡ Fraqueza: {b.weakness}</p>}
                    </div>
                    <button onClick={() => removeBoss(b.id)} className="text-foreground/40 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="relative h-3 bg-background/60 rounded-full overflow-hidden border border-red-500/30">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 to-red-400"
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-white drop-shadow">
                      {b.hp} / {b.maxHp} HP
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => damageBoss(b.id, 5)} className="text-xs border border-red-500/30">Golpe leve −5</Button>
                    <Button size="sm" variant="ghost" onClick={() => damageBoss(b.id, 15)} className="text-xs border border-red-500/40">Golpe forte −15</Button>
                    <Button size="sm" variant="ghost" onClick={() => damageBoss(b.id, 35)} className="text-xs border border-red-500/60 text-red-200">Crítico −35</Button>
                  </div>
                  {b.hp <= 0 && (
                    <Button size="sm" onClick={() => defeatBoss(b.id)} className="w-full mt-2 bg-gold/20 hover:bg-gold/30 text-gold border border-gold/40">
                      <Trophy className="w-4 h-4 mr-1" /> Selar a vitória
                    </Button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {defeated.length > 0 && (
        <div className="rpg-panel">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-gold" />
            <h3 className="font-display tracking-wider text-gold">DERROTADOS</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {defeated.map(b => (
              <div key={b.id} className="px-2 py-1 rounded-md bg-gold/10 border border-gold/30 text-xs flex items-center gap-1">
                <span>{b.emoji}</span><span className="text-gold">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background border-red-500/40 max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider text-red-400">INVOCAR BOSS</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-foreground/70">Escolha um padrão clássico ou crie o seu.</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {BOSS_TEMPLATES.map(t => (
                <button
                  key={t.name}
                  onClick={() => { addBoss({ name: t.name, emoji: t.emoji, description: t.desc, hp: t.hp, maxHp: t.hp, weakness: t.weakness }); setOpen(false); }}
                  className="text-left p-3 rounded-lg border border-red-500/30 bg-red-950/10 hover:bg-red-950/30 transition"
                >
                  <div className="text-2xl mb-1">{t.emoji}</div>
                  <div className="font-display text-sm text-red-300">{t.name}</div>
                  <div className="text-[11px] text-foreground/60">{t.desc}</div>
                  <div className="text-[10px] text-gold mt-1">HP {t.hp}</div>
                </button>
              ))}
            </div>
            <div className="pt-3 border-t border-border space-y-2">
              <p className="text-xs font-display tracking-wider text-red-300">CUSTOM</p>
              <Input placeholder="Nome do padrão (ex: Dúvida Paralisante)" value={customName} onChange={e => setCustomName(e.target.value)} />
              <Textarea placeholder="Como ele te ataca? Quando aparece?" value={customDesc} onChange={e => setCustomDesc(e.target.value)} className="text-xs" rows={2} />
              <Button
                disabled={!customName.trim()}
                onClick={() => { addBoss({ name: customName.trim(), emoji: '👹', description: customDesc.trim() || 'Padrão pessoal.', hp: 100, maxHp: 100 }); setCustomName(''); setCustomDesc(''); setOpen(false); }}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-200"
              >
                Invocar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
