import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { fetchOnboarding } from "@/lib/api";
import { toast } from "sonner";

const PERGUNTAS = [
  { key: "sonhos", label: "1) Quais são seus maiores sonhos?", placeholder: "Ex: viver de música, ter um corpo forte, criar meu negócio..." },
  { key: "sabotagem", label: "2) O que costuma te impedir de realizá-los?", placeholder: "Ex: preguiça, procrastinação, medo de fracassar..." },
  { key: "vitorias", label: "3) Que hábitos ou vitórias diárias você quer construir?", placeholder: "Ex: acordar cedo, treinar, estudar 1h, meditar..." },
  { key: "gatilhos", label: "4) O que costuma te tirar do foco?", placeholder: "Ex: celular à noite, TikTok, ansiedade, tédio..." },
];

export default function Onboarding() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [answers, setAnswers] = useState<Record<string, string>>({ sonhos: "", sabotagem: "", vitorias: "", gatilhos: "" });
  const [i, setI] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchOnboarding(user.id).then(d => {
      if (d) nav("/criar-inimigo");
    });
  }, [user, nav]);

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("onboarding_respostas").insert({
        user_id: user.id, ...answers,
      });
      if (error) throw error;
      nav("/criar-inimigo");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const q = PERGUNTAS[i];
  const val = answers[q.key];
  const isLast = i === PERGUNTAS.length - 1;

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-background">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <p className="text-xs tracking-widest text-muted-foreground uppercase">Ritual de entrada</p>
          <h1 className="font-display text-2xl tracking-wider text-primary glow-text-purple">Conhecendo o herói</h1>
          <p className="text-xs text-muted-foreground">{i + 1} de {PERGUNTAS.length}</p>
        </div>
        <div className="rpg-panel space-y-4 neon-glow p-6">
          <label className="text-sm font-display tracking-wide text-foreground">{q.label}</label>
          <textarea
            className="w-full min-h-[140px] bg-secondary border border-border rounded-md px-3 py-2 text-sm resize-none"
            placeholder={q.placeholder}
            value={val}
            onChange={e => setAnswers({ ...answers, [q.key]: e.target.value })}
          />
          <div className="flex gap-2">
            {i > 0 && (
              <button className="flex-1 py-2 rounded-md border border-border text-sm" onClick={() => setI(i - 1)}>Voltar</button>
            )}
            {!isLast ? (
              <button
                disabled={!val.trim()}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground font-display tracking-wider disabled:opacity-40"
                onClick={() => setI(i + 1)}
              >Próxima</button>
            ) : (
              <button
                disabled={!val.trim() || saving}
                className="flex-1 py-2 rounded-md bg-primary text-primary-foreground font-display tracking-wider disabled:opacity-40"
                onClick={submit}
              >{saving ? "..." : "Forjar inimigo"}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}