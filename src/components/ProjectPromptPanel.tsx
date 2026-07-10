import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

const PROMPT = `# 🎮 Ascensão — Life RPG de Desenvolvimento Pessoal

Um sistema pessoal inspirado em RPG (Solo Leveling) para transformar hábitos, disciplina e reprogramação mental em progressão real.

## Filosofia
- O "Monstro" é o padrão interior de sabotagem: nome, habilidades, desculpas e áreas afetadas cadastradas pelo usuário.
- O "Alter Ego" é a identidade forjada pela IA a partir de sonhos, valores e feridas.
- Cada ação registrada é combate: acertar o hábito enfraquece o monstro; falhar o fortalece.

## Sistemas centrais
- Player Card: nome, título, avatar, moldura animada, rank, XP, ouro, HP simbólico do herói.
- Hábitos diários (check-only, sem tempo/contagem) com Dia Perfeito → baú de loot com raridades.
- Mini Vitórias: micro-tarefas rápidas para ganhar impulso.
- Batalha do Inimigo: tarefas com impacto, resistência e prioridade — dano/regeneração calculados por combo decadente.
- Reflexão / Despertar: intervenção da IA sobre o padrão do monstro (ataques revelados, dois caminhos, evidências).
- Loja: temas, molduras animadas, títulos, pets, backgrounds — comprados com ouro ou desbloqueados por dias perfeitos.
- Mentor IA: 6 ferramentas (analisar padrão, sugerir hábito, forjar identidade, planejar dia, revisar semana, gerar ritual).

## Design
- Dark mode exclusivo, tokens HSL semânticos, tema padrão neon-purple.
- Fontes: Orbitron (display) + Rajdhani (body).
- Overlays cinemáticos com "TOCAR PARA CONTINUAR" (sem timers).

## Persistência
- Toda a jogada persiste em \`player_data.game_state\` (JSONB) via Lovable Cloud.
- Auth com email/senha e Google.
- PWA instalável (manifest + install prompt), sem service worker offline.
`;

export default function ProjectPromptPanel() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-widest text-primary">PROMPT DO PROJETO</h1>
          <p className="text-xs text-foreground/60 mt-1">Especificação viva do Ascensão — use para replicar, versionar ou compartilhar.</p>
        </div>
        <button
          onClick={copy}
          className="px-3 py-2 rounded-md border border-primary/50 text-primary hover:bg-primary/10 text-xs font-display tracking-widest flex items-center gap-2"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? 'COPIADO' : 'COPIAR'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap text-[13px] leading-relaxed bg-card/40 border border-border rounded-lg p-4 text-foreground/85 font-body">
{PROMPT}
      </pre>
    </div>
  );
}