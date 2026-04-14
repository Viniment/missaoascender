

# Plano: Navegação mobile mais intuitiva nas Configurações

## Problema
As tabs horizontais no mobile são pequenas, difíceis de descobrir que rolam, e o usuário pode não entender que precisa deslizar para ver as outras opções.

## Solução
Substituir as tabs horizontais por uma **lista vertical de cards** no mobile — cada seção aparece como um card com ícone, título e descrição curta. Ao tocar, expande o conteúdo da seção (estilo accordion) ou navega para ela. Isso é mais intuitivo porque todas as seções ficam visíveis de uma vez.

### Abordagem: Accordion (expandir/colapsar)
- No mobile, em vez de tabs, mostrar **todas as seções como cards colapsáveis**
- Cada card mostra: ícone + título + descrição de 1 linha
- Tocar no card expande seu conteúdo abaixo dele
- Apenas um aberto por vez (fecha o anterior ao abrir outro)
- "Zona de Perigo" com borda vermelha sutil para destaque visual
- Desktop permanece como está (sidebar lateral)

### Detalhes visuais
- Cards com `rpg-panel` styling e ícone à esquerda
- Seta indicadora de aberto/fechado (ChevronDown que gira)
- Animação suave de expansão
- Descrições curtas em cada card:
  - Conta → "Perfil, senha e sessão"
  - Aparência → "Tema e visual"
  - Interface → "Abas visíveis"
  - Protocolo de Falha → "Punições e penalidades"
  - Zona de Perigo → "Ações irreversíveis"

### Arquivo alterado
- `src/pages/Settings.tsx` — trocar tabs mobile por accordion de seções usando Collapsible ou Accordion do shadcn

