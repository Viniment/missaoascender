import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Swords, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-glow text-primary font-display text-xl">⟐ ASCENSÃO</div>
      </div>
    );
  }

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Preencha todos os campos.');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : error.message);
        } else {
          toast.success('Bem-vindo de volta!');
        }
      } else {
        const { error } = await signUp(email, password, displayName || 'Jogador');
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('Conta criada! Verifique seu email para confirmar.');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Swords className="w-8 h-8 text-primary" />
            <h1 className="font-display text-3xl tracking-widest text-primary glow-text-purple">
              ASCENSÃO
            </h1>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            {isLogin ? 'Entre para continuar sua jornada' : 'Comece sua jornada de ascensão'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="rpg-panel space-y-4">
          {!isLogin && (
            <div>
              <label className="text-xs text-muted-foreground font-body">Nome do Jogador</label>
              <Input
                placeholder="Seu nome"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-body">Email</label>
            <Input
              type="email"
              placeholder="email@exemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="bg-secondary border-border"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-body">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="bg-secondary border-border pr-10"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (
              <span className="animate-pulse">Processando...</span>
            ) : isLogin ? (
              <><LogIn className="w-4 h-4 mr-2" /> Entrar</>
            ) : (
              <><UserPlus className="w-4 h-4 mr-2" /> Criar Conta</>
            )}
          </Button>
        </form>

        {/* Toggle */}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-muted-foreground hover:text-primary transition-colors font-body"
          >
            {isLogin ? 'Não tem conta? Criar uma' : 'Já tem conta? Entrar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
