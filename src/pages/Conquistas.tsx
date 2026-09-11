import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Shell from "@/components/Shell";
import { fetchConquistas, fetchHeroi, fetchInimigoAtivo } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Lock, Brain, Swords, Flame, Coins, Shield, Sparkles, Target, Eye, Waves, Crown, Star, CheckCircle2, BookOpen, Zap, Compass, Heart, ScrollText } from "lucide-react";

type Grupo = "todas" | "mente" | "jornada" | "consistencia" | "batalha" | "riqueza" | "autodomínio";
type Raridade = "comum" | "rara" | "epica" | "lendaria";
type Item = { tipo:string; titulo:string; descricao:string; como:string; unlocked:boolean; progresso?:string; percent?:number; desbloqueada_em?:string|null; grupo:Exclude<Grupo,"todas">; raridade:Raridade; icon:any; recompensa:string };

const GROUPS = [
  { id:"todas", label:"Todas", icon:Trophy }, { id:"jornada", label:"Jornada", icon:Compass }, { id:"mente", label:"Mente", icon:Brain },
  { id:"consistencia", label:"Constância", icon:Flame }, { id:"batalha", label:"Batalha", icon:Swords }, { id:"autodomínio", label:"Autodomínio", icon:Shield }, { id:"riqueza", label:"Riqueza", icon:Coins },
] as const;
const RARITY:Record<Raridade,{label:string;className:string;glow:string}> = {
  comum:{label:"COMUM",className:"border-border text-muted-foreground",glow:""},
  rara:{label:"RARA",className:"border-cyan-400/50 text-cyan-300",glow:"shadow-[0_0_18px_rgba(34,211,238,.12)]"},
  epica:{label:"ÉPICA",className:"border-purple-400/60 text-purple-300",glow:"shadow-[0_0_22px_rgba(168,85,247,.18)]"},
  lendaria:{label:"LENDÁRIA",className:"border-amber-300/70 text-amber-200",glow:"shadow-[0_0_28px_rgba(251,191,36,.2)]"},
};
function loadDiary(uid:string){try{return JSON.parse(localStorage.getItem(`ascensao:diario:${uid}`)||"[]") as Array<{date:string;text:string;type:string}>}catch{return []}}

export default function ConquistasPage(){
 const {user}=useAuth(); const uid=user?.id;
 const {data:cs}=useQuery({queryKey:["conq",uid],queryFn:()=>fetchConquistas(uid!),enabled:!!uid});
 const {data:heroi}=useQuery({queryKey:["heroi",uid],queryFn:()=>fetchHeroi(uid!),enabled:!!uid});
 const {data:inimigo}=useQuery({queryKey:["inimigo-ativo",uid],queryFn:()=>fetchInimigoAtivo(uid!),enabled:!!uid});
 const {data:kills}=useQuery({queryKey:["kills-conq",uid],queryFn:async()=>{const {count}=await supabase.from("inimigo").select("id",{count:"exact",head:true}).eq("user_id",uid!).eq("ativo",false);return count??0},enabled:!!uid});
 const {data:economia}=useQuery({queryKey:["econ-conq",uid],queryFn:async()=>{const {data}=await supabase.from("transacoes_ouro").select("valor,origem").eq("user_id",uid!);const r=data??[];return{ganho:r.filter(x=>(x.valor??0)>0).reduce((s,x)=>s+(x.valor??0),0),compras:r.filter(x=>(x.origem??"")==="loja").length}},enabled:!!uid});
 const {data:pureza}=useQuery({queryKey:["pureza-conq",uid],queryFn:async()=>{const {data}=await supabase.from("habito_logs").select("data,completado,habitos!inner(tipo)").eq("user_id",uid!).eq("completado",true);const days=new Map<string,{p:number;n:number}>();for(const l of data??[]){const d=l.data as string,t=(l as any).habitos?.tipo as string;const x=days.get(d)??{p:0,n:0};if(t==="positivo")x.p++;if(t==="negativo")x.n++;days.set(d,x)}let clean=0;for(const x of days.values())if(x.p>0&&x.n===0)clean++;return clean},enabled:!!uid});
 const [diary,setDiary]=useState<Array<{date:string;text:string;type:string}>>([]); const [filtro,setFiltro]=useState<Grupo>("todas"); const [aberta,setAberta]=useState<string|null>(null);
 useEffect(()=>{if(uid)setDiary(loadDiary(uid))},[uid]);
 const catalog=useMemo<Item[]>(()=>{
  if(!heroi)return[]; const map=new Map((cs??[]).map(c=>[c.tipo,c] as const)); const items:Item[]=[];
  const nivel=heroi.nivel??1, streak=heroi.streak_atual??0, ouro=heroi.ouro??0, ganho=economia?.ganho??0, compras=economia?.compras??0, derrotas=kills??0;
  const count=diary.length, dates=new Set(diary.map(x=>x.date)).size, urges=diary.filter(x=>x.type==="urge").length;
  const choices=diary.filter(x=>/ESCOLHA:\s*(?!não registrada)/i.test(x.text)).length, perspectives=diary.filter(x=>/PERSPECTIVA:\s*(?!não registrada)/i.test(x.text)).length;
  const add=(x:Omit<Item,"percent">&{percent?:number})=>items.push({...x,percent:x.unlocked?100:Math.max(0,Math.min(99,x.percent??0))});
  const unlock=(t:string,c:boolean)=>c||map.has(t); const db=(t:string)=>map.get(t)?.desbloqueada_em??null;
  const tier=(n:number,kind:"level"|"streak"|"enemy"|"gold")=>kind==="level"?(n>=50?"lendaria":n>=20?"epica":n>=10?"rara":"comum"):kind==="streak"?(n>=60?"lendaria":n>=14?"epica":"rara"):kind==="enemy"?(n>=10?"lendaria":n>=5?"epica":"rara"):(n>=5000?"lendaria":n>=1000?"epica":"rara");
  const reward=(r:Raridade)=>r==="lendaria"?"+XP · +Ouro · grande Vida":r==="epica"?"+XP · +Ouro · Vida":"+XP · +Ouro";
  const milestone=(tipo:string,titulo:string,desc:string,como:string,current:number,goal:number,grupo:Exclude<Grupo,"todas">,raridade:Raridade,icon:any)=>{const u=unlock(tipo,current>=goal);add({tipo,titulo,descricao:desc,como,unlocked:u,progresso:u?undefined:`${Math.min(current,goal)}/${goal}`,percent:current/goal*100,desbloqueada_em:u?db(tipo):null,grupo,raridade,icon,recompensa:reward(raridade)})};

  // PROGRESSÃO CURTA: muitos degraus pequenos para manter sensação constante de avanço.
  for(const n of [2,3,4,5,7,10,15,20,30,50,75,100]) milestone(`nivel_${n}`,`Nível ${n}`,`Alcance o nível ${n} e avance mais um capítulo.`,`Continue acumulando XP.`,nivel,n,"jornada",tier(n,"level"),Sparkles);
  for(const n of [1,2,3,5,7,10,14,21,30,45,60,100]) milestone(`diario_${n}`,`Diário ${n}`,`Seu diário virou parte da campanha.`,`Faça ${n} registros.`,count,n,"jornada",n>=30?"epica":n>=10?"rara":"comum",BookOpen);
  for(const n of [1,2,3,5,7,14,30]) milestone(`dias_mente_${n}`,`${n} dia${n>1?"s":""} de presença`,`Você voltou ao jogo para observar a própria experiência.`,`Registre o Diário em ${n} dia${n>1?"s":""} diferentes.`,dates,n,"jornada",n>=14?"epica":n>=5?"rara":"comum",Compass);
  for(const n of [1,2,3,5,7,10]) milestone(`escolhas_${n}`,`Escolha consciente ${n}`,`Você praticou pausar e escolher a resposta.`,`Registre ${n} escolhas conscientes no Diário.`,choices,n,"mente",n>=7?"epica":n>=3?"rara":"comum",Target);
  for(const n of [1,2,3,5,10]) milestone(`perspectivas_${n}`,`Outra perspectiva ${n}`,`Você investigou uma interpretação em vez de tratá-la como fato.`,`Registre ${n} perspectivas alternativas.`,perspectives,n,"mente",n>=5?"epica":"rara",Eye);
  for(const n of [1,2,3,5,10]) milestone(`vontades_${n}`,`Vontade ≠ comando ${n}`,`Você observou uma vontade sem transformá-la automaticamente em ação.`,`Registre ${n} experiências de vontade no Diário.`,urges,n,"mente",n>=5?"epica":"rara",Waves);
  const thoughtCount=diary.filter(x=>/PENSAMENTO:/i.test(x.text)).length; for(const n of [1,3,5,10]) milestone(`pensamentos_${n}`,`Observador ${n}`,`Você aprendeu a olhar para o pensamento de fora.`,`Registre ${n} pensamentos no Diário.`,thoughtCount,n,"mente",n>=5?"epica":"rara",Brain);

  for(const n of [1,2,3,5,7,10,14,21,30,60,100]) milestone(`streak_${n}`,`${n} dia${n>1?"s":""} de constância`,`A campanha continua porque você voltou.`,`Mantenha ${n} dias seguidos de foco.`,streak,n,"consistencia",n>=60?"lendaria":n>=14?"epica":n>=7?"rara":"comum",Flame);
  milestone("bau_lendario","Primeiro loot","Você descobriu que consistência também gera recompensas.","Abra o baú diário.",heroi.ultimo_bau_data?1:0,1,"consistencia","rara",Star);
  milestone("mestre_habitos","Mestre dos hábitos","Consistência virou identidade.","Tenha 30 dias de streak e 1 inimigo derrotado.",Math.min(streak,30)+(derrotas>0?30:0),60,"consistencia","lendaria",Crown);

  const primeira=!!inimigo||derrotas>0||map.has("primeira_batalha"); milestone("primeira_batalha","Primeira batalha","Você entrou no sistema de inimigos.","Cadastre um inimigo de campanha.",primeira?1:0,1,"batalha","comum",Swords);
  for(const n of [1,2,3,5,7,10,15,25]) milestone(n===1?"primeiro_inimigo_derrotado":`inimigos_${n}`,n===1?"Primeiro inimigo derrotado":`${n} inimigos derrotados`,`Um padrão a menos controlando a campanha.`,`Derrote ${n} inimigo${n>1?"s":""}.`,derrotas,n,"batalha",tier(n,"enemy"),Swords);

  for(const n of [100,250,500,1000,2500,5000,10000]) milestone(`ouro_ganho_${n}`,`${n.toLocaleString("pt-BR")} de ouro`,`Seu esforço está virando recursos para evoluir.`,`Acumule ${n.toLocaleString("pt-BR")} de ouro ganho.`,ganho,n,"riqueza",tier(n,"gold"),Coins);
  for(const n of [100,250,500,1000,2000,5000]) milestone(`ouro_cofre_${n}`,`${n.toLocaleString("pt-BR")} guardados`,`Você aprendeu a acumular poder.`,`Mantenha ${n.toLocaleString("pt-BR")} de ouro.`,ouro,n,"riqueza",n>=5000?"lendaria":n>=1000?"epica":"rara",Coins);
  for(const n of [1,2,3,5,10,15,30]) milestone(`compras_${n}`,`${n} compra${n>1?"s":""}`,`Use seus recursos para melhorar a jornada.`,`Faça ${n} compras na loja.`,compras,n,"riqueza",n>=15?"epica":n>=5?"rara":"comum",Coins);

  const clean=pureza??0; for(const n of [1,2,3,5,7,10,15,30]) milestone(`dias_limpos_${n}`,`${n} dia${n>1?"s":""} limpo${n>1?"s":""}`,`Você escolheu construir sem alimentar a armadilha.`,`Tenha ${n} dias com hábito positivo e nenhum negativo concluído.`,clean,n,"autodomínio",n>=15?"epica":n>=5?"rara":"comum",Shield);
  return items;
 },[heroi,cs,inimigo,kills,economia,pureza,diary]);

 const total=catalog.length,obtidas=catalog.filter(x=>x.unlocked).length;
 const filtrado=(filtro==="todas"?catalog:catalog.filter(x=>x.grupo===filtro));
 const ordered=[...filtrado].sort((a,b)=>{if(a.unlocked!==b.unlocked)return a.unlocked?1:-1;return (b.percent??0)-(a.percent??0)});
 const proximas=catalog.filter(x=>!x.unlocked).sort((a,b)=>(b.percent??0)-(a.percent??0)).slice(0,3);
 const percentual=total?Math.round(obtidas/total*100):0;
 return <Shell><div className="mx-auto max-w-6xl space-y-5 pb-6">
  <header className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card p-5 shadow-[0_0_40px_hsl(var(--primary)/.08)] sm:p-7">
   <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl"/>
   <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-primary"><Trophy className="h-4 w-4"/> Sala de Troféus</div><h1 className="mt-2 font-display text-2xl tracking-[.14em] text-primary glow-text-purple sm:text-3xl">CONQUISTAS</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Não espere meses por uma recompensa. A campanha é feita de pequenas vitórias: cada ação aproxima você do próximo troféu.</p></div><div className="rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-center"><div className="font-display text-2xl text-primary">{obtidas}/{total}</div><div className="text-[9px] font-black uppercase tracking-[.2em] text-muted-foreground">desbloqueadas</div></div></div>
   <div className="relative mt-5"><div className="mb-2 flex justify-between text-[10px] font-black uppercase tracking-widest"><span>Progresso da coleção</span><span className="text-primary">{percentual}%</span></div><div className="h-3 overflow-hidden rounded-full border border-border bg-background/60"><motion.div initial={{width:0}} animate={{width:`${percentual}%`}} className="h-full bg-gradient-to-r from-primary via-purple-400 to-amber-300 shadow-[0_0_15px_hsl(var(--primary)/.6)]"/></div></div>
  </header>
  {proximas.length>0&&<section className="rpg-panel p-4"><div className="mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300"/><div><p className="text-[9px] font-black uppercase tracking-[.22em] text-amber-300">PRÓXIMOS TROFÉUS</p><p className="text-[11px] text-muted-foreground">Objetivos curtos para manter a sensação de avanço.</p></div></div><div className="grid gap-2 sm:grid-cols-3">{proximas.map((x,i)=><button key={x.tipo} onClick={()=>setAberta(x.tipo)} className="rounded-xl border border-border/70 bg-background/30 p-3 text-left hover:border-primary/50"><div className="flex items-center justify-between gap-2"><span className="text-[9px] font-black uppercase text-muted-foreground">#{i+1} · {x.raridade}</span><span className="text-[10px] font-black text-primary">{Math.round(x.percent??0)}%</span></div><div className="mt-1 font-display text-xs tracking-wider">{x.titulo}</div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{width:`${x.percent??0}%`}}/></div></button>)}</div></section>}
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">{GROUPS.map(g=>{const Icon=g.icon;const count=g.id==="todas"?catalog.length:catalog.filter(x=>x.grupo===g.id).length;const got=g.id==="todas"?obtidas:catalog.filter(x=>x.grupo===g.id&&x.unlocked).length;const active=filtro===g.id;return <button key={g.id} onClick={()=>setFiltro(g.id)} className={`min-w-0 rounded-xl border px-2 py-2.5 transition ${active?"border-primary bg-primary/15 text-primary shadow-[0_0_14px_hsl(var(--primary)/.18)]":"border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"}`}><span className="flex items-center justify-center gap-1 text-[9px] font-black uppercase tracking-wide"><Icon className="h-3.5 w-3.5 shrink-0"/><span className="truncate">{g.label}</span></span><span className="mt-1 block text-[9px] font-bold opacity-60">{got}/{count}</span></button>})}</div>
  <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ordered.map(x=>{const open=aberta===x.tipo;const R=RARITY[x.raridade];const Icon=x.icon;return <motion.button key={x.tipo} layout onClick={()=>setAberta(open?null:x.tipo)} className={`group relative overflow-hidden rounded-2xl border bg-card/70 p-4 text-left transition hover:-translate-y-0.5 ${x.unlocked?`${R.glow} ${R.className}`:"border-border/60 opacity-70 hover:opacity-100"}`}><div className="flex items-start gap-3"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${x.unlocked?R.className:"border-border text-muted-foreground"} bg-background/40`}>{x.unlocked?<Icon className="h-6 w-6"/>:<Lock className="h-5 w-5"/>}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`text-[8px] font-black tracking-[.16em] ${R.className}`}>{R.label}</span>{x.unlocked&&<CheckCircle2 className="h-4 w-4 text-emerald-400"/>}</div><h3 className={`mt-1 font-display text-sm tracking-wider ${x.unlocked?"text-foreground":"text-muted-foreground"}`}>{x.titulo}</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{x.descricao}</p></div></div>{!x.unlocked&&<div className="mt-3"><div className="mb-1 flex justify-between text-[9px] font-bold text-muted-foreground"><span>{x.progresso}</span><span>{Math.round(x.percent??0)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary/80 transition-all" style={{width:`${Math.min(100,x.percent??0)}%`}}/></div></div>}{open&&<div className="mt-4 space-y-2 border-t border-border/60 pt-3"><p className="text-[10px] font-black uppercase tracking-widest text-primary">Como desbloquear</p><p className="text-xs leading-relaxed text-foreground/90">{x.como}</p><p className="flex items-center gap-1 text-[10px] font-bold text-amber-300"><Heart className="h-3 w-3"/> Recompensa: {x.recompensa}</p>{x.unlocked&&x.desbloqueada_em&&<p className="text-[10px] text-muted-foreground">Desbloqueada em {new Date(x.desbloqueada_em).toLocaleDateString("pt-BR")}</p>}</div>}<div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary opacity-0 shadow-[0_0_8px_hsl(var(--primary))] transition group-hover:opacity-100"/></motion.button>})}</section>
 </div></Shell>
}
