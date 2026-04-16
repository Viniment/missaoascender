import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronUp, ChevronDown, ArrowLeft, Save } from 'lucide-react';
import { STEP_LABELS } from './ritualDefaults';
import type { Ritual, RitualStep, RitualIntensity, NarrationStyle, RitualDisplayMode, RitualActionType } from '@/lib/gameStore';
import { toast } from 'sonner';

interface Props {
  ritual: Ritual;
  onBack: () => void;
}

const INTENSITIES: RitualIntensity[] = ['leve', 'medio', 'intenso'];
const STYLES: NarrationStyle[] = ['calmo', 'motivador', 'agressivo', 'neutro'];
const DISPLAY_MODES: RitualDisplayMode[] = ['texto', 'imagens', 'animacoes'];
const ACTIONS: RitualActionType[] = ['quebrar', 'atravessar', 'destruir', 'ignorar', 'personalizado'];

export default function RitualEditor({ ritual, onBack }: Props) {
  const { state, updateRitual } = useGame();
  const [draft, setDraft] = useState<Ritual>(ritual);
  const barriers = state.ritualBarriers || [];
  const visionItems = (state.visionItems || []).filter(v => v.type === 'image' && v.imageUrl);

  const setSteps = (steps: RitualStep[]) => setDraft(d => ({ ...d, steps }));
  const updateStep = (id: string, updates: Partial<RitualStep>) => {
    setSteps(draft.steps.map(s => s.id === id ? { ...s, ...updates } : s));
  };
  const moveStep = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= draft.steps.length) return;
    const arr = [...draft.steps];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setSteps(arr.map((s, i) => ({ ...s, order: i })));
  };

  const handleSave = () => {
    if (!draft.name.trim()) {
      toast.error('Dê um nome ao ritual');
      return;
    }
    updateRitual(ritual.id, draft);
    toast.success('Ritual salvo');
    onBack();
  };

  const toggleVisionItem = (id: string) => {
    const ids = draft.visionItemIds || [];
    setDraft({
      ...draft,
      visionItemIds: ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id],
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" /> Voltar
        </Button>
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4" /> Salvar
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="steps">Etapas</TabsTrigger>
          <TabsTrigger value="narration">Narração</TabsTrigger>
          <TabsTrigger value="loop">Loop</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-3 mt-3">
          <div>
            <Label>Nome</Label>
            <Input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          </div>
          <div>
            <Label>Objetivo</Label>
            <Textarea
              value={draft.objective}
              onChange={e => setDraft({ ...draft, objective: e.target.value })}
              rows={3}
              placeholder="O que você quer alcançar com este ritual?"
            />
          </div>
          <div>
            <Label>Modo de visualização</Label>
            <Select value={draft.displayMode} onValueChange={v => setDraft({ ...draft, displayMode: v as RitualDisplayMode })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DISPLAY_MODES.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {draft.displayMode === 'imagens' && (
            <div>
              <Label className="mb-2 block">Imagens do Vision Board</Label>
              {visionItems.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhuma imagem em "Visualizar".</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {visionItems.map(item => {
                    const selected = (draft.visionItemIds || []).includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => toggleVisionItem(item.id)}
                        className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                          selected ? 'border-primary ring-2 ring-primary/40' : 'border-border opacity-70'
                        }`}
                      >
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="steps" className="space-y-2 mt-3">
          {draft.steps.map((step, idx) => (
            <Card key={step.id} className={`p-3 space-y-2 ${!step.enabled ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Switch
                    checked={step.enabled}
                    onCheckedChange={c => updateStep(step.id, { enabled: c })}
                  />
                  <span className="font-medium text-sm truncate">{STEP_LABELS[step.type]}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => moveStep(idx, 1)} disabled={idx === draft.steps.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Textarea
                value={step.text}
                onChange={e => updateStep(step.id, { text: e.target.value })}
                rows={2}
                className="text-sm"
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Duração (s)</Label>
                  <Input
                    type="number"
                    min={5}
                    max={600}
                    value={step.durationSec}
                    onChange={e => updateStep(step.id, { durationSec: Math.max(5, parseInt(e.target.value) || 5) })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Intensidade</Label>
                  <Select value={step.intensity} onValueChange={v => updateStep(step.id, { intensity: v as RitualIntensity })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INTENSITIES.map(i => <SelectItem key={i} value={i} className="capitalize">{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {step.type === 'barreira' && (
                <div>
                  <Label className="text-xs">Barreira</Label>
                  <Select
                    value={step.barrierId || ''}
                    onValueChange={v => updateStep(step.id, { barrierId: v || undefined })}
                  >
                    <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                    <SelectContent>
                      {barriers.length === 0 ? (
                        <div className="px-2 py-1 text-xs text-muted-foreground">Crie barreiras na biblioteca</div>
                      ) : barriers.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step.type === 'acao' && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Tipo de ação</Label>
                    <Select
                      value={step.actionType || 'atravessar'}
                      onValueChange={v => updateStep(step.id, { actionType: v as RitualActionType })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIONS.map(a => <SelectItem key={a} value={a} className="capitalize">{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  {step.actionType === 'personalizado' && (
                    <Input
                      placeholder="Descreva a ação"
                      value={step.customAction || ''}
                      onChange={e => updateStep(step.id, { customAction: e.target.value })}
                    />
                  )}
                </div>
              )}
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="narration" className="space-y-3 mt-3">
          <div>
            <Label>Estilo</Label>
            <Select value={draft.narrationStyle} onValueChange={v => setDraft({ ...draft, narrationStyle: v as NarrationStyle })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STYLES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Voz automática (TTS)</Label>
              <p className="text-xs text-muted-foreground">Lê o texto em voz alta</p>
            </div>
            <Switch checked={draft.useTTS} onCheckedChange={c => setDraft({ ...draft, useTTS: c })} />
          </div>
        </TabsContent>

        <TabsContent value="loop" className="space-y-3 mt-3">
          <div>
            <Label>Repetições</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={draft.loopCount}
              onChange={e => setDraft({ ...draft, loopCount: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Aumentar intensidade por ciclo</Label>
              <p className="text-xs text-muted-foreground">Cada repetição fica mais intensa</p>
            </div>
            <Switch checked={draft.loopIncreaseIntensity} onCheckedChange={c => setDraft({ ...draft, loopIncreaseIntensity: c })} />
          </div>
          <div>
            <Label>Pausa entre ciclos (s)</Label>
            <Input
              type="number"
              min={0}
              max={60}
              value={draft.loopGapSec}
              onChange={e => setDraft({ ...draft, loopGapSec: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
