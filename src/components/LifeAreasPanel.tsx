import { useState } from 'react';
import { useGame } from '@/lib/GameContext';
import { motion } from 'framer-motion';
import { Plus, X, Pencil, Check, Heart, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ATTRIBUTES, xpForAttrLevel, totalAttributeLevel, defaultAttributes } from '@/lib/attributes';

export default function LifeAreasPanel() {
  const { state, addLifeArea, updateLifeArea, removeLifeArea } = useGame();
  const areas = state.lifeAreas || [];
  const attrs = state.attributes || defaultAttributes;
  const totalAttr = totalAttributeLevel(attrs);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🎯');
  const [color, setColor] = useState('#7B2FF7');
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const create = () => {
    if (!name.trim()) return;
    addLifeArea({ name: name.trim(), icon: icon || '🎯', color });
    setName(''); setIcon('🎯'); setColor('#7B2FF7');
    setOpen(false);
  };

  return (
    <div className="space-y-5">
      {/* Atributos base */}
      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-3">
          <Activity className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-lg tracking-wider text-primary">ATRIBUTOS BASE</h2>
            <p className="text-xs text-muted-foreground">Treinados automaticamente por cada hábito e missão.</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[10px] text-muted-foreground font-display tracking-wider">TOTAL</div>
            <div className="font-display text-xl text-gold">{totalAttr}</div>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {ATTRIBUTES.map((a, i) => {
            const s = attrs[a.id] || { xp: 0, level: 1 };
            const need = xpForAttrLevel(s.level);
            const pct = Math.min(100, (s.xp / need) * 100);
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-2.5 rounded-lg border ${a.border} ${a.bg}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{a.emoji}</span>
                  <span className={`text-xs font-display tracking-wider flex-1 truncate ${a.color}`}>{a.label}</span>
                  <span className={`font-display text-sm ${a.color}`}>Lv {s.level}</span>
                </div>
                <div className="relative h-1.5 bg-background/60 rounded-full overflow-hidden mt-1.5">
                  <motion.div
                    className={`absolute inset-y-0 left-0 ${a.bg.replace('/10', '/80')}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7 }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="rpg-panel">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-display text-lg tracking-wider text-primary">ÁREAS DE VIDA</h2>
            <p className="text-xs text-foreground/60">Cada inimigo derrotado evolui as áreas que ele afetava.</p>
          </div>
          <Button size="sm" onClick={() => setOpen(true)} className="ml-auto">
            <Plus className="w-3 h-3 mr-1" /> Nova área
          </Button>
        </div>

        {areas.length === 0 ? (
          <p className="text-sm text-foreground/60">Nenhuma área cadastrada.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {areas.map(a => {
              const pct = Math.min(100, Math.round((a.xp / a.xpToNext) * 100));
              return (
                <motion.div
                  key={a.id}
                  layout
                  className="p-3 rounded-lg border bg-card relative"
                  style={{ borderColor: a.color + '55' }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{a.icon}</span>
                    {editing === a.id ? (
                      <>
                        <Input value={editVal} onChange={e => setEditVal(e.target.value)} className="h-7 text-xs" />
                        <button onClick={() => { if (editVal.trim()) updateLifeArea(a.id, { name: editVal.trim() }); setEditing(null); }}>
                          <Check className="w-4 h-4 text-emerald-400" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="font-display text-sm flex-1 truncate" style={{ color: a.color }}>
                          {a.name}
                        </span>
                        <button onClick={() => { setEditing(a.id); setEditVal(a.name); }} className="text-foreground/40 hover:text-foreground">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={() => { if (confirm(`Remover área "${a.name}"?`)) removeLifeArea(a.id); }} className="text-foreground/40 hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-display tracking-wider" style={{ color: a.color }}>NÍVEL {a.level}</span>
                    <span className="text-foreground/60">{a.xp}/{a.xpToNext} XP</span>
                  </div>
                  <div className="h-2 bg-background/70 rounded-full overflow-hidden border border-border">
                    <motion.div
                      className="h-full"
                      style={{ background: a.color }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle className="font-display tracking-wider">Nova Área de Vida</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-[80px_1fr] gap-2">
              <Input value={icon} onChange={e => setIcon(e.target.value.slice(0, 4))} className="text-center text-xl" />
              <Input placeholder="Nome (ex: Criatividade)" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-foreground/70">Cor:</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-9 w-16 rounded border border-border bg-background" />
              <span className="text-[11px] text-foreground/50">{color}</span>
            </div>
            <Button onClick={create} disabled={!name.trim()} className="w-full">Criar área</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
