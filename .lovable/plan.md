
## Como funciona hoje (resposta direta)

**Taxa de Conclusão (Espelho):** `completionRate = concluídas / TOTAL de missões` — onde TOTAL inclui **Ativas + Concluídas + Falhadas**. É por isso que parece baixa: missões em andamento puxam a taxa pra baixo, como você notou.

**HP do Monstro (0–100, começa em 50):**
- Concluir missão Tempo: **−3 a −X** (2× horas executadas, mín 3)
- Concluir missão Diária: **−3** · Contagem: **−2** (passo) ou **−5** (completa)
- Hábito feito: **−4** · Hábito falhado: **+8**
- Falhar missão: **+12**
- Protocolo de falha expirado: **+20 por protocolo**
- Limitado entre 0 e 100. Desativável em Configurações.

---

## Mudanças propostas

### 1) Corrigir taxa do Espelho (ignorar Ativas)
Em `src/components/MirrorPanel.tsx`:
- `completionRate = concluídas / (concluídas + falhadas)` — ignora Ativas
- Mesmo princípio para hábitos (já é assim: só conta `done` + `failed`, ignora dias sem marcação) ✅
- Adicionar tooltip/legenda curta: *"Calculada apenas sobre missões finalizadas (concluídas + falhadas). Ativas não contam."*
- Manter o card "Ativas" como informativo, mas tirar do denominador da taxa

### 2) Nova seção no fim do Espelho — **"Protocolo de Reprogramação"**
Bloco gerado dinamicamente com base no que a análise detectou (não genérico):

**Estrutura:**
- Título: `🛠️ AÇÕES PARA QUEBRAR O PADRÃO`
- 3 a 5 exercícios práticos personalizados, escolhidos por regras locais (sem custo de IA) + 1 botão opcional `✨ Gerar plano com IA` para análise mais profunda

**Regras de seleção dos exercícios** (baseadas nos dados já calculados):

| Gatilho detectado | Exercício recomendado |
|---|---|
| `recurringFailures.length > 0` | **Regra dos 2 minutos**: pegar a tarefa mais falhada e definir uma versão de 2 min agora |
| `consistencyScore < 50` | **Implementação de Intenção**: escrever "Quando X acontecer, eu farei Y" para 1 hábito |
| `failures30d > dones30d` | **Premeditatio Malorum**: listar por escrito o pior cenário se continuar evitando |
| `monster.hp >= 70` | **Confronto de identidade**: reler o "Despertar" em voz alta + escrever 1 ação imediata |
| `completionRate < 40%` | **Decomposição radical**: pegar 1 missão Ativa parada e quebrar em 3 micro-passos |
| Sempre presente | **Box breathing 4-4-4-4** antes da próxima tarefa (regulação emocional) |
| Sempre presente | **Visualização do "eu futuro"**: 60s imaginando-se tendo feito a tarefa |

Cada exercício mostrado como card pequeno com:
- Ícone + nome
- 1 linha de instrução prática
- Por que (vínculo ao padrão detectado, ex: *"Detectado: 'Estudar' falhou 4× — comece com 2min agora"*)

### 3) Botão opcional "Plano IA personalizado"
Reusa a edge function `failure-confrontation` (ou cria uma nova leve) passando: padrões de falha, despertar, monster.hp → retorna 3 ações específicas no nível mental/emocional. **Sem auto-disparo** — só ao clicar, pra economizar tokens.

---

## Arquivos
- `src/components/MirrorPanel.tsx` — corrige fórmula da taxa + adiciona seção "Protocolo de Reprogramação" com lógica de regras
- (opcional) nova edge function `mirror-action-plan` se você quiser o botão IA — posso deixar pra próxima iteração se preferir só o local agora

## Pergunta rápida
Quer já incluir o botão "Plano IA personalizado" ou ficamos só com os exercícios baseados em regras locais (instantâneos, sem custo)?
