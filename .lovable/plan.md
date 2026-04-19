
## Redesign do menu desktop — sem scroll horizontal

**Problema:** scroll horizontal é ruim. Solução: mostrar tudo de uma vez, organizado por grupos.

### Abordagem: Top bar com **dropdowns por grupo**

Em vez de listar 14 botões, o header desktop (≥ md) terá **4 botões de grupo** que abrem dropdown com as guias daquele grupo:

```
⟐ ASCENSÃO   [⚔ Ação ▾]  [👁 Reflexão ▾]  [🛠 Ferramentas ▾]  [🎁 Loja]   ⚙ ?  ☰
```

**Comportamento:**
- Cada botão de grupo (`Ação`, `Reflexão`, `Ferramentas`) abre um `DropdownMenu` (shadcn) com lista vertical das guias visíveis daquele grupo (ícone + nome + descrição curta).
- `Loja` tem só 1 item → vira botão direto (sem dropdown).
- Botão de grupo fica **destacado em purple** quando a guia ativa pertence a ele (ex: se `journal` está aberto, o botão `Reflexão` fica com `bg-primary/15` + glow).
- Item ativo dentro do dropdown também destacado com bg primary/10 + check ou border-l-2.
- Cabe sempre, sem scroll, em qualquer largura ≥ 768px.

**Visual:**
- Botões de grupo: `font-display tracking-wider text-xs`, padding generoso (`px-3 py-1.5`), ícone + label + chevron.
- Dropdown content: largura ~260px, items com ícone (9×9 bg secondary) + label + descrição (text-[11px] muted).
- Hover suave com transition.

### Mobile (< md)
**Não muda** — bottom sheet continua como está (você gostou).

### Arquivos
- `src/pages/Index.tsx` — substituir nav desktop atual por 4 dropdowns agrupados (manter mobile sheet intacto).

Sem mudança em store, settings, ou tabs.ts.
