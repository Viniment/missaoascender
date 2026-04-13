

# Plano: Corrigir dialog de edição de hábitos + Adicionar descrição na edição de missões

## Problema 1: Dialog de edição de hábitos deformado
O `DialogContent` não tem scroll — quando o RichEditor aparece, o conteúdo estoura. Solução: adicionar `max-h-[85vh] overflow-y-auto` ao conteúdo do dialog.

## Problema 2: Descrição na edição de missões
O dialog de edição de missões (linha 400-449 de `MissionsPanel.tsx`) não tem campo de descrição. Precisa adicionar checkbox + RichEditor igual ao de criação e de hábitos.

## Alterações

### `src/components/HabitsPanel.tsx`
- Linha 171: adicionar `max-h-[85vh] overflow-y-auto` ao `DialogContent` do edit dialog para permitir scroll quando o editor de descrição está aberto.

### `src/components/MissionsPanel.tsx`
- Adicionar estados `editHasDescription` e `editDescription` ao componente.
- Na função `openEditDialog` (linha 72-81): inicializar `editHasDescription` e `editDescription` com os valores da missão.
- Na função `handleEdit` (linha 83-95): incluir `description` no objeto de atualização.
- No dialog de edição (linhas 439-442, antes do vídeo): adicionar checkbox "Adicionar descrição" + `RichEditor`, idêntico ao formulário de criação.
- Adicionar `max-h-[85vh] overflow-y-auto` ao `DialogContent` para prevenir o mesmo problema de overflow.

## Arquivos alterados
- `src/components/HabitsPanel.tsx` — fix overflow no dialog de edição
- `src/components/MissionsPanel.tsx` — adicionar descrição rica na edição de missões

