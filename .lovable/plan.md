
## Botão "ASSUMIR IDENTIDADE" — feedback + ativação automática

### Problema
1. Ao clicar em "ASSUMIR IDENTIDADE", o modal imersivo abre mas não há feedback claro de que algo foi "ativado".
2. O botão tem texto fixo — não reflete estado.
3. Usuário quer que o clique também ative automaticamente o "Sistema de Identidade" (toggle global).

### Solução

**`src/components/IdentityPanel.tsx`**

1. Ao clicar em "ASSUMIR IDENTIDADE":
   - Se `identity.enabled === false` → chamar `toggleIdentitySystem()` para ligar
   - Abrir modal imersivo
   - Disparar `toast.success('Identidade assumida. Sistema ativo.')`

2. Texto dinâmico do botão:
   - Quando `identity.enabled === false`: **"ASSUMIR IDENTIDADE"** (variant default, com ícone Zap)
   - Quando `identity.enabled === true`: **"IDENTIDADE ATIVA"** (visual distinto: ring/glow primário, ícone ShieldCheck) — clique reabre o modal imersivo (sem desligar)

3. Pequeno indicador de status acima/ao lado dos botões: badge "● Sistema ativo" (verde/primário) ou "○ Sistema inativo" (muted), para reforçar visualmente o estado atual — complementa o Switch já existente no card do topo.

### Arquivo
- `src/components/IdentityPanel.tsx` (apenas handler do botão + render condicional)

### Resultado
Clicar em "ASSUMIR IDENTIDADE" liga o sistema automaticamente, mostra toast de confirmação, abre o modal imersivo, e o botão passa a exibir "IDENTIDADE ATIVA" com visual diferenciado.
