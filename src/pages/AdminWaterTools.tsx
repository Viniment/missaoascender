import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Droplets, Trash2, Clock3, RotateCcw, Save, Shield } from "lucide-react";

type Props = { uid: string; nome: string; busy: boolean; setBusy: (v: boolean) => void };

export default function AdminWaterTools({ uid, nome, busy, setBusy }: Props) {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-water-jejum-config", uid],
    queryFn: async () => {
      const { data, error } = await supabase.from("users").select("agua_meta_ml, jejum_reset_at, agua_reset_at").eq("id", uid).single();
      if (error) throw error;
      return data;
    },
    enabled: !!uid,
  });
  const [meta, setMeta] = useState("");

  useEffect(() => {
    if (data?.agua_meta_ml != null) setMeta(String(data.agua_meta_ml));
  }, [data?.agua_meta_ml]);

  const saveMeta = async () => {
    const value = Number(meta);
    if (!Number.isInteger(value) || value <= 0 || value > 1000000) {
      toast.error("Informe uma meta de água inteira entre 1 e 1.000.000 ml.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("users").update({ agua_meta_ml: value }).eq("id", uid);
    if (error) toast.error(error.message);
    else toast.success(`Meta de água de ${value} ml salva para ${nome}`);
    await qc.invalidateQueries({ queryKey: ["admin-water-jejum-config", uid] });
    setBusy(false);
  };

  const resetJejum = async () => {
    if (!confirm(`Apagar TODO o histórico de jejum de ${nome}? Isso também apagará o maior jejum e o progresso local de jejum no próximo acesso.`)) return;
    setBusy(true);
    const { error } = await supabase.from("users").update({ jejum_reset_at: new Date().toISOString() }).eq("id", uid);
    if (error) toast.error(error.message);
    else toast.success("Histórico de jejum marcado para limpeza total");
    await qc.invalidateQueries({ queryKey: ["admin-water-jejum-config", uid] });
    setBusy(false);
  };

  const resetAgua = async () => {
    if (!confirm(`Zerar os registros locais de água de ${nome}?`)) return;
    setBusy(true);
    const { error } = await supabase.from("users").update({ agua_reset_at: new Date().toISOString() }).eq("id", uid);
    if (error) toast.error(error.message);
    else toast.success("Rastreador de água marcado para limpeza");
    await qc.invalidateQueries({ queryKey: ["admin-water-jejum-config", uid] });
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <div className="rpg-panel p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1"><Droplets className="w-3 h-3" /> ÁGUA — CONFIGURAÇÃO INDIVIDUAL</p>
        <p className="text-xs text-muted-foreground">A meta é definida manualmente para este usuário. Não existem metas pré-definidas.</p>
        <div className="flex gap-2">
          <input type="number" min="1" max="1000000" step="1" value={meta} onChange={e => setMeta(e.target.value)} className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm" placeholder="Ex.: 5000" />
          <button onClick={saveMeta} disabled={busy} className="btn-pixel px-4 rounded-md text-xs flex items-center gap-2"><Save className="w-4 h-4" /> Salvar ml</button>
        </div>
        <p className="text-[9px] text-muted-foreground">Meta atual: <strong className="text-cyan-300">{data?.agua_meta_ml ?? "—"} ml</strong></p>
      </div>

      <div className="rpg-panel p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">LIMPEZA DO RASTREADOR</p>
        <button onClick={resetAgua} disabled={busy} className="w-full border border-destructive/40 text-destructive hover:bg-destructive/10 py-2.5 rounded-md text-xs flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Zerar histórico de água</button>
      </div>

      <div className="rpg-panel p-4 space-y-2 border-amber-400/20">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-300 flex items-center gap-1"><Clock3 className="w-3 h-3" /> JEJUM</p>
        <p className="text-xs text-muted-foreground">Remove o histórico local, o maior tempo e o estado ativo de jejum no próximo acesso do usuário.</p>
        <button onClick={resetJejum} disabled={busy} className="w-full border border-destructive/50 text-destructive hover:bg-destructive/10 py-2.5 rounded-md text-xs flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" /> Apagar histórico de jejum</button>
      </div>

      <div className="rpg-panel p-4 space-y-2 border-destructive/30">
        <p className="text-[10px] uppercase tracking-[0.25em] text-destructive flex items-center gap-1"><Shield className="w-3 h-3" /> RESET TOTAL</p>
        <p className="text-xs text-muted-foreground">Este botão é acionado pela aba Herói. Ele também deve atualizar os marcadores de limpeza de jejum e água.</p>
      </div>
    </div>
  );
}
