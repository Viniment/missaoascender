import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchTransacoes } from "@/lib/api";
import { toast } from "sonner";
import { useLowPower } from "@/hooks/useLowPower";
import { Zap, ZapOff } from "lucide-react";

export default function PerfilPage() {
  const { user } = useAuth();
  const uid = user?.id;
  const { lowPower, toggle } = useLowPower();
  const { data: h, refetch } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: tx } = useQuery({ queryKey: ["tx", uid], queryFn: () => fetchTransacoes(uid!), enabled: !!uid });
  const [nome, setNome] = useState("");
  const [resumo, setResumo] = useState<string>("");
  const [loadingResumo, setLoadingResumo] = useState(false);

  useEffect(() => { if (h) setNome(h.nome); }, [h?.id]);

  const salvar = async () => {
    if (!uid) return;
    const { error } = await supabase.from("users").update({ nome }).eq("id", uid);
    if (error) return toast.error(error.message);
    toast.success("Perfil atualizado.");
    refetch();
  };

  const gerarResumo = async () => {
    setLoadingResumo(true);
    try {
      const { data, error } = await supabase.functions.invoke("resumo-semanal", { body: {} });
      if (error) throw error;
      setResumo(data?.resumo ?? "");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoadingResumo(false); }
  };

  if (!h) return <Shell><p className="text-muted-foreground">...</p></Shell>;

  return (
    <Shell>
      <div className="space-y-6">
        <div className="rpg-panel neon-glow p-5 space-y-4">
          <h1 className="font-display text-xl tracking-wider text-primary glow-text-purple">PERFIL</h1>
          <div>
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Nome do herói</label>
            <input className="mt-1 w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              value={nome} onChange={e => setNome(e.target.value)} />
          </div>
          <button onClick={salvar} className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-display tracking-wide">
            Salvar
          </button>
        </div>

        <div className="rpg-panel p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-sm tracking-widest text-primary flex items-center gap-2">
                {lowPower ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                DISPOSITIVO FRACO
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Desativa fundos animados, partículas, brilhos e transições pesadas. Mantém apenas os efeitos essenciais (baú, hábitos e conquistas).
              </p>
            </div>
            <button
              onClick={toggle}
              role="switch"
              aria-checked={lowPower}
              className={`relative shrink-0 w-14 h-8 rounded-full border transition-colors ${lowPower ? "bg-primary border-primary" : "bg-secondary border-border"}`}
            >
              <span
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-background transition-transform ${lowPower ? "translate-x-6" : ""}`}
              />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Stat label="Nível" value={h.nivel} />
          <Stat label="Ouro" value={h.ouro} />
          <Stat label="Streak" value={`${h.streak_atual}d`} />
        </div>

        <div className="rpg-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm tracking-widest text-primary">RESUMO SEMANAL</h2>
            <button onClick={gerarResumo} disabled={loadingResumo}
              className="text-xs text-primary hover:underline disabled:opacity-50">
              {loadingResumo ? "..." : "gerar"}
            </button>
          </div>
          {resumo && <p className="text-sm text-foreground whitespace-pre-wrap italic border-l-2 border-primary/40 pl-3">{resumo}</p>}
        </div>

        <div className="rpg-panel p-5 space-y-2">
          <h2 className="font-display text-sm tracking-widest text-primary">TRANSAÇÕES DE OURO</h2>
          {(tx ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhuma ainda.</p>}
          <ul className="divide-y divide-border">
            {(tx ?? []).map((t: any) => (
              <li key={t.id} className="py-2 flex items-center justify-between text-xs">
                <span>{t.descricao ?? t.origem}</span>
                <span className={t.valor > 0 ? "text-gold" : "text-destructive"}>
                  {t.valor > 0 ? "+" : ""}{t.valor} 🪙
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Shell>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rpg-panel p-3 text-center">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-lg text-primary">{value}</p>
    </div>
  );
}