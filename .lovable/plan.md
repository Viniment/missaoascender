

# Plano: Reorganizar Configurações com navegação por seções

## Problema
Todas as configurações estão empilhadas numa lista longa e desorganizada — perfil, abas, tema, senha, protocolo de falha, ações — tudo junto sem separação clara.

## Solução
Criar uma **navegação lateral por seções** (ou tabs no mobile) que organize as configurações em categorias distintas, com visual profissional.

### Estrutura das seções

| Seção | Conteúdo |
|-------|----------|
| **Conta** | Avatar, nome, email, alterar senha, sair |
| **Aparência** | Seletor de tema |
| **Interface** | Abas visíveis (toggles) |
| **Protocolo de Falha** | Punições e modo aleatório |
| **Zona de Perigo** | Reiniciar progresso, excluir conta |

### Design

- **Desktop (753px+):** Layout com menu lateral à esquerda (lista de seções com ícones) + conteúdo à direita
- **Mobile:** Tabs horizontais scrolláveis no topo, conteúdo embaixo
- Cada seção aparece isolada ao clicar, sem scroll infinito
- Visual limpo com `rpg-panel` nos cards de conteúdo
- Seção ativa destacada com cor primária + glow sutil
- "Zona de Perigo" com borda vermelha para diferenciar

### Arquivo alterado
- `src/pages/Settings.tsx` — refatoração completa do layout com estado `activeSection` e renderização condicional por seção

