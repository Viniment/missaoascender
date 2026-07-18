import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchOnboarding, fetchInimigoAtivo } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Swords, RefreshCcw } from "lucide-react";

type Sugestao = { nome: string; emoji: string; hp_max: number; mentiras: string[]; gatilho: string };

export default function CriarInimigo() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sug, setSug] = useState<Sugestao | null>(null);
  const [nome, setNome] = useState("");
  const [emoji, setEmoji] = useState("😈");
  const [mentiras, setMentiras] = useState<string[]>([]);
  const [gatilho, setGatilho] = useState("");

  const gerar = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ob = await fetchOnboarding(user.id);
      if (!ob) { nav("/onboarding"); return; }
      const { data, error } = await supabase.functions.invoke("sugerir-inimigo", { body: { onboarding: ob } });
      if (error) throw error;
      const s = data as Sugestao;
      setSug(s); setNome(s.nome); setEmoji(s.emoji); setMentiras(s.mentiras); setGatilho(s.gatilho);
    } catch (e: any) {
      toast.error("Falha ao gerar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchInimigoAtivo(user.id).then(i => { if (i) nav("/"); else gerar(); });
  }, [user]);

  const salvar = async () => {
    if (!user || !sug) return;
    setSaving(true);
    try {
      const hp = sug.hp_max || 100;
      const { error } = await supabase.from("inimigo").insert({
        user_id: user.id,
        nome: nome.trim() || "O Sabotador",
        avatar_config: { emoji },
        hp_max: hp,
        hp_atual: hp,
        mentiras,
        gatilho,
        ativo: true,
      });
      if (error) throw error;
      toast.success("Inimigo forjado. Que a batalha comece.");
      nav("/");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm">Forjando seu sabotador...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4 bg-background">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Materialização</p>
          <h1 className="font-display text-2xl tracking-wider text-primary glow-text-purple">Seu inimigo interno</h1>
          <p className="text-xs text-muted-foreground">Ajuste os detalhes. Este é o rosto do que te sabota.</p>
        </div>

        <div className="rpg-panel neon-glow p-6 space-y-4">
          <div className="flex items-center gap-4">
            <input
              className="w-16 text-4xl text-center bg-secondary border border-border rounded-md py-2"
              value={emoji} maxLength={2}
              onChange={e => setEmoji(e.target.value)}
            />
            <input
              className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm font-display tracking-wide"
              placeholder="Nome curto (ex: O Sabotador)"
              maxLength={22}
              value={nome} onChange={e => setNome(e.target.value.slice(0, 22))}
            />
          </div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground -mt-2">Máx. 22 caracteres · 1 a 3 palavras</p>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Mentiras que ele te conta</label>
            <div className="mt-2 space-y-2">
              {mentiras.map((m, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-muted-foreground text-xs pt-2">#{idx + 1}</span>
                  <input
                    className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
                    value={m}
                    onChange={e => setMentiras(mentiras.map((x, i) => i === idx ? e.target.value : x))}
                  />
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive px-2"
                    onClick={() => setMentiras(mentiras.filter((_, i) => i !== idx))}
                  >✕</button>
                </div>
              ))}
              <button
                className="text-xs text-primary hover:underline"
                onClick={() => setMentiras([...mentiras, ""])}
              >+ adicionar mentira</button>
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Gatilho principal</label>
            <input
              className="w-full mt-2 bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              value={gatilho} onChange={e => setGatilho(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={gerar}
              className="flex-1 py-2 rounded-md border border-border text-sm flex items-center justify-center gap-2"
            ><RefreshCcw className="w-4 h-4" /> Gerar outro</button>
            <button
              onClick={salvar} disabled={saving}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground font-display tracking-wider flex items-center justify-center gap-2 disabled:opacity-50"
            ><Swords className="w-4 h-4" /> {saving ? "..." : "Aceitar batalha"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}