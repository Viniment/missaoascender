import { useMemo, useState } from "react";
import Shell from "@/components/Shell";
import { CalendarDays, CheckCircle2, ChevronDown, ChevronRight, Clock3, ExternalLink, FolderKanban, Plus, Trash2 } from "lucide-react";

type Status = "Backlog" | "A Fazer" | "Em Produção" | "Revisão" | "Concluído";
type Task = { id: string; title: string; status: Status; due: string; priority: "Baixa" | "Média" | "Alta"; links: string; notes: string };
type Project = { id: string; title: string; goal: string; start: string; due: string; description: string; links: string; notes: string; tasks: Task[] };

const STATUSES: Status[] = ["Backlog", "A Fazer", "Em Produção", "Revisão", "Concluído"];
const blankProject = (): Project => ({ id: crypto.randomUUID(), title: "Novo Projeto", goal: "", start: "", due: "", description: "", links: "", notes: "", tasks: [] });

function daysLeft(date: string) {
  if (!date) return null;
  const target = new Date(`${date}T23:59:59`);
  const diff = Math.ceil((target.getTime() - Date.now()) / 86400000);
  return diff;
}

function TaskEditor({ task, onChange }: { task: Task; onChange: (t: Task) => void }) {
  return <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-3 sm:grid-cols-2">
    <input value={task.title} onChange={e => onChange({ ...task, title: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Título da tarefa" />
    <select value={task.status} onChange={e => onChange({ ...task, status: e.target.value as Status })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm">{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
    <select value={task.priority} onChange={e => onChange({ ...task, priority: e.target.value as Task["priority"] })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm"><option>Baixa</option><option>Média</option><option>Alta</option></select>
    <input type="date" value={task.due} onChange={e => onChange({ ...task, due: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
    <input value={task.links} onChange={e => onChange({ ...task, links: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Link / referência" />
    <textarea value={task.notes} onChange={e => onChange({ ...task, notes: e.target.value })} className="min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Anotações, contexto, instruções..." />
  </div>;
}

function ProjectCard({ project, onChange, onDelete }: { project: Project; onChange: (p: Project) => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState(false);
  const remaining = daysLeft(project.due);
  const done = project.tasks.filter(t => t.status === "Concluído").length;
  const progress = project.tasks.length ? Math.round(done / project.tasks.length * 100) : 0;
  const updateTask = (task: Task) => onChange({ ...project, tasks: project.tasks.map(t => t.id === task.id ? task : t) });
  return <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-xl">
    <button type="button" onClick={() => setOpen(v => !v)} className="w-full p-4 text-left transition hover:bg-primary/5">
      <div className="flex items-start gap-3"><div className="mt-0.5 rounded-xl border border-primary/30 bg-primary/10 p-2 text-primary"><FolderKanban className="h-5 w-5" /></div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h2 className="truncate font-display text-base tracking-widest">{project.title || "Sem Título"}</h2>{open ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}</div><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.goal || "Defina a meta principal deste projeto."}</p></div><div className="hidden text-right sm:block"><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Progresso</p><p className="font-display text-lg text-primary">{progress}%</p></div></div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider"><span className="rounded-full border border-border px-2 py-1">{project.tasks.length} tarefas</span>{remaining !== null && <span className={remaining < 0 ? "rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-destructive" : "rounded-full border border-primary/30 bg-primary/10 px-2 py-1 text-primary"}>{remaining < 0 ? `Atrasado ${Math.abs(remaining)}d` : remaining === 0 ? "Vence Hoje" : `${remaining} dias restantes`}</span>}</div>
    </button>
    {open && <div className="border-t border-border p-4 space-y-5">
      <div className="grid gap-3 sm:grid-cols-2"><input value={project.title} onChange={e => onChange({ ...project, title: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold" placeholder="Nome do projeto" /><input value={project.goal} onChange={e => onChange({ ...project, goal: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="Meta principal" /><input type="date" value={project.start} onChange={e => onChange({ ...project, start: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><input type="date" value={project.due} onChange={e => onChange({ ...project, due: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm" /><input value={project.links} onChange={e => onChange({ ...project, links: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm sm:col-span-2" placeholder="Links importantes" /></div>
      <textarea value={project.description} onChange={e => onChange({ ...project, description: e.target.value })} className="min-h-28 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm" placeholder="Descrição e contexto do projeto..." />
      <div className="rounded-xl border border-border bg-background/30 p-3"><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-xs uppercase tracking-widest">Anotações</h3>{project.links && <a href={project.links.split(/\s+/)[0]} target="_blank" rel="noreferrer" className="text-primary"><ExternalLink className="h-4 w-4" /></a>}</div><textarea value={project.notes} onChange={e => onChange({ ...project, notes: e.target.value })} className="min-h-40 w-full rounded-lg border border-border bg-background px-3 py-3 text-sm leading-6" placeholder="Escreva livremente sobre o projeto, decisões, ideias, referências, próximos passos..." /></div>
      <div><div className="mb-3 flex items-center justify-between"><h3 className="font-display text-xs uppercase tracking-widest">Tarefas</h3><button type="button" onClick={() => setNewTask(true)} className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1.5 text-xs text-primary"><Plus className="h-3.5 w-3.5" /> Nova</button></div><div className="space-y-2">{project.tasks.map(t => <div key={t.id}><TaskEditor task={t} onChange={updateTask} /></div>)}{newTask && <div className="rounded-xl border border-primary/30 bg-primary/5 p-3"><TaskEditor task={{ id: crypto.randomUUID(), title: "", status: "A Fazer", due: "", priority: "Média", links: "", notes: "" }} onChange={t => { if (t.title.trim()) onChange({ ...project, tasks: [...project.tasks, t] }); setNewTask(false); }} /><p className="mt-2 text-[10px] text-muted-foreground">Preencha o título para adicionar a tarefa.</p></div>}</div></div>
      <div className="flex justify-end"><button type="button" onClick={onDelete} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /> Excluir Projeto</button></div>
    </div>}
  </div>;
}

export default function Projetos() {
  const [projects, setProjects] = useState<Project[]>(() => { try { return JSON.parse(localStorage.getItem("ascensao:projetos") || "[]"); } catch { return []; } });
  const [filter, setFilter] = useState<"todos" | Status>("todos");
  const save = (next: Project[]) => { setProjects(next); localStorage.setItem("ascensao:projetos", JSON.stringify(next)); };
  const stats = useMemo(() => ({ tasks: projects.reduce((n,p) => n + p.tasks.length, 0), done: projects.reduce((n,p) => n + p.tasks.filter(t => t.status === "Concluído").length, 0) }), [projects]);
  const visible = filter === "todos" ? projects : projects.filter(p => p.tasks.some(t => t.status === filter));
  return <Shell><div className="space-y-6">
    <header><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">CENTRAL DE PROJETOS</p><h1 className="mt-1 font-display text-2xl tracking-[0.16em]">ORGANIZAÇÃO</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Organize projetos, metas, prazos, tarefas, links e anotações em um único lugar.</p></div><button onClick={() => save([...projects, blankProject()])} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-lg"><Plus className="h-4 w-4" /> Novo Projeto</button></div></header>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-xl border border-border bg-card/70 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Projetos</p><p className="font-display text-xl">{projects.length}</p></div><div className="rounded-xl border border-border bg-card/70 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Tarefas</p><p className="font-display text-xl">{stats.tasks}</p></div><div className="rounded-xl border border-border bg-card/70 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Concluídas</p><p className="font-display text-xl text-primary">{stats.done}</p></div><div className="rounded-xl border border-border bg-card/70 p-3"><p className="text-[9px] uppercase tracking-widest text-muted-foreground">Hoje</p><p className="font-display text-xl"><CalendarDays className="inline h-5 w-5" /></p></div></div>
    <div className="flex gap-2 overflow-x-auto pb-1">{(["todos", ...STATUSES] as const).map(s => <button key={s} onClick={() => setFilter(s)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${filter === s ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"}`}>{s === "todos" ? "Todos" : s}</button>)}</div>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><FolderKanban className="mx-auto h-10 w-10 text-muted-foreground" /><p className="mt-3 font-display tracking-widest">NENHUM PROJETO AINDA</p><p className="mt-1 text-sm text-muted-foreground">Crie seu primeiro projeto e comece a organizar sua produção.</p></div> : <div className="space-y-3">{visible.map(p => <ProjectCard key={p.id} project={p} onChange={np => save(projects.map(x => x.id === np.id ? np : x))} onDelete={() => save(projects.filter(x => x.id !== p.id))} />)}</div>}
    <div className="rounded-xl border border-border bg-card/50 p-3 text-xs text-muted-foreground"><Clock3 className="mr-1 inline h-4 w-4" /> Os dados desta central ficam salvos neste dispositivo. Use os prazos e a contagem regressiva para decidir o que precisa acontecer primeiro.</div>
  </div></Shell>;
}
