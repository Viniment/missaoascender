
Substituir "Protocolo de Reprogramação" no Espelho por **"Protocolo de Desativação de Hábitos"** — ações progressivas de longo prazo (não exercícios pontuais) que enfraquecem o poder dos hábitos automáticos de procrastinação/autossabotagem.

## O que muda em `src/components/MirrorPanel.tsx`

**Remover:** seção atual "Protocolo de Reprogramação" (Box Breathing, Visualização do Eu Futuro, Premeditatio Malorum, etc. — são exercícios de momento, não desativação de padrão).

**Adicionar:** novo bloco "Protocolo de Desativação" com técnicas de neurociência comportamental focadas em **quebrar o loop do hábito** ao longo de dias/semanas.

## Técnicas no catálogo

Cada uma com: nome, como praticar (instrução clara), duração sugerida, e por que funciona (vinculado ao padrão detectado).

| Técnica | Quando aparece | O que faz |
|---|---|---|
| **Urge Surfing** | falhas recorrentes / monsterHp ≥ 60 | Observar o impulso por 5-10min sem agir. Ensina o cérebro que o impulso passa sem ser obedecido. |
| **Jejum de Dopamina** (24h) | consistência < 50% | 1 dia sem redes, doces, pornô, jogos. Reseta sensibilidade dos receptores. |
| **Mindful Eating** | falhas em hábitos de saúde/comida | Comer 1 refeição/dia sem tela, mastigando 20×. Reconecta consciência ao corpo. |
| **Habit Stacking Reverso** | recurringFailures > 0 | Após o gatilho do mau hábito, inserir 2min de ação oposta. Reescreve a rota neural. |
| **Janela de Atenção** (Pomodoro com sofrimento) | completionRate < 40% | 25min na tarefa difícil — se vier impulso de fugir, escreva o impulso no papel e continue. |
| **Cold Exposure** (banho frio 2min) | monsterHp ≥ 70 | Treina tolerância ao desconforto. Procrastinação é fuga do desconforto. |
| **Digital Sunset** | falhas vespertinas | Sem tela 1h antes de dormir por 7 dias. Restaura função executiva. |
| **Diário de Gatilhos** | sempre presente | Anotar TODA vez que o impulso vier: hora, contexto, emoção. Em 7 dias, padrão fica visível. |
| **Regra dos 10 Minutos** | sempre presente | Quando vier impulso de procrastinar, esperar 10min antes de ceder. Quase sempre passa. |
| **Substituição de Recompensa** | recurringFailures > 0 | Identificar a recompensa do mau hábito e substituir por uma saudável que dê o mesmo neurotransmissor. |

## Estrutura visual

Cards com:
- Ícone + nome da técnica
- **Como praticar** (1-2 linhas claras)
- **Duração**: ex "Praticar por 7 dias" / "1× ao dia" / "Sempre que o impulso vier"
- **Por que** (vinculado ao dado detectado): ex *"Detectado: 3 hábitos falharam essa semana — urge surfing treina o cérebro a não obedecer o impulso"*

Mostrar 4-6 técnicas selecionadas por relevância (não todas de uma vez).

## Arquivos
- `src/components/MirrorPanel.tsx` — substituir função `buildExercises` por `buildDeactivationProtocol`, atualizar JSX da seção, trocar título e ícones.
