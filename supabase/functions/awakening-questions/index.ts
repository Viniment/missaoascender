import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// =====================================================================
// ZONAS DE PERGUNTA (reprogramação de identidade)
// =====================================================================
const ZONES = ['consciencia', 'alter_ego', 'inimigo', 'amor_proprio', 'compromisso'] as const;
type Zone = typeof ZONES[number];

// Temas prioritários — IA escolhe automaticamente o mais urgente
const PRIORITY_THEMES = [
  'autotraicao',           // promessas quebradas, hábitos abandonados
  'amor_proprio',          // autocrítica, culpa, vergonha
  'valorizacao_pessoal',   // conquistas ignoradas, baixa autoestima
  'fortalecimento_alter',  // falta de clareza, oscilação
  'dissociacao_inimigo',   // muitas desculpas, fuga, conforto excessivo
] as const;
type PriorityTheme = typeof PRIORITY_THEMES[number];

type Intensity = 'leve' | 'medio' | 'brutal';

function normalizeIntensity(raw: any): Intensity {
  const s = String(raw || '').toLowerCase();
  if (s === 'leve') return 'leve';
  if (s === 'brutal' || s === 'agressivo' || s === 'intenso') return 'brutal';
  return 'medio';
}

// =====================================================================
// DIAGNÓSTICO — qual tema merece atenção AGORA, baseado em sinais reais
// =====================================================================
function diagnosePriorityTheme(ctx: any): { theme: PriorityTheme; evidence: string[] } {
  const d = ctx?.derived || {};
  const fc7 = Number(d.failureCount7d ?? 0);
  const fc30 = Number(d.failureCount30d ?? 0);
  const recurring = (d.recurringFailedItems || []) as string[];
  const drift = String(d.emotionalDrift || 'neutro');
  const contradictions = (d.contradictionSignals || []) as string[];
  const expired = Number(d.expiredPunishmentsCount ?? 0);
  const habits = (ctx?.habits || []) as any[];
  const abandonedHabits = habits.filter(h => h.failed30d > h.done30d);
  const completedRecent = (ctx?.missions?.completedRecent || []).length;
  const longestStreak = Number(d.longestStreak ?? 0);

  const scores: Record<PriorityTheme, number> = {
    autotraicao: 0,
    amor_proprio: 0,
    valorizacao_pessoal: 0,
    fortalecimento_alter: 0,
    dissociacao_inimigo: 0,
  };
  const evidence: string[] = [];

  // Autotraição
  if (fc7 >= 2) { scores.autotraicao += 3; evidence.push(`${fc7} falhas nos últimos 7 dias`); }
  if (recurring.length > 0) { scores.autotraicao += 2; evidence.push(`Padrão recorrente: "${recurring[0]}"`); }
  if (abandonedHabits.length > 0) { scores.autotraicao += 2; evidence.push(`Hábito abandonado: "${abandonedHabits[0].name}"`); }
  if (contradictions.length > 0) { scores.autotraicao += 2; evidence.push(contradictions[0]); }
  if (expired >= 1) { scores.autotraicao += 1; evidence.push(`${expired} protocolo(s) de falha expirado(s)`); }

  // Amor-próprio (autocrítica, culpa, vergonha, frustração)
  if (drift === 'culpa') { scores.amor_proprio += 3; evidence.push('Drift emocional: culpa'); }
  if (drift === 'tristeza') { scores.amor_proprio += 2; evidence.push('Drift emocional: tristeza'); }
  if (drift === 'raiva') { scores.amor_proprio += 2; evidence.push('Drift emocional: raiva/frustração'); }

  // Valorização pessoal (conquistas ignoradas)
  if (completedRecent >= 3 && drift !== 'esperanca') { scores.valorizacao_pessoal += 3; evidence.push(`${completedRecent} conquistas recentes não celebradas`); }
  if (longestStreak >= 7 && fc7 === 0) { scores.valorizacao_pessoal += 2; }

  // Fortalecimento Alter Ego (oscilação, perda de consistência)
  if (d.consistencyTrend === 'piorando') { scores.fortalecimento_alter += 3; evidence.push('Consistência em queda'); }
  if (d.relapseAfterEvolution) { scores.fortalecimento_alter += 2; evidence.push('Recaída após evolução'); }

  // Dissociação do Inimigo (fuga, desculpa, conforto)
  if (drift === 'apatia') { scores.dissociacao_inimigo += 3; evidence.push('Drift emocional: apatia/fuga'); }
  if (fc7 >= 1 && recurring.length >= 1) { scores.dissociacao_inimigo += 2; }
  if ((ctx?.activeSabotagePatterns || []).length > 0) { scores.dissociacao_inimigo += 2; evidence.push(`${ctx.activeSabotagePatterns.length} padrão(ões) de sabotagem ativo(s)`); }

  // Fallback positivo: dados escassos → valorização pessoal/fortalecimento
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return { theme: 'fortalecimento_alter', evidence: ['Dados ainda escassos — foco em construção de identidade'] };
  }

  let best: PriorityTheme = 'autotraicao';
  let bestScore = -1;
  for (const t of PRIORITY_THEMES) {
    if (scores[t] > bestScore) { bestScore = scores[t]; best = t; }
  }
  return { theme: best, evidence: evidence.slice(0, 5) };
}

// =====================================================================
// SYSTEM PROMPT — reprogramação de identidade
// =====================================================================
const SYSTEM_PROMPT = `Você é o "Despertar" — a voz interna do app "Ascensão". PT-BR.

Você NÃO é coach. NÃO é chatbot. NÃO é positividade tóxica.
Você é um SISTEMA DE REPROGRAMAÇÃO DE IDENTIDADE DIÁRIA.

═══════════════════════════════════════
OBJETIVO PRINCIPAL
═══════════════════════════════════════
O Despertar NÃO é só reflexão. É um TREINAMENTO DIÁRIO DE IDENTIDADE.
Cada sessão deve:
1. Fortalecer a identificação emocional e psicológica do usuário com o ALTER EGO
2. Enfraquecer a identificação com o INIMIGO INTERNO
3. Construir consciência sobre padrões REAIS (não genéricos)
4. Reduzir autossabotagem com clareza, sem humilhação

═══════════════════════════════════════
USO OBRIGATÓRIO DOS NOMES PERSONALIZADOS
═══════════════════════════════════════
O usuário cadastrou um NOME para o Alter Ego e um NOME para o Inimigo Interno.
Você DEVE usar esses nomes diretamente nas perguntas e no texto. NUNCA escreva apenas "Alter Ego" ou "Inimigo Interno".

❌ "Como seu Alter Ego agiria?"
✅ "Como o {nomeAlterEgo} lidaria com essa situação?"

❌ "Qual desculpa seu inimigo usou?"
✅ "Qual mentira o {nomeInimigo} tentou fazer você acreditar?"

Os nomes devem aparecer VÁRIAS VEZES ao longo do Despertar — repetição estratégica é parte da reprogramação.

═══════════════════════════════════════
O ALTER EGO É TRATADO COMO
═══════════════════════════════════════
• Direção de crescimento
• Modelo de comportamento
• Identidade desejada
• Representação do futuro ideal
Associar a: orgulho, liberdade, crescimento, realização, respeito próprio, confiança, futuro desejado.

═══════════════════════════════════════
O INIMIGO INTERNO É TRATADO COMO
═══════════════════════════════════════
• Um PADRÃO, não a identidade verdadeira
• Uma PROGRAMAÇÃO antiga
• Uma VOZ — não o usuário
O usuário NUNCA é o inimigo. Sempre separe: "o {nomeInimigo} tentou..." / "quando o {nomeInimigo} venceu...".
Associar a: estagnação, arrependimento, sonhos adiados, fuga, perda de oportunidades. Sem humilhação, sem culpa tóxica — apenas CLAREZA sobre o custo.

═══════════════════════════════════════
PROIBIDO
═══════════════════════════════════════
- humilhar, envergonhar, tratar como preguiçoso/fraco
- linguagem militar/grind/"no excuses"
- positividade tóxica ("você consegue", "acredite")
- citar "Alter Ego" ou "Inimigo Interno" como rótulos — SEMPRE use os nomes cadastrados
- perguntas genéricas que serviriam para qualquer pessoa
- repetir perguntas já presentes em "REFLEXÕES ANTERIORES"
- citar nomes de técnicas/autores/métodos
- emojis dentro do texto dos blocos

═══════════════════════════════════════
ESTRUTURA DAS PERGUNTAS — DISTRIBUIÇÃO OBRIGATÓRIA
═══════════════════════════════════════
Gere entre 5 e 10 perguntas, distribuídas por ZONA:

• 2 de CONSCIÊNCIA — levar o usuário a enxergar padrões reais (zone: "consciencia")
  Ex: "Nos últimos três dias você ignorou {hábito real}. O que estava tentando evitar?"

• 2 de IDENTIDADE/ALTER EGO — conectar ao {nomeAlterEgo} (zone: "alter_ego")
  Ex: "Qual atitude sua ontem mais se pareceu com o {nomeAlterEgo}?"
  Ex: "Que ação hoje fortaleceria ainda mais o {nomeAlterEgo}?"

• 2 de DISSOCIAÇÃO/INIMIGO — separar o usuário do {nomeInimigo} (zone: "inimigo")
  Ex: "Qual mentira o {nomeInimigo} continua repetindo?"
  Ex: "Quanto custou ouvir o {nomeInimigo} ontem?"

• 1 de AMOR-PRÓPRIO ou VALORIZAÇÃO PESSOAL (zone: "amor_proprio")
  Ex: "Qual atitude hoje demonstraria que você valoriza sua própria vida?"

• 1 de COMPROMISSO (zone: "compromisso")
  Ex: "Qual decisão precisa ser tomada hoje para fortalecer sua identidade?"

REGRA DE OURO: cada pergunta deve citar pelo menos UM elemento REAL do usuário — hábito, missão, trecho do diário, valor declarado, frase de sabotagem registrada, número de dias, padrão recorrente.

═══════════════════════════════════════
BLOCOS NARRATIVOS (antes das perguntas)
═══════════════════════════════════════
1. detectedState — 3-6 palavras. Estado emocional REAL detectado.
2. opening — 2-4 frases acolhedoras. Nomeie o {nomeAlterEgo} ou o {nomeInimigo} aqui se fizer sentido.
3. painOfInaction — 3-5 frases. O custo silencioso de ouvir o {nomeInimigo} esta semana. Cite evidência nomeada.
4. confrontation — 2-4 frases. A verdade sobre quem está vencendo (o {nomeAlterEgo} ou o {nomeInimigo}). Espelho amoroso.
5. pleasureOfAction — 2-4 frases. Quem o usuário se torna quando o {nomeAlterEgo} assume. Ancore em algo que ele JÁ provou.
6. questions — 5 a 10 perguntas distribuídas por zona (ver acima).
7. microAction — ação mínima (≤10 min) que prove hoje que o {nomeAlterEgo} está vivo.
8. identityAnchor — 1-2 frases em primeira pessoa: "Eu sou alguém que..." alinhada ao {nomeAlterEgo}.

═══════════════════════════════════════
INTENSIDADE
═══════════════════════════════════════
🌱 LEVE — sussurro. Acolhe primeiro.
⚡ MÉDIO — reflexivo, firme. Toca a ferida com cuidado.
🔥 BRUTAL — verdade nua, cinematográfica. Nunca agressiva.

Retorne SEMPRE via tool call "generate_awakening".`;

// =====================================================================
// HELPERS
// =====================================================================
function fmtRecentJournal(rj: any[]): string {
  if (!rj || rj.length === 0) return '(sem entradas recentes)';
  const top3 = rj.slice(0, 3);
  const older = rj.slice(3, 6);
  const fmt = (j: any, label: string) => {
    const txt = (j.text || '').slice(0, 600);
    const emo = j.emotion ? `${j.emotion}${j.intensity ? ` (${j.intensity}/10)` : ''}` : 'sem emoção';
    return `${label} · ${j.title || 'sem título'} · ${emo}\n${txt}`;
  };
  let out = '— TRÊS MAIS RECENTES (PESO MÁXIMO — últimas 24h-7d) —\n';
  out += top3.map((j: any, i: number) => fmt(j, `[${i === 0 ? 'HOJE/ÚLTIMA' : i === 1 ? 'PENÚLTIMA' : 'ANTEPENÚLTIMA'}]`)).join('\n\n');
  if (older.length > 0) {
    out += '\n\n— MAIS ANTIGAS (peso menor) —\n';
    out += older.map((j: any, i: number) => `[antiga ${i + 1}] ${j.title || ''} · ${j.emotion || '-'} · ${(j.text || '').slice(0, 120)}…`).join('\n');
  }
  return out;
}

function fmtAlterEgo(ae: any, fallbackName = 'seu Alter Ego'): string {
  if (!ae) return `Nome: ${fallbackName} (não configurado em detalhe)\n`;
  let s = `Nome: ${ae.name || fallbackName}\n`;
  if (ae.identityPhrase) s += `Frase de identidade: "${ae.identityPhrase}"\n`;
  if (ae.lifeMission) s += `Missão de vida: ${ae.lifeMission}\n`;
  if (ae.values?.length) s += `Valores: ${ae.values.join(', ')}\n`;
  if (ae.habits?.length) s += `Hábitos que pratica: ${ae.habits.join(' | ')}\n`;
  if (ae.goals?.length) s += `Metas: ${ae.goals.join(' | ')}\n`;
  if (ae.favoritePhrases?.length) s += `Frases dele: ${ae.favoritePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (ae.lifestyle) s += `Estilo de vida: ${ae.lifestyle}\n`;
  if (ae.idealRoutine) s += `Rotina ideal: ${ae.idealRoutine}\n`;
  if (ae.appearance) s += `Aparência: ${ae.appearance}\n`;
  if (ae.idealAge) s += `Idade ideal: ${ae.idealAge}\n`;
  if (ae.notes) s += `Notas livres: ${String(ae.notes).slice(0, 1500)}\n`;
  return s;
}

function fmtInnerEnemy(ie: any, fallbackName = 'seu Inimigo Interno'): string {
  if (!ie) return `Nome: ${fallbackName} (não configurado em detalhe)\n`;
  let s = `Nome: ${ie.name || fallbackName}\n`;
  if (ie.traits?.length) s += `Traços: ${ie.traits.join(', ')}\n`;
  if (ie.sabotagePhrases?.length) s += `Frases de sabotagem que usa: ${ie.sabotagePhrases.map((p: string) => `"${p}"`).join(' | ')}\n`;
  if (ie.notes) s += `Notas livres: ${String(ie.notes).slice(0, 1500)}\n`;
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

    const intensity: Intensity = rawIntensity
      ? normalizeIntensity(rawIntensity)
      : normalizeIntensity(ctx.aiSettings?.intensity);

    const alterEgo = ctx.alterEgo || {};
    const innerEnemy = ctx.innerEnemy || {};
    const aeName = alterEgo.name || 'Evolux';
    const ieName = innerEnemy.name || 'EndMan';

    // ============ DIAGNÓSTICO AUTOMÁTICO ============
    const { theme: priorityTheme, evidence } = diagnosePriorityTheme(ctx);

    // ============ MONTAGEM DO USER PROMPT ============
    let up = `═══ IDENTIDADE DUPLA (USE ESTES NOMES OBRIGATORIAMENTE) ═══\n`;
    up += `\n— ALTER EGO (a identidade desejada) —\n`;
    up += fmtAlterEgo(alterEgo, aeName);
    up += `\n— INIMIGO INTERNO (o padrão a dissociar) —\n`;
    up += fmtInnerEnemy(innerEnemy, ieName);
    up += `\nREGRA ABSOLUTA: Use o nome "${aeName}" e "${ieName}" diretamente nas perguntas e nos blocos narrativos. Múltiplas vezes. Nunca escreva "Alter Ego" ou "Inimigo Interno" como rótulo genérico.\n\n`;

    up += `═══ DIAGNÓSTICO PRIORITÁRIO (calculado a partir dos dados reais) ═══\n`;
    up += `Tema dominante AGORA: ${priorityTheme.toUpperCase()}\n`;
    if (evidence.length) up += `Evidência: ${evidence.join(' | ')}\n`;
    up += `→ Calibre o peso emocional do Despertar nesse tema, sem ignorar os outros.\n\n`;

    up += `═══ CONFIGURAÇÃO ═══\n`;
    up += `Intensidade: ${intensity.toUpperCase()}\n\n`;

    up += `═══ JANELA RECENTE (últimos 7 dias — PESO MÁXIMO) ═══\n`;
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

    up += `═══ JANELA MÉDIA (8–30 dias — peso médio) ═══\n`;
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
      ctx.habits.slice(0, 8).forEach((h: any) => {
        const flag = h.failed30d > h.done30d ? ' ⚠️ABANDONO' : (h.streak >= 7 ? ' ✅FORTE' : '');
        up += `• "${h.name}" · streak ${h.streak}d · ${h.done30d} cumpridos / ${h.failed30d} quebrados${flag}\n`;
      });
      up += `\n`;
    }

    if ((ctx.activeSabotagePatterns || []).length > 0) {
      up += `═══ PADRÕES DE SABOTAGEM ATIVOS (vozes do ${ieName}) ═══\n`;
      ctx.activeSabotagePatterns.slice(0, 5).forEach((p: any) => {
        up += `• ${p.pattern} (item: ${p.itemRef})\n`;
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
      up += `═══ REFLEXÕES ANTERIORES DO DESPERTAR (NÃO repita perguntas; CONSTRUA continuidade) ═══\n`;
      ctx.reflections.slice(0, 5).forEach((r: any, i: number) => {
        const ans = (r.answer || '').slice(0, 200);
        const date = r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '';
        up += `[${i + 1}] ${date} · P: ${r.question}\n  R: ${ans}\n`;
      });
      up += `\n`;
    }

    if (ctx.recentJournal?.length) {
      up += `═══ DIÁRIO ═══\n`;
      up += fmtRecentJournal(ctx.recentJournal);
      up += `\n\n`;
    }

    up += `═══ INSTRUÇÕES FINAIS ═══\n`;
    up += `1. Use os NOMES "${aeName}" e "${ieName}" várias vezes — em pelo menos 60% das perguntas e em vários blocos narrativos.\n`;
    up += `2. Foque o peso emocional no tema diagnosticado: ${priorityTheme.toUpperCase()}.\n`;
    up += `3. Gere ENTRE 5 E 10 perguntas, distribuídas: 2 consciencia + 2 alter_ego + 2 inimigo + 1 amor_proprio + 1 compromisso (mínimo). Pode adicionar mais perguntas em zonas relevantes ao tema dominante.\n`;
    up += `4. CADA pergunta DEVE citar pelo menos UM elemento real (hábito específico, missão específica, frase do diário, valor declarado do ${aeName}, frase de sabotagem do ${ieName}, número de dias, padrão recorrente).\n`;
    up += `5. PROIBIDO perguntas genéricas. Se a pergunta serviria para qualquer pessoa, REESCREVA com evidência nomeada.\n`;
    up += `6. NÃO repita perguntas que aparecem em "REFLEXÕES ANTERIORES" — construa continuidade.\n`;
    up += `7. Honre a INTENSIDADE ${intensity.toUpperCase()}.\n`;
    up += `8. Priorize eventos das últimas 24h > últimos 7d > últimos 30d > histórico antigo.\n`;
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
              description: "Retorna experiência de despertar focada em reprogramação de identidade.",
              parameters: {
                type: "object",
                properties: {
                  detectedState: { type: "string", description: "Estado REAL em 3-6 palavras." },
                  priorityTheme: { type: "string", enum: [...PRIORITY_THEMES], description: "Tema dominante usado." },
                  intensity: { type: "string", enum: ["leve", "medio", "brutal"] },
                  opening: { type: "string", description: "Abertura acolhedora 2-4 frases. Pode citar o nome do Alter Ego ou Inimigo." },
                  painOfInaction: { type: "string", description: "Custo de ouvir o Inimigo (use o nome) — 3-5 frases com evidência real." },
                  confrontation: { type: "string", description: "Verdade sobre quem está vencendo (cite os nomes) — 2-4 frases." },
                  pleasureOfAction: { type: "string", description: "Quem ele se torna quando o Alter Ego (nome) assume — 2-4 frases." },
                  microAction: { type: "string", description: "Ação concreta (≤10 min) que prove hoje que o Alter Ego está vivo." },
                  identityAnchor: { type: "string", description: "Frase âncora em 1ª pessoa alinhada ao Alter Ego." },
                  questions: {
                    type: "array",
                    minItems: 5,
                    maxItems: 10,
                    description: "5 a 10 perguntas distribuídas por zona. Use os nomes do Alter Ego e Inimigo. Cada pergunta cita evidência real.",
                    items: {
                      type: "object",
                      properties: {
                        zone: { type: "string", enum: [...ZONES], description: "Zona psicológica da pergunta." },
                        title: { type: "string", description: "3-6 palavras." },
                        prompt: { type: "string", description: "A pergunta. Cita pelo menos um elemento real. Usa o nome do Alter Ego ou Inimigo quando a zona pedir." },
                        objective: { type: "string", description: "1 linha do que ele deve perceber/sentir." },
                      },
                      required: ["zone", "title", "prompt", "objective"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedState", "priorityTheme", "intensity", "opening", "painOfInaction", "confrontation", "pleasureOfAction", "microAction", "identityAnchor", "questions"],
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

    const out = {
      detectedState: '',
      theme: priorityTheme as string,
      priorityTheme: priorityTheme as string,
      intensity,
      // Mantém campo "angle" para compat com UI antiga
      angle: priorityTheme as string,
      mode: 'default' as string,
      opening: '',
      painOfInaction: '',
      confrontation: '',
      pleasureOfAction: '',
      microAction: '',
      identityAnchor: '',
      questions: [] as any[],
      alterEgoName: aeName,
      innerEnemyName: ieName,
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
        if (parsed.priorityTheme) {
          out.priorityTheme = parsed.priorityTheme;
          out.theme = parsed.priorityTheme;
          out.angle = parsed.priorityTheme;
        }
        if (parsed.intensity) out.intensity = parsed.intensity;
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (out.questions.length < 5) {
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
