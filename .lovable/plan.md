
## Reduzir tamanho dos popups Identidade e Ritual

### Problema
Os dialogs `IdentityPanel` (modo imersivo "ASSUMIR IDENTIDADE") e `IdentityRitualDialog` estão ocupando muito espaço no mobile e desktop — padding excessivo, textos grandes demais, sem `max-h` com scroll.

### Mudanças

**`IdentityRitualDialog.tsx`**
- `max-w-lg` → `max-w-sm`
- `p-8` → `p-5 sm:p-6`
- `space-y-6` → `space-y-4`
- Textos do ritual: `text-sm` → `text-xs sm:text-sm`
- Identidade `text-base` → `text-sm`
- Lista código: `text-sm` → `text-xs sm:text-sm`, `space-y-1.5` → `space-y-1`
- Botão `h-10` (default menor)
- Adicionar `max-h-[85vh] overflow-y-auto`

**`IdentityPanel.tsx` (modo imersivo)**
- Reduzir padding do DialogContent
- `max-w-2xl` → `max-w-md sm:max-w-lg`
- Reduzir tamanhos de fonte da identidade (de display 3xl/4xl → xl/2xl)
- Código de conduta: fontes menores, espaçamento compacto
- `max-h-[90vh] overflow-y-auto`
- Botão "Sair" mais compacto

### Arquivos
- `src/components/IdentityRitualDialog.tsx`
- `src/components/IdentityPanel.tsx` (apenas seção do dialog imersivo)

### Resultado
Popups compactos, legíveis em 320px+, sem scroll desnecessário em desktop, mantendo a estética intensa.
