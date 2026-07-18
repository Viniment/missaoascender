import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { fetchHeroi, equiparItem } from "@/lib/api";
import { ITENS, ItemCategoria, RARIDADE_COR } from "@/lib/itens";
import { toast } from "sonner";
import { X } from "lucide-react";

const TABS: { id: ItemCategoria; label: string }[] = [
  { id: "hat", label: "Chapéu" },
  { id: "armor", label: "Armadura" },
  { id: "aura", label: "Aura" },
];

export default function Personalizar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user!.id;
  const [tab, setTab] = useState<ItemCategoria>("hat");
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid) });

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  const equipar = async (id: string | null) => {
    await equiparItem(uid, heroi, id, tab);
    await qc.invalidateQueries({ queryKey: ["heroi", uid] });
    toast.success(id ? "Item equipado" : "Slot esvaziado");
  };

  const owned = ITENS.filter(i => i.categoria === tab && heroi.itens_desbloqueados.includes(i.id));
  const equippedId = (heroi.avatar_equipado as any)?.[tab] ?? null;

  return (
    <Shell>
      <div className="space-y-5">
        <div className="rpg-panel neon-glow p-5 flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">SEU HERÓI</p>
          <Avatar equipado={heroi.avatar_equipado} size="xl" />
          <div className="text-center">
            <h2 className="font-display text-xl tracking-widest glow-text-purple">{heroi.nome}</h2>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Nível {heroi.nivel}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rpg-panel p-3 text-[11px] font-display uppercase tracking-widest transition-all ${tab === t.id ? "border-primary neon-glow text-primary" : "opacity-60 hover:opacity-100"}`}
            >{t.label}</button>
          ))}
        </div>

        {owned.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum item desta categoria ainda. Visite a <b>Loja</b> ou conquiste-os em batalha.
          </p>
        )}

        <div className="grid grid-cols-3 gap-3">
          {/* botão para desequipar */}
          {equippedId && (
            <button
              onClick={() => equipar(null)}
              className="rpg-panel p-3 flex flex-col items-center gap-1 border-destructive/40 hover:border-destructive"
            >
              <X className="w-5 h-5 text-destructive" />
              <span className="text-[10px] uppercase tracking-widest">Retirar</span>
            </button>
          )}
          {owned.map(item => {
            const active = equippedId === item.id;
            const borda = RARIDADE_COR[item.raridade];
            return (
              <button
                key={item.id}
                onClick={() => equipar(item.id)}
                className={`rpg-panel p-3 flex flex-col items-center gap-1 transition-all ${active ? "border-primary neon-glow" : ""}`}
                style={active ? undefined : { borderColor: borda }}
              >
                <div className="text-3xl" style={{ filter: `drop-shadow(0 0 6px ${borda})` }}>{item.emoji}</div>
                <span className="text-[10px] uppercase tracking-widest text-center truncate w-full">{item.nome}</span>
                {active && <span className="text-[9px] text-primary uppercase tracking-widest">equipado</span>}
              </button>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}