

# Plano: Corrigir tabs mobile nas Configurações

## Problema
No mobile, as 5 tabs ("Conta", "Aparência", "Interface", "Protocolo de Falha", "Zona de Perigo") estão dentro de um `ScrollArea`, mas o `ScrollArea` do Radix não habilita scroll horizontal automaticamente — as últimas tabs ficam cortadas e inacessíveis.

## Solução
Trocar o `ScrollArea` por um `div` com `overflow-x-auto` nativo, que funciona de forma confiável para scroll horizontal no mobile. Também adicionar `min-width` ou `flex-shrink-0` nos botões para garantir que não encolham.

## Arquivo alterado
- `src/pages/Settings.tsx` — substituir `<ScrollArea>` por `<div className="overflow-x-auto ...">` e adicionar `flex-shrink-0` nos botões das tabs (~3 linhas)

