

## Problema

Você está sendo deslogado "do nada". Olhando o código, identifiquei a causa provável:

### Causa raiz: token de acesso expira em 1h e não está sendo renovado corretamente

No `src/integrations/supabase/client.ts`:
```ts
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
}
```

A configuração parece correta, MAS está faltando um detalhe importante: **`detectSessionInUrl`** não está definido e o cliente não está tratando `TOKEN_REFRESHED` / `SIGNED_OUT` events de forma robusta.

Além disso, em `useAuth.tsx` (linhas 21–35), há um **race condition clássico do Supabase**:
- `onAuthStateChange` e `getSession()` são chamados em paralelo
- Se `getSession()` retornar `null` antes do listener disparar com a sessão real (ou vice-versa), o estado pisca para `null` → `ProtectedRoute` redireciona para `/auth` → parece que deslogou sozinho
- Qualquer chamada async dentro do callback do `onAuthStateChange` pode causar deadlock no cliente Supabase (documentado), travando o refresh do token

Outro fator: quando o token tenta refresh e falha (rede instável no celular, aba dormindo), o Supabase dispara `SIGNED_OUT` e o app te joga pra tela de login.

## Solução

### 1. Corrigir `src/integrations/supabase/client.ts`
Adicionar `detectSessionInUrl: true` e `flowType: 'pkce'` para refresh mais robusto:
```ts
auth: {
  storage: localStorage,
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

### 2. Corrigir `src/hooks/useAuth.tsx`
- Inicializar `loading` como `true` apenas até `getSession()` resolver
- Não deixar `onAuthStateChange` sobrescrever o estado com `null` em eventos `INITIAL_SESSION` quando já temos sessão
- Tratar evento `TOKEN_REFRESHED` explicitamente
- Não fazer chamadas async dentro do callback (já está ok, mas reforçar)

Estrutura corrigida:
```ts
useEffect(() => {
  // 1. Listener PRIMEIRO (síncrono, sem await)
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    setSession(session);
    setUser(session?.user ?? null);
    if (event !== 'INITIAL_SESSION') setLoading(false);
  });

  // 2. Depois, checar sessão existente
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  return () => subscription.unsubscribe();
}, []);
```

### 3. Evitar redirect prematuro no `ProtectedRoute`
Em `src/App.tsx`, `ProtectedRoute` redireciona pra `/auth` assim que `user` fica `null`. Se o token estiver sendo refreshado, há uma janela curta onde `user` pode ficar `null`. Adicionar um pequeno guard: só redirecionar se `loading === false` E `user === null` por mais de uma renderização (já está assim, mas garantir que `loading` não vire `false` prematuramente — coberto pelo passo 2).

## Arquivos a editar
- `src/integrations/supabase/client.ts` — adicionar `detectSessionInUrl` e `flowType: 'pkce'`
- `src/hooks/useAuth.tsx` — ajustar lógica do listener para não causar flicker de logout

## Resultado esperado
- Sessão persiste corretamente entre reloads
- Token é renovado automaticamente sem te deslogar
- Sem mais "logout aleatório" quando voltar pra aba ou após 1h

