import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { BookOpen, Moon, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const EMOTIONS = ['😊', '😢', '😡', '😰', '😌', '🔥', '💀', '🤔', '😤', '🥱'];

export default function JournalPanel() {
  const { state, addJournalEntry } = useGame();
  const [text, setText] = useState('');
  const [emotion, setEmotion] = useState('');
  const [intensity, setIntensity] = useState(5);
  const [deepMode, setDeepMode] = useState(false);

  const handleSave = () => {
    if (!text.trim()) return;
    addJournalEntry({
      date: new Date().toISOString(),
      text,
      emotion: emotion || undefined,
      intensity,
      deepMode,
    });
    const xp = 20 + (text.length > 500 ? 10 : 0) + (deepMode ? 30 : 0);
    toast.success(`Entrada salva! +${xp} XP`);
    setText('');
    setEmotion('');
    setIntensity(5);
    setDeepMode(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> DIÁRIO
      </h2>

      <div className={`rpg-panel space-y-3 transition-all duration-500 ${deepMode ? 'bg-background border-primary/50 glow-purple-strong' : ''}`}>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          <Button
            size="sm"
            variant={deepMode ? 'default' : 'secondary'}
            onClick={() => setDeepMode(!deepMode)}
            className="text-xs"
          >
            <Moon className="w-3.5 h-3.5 mr-1" /> Modo Profundo
          </Button>
        </div>

        <Textarea
          placeholder="Escreva livremente..."
          value={text}
          onChange={e => setText(e.target.value)}
          className={`min-h-[200px] bg-secondary/50 border-border resize-none text-base font-body ${deepMode ? 'bg-background/50 text-foreground' : ''}`}
        />

        <div>
          <label className="text-xs text-muted-foreground">Emoção (opcional)</label>
          <div className="flex gap-1 mt-1">
            {EMOTIONS.map(e => (
              <button
                key={e}
                onClick={() => setEmotion(emotion === e ? '' : e)}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-lg transition ${emotion === e ? 'bg-primary/20 ring-1 ring-primary scale-110' : 'bg-secondary hover:bg-secondary/80'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground">Intensidade: {intensity}/10</label>
          <input
            type="range"
            min="1"
            max="10"
            value={intensity}
            onChange={e => setIntensity(Number(e.target.value))}
            className="w-full mt-1 accent-primary"
          />
        </div>

        <Button className="w-full" onClick={handleSave} disabled={!text.trim()}>
          <Send className="w-4 h-4 mr-2" /> Salvar Entrada
        </Button>
      </div>

      {/* Previous entries */}
      {state.journal.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs text-muted-foreground uppercase tracking-wider">Entradas Anteriores</h3>
          {state.journal.slice(0, 5).map(entry => (
            <motion.div key={entry.id} className="rpg-panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.date).toLocaleDateString('pt-BR')}
                  {entry.deepMode && <span className="ml-1 text-primary">🌑</span>}
                </span>
                {entry.emotion && <span>{entry.emotion}</span>}
              </div>
              <p className="text-sm text-foreground/80 line-clamp-3">{entry.text}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Insights */}
      {state.journal.length >= 5 && <InsightsSection />}
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
