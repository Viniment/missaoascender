import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/lib/GameContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, Play, Pencil, Copy, Trash2, ChevronDown, Wand2, Shield } from 'lucide-react';
import { makeDefaultRitual } from './ritual/ritualDefaults';
import RitualEditor from './ritual/RitualEditor';
import RitualRunner from './ritual/RitualRunner';
import BarrierLibrary from './ritual/BarrierLibrary';
import type { Ritual } from '@/lib/gameStore';
import { toast } from 'sonner';

type Mode = 'list' | 'edit' | 'run';

export default function RitualGuidePanel() {
  const { state, addRitual, removeRitual, duplicateRitual } = useGame();
  const rituals = state.rituals || [];
  const [mode, setMode] = useState<Mode>('list');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [barrierOpen, setBarrierOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const activeRitual = rituals.find(r => r.id === activeId);
  const pendingCreateRef = useRef(false);
  const prevCountRef = useRef(rituals.length);

  // When a new ritual is appended after we triggered create, jump to its editor
  useEffect(() => {
    if (pendingCreateRef.current && rituals.length > prevCountRef.current) {
      const created = rituals[rituals.length - 1];
      pendingCreateRef.current = false;
      if (created) {
        setActiveId(created.id);
        setMode('edit');
      }
    }
    prevCountRef.current = rituals.length;
  }, [rituals]);

  const handleCreate = () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      pendingCreateRef.current = true;
      addRitual(makeDefaultRitual());
    } finally {
      setTimeout(() => { submittingRef.current = false; setSubmitting(false); }, 500);
    }
  };

  const handleEdit = (r: Ritual) => { setActiveId(r.id); setMode('edit'); };
  const handleRun = (r: Ritual) => { setActiveId(r.id); setMode('run'); };
  const handleDelete = (r: Ritual) => {
    if (confirm(`Excluir o ritual "${r.name}"?`)) {
      removeRitual(r.id);
      toast.success('Ritual excluído');
    }
  };

  if (mode === 'edit' && activeRitual) {
    return <RitualEditor ritual={activeRitual} onBack={() => setMode('list')} />;
  }
  if (mode === 'run' && activeRitual) {
    return <RitualRunner ritual={activeRitual} onExit={() => setMode('list')} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-primary glow-text-purple flex items-center gap-2">
            <Wand2 className="w-6 h-6" /> Guia de Ritual
          </h1>
          <p className="text-sm text-muted-foreground">Construa seu próprio ritual mental.</p>
        </div>
        <Button onClick={handleCreate} disabled={submitting} size="sm">
          <Plus className="w-4 h-4" /> Novo
        </Button>
      </div>

      {rituals.length === 0 ? (
        <Card className="p-6 text-center space-y-2">
          <Wand2 className="w-10 h-10 mx-auto text-primary/60" />
          <p className="text-sm text-muted-foreground">Nenhum ritual criado ainda.</p>
          <Button onClick={handleCreate} disabled={submitting}>
            <Plus className="w-4 h-4" /> Criar primeiro ritual
          </Button>
        </Card>
      ) : (
        <div className="space-y-2">
          {rituals.map(r => {
            const enabled = r.steps.filter(s => s.enabled).length;
            const totalSec = r.steps.filter(s => s.enabled).reduce((acc, s) => acc + s.durationSec, 0) * r.loopCount;
            return (
              <Card key={r.id} className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg truncate">{r.name}</h3>
                    {r.objective && <p className="text-xs text-muted-foreground line-clamp-2">{r.objective}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {enabled} etapas · ~{Math.round(totalSec / 60)}min · {r.loopCount}× ciclo
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" onClick={() => handleRun(r)} disabled={enabled === 0}>
                    <Play className="w-3.5 h-3.5" /> Iniciar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(r)}>
                    <Pencil className="w-3.5 h-3.5" /> Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => duplicateRitual(r.id)}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(r)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Collapsible open={barrierOpen} onOpenChange={setBarrierOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> Biblioteca de Barreiras ({(state.ritualBarriers || []).length})
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${barrierOpen ? 'rotate-180' : ''}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3">
          <BarrierLibrary />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
