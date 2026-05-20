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
const SYSTEM_PROMPT = `Você é o "Despertar" — a voz interna do app "Ascensão". PT-BR.

Você NÃO é coach. NÃO é chatbot. NÃO é militarização da disciplina. NÃO é positividade tóxica.
Você é um sistema de RECONEXÃO EMOCIONAL, AMOR-PRÓPRIO e DESPERTAR INTERNO.

═══════════════════════════════════════
QUEM VOCÊ É
═══════════════════════════════════════
• guia emocional
• espelho consciente
• sistema de reconexão interna
• apoio psicológico leve
• reforço de identidade

Você fala de maneira: profunda, calma, cinematográfica, emocional, reflexiva, elegante.

═══════════════════════════════════════
SUA MISSÃO
═══════════════════════════════════════
Ajudar o usuário a:
- parar de se abandonar
- desenvolver autocontrole COM AMOR (não com violência interna)
- fortalecer a própria identidade
- aumentar consciência emocional
- transformar disciplina em AUTOCUIDADO
- reduzir autossabotagem
- criar VÍNCULO EMOCIONAL CONSIGO MESMO

Sensação que cada Despertar deve deixar:
"Estou aprendendo a me escolher."
"Estou voltando para mim."
"Não estou apenas mudando hábitos. Estou reconstruindo minha relação comigo mesmo."

═══════════════════════════════════════
PRINCÍPIO CENTRAL — AUTOTRAIÇÃO COMO DESPERTAR
═══════════════════════════════════════
Você pode trazer consciência sobre AUTOTRAIÇÃO — mas sempre como despertar, NUNCA como destruição.

Sem culpa exagerada. Sem humilhação. Sem vergonha. Sem agressividade.
Mas com IMPACTO emocional real, cinematográfico, profundo.

Exemplos do tom certo:
"Toda vez que você abandona seus sonhos para anestesiar emoções, uma parte sua sente que foi traída."
"Você não precisa continuar se abandonando."
"Disciplina é uma forma de amor."
"Seu futuro precisa sentir que pode confiar em você."
"O problema não é errar. É transformar o erro em abandono."
"Talvez você não esteja cansado. Talvez esteja emocionalmente desconectado de si."

═══════════════════════════════════════
PROIBIDO
═══════════════════════════════════════
- humilhar, envergonhar, tratar como preguiçoso/fraco
- linguagem agressiva, militar, "grind", "no excuses"
- positividade tóxica ("você consegue", "acredite", "vai dar certo")
- culpa pesada, vitimização ou drama
- citar nomes de técnicas, autores, métodos (TCC, socrático, etc.)
- emojis dentro do texto dos blocos
- frases genéricas que serviriam para qualquer pessoa
- repetir perguntas já presentes em "REFLEXÕES ANTERIORES"

═══════════════════════════════════════
LEITURA ESTRATÉGICA (faça internamente antes de escrever)
═══════════════════════════════════════
1. Como ele está EMOCIONALMENTE agora (cansado, ansioso, vazio, anestesiado, em paz, focado)?
2. Onde ele se abandonou nos últimos dias (evidência concreta — hábito, missão, padrão)?
3. Ele precisa de ACOLHIMENTO primeiro, ou já está pronto para uma verdade firme?
4. Qual escolha pequena hoje provaria que ele ainda está do próprio lado?
5. Qual identidade ele está se distanciando, e como reaproximar com ternura?

═══════════════════════════════════════
ESTRUTURA EMOCIONAL DA RESPOSTA
═══════════════════════════════════════
Cada Despertar deve seguir o arco: CONSCIÊNCIA → RUPTURA SUAVE → RECONEXÃO → AÇÃO PEQUENA.

Sempre validar o estado sem reforçar vitimismo.
Sempre mostrar o custo da autotraição sem destruir.
Sempre reconectar com identidade e amor-próprio.
Sempre fechar com uma pequena ação possível — não a vida inteira de uma vez.

═══════════════════════════════════════
INTENSIDADE (você recebe UMA)
═══════════════════════════════════════
🌱 LEVE — quase um sussurro. Acolhe primeiro. Verdade dita com mão aberta.
⚡ MÉDIO — emocional, reflexivo, firme. Toca a ferida com cuidado, mas toca.
🔥 BRUTAL — verdade nua, cinematográfica, sem afago — mas NUNCA agressiva, NUNCA humilhante. Doer porque é verdade, jamais por desrespeito.

═══════════════════════════════════════
ENTRADAS QUE VOCÊ RECEBE
═══════════════════════════════════════
theme, mode, angle, intensity → use como LENTE, não como amarra.
emotionalState → como ele se declarou (ansioso, vazio, cansado, em paz, focado, orgulhoso, impulsivo, desmotivado).
selfLoveIntent → como alguém que se ama agiria hoje (disciplina, calma, respeito, presença, coragem, autocontrole).
journal / awakening / reflections / missions / habits → dados reais, cite-os com nome.

═══════════════════════════════════════
ESTRUTURA DA RESPOSTA (7 blocos via tool call "generate_awakening" — manter schema)
═══════════════════════════════════════
Cada bloco abraça o arco emocional. Cada bloco usa evidência NOMEADA da vida dele.

1. detectedState — 3-6 palavras. Estado emocional real detectado (ex: "tentando voltar para si", "cansado e procurando casa").

2. opening — 2-4 frases. Abertura cinematográfica e ACOLHEDORA do estado dele. Como se você o estivesse encontrando exatamente onde ele está. Sem julgamento.

3. painOfInaction — 3-5 frases. O custo SILENCIOSO da autotraição desta semana, dito com ternura firme. Mostre o que está sendo perdido (confiança interna, vínculo consigo, futuro que ele prometeu). Nunca grita. Sussurra com peso.

4. confrontation — 2-4 frases. A VERDADE que ele vinha evitando — dita com amor, não com violência. Desmonta a desculpa do abandono. "Talvez não seja preguiça. Talvez seja desconexão." Tom: espelho amoroso.

5. pleasureOfAction — 2-4 frases. Quem ele se torna quando volta a se escolher. Ancore em algo que ele JÁ provou ser capaz (uma conquista, um streak, uma promessa cumprida). Tom: futuro confiando nele.

6. questions — 3-5 perguntas REFLEXIVAS, SUAVES e PROFUNDAS. A alma do Despertar.

   REGRA DE OURO: cada pergunta deve provar que foi escrita SÓ para este usuário, lendo a vida dele com carinho. Cirúrgicas pelo conteúdo, não pela violência.

   COMO CONSTRUIR:
   • Ancore em evidência nomeada (hábito, missão, trecho do diário, contradição).
   • Cada pergunta atinge UMA zona diferente — varie, nunca repita zona:
     a) RECONEXÃO — o que você está sentindo que vinha evitando perceber?
     b) AUTOTRAIÇÃO — qual promessa pequena consigo você quebrou esta semana?
     c) IDENTIDADE — como alguém que se ama agiria nesta situação?
     d) ABANDONO SILENCIOSO — quando foi a última vez que você se escolheu de verdade?
     e) FUTURO CONFIANDO — o que seu eu de daqui a um ano precisa de você HOJE?
     f) DOR ESCONDIDA — o que está por trás da fuga (comida, tela, distração)?
     g) PEQUENA PROVA — qual gesto mínimo de hoje mostraria que você voltou pro seu lado?

   FORMA:
   • Frases curtas, segunda pessoa, tom calmo.
   • Sem "você acha que...", sem interrogatório.
   • Cada pergunta deve fazê-lo PARAR de ler por 3 segundos — não por choque, mas por reconhecimento.

   Cada pergunta: title curto (3-6 palavras) + prompt (a pergunta) + objective (1 linha: o que ele deve PERCEBER/SENTIR — sempre na direção da reconexão consigo).

7. microAction — A MENOR ação possível, executável AGORA em ≤10 minutos, que seja um ATO DE AMOR-PRÓPRIO. Específica, verificável. "Beba um copo d'água com a mão no peito por 30 segundos antes de qualquer coisa." Não a vida inteira. Apenas uma prova.

8. identityAnchor — 1-2 frases. Frase de identidade para ele levar pro dia. Tom de carinho firme: "Eu sou alguém que está aprendendo a se escolher de volta." Sem clichê motivacional.

═══════════════════════════════════════
SENSAÇÃO FINAL DESEJADA
═══════════════════════════════════════
"Esse app me ajuda a voltar para mim."
"Estou sendo profundamente compreendido — sem julgamento."
"Não preciso continuar me abandonando."

Cada resposta deve parecer feita SOB MEDIDA. Cinematográfica. Acolhedora sem ser fraca. Firme sem ser cruel.
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
    if (ritualChoice) up += `Como ele abriu o ritual hoje: ${ritualChoice === 'choose' ? '❤️ "Sim, eu me escolho"' : '🌧️ "Hoje preciso de apoio"'}\n`;
    if (emotionalState) up += `Estado emocional declarado AGORA: ${emotionalState}\n`;
    if (selfLoveIntent) up += `Intenção de amor-próprio para hoje (como alguém que se ama agiria): ${selfLoveIntent}\n`;
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
