import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchHeroi, fetchConquistas, comprarItem, sincronizarItensDesbloqueados } from "@/lib/api";
import { ITENS, ItemCategoria, RARIDADE_COR, RARIDADE_LABEL, RARIDADE_BG, Item, ItemRaridade } from "@/lib/itens";
import { CARD_BACKGROUNDS, APP_BACKGROUNDS } from "@/lib/itens";
import Avatar from "@/components/Avatar";
import { Coins, Lock, Sparkles, Check, X, Star } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { fireReward } from "@/components/fx/RewardBurst";
import AnimatedCounter from "@/components/fx/AnimatedCounter";

const TABS: { id: ItemCategoria; label: string; icon: string }[] = [
  { id: "hat",    label: "Chapéus",   icon: "👑" },
  { id: "armor",  label: "Armaduras", icon: "🛡️" },
  { id: "wings",  label: "Asas",      icon: "🪽" },
  { id: "mask",   label: "Máscaras",  icon: "🎭" },
  { id: "aura",   label: "Auras",     icon: "✨" },
  { id: "pet",    label: "Pets",      icon: "🐺" },
  { id: "frame",  label: "Molduras",  icon: "🖼️" },
  { id: "card_bg", label: "Fundo Card", icon: "🎴" },
  { id: "app_bg",  label: "Fundo App",  icon: "🌌" },
];

const RARITY_CLASS: Record<ItemRaridade, string> = {
  comum: "rarity-common",
  raro: "rarity-rare",
  epico: "rarity-epic",
  lendario: "rarity-legendary",
  mitico: "rarity-mythic",
};

export default function Loja() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user!.id;
  const [tab, setTab] = useState<ItemCategoria>("hat");
  const [preview, setPreview] = useState<Item | null>(null);

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid) });
  const { data: conquistas } = useQuery({ queryKey: ["conquistas", uid], queryFn: () => fetchConquistas(uid) });

  useEffect(() => {
    if (heroi && conquistas) {
      sincronizarItensDesbloqueados(uid, heroi, conquistas.map(c => c.tipo))
        .then(() => qc.invalidateQueries({ queryKey: ["heroi", uid] }));
    }
  }, [heroi?.id, conquistas?.length]);

  const itensCat = useMemo(() => ITENS.filter(i => i.categoria === tab), [tab]);

  const comprar = async (item: Item) => {
    if (!heroi) return;
    try {
      await comprarItem(uid, heroi, item.id);
      toast.success(`${item.nome} adquirido!`);
      fireReward(`+ ${item.nome.toUpperCase()}`, RARIDADE_COR[item.raridade]);
      setPreview(null);
      await qc.invalidateQueries({ queryKey: ["heroi", uid] });
    } catch (e: any) { toast.error(e.message); }
  };

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex items-center justify-between game-panel p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">LOJA DO HERÓI</p>
            <h2 className="font-display text-xl tracking-widest glow-text-purple">ARSENAL & VESTUÁRIO</h2>
          </div>
          <div className="flex items-center gap-2 text-gold font-display bg-gold/10 border border-gold/40 rounded-md px-3 py-1.5 text-base">
            <Coins className="w-5 h-5" /> <AnimatedCounter value={heroi.ouro} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`game-panel p-2 text-center transition-all ${tab === t.id ? "border-primary neon-glow scale-[1.03]" : "opacity-55 hover:opacity-100"}`}
            >
              <div className="text-xl">{t.icon}</div>
              <div className="text-[9px] uppercase tracking-widest font-display mt-0.5">{t.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {itensCat.map(item => {
            const owned = heroi.itens_desbloqueados.includes(item.id);
            const bloqueadoPorConquista = item.preco === null && !owned;
            const semOuro = item.preco !== null && !owned && heroi.ouro < item.preco;
            const borda = RARIDADE_COR[item.raridade];
            const rcls = RARITY_CLASS[item.raridade];
            const isTop = item.raridade === "lendario" || item.raridade === "mitico";
            return (
              <button
                key={item.id}
                onClick={() => setPreview(item)}
                className={`${rcls} rarity-border ${isTop ? "holo-border" : ""} p-3 rounded-lg text-left relative overflow-hidden transition-transform hover:-translate-y-0.5 rarity-glow`}
                style={{ background: RARIDADE_BG[item.raridade] }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-display rarity-text flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" /> {RARIDADE_LABEL[item.raridade]}
                  </span>
                  {owned && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="flex justify-center py-2" style={{ filter: `drop-shadow(0 0 10px ${borda}aa)` }}>
                  <Avatar
                    equipado={{ [item.categoria]: item.id } as any}
                    size="md"
                    glow={false}
                  />
                </div>
                <p className="text-sm font-display tracking-wider text-center truncate">{item.nome}</p>
                <div className="mt-2 flex items-center justify-center">
                  {owned ? (
                    <span className="text-[9px] text-primary uppercase tracking-widest px-2 py-1 border border-primary/40 rounded">Adquirido</span>
                  ) : bloqueadoPorConquista ? (
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Lock className="w-3 h-3" /> Conquista</span>
                  ) : (
                    <span className={`text-xs font-display flex items-center gap-1 ${semOuro ? "text-destructive/70" : "text-gold"}`}>
                      <Coins className="w-3 h-3" /> {item.preco}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Equipe seus itens na aba <b>Personalizar</b>.
        </p>
      </div>

      {/* ---------- PREVIEW MODAL ---------- */}
      {preview && (() => {
        const item = preview;
        const owned = heroi.itens_desbloqueados.includes(item.id);
        const bloqueadoPorConquista = item.preco === null && !owned;
        const semOuro = item.preco !== null && !owned && heroi.ouro < item.preco;
        const borda = RARIDADE_COR[item.raridade];
        const rcls = RARITY_CLASS[item.raridade];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreview(null)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className={`${rcls} rarity-border holo-border relative w-full max-w-sm p-6 rounded-xl rarity-glow`}
              style={{ background: RARIDADE_BG[item.raridade] }}
            >
              <button onClick={() => setPreview(null)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              <div className="text-center space-y-3">
                <span className="text-[10px] uppercase tracking-[0.3em] font-display rarity-text inline-flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {RARIDADE_LABEL[item.raridade]}
                </span>
                <div className="flex justify-center py-3" style={{ filter: `drop-shadow(0 0 16px ${borda})` }}>
                  <Avatar equipado={{ ...(heroi.avatar_equipado ?? {}), [item.categoria]: item.id } as any} size="xl" glow={false} />
                </div>
                <h3 className="font-display text-xl tracking-widest text-foreground">{item.nome}</h3>
                <p className="text-xs text-muted-foreground px-4">{item.descricao}</p>
                <div className="pt-2">
                  {owned ? (
                    <div className="text-xs text-primary uppercase tracking-widest py-2 border border-primary/40 rounded">Já Adquirido</div>
                  ) : bloqueadoPorConquista ? (
                    <div className="text-xs text-muted-foreground uppercase tracking-widest py-2 border border-border rounded flex items-center justify-center gap-2"><Lock className="w-4 h-4" /> Conquista: {item.unlock}</div>
                  ) : (
                    <button onClick={() => comprar(item)} disabled={semOuro} className="w-full btn-pixel py-3 rounded-md flex items-center justify-center gap-2 disabled:opacity-40">
                      <Coins className="w-4 h-4" /> COMPRAR — {item.preco}
                      {semOuro && <span className="text-destructive text-xs">(sem ouro)</span>}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </Shell>
  );
}