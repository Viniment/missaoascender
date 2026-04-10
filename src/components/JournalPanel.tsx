import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { BookOpen, Moon, Send, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import RichEditor from '@/components/RichEditor';
import { useIsMobile } from '@/hooks/use-mobile';
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

export default function JournalPanel() {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useGame();
  const isMobile = useIsMobile();

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [deepMode, setDeepMode] = useState(false);

  // View / Edit
  const [viewEntry, setViewEntry] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [editEmotion, setEditEmotion] = useState('');
  const [editIntensity, setEditIntensity] = useState(5);
  const [editDeepMode, setEditDeepMode] = useState(false);

  const handleSave = () => {
    if (!title.trim() || !text.trim()) return;
    addJournalEntry({ title, date: new Date().toISOString(), text, emotion: emotion || undefined, intensity, deepMode });
    const xp = 20 + (text.length > 500 ? 10 : 0) + (deepMode ? 30 : 0);
    toast.success(`Entrada salva! +${xp} XP`);
    setTitle(''); setText(''); setEmotion(''); setIntensity(5); setDeepMode(false);
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
    if (!editEntry || !editTitle.trim()) return;
    updateJournalEntry(editEntry, {
      title: editTitle, text: editText, emotion: editEmotion || undefined,
      intensity: editIntensity, deepMode: editDeepMode,
    });
    toast.success('Entrada atualizada!');
    setEditEntry(null);
  };

  const viewing = viewEntry ? state.journal.find(e => e.id === viewEntry) : null;

  const ViewContent = viewing ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{new Date(viewing.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        {viewing.emotion && <span>{viewing.emotion}</span>}
        {viewing.deepMode && <span className="text-primary">🌑</span>}
      </div>
      <div className="prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: viewing.text }} />
    </div>
  ) : null;

  const EditContent = editEntry ? (
    <div className="space-y-3">
      <Input placeholder="Título *" value={editTitle} onChange={e => setEditTitle(e.target.value)} className="bg-secondary/50" />
      <RichEditor content={editText} onChange={setEditText} placeholder="Escreva..." />
      <div>
        <label className="text-xs text-muted-foreground">Emoção</label>
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
        <label className="text-xs text-muted-foreground">Intensidade: {editIntensity}/10</label>
        <input type="range" min="1" max="10" value={editIntensity} onChange={e => setEditIntensity(Number(e.target.value))} className="w-full mt-1 accent-primary" />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant={editDeepMode ? 'default' : 'secondary'} onClick={() => setEditDeepMode(!editDeepMode)} className="text-xs">
          <Moon className="w-3.5 h-3.5 mr-1" /> Modo Profundo
        </Button>
      </div>
      <Button className="w-full" onClick={saveEdit} disabled={!editTitle.trim()}>
        <Send className="w-4 h-4 mr-2" /> Salvar Alterações
      </Button>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> DIÁRIO
      </h2>

      {/* New entry form */}
      <div className={`rpg-panel space-y-3 transition-all duration-500 ${deepMode ? 'bg-background border-primary/50 glow-purple-strong' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <Button size="sm" variant={deepMode ? 'default' : 'secondary'} onClick={() => setDeepMode(!deepMode)} className="text-xs">
            <Moon className="w-3.5 h-3.5 mr-1" /> Modo Profundo
          </Button>
        </div>

        <Input placeholder="Título da entrada *" value={title} onChange={e => setTitle(e.target.value)} className="bg-secondary/50 border-border" />

        <RichEditor content={text} onChange={setText} placeholder="Escreva livremente..." />

        <div>
          <label className="text-xs text-muted-foreground">Emoção (opcional)</label>
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
          <label className="text-xs text-muted-foreground">Intensidade: {intensity}/10</label>
          <input type="range" min="1" max="10" value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full mt-1 accent-primary" />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={!title.trim() || !text.trim()}>
          <Send className="w-4 h-4 mr-2" /> Salvar Entrada
        </Button>
      </div>

      {/* Previous entries - titles only */}
      {state.journal.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Entradas Anteriores</h3>
          {state.journal.map(entry => (
            <motion.div key={entry.id} className="rpg-panel flex items-center justify-between" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <button className="flex-1 text-left" onClick={() => setViewEntry(entry.id)}>
                <div className="flex items-center gap-2">
                  {entry.emotion && <span>{entry.emotion}</span>}
                  <span className="text-sm font-medium text-foreground">{entry.title || 'Sem título'}</span>
                  {entry.deepMode && <span className="text-primary text-xs">🌑</span>}
                </div>
                <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString('pt-BR')}</span>
              </button>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setViewEntry(entry.id)}>
                  <Eye className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(entry.id)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
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
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Insights */}
      {state.journal.length >= 5 && <InsightsSection />}

      {/* View Modal */}
      {isMobile ? (
        <Drawer open={!!viewEntry} onOpenChange={o => !o && setViewEntry(null)}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader><DrawerTitle>{viewing?.title || 'Entrada'}</DrawerTitle></DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">{ViewContent}</div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!viewEntry} onOpenChange={o => !o && setViewEntry(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{viewing?.title || 'Entrada'}</DialogTitle></DialogHeader>
            {ViewContent}
          </DialogContent>
        </Dialog>
      )}

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
      <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">🧠 INSIGHTS</h4>
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
