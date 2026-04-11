import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Swords, Sparkles, Shield, Trophy, BookOpen, Timer, Eye, Gift, ScrollText, Star, Flame, Coins, HelpCircle, Target, Zap, Crown } from 'lucide-react';

const sections = [
  {
    icon: Star,
    title: 'Visão Geral — O que é o Ascensão?',
    color: 'text-primary',
    content: `O Ascensão é um sistema de produtividade gamificado inspirado em RPGs. Cada tarefa que você completa te dá XP e Ouro, permitindo subir de nível, evoluir de rank e desbloquear conquistas. A ideia é transformar sua rotina em uma jornada épica de evolução pessoal.`,
    benefits: [
      'Transforma tarefas chatas em missões motivadoras',
      'Acompanhamento visual do seu progresso real',
      'Recompensas que incentivam consistência',
    ],
  },
  {
    icon: Swords,
    title: 'Missões',
    color: 'text-destructive',
    content: `Missões são suas tarefas do dia. Crie missões com nome, dificuldade e prazo. Ao completar uma missão, você ganha XP e Ouro baseados na dificuldade escolhida.`,
    benefits: [
      'Organize suas tarefas por prioridade e dificuldade',
      'Ganhe mais XP em missões difíceis — risco = recompensa',
      'Missões diárias criam disciplina e foco',
    ],
    tips: [
      'Comece com missões fáceis para criar o hábito',
      'Use missões de dificuldade S para objetivos importantes',
      'Não acumule — complete antes de criar novas',
    ],
  },
  {
    icon: Sparkles,
    title: 'Hábitos',
    color: 'text-neon-cyan',
    content: `Hábitos são ações recorrentes que você quer manter na sua rotina. Cada vez que marca um hábito como feito, você ganha XP e aumenta seu streak (sequência de dias consecutivos).`,
    benefits: [
      'Construa rotinas poderosas com consistência',
      'O streak te motiva a não quebrar a sequência',
      'Hábitos são a base da evolução real',
    ],
    tips: [
      'Comece com 2-3 hábitos simples e vá adicionando',
      'Marque seus hábitos no mesmo horário todo dia',
      'O streak é seu maior aliado — proteja-o!',
    ],
  },
  {
    icon: Shield,
    title: 'Desafios',
    color: 'text-success',
    content: `Desafios são metas de longo prazo com prazo definido. São mais difíceis que missões normais, mas a recompensa é muito maior. Ideais para objetivos que exigem dedicação contínua.`,
    benefits: [
      'Desenvolva perseverança e foco de longo prazo',
      'Recompensas maiores que missões comuns',
      'Crie marcos significativos na sua jornada',
    ],
    tips: [
      'Defina desafios realistas com prazos claros',
      'Divida desafios grandes em etapas menores',
      'Celebre cada desafio concluído!',
    ],
  },
  {
    icon: Trophy,
    title: 'Conquistas',
    color: 'text-gold',
    content: `Conquistas são medalhas desbloqueadas automaticamente conforme você progride. Elas rastreiam marcos como número de missões, dias de streak, ouro acumulado e ranks alcançados. Clique em qualquer conquista para ver os requisitos detalhados.`,
    benefits: [
      'Senso de progresso constante e visual',
      'Metas claras para mirar e se motivar',
      'Registro permanente das suas realizações',
    ],
    tips: [
      'Veja as conquistas bloqueadas para saber o que falta',
      'A barra de progresso mostra quão perto você está',
      'Conquistas de ranks altos são as mais valiosas',
    ],
  },
  {
    icon: BookOpen,
    title: 'Diário',
    color: 'text-neon-blue',
    content: `O Diário é seu espaço pessoal para reflexão. Escreva sobre seu dia, insights, aprendizados ou qualquer coisa que quiser registrar. Cada entrada de diário também te dá XP!`,
    benefits: [
      'Autoconhecimento através da reflexão diária',
      'Registro histórico da sua evolução',
      'XP extra por manter o hábito de escrever',
    ],
    tips: [
      'Escreva pelo menos 3 linhas por dia',
      'Registre vitórias, aprendizados e gratidão',
      'Releia entradas antigas para ver sua evolução',
    ],
  },
  {
    icon: Timer,
    title: 'Timer Pomodoro',
    color: 'text-primary',
    content: `O Timer usa a técnica Pomodoro: ciclos de foco intenso (25 min) seguidos de pausas curtas (5 min). Após 4 ciclos, uma pausa longa. Ideal para manter a concentração.`,
    benefits: [
      'Foco profundo sem burnout',
      'Pausas estratégicas aumentam a produtividade',
      'Estrutura o tempo de trabalho de forma saudável',
    ],
    tips: [
      'Durante o foco, elimine todas as distrações',
      'Use as pausas para se movimentar e hidratar',
      'Combine com missões para máxima eficiência',
    ],
  },
  {
    icon: Eye,
    title: 'Despertar',
    color: 'text-primary',
    content: `A seção Despertar contém conteúdos motivacionais e reflexivos para manter sua mentalidade forte. São textos, citações e princípios que te lembram do porquê você está nessa jornada.`,
    benefits: [
      'Mantém a motivação nos dias difíceis',
      'Mentalidade de crescimento constante',
      'Fonte de inspiração quando precisar',
    ],
  },
  {
    icon: Gift,
    title: 'Loja de Recompensas',
    color: 'text-gold',
    content: `Na Loja, você gasta o Ouro que ganhou em recompensas que você mesmo define. Crie recompensas pessoais como "assistir um episódio", "comprar um lanche" ou "dia de folga". Isso dá propósito ao ouro acumulado.`,
    benefits: [
      'Sistema de recompensa tangível e personalizado',
      'Motivação extra para completar missões',
      'Você decide o que te faz feliz',
    ],
    tips: [
      'Crie recompensas de diferentes valores',
      'Economize ouro para recompensas maiores',
      'Não gaste tudo de uma vez — planeje!',
    ],
  },
  {
    icon: ScrollText,
    title: 'Log de Histórico',
    color: 'text-muted-foreground',
    content: `O Log registra automaticamente tudo que acontece na sua jornada: missões completadas, hábitos marcados, conquistas desbloqueadas, compras na loja e muito mais. É o diário automático do sistema.`,
    benefits: [
      'Visão completa de tudo que você fez',
      'Identifique padrões de produtividade',
      'Nunca perca de vista seu progresso',
    ],
  },
  {
    icon: Zap,
    title: 'Sistema de Progressão',
    color: 'text-primary',
    content: `Seu personagem progride através de Níveis (1-5) e Ranks (E → D → C → B → A → S → Monarca). Ao atingir o nível 5 de um rank, você sobe para o próximo rank e o nível volta para 1. XP é ganho completando missões, hábitos e desafios. Ouro é a moeda para a loja.`,
    benefits: [
      'Progressão clara e visual do seu crescimento',
      'Cada rank é uma conquista significativa',
      'O sistema de reset mantém desafios constantes',
    ],
    tips: [
      'Foque em subir de rank — é mais impactante que nível',
      'Ranks mais altos geram conquistas exclusivas',
      'O rank Monarca é o objetivo final — poucos chegam lá!',
    ],
  },
  {
    icon: Flame,
    title: 'Streak — Sequência Diária',
    color: 'text-destructive',
    content: `O Streak conta quantos dias consecutivos você usa o sistema e completa hábitos. Quanto maior o streak, mais conquistas você desbloqueia. Cuidado: se quebrar a sequência, volta para 0!`,
    benefits: [
      'Incentiva uso diário e consistente',
      'Conquistas desbloqueiam em marcos de streak',
      'Criar constância é o segredo do progresso real',
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function Help() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <HelpCircle className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg tracking-widest text-primary">GUIA DO SISTEMA</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Bem-vindo ao guia completo do <span className="text-primary font-display">Ascensão</span>. Aqui você vai entender cada função do sistema, como usá-las da melhor forma e os benefícios de cada uma para sua evolução pessoal.
          </p>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {sections.map((section) => (
            <motion.details
              key={section.title}
              variants={item}
              className="rpg-panel group cursor-pointer"
            >
              <summary className="flex items-center gap-3 list-none [&::-webkit-details-marker]:hidden">
                <div className={`w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 ${section.color}`}>
                  <section.icon className="w-5 h-5" />
                </div>
                <span className="font-display text-sm text-foreground flex-1">{section.title}</span>
                <span className="text-muted-foreground text-xs group-open:rotate-90 transition-transform">▶</span>
              </summary>

              <div className="mt-4 space-y-4 pl-12">
                <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>

                <div>
                  <h4 className="text-xs font-display text-success mb-2">✦ BENEFÍCIOS</h4>
                  <ul className="space-y-1">
                    {section.benefits.map((b, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-success mt-0.5">•</span>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {section.tips && (
                  <div>
                    <h4 className="text-xs font-display text-neon-cyan mb-2">💡 DICAS</h4>
                    <ul className="space-y-1">
                      {section.tips.map((t, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-neon-cyan mt-0.5">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.details>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-10 text-center"
        >
          <p className="text-xs text-muted-foreground italic">
            "A jornada de mil milhas começa com um único passo." — Lao Tzu
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-6 py-2 rounded-md bg-primary/10 text-primary font-display text-sm hover:bg-primary/20 transition-colors border border-primary/20"
          >
            Voltar à Jornada
          </button>
        </motion.div>
      </main>
    </div>
  );
}
