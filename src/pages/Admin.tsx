import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import Shell from "@/components/Shell";
import { supabase } from "@/integrations/supabase/client";
import { fetchHeroi, fetchInimigoAtivo, fetchConquistas, unlockLevelConquistas, unlockStreakConquistas } from "@/lib/api";
import { xpForLevel } from "@/lib/utils";
import { toast } from "sonner";
import { ITENS } from "@/lib/itens";
import {
  Shield, Heart, Coins, Zap, RefreshCw, Skull, Sparkles, Trash2, Flame,
  Trophy, Gift, Megaphone, Send, User, Search, Package, Infinity as InfinityIcon,
  Wand2, Users, Swords,
} from "lucide-react";

export default function Admin() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const nav = useNavigate();
  const qc = useQueryClient();
  const myUid = user?.id;

  const [targetUid, setTargetUid] = useState<string | undefined>(myUid);
  const [targetNome, setTargetNome] = useState<string>("");
  useEffect(() => {
    if (!targetUid && myUid) setTargetUid(myUid);
  }, [myUid, targetUid]);

  const [tab, setTab] = useState<"heroi" | "conq" | "inimigo" | "dia" | "dev" | "aviso" | "gerenciar">("heroi");
  const uid = targetUid;
  const { data: heroi } = useQuery({ queryKey: ["admin-heroi", uid], queryFn: () => fetchHeroi(uid!), enabled: !!uid });
  const { data: inimigo } = useQuery({ queryKey: ["admin-inimigo", uid], queryFn: () => fetchInimigoAtivo(uid!), enabled: !!uid });
  const { data: conquistas } = useQuery({ queryKey: ["admin-conq", uid], queryFn: () => fetchConquistas(uid!), enabled: !!uid });

  useEffect(() => {
    if (heroi?.nome) setTargetNome(heroi.nome);
  }, [heroi?.nome]);

  const [busy, setBusy] = useState(false);
  const [aviso, setAviso] = useState({ titulo: "", mensagem: "", tipo: "info" as "info" | "alerta" | "sucesso" });
  const [enviando, setEnviando] = useState(false);
  const [bauInfinito, setBauInfinito] = useState<boolean>(typeof window !== "undefined" && localStorage.getItem("dev_bau_infinito") === "1");
  const toggleBauInfinito = () => {
    const next = !bauInfinito;
    setBauInfinito(next);
    if (next) localStorage.setItem("dev_bau_infinito", "1");
    else localStorage.removeItem("dev_bau_infinito");
    toast.success(next ? "Baú infinito ativado" : "Baú infinito desativado");
  };

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
    await unlockLevelConquistas(uid!, heroi.nivel, nivel);
    await qc.invalidateQueries();
  };
  const setNivel = async (n: number) => {
    if (n < 1) return;
    await patch({ nivel: n, xp_atual: 0, xp_proximo_nivel: xpForLevel(n) }, `Nível definido: ${n}`);
    if (n > heroi.nivel) { await unlockLevelConquistas(uid!, heroi.nivel, n); await qc.invalidateQueries(); }
  };
  const restaurarVida = () => patch({ vida_atual: heroi.vida_max }, "Vida restaurada");
  const dano50Heroi = () => patch({ vida_atual: Math.max(1, Math.floor(heroi.vida_atual - heroi.vida_max * 0.5)) }, "-50% da vida do herói");
  const addOuro = (v: number) => patch({ ouro: heroi.ouro + v }, `+${v} de ouro`);
  const zerarConta = async () => {
    if (!confirm(`RESETAR completamente ${heroi.nome} (nível 1, vida cheia, ouro 0, XP 0)?`)) return;
    await patch({ nivel: 1, xp_atual: 0, xp_proximo_nivel: xpForLevel(1), vida_atual: 100, vida_max: 100, ouro: 0, streak_atual: 0 }, "Herói resetado");
  };
  const curarInimigo = () => {
    if (!inimigo) return;
    setBusy(true);
    supabase.from("inimigo").update({ hp_atual: inimigo.hp_max }).eq("id", inimigo.id).then(() => { toast.success("Inimigo curado"); qc.invalidateQueries(); }).then(() => setBusy(false));
  };
  const derrotarInimigo = () => {
    if (!inimigo) return;
    setBusy(true);
    supabase.from("inimigo").update({ hp_atual: 0, ativo: false, derrotado_em: new Date().toISOString() }).eq("id", inimigo.id).then(() => { toast.success("Inimigo derrotado"); qc.invalidateQueries(); }).then(() => setBusy(false));
  };
  const dano50Inimigo = () => {
    if (!inimigo) return;
    setBusy(true);
    const novo = Math.max(1, Math.floor(inimigo.hp_atual - inimigo.hp_max * 0.5));
    supabase.from("inimigo").update({ hp_atual: novo }).eq("id", inimigo.id).then(() => { toast.success("-50% do HP do inimigo"); qc.invalidateQueries(); }).then(() => setBusy(false));
  };
  const limparLogsHoje = async () => {
    if (!uid) return;
    if (!confirm("Apagar logs de hábito e transações de ouro de hoje?")) return;
    setBusy(true);
    const hoje = new Date().toISOString().slice(0, 10);
    await Promise.all([
      supabase.from("habito_logs").delete().eq("user_id", uid).eq("data", hoje),
      supabase.from("transacoes_ouro").delete().eq("user_id", uid).gte("criado_em", `${hoje}T00:00:00`).lte("criado_em", `${hoje}T23:59:59.999`),
    ]);
    toast.success("Logs de hábito e ouro do dia apagados");
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
  const ganharStreak = async (n: number) => {
    const novo = (heroi.streak_atual ?? 0) + n;
    await patch({ streak_atual: novo }, `+${n} dias de streak`);
    await unlockStreakConquistas(uid!, novo);
    await qc.invalidateQueries();
  };
  const zerarStreak = () => patch({ streak_atual: 0 }, "Streak zerada");
  const xpMeioNivel = () => patch({ xp_atual: Math.floor((heroi.xp_proximo_nivel ?? xpForLevel(heroi.nivel)) * 0.5) }, "XP a 50% do nível");
  const liberarTodosItens = async () => {
    if (!uid) return;
    if (!confirm("Desbloquear TODOS os itens da loja?")) return;
    setBusy(true);
    const atuais: string[] = Array.isArray(heroi.itens_desbloqueados) ? heroi.itens_desbloqueados : [];
    const todos = Array.from(new Set([...atuais, ...ITENS.map(i => i.id)]));
    const { error } = await supabase.from("users").update({ itens_desbloqueados: todos }).eq("id", uid);
    if (error) toast.error(error.message); else toast.success(`${todos.length} itens desbloqueados`);
    await qc.invalidateQueries(); setBusy(false);
  };
  const limparInventario = async () => {
    if (!uid) return;
    if (!confirm("Remover TODOS os itens obtidos (loja/admin) do herói? Slots equipados com itens da loja voltarão ao padrão.")) return;
    setBusy(true);
    const shopIds = new Set(ITENS.map(i => i.id));
    const eqAtual: any = heroi.avatar_equipado ?? {};
    const eqLimpo = { ...eqAtual };
    for (const key of ["hat", "armor", "aura", "mask", "pet", "frame", "card_bg", "app_bg"] as const) if (eqAtual[key] && shopIds.has(eqAtual[key])) eqLimpo[key] = null;
    const { error } = await supabase.from("users").update({ itens_desbloqueados: [], avatar_equipado: eqLimpo }).eq("id", uid);
    if (error) toast.error(error.message); else toast.success("Inventário limpo — só restam itens padrão");
    await qc.invalidateQueries(); setBusy(false);
  };
  const liberarTodasConquistas = async () => {
    if (!uid) return;
    if (!confirm("Liberar TODAS as conquistas possíveis (níveis + marcos)?")) return;
    setBusy(true);
    const rows: any[] = [];
    for (let i = 2; i <= Math.max(50, heroi.nivel + 10); i++) rows.push({ user_id: uid, tipo: `nivel_${i}`, titulo: `Nível ${i} alcançado`, descricao: `Você evoluiu para o nível ${i}.` });
    for (const t of ["primeira_batalha", "primeiro_inimigo_derrotado", "streak_7", "streak_30", "bau_lendario", "mestre_habitos"]) rows.push({ user_id: uid, tipo: t, titulo: t.replace(/_/g, " ").toUpperCase(), descricao: "Desbloqueada via admin." });
    await supabase.from("conquistas").upsert(rows, { onConflict: "user_id,tipo", ignoreDuplicates: true });
    toast.success(`${rows.length} conquistas liberadas`); await qc.invalidateQueries(); setBusy(false);
  };
  const zerarConquistas = async () => {
    if (!uid) return;
    if (!confirm("APAGAR todas as conquistas do herói?")) return;
    setBusy(true);
    await supabase.from("conquistas").delete().eq("user_id", uid);
    toast.success("Conquistas zeradas"); await qc.invalidateQueries(); setBusy(false);
  };

  const reconstruirMarcosJejum = async () => {
    if (!uid) return;
    let maxHours = 0;
    try {
      const raw = localStorage.getItem(`ascensao:jejum:${uid}`);
      const sessions = raw ? JSON.parse(raw) : [];
      maxHours = Math.max(0, ...sessions.map((s: any) => Number(s?.minutes ?? 0) / 60));
      const activeRaw = localStorage.getItem(`ascensao:jejum:${uid}:active`);
      if (activeRaw) {
        const active = JSON.parse(activeRaw);
        maxHours = Math.max(maxHours, (Date.now() - new Date(active.startedAt).getTime()) / 3600000);
      }
    } catch {}
    const dbJejumMax = Math.max(0, ...(conquistas ?? []).filter((c: any) => String(c.tipo).startsWith("jejum_")).map((c: any) => {
      const m = String(c.tipo).match(/(\d+)/); return m ? Number(m[1]) : 0;
    }));
    maxHours = Math.max(maxHours, dbJejumMax);
    if (!confirm(`Reconstruir os marcos de jejum de ${heroi.nome}?\n\nIsso APAGA somente as conquistas jejum_* antigas e recria todos os marcos de 8 em 8 horas até ${Math.floor(maxHours / 8) * 8}h.`)) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase.rpc as any)("admin_rebuild_jejum_conquistas", { p_user_id: uid, p_max_hours: maxHours });
      if (error) throw error;
      const highest = Number(data?.max_milestone ?? 0);
      toast.success(highest ? `Marcos de jejum reconstruídos até ${highest}h` : "Marcos de jejum antigos removidos");
      await qc.invalidateQueries();
    } catch (e: any) {
      toast.error(`Falha ao reconstruir jejum: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const enviarAviso = async () => {
    if (!myUid) return;
    if (!aviso.titulo.trim() || !aviso.mensagem.trim()) { toast.error("Preencha título e mensagem"); return; }
    setEnviando(true);
    const { error } = await supabase.from("avisos").insert({ titulo: aviso.titulo.trim(), mensagem: aviso.mensagem.trim(), tipo: aviso.tipo, criado_por: myUid });
    if (error) toast.error(error.message); else { toast.success("Aviso enviado para todos os jogadores"); setAviso({ titulo: "", mensagem: "", tipo: "info" }); }
    setEnviando(false);
  };

  const isSelf = targetUid === myUid;
  const tabs: { id: typeof tab; label: string; icon: any }[] = [
    { id: "gerenciar", label: "Alvo", icon: Users }, { id: "heroi", label: "Herói", icon: Sparkles }, { id: "conq", label: "Conquistas", icon: Trophy },
    { id: "inimigo", label: "Inimigo", icon: Skull }, { id: "dia", label: "Dia", icon: RefreshCw }, { id: "dev", label: "Dev", icon: Wand2 }, { id: "aviso", label: "Aviso", icon: Megaphone },
  ];

  return (
    <Shell>
      <div className="space-y-4">
        <div className="rpg-panel neon-glow scanlines p-5"><div className="flex items-start justify-between gap-3 flex-wrap"><div><p className="text-[10px] text-primary uppercase tracking-[0.3em] flex items-center gap-1"><Shield className="w-3 h-3" /> PAINEL DO MESTRE</p><h2 className="font-display text-2xl tracking-widest text-primary glow-text-purple mt-1">MODO ADMIN</h2></div><div className="text-right"><p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Gerenciando</p><p className="font-display text-sm text-primary flex items-center gap-1 justify-end"><User className="w-3 h-3" /> {heroi.nome} {isSelf && <span className="text-[9px] text-muted-foreground">(você)</span>}</p></div></div></div>
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">{tabs.map(t => { const Icon=t.icon; const active=tab===t.id; return <button key={t.id} onClick={()=>setTab(t.id)} className={`shrink-0 px-3 py-2 rounded-md text-[11px] uppercase tracking-widest flex items-center gap-1.5 border ${active?"bg-primary/20 border-primary text-primary":"border-border text-muted-foreground hover:text-foreground"}`}><Icon className="w-3.5 h-3.5"/> {t.label}</button>; })}</div>
        {tab === "gerenciar" && <GerenciarAlvo myUid={myUid!} targetUid={targetUid!} onPick={(u)=>{setTargetUid(u.id);setTargetNome(u.nome);setTab("heroi");}} />}
        {tab === "heroi" && <div className="space-y-3"><Section title="STATUS" icon={<Sparkles className="w-3 h-3" />}><Stat label="Nível" value={heroi.nivel}/><Stat label="XP" value={`${heroi.xp_atual}/${heroi.xp_proximo_nivel}`}/><Stat label="Vida" value={`${heroi.vida_atual}/${heroi.vida_max}`}/><Stat label="Ouro" value={heroi.ouro}/><Stat label="Streak" value={`${heroi.streak_atual}d`}/><Stat label="Conquistas" value={conquistas?.length??0}/></Section><Group title="Nível / XP"><AdminBtn onClick={subirNivel} disabled={busy} icon={<Zap className="w-4 h-4"/>}>Subir 1 nível</AdminBtn><AdminBtn onClick={()=>setNivel(heroi.nivel+5)} disabled={busy} icon={<Zap className="w-4 h-4"/>}>+5 níveis</AdminBtn><AdminBtn onClick={xpMeioNivel} disabled={busy} icon={<Zap className="w-4 h-4"/>}>XP a 50%</AdminBtn><AdminBtn onClick={()=>setNivel(1)} disabled={busy} icon={<RefreshCw className="w-4 h-4"/>}>Reiniciar nível</AdminBtn></Group><Group title="Vida"><AdminBtn onClick={restaurarVida} disabled={busy} icon={<Heart className="w-4 h-4"/>}>Restaurar vida</AdminBtn><AdminBtn onClick={()=>patch({vida_max:heroi.vida_max+50,vida_atual:heroi.vida_atual+50},"+50 vida máx.")} disabled={busy} icon={<Heart className="w-4 h-4"/>}>+50 vida máx</AdminBtn><AdminBtn onClick={dano50Heroi} disabled={busy} danger icon={<Swords className="w-4 h-4"/>}>-50% da vida</AdminBtn></Group><Group title="Ouro"><AdminBtn onClick={()=>addOuro(100)} disabled={busy} icon={<Coins className="w-4 h-4"/>}>+100 ouro</AdminBtn><AdminBtn onClick={()=>addOuro(1000)} disabled={busy} icon={<Coins className="w-4 h-4"/>}>+1000 ouro</AdminBtn></Group><Group title="Streak"><AdminBtn onClick={()=>ganharStreak(1)} disabled={busy} icon={<Flame className="w-4 h-4"/>}>+1 streak</AdminBtn><AdminBtn onClick={()=>ganharStreak(7)} disabled={busy} icon={<Flame className="w-4 h-4"/>}>+7 streak</AdminBtn><AdminBtn onClick={zerarStreak} disabled={busy} danger icon={<Flame className="w-4 h-4"/>}>Zerar streak</AdminBtn></Group><Group title="Zona perigosa"><AdminBtn onClick={zerarConta} disabled={busy} danger icon={<Trash2 className="w-4 h-4"/>}>Reset total do herói</AdminBtn></Group></div>}
        {tab === "conq" && <div className="space-y-3"><Section title="CONQUISTAS" icon={<Trophy className="w-3 h-3" />}><Stat label="Total" value={conquistas?.length??0}/></Section><Group title="Ações"><AdminBtn onClick={liberarTodasConquistas} disabled={busy} icon={<Trophy className="w-4 h-4"/>}>Liberar todas</AdminBtn><AdminBtn onClick={reconstruirMarcosJejum} disabled={busy} icon={<RefreshCw className="w-4 h-4"/>}>Reconstruir marcos de jejum</AdminBtn><AdminBtn onClick={zerarConquistas} disabled={busy} danger icon={<Trash2 className="w-4 h-4"/>}>Zerar conquistas</AdminBtn></Group></div>}
        {tab === "inimigo" && <div className="space-y-3"><Section title="INIMIGO" icon={<Skull className="w-3 h-3" />}>{inimigo?<><Stat label="Nome" value={inimigo.nome}/><Stat label="HP" value={`${inimigo.hp_atual}/${inimigo.hp_max}`}/></>:<p className="text-xs text-muted-foreground col-span-2">Nenhum inimigo ativo.</p>}</Section>{inimigo&&<Group title="Ações"><AdminBtn onClick={curarInimigo} disabled={busy} icon={<Heart className="w-4 h-4"/>}>Curar HP total</AdminBtn><AdminBtn onClick={dano50Inimigo} disabled={busy} danger icon={<Swords className="w-4 h-4"/>}>-50% do HP</AdminBtn><AdminBtn onClick={derrotarInimigo} disabled={busy} danger icon={<Skull className="w-4 h-4"/>}>Derrotar agora</AdminBtn></Group>}</div>}
        {tab === "dia" && <div className="space-y-3"><Section title="DIA" icon={<RefreshCw className="w-3 h-3" />}><p className="text-xs text-muted-foreground col-span-2">Todos os hábitos são diários. Reset para testar de novo.</p></Section><Group title="Ações"><AdminBtn onClick={desconcluirTodas} disabled={busy} danger icon={<RefreshCw className="w-4 h-4"/>}>Desmarcar tarefas</AdminBtn><AdminBtn onClick={limparLogsHoje} disabled={busy} danger icon={<Trash2 className="w-4 h-4"/>}>Limpar log (hábitos + ouro)</AdminBtn><AdminBtn onClick={zerarBauDia} disabled={busy} icon={<Gift className="w-4 h-4"/>}>Liberar baú do dia</AdminBtn></Group></div>}
        {tab === "dev" && <div className="space-y-3"><Section title="DEV" icon={<Wand2 className="w-3 h-3" />}><p className="text-xs text-muted-foreground col-span-2">Ferramentas exclusivas de desenvolvedor. Baú infinito só afeta seu próprio dispositivo.</p></Section><div className="rpg-panel p-4 space-y-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="font-display text-sm flex items-center gap-1.5"><InfinityIcon className="w-4 h-4 text-primary"/> Baú Infinito</p><p className="text-[11px] text-muted-foreground">Baú diário nunca é bloqueado enquanto ativo.</p></div><button onClick={toggleBauInfinito} className={`px-3 py-1.5 rounded-md text-[11px] uppercase tracking-widest border ${bauInfinito?"bg-primary/20 border-primary text-primary":"border-border text-muted-foreground"}`}>{bauInfinito?"ATIVO":"INATIVO"}</button></div></div></div>}
        {tab === "aviso" && <div className="rpg-panel p-4 space-y-3"><p className="font-display tracking-widest">ENVIAR AVISO</p><input value={aviso.titulo} onChange={e=>setAviso(v=>({...v,titulo:e.target.value}))} placeholder="Título" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm"/><textarea value={aviso.mensagem} onChange={e=>setAviso(v=>({...v,mensagem:e.target.value}))} placeholder="Mensagem" className="w-full bg-secondary border border-border rounded-md px-3 py-2 text-sm min-h-28"/><AdminBtn onClick={enviarAviso} disabled={enviando} icon={<Send className="w-4 h-4"/>}>{enviando?"Enviando...":"Enviar aviso"}</AdminBtn></div>}
      </div>
    </Shell>
  );
}

function GerenciarAlvo({ myUid, targetUid, onPick }: { myUid: string; targetUid: string; onPick: (u: any) => void }) {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const buscar = async () => {
    const query = supabase.from("users").select("id,nome,email").limit(20);
    const { data } = q.trim() ? await query.ilike("nome", `%${q.trim()}%`) : await query;
    setUsers(data ?? []);
  };
  useEffect(()=>{buscar();},[]);
  return <div className="space-y-3"><Section title="SELECIONAR HERÓI" icon={<Users className="w-3 h-3" />}><div className="col-span-2 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")buscar();}} placeholder="Nome" className="flex-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm"/><button onClick={buscar} className="border border-border rounded-md px-3"><Search className="w-4 h-4"/></button></div>{users.map(u=><button key={u.id} onClick={()=>onPick(u)} className={`col-span-2 text-left p-2 rounded border ${u.id===targetUid?"border-primary bg-primary/10":"border-border"}`}><span className="font-display text-sm">{u.nome}</span><span className="block text-[10px] text-muted-foreground">{u.email}</span></button>)}</Section></div>;
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="rpg-panel p-4"><div className="flex items-center gap-2 mb-3 text-primary text-[10px] uppercase tracking-[0.25em]">{icon}{title}</div><div className="grid grid-cols-2 gap-2">{children}</div></div>; }
function Stat({ label, value }: { label: string; value: any }) { return <div className="bg-secondary/50 rounded p-2"><p className="text-[9px] text-muted-foreground uppercase">{label}</p><p className="font-display text-sm">{value}</p></div>; }
function Group({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rpg-panel p-4"><p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-3">{title}</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{children}</div></div>; }
function AdminBtn({ onClick, disabled, danger, icon, children }: { onClick: () => void; disabled?: boolean; danger?: boolean; icon?: React.ReactNode; children: React.ReactNode }) { return <button onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-md border text-[11px] uppercase tracking-wider transition disabled:opacity-50 ${danger?"border-destructive/40 text-destructive hover:bg-destructive/10":"border-border hover:border-primary hover:bg-primary/10"}`}>{icon}{children}</button>; }
