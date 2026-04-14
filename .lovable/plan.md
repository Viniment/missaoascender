

# Plano: Corrigir estado inicial do accordion mobile

## Problema
`useIsMobile()` retorna `false` no primeiro render (o `useEffect` ainda não rodou). Como `useState` só usa o valor inicial uma vez, `activeSection` é inicializado como `'account'` mesmo no mobile — e nunca muda para `null`.

## Solução
Adicionar um `useEffect` que detecta quando `isMobile` muda para `true` e fecha todas as seções (seta `activeSection` para `null`). Alternativamente, inicializar como `null` sempre e abrir `'account'` apenas quando confirmar que é desktop.

### Arquivo alterado
- `src/pages/Settings.tsx` — adicionar `useEffect` após a inicialização:
  ```typescript
  const [activeSection, setActiveSection] = useState<SectionId>(null);
  
  useEffect(() => {
    if (isMobile === false && activeSection === null) {
      setActiveSection('account');
    }
    if (isMobile === true) {
      setActiveSection(null);
    }
  }, [isMobile]);
  ```
  Isso garante que no mobile tudo começa fechado, e no desktop "Conta" abre automaticamente.

