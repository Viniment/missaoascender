

# Plano: Melhorias no Pomodoro Timer

## Problemas identificados
1. **Foco = 50 min** — deveria ser 25 min
2. **Sem som** ao finalizar o timer
3. **Timer para com tela desligada** — `setInterval` não roda em background
4. **Pomodoro aparece na sidebar direita em todas as abas no desktop** — deveria aparecer só na aba Timer
5. **Sem opção de continuar contando em background** (tela desligada / fora do app)

## Solução

### 1. Corrigir duração de foco
- `focus: 50 * 60` → `focus: 25 * 60`

### 2. Som ao finalizar
- Usar `AudioContext` para gerar um beep/alarme quando `seconds === 0`
- Sem dependência externa — tom sintetizado via Web Audio API

### 3. Remover Pomodoro da sidebar desktop
- Em `Index.tsx`, remover o bloco `<div className="hidden lg:block"><PomodoroTimer /></div>` da sidebar direita (linhas 166-168)
- O Pomodoro já aparece na aba Timer via `renderContent()`, então basta isso

### 4. Modo background com persistência no banco
- Adicionar um toggle/switch "Continuar em background"
- Ao ativar e iniciar o timer:
  - Salvar no `game_state` (JSONB no banco): `pomodoroStartedAt` (timestamp) e `pomodoroDuration` (segundos totais) e `pomodoroMode`
  - O countdown calcula: `remaining = duration - (now - startedAt)`
  - Se `remaining <= 0`, timer terminou — tocar som e mostrar como concluído
- Isso funciona mesmo com tela desligada/app fechado — ao reabrir, o timer mostra o valor correto baseado nos timestamps
- Atualização em tempo real: `setInterval` de 1s recalcula `remaining` a partir de `Date.now() - startedAt`
- Ao pausar/resetar, limpar os campos do `game_state`

### Arquivos alterados
- `src/components/PomodoroTimer.tsx` — toda a lógica (duração, som, background mode, timestamps)
- `src/pages/Index.tsx` — remover PomodoroTimer da sidebar direita

### Detalhes técnicos
- Background mode usa timestamps absolutos em vez de decrementar — imune a suspensão de tab/tela
- Som via `new AudioContext()` + `OscillatorNode` — compatível com todos browsers modernos
- Estado salvo no `game_state` JSONB existente (sem migration necessária)
- Switch "Modo Background" com ícone de lua/relógio para indicar a funcionalidade

