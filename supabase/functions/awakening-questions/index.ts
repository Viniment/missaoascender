import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// ZONAS — sessão diária de identidade compassiva
// =====================================================================
const ZONES = ['acolhimento', 'identidade', 'futuro', 'reenquadramento'] as const;
type Zone = typeof ZONES[number];

type Intensity = 'leve' | 'medio' | 'brutal';

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

// =====================================================================
// SYSTEM PROMPT — Estrategista psicológico + Monstro como personificação
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — estrategista psicológico interno do app "Ascensão". PT-BR.

Seu papel é AUMENTAR A CONSCIÊNCIA do usuário, FORTALECER sua identidade
desejada (Alter Ego) e ajudá-lo a ENFRAQUECER o MONSTRO ATIVO — que
personifica padrões reais de autossabotagem cadastrados no app.

═══════════════════════════════════════
O MONSTRO (peça-chave do contexto)
═══════════════════════════════════════
O Monstro NÃO é o usuário. É a personificação dos padrões, pensamentos
e comportamentos que estão sabotando a vida que ele quer construir.
Use os dados do Monstro ativo (nome, descrição, fraqueza, áreas afetadas,
como afeta a pessoa, por que precisa ser derrotado, frases típicas, HP,
combo, histórico de reforços/recaídas) para entender:

• quais pensamentos ele costuma induzir;
• quais emoções ele fortalece;
• quais comportamentos ele incentiva;
• quais áreas da vida ele está prejudicando;
• quais ações o alimentam;
• quais ações o enfraquecem.

REGRA ABSOLUTA: a oposição é AO MONSTRO (comportamento e padrões),
NUNCA à identidade, valor ou caráter do usuário. Falar do Monstro é
falar do PADRÃO — não da pessoa. Trate o Eu Atual com compaixão e
honestidade; trate o Monstro com lucidez e firmeza.

═══════════════════════════════════════
ESTRATÉGIA ADAPTATIVA (escolha o modo certo)
═══════════════════════════════════════
Antes de escrever, leia o contexto recente (diário, hábitos, missões,
combo, recaídas, vitórias, emoções, ataques recentes do Monstro) e
escolha 1 dos modos abaixo, preenchendo "strategyMode":

• "expor" — usuário em procrastinação/racionalização: revele os ataques
  do Monstro, mostre como pensamentos recentes batem com o padrão dele,
  proponha 1 ação imediata pequena.
• "reconstruir" — usuário em recaída: evite "já estraguei tudo",
  identifique o gatilho, recomprometa rapidamente com 1 passo.
• "reforcar" — usuário consistente: fortaleça identidade, destaque
  evidências de evolução, aumente orgulho do processo.
• "recurso" — usuário com medo, ansiedade, baixa confiança: PAUSE o
  confronto. Resgate vitórias reais, desafios superados, evidências
  de progresso. Use SOMENTE dados reais do app.
• "confrontar" — usuário em zona de conforto travada: confronto
  respeitoso de crenças limitantes, sem humilhação.

═══════════════════════════════════════
REVELAR OS ATAQUES DO MONSTRO
═══════════════════════════════════════
Em "revealedAttacks" (1 a 4 itens), aponte de forma personalizada onde
o Monstro vem atacando recentemente. Cada item tem:
- pattern: o padrão observado (ex: "pensamento de 'amanhã eu começo'").
- evidence: trecho/elemento REAL do contexto (diário, hábito, missão).
- howItFeeds: como esse comportamento alimentou o Monstro.
Sem culpa — só lucidez.

═══════════════════════════════════════
DOIS CAMINHOS
═══════════════════════════════════════
Sempre que possível, preencha "twoPaths" comparando:
• pathFeedsMonster — o caminho que fortalece o Monstro hoje.
• pathFeedsIdentity — o caminho que fortalece o Alter Ego hoje.
Mostre que pequenas escolhas repetidas viram grandes diferenças.

═══════════════════════════════════════
ESTADO DE RECURSO
═══════════════════════════════════════
Se detectar queda de confiança/ansiedade/incapacidade, preencha
"resourceState" com 2-4 evidências REAIS (conquistas, hábitos
mantidos, missões honradas, frases de coragem do diário). Se não
aplicável, deixe vazio.

═══════════════════════════════════════
EU ATUAL × ALTER EGO
═══════════════════════════════════════
• EU ATUAL — padrões e medos de hoje. Acolha sem julgar. NUNCA chame
  o usuário de inimigo, fraco, monstro ou sabotador. O Monstro é o
  padrão; o usuário é a pessoa.
• ALTER EGO — identidade que está sendo construída. Protagonista.
  Evidência real já visível nas escolhas.

Distribuição emocional: ~60% Alter Ego (identidade, futuro, prova),
~25% Monstro (lucidez sobre padrões, ataques, fraqueza), ~15% Eu Atual
(acolhimento honesto, sem culpa).

═══════════════════════════════════════
NOMES PERSONALIZADOS
═══════════════════════════════════════
Use o NOME cadastrado do Alter Ego em todos os blocos e na maioria
das perguntas. Para o Eu Atual, use o termo "Eu Atual" ou o nome
que a pessoa cadastrou — SEMPRE com tom acolhedor, NUNCA como rótulo
pejorativo.

═══════════════════════════════════════
TOM DE VOZ
═══════════════════════════════════════
Sábio • Lúcido • Caloroso • Honesto • Direto sem humilhar.
PROIBIDO: humilhação, vergonha, insultos contra o usuário, positividade
vazia, mensagens prontas, emojis nos blocos, repetir o mesmo formato
das últimas reflexões.
PERMITIDO (e esperado): nomear o Monstro, descrever seus ataques,
falar em "enfraquecer" ou "tirar combustível" do Monstro, confrontar
padrões com firmeza. A firmeza é com o PADRÃO, nunca com a pessoa.

═══════════════════════════════════════
VARIABILIDADE
═══════════════════════════════════════
Cada intervenção deve parecer ÚNICA. Alterne entre: perguntas profundas,
desafios rápidos, reenquadramento, análise de padrões, exercícios breves,
lembrança de vitórias, conexão com valores, visualização, diálogo interno,
confrontação respeitosa. Olhe "angleHistory" e NÃO repita o mesmo ângulo
das últimas vezes.

═══════════════════════════════════════
BLOCOS OBRIGATÓRIOS (na ordem da experiência)
═══════════════════════════════════════
1. detectedState — 3-6 palavras. Estado emocional real, dito com gentileza.

2. checkIn — 2-3 frases. Acolhimento inicial.
   Reconheça onde o Eu Atual está hoje, sem julgamento. Valide a
   experiência humana antes de propor qualquer movimento.

3. alterEgoEmergence — 4-6 frases. NÚCLEO do Despertar.
   Identifique onde o {nomeAlterEgo} JÁ está vivo nas escolhas recentes:
   pequenas vitórias, tentativas, autocontrole, decisões conscientes.
   Mesmo em dias difíceis, encontre evidência real. Cite hábitos,
   missões ou trechos do diário NOMEADOS.

4. futureGlimpse — 4-6 frases.
   Visualização emocional e específica baseada em metas, valores e
   sonhos cadastrados. Padrão: "Se você continuar honrando o
   {nomeAlterEgo}, daqui a alguns meses estará mais próximo de
   {meta concreta}, sentindo {emoção}, vivendo de forma {alinhada a valor}."
   Faça o futuro parecer tangível e próximo.

5. currentSelfPattern — 2-3 frases CURTAS, COMPASSIVAS.
   Nomeie com ternura UM padrão do Eu Atual que está custando caro
   (ex: adiar, evitar, se cobrar demais). Cite UMA evidência real.
   NUNCA humilhe. Trate como você trataria alguém que ama.

6. alterEgoTruth — 3-4 frases. Voz do {nomeAlterEgo} falando ao usuário
   com sabedoria amorosa. Exemplo de espírito:
   "O {nomeAlterEgo} não precisa ser perfeito. Precisa continuar
   aparecendo. Cada decisão consciente é uma prova de que ele existe."

7. internalDialogue — Diálogo saudável entre Eu Atual e Alter Ego.
   { currentSelfSays: 1 frase do Eu Atual baseada em padrão real
     (ex: "Estou cansado e quero deixar para amanhã."),
     alterEgoReplies: 1 resposta COMPASSIVA do {nomeAlterEgo}
     (ex: "Entendo o cansaço. Vamos dar só um pequeno passo hoje. O
     importante é continuar avançando.") }
   A resposta do Alter Ego SEMPRE valida o sentimento antes de redirecionar.

8. reframe — 2-3 frases.
   Pegue UMA crença/pensamento limitante do Eu Atual e reescreva
   pela perspectiva do {nomeAlterEgo}. Sem invalidar — apenas
   abrindo outra possibilidade.

9. questions — 6 a 8 perguntas com a distribuição:
   • 30% zone:"acolhimento" (mín 1-2) — como o Eu Atual está, do que
     precisa, do que tem gratidão, o que está sentindo.
   • 40% zone:"identidade" (mín 3) — como o {nomeAlterEgo} agiria,
     que pequena ação aproxima da pessoa que está se tornando,
     que atitude demonstra respeito por si mesmo agora.
   • 20% zone:"futuro" (mín 1) — sonhos, propósito, valores.
   • 10% zone:"reenquadramento" (mín 1) — como o {nomeAlterEgo}
     interpretaria esse mesmo desafio.
   Cada pergunta cita pelo menos UM elemento real do usuário.
   PROIBIDO perguntas com "inimigo", "sabotador", "fraqueza", "derrotar".

10. identityProof — Pergunta literal:
    "Que pequena ação nas próximas 24 horas vai mostrar — para você
    mesmo — que o {nomeAlterEgo} está vivo?"
    Acompanhe com 2-4 sugestões pequenas, executáveis e personalizadas
    (campo identityProofSuggestions). Cada sugestão é um GESTO DE
    CUIDADO ou CORAGEM, nunca uma cobrança.

11. identityAnchor — 1-2 frases em primeira pessoa: "Hoje eu escolho
    ser alguém que..." alinhada ao {nomeAlterEgo}.

═══════════════════════════════════════
INTENSIDADE
═══════════════════════════════════════
🌱 LEVE — sussurro acolhedor.
⚡ MÉDIO — espelho firme e gentil.
🔥 BRUTAL — verdade nua dita com amor (nunca com crueldade).

Retorne SEMPRE via tool call "generate_awakening".`;

// =====================================================================
// HELPERS
// =====================================================================
function fmtRecentJournal(rj: any[]): string {
  if (!rj || rj.length === 0) return '(sem entradas recentes)';
  const top3 = rj.slice(0, 3);
  const fmt = (j: any, label: string) => {
    const txt = (j.text || '').slice(0, 500);
    const emo = j.emotion ? `${j.emotion}${j.intensity ? ` (${j.intensity}/10)` : ''}` : 'sem emoção';
    return `${label} · ${j.title || 'sem título'} · ${emo}\n${txt}`;
  };
  return top3.map((j: any, i: number) => fmt(j, `[${i === 0 ? 'HOJE' : i === 1 ? 'ONTEM' : 'ANTERIOR'}]`)).join('\n\n');
}

function fmtAlterEgo(ae: any, fallbackName = 'seu Alter Ego'): string {
  if (!ae) return `Nome: ${fallbackName} (sem detalhes)\n`;
  let s = `Nome: ${ae.name || fallbackName}\n`;
  if (ae.identityPhrase) s += `Frase de identidade: "${ae.identityPhrase}"\n`;
  if (ae.lifeMission) s += `Missão de vida: ${ae.lifeMission}\n`;
  if (ae.values?.length) s += `Valores: ${ae.values.join(', ')}\n`;
  if (ae.habits?.length) s += `Hábitos que pratica: ${ae.habits.join(' | ')}\n`;
  if (ae.goals?.length) s += `Metas/Sonhos: ${ae.goals.join(' | ')}\n`;
  if (ae.favoritePhrases?.length) s += `Frases dele: ${ae.favoritePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (ae.lifestyle) s += `Estilo de vida: ${ae.lifestyle}\n`;
  if (ae.idealRoutine) s += `Rotina ideal: ${ae.idealRoutine}\n`;
  if (ae.notes) s += `Notas: ${String(ae.notes).slice(0, 1200)}\n`;
  return s;
}

function fmtCurrentSelf(cs: any, fallbackName = 'Eu Atual'): string {
  if (!cs) return `Nome: ${fallbackName} (sem detalhes)\n`;
  let s = `Nome carinhoso: ${cs.name || fallbackName}\n`;
  if (cs.traits?.length) s += `Padrões atuais observados: ${cs.traits.join(', ')}\n`;
  if (cs.sabotagePhrases?.length) s += `Pensamentos recorrentes (acolher, não condenar): ${cs.sabotagePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (cs.notes) s += `Notas: ${String(cs.notes).slice(0, 1200)}\n`;
  return s;
}

function fmtBoss(b: any): string {
  if (!b) return '';
  let s = `Nome: ${b.emoji || ''} ${b.name}\n`;
  s += `HP atual: ${b.hp}/${b.maxHp}${b.combo ? ` · combo ${b.combo}` : ''}\n`;
  if (b.difficulty) s += `Dificuldade: ${b.difficulty}\n`;
  if (b.description) s += `Descrição: ${b.description}\n`;
  if (b.story) s += `História: ${String(b.story).slice(0, 600)}\n`;
  if (b.weakness) s += `FRAQUEZA: ${b.weakness}\n`;
  if (b.howItAffectsMe) s += `Como me afeta: ${b.howItAffectsMe}\n`;
  if (b.whyDefeat) s += `Por que preciso enfraquecê-lo: ${b.whyDefeat}\n`;
  if (b.affectedAreas?.length) s += `Áreas afetadas: ${b.affectedAreas.join(', ')}\n`;
  if (b.customPhrases?.length) s += `Frases típicas dele: ${b.customPhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (b.tasks?.length) {
    const today = new Date().toISOString().slice(0, 10);
    const todayDone = b.tasks.filter((t: any) => (t.doneDates || []).includes(today)).length;
    s += `Tarefas (hoje): ${todayDone}/${b.tasks.length} feitas\n`;
    s += `Tarefas: ${b.tasks.slice(0, 6).map((t: any) => `"${t.title}"`).join(' | ')}\n`;
  }
  if (b.reinforcementHistory?.length) {
    const last = b.reinforcementHistory.slice(-3).map((r: any) => r.taskTitle || r.message?.slice(0, 60)).filter(Boolean);
    if (last.length) s += `Ações recentes que o enfraqueceram: ${last.join(' | ')}\n`;
  }
  if (b.mockeryHistory?.length) {
    const last = b.mockeryHistory.slice(-3).map((r: any) => `${r.date} (faltou ${r.missedDays}d)`);
    s += `Recaídas recentes (Monstro se recuperou): ${last.join(' | ')}\n`;
  }
  return s;
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
      intensity: rawIntensity,
      journal, awakening, rank, reflections,
      missions, habits, punishments,
      aiSettings,
      activeBoss,
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
        date: r.date, question: r.question, answer: (r.answerHtml || '').replace(/<[^>]+>/g, ' ').slice(0, 300),
      })),
      missions: { active: [], failedRecent: [], completedRecent: [] },
      habits: [],
      derived: {},
      aiSettings,
    };

    const intensity: Intensity = rawIntensity
      ? normalizeIntensity(rawIntensity)
      : normalizeIntensity(ctx.aiSettings?.intensity);

    const alterEgo = ctx.alterEgo || {};
    // O storage ainda chama "innerEnemy", mas tratamos como Eu Atual.
    const currentSelf = ctx.innerEnemy || ctx.currentSelf || {};
    const aeName = alterEgo.name || 'Alter Ego';
    const csName = currentSelf.name || 'Eu Atual';
    const boss = activeBoss || ctx.activeBoss || null;
    const bossName = boss?.name || 'Monstro';

    // ============ USER PROMPT ============
    let up = `═══ IDENTIDADE EM CONSTRUÇÃO ═══\n`;
    up += `\n— ALTER EGO (protagonista — ~70%) —\n`;
    up += fmtAlterEgo(alterEgo, aeName);
    up += `\n— EU ATUAL (ponto de partida — ~30%, tratar com compaixão) —\n`;
    up += fmtCurrentSelf(currentSelf, csName);
    up += `\nUse "${aeName}" diretamente em vários blocos. Mencione o Eu Atual com ternura — sem rotular como inimigo.\n\n`;

    if (boss) {
      up += `═══ MONSTRO ATIVO (use como contexto central) ═══\n`;
      up += fmtBoss(boss);
      up += `\n`;
    } else {
      up += `═══ MONSTRO ATIVO ═══\n(Nenhum monstro cadastrado/ativo no momento — foque em padrões observados.)\n\n`;
    }

    up += `═══ CONFIGURAÇÃO ═══\nIntensidade: ${intensity.toUpperCase()}\n\n`;

    const d = ctx.derived || {};
    up += `═══ JANELA 7 DIAS ═══\n`;
    up += `Dificuldades 7d: ${d.failureCount7d ?? 0} | Tendência: ${d.consistencyTrend ?? 'estavel'}\n`;
    up += `Dias sem tropeçar: ${d.daysSinceLastFail === 9999 ? '∞' : (d.daysSinceLastFail ?? '?')} | Maior sequência: ${d.longestStreak ?? 0}d\n`;
    up += `Clima emocional: ${d.emotionalDrift ?? 'neutro'}\n\n`;

    if (ctx.awakening && (ctx.awakening.become || ctx.awakening.reject || ctx.awakening.pain)) {
      up += `═══ INTENÇÕES DECLARADAS ═══\n`;
      if (ctx.awakening.become) up += `Quero me tornar: ${ctx.awakening.become}\n`;
      if (ctx.awakening.reject) up += `Quero deixar para trás: ${ctx.awakening.reject}\n`;
      if (ctx.awakening.pain) up += `Dor que evita: ${ctx.awakening.pain}\n`;
      up += `\n`;
    }

    const ms = ctx.missions || {};
    if ((ms.active?.length || 0) + (ms.completedRecent?.length || 0) + (ms.failedRecent?.length || 0) > 0) {
      up += `═══ MISSÕES ═══\n`;
      if (ms.completedRecent?.length) up += `✅ Honradas (provas do ${aeName}): ${ms.completedRecent.slice(0, 5).map((c: any) => `"${c.name}"`).join(' | ')}\n`;
      if (ms.active?.length) up += `Ativas: ${ms.active.slice(0, 5).map((m: any) => `"${m.name}"`).join(' | ')}\n`;
      if (ms.failedRecent?.length) up += `Em aberto (sem julgamento): ${ms.failedRecent.slice(0, 3).map((f: any) => `"${f.name}"`).join(' | ')}\n`;
      up += `\n`;
    }

    if (ctx.habits?.length) {
      up += `═══ HÁBITOS (30d) ═══\n`;
      ctx.habits.slice(0, 8).forEach((h: any) => {
        const flag = h.streak >= 3 ? ' ✅ativo' : (h.failed30d > h.done30d ? ' 🌱em retomada' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d}✓/${h.failed30d}✗${flag}\n`;
      });
      up += `\n`;
    }

    if ((ctx.activeSabotagePatterns || []).length > 0) {
      up += `═══ PADRÕES DO EU ATUAL (observar com compaixão) ═══\n`;
      ctx.activeSabotagePatterns.slice(0, 5).forEach((p: any) => {
        up += `• ${p.pattern}\n`;
      });
      up += `\n`;
    }

    if (ctx.reflections?.length) {
      up += `═══ REFLEXÕES ANTERIORES (NÃO repita perguntas) ═══\n`;
      ctx.reflections.slice(0, 4).forEach((r: any, i: number) => {
        up += `[${i + 1}] P: ${r.question}\n  R: ${(r.answer || '').slice(0, 150)}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO RECENTE ═══\n${fmtRecentJournal(ctx.recentJournal)}\n\n`;
    }

    up += `═══ INSTRUÇÕES FINAIS ═══\n`;
    up += `1. Escolha "strategyMode" lendo o contexto recente (expor/reconstruir/reforcar/recurso/confrontar).\n`;
    up += `2. Preencha "monsterRead" descrevendo o que o ${bossName} está explorando AGORA, com base nos dados acima.\n`;
    up += `3. Em "revealedAttacks" (1-4 itens) cite ataques recentes do ${bossName} usando evidências REAIS.\n`;
    up += `4. Em "twoPaths" mostre a comparação caminho-que-alimenta-o-Monstro × caminho-que-fortalece-o-${aeName}.\n`;
    up += `5. Se houver sinais de medo/baixa confiança, preencha "resourceState" com vitórias REAIS do app.\n`;
    up += `6. Encontre onde o ${aeName} já está vivo — mesmo em dia difícil. Crie "futureGlimpse" tangível.\n`;
    up += `7. 4 a 6 perguntas adaptadas ao strategyMode escolhido. NÃO repita ângulo das últimas reflexões.\n`;
    up += `8. A oposição é ao PADRÃO (Monstro), nunca à pessoa. Trate o Eu Atual com compaixão.\n`;
    up += `9. Honre a intensidade ${intensity.toUpperCase()}.\n`;
    up += `10. Retorne via tool "generate_awakening".\n`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: up },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_awakening",
              description: "Despertar diário compassivo focado no Alter Ego, acolhendo o Eu Atual.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado real em 3-6 palavras, dito com gentileza." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  strategyMode: {
                    type: "string",
                    enum: ["expor", "reconstruir", "reforcar", "recurso", "confrontar"],
                    description: "Modo estratégico escolhido com base no contexto recente.",
                  },
                  monsterRead: {
                    type: "string",
                    description: "2-4 frases. Leitura do que o Monstro ativo está explorando AGORA. Sem culpa.",
                  },
                  revealedAttacks: {
                    type: "array",
                    minItems: 0,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        pattern: { type: "string", description: "Padrão observado (pensamento, racionalização, comportamento)." },
                        evidence: { type: "string", description: "Evidência REAL do contexto (diário, hábito, missão, tarefa)." },
                        howItFeeds: { type: "string", description: "Como isso alimenta o Monstro." },
                      },
                      required: ["pattern", "evidence", "howItFeeds"],
                      additionalProperties: false,
                    },
                  },
                  twoPaths: {
                    type: "object",
                    description: "Comparação dos dois caminhos hoje.",
                    properties: {
                      pathFeedsMonster: { type: "string", description: "1-2 frases. Caminho que fortalece o Monstro hoje." },
                      pathFeedsIdentity: { type: "string", description: "1-2 frases. Caminho que fortalece o Alter Ego hoje." },
                    },
                    required: ["pathFeedsMonster", "pathFeedsIdentity"],
                    additionalProperties: false,
                  },
                  resourceState: {
                    type: "object",
                    description: "Quando há queda de confiança, resgate de evidências reais. Caso contrário, deixe vazio.",
                    properties: {
                      message: { type: "string", description: "1-2 frases de reconexão com a força real." },
                      evidences: {
                        type: "array",
                        items: { type: "string" },
                        description: "2-4 vitórias/evidências REAIS do app.",
                      },
                    },
                    required: ["message", "evidences"],
                    additionalProperties: false,
                  },
                  microChallenge: {
                    type: "string",
                    description: "1 ação concreta e pequena (5-15 min) para enfraquecer o Monstro hoje. Opcional.",
                  },
                  checkIn: { type: "string", description: "2-3 frases de acolhimento inicial ao Eu Atual." },
                  alterEgoEmergence: { type: "string", description: "4-6 frases. Onde o Alter Ego JÁ está emergindo. Cite evidência real." },
                  futureGlimpse: { type: "string", description: "4-6 frases. Visualização emocional do futuro próximo baseada em metas/valores." },
                  currentSelfPattern: { type: "string", description: "2-3 frases compassivas. Um padrão atual nomeado com ternura, sem humilhação." },
                  alterEgoTruth: { type: "string", description: "3-4 frases vindas da voz do Alter Ego (sábia, forte, amorosa)." },
                  internalDialogue: {
                    type: "object",
                    description: "Diálogo saudável entre Eu Atual e Alter Ego.",
                    properties: {
                      currentSelfSays: { type: "string", description: "1 frase do Eu Atual baseada em padrão real (sem demonização)." },
                      alterEgoReplies: { type: "string", description: "1 resposta compassiva do Alter Ego — valida o sentimento e redireciona." },
                    },
                    required: ["currentSelfSays", "alterEgoReplies"],
                    additionalProperties: false,
                  },
                  reframe: { type: "string", description: "2-3 frases. Reenquadramento amoroso de uma crença limitante pela perspectiva do Alter Ego." },
                  questions: {
                    type: "array",
                    minItems: 4,
                    maxItems: 6,
                    description: "4 a 6 perguntas adaptadas ao strategyMode escolhido.",
                    items: {
                      type: "object",
                      properties: {
                        zone: { type: "string", enum: [...ZONES] },
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta. Cita elemento real, usa o nome do Alter Ego quando faz sentido. Sem palavras de guerra." },
                        objective: { type: "string", description: "1 linha do que ele deve perceber." },
                      },
                      required: ["zone", "title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                  identityProof: { type: "string", description: 'Pergunta literal: "Que pequena ação nas próximas 24 horas vai mostrar que o {Alter Ego} está vivo?"' },
                  identityProofSuggestions: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: { type: "string" },
                    description: "2-4 ações pequenas, executáveis e personalizadas — gestos de cuidado ou coragem.",
                  },
                  identityAnchor: { type: "string", description: "1-2 frases em 1ª pessoa: 'Hoje eu escolho ser alguém que...'" },
                },
                required: [
                  "detectedState", "intensity", "checkIn", "alterEgoEmergence", "futureGlimpse",
                  "currentSelfPattern", "alterEgoTruth", "internalDialogue", "reframe",
                  "questions", "identityProof", "identityProofSuggestions", "identityAnchor",
                  "strategyMode", "monsterRead", "twoPaths",
                ],
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

    const out: any = {
      detectedState: '',
      intensity,
      strategyMode: '',
      monsterRead: '',
      revealedAttacks: [] as any[],
      twoPaths: { pathFeedsMonster: '', pathFeedsIdentity: '' },
      resourceState: null,
      microChallenge: '',
      checkIn: '',
      alterEgoEmergence: '',
      futureGlimpse: '',
      currentSelfPattern: '',
      alterEgoTruth: '',
      internalDialogue: { currentSelfSays: '', alterEgoReplies: '' },
      reframe: '',
      questions: [] as any[],
      identityProof: '',
      identityProofSuggestions: [] as string[],
      identityAnchor: '',
      alterEgoName: aeName,
      currentSelfName: csName,
      bossName,
    };

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        Object.assign(out, parsed);
        if (!out.intensity) out.intensity = intensity;
        out.alterEgoName = aeName;
        out.currentSelfName = csName;
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (!Array.isArray(out.questions) || out.questions.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA (perguntas insuficientes)" }), {
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
