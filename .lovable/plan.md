

# Plano: Tornar texto do XP visível em todos os temas

## Problema
O texto "163 / 1000 XP" usa `text-primary-foreground` (branco puro), mas a barra XP também é clara em alguns temas, tornando o texto invisível. Em temas como Arctic e Solar o contraste é péssimo.

## Solução
Trocar a cor do texto para branco fixo com um **text-shadow escuro** para garantir legibilidade sobre qualquer cor de barra:

```tsx
<span className="absolute inset-0 flex items-center justify-center text-[10px] font-display text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
```

### Arquivo alterado
- `src/components/PlayerCard.tsx` — linha 55: trocar `text-primary-foreground` por `text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]`

