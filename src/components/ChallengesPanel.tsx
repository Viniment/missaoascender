import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, X, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ChallengesPanel() {
  const { state, addChallenge, completeStep, failChallenge } = useGame();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [steps, setSteps] = useState(['']);
  const submittingRef = useRef(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAdd = () => {
    if (submittingRef.current) return;
    if (!name.trim() || steps.filter(s => s.trim()).length === 0) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addChallenge({
        name,
        steps: steps.filter(s => s.trim()).map(s => ({ id: crypto.randomUUID(), name: s, completed: false })),
      });
      setName('');
      setSteps(['']);
      setShowForm(false);
      toast.success('Desafio criado!');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-primary glow-text-purple flex items-center gap-2">
          <Shield className="w-5 h-5" /> DESAFIOS
        </h2>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> Novo
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="rpg-panel space-y-3">
            <Input placeholder="Nome do desafio" value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border" />
            {steps.map((s, i) => (
              <Input key={i} placeholder={`Etapa ${i + 1}`} value={s} onChange={e => { const n = [...steps]; n[i] = e.target.value; setSteps(n); }} className="bg-secondary border-border" />
            ))}
            <Button variant="secondary" size="sm" onClick={() => setSteps([...steps, ''])}>+ Etapa</Button>
            <Button className="w-full" onClick={handleAdd} disabled={submitting}>Criar Desafio</Button>
          </motion.div>
        )}
      </AnimatePresence>

      {state.challenges.map(c => {
        const allDone = c.steps.every(s => s.completed);
        return (
          <div key={c.id} className={`rpg-panel glow-purple space-y-2 ${c.failed ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="font-display text-sm text-foreground">{c.name}</span>
              {allDone && <span className="text-xs text-success font-display">COMPLETO</span>}
              {c.failed && <span className="text-xs text-destructive font-display">FALHOU</span>}
            </div>
            {c.steps.map(s => (
              <div key={s.id} className="flex items-center gap-2 text-sm">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${s.completed ? 'bg-success border-success' : 'border-muted-foreground'}`}>
                  {s.completed && <Check className="w-3 h-3 text-success-foreground" />}
                </div>
                <span className={s.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>{s.name}</span>
                {!s.completed && !c.failed && (
                  <Button size="icon" variant="ghost" className="h-6 w-6 ml-auto text-success" onClick={() => completeStep(c.id, s.id)}>
                    <Check className="w-3 h-3" />
                  </Button>
                )}
              </div>
            ))}
            {!c.failed && !allDone && (
              <Button size="sm" variant="destructive" className="w-full text-xs" onClick={() => { failChallenge(c.id); toast.error('Desafio reiniciado!'); }}>
                <X className="w-3 h-3 mr-1" /> Falhou — Reiniciar
              </Button>
            )}
          </div>
        );
      })}
      {state.challenges.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum desafio criado.</p>}
    </div>
  );
}
