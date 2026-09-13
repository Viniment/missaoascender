import Shell from "@/components/Shell";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Compass, Feather, Lock, Moon, PenLine, Sparkles, Target } from "lucide-react";
import { useState } from "react";

const perguntas = [
  { categoria: "Ruptura", pergunta: "O que não pode continuar igual na minha vida?" },
  { categoria: "Ruptura", pergunta: "Qual comportamento continuo repetindo mesmo sabendo que não quero repeti-lo?" },
  { categoria: "Consciência", pergunta: "O que estou evitando enxergar ou admitir para mim mesmo?" },
  { categoria: "Direção", pergunta: "O que eu realmente quero construir nos próximos 12 meses?" },
  { categoria: "Identidade", pergunta: "Que tipo de pessoa preciso me tornar para viver essa vida?" },
  { categoria: "Ação", pergunta: "Qual comportamento concreto provaria essa mudança?" },
  { categoria: "Futuro", pergunta: "Se eu continuar exatamente como estou por mais um ano, onde estarei?" },
];

export default function NoiteZero() {
  const [modo, setModo] = useState<"inicio" | "livre" | "perguntas" | "visao" | "decisao" | "selado">("inicio");
  const [indice, setIndice] = useState(0);
  const [texto, setTexto] = useState("");
  const [respostas, setRespostas] = useState<string[]>([]);
  const [visao, setVisao] = useState("");
  const [decisao, setDecisao] = useState("");
  const [compromissos, setCompromissos] = useState<string[]>(["", "", ""]);

  const salvarResposta = () => {
    if (!texto.trim()) return;
    setRespostas((r) => [...r, texto.trim()]);
    setTexto("");
    if (indice < perguntas.length - 1) setIndice((i) => i + 1);
    else setModo("visao");
  };

  const selar = () => {
    if (!decisao.trim() || compromissos.filter(Boolean).length === 0) return;
    localStorage.setItem("new-lifeup-noite-zero", JSON.stringify({ data: new Date().toISOString(), decisao, compromissos: compromissos.filter(Boolean), visao, respostas }));
    setModo("selado");
  };

  return <Shell><div className="mx-auto max-w-3xl space-y-5 pb-10">
    <header className="rpg-panel overflow-hidden p-5 sm:p-7">
      <Link to="/mente" className="mb-5 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary"><ArrowLeft className="h-3.5 w-3.5" /> Voltar para Mente</Link>
      <div className="flex items-start gap-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_30px_hsl(var(--primary)/0.16)]"><Moon className="h-7 w-7" /></div><div><div className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">EXPERIÊNCIA DE TRANSFORMAÇÃO</div><h1 className="mt-2 font-display text-2xl tracking-[0.16em] sm:text-3xl">NOITE ZERO</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Uma pausa para olhar para onde você está, decidir para onde quer ir e transformar essa decisão em ações reais.</p></div></div>
    </header>

    {modo === "inicio" && <section className="space-y-4"><div className="rpg-panel p-5 sm:p-7"><div className="mb-5 flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.25em]">O ponto de partida</span></div><h2 className="font-display text-xl tracking-widest">COMO VOCÊ QUER COMEÇAR?</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Não existe uma forma certa. Escolha o caminho que combina com o que você precisa colocar para fora agora.</p><div className="mt-6 grid gap-3 sm:grid-cols-3">
      <ModeButton icon={<PenLine />} title="Journaling livre" text="Escreva sem roteiro." onClick={() => setModo("livre")} />
      <ModeButton icon={<Compass />} title="Perguntas guiadas" text="Siga uma sequência de reflexão." onClick={() => setModo("perguntas")} />
      <ModeButton icon={<Target />} title="Começar direto" text="Vá direto para sua decisão." onClick={() => setModo("decisao")} />
    </div></div><div className="rpg-panel border-primary/20 bg-primary/5 p-4 text-center text-[11px] text-muted-foreground">A Noite Zero não precisa resolver sua vida em uma noite. Ela precisa definir <span className="font-bold text-foreground">o próximo capítulo</span>.</div></section>}

    {modo === "livre" && <Editor title="JOURNALING LIVRE" description="Coloque no papel o que você vem pensando, evitando, desejando ou adiando. Não tente escrever bonito. Seja honesto." value={texto} onChange={setTexto} onNext={() => { if (texto.trim()) setRespostas([texto.trim()]); setTexto(""); setModo("visao"); }} next="Continuar" />}

    {modo === "perguntas" && <Editor title={`${perguntas[indice].categoria.toUpperCase()} · ${indice + 1}/${perguntas.length}`} description={perguntas[indice].pergunta} value={texto} onChange={setTexto} onNext={salvarResposta} next={indice === perguntas.length - 1 ? "Ir para minha visão" : "Próxima pergunta"} />}

    {modo === "visao" && <Editor title="A VIDA QUE EU QUERO CONSTRUIR" description="Imagine os próximos 12 meses se você começar a agir de forma diferente. O que estará diferente na sua vida?" value={visao} onChange={setVisao} onNext={() => setModo("decisao")} next="Definir minha decisão" />}

    {modo === "decisao" && <section className="rpg-panel p-5 sm:p-7"><div className="mb-6 flex items-center gap-2 text-primary"><Lock className="h-4 w-4" /><span className="text-[10px] font-black uppercase tracking-[0.25em]">A decisão</span></div><h2 className="font-display text-xl tracking-widest">O QUE MUDA A PARTIR DE HOJE?</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Transforme sua reflexão em algo concreto. Não escreva o que gostaria de sentir. Escreva o que você vai fazer.</p><textarea value={decisao} onChange={(e) => setDecisao(e.target.value)} placeholder="Minha decisão é..." className="mt-5 min-h-28 w-full resize-y rounded-2xl border border-border bg-background/50 p-4 text-sm outline-none transition focus:border-primary/60" />
      <div className="mt-6"><h3 className="text-xs font-black uppercase tracking-wider">Meus 3 compromissos</h3><p className="mt-1 text-[11px] text-muted-foreground">Pequenos comportamentos que tornam sua decisão visível.</p><div className="mt-3 space-y-2">{compromissos.map((c, i) => <input key={i} value={c} onChange={(e) => setCompromissos((arr) => arr.map((x, j) => j === i ? e.target.value : x))} placeholder={`Compromisso ${i + 1}`} className="w-full rounded-xl border border-border bg-background/50 px-4 py-3 text-xs outline-none focus:border-primary/60" />)}</div></div>
      <button onClick={selar} disabled={!decisao.trim() || compromissos.filter(Boolean).length === 0} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[0_0_25px_hsl(var(--primary)/0.25)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Lock className="h-4 w-4" /> Selar minha decisão</button></section>}

    {modo === "selado" && <section className="space-y-4"><div className="rpg-panel border-primary/40 bg-primary/5 p-6 text-center sm:p-8"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-primary/50 bg-primary/10 text-primary shadow-[0_0_35px_hsl(var(--primary)/0.2)]"><Check className="h-8 w-8" /></div><div className="mt-5 text-[10px] font-black uppercase tracking-[0.3em] text-primary">DECISÃO SELADA</div><h2 className="mt-2 font-display text-2xl tracking-widest">A NOITE ZERO TERMINA.</h2><p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">Agora começa a parte mais importante: viver a decisão e acumular evidências através das suas ações.</p></div><div className="rpg-panel p-5"><div className="text-[9px] font-black uppercase tracking-[0.25em] text-muted-foreground">Minha decisão</div><p className="mt-2 text-sm leading-relaxed">{decisao}</p><div className="mt-5 grid gap-2">{compromissos.filter(Boolean).map((c, i) => <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-background/30 p-3 text-xs"><Check className="h-4 w-4 shrink-0 text-primary" />{c}</div>)}</div></div><Link to="/mente" className="flex w-full items-center justify-center gap-2 rounded-xl border border-border px-5 py-3 text-xs font-black uppercase tracking-wider transition hover:border-primary/50 hover:text-primary">Voltar para Mente <ArrowRight className="h-4 w-4" /></Link></section>}
  </div></Shell>;
}

function ModeButton({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) { return <button onClick={onClick} className="rpg-panel group p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50"><div className="mb-4 grid h-10 w-10 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary transition group-hover:scale-105">{icon}</div><h3 className="text-xs font-black uppercase tracking-wider">{title}</h3><p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{text}</p></button>; }
function Editor({ title, description, value, onChange, onNext, next }: { title: string; description: string; value: string; onChange: (v: string) => void; onNext: () => void; next: string }) { return <section className="rpg-panel p-5 sm:p-7"><div className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">{title}</div><h2 className="mt-3 font-display text-xl tracking-widest">PARE E OLHE</h2><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{description}</p><textarea autoFocus value={value} onChange={(e) => onChange(e.target.value)} className="mt-6 min-h-44 w-full resize-y rounded-2xl border border-border bg-background/50 p-4 text-sm leading-relaxed outline-none transition focus:border-primary/60" placeholder="Escreva aqui..." /><button onClick={onNext} disabled={!value.trim()} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-40">{next} <ArrowRight className="h-4 w-4" /></button></section>; }
