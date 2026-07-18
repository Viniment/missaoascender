import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchHeroi, fetchConquistas, comprarItem, sincronizarItensDesbloqueados } from "@/lib/api";
import { ITENS, ItemCategoria, RARIDADE_COR, Item } from "@/lib/itens";
import Avatar from "@/components/Avatar";
import { Coins, Lock, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";

const TABS: { id: ItemCategoria; label: string; icon: string }[] = [
  { id: "hat",   label: "Chapéus",  icon: "👑" },
  { id: "armor", label: "Armaduras", icon: "🛡️" },
  { id: "aura",  label: "Auras",     icon: "✨" },
];

export default function Loja() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user!.id;
  const [tab, setTab] = useState<ItemCategoria>("hat");

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
      await qc.invalidateQueries({ queryKey: ["heroi", uid] });
    } catch (e: any) { toast.error(e.message); }
  };

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  return (
    <Shell>
      <div className="space-y-5">
        <div className="flex items-center justify-between rpg-panel neon-glow p-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">LOJA DO HERÓI</p>
            <h2 className="font-display text-xl tracking-widest glow-text-purple">ARSENAL & VESTUÁRIO</h2>
          </div>
          <div className="flex items-center gap-1 text-gold font-display bg-gold/10 border border-gold/40 rounded-md px-3 py-1.5">
            <Coins className="w-4 h-4" /> {heroi.ouro}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rpg-panel p-3 text-center transition-all ${tab === t.id ? "border-primary neon-glow" : "opacity-60 hover:opacity-100"}`}
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="text-[10px] uppercase tracking-widest font-display mt-1">{t.label}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {itensCat.map(item => {
            const owned = heroi.itens_desbloqueados.includes(item.id);
            const bloqueadoPorConquista = item.preco === null && !owned;
            const semOuro = item.preco !== null && !owned && heroi.ouro < item.preco;
            const borda = RARIDADE_COR[item.raridade];
            return (
              <div
                key={item.id}
                className="rpg-panel p-3 space-y-2 relative overflow-hidden"
                style={{ borderColor: borda, boxShadow: `0 0 10px ${borda}33 inset` }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-widest font-display" style={{ color: borda }}>
                    {item.raridade}
                  </span>
                  {owned && <Check className="w-3.5 h-3.5 text-primary" />}
                </div>
                <div className="flex justify-center py-1" style={{ filter: `drop-shadow(0 0 8px ${borda}88)` }}>
                  <Avatar
                    equipado={{ [item.categoria]: item.id } as any}
                    size="md"
                    glow={false}
                  />
                </div>
                <p className="text-sm font-display tracking-wider text-center truncate">{item.nome}</p>
                <p className="text-[10px] text-muted-foreground text-center min-h-[28px]">{item.descricao}</p>
                {owned ? (
                  <div className="text-[10px] text-center text-primary uppercase tracking-widest py-1.5 border border-primary/40 rounded-md">
                    Adquirido
                  </div>
                ) : bloqueadoPorConquista ? (
                  <div className="text-[10px] text-center text-muted-foreground uppercase tracking-widest py-1.5 border border-border rounded-md flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Conquista: {item.unlock}
                  </div>
                ) : (
                  <button
                    onClick={() => comprar(item)}
                    disabled={semOuro}
                    className="w-full btn-pixel py-1.5 rounded-md text-[11px] flex items-center justify-center gap-1 disabled:opacity-40"
                  >
                    <Coins className="w-3 h-3" /> {item.preco}
                    {semOuro && <span className="text-destructive ml-1">(sem ouro)</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" /> Equipe seus itens na aba <b>Personalizar</b>.
        </p>
      </div>
    </Shell>
  );
}