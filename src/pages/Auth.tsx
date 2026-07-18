import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (user) nav("/"); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome: nome || "Herói" },
          },
        });
        if (error) throw error;
        toast.success("Conta criada. Entre no jogo.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4">
      <div className="w-full max-w-md rpg-panel space-y-6 p-8 neon-glow">
        <div className="text-center space-y-2">
          <h1 className="font-display text-3xl tracking-widest text-primary glow-text-purple">NEW LIFEUP</h1>
          <p className="text-sm text-muted-foreground">Derrote o inimigo que sabota seus sonhos.</p>
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <input
              className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
              placeholder="Seu nome de herói"
              value={nome} onChange={e => setNome(e.target.value)}
            />
          )}
          <input
            type="email" required
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Email"
            value={email} onChange={e => setEmail(e.target.value)}
          />
          <input
            type="password" required minLength={6}
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Senha (mín 6)"
            value={password} onChange={e => setPassword(e.target.value)}
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-primary text-primary-foreground font-display tracking-wider py-2.5 rounded-md hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "..." : mode === "signup" ? "CRIAR CONTA" : "ENTRAR"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="w-full text-xs text-muted-foreground hover:text-primary"
        >
          {mode === "signup" ? "Já tem conta? Entrar" : "Novo aqui? Criar conta"}
        </button>
      </div>
    </div>
  );
}