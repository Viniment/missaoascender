import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import Avatar from "@/components/Avatar";
import { fetchHeroi, equiparItem, salvarAparencia } from "@/lib/api";
import {
  ITENS, ItemCategoria, RARIDADE_COR,
  FACE_SHAPES, SKIN_TONES, HAIR_STYLES, HAIR_COLORS, EYE_COLORS, FACE_MARKS, BEARD_STYLES,
  APARENCIA_PADRAO,
  CARD_BACKGROUNDS, APP_BACKGROUNDS,
} from "@/lib/itens";
import { toast } from "sonner";
import { X } from "lucide-react";

type TabId = "face" | "skin" | "hair" | "beard" | "eyes" | "mark" | "hat" | "armor" | "aura" | "wings" | "mask" | "pet" | "frame" | "card_bg" | "app_bg";
const TABS: { id: TabId; label: string; group: "aparencia" | "equip" }[] = [
  { id: "face",  label: "Rosto",    group: "aparencia" },
  { id: "skin",  label: "Pele",     group: "aparencia" },
  { id: "hair",  label: "Cabelo",   group: "aparencia" },
  { id: "beard", label: "Barba",    group: "aparencia" },
  { id: "eyes",  label: "Olhos",    group: "aparencia" },
  { id: "mark",  label: "Marca",    group: "aparencia" },
  { id: "hat",   label: "Chapéu",   group: "equip" },
  { id: "armor", label: "Armadura", group: "equip" },
  { id: "aura",  label: "Aura",     group: "equip" },
  { id: "wings",  label: "Asas",   group: "equip" },
  { id: "mask",   label: "Máscara", group: "equip" },
  { id: "pet",    label: "Pet",    group: "equip" },
  { id: "frame",  label: "Moldura", group: "equip" },
  { id: "card_bg", label: "Fundo Card", group: "equip" },
  { id: "app_bg",  label: "Fundo App",  group: "equip" },
];

export default function Personalizar() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user!.id;
  const [tab, setTab] = useState<TabId>("face");
  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid) });

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  const eq: any = heroi.avatar_equipado ?? {};

  const equipar = async (id: string | null) => {
    await equiparItem(uid, heroi, id, tab as ItemCategoria);
    await qc.invalidateQueries({ queryKey: ["heroi", uid] });
    toast.success(id ? "Item equipado" : "Slot esvaziado");
  };

  const patchAparencia = async (patch: Record<string, any>) => {
    await salvarAparencia(uid, heroi, patch);
    await qc.invalidateQueries({ queryKey: ["heroi", uid] });
  };

  const isEquipTab = ["hat","armor","aura","wings","mask","pet","frame","card_bg","app_bg"].includes(tab);
  const owned = isEquipTab
    ? ITENS.filter(i => i.categoria === tab && heroi.itens_desbloqueados.includes(i.id))
    : [];
  const equipKey = tab === "card_bg" ? "cardBg" : tab === "app_bg" ? "appBg" : tab;
  const equippedId = isEquipTab ? (eq[equipKey] ?? null) : null;

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

        {/* Grupo APARÊNCIA */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Aparência</p>
          <div className="grid grid-cols-3 gap-2">
            {TABS.filter(t => t.group === "aparencia").map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rpg-panel p-2 text-[10px] font-display uppercase tracking-widest transition-all ${tab === t.id ? "border-primary neon-glow text-primary" : "opacity-60 hover:opacity-100"}`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* Grupo EQUIPAMENTO */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">Equipamento</p>
          <div className="grid grid-cols-3 gap-2">
            {TABS.filter(t => t.group === "equip").map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rpg-panel p-3 text-[11px] font-display uppercase tracking-widest transition-all ${tab === t.id ? "border-primary neon-glow text-primary" : "opacity-60 hover:opacity-100"}`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* ------ RENDER POR ABA ------ */}

        {tab === "face" && (
          <PickerGrid
            options={FACE_SHAPES.map(f => ({ id: f.id, label: f.nome }))}
            activeId={eq.face ?? APARENCIA_PADRAO.face}
            onPick={(id) => patchAparencia({ face: id })}
            preview={(id) => <Avatar equipado={{ ...eq, face: id as any, hat: null, armor: null, aura: null }} size="sm" glow={false} />}
          />
        )}

        {tab === "skin" && (
          <PickerGrid
            options={SKIN_TONES.map(s => ({ id: s.id, label: s.nome, swatch: s.base }))}
            activeId={eq.skin ?? APARENCIA_PADRAO.skin}
            onPick={(id) => patchAparencia({ skin: id })}
          />
        )}

        {tab === "hair" && (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Estilo</p>
              <PickerGrid
                options={HAIR_STYLES.map(h => ({ id: h.id, label: h.nome }))}
                activeId={eq.hair ?? APARENCIA_PADRAO.hair}
                onPick={(id) => patchAparencia({ hair: id })}
                preview={(id) => <Avatar equipado={{ ...eq, hair: id as any, hat: null, armor: null, aura: null }} size="sm" glow={false} />}
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Cor</p>
              <PickerGrid
                options={HAIR_COLORS.map(h => ({ id: h.base, label: h.nome, swatch: h.base }))}
                activeId={eq.hairColor ?? APARENCIA_PADRAO.hairColor}
                onPick={(id) => patchAparencia({ hairColor: id })}
              />
            </div>
          </div>
        )}

        {tab === "eyes" && (
          <PickerGrid
            options={EYE_COLORS.map(e => ({ id: e.cor, label: e.nome, swatch: e.cor }))}
            activeId={eq.eyes ?? APARENCIA_PADRAO.eyes}
            onPick={(id) => patchAparencia({ eyes: id })}
          />
        )}

        {tab === "mark" && (
          <PickerGrid
            options={FACE_MARKS.map(m => ({ id: m.id, label: m.nome }))}
            activeId={eq.mark ?? APARENCIA_PADRAO.mark}
            onPick={(id) => patchAparencia({ mark: id })}
            preview={(id) => <Avatar equipado={{ ...eq, mark: id as any, hat: null, armor: null, aura: null }} size="sm" glow={false} />}
          />
        )}

        {tab === "beard" && (
          <PickerGrid
            options={BEARD_STYLES.map(b => ({ id: b.id, label: b.nome }))}
            activeId={eq.beard ?? APARENCIA_PADRAO.beard}
            onPick={(id) => patchAparencia({ beard: id })}
            preview={(id) => <Avatar equipado={{ ...eq, beard: id as any, hat: null, armor: null, aura: null }} size="sm" glow={false} />}
          />
        )}

        {isEquipTab && owned.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum item desta categoria ainda. Visite a <b>Loja</b> ou conquiste-os em batalha.
          </p>
        )}

        {isEquipTab && (
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
                <div style={{ filter: `drop-shadow(0 0 6px ${borda})` }}>
                  {item.categoria === "card_bg" || item.categoria === "app_bg" ? (
                    <div className={`w-14 h-14 rounded-md overflow-hidden relative border border-white/10 ${
                      (item.categoria === "card_bg" ? CARD_BACKGROUNDS : APP_BACKGROUNDS)[item.id]?.className ?? ""
                    }`} />
                  ) : (
                    <Avatar equipado={{ [item.categoria]: item.id } as any} size="sm" glow={false} />
                  )}
                </div>
                <span className="text-[10px] uppercase tracking-widest text-center truncate w-full">{item.nome}</span>
                {active && <span className="text-[9px] text-primary uppercase tracking-widest">equipado</span>}
              </button>
            );
          })}
        </div>
        )}
      </div>
    </Shell>
  );
}

/* ---------- Picker reutilizável ---------- */
function PickerGrid({
  options, activeId, onPick, preview,
}: {
  options: { id: string; label: string; swatch?: string }[];
  activeId: string;
  onPick: (id: string) => void;
  preview?: (id: string) => JSX.Element;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map(o => {
        const active = activeId === o.id;
        return (
          <button
            key={o.id}
            onClick={() => onPick(o.id)}
            className={`rpg-panel p-3 flex flex-col items-center gap-2 transition-all ${active ? "border-primary neon-glow" : "opacity-80 hover:opacity-100"}`}
          >
            {preview ? (
              preview(o.id)
            ) : o.swatch ? (
              <span
                className="w-10 h-10 rounded-full border-2 border-black/40"
                style={{ background: o.swatch, boxShadow: active ? "0 0 12px hsl(var(--primary))" : undefined }}
              />
            ) : null}
            <span className="text-[10px] uppercase tracking-widest text-center truncate w-full">{o.label}</span>
            {active && <span className="text-[9px] text-primary uppercase tracking-widest">ativo</span>}
          </button>
        );
      })}
    </div>
  );
}