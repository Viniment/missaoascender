
## Mobile: reorganizar coluna esquerda e compactar Monstro

### Pedidos
1. **SystemPanel** sai de cima (no mobile) e vai pro **final da página**.
2. **MonsterIndicator** fica em **modo compacto** no mobile — ocupa pouca tela, expandível se quiser ver detalhes.

### Mudanças

**1. `src/pages/Index.tsx` — reorganizar ordem no mobile**

Hoje a coluna esquerda renderiza nessa ordem (e cai inteira em cima do conteúdo no mobile):
```
PlayerCard → MonsterIndicator → FailureProtocolAlert → SystemPanel
```

Vou separar `SystemPanel` em um bloco próprio que:
- no mobile: aparece **depois** do conteúdo principal (final da página);
- no desktop (xl+): continua na coluna esquerda, no mesmo lugar de antes.

Estrutura nova:
```tsx
<div className="grid xl:grid-cols-12 gap-...">
  {/* Coluna esquerda no desktop, topo no mobile */}
  <div className="xl:col-span-4 2xl:col-span-3 space-y-5 order-1">
    <PlayerCard />
    <MonsterIndicator />
    <FailureProtocolAlert />
    {/* SystemPanel só aparece aqui no desktop */}
    <div className="hidden xl:block">
      <SystemPanel />
    </div>
  </div>

  {/* Conteúdo principal */}
  <div className="xl:col-span-8 2xl:col-span-9 order-2">
    {renderContent()}
  </div>

  {/* SystemPanel no final, só no mobile */}
  <div className="xl:hidden order-3">
    <SystemPanel />
  </div>
</div>
```

**2. `src/components/MonsterIndicator.tsx` — modo compacto no mobile**

Hoje o card usa: ícone + título grande + badge em linha separada + barra HP + descrição + reason. Ocupa muito vertical.

Vou criar versão compacta (default no mobile) com layout em **uma única linha densa**:

```
[💀] Monstro · AGONIZANTE          [HP 12/100]
     ▰▰▰▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱▱  (barra fina)
                                    [▾ ver mais]
```

Detalhes:
- Header em uma linha só: ícone pequeno + "Monstro" + separador "·" + badge inline (texto colorido, sem borda volumosa) + valor HP à direita.
- Barra HP fina (`h-1.5` em vez de `h-2`).
- Descrição (`stage.desc`) e `reason` ficam **escondidos** por padrão no mobile, atrás de um botão chevron (`Collapsible` ou simples `useState`).
- Padding interno reduzido no mobile (`p-3 sm:p-4`).
- No desktop (`sm:` ou `md:`+) mantém o layout atual (expandido sempre).

Resultado: card mobile passa de ~140px de altura para ~60-70px quando colapsado.

**3. Toques finais**
- Garantir que `FailureProtocolAlert` (quando aparece) também não fique muito alto — mas só ajusto se notar problema; foco é nos 2 pedidos.

### Arquivos
- `src/pages/Index.tsx` — reordenar SystemPanel (mobile no fim, desktop na esquerda).
- `src/components/MonsterIndicator.tsx` — versão compacta colapsável no mobile, layout atual no desktop.

### Resultado
- Mobile: PlayerCard → Monstro (compacto) → Alert (se houver) → Conteúdo → SystemPanel.
- Desktop: inalterado.
