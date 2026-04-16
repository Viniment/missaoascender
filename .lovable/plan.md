

## Problema
Cliques rápidos duplos em botões de "Criar" causam criação duplicada de itens (hábitos, missões, desafios, afirmações, etc.).

## Solução
Adicionar proteção contra duplo-clique nos handlers de criação. Abordagem: usar um `ref` de "submitting" que bloqueia chamadas subsequentes até o handler terminar + fechar o form/dialog (que naturalmente reseta).

Padrão a aplicar em cada handler de criação:
```tsx
const submittingRef = useRef(false);

const handleAdd = () => {
  if (submittingRef.current) return;
  if (!name.trim()) return;
  submittingRef.current = true;
  try {
    addHabit({ ... });
    // reset form
    setShowForm(false);
    toast.success('...');
  } finally {
    setTimeout(() => { submittingRef.current = false; }, 500);
  }
};
```

Também desabilitar visualmente o botão enquanto submete (`disabled={submitting}`) usando um `useState` simples para refletir no UI.

## Arquivos a editar
Aplicar o mesmo padrão de guard nos handlers de criação/edição em:

1. **`src/components/HabitsPanel.tsx`** — `handleAdd`, `handleEditHabit`
2. **`src/components/MissionsPanel.tsx`** — handler de criar/editar missão
3. **`src/components/ChallengesPanel.tsx`** — handler de criar/editar desafio
4. **`src/components/AffirmationsPanel.tsx`** — handler de criar afirmação
5. **`src/components/VisualizarPanel.tsx`** — handler de criar visualização
6. **`src/components/JournalPanel.tsx`** — handler de criar entrada
7. **`src/components/RewardsShop.tsx`** — handler de criar recompensa (se houver)
8. **`src/components/FailureProtocolSettings.tsx`** — handler de criar punição (se houver)

## Implementação
Para cada componente:
- Adicionar `const [submitting, setSubmitting] = useState(false);`
- No início do handler: `if (submitting) return;` + `setSubmitting(true);`
- Após criar e resetar form: `setTimeout(() => setSubmitting(false), 500);`
- No botão: `disabled={submitting}` para feedback visual

Isso garante que mesmo cliques rápidos em sequência só disparem uma criação. O `setTimeout` de 500ms cobre o tempo do form fechar/animar.

