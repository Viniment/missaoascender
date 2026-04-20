import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Plus, X, Edit3, Zap, Eye, Skull, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { defaultIdentity } from '@/lib/gameStore';
import IdentityRitualDialog from './IdentityRitualDialog';
import { toast } from 'sonner';

type Mode = 'panel' | 'setup';

const TRAIT_SUGGESTIONS = ['Disciplinado', 'Consistente', 'Direto', 'Resiliente', 'Focado', 'Implacável', 'Honesto', 'Paciente'];
const PATTERN_SUGGESTIONS = ['Procrastinação', 'Fuga', 'Distração', 'Abandono', 'Justificativa', 'Vitimização', 'Perfeccionismo', 'Auto-engano'];

export default function IdentityPanel() {
  const { state, updateIdentity, toggleIdentitySystem, markRitualDone } = useGame();
  const identity = state.identity || defaultIdentity;
  const isConfigured = identity.newIdentity.trim().length > 0;
  const [mode, setMode] = useState<Mode>(isConfigured ? 'panel' : 'setup');
  const [immersive, setImmersive] = useState(false);
  const [ritual, setRitual] = useState(false);

  // Setup form state
  const [newIdentity, setNewIdentity] = useState(identity.newIdentity);
  const [codeOfConduct, setCodeOfConduct] = useState<string[]>(identity.codeOfConduct.length ? identity.codeOfConduct : ['']);
  const [traits, setTraits] = useState<string[]>(identity.dominantTraits);
  const [patterns, setPatterns] = useState<string[]>(identity.oldPatterns);
  const [excuses, setExcuses] = useState<string[]>(identity.oldExcuses);
  const [traitInput, setTraitInput] = useState('');
  const [patternInput, setPatternInput] = useState('');
  const [excuseInput, setExcuseInput] = useState('');

  const addToList = (list: string[], setter: (v: string[]) => void, value: string) => {
    const v = value.trim();
    if (!v || list.includes(v)) return;
    setter([...list, v]);
  };
  const removeFromList = (list: string[], setter: (v: string[]) => void, idx: number) => {
    setter(list.filter((_, i) => i !== idx));
  };

  const saveSetup = () => {
    const cleanCode = codeOfConduct.map(c => c.trim()).filter(Boolean);
    if (!newIdentity.trim()) { toast.error('Defina quem você está se tornando.'); return; }
    if (cleanCode.length < 3) { toast.error('Defina pelo menos 3 regras de conduta.'); return; }
    updateIdentity({
      newIdentity: newIdentity.trim(),
      codeOfConduct: cleanCode.slice(0, 5),
      dominantTraits: traits,
      oldPatterns: patterns,
      oldExcuses: excuses,
    });
    toast.success('Identidade definida.');
    setMode('panel');
  };

  if (mode === 'setup') {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display tracking-wide">
            <User className="w-5 h-5 text-primary" />
            Definir Identidade
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Não é motivação. É recondicionamento. Defina quem você é — não quem você sente que é.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <Label className="text-xs">Quem você está se tornando</Label>
            <Textarea
              value={newIdentity}
              onChange={e => setNewIdentity(e.target.value)}
              placeholder="Ex: Sou um executor disciplinado que age independente de vontade."
              className="mt-1 min-h-[80px]"
              maxLength={300}
            />
          </div>

          <div>
            <Label className="text-xs">Código de Conduta (3 a 5 regras inegociáveis)</Label>
            <div className="space-y-2 mt-1">
              {codeOfConduct.map((rule, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-xs text-primary font-display w-5 pt-2.5">{i + 1}.</span>
                  <Input
                    value={rule}
                    onChange={e => {
                      const next = [...codeOfConduct];
                      next[i] = e.target.value;
                      setCodeOfConduct(next);
                    }}
                    placeholder="Ex: Eu executo independente de vontade"
                    maxLength={120}
                  />
                  {codeOfConduct.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => setCodeOfConduct(codeOfConduct.filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              {codeOfConduct.length < 5 && (
                <Button variant="outline" size="sm" onClick={() => setCodeOfConduct([...codeOfConduct, ''])}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar regra
                </Button>
              )}
            </div>
          </div>

          <ChipEditor
            label="Traços dominantes"
            items={traits}
            input={traitInput}
            setInput={setTraitInput}
            onAdd={() => { addToList(traits, setTraits, traitInput); setTraitInput(''); }}
            onRemove={(i) => removeFromList(traits, setTraits, i)}
            suggestions={TRAIT_SUGGESTIONS.filter(s => !traits.includes(s))}
            onSuggest={(s) => addToList(traits, setTraits, s)}
          />

          <ChipEditor
            label="Padrões do eu antigo"
            items={patterns}
            input={patternInput}
            setInput={setPatternInput}
            onAdd={() => { addToList(patterns, setPatterns, patternInput); setPatternInput(''); }}
            onRemove={(i) => removeFromList(patterns, setPatterns, i)}
            suggestions={PATTERN_SUGGESTIONS.filter(s => !patterns.includes(s))}
            onSuggest={(s) => addToList(patterns, setPatterns, s)}
            destructive
          />

          <ChipEditor
            label="Desculpas comuns"
            items={excuses}
            input={excuseInput}
            setInput={setExcuseInput}
            onAdd={() => { addToList(excuses, setExcuses, excuseInput); setExcuseInput(''); }}
            onRemove={(i) => removeFromList(excuses, setExcuses, i)}
            suggestions={[]}
            onSuggest={() => {}}
            destructive
          />

          <div className="flex gap-2 pt-2">
            <Button onClick={saveSetup} className="flex-1">Salvar identidade</Button>
            {isConfigured && (
              <Button variant="outline" onClick={() => setMode('panel')}>Cancelar</Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // PANEL MODE
  return (
    <div className="space-y-4">
      {/* Toggle do sistema */}
      <Card>
        <CardContent className="pt-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-display tracking-wider text-foreground">Sistema de Identidade</p>
            <p className="text-xs text-muted-foreground">
              Quando ativo, a IA opera em modo recondicionamento.
            </p>
          </div>
          <Switch
            checked={identity.enabled}
            onCheckedChange={toggleIdentitySystem}
          />
        </CardContent>
      </Card>

      {/* Verdade central */}
      <div className="text-center py-2">
        <p className="text-sm font-display italic text-primary/80 tracking-wide">
          "Identidade não é o que você sente. É o que você repete."
        </p>
      </div>

      {/* EU REAL */}
      <Card className="border-primary/40 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 font-display tracking-wide text-primary">
              <ShieldCheck className="w-5 h-5" />
              EU REAL
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setMode('setup')}>
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Editar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base text-foreground leading-relaxed">{identity.newIdentity}</p>

          {identity.codeOfConduct.length > 0 && (
            <div>
              <p className="text-[10px] font-display tracking-widest text-muted-foreground uppercase mb-2">Código de Conduta</p>
              <ol className="space-y-1.5">
                {identity.codeOfConduct.map((rule, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-display">{i + 1}.</span>
                    <span className="text-foreground">{rule}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {identity.dominantTraits.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {identity.dominantTraits.map((t, i) => (
                <Badge key={i} variant="outline" className="border-primary/40 text-primary">{t}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* EU ANTIGO */}
      {(identity.oldPatterns.length > 0 || identity.oldExcuses.length > 0) && (
        <Card className="border-destructive/20 bg-muted/30 opacity-70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display tracking-wide text-muted-foreground text-base">
              <Skull className="w-4 h-4" />
              EU ANTIGO (padrão condicionado)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs italic text-muted-foreground">
              Isso não é quem você é. É o padrão que você repetiu.
            </p>
            {identity.oldPatterns.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {identity.oldPatterns.map((p, i) => (
                  <Badge key={i} variant="outline" className="border-muted-foreground/30 text-muted-foreground line-through">
                    {p}
                  </Badge>
                ))}
              </div>
            )}
            {identity.oldExcuses.length > 0 && (
              <div>
                <p className="text-[10px] font-display tracking-widest text-muted-foreground/60 uppercase mb-1">Desculpas</p>
                <div className="flex flex-wrap gap-1.5">
                  {identity.oldExcuses.map((e, i) => (
                    <Badge key={i} variant="outline" className="border-muted-foreground/20 text-muted-foreground/70 text-xs">
                      {e}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estabilidade */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-display tracking-widest text-muted-foreground uppercase">Nível de Identidade Estável</p>
            <span className="text-lg font-display text-primary">{identity.stabilityLevel}%</span>
          </div>
          <Progress value={identity.stabilityLevel} className="h-2" />
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>✓ {identity.alignedActions} alinhadas</span>
            <span>✗ {identity.patternRelapses} recaídas</span>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Button onClick={() => setImmersive(true)} className="font-display tracking-wider">
          <Zap className="w-4 h-4 mr-2" /> ASSUMIR IDENTIDADE
        </Button>
        <Button variant="outline" onClick={() => setRitual(true)}>
          <Eye className="w-4 h-4 mr-2" /> Ritual de Reidentificação
        </Button>
      </div>

      {/* Modo imersivo */}
      <Dialog open={immersive} onOpenChange={setImmersive}>
        <DialogContent className="max-w-2xl bg-background border-primary/40 p-8 sm:p-12">
          <div className="space-y-6 text-center">
            <p className="text-[10px] font-display tracking-[0.3em] text-primary/60 uppercase">Identidade Assumida</p>
            <h2 className="text-2xl sm:text-3xl font-display text-foreground leading-tight">
              {identity.newIdentity}
            </h2>
            {identity.codeOfConduct.length > 0 && (
              <ol className="space-y-2 text-left max-w-md mx-auto">
                {identity.codeOfConduct.map((rule, i) => (
                  <li key={i} className="text-base text-foreground/90 border-l-2 border-primary pl-3">
                    {rule}
                  </li>
                ))}
              </ol>
            )}
            <p className="text-sm font-display italic text-primary pt-4 border-t border-primary/20">
              Pare de agir como quem você foi.<br />Aja como quem você decidiu ser.
            </p>
            <Button onClick={() => setImmersive(false)} variant="outline" className="font-display tracking-wider">
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <IdentityRitualDialog
        open={ritual}
        onClose={() => setRitual(false)}
        identity={identity.newIdentity}
        codeOfConduct={identity.codeOfConduct}
        onConfirm={() => { markRitualDone(); setRitual(false); toast.success('Ritual concluído.'); }}
      />
    </div>
  );
}

function ChipEditor({
  label, items, input, setInput, onAdd, onRemove, suggestions, onSuggest, destructive,
}: {
  label: string;
  items: string[];
  input: string;
  setInput: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  suggestions: string[];
  onSuggest: (s: string) => void;
  destructive?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd(); } }}
          placeholder="Digite e Enter"
          maxLength={40}
        />
        <Button type="button" variant="outline" onClick={onAdd}><Plus className="w-4 h-4" /></Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {items.map((it, i) => (
            <Badge
              key={i}
              variant="outline"
              className={destructive ? 'border-muted-foreground/30 text-muted-foreground' : 'border-primary/40 text-primary'}
            >
              {it}
              <button onClick={() => onRemove(i)} className="ml-1.5 hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {suggestions.slice(0, 6).map(s => (
            <button
              key={s}
              type="button"
              onClick={() => onSuggest(s)}
              className="text-[10px] px-2 py-0.5 rounded border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
