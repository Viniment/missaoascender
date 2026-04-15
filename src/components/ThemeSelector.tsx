import { Palette } from 'lucide-react';

export type ThemeId = 'neon-purple' | 'red-black' | 'cyber-blue' | 'emerald' | 'solar' | 'midnight-rose' | 'arctic' | 'neon-spectrum';

interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  preview: [string, string, string];
}

const THEMES: ThemeDef[] = [
  { id: 'neon-purple', name: 'Neon Púrpura', description: 'Solo Leveling clássico', preview: ['#020617', '#7B2FF7', '#A855F7'] },
  { id: 'red-black', name: 'Sangue & Sombra', description: 'Escuro e agressivo', preview: ['#080000', '#DC2626', '#F97316'] },
  { id: 'cyber-blue', name: 'Cyber Azul', description: 'Frio e futurista', preview: ['#020A18', '#0EA5E9', '#38BDF8'] },
  { id: 'emerald', name: 'Esmeralda', description: 'Natureza e foco', preview: ['#011A0D', '#22C55E', '#4ADE80'] },
  { id: 'solar', name: 'Solar', description: 'Quente e poderoso', preview: ['#0A0500', '#F59E0B', '#FBBF24'] },
  { id: 'midnight-rose', name: 'Rosa Noturna', description: 'Elegante e intenso', preview: ['#0A0310', '#E11D8E', '#F472B6'] },
  { id: 'arctic', name: 'Ártico', description: 'Gélido e preciso', preview: ['#030A12', '#94A3B8', '#E2E8F0'] },
  { id: 'neon-spectrum', name: 'Ouro Imperial', description: 'Riqueza e poder', preview: ['#0D0A04', '#E5A820', '#B8860B'] },
];

interface Props {
  current: ThemeId;
  onChange: (theme: ThemeId) => void;
}

export default function ThemeSelector({ current, onChange }: Props) {
  return (
    <div className="rpg-panel space-y-4">
      <h2 className="font-display text-sm text-primary flex items-center gap-2">
        <Palette className="w-4 h-4" /> TEMA
      </h2>
      <p className="text-xs text-muted-foreground">Escolha o esquema de cores do app.</p>

      <div className="space-y-2">
        {THEMES.map(theme => {
          const isActive = current === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => onChange(theme.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                isActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-muted-foreground bg-card'
              }`}
              style={isActive ? {
                boxShadow: `0 0 15px ${theme.preview[1]}33, 0 0 40px ${theme.preview[1]}11`,
              } : undefined}
            >
              <div className="flex gap-1.5">
                {theme.preview.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 rounded-full"
                    style={{
                      backgroundColor: color,
                      boxShadow: i > 0 ? `0 0 8px ${color}66` : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-display tracking-wider">{theme.name}</span>
                <span className="text-[10px] text-muted-foreground">{theme.description}</span>
              </div>
              {isActive && (
                <div className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
