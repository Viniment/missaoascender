import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Moon, Send, Pencil, Trash2, ChevronDown, ChevronUp, X, Sparkles, Loader2, RefreshCw, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RichEditor from '@/components/RichEditor';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { buildAiContext } from '@/lib/aiContext';
import { getTodayBrasilia } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const EMOTIONS = ['😊', '😢', '😡', '😰', '😌', '🔥', '💀', '🤔', '😤', '🥱'];

interface JournalPrompt { title: string; prompt: string; objective: string; }
interface JournalPromptsResult { mode: 'orgulho' | 'reconexao' | 'neutro'; detectedSignal: string; questions: JournalPrompt[]; }
interface JournalExercise { title: string; description: string; steps: string[]; purpose: string; }

export default function JournalPanel() {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useGame();
  const isMobile = useIsMobile();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [deepMode, setDeepMode] = useState(false);

  // Expand inline
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edit
  const [editEntry, setEditEntry] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editEmotion, setEditEmotion] = useState('');
  const [editIntensity, setEditIntensity] = useState(5);
  const [editDeepMode, setEditDeepMode] = useState(false);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  // IA — perguntas + exercício do dia
  const today = getTodayBrasilia();
  const promptsKey = `journal-prompts-${today}`;
  const exerciseKey = `journal-exercise-${today}`;
  const [prompts, setPrompts] = useState<JournalPromptsResult | null>(() => {
    try { const raw = localStorage.getItem(promptsKey); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [exercise, setExercise] = useState<JournalExercise | null>(() => {
    try { const raw = localStorage.getItem(exerciseKey); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [loadingPrompts, setLoadingPrompts] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);

  useEffect(() => {
    if (prompts) try { localStorage.setItem(promptsKey, JSON.stringify(prompts)); } catch {}
  }, [prompts, promptsKey]);
  useEffect(() => {
    if (exercise) try { localStorage.setItem(exerciseKey, JSON.stringify(exercise)); } catch {}
  }, [exercise, exerciseKey]);

  const fetchPrompts = async () => {
    if (loadingPrompts) return;
    setLoadingPrompts(true);
    try {
      const ctx = buildAiContext(state);
      const { data, error } = await supabase.functions.invoke('journal-prompts', { body: { context: ctx } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPrompts(data as JournalPromptsResult);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao gerar perguntas.';
      if (msg.includes('429')) toast.error('Limite de requisições. Aguarde alguns segundos.');
      else if (msg.includes('402')) toast.error('Créditos insuficientes na IA.');
      else toast.error(msg);
    } finally { setLoadingPrompts(false); }
  };

  const fetchExercise = async () => {
    if (loadingExercise) return;
    setLoadingExercise(true);
    try {
      const ctx = buildAiContext(state);
      const { data, error } = await supabase.functions.invoke('journal-exercise', { body: { context: ctx } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setExercise(data as JournalExercise);
    } catch (err: any) {
      const msg = err?.message || 'Erro ao gerar exercício.';
      if (msg.includes('429')) toast.error('Limite de requisições. Aguarde alguns segundos.');
      else if (msg.includes('402')) toast.error('Créditos insuficientes na IA.');
      else toast.error(msg);
    } finally { setLoadingExercise(false); }
  };

  const usePromptInEditor = (p: JournalPrompt) => {
    setTitle(p.title);
    const blockquote = `<blockquote><p><em>${p.prompt}</em></p></blockquote><p></p>`;
    setText(prev => (prev && prev !== '<p></p>') ? `${blockquote}${prev}` : blockquote);
    toast.success('Pergunta adicionada ao diário.');
    setTimeout(() => document.querySelector('.ProseMirror')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };

  const useExerciseInEditor = (e: JournalExercise) => {
    setTitle(e.title);
    const steps = e.steps.map((s, i) => `<li>${s}</li>`).join('');
    const html = `<p><strong>${e.description}</strong></p><ol>${steps}</ol><p><em>${e.purpose}</em></p><p></p>`;
    setText(prev => (prev && prev !== '<p></p>') ? `${html}${prev}` : html);
    toast.success('Exercício adicionado ao diário.');
    setTimeout(() => document.querySelector('.ProseMirror')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  };

  const handleSave = () => {
    if (submittingRef.current) return;
    if (!title.trim() || !text.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addJournalEntry({ title, date: new Date().toISOString(), text, emotion: emotion || undefined, intensity, deepMode });
      const xp = 20 + (text.length > 500 ? 10 : 0) + (deepMode ? 30 : 0);
      toast.success(`Entrada salva! +${xp} XP`);
      setTitle(''); setText(''); setEmotion(''); setIntensity(5); setDeepMode(false);
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const openEdit = (id: string) => {
    const entry = state.journal.find(e => e.id === id);
    if (!entry) return;
    setEditEntry(id);
    setEditTitle(entry.title || '');
    setEditText(entry.text);
    setEditEmotion(entry.emotion || '');
    setEditIntensity(entry.intensity || 5);
    setEditDeepMode(entry.deepMode || false);
  };

  const saveEdit = () => {
    if (submittingRef.current) return;
    if (!editEntry || !editTitle.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      updateJournalEntry(editEntry, {
        title: editTitle, text: editText, emotion: editEmotion || undefined,
        intensity: editIntensity, deepMode: editDeepMode,
      });
      toast.success('Entrada atualizada!');
      setEditEntry(null);
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const EditContent = editEntry ? (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">Editar Entrada</span>
        <Button size="icon" variant="ghost" onClick={() => setEditEntry(null)} className="h-7 w-7 text-foreground/70 hover:text-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>
      <Input placeholder="Título *" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-secondary/50" />
      <RichEditor content={editText} onChange={setEditText} placeholder="Escreva..." />
      <div>
        <label className="text-xs text-foreground/60">Emoção</label>
        <div className="flex gap-1 mt-1">
          {EMOTIONS.map(e => (
            <button key={e} onClick={() => setEditEmotion(editEmotion === e ? '' : e)}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition ${editEmotion === e ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'bg-secondary hover:bg-secondary/80'}`}>
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-xs text-foreground/60">Intensidade: {editIntensity}/10</label>
        <input type="range" min="1" max="10" value={editIntensity} onChange={e => setEditIntensity(Number(e.target.value))} className="w-full mt-1 accent-primary" />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant={editDeepMode ? 'default' : 'secondary'} onClick={() => setEditDeepMode(!editDeepMode)} className="text-xs">
          <Moon className="w-3.5 h-3.5 mr-1" /> Modo Profundo
        </Button>
      </div>
      <Button className="w-full" onClick={saveEdit} disabled={!editTitle.trim() || submitting}>
        <Send className="w-4 h-4 mr-2" /> Salvar Alterações
      </Button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> DIÁRIO
      </h2>

      {/* IA — perguntas e exercício do dia */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel border-primary/30 bg-gradient-to-br from-primary/5 to-transparent space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-primary/80 font-display flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> ✨ Hoje a IA propõe
          </p>
          {(prompts || exercise) && (
            <span className="text-[10px] text-foreground/50">guarda do dia · {today}</span>
          )}
        </div>

        {!prompts && !exercise && (
          <p className="text-xs text-foreground/60 italic">
            A IA lê seus últimos 7 dias e propõe perguntas e um exercício curto feitos só para hoje.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="border-primary/40 hover:bg-primary/10 text-xs" onClick={fetchPrompts} disabled={loadingPrompts}>
            {loadingPrompts ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : (prompts ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 text-primary" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />)}
            {prompts ? 'Atualizar perguntas' : 'Gerar perguntas do dia'}
          </Button>
          <Button variant="outline" size="sm" className="border-primary/40 hover:bg-primary/10 text-xs" onClick={fetchExercise} disabled={loadingExercise}>
            {loadingExercise ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Heart className="w-3.5 h-3.5 mr-1.5 text-primary" />}
            {exercise ? 'Novo exercício' : 'Exercício de reconexão'}
          </Button>
        </div>

        {prompts && (
          <div className="space-y-2 pt-1">
            <p className="text-[10px] text-foreground/50 uppercase tracking-wider">
              {prompts.mode === 'orgulho' ? '👑 modo orgulho' : prompts.mode === 'reconexao' ? '🤍 modo reconexão' : '🌿 modo neutro'} · <span className="italic normal-case">{prompts.detectedSignal}</span>
            </p>
            {prompts.questions.map((p, i) => (
              <button key={i} type="button" onClick={() => usePromptInEditor(p)} className="w-full text-left p-3 rounded-md bg-background/40 border border-border/40 hover:border-primary/40 transition group">
                <p className="text-xs font-semibold text-foreground group-hover:text-primary">{p.title}</p>
                <p className="text-sm text-foreground/85 mt-1">{p.prompt}</p>
                <p className="text-[10px] text-foreground/50 italic mt-1">{p.objective}</p>
              </button>
            ))}
          </div>
        )}

        {exercise && (
          <div className="p-3 rounded-md bg-background/40 border border-border/40 space-y-2">
            <p className="text-xs font-semibold text-primary">🌱 {exercise.title}</p>
            <p className="text-sm text-foreground/85">{exercise.description}</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-foreground/80">
              {exercise.steps.map((s, i) => <li key={i}>{s}</li>)}
            </ol>
            <p className="text-[10px] text-foreground/50 italic">{exercise.purpose}</p>
            <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => useExerciseInEditor(exercise)}>
              <Send className="w-3 h-3 mr-1.5" /> Usar no diário
            </Button>
          </div>
        )}
      </motion.div>

      {/* New entry form */}
      <div className={`rpg-panel space-y-3 transition-all duration-500 ${deepMode ? 'bg-background border-primary/50 glow-purple-strong' : ''}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs text-foreground/60">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <Button size="sm" variant={deepMode ? 'default' : 'secondary'} onClick={() => setDeepMode(!deepMode)} className="text-xs shrink-0">
            <Moon className="w-3.5 h-3.5 mr-1" /> Modo Profundo
          </Button>
        </div>

        <Input placeholder="Título da entrada *" value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary/50 border-border" />

        <RichEditor content={text} onChange={setText} placeholder="Escreva livremente..." />

        <div>
          <label className="text-xs text-foreground/60">Emoção (opcional)</label>
          <div className="flex gap-1 mt-1">
            {EMOTIONS.map(e => (
              <button key={e} onClick={() => setEmotion(emotion === e ? '' : e)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition ${emotion === e ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'bg-secondary hover:bg-secondary/80'}`}>
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-foreground/60">Intensidade: {intensity}/10</label>
          <input type="range" min="1" max="10" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full mt-1 accent-primary" />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={!title.trim() || !text.trim() || submitting}>
          <Send className="w-4 h-4 mr-2" /> Salvar Entrada
        </Button>
      </div>

      {/* Previous entries - expandable like Awakening */}
      {state.journal.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-foreground/50 uppercase tracking-wider font-display">Entradas Anteriores</h3>
          {state.journal.map(entry => {
            const isExpanded = expandedId === entry.id;
            return (
              <motion.div key={entry.id} className="rpg-panel glow-purple" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {entry.emotion && <span>{entry.emotion}</span>}
                      <span className="text-sm font-semibold text-foreground">{entry.title || 'Sem título'}</span>
                      {entry.deepMode && <span className="text-primary text-xs">🌑</span>}
                    </div>
                    <span className="text-xs text-foreground/50">{new Date(entry.date).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground/70 hover:text-primary" onClick={(e) => { e.stopPropagation(); openEdit(entry.id); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir entrada?</AlertDialogTitle>
                          <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => { deleteJournalEntry(entry.id); toast.success('Entrada excluída'); }}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/70" /> : <ChevronDown className="w-4 h-4 text-foreground/70" />}
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-border"
                    >
                      <div className="flex items-center gap-2 text-xs text-foreground/50 mb-2">
                        {entry.emotion && <span>{entry.emotion}</span>}
                        {entry.deepMode && <span className="text-primary">🌑 Modo Profundo</span>}
                        {entry.intensity && <span>Intensidade: {entry.intensity}/10</span>}
                      </div>
                      <div
                        className="prose prose-invert prose-sm max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: entry.text }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Insights */}
      {state.journal.length >= 5 && <InsightsSection />}

      {/* Edit Modal */}
      {isMobile ? (
        <Drawer open={!!editEntry} onOpenChange={o => !o && setEditEntry(null)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader><DrawerTitle>Editar Entrada</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{EditContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!editEntry} onOpenChange={o => !o && setEditEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Entrada</DialogTitle></DialogHeader>
            {EditContent}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InsightsSection() {
  const { state } = useGame();
  const total = state.journal.length;
  const deepEntries = state.journal.filter(e => e.deepMode).length;
  const avgIntensity = state.journal.reduce((a, e) => a + (e.intensity || 5), 0) / total;
  const longEntries = state.journal.filter(e => e.text.length > 500).length;

  return (
    <div className="rpg-panel">
      <h4 className="text-xs text-foreground/50 uppercase tracking-wider mb-2 font-display">🧠 INSIGHTS</h4>
      <div className="space-y-1 text-sm text-foreground/80">
        <p>📊 {total} entradas no total</p>
        <p>🌑 {deepEntries} em modo profundo</p>
        <p>📝 {longEntries} entradas longas</p>
        <p>💎 Intensidade média: {avgIntensity.toFixed(1)}/10</p>
        {avgIntensity > 7 && <p className="text-primary italic">"Você escreve mais quando está sob pressão."</p>}
      </div>
    </div>
  );
}
