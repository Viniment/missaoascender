

## Entendimento
O usuário relatou que as "afirmações" geradas na aba Afirmações soam como **conselhos** ("Você precisa...", "Lembre-se de...") em vez de **afirmações positivas em primeira pessoa** prontas para repetir ("Eu sou...", "Eu escolho...").

## Causa raiz
No `supabase/functions/affirmations/index.ts`, o `SYSTEM_PROMPT` atual:
- Diz "primeira pessoa OU segunda pessoa direta" → permite "Você..."
- Permite tom "confrontador, sem rodeios" no modo fraqueza → vira conselho/cobrança
- Diz "máximo 2 frases" → afirmação ideal é 1 frase curta
- Não exige formato declarativo de identidade ("Eu sou", "Eu tenho", "Eu escolho")

Resultado: a IA gera conselhos disfarçados em vez de afirmações repetíveis.

## Mudança proposta

**Arquivo único:** `supabase/functions/affirmations/index.ts` — reescrever o `SYSTEM_PROMPT`.

Novas regras do prompt:
1. **SEMPRE primeira pessoa** ("Eu...") — proibido "Você...", "Lembre-se", "Tente", "Precisa"
2. **Formato declarativo de identidade**: começar com "Eu sou", "Eu tenho", "Eu escolho", "Eu mereço", "Eu construo", "Em mim..." etc.
3. **1 frase só**, curta (máx ~15 palavras), pronta para o usuário ler em voz alta e repetir
4. **Tempo presente** (nunca futuro tipo "vou conseguir")
5. **Sem negação** ("Eu não sou fraco" → vira "Eu sou forte")
6. **Adapta o conteúdo** aos modos (despertar/noturna/fraqueza) e ao contexto (awakening, diário, rank, streak), mas **mantém o formato de afirmação** — modo fraqueza vira afirmação de identidade resgatada, não confronto
7. Continua em PT-BR, sem repetir histórico

Adicionar 3-4 exemplos few-shot no prompt mostrando bom vs ruim:
- ❌ "Você precisa parar de procrastinar agora." 
- ✅ "Eu ajo no instante em que reconheço o que importa."

## Resultado
A aba Afirmações passa a entregar frases curtas, em primeira pessoa, declarativas — verdadeiras afirmações para repetir como mantra, não conselhos.

