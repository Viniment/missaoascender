

# Plano: Adicionar seção "Registrar Dia" na página de Ajuda

## Problema
A página de ajuda não menciona o botão "Registrar Dia" e sua importância para o streak e bônus de XP.

## Solução
Adicionar uma nova seção no array `sections` em `src/pages/Help.tsx` explicando o check-in diário:

- **Ícone:** `CheckCircle2` ou `Target`
- **Título:** "Registrar Dia — Check-in Diário"
- **Conteúdo:** Explicar que é necessário apertar o botão todo dia para manter o streak, ganhar +10 XP e ativar bônus
- **Benefícios:** Manter streak, ganhar XP diário, ativar multiplicadores (1.2x após 3 dias, 1.5x após 7 dias)
- **Dicas:** Registrar logo ao abrir o app, não esquecer ou o streak zera, combinar com hábitos

Posicionar logo após a seção de "Streak" ou antes dela, já que são relacionados.

## Arquivo alterado
- `src/pages/Help.tsx` — adicionar 1 nova seção ao array `sections`

