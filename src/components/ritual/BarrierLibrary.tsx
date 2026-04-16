import { useState, useRef } from 'react';
import { useGame } from '@/lib/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Shield } from 'lucide-react';
import type { BarrierType } from '@/lib/gameStore';
import { toast } from 'sonner';

const TYPES: { value: BarrierType; label: string }[] = [
  { value: 'parede', label: 'Parede' },
  { value: 'criatura', label: 'Criatura' },
  { value: 'sombra', label: 'Sombra' },
  { value: 'personalizado', label: 'Personalizado' },
];

export default function BarrierLibrary() {
  const { state, addBarrier, removeBarrier } = useGame();
  const barriers = state.ritualBarriers || [];
  const [name, setName] = useState('');
  const [type, setType] = useState<BarrierType>('parede');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleAdd = () => {
    if (submittingRef.current) return;
    if (!name.trim()) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      addBarrier({ name: name.trim(), type, customDescription: desc.trim() || undefined });
      setName('');
      setDesc('');
      toast.success('Barreira adicionada');
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="p-3 space-y-2">
        <Input placeholder="Nome do bloqueio" value={name} onChange={e => setName(e.target.value)} />
        <div className="flex gap-2">
          <Select value={type} onValueChange={v => setType(v as BarrierType)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={submitting} size="sm">
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>
        {type === 'personalizado' && (
          <Textarea placeholder="Descreva a barreira" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
        )}
      </Card>

      {barriers.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-2">Nenhuma barreira salva.</p>
      ) : (
        <div className="space-y-1.5">
          {barriers.map(b => (
            <div key={b.id} className="flex items-center justify-between p-2 rounded border border-border bg-secondary/30">
              <div className="flex items-center gap-2 min-w-0">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{b.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{b.type}</div>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeBarrier(b.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
