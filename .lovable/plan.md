
## Ajuste final de mobile — MonsterIndicator ainda está “colado”

### O problema exato
Pelo screenshot, o badge não está mais vazando, mas o bloco do título ainda ficou visualmente apertado no mobile:
- o título quebra em 2 linhas;
- o badge fica muito próximo da segunda linha;
- o tracking largo da fonte + texto longo (“Monstro da Procrastinação”) deixa o cabeçalho denso demais em larguras pequenas.

### O que vou corrigir

**1. Reestruturar o header do `MonsterIndicator`**
Em vez de depender só do `flex-col`, separar claramente em 2 áreas:
- linha 1: `Skull + título`
- linha 2: badge sozinho

Assim o badge nunca “encosta” no título.

Estrutura desejada:
```text
[skull] MONSTRO DA
        PROCRASTINAÇÃO

        [AGONIZANTE]
```

**2. Dar mais respiro no mobile**
No `src/components/MonsterIndicator.tsx`:
- aumentar o espaçamento entre título e badge;
- reduzir um pouco tracking/tamanho do título só no mobile;
- garantir `leading` mais confortável;
- deixar o badge com `w-fit` / `self-start` e margem superior clara;
- se necessário, reduzir o texto do título em mobile para:
  - desktop: “Monstro da Procrastinação”
  - mobile: “Monstro da Procrastinação” com tracking menor e quebra mais limpa, sem apertar.

**3. Refinar o card como um todo**
- aumentar levemente o padding interno no eixo vertical;
- revisar espaço entre header, barra de HP e texto descritivo;
- evitar que tudo fique “amontoado” em telas de 320–390px.

**4. Auditoria rápida dos blocos vizinhos**
Também vou revisar:
- `PlayerCard`
- `FailureProtocolAlert`
- container principal em `Index.tsx`

Objetivo: garantir que o problema não seja sensação geral de layout apertado no mobile, e não só do badge.

### Arquivos
- `src/components/MonsterIndicator.tsx` — separar header em duas linhas e melhorar espaçamentos mobile.
- `src/pages/Index.tsx` — pequeno ajuste se o container ainda estiver apertando demais em telas pequenas.
- `src/components/PlayerCard.tsx` — só se eu encontrar outro ponto visualmente “colado” na mesma coluna.

### Resultado esperado
No celular, o card do monstro fica:
- sem overflow;
- sem elementos encostados;
- mais legível;
- equilibrado em 320px, 375px, 390px e 414px.
