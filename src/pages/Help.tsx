import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Swords, Sparkles, Shield, Trophy, BookOpen, Timer, Eye, Gift, ScrollText,
  Star, Flame, HelpCircle, Zap, CheckCircle2, Skull, Waves, Layers, Settings as SettingsIcon,
  Palette, SlidersHorizontal, Wand2,
} from 'lucide-react';

type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'subtitle'; emoji?: string; text: string }
  | { type: 'list'; items: { emoji: string; label: string; desc: string }[] };

type Section = {
  icon: any;
  title: string;
  color: string;
  content: string | ContentBlock[];
  benefits: string[];
  tips?: string[];
};

type Group = {
  emoji: string;
  title: string;
  intro: string;
  sections: Section[];
};

const groups: Group[] = [
  {
    emoji: '🎯',
    title: 'FUNDAMENTOS',
    intro: 'Comece por aqui. Entenda a essência do sistema e como o seu progresso é medido.',
    sections: [
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
        icon: Zap,
        title: 'Sistema de Progressão (XP, Níveis e Ranks)',
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
        icon: CheckCircle2,
        title: 'Registrar Dia — Check-in Diário',
        color: 'text-success',
        content: `O botão "Registrar Dia" (⚔️) é essencial para manter sua jornada ativa. Você PRECISA apertar esse botão todo dia para registrar sua presença. Ao clicar, você ganha +10 XP imediatamente e mantém seu Streak ativo. Sem registrar, o sistema considera que você não jogou naquele dia.`,
        benefits: [
          'Garante +10 XP diário garantido',
          'Mantém o Streak ativo — sem registro, o streak zera',
          'Ativa multiplicadores de XP: 1.2x após 3 dias, 1.5x após 7 dias',
          'É o primeiro passo para um dia produtivo no sistema',
        ],
        tips: [
          'Registre logo ao abrir o app — faça disso seu primeiro hábito',
          'O botão fica desabilitado após o uso — sem risco de clicar duas vezes',
          'Combine com seus hábitos matinais para nunca esquecer',
        ],
      },
      {
        icon: Flame,
        title: 'Streak — Sequência Diária',
        color: 'text-destructive',
        content: `O Streak conta quantos dias consecutivos você usa o sistema e completa hábitos. Quanto maior o streak, mais conquistas você desbloqueia e maiores os multiplicadores. Cuidado: se quebrar a sequência, volta para 0!`,
        benefits: [
          'Incentiva uso diário e consistente',
          'Conquistas desbloqueiam em marcos de streak',
          'Multiplicadores de XP crescem com o streak',
        ],
        tips: [
          'Proteja seu streak como se fosse seu HP',
          'Em dias caóticos, faça pelo menos o check-in + 1 hábito',
        ],
      },
    ],
  },
  {
    emoji: '⚔️',
    title: 'AÇÃO E DISCIPLINA',
    intro: 'As ferramentas que transformam intenção em execução. Aqui mora a disciplina.',
    sections: [
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
        content: `Hábitos são ações recorrentes que você quer manter na sua rotina. Cada vez que marca um hábito como feito, você ganha XP e aumenta seu streak.`,
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
        icon: Skull,
        title: 'Protocolo de Falha',
        color: 'text-destructive',
        content: `Sistema de consequências que VOCÊ define. Quando você falha em uma missão, hábito ou desafio, o sistema ativa uma punição — uma ação corretiva a cumprir num prazo. Cria uma neuroassociação entre falhar e dor real, tornando a procrastinação algo que seu cérebro evita ativamente.`,
        benefits: [
          'Neuroassociação: seu cérebro aprende a evitar falhas',
          'Quebra o ciclo da procrastinação com consequências reais',
          'Aumenta a disciplina sem depender de motivação',
          'Modo aleatório aumenta o efeito psicológico',
        ],
        tips: [
          'Comece com punições leves e aumente gradualmente',
          'Punições físicas (banho frio, prancha) são as mais eficazes',
          'Cumpra SEMPRE — a consistência é o que cria a neuroassociação',
          'Configure em: Configurações → Protocolo de Falha',
        ],
      },
    ],
  },
  {
    emoji: '🧠',
    title: 'MENTE E AUTOCONHECIMENTO',
    intro: 'Disciplina sem autoconhecimento é cego. Estas ferramentas trabalham sua mente e seus padrões internos.',
    sections: [
      {
        icon: BookOpen,
        title: 'Diário',
        color: 'text-neon-blue',
        content: `Seu espaço pessoal para reflexão. Escreva sobre seu dia, insights, aprendizados, emoções. Cada entrada também te dá XP e alimenta a IA do Despertar com contexto sobre você.`,
        benefits: [
          'Autoconhecimento através da reflexão diária',
          'Registro histórico da sua evolução',
          'Alimenta a IA do Despertar para perguntas mais profundas',
        ],
        tips: [
          'Escreva pelo menos 3 linhas por dia',
          'Marque emoção e intensidade — isso enriquece o contexto da IA',
          'Use o "Modo Profundo" quando quiser reflexões mais densas',
        ],
      },
      {
        icon: Eye,
        title: 'Despertar — Reflexão Guiada',
        color: 'text-primary',
        content: `Espaço para perguntas e respostas profundas sobre você mesmo. Crie suas próprias perguntas ou use o botão "✨ Sugerir perguntas (IA)" para gerar 5 perguntas personalizadas. A IA analisa seu diário recente, suas respostas do "Despertar Inicial" (quem você quer se tornar / o que rejeita / dor atual) e suas reflexões anteriores — gerando perguntas que constroem em cima do que você já descobriu, sem repetir.`,
        benefits: [
          'Reflexão estruturada com perguntas sob medida',
          'A IA evita perguntas redundantes — provoca evolução real',
          'Confronta contradições e aponta o próximo passo',
          'Cada reflexão salva alimenta a próxima geração',
        ],
        tips: [
          'Use a IA quando estiver sem rumo — ela aponta o ponto cego',
          'Responda com honestidade brutal — a IA "lê" o que você escreve',
          'Releia reflexões antigas para ver sua evolução de pensamento',
          'Quanto mais você usa diário + reflexões, melhor a IA fica',
        ],
      },
      {
        icon: Flame,
        title: 'Afirmações',
        color: 'text-gold',
        content: [
          { type: 'p', text: 'Frases poderosas que reprogramam sua identidade. Crie manualmente ou gere com IA personalizada para o seu momento.' },

          { type: 'subtitle', emoji: '🎛️', text: 'Modos de Geração com IA' },
          { type: 'list', items: [
            { emoji: '🌅', label: 'Despertar', desc: 'Afirmação matinal energizante. Usa seu Despertar Inicial e hábitos pra começar o dia em estado de poder.' },
            { emoji: '🌙', label: 'Noturna', desc: 'Reflexão calma de fechamento. Baseada no seu último diário — ideal pra dormir reconciliado.' },
            { emoji: '⚡', label: 'Fraqueza', desc: 'Modo CONFRONTO em fullscreen. Frase dura e despertadora pra momentos de recaída ou impulso forte.' },
          ]},

          { type: 'subtitle', emoji: '✍️', text: 'Criar Manualmente' },
          { type: 'p', text: 'O botão Criar abre um campo livre pra escrever sua própria afirmação. Já entra favoritada automaticamente.' },

          { type: 'subtitle', emoji: '▶️', text: 'Slideshow' },
          { type: 'p', text: 'Apresenta suas afirmações favoritas em fullscreen, uma após a outra. Perfeito pra meditação, foco ou ritual matinal.' },

          { type: 'subtitle', emoji: '🎯', text: 'Ações em cada Afirmação' },
          { type: 'list', items: [
            { emoji: '❤️', label: 'Favoritar', desc: 'Marca para aparecer no Slideshow.' },
            { emoji: '✏️', label: 'Editar', desc: 'Ajusta o texto da afirmação.' },
            { emoji: '🗑️', label: 'Excluir', desc: 'Remove permanentemente.' },
            { emoji: '⛶', label: 'Expandir', desc: 'Abre em fullscreen pra leitura focada.' },
            { emoji: '🔄', label: 'Regenerar', desc: 'Gera nova versão com IA mantendo o tema.' },
          ]},

          { type: 'subtitle', emoji: '🤖', text: 'Como a IA Personaliza' },
          { type: 'p', text: 'A IA usa seu Despertar Inicial, último diário, emoção registrada, streak de hábitos, rank atual e o histórico das últimas 5 afirmações — pra evitar repetição e gerar algo que faz sentido pra você AGORA.' },
        ],
        benefits: [
          'Reprograma crenças limitantes no subconsciente',
          'Fortalece a identidade que você quer construir',
          'Modo Fraqueza vira anti-impulso em momentos críticos',
          'IA personaliza com seu contexto real, não frases genéricas',
          'Slideshow vira ritual diário de foco',
        ],
        tips: [
          'Use o presente: "Eu SOU", não "Eu vou ser"',
          'Comece o dia com Despertar, termine com Noturna',
          'Bateu impulso forte? Abra ⚡ Fraqueza ANTES de ceder',
          'Favorite as que mais ressoam — vão pro Slideshow',
          'Ative em: Configurações → Interface → Afirmações',
        ],
      },
      {
        icon: Waves,
        title: 'Urge Surfing — Surfar o Impulso',
        color: 'text-neon-cyan',
        content: `Técnica psicológica para lidar com impulsos compulsivos (vontade de procrastinar, comer mal, recair em vícios, etc.). Em vez de lutar contra a urgência, você a OBSERVA passar — como uma onda que sobe, atinge o pico e desce. Sessão guiada com respiração 4-7-8 e timer.`,
        benefits: [
          'Quebra o automatismo de ceder a impulsos',
          'Treina seu cérebro a tolerar desconforto sem agir',
          'Toda urgência cumprida sem ceder enfraquece o gatilho',
          'Construção de força de vontade real e duradoura',
        ],
        tips: [
          'Use no MOMENTO da urgência — não depois',
          'Não tente "não pensar" — apenas observe e respire',
          'Anote o gatilho depois para identificar padrões',
          'Vem desativada por padrão — ative em: Configurações → Interface → Urge Surfing',
        ],
      },
      {
        icon: Layers,
        title: 'Visualizar — Vision Board',
        color: 'text-neon-blue',
        content: `Mural visual dos seus objetivos e da vida que você quer construir. Adicione imagens, frases e categorias (saúde, carreira, relacionamentos). Visualize diariamente para manter o cérebro orientado ao alvo.`,
        benefits: [
          'Mantém seus objetivos visíveis e vivos',
          'Programa o subconsciente para o futuro desejado',
          'Streak de visualização recompensa consistência',
        ],
        tips: [
          'Visualize com EMOÇÃO — sinta como se já fosse real',
          'Atualize o board conforme você evolui',
          'Ative em: Configurações → Interface → Visualizar',
        ],
      },
    ],
  },
  {
    emoji: '🏆',
    title: 'RECOMPENSAS E REGISTROS',
    intro: 'Tudo o que você faz fica registrado. E todo esforço merece recompensa.',
    sections: [
      {
        icon: Trophy,
        title: 'Conquistas',
        color: 'text-gold',
        content: `Medalhas desbloqueadas automaticamente conforme você progride. Rastreiam marcos como número de missões, dias de streak, ouro acumulado e ranks alcançados. Clique em qualquer conquista para ver os requisitos.`,
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
        icon: Gift,
        title: 'Loja de Recompensas',
        color: 'text-gold',
        content: `Gaste o Ouro que ganhou em recompensas que VOCÊ define. Crie recompensas pessoais como "assistir um episódio", "comprar um lanche", "dia de folga". Isso dá propósito ao ouro acumulado.`,
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
        content: `Registra automaticamente tudo que acontece na sua jornada: missões completadas, hábitos marcados, conquistas desbloqueadas, compras, falhas. É o diário automático do sistema.`,
        benefits: [
          'Visão completa de tudo que você fez',
          'Identifique padrões de produtividade',
          'Nunca perca de vista seu progresso',
        ],
      },
    ],
  },
  {
    emoji: '⚙️',
    title: 'PERSONALIZAÇÃO',
    intro: 'O sistema é seu. Configure cada aba, tema e dificuldade do jeito que faz sentido pra sua jornada.',
    sections: [
      {
        icon: SlidersHorizontal,
        title: 'Configurações de Interface — Abas Visíveis',
        color: 'text-primary',
        content: `Você escolhe quais abas aparecem na navegação. Algumas vêm desativadas por padrão (Visualizar, Afirmações e Urge Surfing) para não sobrecarregar quem está começando. Ative apenas o que faz sentido pra você.`,
        benefits: [
          'Interface limpa, sem ruído visual',
          'Foque só nas ferramentas que você realmente usa',
          'Pode ativar/desativar a qualquer momento',
        ],
        tips: [
          'Comece simples: Missões + Hábitos + Diário',
          'Adicione Urge Surfing quando quiser trabalhar impulsos',
          'Adicione Afirmações + Visualizar quando focar em identidade',
          'Acesse em: Configurações → Interface',
        ],
      },
      {
        icon: Palette,
        title: 'Temas (Aparência)',
        color: 'text-neon-cyan',
        content: `Escolha entre vários temas visuais (neon roxo, azul, verde, etc.). O tema muda toda a paleta do sistema, deixando-o com a sua cara.`,
        benefits: [
          'Personalização visual completa',
          'Combina com seu humor ou estética favorita',
          'Mantém o app prazeroso de usar',
        ],
        tips: ['Acesse em: Configurações → Aparência'],
      },
      {
        icon: Wand2,
        title: 'Dificuldade de Progressão',
        color: 'text-destructive',
        content: `Controle quanto XP é necessário para subir de nível. No modo Normal, você precisa de 1000 XP por nível. Pode reduzir para 500 (Fácil), 250 (Muito Fácil) ou aumentar a dificuldade conforme evoluir.`,
        benefits: [
          'Adapta o ritmo de progressão ao seu momento',
          'Iniciantes: vitórias rápidas constroem o hábito',
          'Veteranos: aumente o desafio para manter a chama',
        ],
        tips: [
          'Comece em Fácil para ganhar tração nas primeiras semanas',
          'Suba para Normal quando o hábito estiver firme',
          'Acesse em: Configurações → Avançado',
        ],
      },
    ],
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
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
            Bem-vindo ao guia completo do <span className="text-primary font-display">Ascensão</span>. Aqui você entende cada função do sistema, como tirar o máximo proveito dela e por que ela existe.
          </p>
        </motion.div>

        {groups.map((group) => (
          <section key={group.title} className="mb-10">
            <div className="mb-4">
              <h2 className="font-display text-base tracking-widest text-primary">
                {group.emoji} {group.title}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{group.intro}</p>
            </div>

            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className="space-y-3">
              {group.sections.map((section) => (
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

                  <div className="mt-4 space-y-4 pl-2 sm:pl-12">
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{section.content}</p>

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
          </section>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
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
