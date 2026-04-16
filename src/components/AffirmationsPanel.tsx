import { useState, useCallback, useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sun, Moon, Zap, Heart, Maximize2, Minimize2, RefreshCw, Loader2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type AffirmationMode = 'despertar' | 'noturna' | 'fraqueza' | 'custom';

interface SavedAffirmation {
  id: string;
  text: string;
  type: AffirmationMode;
  date: string;
  favorited: boolean;
}

export default function AffirmationsPanel() {
  const { state, setState } = useGame();
  const [loading, setLoading] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [currentMode, setCurrentMode] = useState<AffirmationMode>('despertar');
  const [animating, setAnimating] = useState(false);
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [weaknessMode, setWeaknessMode] = useState(false);

  // CRUD states
  const [showCreate, setShowCreate] = useState(false);
  const [createText, setCreateText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Slideshow state
  const [slideshowOpen, setSlideshowOpen] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(0);

  const affirmations: SavedAffirmation[] = (state as any).affirmations || [];
  const affirmationHistory: string[] = useMemo(() => (state as any).affirmationHistory || [], [(state as any).affirmationHistory?.length]);
  const favorites = affirmations.filter(a => a.favorited);

  const maxHabitDone = Math.max(0, ...state.habits.map(h => Object.values(h.history).filter(v => v === 'done').length));
  const lastJournal = state.journal.length > 0 ? state.journal[0] : null;

  const generateAffirmation = useCallback(async (mode: AffirmationMode) => {
    if (mode === 'custom') return;
    setLoading(true);
    setCurrentMode(mode);
    setCurrentText('');
    setDisplayedWords([]);

    try {
      const { data, error } = await supabase.functions.invoke('affirmations', {
        body: {
          mode,
          awakening: state.awakening,
          lastJournal: lastJournal ? {
            title: lastJournal.title,
            text: lastJournal.text,
            emotion: lastJournal.emotion,
            intensity: lastJournal.intensity,
            deepMode: lastJournal.deepMode,
          } : null,
          emotion: lastJournal?.emotion,
          habitStreak: maxHabitDone,
          rank: state.rank,
          history: affirmationHistory.slice(0, 5),
        },
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const text = data.affirmation || '';
      setCurrentText(text);

      const newAffirmation: SavedAffirmation = {
        id: crypto.randomUUID(),
        text,
        type: mode,
        date: new Date().toISOString(),
        favorited: false,
      };

      setState((prev: any) => ({
        ...prev,
        affirmations: [newAffirmation, ...(prev.affirmations || [])].slice(0, 50),
        affirmationHistory: [text, ...(prev.affirmationHistory || [])].slice(0, 20),
      }));

      const words = text.split(/\s+/);
      setAnimating(true);
      setDisplayedWords([]);
      for (let i = 0; i < words.length; i++) {
        await new Promise(r => setTimeout(r, 120));
        setDisplayedWords(prev => [...prev, words[i]]);
      }
      setAnimating(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao gerar afirmação');
    } finally {
      setLoading(false);
    }
  }, [state.awakening, lastJournal, maxHabitDone, state.rank, affirmationHistory, setState]);

  const toggleFavorite = useCallback((id: string) => {
    setState((prev: any) => ({
      ...prev,
      affirmations: (prev.affirmations || []).map((a: SavedAffirmation) =>
        a.id === id ? { ...a, favorited: !a.favorited } : a
      ),
    }));
  }, [setState]);

  const deleteAffirmation = useCallback((id: string) => {
    setState((prev: any) => ({
      ...prev,
      affirmations: (prev.affirmations || []).filter((a: SavedAffirmation) => a.id !== id),
    }));
    toast.success('Afirmação excluída');
  }, [setState]);

  const saveEdit = useCallback((id: string) => {
    if (!editText.trim()) return;
    setState((prev: any) => ({
      ...prev,
      affirmations: (prev.affirmations || []).map((a: SavedAffirmation) =>
        a.id === id ? { ...a, text: editText.trim() } : a
      ),
    }));
    setEditingId(null);
    setEditText('');
    toast.success('Afirmação editada');
  }, [editText, setState]);

  const createCustom = useCallback(() => {
    if (!createText.trim()) return;
    const newAff: SavedAffirmation = {
      id: crypto.randomUUID(),
      text: createText.trim(),
      type: 'custom',
      date: new Date().toISOString(),
      favorited: true,
    };
    setState((prev: any) => ({
      ...prev,
      affirmations: [newAff, ...(prev.affirmations || [])].slice(0, 50),
    }));
    setCreateText('');
    setShowCreate(false);
    toast.success('Afirmação criada e favoritada!');
  }, [createText, setState]);

  const enterWeaknessMode = useCallback(() => {
    setWeaknessMode(true);
    setFullscreen(true);
    generateAffirmation('fraqueza');
  }, [generateAffirmation]);

  // Slideshow
  const slideshowItems = favorites;
  const openSlideshow = () => {
    if (slideshowItems.length === 0) return;
    setSlideshowIndex(0);
    setSlideshowOpen(true);
  };

  // Slideshow fullscreen
  if (slideshowOpen && slideshowItems.length > 0) {
    const current = slideshowItems[slideshowIndex];
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black p-8"
      >
        <button
          onClick={() => setSlideshowOpen(false)}
          className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="absolute top-6 left-6 text-white/40 text-sm font-display">
          {slideshowIndex + 1} / {slideshowItems.length}
        </div>

        <div className="max-w-3xl text-center px-4">
          <motion.p
            key={current.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="text-2xl md:text-4xl font-display leading-relaxed text-white"
          >
            "{current.text}"
          </motion.p>
          <span className="text-xs text-white/30 mt-4 block">
            {current.type === 'despertar' ? '🌅' : current.type === 'noturna' ? '🌙' : current.type === 'fraqueza' ? '⚡' : '✍️'}{' '}
            {new Date(current.date).toLocaleDateString('pt-BR')}
          </span>
        </div>

        <div className="absolute bottom-10 flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            disabled={slideshowIndex === 0}
            onClick={() => setSlideshowIndex(i => i - 1)}
            className="text-white/50 hover:text-white h-12 w-12"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={slideshowIndex === slideshowItems.length - 1}
            onClick={() => setSlideshowIndex(i => i + 1)}
            className="text-white/50 hover:text-white h-12 w-12"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Fullscreen single affirmation
  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 ${
            weaknessMode ? 'bg-black' : 'bg-background/95 backdrop-blur-xl'
          }`}
        >
          <button
            onClick={() => { setFullscreen(false); setWeaknessMode(false); }}
            className="absolute top-6 right-6 text-foreground/50 hover:text-foreground transition-colors"
          >
            <Minimize2 className="w-6 h-6" />
          </button>

          <div className="max-w-2xl text-center space-y-8">
            {weaknessMode && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 justify-center">
                <Zap className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm font-display uppercase tracking-widest">Momento de Fraqueza</span>
              </motion.div>
            )}

            <div className={`text-2xl md:text-4xl font-display leading-relaxed ${weaknessMode ? 'text-red-100' : 'text-foreground'}`}>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              ) : (
                displayedWords.map((word, i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.15 }} className="inline-block mr-2">
                    {word}
                  </motion.span>
                ))
              )}
            </div>

            {!loading && !animating && currentText && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => generateAffirmation(currentMode)} className="text-foreground/50 hover:text-foreground">
                  <RefreshCw className="w-4 h-4 mr-2" /> Nova
                </Button>
                {weaknessMode && (
                  <Button variant="ghost" size="sm" onClick={() => { setWeaknessMode(false); setFullscreen(false); }} className="text-foreground/50 hover:text-foreground">
                    Sair do modo
                  </Button>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderAffirmationItem = (aff: SavedAffirmation, compact = false) => {
    const isEditing = editingId === aff.id;
    const typeIcon = aff.type === 'despertar' ? '🌅' : aff.type === 'noturna' ? '🌙' : aff.type === 'fraqueza' ? '⚡' : '✍️';

    if (isEditing) {
      return (
        <div key={aff.id} className="rpg-panel space-y-2">
          <Textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            className="bg-secondary border-border text-sm text-foreground"
            rows={3}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={() => saveEdit(aff.id)} disabled={!editText.trim()}>Salvar</Button>
            <Button size="sm" variant="secondary" onClick={() => { setEditingId(null); setEditText(''); }}>Cancelar</Button>
          </div>
        </div>
      );
    }

    return (
      <div key={aff.id} className="rpg-panel text-sm text-foreground/90">
        <div className="flex items-start justify-between gap-2">
          <p className={`flex-1 ${compact ? '' : 'italic'}`}>
            {compact ? (
              <><span className="mr-1">{typeIcon}</span>{aff.text.length > 80 ? aff.text.substring(0, 80) + '...' : aff.text}</>
            ) : (
              <>"{aff.text}"</>
            )}
          </p>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button
              size="icon"
              variant="ghost"
              className={`h-7 w-7 ${aff.favorited ? 'text-red-400' : 'text-foreground/30 hover:text-red-400'}`}
              onClick={() => toggleFavorite(aff.id)}
            >
              <Heart className={`w-3.5 h-3.5 ${aff.favorited ? 'fill-red-400' : ''}`} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-foreground/30 hover:text-primary"
              onClick={() => { setEditingId(aff.id); setEditText(aff.text); }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-foreground/30 hover:text-destructive"
              onClick={() => deleteAffirmation(aff.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {!compact && (
          <span className="text-xs text-foreground/40 mt-1 block">
            {typeIcon} {new Date(aff.date).toLocaleDateString('pt-BR')}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Flame className="w-5 h-5" /> AFIRMAÇÕES INTELIGENTES
        </h2>
        <div className="flex items-center gap-2">
          {favorites.length > 0 && (
            <Button size="sm" variant="outline" className="text-xs" onClick={openSlideshow}>
              <Play className="w-3.5 h-3.5 mr-1" /> Slideshow
            </Button>
          )}
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setShowCreate(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Criar
          </Button>
        </div>
      </div>

      {/* Create custom affirmation */}
      {showCreate && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display text-foreground">✍️ Criar Afirmação</h3>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground/50" onClick={() => { setShowCreate(false); setCreateText(''); }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Textarea
            placeholder="Escreva sua afirmação pessoal..."
            value={createText}
            onChange={e => setCreateText(e.target.value)}
            className="bg-secondary border-border text-sm text-foreground"
            rows={3}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground/40 flex items-center gap-1">
              <Heart className="w-3 h-3 fill-red-400 text-red-400" /> Será favoritada automaticamente
            </span>
            <Button size="sm" onClick={createCustom} disabled={!createText.trim()}>Salvar</Button>
          </div>
        </motion.div>
      )}

      {/* Mode buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => generateAffirmation('despertar')}
          disabled={loading}
          className="rpg-panel glow-purple flex flex-col items-center gap-2 py-4 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sun className="w-6 h-6 text-yellow-400" />
          <span className="text-sm font-semibold text-foreground">Despertar</span>
          <span className="text-xs text-foreground/60">Afirmação matinal</span>
        </button>

        <button
          onClick={() => generateAffirmation('noturna')}
          disabled={loading}
          className="rpg-panel glow-purple flex flex-col items-center gap-2 py-4 hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Moon className="w-6 h-6 text-blue-400" />
          <span className="text-sm font-semibold text-foreground">Noturna</span>
          <span className="text-xs text-foreground/60">Reflexão do dia</span>
        </button>

        <button
          onClick={enterWeaknessMode}
          disabled={loading}
          className="rpg-panel border-red-500/30 flex flex-col items-center gap-2 py-4 hover:bg-red-500/5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-6 h-6 text-red-400" />
          <span className="text-sm font-semibold text-foreground">Fraqueza</span>
          <span className="text-xs text-foreground/60">Modo confronto</span>
        </button>
      </div>

      {/* Current affirmation */}
      {(currentText || loading) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rpg-panel glow-purple-strong relative">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-primary font-display uppercase tracking-wider">
              {currentMode === 'despertar' ? '🌅 Despertar' : currentMode === 'noturna' ? '🌙 Noturna' : '⚡ Fraqueza'}
            </span>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground/50 hover:text-foreground" onClick={() => setFullscreen(true)}>
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-foreground/50 hover:text-primary" onClick={() => generateAffirmation(currentMode)} disabled={loading}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <div className="text-lg md:text-xl font-display leading-relaxed text-foreground">
            {loading ? (
              <div className="flex items-center gap-2 text-foreground/50">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Gerando afirmação...</span>
              </div>
            ) : (
              displayedWords.map((word, i) => (
                <motion.span key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.1 }} className="inline-block mr-1.5">
                  {word}
                </motion.span>
              ))
            )}
          </div>

          {!loading && currentText && (
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-foreground/50 hover:text-red-400"
                onClick={() => {
                  const latest = affirmations[0];
                  if (latest) toggleFavorite(latest.id);
                }}
              >
                <Heart className={`w-3.5 h-3.5 mr-1 ${affirmations[0]?.favorited ? 'fill-red-400 text-red-400' : ''}`} />
                {affirmations[0]?.favorited ? 'Favoritada' : 'Favoritar'}
              </Button>
            </div>
          )}
        </motion.div>
      )}

      {/* Favorites */}
      {favorites.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-foreground/60 uppercase tracking-wider font-display flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" /> FAVORITAS
          </h3>
          {favorites.map(aff => renderAffirmationItem(aff))}
        </div>
      )}

      {/* Recent history */}
      {affirmations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-foreground/60 uppercase tracking-wider font-display">HISTÓRICO RECENTE</h3>
          {affirmations.slice(0, 5).map(aff => renderAffirmationItem(aff, true))}
        </div>
      )}

      {/* Empty state */}
      {!currentText && !loading && affirmations.length === 0 && !showCreate && (
        <div className="rpg-panel text-center py-8">
          <Flame className="w-10 h-10 text-primary/30 mx-auto mb-3" />
          <p className="text-foreground/60 text-sm">Escolha um modo acima para gerar sua primeira afirmação personalizada.</p>
          <p className="text-foreground/40 text-xs mt-1">Baseada no seu Despertar, Diário e hábitos.</p>
        </div>
      )}
    </div>
  );
}
