import Shell from "@/components/Shell";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ImagePlus, Plus, Play, Music2, Trash2, Pencil, Sparkles, X, Youtube, Video, Link2 } from "lucide-react";

type Area = { id: string; nome: string; emoji: string; descricao: string };
type Media = { id: string; areaId: string; tipo: "foto" | "video" | "musica"; src: string; titulo: string; legenda: string; significado: string; origem: "upload" | "youtube" | "link" };

const AREAS_KEY = "new-lifeup-cantinho-areas";
const MEDIA_KEY = "new-lifeup-cantinho-media";
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function load<T>(key: string, fallback: T): T { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } }
function save(key: string, value: unknown) { localStorage.setItem(key, JSON.stringify(value)); }
function youtubeEmbed(url: string) {
  try {
    const raw = url.trim();
    if (!raw) return null;

    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    const isYoutube =
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtu.be" ||
      host === "youtube-nocookie.com";

    if (!isYoutube) return null;

    let id: string | null = null;

    if (host === "youtu.be") {
      id = u.pathname.split("/").filter(Boolean)[0] ?? null;
    } else {
      id =
        u.searchParams.get("v") ||
        u.pathname.match(/^\/(?:shorts|embed|live)\/([^/?#]+)/i)?.[1] ||
        null;
    }

    if (!id) return null;
    if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return null;

    // O modo de música usa um iframe real do YouTube, inclusive para
    // links vindos do YouTube Music. O endpoint nocookie evita que a
    // URL do YouTube Music seja tratada como um arquivo de áudio.
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&playsinline=1`;
  } catch {
    return null;
  }
}

export default function MeuCantinho() {
  const [areas, setAreas] = useState<Area[]>(() => load(AREAS_KEY, []));
  const [media, setMedia] = useState<Media[]>(() => load(MEDIA_KEY, []));
  const [areaId, setAreaId] = useState<string | null>(null);
  const [areaModal, setAreaModal] = useState(false);
  const [mediaModal, setMediaModal] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [mediaEditing, setMediaEditing] = useState<Media | null>(null);
  const [ensaio, setEnsaio] = useState(false);

  useEffect(() => save(AREAS_KEY, areas), [areas]);
  useEffect(() => save(MEDIA_KEY, media), [media]);
  const selected = areas.find(a => a.id === areaId) ?? null;
  const selectedMedia = useMemo(() => selected ? media.filter(m => m.areaId === selected.id) : [], [media, selected]);

  const openArea = (a?: Area) => { setEditing(a ?? null); setAreaModal(true); };
  const deleteArea = (id: string) => { if (!confirm("Excluir esta área e todos os conteúdos dela?")) return; setAreas(v => v.filter(a => a.id !== id)); setMedia(v => v.filter(m => m.areaId !== id)); if (areaId === id) setAreaId(null); };
  const openMedia = (m?: Media) => { setMediaEditing(m ?? null); setMediaModal(true); };
  const deleteMedia = (id: string) => { if (confirm("Excluir este conteúdo do Cantinho?")) setMedia(v => v.filter(x => x.id !== id)); };

  return <Shell><div className="mx-auto max-w-5xl space-y-5">
    <header className="rpg-panel overflow-hidden p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <Link to="/mente" className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border bg-background/40 text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary"><Sparkles className="h-4 w-4" /> Espaço pessoal</div><h1 className="mt-2 font-display text-xl tracking-widest sm:text-2xl">MEU CANTINHO DE MANIFESTAÇÃO</h1><p className="mt-2 max-w-2xl text-xs leading-relaxed text-muted-foreground">Guarde diante dos olhos aquilo que você deseja construir. Fotos, vídeos e músicas para visualizar, sentir e lembrar do seu porquê.</p></div>
      </div>
      {areas.length > 0 && <button onClick={() => setEnsaio(true)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground shadow-[0_0_22px_hsl(var(--primary)/0.28)] hover:opacity-90"><Play className="h-4 w-4" /> Viver meu porquê</button>}
    </header>

    {!selected ? <>
      <div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-sm tracking-widest">ÁREAS DA MINHA VIDA</h2><p className="mt-1 text-[11px] text-muted-foreground">Crie os espaços que representam a vida que você quer construir.</p></div><button onClick={() => openArea()} className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary"><Plus className="h-3.5 w-3.5" /> Nova área</button></div>
      {areas.length === 0 ? <div className="rpg-panel border-dashed p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-primary"><ImagePlus className="h-6 w-6" /></div><h3 className="mt-4 font-display text-sm tracking-widest">SEU CANTINHO COMEÇA AQUI</h3><p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">Crie uma área como “Minha Família”, “Viagens”, “Abundância” ou qualquer outra que tenha significado para você.</p><button onClick={() => openArea()} className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground">Criar minha primeira área</button></div> : <div className="grid gap-3 sm:grid-cols-2">{areas.map(a => { const count = media.filter(m => m.areaId === a.id).length; return <div key={a.id} className="rpg-panel group p-4 transition hover:-translate-y-0.5 hover:border-primary/50"><button onClick={() => setAreaId(a.id)} className="flex w-full items-start gap-3 text-left"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-primary/25 bg-primary/10 text-2xl">{a.emoji}</div><div className="min-w-0 flex-1"><h3 className="font-display text-sm tracking-widest">{a.nome}</h3>{a.descricao && <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{a.descricao}</p>}<p className="mt-2 text-[9px] font-black uppercase tracking-wider text-primary">{count} {count === 1 ? "conteúdo" : "conteúdos"}</p></div></button><div className="mt-3 flex justify-end gap-1 border-t border-border/50 pt-2"><button onClick={() => openArea(a)} className="rounded-lg p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary" title="Editar"><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => deleteArea(a.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button></div></div>; })}</div>}
    </> : <>
      <div className="flex flex-wrap items-center justify-between gap-3"><button onClick={() => setAreaId(null)} className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Áreas</button><button onClick={() => openMedia()} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-wider text-primary-foreground"><Plus className="h-3.5 w-3.5" /> Adicionar conteúdo</button></div>
      <section className="rpg-panel border-primary/25 bg-primary/5 p-5"><div className="flex items-start gap-3"><div className="text-3xl">{selected.emoji}</div><div><div className="text-[9px] font-black uppercase tracking-[0.22em] text-primary">MEU CANTINHO</div><h2 className="mt-1 font-display text-xl tracking-widest">{selected.nome}</h2>{selected.descricao && <p className="mt-1 text-xs text-muted-foreground">{selected.descricao}</p>}</div></div></section>
      {selectedMedia.length === 0 ? <div className="rpg-panel border-dashed p-8 text-center"><ImagePlus className="mx-auto h-8 w-8 text-muted-foreground" /><h3 className="mt-3 font-display text-sm tracking-widest">ADICIONE O QUE ISSO REPRESENTA</h3><p className="mt-2 text-xs text-muted-foreground">Fotos, vídeos do YouTube ou MP4, músicas do YouTube ou MP3.</p></div> : <div className="grid gap-4 sm:grid-cols-2">{selectedMedia.map(m => <MediaCard key={m.id} m={m} onEdit={() => openMedia(m)} onDelete={() => deleteMedia(m.id)} />)}</div>}
    </>}

    {areas.length > 0 && !selected && <section className="rpg-panel p-4"><div className="flex items-start gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4" /></div><div><h3 className="text-xs font-black uppercase tracking-wider">VISUALIZE. LEMBRE. AJA.</h3><p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">Este espaço não é para fingir que o futuro já existe. É para manter diante dos seus olhos aquilo que você decidiu construir.</p></div></div></section>}
  </div>
  {areaModal && <AreaModal initial={editing} onClose={() => setAreaModal(false)} onSave={a => { setAreas(v => editing ? v.map(x => x.id === editing.id ? {...a, id: editing.id} : x) : [...v, {...a, id: uid()}]); setAreaModal(false); }} />}
  {mediaModal && selected && <MediaModal initial={mediaEditing} areaId={selected.id} onClose={() => setMediaModal(false)} onSave={m => { setMedia(v => mediaEditing ? v.map(x => x.id === mediaEditing.id ? {...m, id: mediaEditing.id} : x) : [...v, {...m, id: uid()}]); setMediaModal(false); }} />}
  {ensaio && <EnsaioModal areas={areas} media={media} onClose={() => setEnsaio(false)} />}
  </Shell>;
}

function MediaCard({m,onEdit,onDelete}:{m:Media;onEdit:()=>void;onDelete:()=>void}) { const embed = m.origem === "youtube" ? youtubeEmbed(m.src) : null; return <article className="rpg-panel overflow-hidden"><div className="relative aspect-video bg-black/30">{m.tipo === "foto" && <img src={m.src} alt={m.titulo} className="h-full w-full object-cover" />}{m.tipo === "video" && (embed ? <iframe src={embed} title={m.titulo} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /> : <video src={m.src} controls className="h-full w-full object-contain" />)}{m.tipo === "musica" && (embed ? <iframe src={embed} title={m.titulo} className="h-full w-full" allow="autoplay; encrypted-media" /> : <div className="flex h-full items-center justify-center"><audio src={m.src} controls className="w-[90%]" /></div>)}</div><div className="p-4"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><h3 className="font-display text-sm tracking-wider">{m.titulo || "Sem título"}</h3>{m.legenda && <p className="mt-1 text-xs text-foreground/90">{m.legenda}</p>}{m.significado && <p className="mt-2 border-l-2 border-primary/40 pl-2 text-[11px] leading-relaxed text-muted-foreground">{m.significado}</p>}</div><div className="flex shrink-0"><button onClick={onEdit} className="p-1.5 text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button><button onClick={onDelete} className="p-1.5 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button></div></div></div></article>; }

function AreaModal({initial,onClose,onSave}:{initial:Area|null;onClose:()=>void;onSave:(a:Omit<Area,"id">)=>void}) { const [nome,setNome]=useState(initial?.nome??""); const [emoji,setEmoji]=useState(initial?.emoji??"✨"); const [descricao,setDescricao]=useState(initial?.descricao??""); return <Modal title={initial?"Editar área":"Nova área"} onClose={onClose}><Field label="Nome" value={nome} onChange={setNome} placeholder="Ex.: Minha Família" /><Field label="Emoji" value={emoji} onChange={setEmoji} placeholder="❤️" /><Field label="Descrição" value={descricao} onChange={setDescricao} placeholder="O que essa área representa para você?" /><button disabled={!nome.trim()} onClick={() => onSave({nome:nome.trim(),emoji:emoji||"✨",descricao:descricao.trim()})} className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground disabled:opacity-40">Salvar área</button></Modal>; }

function MediaModal({initial,areaId,onClose,onSave}:{initial:Media|null;areaId:string;onClose:()=>void;onSave:(m:Omit<Media,"id">)=>void}) { const [tipo,setTipo]=useState<Media["tipo"]>(initial?.tipo??"foto"); const [origem,setOrigem]=useState<Media["origem"]>(initial?.origem??"upload"); const [src,setSrc]=useState(initial?.src??""); const [titulo,setTitulo]=useState(initial?.titulo??""); const [legenda,setLegenda]=useState(initial?.legenda??""); const [significado,setSignificado]=useState(initial?.significado??""); const [fileName,setFileName]=useState("");
 const accept = tipo === "foto" ? "image/*" : tipo === "video" ? "video/mp4,video/*" : "audio/mpeg,video/mp4";
 const file = (f:File) => { setFileName(f.name); const reader=new FileReader(); reader.onload=()=>setSrc(String(reader.result)); reader.readAsDataURL(f); };
 return <Modal title={initial?"Editar conteúdo":"Adicionar conteúdo"} onClose={onClose}><div className="grid grid-cols-3 gap-2">{(["foto","video","musica"] as const).map(t=><button key={t} onClick={()=>{setTipo(t);setOrigem(t==="foto"?"upload":"upload");}} className={`rounded-xl border px-2 py-2 text-[10px] font-black uppercase ${tipo===t?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground"}`}>{t==="foto"?<ImagePlus className="mx-auto mb-1 h-4 w-4"/>:t==="video"?<Video className="mx-auto mb-1 h-4 w-4"/>:<Music2 className="mx-auto mb-1 h-4 w-4"/>}{t}</button>)}</div><div className="mt-3 grid grid-cols-3 gap-2">{(tipo==="foto"?["upload"]:["upload","youtube"]).map(o=><button key={o} onClick={()=>setOrigem(o as Media["origem"])} className={`rounded-lg border px-2 py-1.5 text-[9px] font-bold uppercase ${origem===o?"border-primary/60 bg-primary/5 text-primary":"border-border text-muted-foreground"}`}>{o==="youtube"?<Youtube className="mr-1 inline h-3 w-3"/>:<Link2 className="mr-1 inline h-3 w-3"/>}{o}</button>)}</div>{origem==="upload"?<label className="mt-3 block cursor-pointer rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 text-center text-xs text-muted-foreground hover:border-primary/60"><input type="file" accept={accept} className="hidden" onChange={e=>e.target.files?.[0]&&file(e.target.files[0])}/><ImagePlus className="mx-auto h-5 w-5 text-primary"/><span className="mt-1 block">{fileName||"Escolher arquivo"}</span><span className="mt-1 block text-[10px]">{tipo==="foto"?"Imagem":tipo==="video"?"MP4":"MP3 ou MP4"}</span></label>:<Field label="Link do YouTube" value={src} onChange={setSrc} placeholder="Cole o link do vídeo ou música"/>}<Field label="Título" value={titulo} onChange={setTitulo} placeholder="Ex.: A casa que quero construir"/><Field label="Legenda" value={legenda} onChange={setLegenda} placeholder="O que você vê aqui?"/><Field label="O que isso representa para mim?" value={significado} onChange={setSignificado} placeholder="Por que isso importa para você?"/><button disabled={!src} onClick={()=>onSave({areaId,tipo,src,titulo,legenda,significado,origem})} className="mt-4 w-full rounded-xl bg-primary py-2.5 text-xs font-black uppercase tracking-wider text-primary-foreground disabled:opacity-40">Salvar conteúdo</button></Modal>; }

function EnsaioModal({areas,media,onClose}:{areas:Area[];media:Media[];onClose:()=>void}) {
  const all=areas.flatMap(a=>media.filter(m=>m.areaId===a.id).map(m=>({...m,area:a})));
  const [i,setI]=useState(0);
  const item=all[i];
  const embed=item?.origem==="youtube" ? youtubeEmbed(item.src) : null;
  return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3"><div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-primary/30 bg-background shadow-[0_0_60px_hsl(var(--primary)/0.18)]"><button onClick={onClose} className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white"><X className="h-4 w-4"/></button>{item ? <><div className="aspect-video bg-black">{item.tipo==="foto"?<img src={item.src} className="h-full w-full object-contain"/>:item.origem==="youtube"&&embed?<iframe src={embed} title={item.titulo||"YouTube"} className="h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>:item.tipo==="video"?<video src={item.src} controls autoPlay className="h-full w-full"/>:item.tipo==="musica"?<div className="flex h-full items-center justify-center p-6"><audio src={item.src} controls autoPlay className="w-full"/> </div>:<div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">Não foi possível reconhecer este link do YouTube.</div>}</div><div className="p-5"><div className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">{item.area.emoji} {item.area.nome}</div><h2 className="mt-1 font-display text-lg tracking-widest">{item.titulo||"Meu porquê"}</h2>{item.legenda&&<p className="mt-2 text-sm">{item.legenda}</p>}{item.significado&&<p className="mt-3 border-l-2 border-primary/50 pl-3 text-xs leading-relaxed text-muted-foreground">{item.significado}</p>}<div className="mt-5 flex justify-between"><button disabled={i===0} onClick={()=>setI(v=>v-1)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold disabled:opacity-30">Anterior</button><span className="self-center text-[10px] font-bold text-muted-foreground">{i+1} / {all.length}</span><button disabled={i===all.length-1} onClick={()=>setI(v=>v+1)} className="rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground disabled:opacity-30" >Próximo</button></div></div></>:<div className="p-10 text-center"><p className="text-sm">Adicione conteúdos ao seu Cantinho primeiro.</p></div>}</div></div>;
}

function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) { return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 p-3"><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-primary/25 bg-background p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><h2 className="font-display text-base tracking-widest">{title}</h2><button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><X className="h-4 w-4"/></button></div>{children}</div></div>; }
function Field({label,value,onChange,placeholder}:{label:string;value:string;onChange:(v:string)=>void;placeholder:string}) { return <label className="mt-3 block"><span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-muted-foreground">{label}</span><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-border bg-background/50 px-3 py-2.5 text-xs outline-none focus:border-primary"/></label>; }
