import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Gift, Coins, Plus, Trash2, Check, Palette, Sparkles, Lock, Crown, PawPrint, Package, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SHOP_THEMES, SHOP_FRAMES, SHOP_TITLES, SHOP_PETS, SHOP_CHESTS, RARITY_LABEL, RARITY_CLASS } from '@/lib/shopCatalog';
import type { ThemeId } from '@/components/ThemeSelector';

type Tab = 'personais' | 'temas' | 'molduras' | 'titulos' | 'pets' | 'baus';

export default function RewardsShop() {
  const { state, addReward, redeemReward, deleteReward, buyTheme, setTheme, buyFrame, setActiveFrame, buyTitle, setActiveTitle, buyPet, setActivePet, openChest } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState(50);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<Tab>('personais');

  const ownedThemes = state.ownedThemes || ['neon-purple'];
  const ownedFrames = state.ownedFrames || ['iniciante'];
  const ownedTitles = state.ownedTitles || ['aprendiz'];
  const ownedPets = state.ownedPets || [];
  const activeTitle = state.activeTitle || 'aprendiz';
  const activePet = state.activePet;
  const cooldowns = state.chestCooldowns || {};
  const currentTheme = state.theme || 'neon-purple';
  const currentFrame = state.activeFrame || 'iniciante';

  const handleAdd = () => {
    if (submittingRef.current) return;
    if (!name.trim() || cost <= 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addReward({ name, cost });
      setName('');
      setCost(50);
      setShowForm(false);
      toast.success('Recompensa criada!');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const handleRedeem = (id: string) => {
    const reward = state.rewards.find(r => r.id === id);
    if (!reward) return;
    if (reward.redeemed) {
      toast.info('Já resgatada!');
      return;
    }
    if (state.gold < reward.cost) {
      toast.error('Ouro insuficiente!');
      return;
    }
    redeemReward(id);
    toast.success(`🎁 ${reward.name} resgatado!`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Gift className="w-5 h-5" /> LOJA
        </h2>
        {tab === 'personais' && (
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" /> Nova
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-gold font-display">
        <Coins className="w-4 h-4" /> {state.gold} ouro disponível
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border overflow-x-auto">
        <TabButton active={tab==='personais'} onClick={() => setTab('personais')} icon={<Gift className="w-3.5 h-3.5" />} label="Pessoais" />
        <TabButton active={tab==='temas'} onClick={() => setTab('temas')} icon={<Palette className="w-3.5 h-3.5" />} label="Temas" />
        <TabButton active={tab==='molduras'} onClick={() => setTab('molduras')} icon={<Sparkles className="w-3.5 h-3.5" />} label="Molduras" />
        <TabButton active={tab==='titulos'} onClick={() => setTab('titulos')} icon={<Crown className="w-3.5 h-3.5" />} label="Títulos" />
        <TabButton active={tab==='pets'} onClick={() => setTab('pets')} icon={<PawPrint className="w-3.5 h-3.5" />} label="Pets" />
        <TabButton active={tab==='baus'} onClick={() => setTab('baus')} icon={<Package className="w-3.5 h-3.5" />} label="Baús" />
      </div>

      {tab === 'personais' && (
      <>
      {showForm && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rpg-panel space-y-3">
          <Input placeholder="Nome da recompensa" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
          <div>
            <label className="text-xs text-muted-foreground">Custo em ouro</label>
            <Input type="number" min={1} value={cost} onChange={e => setCost(Number(e.target.value))} className="bg-secondary border-border" />
          </div>
          <Button className="w-full" onClick={handleAdd} disabled={submitting}>Criar Recompensa</Button>
        </motion.div>
      )}

      {state.rewards.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Nenhuma recompensa criada. Crie a sua!</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {state.rewards.map(r => (
          <motion.div
            key={r.id}
            whileHover={{ scale: 1.02 }}
            className={`rpg-panel flex flex-col items-center gap-2 text-center ${r.redeemed ? 'opacity-50' : ''}`}
          >
            <span className="text-sm font-semibold text-foreground">{r.name}</span>
            <span className="text-xs text-gold font-display">{r.cost} 🪙</span>
            {r.redeemed ? (
              <span className="text-xs text-success flex items-center gap-1"><Check className="w-3 h-3" /> Resgatada</span>
            ) : (
              <Button
                size="sm"
                className="w-full"
                variant={state.gold >= r.cost ? 'default' : 'secondary'}
                onClick={() => handleRedeem(r.id)}
                disabled={state.gold < r.cost}
              >
                Resgatar
              </Button>
            )}
            <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => deleteReward(r.id)}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </motion.div>
        ))}
      </div>
      </>
      )}

      {tab === 'temas' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_THEMES.map(t => {
            const owned = ownedThemes.includes(t.id);
            const isActive = currentTheme === t.id;
            const canBuy = !owned && state.gold >= t.cost;
            return (
              <div key={t.id} className={`rpg-panel space-y-2 ${isActive ? 'border-primary glow-purple' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {t.preview.map((c, i) => (
                      <div key={i} className="w-4 h-4 rounded-full" style={{ backgroundColor: c, boxShadow: i>0 ? `0 0 6px ${c}88` : undefined }} />
                    ))}
                  </div>
                  <span className="font-display text-sm text-foreground truncate">{t.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
                {owned ? (
                  <Button size="sm" className="w-full" variant={isActive ? 'default' : 'secondary'} onClick={() => setTheme(t.id)} disabled={isActive}>
                    {isActive ? <><Check className="w-3 h-3 mr-1" /> Ativo</> : 'Aplicar'}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" variant={canBuy ? 'default' : 'secondary'} disabled={!canBuy} onClick={() => {
                    const r = buyTheme(t.id, t.cost);
                    if (r.ok) toast.success(`🎨 Tema ${t.name} desbloqueado!`);
                    else toast.error(r.error || 'Não foi possível comprar');
                  }}>
                    {canBuy ? <>Comprar · {t.cost} 🪙</> : <><Lock className="w-3 h-3 mr-1" /> {t.cost} 🪙</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'molduras' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SHOP_FRAMES.map(f => {
            const owned = ownedFrames.includes(f.id);
            const isActive = currentFrame === f.id;
            const canBuy = !owned && state.gold >= f.cost;
            const isPrismatic = f.id === 'prismatico';
            return (
              <div key={f.id} className={`rpg-panel space-y-2 text-center ${isActive ? 'border-primary glow-purple' : ''}`}>
                <div className="mx-auto w-14 h-14 flex items-center justify-center">
                  <div className={`relative w-14 h-14 rounded-full ${isPrismatic ? f.ringClass : ''}`}>
                    <div className={`relative w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center ${isPrismatic ? '' : f.ringClass}`}
                      style={{ boxShadow: `0 0 12px ${f.color}55` }}>
                      <span className="font-display text-lg text-foreground">{(state.name || 'A')[0]}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-display text-xs text-foreground truncate">{f.name}</div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{f.description}</p>
                </div>
                {owned ? (
                  <Button size="sm" className="w-full" variant={isActive ? 'default' : 'secondary'} onClick={() => setActiveFrame(f.id)} disabled={isActive}>
                    {isActive ? <><Check className="w-3 h-3 mr-1" /> Equipada</> : 'Equipar'}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full text-xs" variant={canBuy ? 'default' : 'secondary'} disabled={!canBuy} onClick={() => {
                    const r = buyFrame(f.id, f.cost);
                    if (r.ok) toast.success(`✨ ${f.name} desbloqueada!`);
                    else toast.error(r.error || 'Não foi possível comprar');
                  }}>
                    {canBuy ? <>{f.cost} 🪙</> : <><Lock className="w-3 h-3 mr-1" /> {f.cost} 🪙</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'titulos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_TITLES.map(t => {
            const owned = ownedTitles.includes(t.id);
            const isActive = activeTitle === t.id;
            const canBuy = !owned && state.gold >= t.cost;
            return (
              <div key={t.id} className={`rpg-panel space-y-2 border ${RARITY_CLASS[t.rarity]} ${isActive ? 'ring-1 ring-primary' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${t.className}`}>« {t.name} »</span>
                  <span className="text-[10px] uppercase tracking-wider opacity-70">{RARITY_LABEL[t.rarity]}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{t.description}</p>
                {owned ? (
                  <Button size="sm" className="w-full" variant={isActive ? 'default' : 'secondary'} onClick={() => setActiveTitle(t.id)} disabled={isActive}>
                    {isActive ? <><Check className="w-3 h-3 mr-1" /> Equipado</> : 'Equipar'}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" variant={canBuy ? 'default' : 'secondary'} disabled={!canBuy} onClick={() => {
                    const r = buyTitle(t.id, t.cost);
                    if (r.ok) toast.success(`👑 Título "${t.name}" desbloqueado!`);
                    else toast.error(r.error || 'Não foi possível comprar');
                  }}>
                    {canBuy ? <>Comprar · {t.cost} 🪙</> : <><Lock className="w-3 h-3 mr-1" /> {t.cost} 🪙</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'pets' && (
        <div className="space-y-3">
          {activePet && (
            <button
              onClick={() => setActivePet(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Desequipar pet atual
            </button>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SHOP_PETS.map(p => {
            const owned = ownedPets.includes(p.id);
            const isActive = activePet === p.id;
            const canBuy = !owned && state.gold >= p.cost;
            return (
              <div key={p.id} className={`rpg-panel space-y-2 text-center border ${RARITY_CLASS[p.rarity]} ${isActive ? 'ring-1 ring-primary' : ''}`}>
                <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center border-2 ${p.auraClass} bg-secondary`}>
                  <span className="text-2xl">{p.emoji}</span>
                </div>
                <div>
                  <div className="font-display text-xs text-foreground truncate">{p.name}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">{RARITY_LABEL[p.rarity]}</div>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">{p.description}</p>
                </div>
                {owned ? (
                  <Button size="sm" className="w-full" variant={isActive ? 'default' : 'secondary'} onClick={() => setActivePet(p.id)} disabled={isActive}>
                    {isActive ? <><Check className="w-3 h-3 mr-1" /> Equipado</> : 'Equipar'}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full text-xs" variant={canBuy ? 'default' : 'secondary'} disabled={!canBuy} onClick={() => {
                    const r = buyPet(p.id, p.cost);
                    if (r.ok) toast.success(`🐾 ${p.name} adotado!`);
                    else toast.error(r.error || 'Não foi possível comprar');
                  }}>
                    {canBuy ? <>{p.cost} 🪙</> : <><Lock className="w-3 h-3 mr-1" /> {p.cost} 🪙</>}
                  </Button>
                )}
              </div>
            );
          })}
          </div>
        </div>
      )}

      {tab === 'baus' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_CHESTS.map(c => {
            const last = cooldowns[c.id];
            const readyAt = last ? new Date(last).getTime() + c.cooldownHours * 3600 * 1000 : 0;
            const remainingMs = Math.max(0, readyAt - Date.now());
            const onCooldown = remainingMs > 0;
            const canBuy = !onCooldown && state.gold >= c.cost;
            const hrs = Math.floor(remainingMs / 3600000);
            const mins = Math.ceil((remainingMs % 3600000) / 60000);
            return (
              <div key={c.id} className={`rpg-panel space-y-2 border ${RARITY_CLASS[c.rarity]}`}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl" style={{ filter: `drop-shadow(0 0 6px ${c.color}88)` }}>{c.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-sm text-foreground truncate">{c.name}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">{RARITY_LABEL[c.rarity]} · recarga {c.cooldownHours}h</div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{c.description}</p>
                <div className="text-[10px] text-muted-foreground">
                  Ouro: {c.goldRange[0]}–{c.goldRange[1]} · Item: {Math.round(c.itemChance * 100)}%
                </div>
                {onCooldown ? (
                  <Button size="sm" className="w-full" variant="secondary" disabled>
                    <Clock className="w-3 h-3 mr-1" /> {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" variant={canBuy ? 'default' : 'secondary'} disabled={!canBuy} onClick={() => {
                    const r = openChest(c.id);
                    if (r.ok && r.loot) {
                      const parts = [`+${r.loot.gold} ouro`];
                      if (r.loot.itemName) parts.push(`${r.loot.itemName} (${r.loot.rarity})`);
                      toast.success(`📦 ${c.name}: ${parts.join(' + ')}`);
                    } else {
                      toast.error(r.error || 'Não foi possível abrir');
                    }
                  }}>
                    {canBuy ? <>Abrir · {c.cost} 🪙</> : <><Lock className="w-3 h-3 mr-1" /> {c.cost} 🪙</>}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-display tracking-wider transition-all whitespace-nowrap ${
        active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {icon} {label}
    </button>
  );
}
