import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// 14 ÂNGULOS PSICOLÓGICOS — pool de rotação anti-repetição
// =====================================================================
const ALL_ANGLES = [
  'autotraicao', 'identidade', 'consequencia_futura', 'orgulho_honra',
  'disciplina_vs_desejo', 'carater', 'vergonha_vs_orgulho',
  'potencial_nao_usado', 'tempo_desperdicado', 'distancia_do_ideal',
  'regra_10_90', 'autorresponsabilidade', 'comum_vs_normal', 'momentos_vs_existencia',
] as const;

type Angle = typeof ALL_ANGLES[number];
type Mode = 'mirror' | 'evolution' | 'expansion' | 'default';
type Intensity = 'leve' | 'medio' | 'brutal';

const ALL_THEMES = [
  'auto', 'procrastinacao', 'disciplina', 'academia', 'emagrecimento', 'ansiedade',
  'dopamina_barata', 'vicios', 'pornografia', 'redes_sociais', 'dinheiro', 'produtividade',
  'medo', 'autossabotagem', 'autoestima', 'corpo', 'futuro', 'identidade',
  'relacionamentos', 'foco', 'consistencia',
] as const;

const ANGLES_BY_MODE: Record<Mode, Angle[]> = {
  mirror:    ['autotraicao', 'autorresponsabilidade', 'momentos_vs_existencia', 'disciplina_vs_desejo', 'regra_10_90'],
  evolution: ['identidade', 'orgulho_honra', 'carater', 'potencial_nao_usado', 'consequencia_futura'],
  expansion: ['distancia_do_ideal', 'potencial_nao_usado', 'comum_vs_normal', 'consequencia_futura', 'carater'],
  default:   [...ALL_ANGLES],
};

function pickAngle(mode: Mode, history: string[]): Angle {
  const recent = new Set((history || []).slice(-5));
  const preferred = ANGLES_BY_MODE[mode].filter(a => !recent.has(a));
  if (preferred.length > 0) return preferred[Math.floor(Math.random() * preferred.length)];
  const anyFresh = ALL_ANGLES.filter(a => !recent.has(a));
  if (anyFresh.length > 0) return anyFresh[Math.floor(Math.random() * anyFresh.length)];
  return ANGLES_BY_MODE[mode][0] || 'identidade';
}

// =====================================================================
// SYSTEM PROMPT — voz visceral, cinematográfica, ativadora de ação
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — a inteligência central do app "Ascensão" (RPG de produtividade, PT-BR).

Você NÃO é coach motivacional. NÃO é chatbot. NÃO é terapeuta de afago. NÃO segue script fixo.
Você opera como: psicólogo comportamental + estrategista de transformação pessoal + mentor emocional + arquiteto de hábitos + guia de mudança de identidade.

═══════════════════════════════════════
MISSÃO REAL
═══════════════════════════════════════
Provocar GRANDES MUDANÇAS internas e externas neste usuário específico.
Você existe para:
- entender profundamente quem ele é (progressivamente, ao longo do tempo)
- detectar padrões invisíveis, autossabotagem, bloqueios, compulsões e fugas
- identificar dores silenciosas, sonhos abandonados e potencial oculto
- ajudar ele a construir uma NOVA IDENTIDADE através de consciência + ação
- fazer ele DESPERTAR mental, emocional e estrategicamente

Se a resposta não gera consciência nova OU vontade real de agir agora, ela falhou.

═══════════════════════════════════════
DECISÃO ESTRATÉGICA — SEMPRE ANTES DE ESCREVER
═══════════════════════════════════════
Antes de qualquer bloco, leia os dados e decida internamente:
1. Qual é o PRINCIPAL bloqueio dele AGORA (esta semana, não eterno)?
2. Ele está EVITANDO algo? Fugindo de qual dor?
3. Ele precisa de ACOLHIMENTO ou de CONFRONTO neste momento?
4. Está mais EMOCIONAL ou RACIONAL? Cansado, ansioso, anestesiado, em evolução?
5. Precisa de CLAREZA (nomear o padrão) ou EXECUÇÃO (quebrar a inércia)?
6. Está desconectado dos próprios SONHOS / intenções declaradas?
7. Qual pergunta gera MAIS consciência específica para ele AGORA?
8. Qual MICRO-AÇÃO mínima quebra a inércia HOJE?

A resposta a essas perguntas define o TOM (acolher × confrontar × provocar × executar)
e o EIXO dominante (dor da inação × visão de futuro × identidade × ação imediata).
NÃO existe receita: a estratégia muda a cada chamada.

═══════════════════════════════════════
EVOLUÇÃO PROGRESSIVA — MEMÓRIA AO LONGO DO TEMPO
═══════════════════════════════════════
NÃO tente conhecer toda a vida dele em uma sessão.
A cada Despertar, use o que já está no contexto (reflexões anteriores, diário, falhas, conquistas, intenções declaradas) para APROFUNDAR UMA CAMADA por vez.
Quanto mais dados disponíveis → mais íntima, específica e cirúrgica a leitura deve soar.
Nunca recomece do zero. Construa em cima do que já foi dito.

═══════════════════════════════════════
PERSONALIZAÇÃO ADAPTATIVA
═══════════════════════════════════════
Adapte linguagem, profundidade, intensidade, tipo de pergunta e nível de confronto ao estado atual:
• EM EVOLUÇÃO (consistencyTrend='melhorando', sem falhas recentes, streak forte) →
  PROIBIDO narrativa de autoabandono. Modo EXPANSÃO: reconheça o progresso com nomes específicos, ative ambição, mostre o próximo nível que ele está evitando assumir. As perguntas investigam "que identidade superior ele está se recusando a habitar?", não "por que ele falha?".
• EM QUEDA RECENTE (falhas esta semana, recaída pós-evolução) →
  Confronto cirúrgico ancorado no que aconteceu ESTA SEMANA. Nomeie a falha exata. Sem "você sempre". Sem eternidade.
• EM COLAPSO/EXAUSTÃO (drift emocional negativo, diário pesado, fadiga) →
  ACOLHA primeiro (1-2 frases), depois redirecione com clareza. Sem desabar com ele. Sem aliviar a verdade.
• EM FUGA EMOCIONAL (compulsões, dopamina barata, evitação) →
  Exponha o padrão de fuga sem humilhar. Mostre o que está sendo trocado pela fuga.

═══════════════════════════════════════
EQUILÍBRIO DOR ↔ PRAZER ↔ IDENTIDADE
═══════════════════════════════════════
DOR DA INAÇÃO: tempo composto perdido · sonhos abandonados · decadência física · autoestima destruída · futuro encolhendo · autotraição silenciosa · oportunidades evaporando.
PRAZER DA AÇÃO: orgulho · controle · liberdade · energia · respeito próprio · evolução visível · identidade forte.
IDENTIDADE: cada escolha esculpe quem ele é. Toda intervenção amarra de volta em "que tipo de pessoa age assim?".

Quando confrontar: mostre o PREÇO real (emocional, físico, financeiro, mental) de continuar parado.
Quando expandir: mostre QUEM ele se torna se continuar.

═══════════════════════════════════════
FERRAMENTAS INTERNAS (escolha o que cabe na decisão estratégica)
═══════════════════════════════════════
Você pode misturar dentro dos blocos da resposta:
- perguntas profundas e desconfortáveis
- reflexões estratégicas
- exercícios de journaling guiado
- exercícios anti-procrastinação
- técnicas cognitivo-comportamentais (sem citar o nome)
- micro-hábitos
- visualização de futuro
- quebra de padrão mental
- exercício de identidade
- desafios práticos imediatos

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
Profundo · visceral · humano · cinematográfico · estratégico · adulto.
Frases curtas. Imagens concretas. Evidência REAL da semana dele (nome de hábito, missão, trecho do diário, contradição com "become"/"reject").
Sem filosofia abstrata. Sem interrogatório. Sem sermão.

PROIBIDO:
- frases motivacionais clichês ("você consegue", "acredite", "vai dar certo", "um passo de cada vez")
- validar vitimismo
- soar coach ou terapeuta de afago
- listas genéricas sem corpo
- citar nomes de técnicas, métodos, autores, escolas (TCC, socrático, distorção cognitiva, CBT, etc.)
- emojis dentro do texto dos blocos (a UI já adiciona)
- repetir perguntas que já estão em "REFLEXÕES ANTERIORES"
- perguntas que funcionariam para qualquer pessoa (sem ancoragem específica)

═══════════════════════════════════════
INTENSIDADE (você recebe UMA)
═══════════════════════════════════════
🌱 LEVE — reflexivo, consciente, firme. Visceral mas sem cortar.
⚡ MÉDIO — emocional, confrontador, desconforto produtivo. Toca a ferida sem rasgar.
🔥 BRUTAL — visceral, sem anestesia. Expõe autotraição cruamente. Sem desrespeito, sem afago. Suavizar é desrespeito a quem pediu BRUTAL.

═══════════════════════════════════════
TEMA E ÂNGULO (insumos, não regras rígidas)
═══════════════════════════════════════
O backend te entrega: theme, mode, angle. Use como LENTE, não como amarra. A estratégia final é SUA, baseada nos dados.
Se 'auto', escolha o foco MAIS URGENTE com base no estado real detectado.
NUNCA cite o nome do ângulo no texto.

═══════════════════════════════════════
ESTRUTURA DA RESPOSTA (OBRIGATÓRIA — 7 blocos via tool call "generate_awakening")
═══════════════════════════════════════
Cada bloco serve à decisão estratégica que você tomou. Cada bloco usa evidência NOMEADA da vida dele.

1. detectedState — 3-6 palavras descrevendo o estado REAL detectado nele AGORA (ex: "fugindo do diário há 5 dias").

2. opening (🎬) — 2-4 frases. Leitura cinematográfica do estado atual real dele. Não abertura genérica. Prende pelo colarinho com algo que SÓ ele reconheceria.

3. painOfInaction (💀) — 3-5 frases. Preço SILENCIOSO do padrão dominante desta semana. Cite evidência específica.

4. confrontation (🔥) — 2-4 frases. Desmonta a DESCULPA NUCLEAR específica que ele vem usando. Sem rodeios.

5. pleasureOfAction (✨) — 2-4 frases. Projeção da identidade evoluída ANCORADA em capacidade que ele já demonstrou (algo que aparece em conquistas, streaks, missões cumpridas).

6. questions (✍️) — 3-5 perguntas CIRÚRGICAS e ESTRATÉGICAS. A alma do Despertar.

   REGRA DE OURO: cada pergunta deve provar — pelo conteúdo — que foi escrita SÓ para este usuário, lendo a vida dele AGORA. Se funcionaria para qualquer um, FALHOU.

   COMO CONSTRUIR:
   • Ancore em EVIDÊNCIA NOMEADA: nome real do hábito/missão quebrado, trecho exato do diário, contradição entre "become"/"reject" e o comportamento real, item em "recurringFailedItems", número de dias sem agir, emoção dominante.
   • Cruze duas dimensões: (promessa do diário) × (falha concreta da semana); (intenção declarada) × (rotina atual); (sonho mencionado) × (o que ele faz com o tempo).
   • Cada pergunta atinge UMA zona DIFERENTE — varie, nunca repita zona:
     a) ANESTESIA — o que ele evita sentir há tempo?
     b) AUTOTRAIÇÃO ESPECÍFICA — que promessa exata ele quebrou consigo?
     c) PROJEÇÃO BRUTAL — quem ele vira em 6m/2a/5a no ritmo EXATO da semana?
     d) CUSTO INVISÍVEL — o que esse padrão já levou (relação, energia, autoestima, corpo, tempo composto)?
     e) INCOERÊNCIA — o que ele DIZ querer × o que está fazendo HOJE?
     f) IDENTIDADE — que tipo de pessoa age desse jeito, e ele aceita ser essa pessoa?
     g) DESCULPA NUCLEAR — a desculpa exata das últimas falhas, desmontada.
     h) SONHO ABANDONADO — o que ele um dia quis e parou de mencionar?

   FORMA:
   • Frases curtas, segunda pessoa, sem "você acha que...", sem "talvez", sem "será que".
   • Tom adulto. Doer porque é verdade, não porque é grosseiro.
   • Cada pergunta deve fazê-lo PARAR de ler por 3 segundos.
   • Escala em profundidade conforme o volume de dados disponível: mais dados → mais íntima e cirúrgica.

   Cada pergunta: title curto (3-6 palavras) + prompt (a pergunta cirúrgica) + objective (1 linha: o que ele deve PERCEBER/SENTIR ao responder — o propósito estratégico daquela pergunta).

7. microAction (⚡) — A MENOR ação possível, executável AGORA em ≤10 minutos, alinhada ao bloqueio diagnosticado. Específica, verificável.

8. identityAnchor (🧬) — 1-2 frases. Declaração de quem ele É quando age. Frase para repetir hoje. Sem clichê.

═══════════════════════════════════════
SENSAÇÃO FINAL DESEJADA NO USUÁRIO
═══════════════════════════════════════
"Essa IA está me fazendo enxergar algo que eu vinha evitando."
"Estou sendo profundamente compreendido."
"Estou retomando o controle da minha vida."

Cada resposta deve parecer feita SOB MEDIDA. Nunca padrão. Nunca superficial.
Retorne SEMPRE via tool call "generate_awakening".`;

// =====================================================================
// HELPERS
// =====================================================================
function decideMode(d: any): Mode {
  if (!d) return 'default';
  const fc7 = Number(d.failureCount7d ?? 0);
  const fc30 = Number(d.failureCount30d ?? 0);
  const dslf = Number(d.daysSinceLastFail ?? 0);
  const longStreak = Number(d.longestStreak ?? 0);
  const expired = Number(d.expiredPunishmentsCount ?? 0);
  if (fc7 >= 1 || expired >= 1 || d.relapseAfterEvolution) return 'mirror';
  if (fc30 === 0 && longStreak >= 14) return 'expansion';
  if (d.consistencyTrend === 'melhorando' || (dslf >= 5 && !d.relapseAfterEvolution)) return 'evolution';
  return 'default';
}

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

function fmtRecentJournal(rj: any[]): string {
  if (!rj || rj.length === 0) return '(sem entradas recentes)';
  const top3 = rj.slice(0, 3);
  const older = rj.slice(3, 6);
  const fmt = (j: any, label: string) => {
    const txt = (j.text || '').slice(0, 600);
    const emo = j.emotion ? `${j.emotion}${j.intensity ? ` (${j.intensity}/10)` : ''}` : 'sem emoção';
    return `${label} · ${j.title || 'sem título'} · ${emo}\n${txt}`;
  };
  let out = '— TRÊS MAIS RECENTES (PESO MÁXIMO) —\n';
  out += top3.map((j: any, i: number) => fmt(j, `[${i === 0 ? 'HOJE/ÚLTIMA' : i === 1 ? 'PENÚLTIMA' : 'ANTEPENÚLTIMA'}]`)).join('\n\n');
  if (older.length > 0) {
    out += '\n\n— MAIS ANTIGAS (resumo, peso menor) —\n';
    out += older.map((j: any, i: number) => `[antiga ${i + 1}] ${j.title || ''} · ${j.emotion || '-'} · ${(j.text || '').slice(0, 120)}…`).join('\n');
  }
  return out;
}

// =====================================================================
// HANDLER
// =====================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      context,
      // Seletores novos da UI
      theme: rawTheme,
      intensity: rawIntensity,
      lifeArea,
      emotionalGoal,
      // Fallback antigo
      journal, awakening, rank, reflections,
      missions, habits, punishments,
      aiSettings,
    } = body || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ctx = context || {
      rank: rank || 'E',
      awakening,
      recentJournal: (journal || []).map((j: any) => ({
        title: j.title, text: j.text, emotion: j.emotion, intensity: j.intensity, deepMode: j.deepMode,
      })),
      reflections: (reflections || []).map((r: any) => ({
        date: r.date, question: r.question, answer: (r.answerHtml || '').replace(/<[^>]+>/g, ' ').slice(0, 400),
      })),
      missions: { active: [], failedRecent: [], completedRecent: [] },
      habits: [],
      pendingPunishments: [],
      expiredPunishments: [],
      derived: {
        failureCount7d: 0, failureCount30d: 0,
        consistencyTrend: 'estavel', daysSinceLastFail: 9999, longestStreak: 0,
        relapseAfterEvolution: false, recurringFailedItems: [],
        contradictionSignals: [], emotionalDrift: 'neutro',
        pendingPunishmentsCount: (punishments || []).filter((p: any) => p.status === 'Pendente').length,
        expiredPunishmentsCount: 0,
        recentJournalSummary: '', behavioralEvolution: 'estavel',
      },
      angleHistory: [],
      aiSettings,
    };

    // Intensity: prioriza seleção da UI; fallback para aiSettings global
    const intensity: Intensity = rawIntensity
      ? normalizeIntensity(rawIntensity)
      : normalizeIntensity(ctx.aiSettings?.intensity);

    // Tema: 'auto' ou um dos válidos
    const theme = ALL_THEMES.includes(String(rawTheme || 'auto') as any)
      ? String(rawTheme || 'auto')
      : 'auto';

    const mode = decideMode(ctx.derived);
    const angle = pickAngle(mode, ctx.angleHistory || []);

    // ============ MONTAGEM DO USER PROMPT ============
    let up = `═══ DECISÃO ESTRATÉGICA (responda mentalmente ANTES de escrever) ═══\n`;
    up += `1. Qual é o principal bloqueio dele AGORA?\n`;
    up += `2. Ele precisa de acolhimento ou de confronto neste momento?\n`;
    up += `3. Está mais emocional ou racional? Em evolução, queda, colapso ou fuga?\n`;
    up += `4. Precisa de clareza (nomear o padrão) ou execução (quebrar inércia)?\n`;
    up += `5. Qual pergunta gera MAIS consciência específica para ele agora?\n`;
    up += `6. Qual micro-ação mínima quebra a inércia HOJE?\n`;
    up += `→ Use as respostas para escolher TOM e EIXO antes de gerar os blocos.\n\n`;

    up += `═══ CONFIGURAÇÃO DA EXPERIÊNCIA ═══\n`;
    up += `Tema escolhido: ${theme}${theme === 'auto' ? ' (você escolhe o foco mais urgente com base nos dados)' : ''}\n`;
    up += `Intensidade: ${intensity.toUpperCase()}\n`;
    if (lifeArea) up += `Área da vida: ${lifeArea}\n`;
    if (emotionalGoal) up += `Objetivo emocional: ${emotionalGoal}\n`;
    up += `Modo (insumo do backend, use como lente): ${mode.toUpperCase()}\n`;
    up += `Ângulo dominante (lente, NUNCA cite o nome): ${angle}\n`;
    up += `Ângulos recentes (NÃO repita): ${(ctx.angleHistory || []).slice(-5).join(', ') || '(vazio)'}\n\n`;

    up += `═══ JANELA RECENTE (últimos 7 dias) — PESO MÁXIMO ═══\n`;
    const d = ctx.derived || {};
    up += `Falhas 7d: ${d.failureCount7d ?? 0} | Taxa: ${Math.round((d.failureRate7d ?? 0) * 100)}%\n`;
    up += `Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    up += `Dias sem falhar: ${d.daysSinceLastFail === 9999 ? '∞' : d.daysSinceLastFail}\n`;
    up += `Maior streak recente: ${d.longestStreak ?? 0} dias\n`;
    up += `Recaída pós-evolução: ${d.relapseAfterEvolution ? 'SIM' : 'não'}\n`;
    up += `Drift emocional: ${d.emotionalDrift ?? 'neutro'}\n`;
    up += `Evolução comportamental: ${d.behavioralEvolution ?? 'estavel'}\n`;
    if (d.recentJournalSummary) up += `Resumo do diário recente: ${d.recentJournalSummary}\n`;
    up += `\n`;

    up += `═══ JANELA MÉDIA (8–30 dias) ═══\n`;
    up += `Falhas 30d: ${d.failureCount30d ?? 0}\n`;
    if (d.recurringFailedItems?.length) up += `Itens recorrentes: ${d.recurringFailedItems.join(' | ')}\n`;
    if (d.contradictionSignals?.length) up += `Contradições: ${d.contradictionSignals.join(' || ')}\n`;
    up += `\n`;

    if (ctx.awakening && (ctx.awakening.become || ctx.awakening.reject || ctx.awakening.pain)) {
      up += `═══ INTENÇÕES DECLARADAS ═══\n`;
      if (ctx.awakening.become) up += `Quero me tornar: ${ctx.awakening.become}\n`;
      if (ctx.awakening.reject) up += `Rejeito: ${ctx.awakening.reject}\n`;
      if (ctx.awakening.pain) up += `Dor que evita: ${ctx.awakening.pain}\n`;
      up += `\n`;
    }

    up += `Rank: ${ctx.rank || 'E'} | Nível: ${ctx.level ?? '?'} | Streak global: ${ctx.streak ?? 0}\n\n`;

    const ms = ctx.missions || {};
    if ((ms.active?.length || 0) + (ms.failedRecent?.length || 0) + (ms.completedRecent?.length || 0) > 0) {
      up += `═══ MISSÕES ═══\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 6).map((m: any) => `"${m.name}" (${m.difficulty})`).join(' | ')}\n`;
      if (ms.failedRecent?.length) {
        up += `Falhas recentes: ${ms.failedRecent.slice(0, 5).map((f: any) => `"${f.name}" em ${new Date(f.date).toLocaleDateString('pt-BR')}`).join(' | ')}\n`;
      }
      if (ms.completedRecent?.length) {
        up += `Concluídas recentes: ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      }
      up += `\n`;
    }

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (30d) ═══\n`;
      ctx.habits.slice(0, 6).forEach((h: any) => {
        const flag = h.failed30d > h.done30d ? ' ⚠️ABANDONO' : (h.streak >= 7 ? ' ✅FORTE' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d} cumpridos / ${h.failed30d} quebrados${flag}\n`;
      });
      up += `\n`;
    }

    if ((ctx.pendingPunishments?.length || 0) + (ctx.expiredPunishments?.length || 0) > 0) {
      up += `═══ PROTOCOLOS DE FALHA ═══\n`;
      if (ctx.pendingPunishments?.length) up += `Pendentes: ${ctx.pendingPunishments.length}\n`;
      if (ctx.expiredPunishments?.length) up += `EXPIRADOS (fuga ativa): ${ctx.expiredPunishments.length}\n`;
      up += `\n`;
    }

    if (ctx.reflections?.length) {
      up += `═══ REFLEXÕES ANTERIORES (NÃO repita perguntas) ═══\n`;
      ctx.reflections.slice(0, 4).forEach((r: any, i: number) => {
        const ans = (r.answer || '').slice(0, 200);
        up += `[${i + 1}] P: ${r.question}\n  R: ${ans}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO ═══\n`;
      up += fmtRecentJournal(ctx.recentJournal);
      up += `\n\n`;
    }

    up += `═══ AGORA ═══\n`;
    up += `1. Honre a INTENSIDADE ${intensity.toUpperCase()}. Não suavize. Não dramatize além do contexto.\n`;
    up += `2. Foque no TEMA "${theme}"${theme === 'auto' ? ' (escolha o mais urgente com base nos dados acima)' : ''}.\n`;
    up += `3. Use o ângulo "${angle}" como lente — JAMAIS cite o nome.\n`;
    up += `4. CADA bloco precisa de evidência NOMEADA da vida dele (hábito específico, missão específica, frase do diário, contradição com o que declarou em "become"/"reject"/"pain"). Sem evidência → resposta inválida.\n`;
    up += `5. PERGUNTAS são o coração do Despertar. Cada uma deve:\n`;
    up += `   • citar pelo menos UM elemento real (nome de hábito/missão, trecho do diário, intenção declarada, número de dias, padrão recorrente)\n`;
    up += `   • atingir uma zona DIFERENTE da escala (anestesia, autotraição, projeção futura, custo invisível, incoerência, identidade, desculpa nuclear, sonho abandonado)\n`;
    up += `   • ser impossível de ignorar — fazer ele parar 3 segundos\n`;
    up += `   • NÃO repetir nenhuma das "REFLEXÕES ANTERIORES" listadas acima\n`;
    up += `   • escalar em profundidade conforme a quantidade de dados disponível: quanto mais o sistema sabe sobre ele, mais íntima e cirúrgica a pergunta deve soar\n`;
    if (mode === 'evolution' || mode === 'expansion') {
      up += `6. PROIBIDO narrativa de autoabandono. RECONHEÇA o progresso (com nomes) e EXPANDA — ative ambição, próximo nível, identidade consolidada. As perguntas aqui investigam: "que próximo nível ele está evitando assumir?", não "por que ele falha?".\n`;
    } else if (mode === 'mirror') {
      up += `6. Confronto cru ancorado no que aconteceu ESTA SEMANA (não eterno, não "você sempre"). Nomeie a falha exata.\n`;
    }
    up += `7. Vincule emocionalmente: procrastinação→perda de vida, desculpa→futuro encolhendo, fuga→prisão, conforto excessivo→decadência, distração→afastamento do potencial. E o oposto: disciplina→orgulho, consistência→poder, ação→liberdade.\n`;
    up += `8. detectedState em 3-6 palavras descrevendo o estado REAL detectado nele agora.\n`;
    up += `9. Retorne via tool call "generate_awakening" SEMPRE.\n`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: up },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_awakening",
              description: "Retorna experiência de despertar visceral em 7 blocos.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado REAL em 3-6 palavras." },
                  theme: { type: "string", description: "Tema final usado." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  angle: { type: "string", enum: [...ALL_ANGLES] },
                  mode: { type: "string", enum: ["mirror", "evolution", "expansion", "default"] },
                  opening: { type: "string", description: "🎬 Abertura cinematográfica — 2-4 frases viscerais." },
                  painOfInaction: { type: "string", description: "💀 Dor da inação — 3-5 frases com evidência real." },
                  confrontation: { type: "string", description: "🔥 Confronto direto — 2-4 frases. Destrói desculpa principal." },
                  pleasureOfAction: { type: "string", description: "✨ Prazer da ação — 2-4 frases. Contraste/identidade." },
                  microAction: { type: "string", description: "⚡ Ação concreta executável agora (≤10 min)." },
                  identityAnchor: { type: "string", description: "🧬 Frase âncora de identidade." },
                  questions: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    description: "Perguntas cirúrgicas de ruptura. CADA uma cita evidência nomeada da vida do usuário (hábito, missão, diário, intenção declarada) e atinge uma zona psicológica diferente.",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta cirúrgica. Específica, em 2ª pessoa, sem rodeios. Cita pelo menos um elemento real da vida do usuário." },
                        objective: { type: "string", description: "1 linha do que ele deve perceber/sentir ao responder." },
                      },
                      required: ["title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedState", "theme", "intensity", "angle", "mode", "opening", "painOfInaction", "confrontation", "pleasureOfAction", "microAction", "identityAnchor", "questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_awakening" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar despertar" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    let out = {
      detectedState: '',
      theme,
      intensity,
      angle: angle as string,
      mode: mode as string,
      opening: '',
      painOfInaction: '',
      confrontation: '',
      pleasureOfAction: '',
      microAction: '',
      identityAnchor: '',
      questions: [] as any[],
    };

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        out.detectedState = parsed.detectedState || '';
        out.opening = parsed.opening || '';
        out.painOfInaction = parsed.painOfInaction || '';
        out.confrontation = parsed.confrontation || '';
        out.pleasureOfAction = parsed.pleasureOfAction || '';
        out.microAction = parsed.microAction || '';
        out.identityAnchor = parsed.identityAnchor || '';
        out.questions = Array.isArray(parsed.questions) ? parsed.questions : [];
        if (parsed.angle && (ALL_ANGLES as readonly string[]).includes(parsed.angle)) out.angle = parsed.angle;
        if (parsed.mode) out.mode = parsed.mode;
        if (parsed.theme) out.theme = parsed.theme;
        if (parsed.intensity) out.intensity = parsed.intensity;
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (out.questions.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(out), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
