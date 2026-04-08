import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export default function AwakeningPage() {
  const { state, updateAwakening } = useGame();

  const fields = [
    { key: 'become' as const, label: 'Quem você quer se tornar', icon: '🔥' },
    { key: 'reject' as const, label: 'O que você rejeita', icon: '⚔️' },
    { key: 'pain' as const, label: 'Qual dor você aceita', icon: '💀' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-2">
        <Eye className="w-8 h-8 text-primary mx-auto animate-pulse-glow" />
        <h2 className="font-display text-xl text-primary glow-text-purple">DESPERTAR</h2>
        <p className="text-sm text-muted-foreground">Defina quem você é. O sistema observa.</p>
      </motion.div>

      {fields.map(({ key, label, icon }) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: fields.indexOf({ key, label, icon }) * 0.15 }}
          className="rpg-panel space-y-2"
        >
          <label className="font-display text-sm text-foreground flex items-center gap-2">
            <span>{icon}</span> {label}
          </label>
          <Textarea
            value={state.awakening[key]}
            onChange={e => updateAwakening(key, e.target.value)}
            placeholder="Escreva aqui..."
            className="bg-secondary/50 border-border min-h-[100px] resize-none"
          />
        </motion.div>
      ))}
    </div>
  );
}
