import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { type Punishment, type PunishmentCategory, type PunishmentIntensity } from '@/lib/gameStore';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skull, Plus, Trash2, Shuffle, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES: PunishmentCategory[] = ['Restrição', 'Financeira', 'Física', 'Esforço', 'Mental', 'Controle'];
const INTENSITIES: PunishmentIntensity[] = ['Leve', 'Média', 'Pesada'];

const CATEGORY_EMOJI: Record<PunishmentCategory, string> = {
  'Restrição': '⛔',
  'Financeira': '💸',
  'Física': '🔴',
  'Esforço': '🧩',
  'Mental': '🧠',
  'Controle': '⏳',
};

const INTENSITY_COLOR: Record<PunishmentIntensity, string> = {
  'Leve': 'text-green-400',
  'Média': 'text-warning',
  'Pesada': 'text-destructive',
};

export default function FailureProtocolSettings() {
  const { state, setState } = useGame();
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [newPunishment, setNewPunishment] = useState({
    name: '',
    description: '',
    category: 'Física' as PunishmentCategory,
    intensity: 'Leve' as PunishmentIntensity,
  });

  const punishments = state.punishments || [];
  const randomMode = state.randomPunishmentMode ?? true;

  const togglePunishment = (id: string) => {
    setState(prev => ({
      ...prev,
      punishments: (prev.punishments || []).map(p =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const deletePunishment = (id: string) => {
    setState(prev => ({
      ...prev,
      punishments: (prev.punishments || []).filter(p => p.id !== id),
    }));
    setDeleteId(null);
    toast.success('Punição removida.');
  };

  const addPunishment = () => {
    if (!newPunishment.name.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }
    const punishment: Punishment = {
      id: crypto.randomUUID(),
      name: newPunishment.name.trim(),
      description: newPunishment.description.trim() || undefined,
      category: newPunishment.category,
      intensity: newPunishment.intensity,
      enabled: true,
      isCustom: true,
    };
    setState(prev => ({
      ...prev,
      punishments: [...(prev.punishments || []), punishment],
    }));
    setNewPunishment({ name: '', description: '', category: 'Física', intensity: 'Leve' });
    setShowAddForm(false);
    toast.success('Punição adicionada!');
  };

  const toggleRandomMode = (checked: boolean) => {
    setState(prev => ({ ...prev, randomPunishmentMode: checked }));
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = punishments.filter(p => p.category === cat);
    return acc;
  }, {} as Record<PunishmentCategory, Punishment[]>);

  return (
    <div className="rpg-panel space-y-4">
      <h2 className="font-display text-sm text-primary flex items-center gap-2">
        <Skull className="w-4 h-4" /> PROTOCOLO DE FALHA
      </h2>
      <p className="text-xs text-muted-foreground italic">"Você define as consequências."</p>

      {/* Random Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-2">
          <Shuffle className="w-4 h-4 text-primary" />
          <div>
            <span className="text-sm font-body">Modo Aleatório</span>
            <p className="text-xs text-muted-foreground">
              {randomMode ? '🎲 Sistema escolhe punição aleatória entre as ativas' : 'Punição definida manualmente'}
            </p>
          </div>
        </div>
        <Switch checked={randomMode} onCheckedChange={toggleRandomMode} />
      </div>

      {/* Punishment List by Category */}
      {CATEGORIES.map(cat => {
        const items = grouped[cat];
        if (items.length === 0) return null;
        return (
          <div key={cat} className="space-y-1">
            <h3 className="text-xs font-display text-muted-foreground tracking-wider">
              {CATEGORY_EMOJI[cat]} {cat.toUpperCase()}
            </h3>
            {items.map(p => (
              <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-secondary/50 transition-colors">
                <Switch
                  checked={p.enabled}
                  onCheckedChange={() => togglePunishment(p.id)}
                  className="scale-75"
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-body truncate block">{p.name}</span>
                  {p.description && <span className="text-xs text-muted-foreground truncate block">{p.description}</span>}
                </div>
                <span className={`text-[10px] font-display ${INTENSITY_COLOR[p.intensity]}`}>
                  {p.intensity}
                </span>
                <button
                  onClick={() => setDeleteId(p.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {/* Add Punishment */}
      {showAddForm ? (
        <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-display text-primary">NOVA PUNIÇÃO</span>
            <button onClick={() => setShowAddForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <Input
            placeholder="Nome da punição *"
            value={newPunishment.name}
            onChange={e => setNewPunishment(prev => ({ ...prev, name: e.target.value }))}
            className="bg-secondary border-border h-9 text-sm"
            maxLength={60}
          />
          <Input
            placeholder="Descrição (opcional)"
            value={newPunishment.description}
            onChange={e => setNewPunishment(prev => ({ ...prev, description: e.target.value }))}
            className="bg-secondary border-border h-9 text-sm"
            maxLength={120}
          />
          <div className="flex gap-2">
            <Select
              value={newPunishment.category}
              onValueChange={v => setNewPunishment(prev => ({ ...prev, category: v as PunishmentCategory }))}
            >
              <SelectTrigger className="bg-secondary h-9 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={newPunishment.intensity}
              onValueChange={v => setNewPunishment(prev => ({ ...prev, intensity: v as PunishmentIntensity }))}
            >
              <SelectTrigger className="bg-secondary h-9 text-xs flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INTENSITIES.map(i => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button size="sm" className="w-full" onClick={addPunishment}>
            Salvar
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed border-primary/30 text-primary hover:bg-primary/10"
          onClick={() => setShowAddForm(true)}
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar punição
        </Button>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-destructive">Excluir Punição</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza que deseja excluir esta punição?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && deletePunishment(deleteId)}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
