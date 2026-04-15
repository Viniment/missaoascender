

# Plano: Restaurar estilos CSS que foram removidos por engano

## Problema
Ao remover o tema "Ouro Imperial" (neon-spectrum), as classes utilitárias CSS customizadas do app inteiro foram apagadas junto. Classes como `rpg-panel`, `glow-text-purple`, `glow-purple-strong` são usadas em **mais de 18 componentes** e são essenciais para o visual do site.

Também há um erro de runtime (`useGame must be used within GameProvider`) que precisa ser investigado, mas pode ser transitório.

## Solução
Restaurar no `src/index.css` todas as classes utilitárias que existiam antes, dentro de `@layer components`. Essas classes **não tinham relação com o tema neon-spectrum** — eram estilos globais do app.

### Classes a restaurar em `src/index.css`

```css
@layer components {
  .rpg-panel {
    @apply bg-gradient-to-br from-[hsl(var(--card-gradient-from))] to-[hsl(var(--card-gradient-to))] 
           border border-border rounded-lg p-4;
  }

  .glow-text-purple {
    text-shadow: 0 0 10px hsl(var(--glow-color) / 0.5),
                 0 0 30px hsl(var(--glow-color) / 0.2);
  }

  .glow-purple-strong {
    box-shadow: 0 0 15px hsl(var(--glow-color) / 0.3),
                0 0 40px hsl(var(--glow-color) / 0.1);
  }

  .glow-border {
    box-shadow: 0 0 8px hsl(var(--glow-color) / 0.3);
  }
}
```

### Arquivo envolvido
- `src/index.css` — adicionar bloco `@layer components` com as classes utilitárias de volta

Nenhum outro arquivo precisa ser alterado. Os temas (useTheme.ts, ThemeSelector.tsx) estão corretos — só faltam os estilos utilitários no CSS.

