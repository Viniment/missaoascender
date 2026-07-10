import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Gift, Coins, Plus, Trash2, Check, Palette, Sparkles, Lock, Crown, PawPrint, Package, Clock, Eye, ShoppingCart, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SHOP_THEMES, SHOP_FRAMES, SHOP_TITLES, SHOP_PETS, SHOP_CHESTS, RARITY_LABEL, RARITY_CLASS, getFrame, getTitle, getPet } from '@/lib/shopCatalog';
import type { Rarity } from '@/lib/shopCatalog';
import type { ThemeId } from '@/components/ThemeSelector';

type Tab = 'personais' | 'visual' | 'titulos' | 'pets' | 'baus';

type PreviewData =
  | { kind: 'theme'; id: string; name: string; description: string; cost: number; preview: [string, string, string] }
  | { kind: 'frame'; id: string; name: string; description: string; cost: number }
  | { kind: 'title'; id: string; name: string; description: string; cost: number; className: string }
  | { kind: 'pet'; id: string; name: string; description: string; cost: number; emoji: string; auraClass: string };

// Cores neon por raridade — bordas e brilhos dos cards
const RARITY_BORDER: Record<Rarity, string> = {
  comum:    'border-slate-500/50 shadow-[0_0_16px_-6px_rgba(148,163,184,0.35)]',
  raro:     'border-neon-blue/60 shadow-[0_0_20px_-6px_hsl(var(--neon-blue)/0.55)]',
  epico:    'border-primary/70 shadow-[0_0_22px_-4px_hsl(var(--primary)/0.6)]',
  lendario: 'border-gold/70 shadow-[0_0_26px_-4px_hsl(var(--gold)/0.65)]',
};
const RARITY_TEXT: Record<Rarity, string> = {
  comum:    'text-slate-300',
  raro:     'text-neon-blue',
  epico:    'text-primary',
  lendario: 'text-gold',
};
const RARITY_NAME: Record<Rarity, string> = {
  comum:    'text-slate-100',
  raro:     'text-neon-blue glow-text-blue',
  epico:    'text-primary glow-text-purple',
  lendario: 'text-gold',
};

// Inferir raridade dos temas/molduras por custo
function inferRarity(cost: number): Rarity {
  if (cost >= 2500) return 'lendario';
  if (cost >= 1000) return 'epico';
  if (cost >= 300) return 'raro';
  return 'comum';
}

export default function RewardsShop() {
  const { state, addReward, redeemReward, deleteReward, buyTheme, setTheme, buyFrame, setActiveFrame, buyTitle, setActiveTitle, buyPet, setActivePet, openChest } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState(50);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<Tab>('personais');
  const [preview, setPreview] = useState<PreviewData | null>(null);

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

  const tabIntro: Record<Tab, string> = {
    personais: 'Recompensas reais cadastradas por você (ex: assistir filme, comer fora).',
    visual: 'Temas de cor e molduras animadas para o seu avatar. Cosmético — não altera dano nem XP.',
    titulos: 'Frases de identidade que substituem sua legenda abaixo do nome.',
    pets: 'Companheiro visual que aparece junto ao avatar. Efeitos apenas cosméticos.',
    baus: 'Sorteio controlado. Baús têm cooldown para preservar a sensação de evento. Item duplicado vira ouro de consolação.',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2 uppercase tracking-wider">
          <Crown className="w-5 h-5" /> Loja do Herói
        </h2>
        <div className="flex items-center gap-1.5 text-sm font-display text-gold px-3 py-1 rounded-full border border-gold/40 bg-gold/5">
          <Coins className="w-4 h-4" /> {state.gold} ouro
        </div>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed">
        Cosméticos caros e raros — metas de longo prazo, não consumo impulsivo. Itens visuais não afetam o jogo: o progresso real vem das suas ações.
      </p>

      <div className="flex gap-1 p-1 rounded-lg bg-secondary/50 border border-border overflow-x-auto">
        <TabButton active={tab==='personais'} onClick={() => setTab('personais')} icon={<Gift className="w-3.5 h-3.5" />} label="Recompensas" />
        <TabButton active={tab==='visual'} onClick={() => setTab('visual')} icon={<Palette className="w-3.5 h-3.5" />} label="Visual" />
        <TabButton active={tab==='titulos'} onClick={() => setTab('titulos')} icon={<Crown className="w-3.5 h-3.5" />} label="Títulos" />
        <TabButton active={tab==='pets'} onClick={() => setTab('pets')} icon={<PawPrint className="w-3.5 h-3.5" />} label="Pets" />
        <TabButton active={tab==='baus'} onClick={() => setTab('baus')} icon={<Package className="w-3.5 h-3.5" />} label="Baús" />
      </div>

      <p className="text-xs text-muted-foreground">{tabIntro[tab]}</p>

      {tab === 'personais' && (
      <>
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4 mr-1" /> Nova
        </Button>
      </div>
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

      {tab === 'visual' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_THEMES.map(t => {
            const rarity = inferRarity(t.cost);
            const owned = ownedThemes.includes(t.id);
            const isActive = currentTheme === t.id;
            const canBuy = !owned && state.gold >= t.cost;
            return (
              <ShopCard
                key={`theme-${t.id}`}
                rarity={rarity}
                name={t.name}
                description={t.description}
                cost={t.cost}
                animated={t.cost >= 400}
                icon={
                  <div className="flex gap-1 items-center justify-center w-12 h-12 rounded-lg bg-secondary/60 border border-border">
                    <div className="flex flex-col gap-0.5">
                      {t.preview.map((c, i) => (
                        <div key={i} className="w-5 h-1.5 rounded-full" style={{ backgroundColor: c, boxShadow: `0 0 6px ${c}88` }} />
                      ))}
                    </div>
                  </div>
                }
                owned={owned}
                isActive={isActive}
                onPreview={() => setPreview({ kind: 'theme', id: t.id, name: t.name, description: t.description, cost: t.cost, preview: t.preview })}
                onBuy={() => {
                  const r = buyTheme(t.id, t.cost);
                  if (r.ok) toast.success(`🎨 Tema ${t.name} desbloqueado!`);
                  else toast.error(r.error || 'Não foi possível comprar');
                }}
                onEquip={() => setTheme(t.id)}
                canBuy={canBuy}
              />
            );
          })}
          {SHOP_FRAMES.filter(f => f.cost > 0).map(f => {
            const rarity = inferRarity(f.cost);
            const owned = ownedFrames.includes(f.id);
            const isActive = currentFrame === f.id;
            const canBuy = !owned && state.gold >= f.cost;
            const isPrismatic = f.id === 'prismatico';
            return (
              <ShopCard
                key={`frame-${f.id}`}
                rarity={rarity}
                name={`Moldura · ${f.name}`}
                description={f.description}
                cost={f.cost}
                animated
                icon={
                  <div className={`w-12 h-12 rounded-full ${isPrismatic ? f.ringClass : ''}`}>
                    <div className={`relative w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center ${isPrismatic ? '' : f.ringClass}`}>
                      <span className="font-display text-sm text-foreground">{(state.name || 'A')[0]}</span>
                    </div>
                  </div>
                }
                owned={owned}
                isActive={isActive}
                onPreview={() => setPreview({ kind: 'frame', id: f.id, name: f.name, description: f.description, cost: f.cost })}
                onBuy={() => {
                  const r = buyFrame(f.id, f.cost);
                  if (r.ok) toast.success(`✨ ${f.name} desbloqueada!`);
                  else toast.error(r.error || 'Não foi possível comprar');
                }}
                onEquip={() => setActiveFrame(f.id)}
                canBuy={canBuy}
              />
            );
          })}
        </div>
      )}

      {tab === 'titulos' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SHOP_TITLES.filter(t => t.cost > 0).map(t => {
            const owned = ownedTitles.includes(t.id);
            const isActive = activeTitle === t.id;
            const canBuy = !owned && state.gold >= t.cost;
            return (
              <ShopCard
                key={t.id}
                rarity={t.rarity}
                name={t.name}
                description={t.description}
                cost={t.cost}
                icon={
                  <div className="w-12 h-12 rounded-lg bg-secondary/60 border border-border flex items-center justify-center">
                    <Sparkles className={`w-6 h-6 ${RARITY_TEXT[t.rarity]}`} />
                  </div>
                }
                owned={owned}
                isActive={isActive}
                onPreview={() => setPreview({ kind: 'title', id: t.id, name: t.name, description: t.description, cost: t.cost, className: t.className })}
                onBuy={() => {
                  const r = buyTitle(t.id, t.cost);
                  if (r.ok) toast.success(`👑 Título "${t.name}" desbloqueado!`);
                  else toast.error(r.error || 'Não foi possível comprar');
                }}
                onEquip={() => setActiveTitle(t.id)}
                canBuy={canBuy}
              />
            );
          })}
        </div>
      )}

      {tab === 'pets' && (
        <div className="space-y-3">
          {activePet && (
            <button onClick={() => setActivePet(null)} className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2">
              Desequipar pet atual
            </button>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHOP_PETS.map(p => {
              const owned = ownedPets.includes(p.id);
              const isActive = activePet === p.id;
              const canBuy = !owned && state.gold >= p.cost;
              return (
                <ShopCard
                  key={p.id}
                  rarity={p.rarity}
                  name={p.name}
                  description={p.description}
                  cost={p.cost}
                  icon={
                    <div className={`w-12 h-12 rounded-lg bg-secondary/60 border ${p.auraClass} flex items-center justify-center`}>
                      <span className="text-2xl leading-none">{p.emoji}</span>
                    </div>
                  }
                  owned={owned}
                  isActive={isActive}
                  onPreview={() => setPreview({ kind: 'pet', id: p.id, name: p.name, description: p.description, cost: p.cost, emoji: p.emoji, auraClass: p.auraClass })}
                  onBuy={() => {
                    const r = buyPet(p.id, p.cost);
                    if (r.ok) toast.success(`🐾 ${p.name} adotado!`);
                    else toast.error(r.error || 'Não foi possível comprar');
                  }}
                  onEquip={() => setActivePet(p.id)}
                  canBuy={canBuy}
                />
              );
            })}
          </div>
        </div>
      )}

      {tab === 'baus' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SHOP_CHESTS.map(c => {
            const last = cooldowns[c.id];
            const readyAt = last ? new Date(last).getTime() + c.cooldownHours * 3600 * 1000 : 0;
            const remainingMs = Math.max(0, readyAt - Date.now());
            const onCooldown = remainingMs > 0;
            const canOpen = !onCooldown && state.gold >= c.cost;
            const hrs = Math.floor(remainingMs / 3600000);
            const mins = Math.ceil((remainingMs % 3600000) / 60000);
            const days = Math.floor(c.cooldownHours / 24);
            const cadence = days >= 1 ? `1 por ${days} dia${days > 1 ? 's' : ''}` : `1 por ${c.cooldownHours}h`;
            return (
              <div key={c.id} className={`relative rounded-lg border-2 bg-card/40 p-4 flex flex-col items-center gap-3 text-center ${RARITY_BORDER[c.rarity]}`}>
                <span className="text-5xl leading-none mt-1" style={{ filter: `drop-shadow(0 0 8px ${c.color}aa)` }}>{c.icon}</span>
                <div>
                  <div className={`font-display text-base ${RARITY_NAME[c.rarity]}`}>{c.name}</div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{c.description}</p>
                <div className="flex items-center gap-1.5 text-gold font-display text-sm">
                  <Coins className="w-4 h-4" /> {c.cost.toLocaleString('pt-BR')}
                </div>
                {onCooldown ? (
                  <Button size="sm" className="w-full" variant="secondary" disabled>
                    <Clock className="w-3 h-3 mr-1" /> {hrs > 0 ? `${hrs}h ` : ''}{mins}m
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="w-full"
                    variant={canOpen ? 'default' : 'secondary'}
                    disabled={!canOpen}
                    onClick={() => {
                      const r = openChest(c.id);
                      if (r.ok && r.loot) {
                        const parts = [`+${r.loot.gold} ouro`];
                        if (r.loot.itemName) parts.push(`${r.loot.itemName} (${r.loot.rarity})`);
                        toast.success(`📦 ${c.name}: ${parts.join(' + ')}`);
                      } else {
                        toast.error(r.error || 'Não foi possível abrir');
                      }
                    }}
                  >
                    {canOpen ? 'Abrir baú' : 'Ouro insuficiente'}
                  </Button>
                )}
                <div className="text-[10px] text-muted-foreground">{cadence}</div>
              </div>
            );
          })}
        </div>
      )}

      <PreviewDialog preview={preview} onClose={() => setPreview(null)} playerName={state.name} avatar={state.avatar} />
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-display tracking-wider transition-all whitespace-nowrap ${
        active ? 'bg-primary/20 text-primary border border-primary/60 shadow-[0_0_14px_-4px_hsl(var(--primary)/0.6)]' : 'text-muted-foreground hover:text-foreground border border-transparent'
      }`}
    >
      {icon} {label}
    </button>
  );
}

// ===== Card reutilizável estilo screenshot =====
function ShopCard({
  rarity, name, description, cost, icon, owned, isActive, canBuy, animated, onPreview, onBuy, onEquip,
}: {
  rarity: Rarity;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  owned: boolean;
  isActive: boolean;
  canBuy: boolean;
  animated?: boolean;
  onPreview: () => void;
  onBuy: () => void;
  onEquip: () => void;
}) {
  return (
    <div className={`rounded-lg border-2 bg-card/40 p-3 flex flex-col gap-2 ${RARITY_BORDER[rarity]} ${isActive ? 'ring-1 ring-primary' : ''}`}>
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className={`font-display text-sm truncate ${RARITY_NAME[rarity]}`}>{name}</div>
            <span className={`text-[10px] uppercase tracking-wider ${RARITY_TEXT[rarity]} shrink-0`}>{RARITY_LABEL[rarity]}</span>
          </div>
          {animated && (
            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-display uppercase tracking-wider bg-primary/15 text-primary border border-primary/40">
              <Zap className="w-2.5 h-2.5" /> Animado
            </span>
          )}
          <p className="text-[11px] text-muted-foreground leading-snug mt-1">{description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex items-center gap-1 text-gold font-display text-sm shrink-0">
          <Coins className="w-4 h-4" /> {cost.toLocaleString('pt-BR')}
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onPreview}>
            <Eye className="w-3.5 h-3.5 mr-1" /> Preview
          </Button>
          {owned ? (
            <Button size="sm" variant={isActive ? 'default' : 'secondary'} className="h-8 px-3 text-xs" onClick={onEquip} disabled={isActive}>
              {isActive ? <><Check className="w-3.5 h-3.5 mr-1" /> Equipado</> : 'Equipar'}
            </Button>
          ) : (
            <Button size="sm" variant={canBuy ? 'default' : 'secondary'} className="h-8 px-3 text-xs" disabled={!canBuy} onClick={onBuy}>
              {canBuy ? <><ShoppingCart className="w-3.5 h-3.5 mr-1" /> Comprar</> : <><Lock className="w-3.5 h-3.5 mr-1" /> Comprar</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== Preview modal =====
function PreviewDialog({
  preview, onClose, playerName, avatar,
}: { preview: PreviewData | null; onClose: () => void; playerName: string; avatar?: string }) {
  const open = preview !== null;
  const initial = (playerName || 'A')[0];
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-primary glow-text-purple uppercase tracking-wider">
            <Eye className="w-4 h-4" /> Preview
          </DialogTitle>
        </DialogHeader>
        {preview && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {preview.name} — visualização aproximada antes da compra.
            </p>
            {/* Mock player card preview */}
            <div className="rounded-lg border border-primary/40 bg-secondary/40 p-3 flex items-center gap-3">
              {preview.kind === 'frame' ? (
                (() => {
                  const f = getFrame(preview.id);
                  const isPrismatic = f.id === 'prismatico';
                  return (
                    <div className={`w-14 h-14 rounded-full ${isPrismatic ? f.ringClass : ''}`}>
                      <div className={`relative w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center ${isPrismatic ? '' : f.ringClass}`}>
                        {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-lg text-primary">{initial}</span>}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="relative w-14 h-14 rounded-full border-2 border-primary/60 overflow-hidden bg-secondary flex items-center justify-center">
                  {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : <span className="font-display text-lg text-primary">{initial}</span>}
                  {preview.kind === 'pet' && (
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 bg-background ${preview.auraClass}`}>
                      <span className="text-xs leading-none">{preview.emoji}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm text-foreground truncate">{playerName || 'Herói'}</span>
                  <span className="text-[10px] font-display bg-secondary/80 px-1.5 py-0.5 rounded text-primary">Nv 1</span>
                </div>
                {preview.kind === 'title' ? (
                  <p className={`text-xs mt-0.5 ${preview.className}`}>« {preview.name} »</p>
                ) : (
                  <p className="text-xs italic text-muted-foreground mt-0.5">"Desperto"</p>
                )}
                <div className="h-2 mt-1.5 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full xp-bar-fill rounded-full" style={{ width: '55%' }} />
                </div>
              </div>
            </div>

            {preview.kind === 'theme' && (
              <div className="flex items-center gap-2 flex-wrap">
                {preview.preview.map((c, i) => (
                  <div key={i} className="px-2.5 py-1 rounded font-display text-[10px] uppercase tracking-wider" style={{ backgroundColor: c, color: '#fff', boxShadow: `0 0 12px ${c}88` }}>
                    {['Primário','Accent','Card'][i]}
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {preview.kind === 'title' && 'O título substitui sua frase abaixo do nome.'}
              {preview.kind === 'theme' && 'Tema animado — paleta inteira + animação sutil de fundo.'}
              {preview.kind === 'frame' && 'Moldura animada ao redor do seu avatar.'}
              {preview.kind === 'pet' && 'O pet aparece junto ao avatar e evolui visualmente a cada 10 níveis.'}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-1 text-gold font-display">
                <Coins className="w-4 h-4" /> {preview.cost.toLocaleString('pt-BR')}
              </div>
              <Button variant="secondary" onClick={onClose}>
                <Lock className="w-3.5 h-3.5 mr-1" /> Fechar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
