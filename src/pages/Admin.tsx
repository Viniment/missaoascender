import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchConquistas } from "@/lib/api";
import { xpForLevel } from "@/lib/utils";
import { toast } from "sonner";
import { Shield, Heart, Coins, Zap, RefreshCw, Skull, Sparkles, Trash2, Flame, Trophy, Gift, Megaphone, Send } from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const nav = useNavigate();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: heroi } = useQuery({ queryKey: ["heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: conquistas } = useQuery({ queryKey: ["conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });

  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState({ titulo: "", mensagem: "", tipo: "info" as "info" | "alerta" | "sucesso" });
  const [enviando, setEnviando] = useState(false);

  if (!isAdmin) {
    return (
      <Shell>
        <div className="rpg-panel p-6 text-center space-y-2">
          <Shield className="w-8 h-8 mx-auto text-destructive" />
          <p className="font-display tracking-widest text-destructive">ACESSO NEGADO</p>
          <p className="text-xs text-muted-foreground">Esta área é restrita a administradores.</p>
          <button onClick={() => nav("/")} className="btn-pixel px-4 py-2 rounded-md text-xs mt-2">Voltar</button>
        </div>
      </Shell>
    );
  }

  if (!heroi) return <Shell><p className="text-muted-foreground">Carregando...</p></Shell>;

  const patch = async (fields: any, msg: string) => {
    if (!uid) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("users").update(fields).eq("id", uid);
      if (error) throw error;
      toast.success(msg);
      await qc.invalidateQueries();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const subirNivel = async () => {
    const nivel = heroi.nivel + 1;
    await patch({ nivel, xp_atual: 0, xp_proximo_nivel: xpForLevel(nivel), vida_max: heroi.vida_max + 10, vida_atual: heroi.vida_max + 10 }, `Nível ${nivel} concedido`);
  };

  const setNivel = async (n: number) => {
    if (n < 1) return;
    await patch({ nivel: n, xp_atual: 0, xp_proximo_nivel: xpForLevel(n) }, `Nível definido: ${n}`);
  };

  const restaurarVida = () => patch({ vida_atual: heroi.vida_max }, "Vida restaurada");

  const addOuro = (v: number) => patch({ ouro: heroi.ouro + v }, `+${v} de ouro`);

  const zerarConta = async () => {
    if (!confirm("RESETAR completamente o herói (nível 1, vida cheia, ouro 0, XP 0)?")) return;
    await patch({ nivel: 1, xp_atual: 0, xp_proximo_nivel: xpForLevel(1), vida_atual: 100, vida_max: 100, ouro: 0, streak_atual: 0 }, "Herói resetado");
  };

  const curarInimigo = () => {
    if (!inimigo) return;
    setBusy(true);
    supabase.from("inimigo").update({ hp_atual: inimigo.hp_max }).eq("id", inimigo.id)
      .then(() => { toast.success("Inimigo curado"); qc.invalidateQueries(); })
      .then(() => setBusy(false));
  };

  const derrotarInimigo = () => {
    if (!inimigo) return;
    setBusy(true);
    supabase.from("inimigo").update({ hp_atual: 0, ativo: false, derrotado_em: new Date().toISOString() }).eq("id", inimigo.id)
      .then(() => { toast.success("Inimigo derrotado"); qc.invalidateQueries(); })
      .then(() => setBusy(false));
  };

  const limparLogsHoje = async () => {
    if (!uid) return;
    if (!confirm("Apagar todos os logs de hábito de hoje?")) return;
    setBusy(true);
    const hoje = new Date().toISOString().slice(0, 10);
    await supabase.from("habito_logs").delete().eq("user_id", uid).eq("data", hoje);
    toast.success("Logs de hoje limpos");
    await qc.invalidateQueries();
    setBusy(false);
  };

  const desconcluirTodas = async () => {
    if (!uid) return;
    if (!confirm("Desmarcar TODAS as tarefas de hoje?")) return;
    setBusy(true);
    const hoje = new Date().toISOString().slice(0, 10);
    await supabase.from("habito_logs").delete().eq("user_id", uid).eq("data", hoje);
    toast.success("Todas as tarefas de hoje desmarcadas");
    await qc.invalidateQueries();
    setBusy(false);
  };

  const zerarBauDia = async () => {
    if (!uid) return;
    setBusy(true);
    await supabase.from("users").update({ ultimo_bau_data: null }).eq("id", uid);
    toast.success("Baú do dia liberado novamente");
    await qc.invalidateQueries();
    setBusy(false);
  };

  const ganharStreak = (n: number) => patch({ streak_atual: (heroi.streak_atual ?? 0) + n }, `+${n} dias de streak`);
  const zerarStreak = () => patch({ streak_atual: 0 }, "Streak zerada");

  const liberarTodasConquistas = async () => {
    if (!uid) return;
    if (!confirm("Liberar TODAS as conquistas possíveis (níveis + marcos)?")) return;
    setBusy(true);
    const rows: any[] = [];
    for (let i = 2; i <= Math.max(50, heroi.nivel + 10); i++) {
      rows.push({ user_id: uid, tipo: `nivel_${i}`, titulo: `Nível ${i} alcançado`, descricao: `Você evoluiu para o nível ${i}.` });
    }
    for (const t of ["primeira_batalha", "primeiro_inimigo_derrotado", "streak_7", "streak_30", "bau_lendario", "mestre_habitos"]) {
      rows.push({ user_id: uid, tipo: t, titulo: t.replace(/_/g, " ").toUpperCase(), descricao: "Desbloqueada via admin." });
    }
    await supabase.from("conquistas").upsert(rows, { onConflict: "user_id,tipo", ignoreDuplicates: true });
    toast.success(`${rows.length} conquistas liberadas`);
    await qc.invalidateQueries();
    setBusy(false);
  };

  const zerarConquistas = async () => {
    if (!uid) return;
    if (!confirm("APAGAR todas as conquistas do herói?")) return;
    setBusy(true);
    await supabase.from("conquistas").delete().eq("user_id", uid);
    toast.success("Conquistas zeradas");
    await qc.invalidateQueries();
    setBusy(false);
  };

  const enviarAviso = async () => {
    if (!uid) return;
    if (!aviso.titulo.trim() || !aviso.mensagem.trim()) { toast.error("Preencha título e mensagem"); return; }
    setEnviando(true);
    const { error } = await supabase.from("avisos").insert({
      titulo: aviso.titulo.trim(),
      mensagem: aviso.mensagem.trim(),
      tipo: aviso.tipo,
      criado_por: uid,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Aviso enviado para todos os jogadores");
      setAviso({ titulo: "", mensagem: "", tipo: "info" });
    }
    setEnviando(false);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="rpg-panel neon-glow scanlines p-5">
          <p className="text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-1"><Shield className="w-3 h-3" /> PAINEL DO MESTRE</p>
          <h2 className="font-display text-2xl tracking-widest text-primary glow-text-purple mt-1">MODO ADMIN</h2>
          <p className="text-xs text-muted-foreground mt-2">Ferramentas de teste e ajuste manual do herói e do inimigo.</p>
        </div>

        <Section title="HERÓI" icon={<Sparkles className="w-3 h-3" />}>
          <Stat label="Nível" value={heroi.nivel} />
          <Stat label="XP" value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`} />
          <Stat label="Vida" value={`${heroi.vida_atual}/${heroi.vida_max}`} />
          <Stat label="Ouro" value={heroi.ouro} />
          <Stat label="Streak" value={`${heroi.streak_atual}d`} />
          <Stat label="Conquistas" value={conquistas?.length ?? 0} />
        </Section>

        <div className="grid grid-cols-2 gap-2">
          <AdminBtn onClick={subirNivel} disabled={busy} icon={<Zap className="w-4 h-4" />}>Subir 1 nível</AdminBtn>
          <AdminBtn onClick={() => setNivel(heroi.nivel + 5)} disabled={busy} icon={<Zap className="w-4 h-4" />}>+5 níveis</AdminBtn>
          <AdminBtn onClick={restaurarVida} disabled={busy} icon={<Heart className="w-4 h-4" />}>Restaurar vida</AdminBtn>
          <AdminBtn onClick={() => patch({ vida_max: heroi.vida_max + 50, vida_atual: heroi.vida_atual + 50 }, "+50 vida máx.")} disabled={busy} icon={<Heart className="w-4 h-4" />}>+50 vida máx</AdminBtn>
          <AdminBtn onClick={() => addOuro(100)} disabled={busy} icon={<Coins className="w-4 h-4" />}>+100 ouro</AdminBtn>
          <AdminBtn onClick={() => addOuro(1000)} disabled={busy} icon={<Coins className="w-4 h-4" />}>+1000 ouro</AdminBtn>
          <AdminBtn onClick={() => ganharStreak(1)} disabled={busy} icon={<Flame className="w-4 h-4" />}>+1 streak</AdminBtn>
          <AdminBtn onClick={() => ganharStreak(7)} disabled={busy} icon={<Flame className="w-4 h-4" />}>+7 streak</AdminBtn>
          <AdminBtn onClick={zerarStreak} disabled={busy} danger icon={<Flame className="w-4 h-4" />}>Zerar streak</AdminBtn>
          <AdminBtn onClick={() => setNivel(1)} disabled={busy} icon={<RefreshCw className="w-4 h-4" />}>Reiniciar nível</AdminBtn>
          <AdminBtn onClick={zerarConta} disabled={busy} danger icon={<Trash2 className="w-4 h-4" />}>Reset total</AdminBtn>
        </div>

        <Section title="CONQUISTAS" icon={<Trophy className="w-3 h-3" />}>
          <p className="text-xs text-muted-foreground col-span-2">Total atual: {conquistas?.length ?? 0}</p>
        </Section>
        <div className="grid grid-cols-2 gap-2">
          <AdminBtn onClick={liberarTodasConquistas} disabled={busy} icon={<Trophy className="w-4 h-4" />}>Liberar todas</AdminBtn>
          <AdminBtn onClick={zerarConquistas} disabled={busy} danger icon={<Trash2 className="w-4 h-4" />}>Zerar conquistas</AdminBtn>
        </div>

        <Section title="INIMIGO" icon={<Skull className="w-3 h-3" />}>
          {inimigo ? (
            <>
              <Stat label="Nome" value={inimigo.nome} />
              <Stat label="HP" value={`${inimigo.hp_atual}/${inimigo.hp_max}`} />
            </>
          ) : <p className="text-xs text-muted-foreground col-span-2">Nenhum inimigo ativo.</p>}
        </Section>

        {inimigo && (
          <div className="grid grid-cols-2 gap-2">
            <AdminBtn onClick={curarInimigo} disabled={busy} icon={<Heart className="w-4 h-4" />}>Curar HP total</AdminBtn>
            <AdminBtn onClick={derrotarInimigo} disabled={busy} danger icon={<Skull className="w-4 h-4" />}>Derrotar agora</AdminBtn>
          </div>
        )}

        <Section title="DIA" icon={<RefreshCw className="w-3 h-3" />}>
          <p className="text-xs text-muted-foreground col-span-2">Todos os hábitos são diários. Reset para testar de novo.</p>
        </Section>
        <div className="grid grid-cols-2 gap-2">
          <AdminBtn onClick={desconcluirTodas} disabled={busy} danger icon={<RefreshCw className="w-4 h-4" />}>Desmarcar tarefas</AdminBtn>
          <AdminBtn onClick={limparLogsHoje} disabled={busy} danger icon={<Trash2 className="w-4 h-4" />}>Limpar logs hoje</AdminBtn>
          <AdminBtn onClick={zerarBauDia} disabled={busy} icon={<Gift className="w-4 h-4" />}>Liberar baú</AdminBtn>
        </div>

        <Section title="AVISO GLOBAL" icon={<Megaphone className="w-3 h-3" />}>
          <p className="text-xs text-muted-foreground col-span-2">Envie uma mensagem para todos os jogadores. Some após ser vista.</p>
        </Section>
        <div className="rpg-panel p-4 space-y-3">
          <input
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            placeholder="Título (ex: MANUTENÇÃO)"
            value={aviso.titulo}
            onChange={e => setAviso({ ...aviso, titulo: e.target.value })}
          />
          <textarea
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm min-h-[80px]"
            placeholder="Mensagem para os jogadores..."
            value={aviso.mensagem}
            onChange={e => setAviso({ ...aviso, mensagem: e.target.value })}
          />
          <select
            className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"
            value={aviso.tipo}
            onChange={e => setAviso({ ...aviso, tipo: e.target.value as any })}
          >
            <option value="info">🔔 Info (roxo)</option>
            <option value="alerta">⚠ Alerta (vermelho)</option>
            <option value="sucesso">✓ Sucesso (verde)</option>
          </select>
          <button
            onClick={enviarAviso}
            disabled={enviando}
            className="w-full btn-pixel py-2.5 rounded-md text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {enviando ? "Enviando..." : "Enviar para todos"}
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rpg-panel p-4 space-y-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-primary flex items-center gap-1">{icon}{title}</p>
      <div className="grid grid-cols-2 gap-2">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-secondary/60 border border-border rounded-md p-2">
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-display text-sm text-foreground truncate">{value}</p>
    </div>
  );
}

function AdminBtn({ children, onClick, disabled, danger, icon }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-pixel py-2.5 px-3 rounded-md text-xs flex items-center justify-center gap-2 disabled:opacity-50 ${danger ? "border-destructive/60 text-destructive hover:bg-destructive/10" : ""}`}
    >
      {icon}{children}
    </button>
  );
}