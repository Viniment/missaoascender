
## Fix responsivo — MonsterIndicator + auditoria geral

### Problema reportado
No mobile (375-414px), o badge "AGONIZANTE" no `MonsterIndicator` transborda do card. Causa: header com `Skull + título + badge` em flex sem wrap. Em telas estreitas, título "Monstro da Procrastinação" ocupa muito espaço e empurra o badge pra fora.

### Correções

**1. `src/components/MonsterIndicator.tsx`**
- Header: trocar `flex items-center gap-2` por `flex flex-wrap items-center gap-2` no container do título.
- Título `h3`: adicionar `min-w-0 flex-1` pra permitir truncate/quebra.
- Badge stage: remover `ml-auto` (não funciona com wrap), usar `shrink-0` + `whitespace-nowrap` pra garantir que não quebre internamente.
- Alternativa mais limpa: estrutura em 2 linhas no mobile:
  ```
  [Skull] Monstro da Procrastinação    [BADGE]
  ```
  vira em telas muito estreitas:
  ```
  [Skull] Monstro da Procrastinação
                                  [BADGE]
  ```
  via flex-wrap natural.

**2. `src/pages/Index.tsx` — auditoria mobile**
- Verificar `px-6` no container principal (24px laterais) — em 320px deixa só 272px úteis. Reduzir pra `px-4 sm:px-6` no mobile.
- `py-8` ok no desktop, reduzir pra `py-4 sm:py-8` no mobile.
- `gap-8` no grid → `gap-5 sm:gap-8`.
- `space-y-5` na coluna esquerda já ok.

**3. `src/components/PlayerCard.tsx` — auditoria**
- Stats grid `grid-cols-3 gap-2` com valor "Conquistas: X/24" pode estourar em 320px. Verificar `truncate` no value.
- Header: `flex items-center gap-2` com nome + rank + nível — pode estourar. Adicionar `flex-wrap` ou `min-w-0` no nome.

**4. Header do app (`Index.tsx`)**
- Botão "⟐ ASCENSÃO" mobile — ok (shrink-0).
- Ícones direita já com `shrink-0`.

### Arquivos
- `src/components/MonsterIndicator.tsx` — flex-wrap no header + shrink-0/whitespace-nowrap no badge.
- `src/pages/Index.tsx` — padding/gap responsivos.
- `src/components/PlayerCard.tsx` — proteção de overflow no header de stats.

Sem mudança de lógica, store ou backend.
