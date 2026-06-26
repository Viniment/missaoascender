import { useEffect, useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { RARITY_STYLES, isBuffActive } from '@/lib/loot';
import { Backpack, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InventoryPanel() {
  const { state, removeInventoryItem } = useGame();
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const items = state.inventory || [];
  const buffs = (state.activeBuffs || []).filter(isBuffActive);

  return (
    <div className="space-y-5">
      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-3">
          <Backpack className="w-5 h-5 text-primary" />
          <h2 className="font-display text-lg tracking-wider text-primary">INVENTÁRIO</h2>
          <span className="ml-auto text-xs text-foreground/60">{items.length} itens</span>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-foreground/60">Complete dungeons, missões e hábitos pra começar a coletar itens.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {items.slice().reverse().map(item => {
              const style = RARITY_STYLES[item.rarity];
              return (
                <div key={item.id} className={`p-3 rounded-lg border ${style.border} ${style.bg} relative group`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-display text-sm ${style.color} truncate`}>{item.name}</div>
                      <div className="text-[10px] text-foreground/50 tracking-wider uppercase">{style.label}</div>
                    </div>
                    <button
                      onClick={() => removeInventoryItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-foreground/40 hover:text-red-400"
                      title="Descartar"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs text-foreground/70">{item.description}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-3">
          <Clock className="w-5 h-5 text-gold" />
          <h2 className="font-display text-lg tracking-wider text-gold">BUFFS ATIVOS</h2>
        </div>
        {buffs.length === 0 ? (
          <p className="text-sm text-foreground/60">Use uma Poção/Cristal do inventário para ativar um buff.</p>
        ) : (
          <div className="space-y-2">
            {buffs.map(b => {
              const remaining = Math.max(0, new Date(b.expiresAt).getTime() - Date.now());
              const mins = Math.floor(remaining / 60000);
              return (
                <div key={b.id} className="flex items-center gap-3 p-2 rounded-md bg-gold/10 border border-gold/30">
                  <span className="text-xl">⚡</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm text-gold">{b.itemName}</div>
                    <div className="text-[11px] text-foreground/60">+{b.percent}% {b.type === 'xp' ? 'XP' : b.type === 'gold' ? 'Ouro' : 'Foco'}</div>
                  </div>
                  <div className="text-xs text-foreground/70 font-display">{mins}m</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div className="rpg-panel">
          <p className="font-display text-sm tracking-wider text-primary mb-2">USAR ITEM</p>
          <p className="text-xs text-foreground/60 mb-3">Itens com buff podem ser consumidos pra ativar o efeito agora.</p>
          <div className="grid gap-2">
            {items.filter(i => i.buff).slice().reverse().map(item => {
              const style = RARITY_STYLES[item.rarity];
              return (
                <UseItemRow key={item.id} item={item} style={style} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function UseItemRow({ item, style }: { item: ReturnType<typeof useGame>['state']['inventory'][number]; style: typeof RARITY_STYLES[keyof typeof RARITY_STYLES] }) {
  const { useInventoryItem } = useGame();
  return (
    <div className={`flex items-center gap-2 p-2 rounded-md border ${style.border} ${style.bg}`}>
      <span className="text-xl">{item.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className={`font-display text-sm ${style.color} truncate`}>{item.name}</div>
        <div className="text-[11px] text-foreground/70">{item.description}</div>
      </div>
      <Button size="sm" onClick={() => useInventoryItem(item.id)} className="bg-primary hover:bg-primary/90 h-7 text-xs">Usar</Button>
    </div>
  );
}
