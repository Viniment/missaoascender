
# Plano: novo tema animado “Neon Spectrum”

## O que vou adicionar
Criar um novo tema nas Configurações com visual neon animado, trocando lentamente entre cores bonitas e com bom contraste, sem deixar o app difícil de ler.

## Abordagem
Em vez de animar tudo de forma agressiva, vou manter:
- fundo escuro estável
- textos claros e legíveis
- animação lenta nas cores de destaque

Assim o app continua bonito e usável.

## Como será o tema
Novo tema, por exemplo:
- **Neon Spectrum**
- descrição: “Neon animado com transição lenta entre cores”

Paleta animada:
- roxo neon
- azul/ciano
- rosa/magenta
- violeta elétrico

## Implementação
### 1. `src/components/ThemeSelector.tsx`
- adicionar o novo `ThemeId`
- incluir o novo card do tema na lista
- mostrar preview com cores neon do tema animado

### 2. `src/hooks/useTheme.ts`
- adicionar suporte ao novo tema
- quando esse tema estiver ativo:
  - manter variáveis base de fundo/texto com contraste alto
  - ativar uma animação lenta que alterna `--primary`, `--accent`, `--glow-color` e `--glow-secondary`
- ao trocar para outro tema:
  - limpar a animação/classe especial para não “vazar” o efeito

### 3. `src/index.css`
- criar uma classe global específica para o tema animado
- adicionar `@keyframes` para transição lenta entre cores neon
- aplicar essa animação em variáveis/efeitos visuais usados por:
  - bordas glow
  - cards
  - barra de XP
  - destaques do tema

## Cuidado importante
Para não repetir o problema de legibilidade:
- **não** vou animar a cor principal dos textos
- vou animar só os destaques neon
- vou manter o fundo escuro e o foreground claro

## Resultado esperado
Quando o usuário selecionar esse tema:
- o app continua escuro
- brilhos e destaques mudam de cor lentamente
- a sensação fica mais “viva”, futurista e bonita
- tudo continua legível

## Arquivos envolvidos
- `src/components/ThemeSelector.tsx`
- `src/hooks/useTheme.ts`
- `src/index.css`
