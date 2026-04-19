
Adicionar nova técnica **"Tédio dos 20 Minutos"** ao catálogo do Protocolo de Desativação em `src/components/MirrorPanel.tsx`.

## Detalhes da técnica

- **Nome:** Tédio dos 20 Minutos
- **Como praticar:** Sente-se de frente para a parede. 20 minutos olhando, sem celular, sem livro, sem música, sem dormir. Só olhar. Quando vier impulso de pegar o telefone ou levantar — fique. Deixe o tédio chegar até o fundo.
- **Duração:** 1× ao dia
- **Por que:** O cérebro viciado em estímulo foge do tédio como foge da dor. Treinar tolerar o vazio reativa a capacidade de focar no chato (que é onde mora o trabalho real). Sem tolerância ao tédio, não existe disciplina.
- **Ícone:** `Armchair` (ou `Brain` / `Hourglass` como alternativa) do lucide-react
- **Prioridade:** 7 (sempre presente, alta relevância)

## Mudança em `src/components/MirrorPanel.tsx`

1. Adicionar `Armchair` no import do `lucide-react`.
2. Inserir o novo bloco `out.push({...})` no `buildExercises` — sem condicional, sempre presente (como Diário de Gatilhos e Regra dos 10 Min).
3. Como o `.slice(0, 6)` final limita a 6 técnicas, a nova vai concorrer pelo slot por prioridade.
