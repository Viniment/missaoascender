

# Plano: Corrigir cache do avatar no mobile

## Problema

Quando o avatar é salvo no banco (tabela `profiles.avatar_url`), a URL é salva **sem** o parâmetro anti-cache (`?t=...`). No upload, o estado local recebe a URL com `?t=Date.now()`, então funciona na sessão atual. Mas ao recarregar ou em outro dispositivo, `usePlayerData` carrega a URL limpa do banco — o navegador mobile serve a imagem antiga do cache.

## Solução

Ao carregar o avatar do banco em `usePlayerData.tsx`, sempre adicionar `?t=timestamp` à URL do avatar para forçar o navegador a buscar a versão mais recente.

## Arquivo

**`src/hooks/usePlayerData.tsx`** — na linha onde carrega o perfil (~linha 50):

Trocar:
```ts
avatar: profile.avatar_url || prev.avatar,
```

Por:
```ts
avatar: profile.avatar_url ? `${profile.avatar_url}?t=${Date.now()}` : prev.avatar,
```

Isso garante que toda vez que o app carrega, a URL do avatar terá um parâmetro único que invalida o cache do navegador.

