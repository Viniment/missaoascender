import { useState, useCallback, useMemo } from 'react';
import { useGame } from '@/lib/GameContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Sun, Moon, Zap, Heart, Maximize2, Minimize2, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type AffirmationMode = 'despertar' | 'noturna' | 'fraqueza';

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

  const affirmations: SavedAffirmation[] = (state as any).affirmations || [];
  const affirmationHistory: string[] = useMemo(() => (state as any).affirmationHistory || [], [(state as any).affirmationHistory?.length]);
  const favorites = affirmations.filter(a => a.favorited);

  const maxHabitDone = Math.max(0, ...state.habits.map(h => Object.values(h.history).filter(v => v === 'done').length));
  const lastJournal = state.journal.length > 0 ? state.journal[0] : null;

  const generateAffirmation = useCallback(async (mode: AffirmationMode) => {
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
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const text = data.affirmation || '';
      setCurrentText(text);

      // Save to state
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

      // Word-by-word animation
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

  const enterWeaknessMode = useCallback(() => {
    setWeaknessMode(true);
    setFullscreen(true);
    generateAffirmation('fraqueza');
  }, [generateAffirmation]);

  const exitWeaknessMode = useCallback(() => {
    setWeaknessMode(false);
    setFullscreen(false);
  }, []);

  // Fullscreen overlay
  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 ${
            weaknessMode
              ? 'bg-black'
              : 'bg-background/95 backdrop-blur-xl'
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
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 justify-center"
              >
                <Zap className="w-5 h-5 text-red-400" />
                <span className="text-red-400 text-sm font-display uppercase tracking-widest">Momento de Fraqueza</span>
              </motion.div>
            )}

            <div className={`text-2xl md:text-4xl font-display leading-relaxed ${
              weaknessMode ? 'text-red-100' : 'text-foreground'
            }`}>
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              ) : (
                displayedWords.map((word, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="inline-block mr-2"
                  >
                    {word}
                  </motion.span>
                ))
              )}
            </div>

            {!loading && !animating && currentText && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => generateAffirmation(currentMode)}
                  className="text-foreground/50 hover:text-foreground"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Nova
                </Button>
                {weaknessMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={exitWeaknessMode}
                    className="text-foreground/50 hover:text-foreground"
                  >
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

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <Flame className="w-5 h-5" /> AFIRMAÇÕES INTELIGENTES
      </h2>

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rpg-panel glow-purple-strong relative"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-primary font-display uppercase tracking-wider">
              {currentMode === 'despertar' ? '🌅 Despertar' : currentMode === 'noturna' ? '🌙 Noturna' : '⚡ Fraqueza'}
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-foreground/50 hover:text-foreground"
                onClick={() => setFullscreen(true)}
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-foreground/50 hover:text-primary"
                onClick={() => generateAffirmation(currentMode)}
                disabled={loading}
              >
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
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.1 }}
                  className="inline-block mr-1.5"
                >
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
          {favorites.map(aff => (
            <motion.div
              key={aff.id}
              className="rpg-panel text-sm text-foreground/90"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="flex-1 italic">"{aff.text}"</p>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 flex-shrink-0 text-red-400"
                  onClick={() => toggleFavorite(aff.id)}
                >
                  <Heart className="w-3 h-3 fill-red-400" />
                </Button>
              </div>
              <span className="text-xs text-foreground/40 mt-1 block">
                {aff.type === 'despertar' ? '🌅' : aff.type === 'noturna' ? '🌙' : '⚡'}{' '}
                {new Date(aff.date).toLocaleDateString('pt-BR')}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {/* Recent history */}
      {affirmations.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-foreground/60 uppercase tracking-wider font-display">HISTÓRICO RECENTE</h3>
          {affirmations.slice(0, 5).map(aff => (
            <div key={aff.id} className="rpg-panel text-xs text-foreground/70 flex items-start justify-between gap-2">
              <div className="flex-1">
                <span className="mr-1">{aff.type === 'despertar' ? '🌅' : aff.type === 'noturna' ? '🌙' : '⚡'}</span>
                {aff.text.length > 80 ? aff.text.substring(0, 80) + '...' : aff.text}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className={`h-6 w-6 flex-shrink-0 ${aff.favorited ? 'text-red-400' : 'text-foreground/30 hover:text-red-400'}`}
                onClick={() => toggleFavorite(aff.id)}
              >
                <Heart className={`w-3 h-3 ${aff.favorited ? 'fill-red-400' : ''}`} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!currentText && !loading && affirmations.length === 0 && (
        <div className="rpg-panel text-center py-8">
          <Flame className="w-10 h-10 text-primary/30 mx-auto mb-3" />
          <p className="text-foreground/60 text-sm">Escolha um modo acima para gerar sua primeira afirmação personalizada.</p>
          <p className="text-foreground/40 text-xs mt-1">Baseada no seu Despertar, Diário e hábitos.</p>
        </div>
      )}
    </div>
  );
}
