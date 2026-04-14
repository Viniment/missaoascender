import { Palette } from 'lucide-react';

export type ThemeId = 'neon-purple' | 'red-black' | 'cyber-blue' | 'emerald' | 'solar';

interface ThemeDef {
  id: ThemeId;
  name: string;
  preview: [string, string, string]; // bg, primary, accent
}

const THEMES: ThemeDef[] = [
  { id: 'neon-purple', name: 'Neon Púrpura', preview: ['#020617', '#7B2FF7', '#6D28D9'] },
  { id: 'red-black', name: 'Vermelho & Preto', preview: ['#0A0A0A', '#DC2626', '#991B1B'] },
  { id: 'cyber-blue', name: 'Cyber Azul', preview: ['#020617', '#3B82F6', '#0EA5E9'] },
  { id: 'emerald', name: 'Esmeralda', preview: ['#021A0F', '#10B981', '#059669'] },
  { id: 'solar', name: 'Solar', preview: ['#0F0A02', '#F59E0B', '#D97706'] },
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

      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => onChange(theme.id)}
            className={`relative flex items-center gap-3 p-3 rounded-lg border transition-all ${
              current === theme.id
                ? 'border-primary glow-purple bg-secondary'
                : 'border-border hover:border-muted-foreground bg-card'
            }`}
          >
            <div className="flex gap-1">
              {theme.preview.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-white/10"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs font-body">{theme.name}</span>
            {current === theme.id && (
              <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
