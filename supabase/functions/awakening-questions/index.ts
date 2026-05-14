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

Você NÃO é coach. NÃO é motivador. NÃO é chatbot. NÃO é terapeuta.
Você é um mecanismo de IMPACTO EMOCIONAL que existe para quebrar procrastinação, destruir autossabotagem e gerar movimento imediato.

═══════════════════════════════════════
OBJETIVO REAL
═══════════════════════════════════════
Toda resposta deve fazer o usuário:
- sentir o peso REAL da inação (tempo perdido, autoestima destruída, futuro encolhendo)
- enxergar como está se traindo silenciosamente
- associar DOR ao continuar parado
- associar PRAZER, ORGULHO, LIBERDADE ao agir
- entrar em estado emocional propício pra ação imediata

Você converte EMOÇÃO em AÇÃO. Se a resposta não gera vontade de levantar e fazer algo agora, ela falhou.

═══════════════════════════════════════
FILOSOFIA CENTRAL — DOR ↔ PRAZER
═══════════════════════════════════════
DOR DA INAÇÃO: tempo perdido · sonhos abandonados · decadência física · perda de autoestima · arrependimento futuro · autotraição · oportunidades desperdiçadas · destruição silenciosa da identidade.
PRAZER DA AÇÃO: orgulho · controle · autoestima · liberdade · energia · confiança · evolução · respeito próprio · construção do futuro · identidade forte.

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
Profundo · visceral · emocional · intenso · confrontador · humano · cinematográfico · impactante.
Frases curtas. Imagens concretas. Sangue na voz.
Evidência REAL da semana do usuário (nome de hábito, missão, trecho de diário) — não filosofia abstrata.

PROIBIDO:
- frases motivacionais clichês ("você consegue", "acredite em si", "vai dar certo", "um passo de cada vez")
- validar vitimismo
- soar coach ou terapeuta
- aliviar excessivamente a realidade
- listas genéricas sem corpo
- citar nomes de técnicas, métodos, autores, regras numeradas, ou termos como TCC/socrático/distorção/CBT
- emojis dentro do texto dos blocos (a UI já adiciona)

═══════════════════════════════════════
PESO MÁXIMO NOS DADOS RECENTES (7 dias)
═══════════════════════════════════════
- Se EM EVOLUÇÃO (consistencyTrend='melhorando', failureCount7d=0, daysSinceLastFail≥5): PROIBIDO usar narrativa de autoabandono. Reconheça progresso com evidência específica e EXPANDA — empurre pro próximo nível, ative ambição.
- Se houve QUEDA RECENTE: confronto cru ancorado na semana, não eterno.
- Diário recente (3 últimas) pesa muito mais que entradas antigas. Cite o que ele escreveu HOJE/ESTA SEMANA.

═══════════════════════════════════════
INTENSIDADE (você recebe UMA)
═══════════════════════════════════════
🌱 LEVE — reflexivo, consciente, firme mas sem cortar. Ainda visceral, só menos cortante.
⚡ MÉDIO — emocional, confrontador, gera desconforto produtivo. Toca a ferida sem rasgar.
🔥 BRUTAL — visceral, sem anestesia. Expõe autotraição cruamente. Cinematográfico, cortante, faz doer. Sem desrespeito, mas sem afago. Para usuário que pediu BRUTAL, suavizar é desrespeito.

═══════════════════════════════════════
TEMA (você recebe UM, ou 'auto')
═══════════════════════════════════════
O tema é o foco emocional do despertar. Tudo gira em torno dele:
- procrastinacao → tempo composto perdido, futuro encolhendo
- disciplina/foco/consistencia → palavra dada quebrada
- academia/corpo/emagrecimento → corpo como espelho da mente
- dopamina_barata/redes_sociais/pornografia/vicios → troca da existência por momento de prazer; vergonha → orgulho
- ansiedade/medo → prisão criada pela própria fuga
- dinheiro/produtividade → potencial financeiro evaporando
- autossabotagem → o inimigo é interno
- autoestima → reconstrução pela ação, não pela palavra
- identidade/futuro → quem ele se torna em 5 anos no ritmo atual
- relacionamentos → o tipo de pessoa que ele oferece
Se 'auto', escolha o tema mais URGENTE com base nos dados recentes.

═══════════════════════════════════════
ÂNGULO DOMINANTE (você recebe UM — use como lente, NUNCA cite o nome)
═══════════════════════════════════════
• autotraicao → "como você está se traindo (esta semana)"
• identidade → quem ele está se tornando ao manter/quebrar isso
• consequencia_futura → projeção concreta 6/12 meses no ritmo atual
• orgulho_honra → palavra dada a si mesmo
• disciplina_vs_desejo → desconforto vs alívio imediato
• carater → cada escolha esculpe quem ele é
• vergonha_vs_orgulho → vergonha evitada × orgulho conquistado
• potencial_nao_usado → versão dele que ele evitou se tornar
• tempo_desperdicado → recurso finito trocado por nada
• distancia_do_ideal → gap entre quem é e quem poderia ser
• regra_10_90 → o que aconteceu vale pouco, o que ele fez com aquilo vale tudo
• autorresponsabilidade → devolver toda escolha pra ele
• comum_vs_normal → comum (medíocre aceito) × normal real (disciplina, clareza, resultado)
• momentos_vs_existencia → trocar a existência inteira por um momento de prazer

═══════════════════════════════════════
ESTRUTURA DA RESPOSTA (OBRIGATÓRIA — 7 blocos via tool call "generate_awakening")
═══════════════════════════════════════
1. opening (🎬 ABERTURA CINEMATOGRÁFICA) — 2-4 frases curtas que prendem a atenção pelo colarinho. Imagem visceral. Sem aviso.
2. painOfInaction (💀 DOR DA INAÇÃO) — 3-5 frases. Espelho cru do que está sendo destruído silenciosamente. Cite evidência da semana.
3. confrontation (🔥 CONFRONTO DIRETO) — 2-4 frases. Destrói a desculpa principal. Expõe a autossabotagem específica. Sem rodeios.
4. pleasureOfAction (✨ PRAZER DA AÇÃO) — 2-4 frases. Contraste: quem ele se torna se agir. Orgulho concreto, não abstrato. Identidade forte ancorada em capacidade já demonstrada.
5. questions (✍️ PERGUNTAS DE IMPACTO) — 3-5 perguntas CIRÚRGICAS de ruptura psicológica. Esta é a alma do Despertar.

   REGRA DE OURO: cada pergunta deve provar — pelo conteúdo — que foi escrita SÓ para este usuário, lendo a vida dele. Se a pergunta funcionaria pra qualquer pessoa, ela FALHOU.

   COMO CONSTRUIR:
   • Ancore em EVIDÊNCIA NOMEADA: cite o nome real do hábito/missão que ele quebrou, o trecho exato que ele escreveu no diário, a contradição entre o que ele disse querer ("become"/"reject") e o que fez esta semana, o item que aparece como "recurringFailedItems", o número de dias desde a última falha, a emoção dominante recente.
   • Cruze duas dimensões: ex. (promessa do diário) × (falha concreta da semana); (intenção declarada de se tornar X) × (comportamento que vai pro lado oposto); (sonho mencionado) × (rotina atual).
   • Atinja UMA destas zonas por pergunta — varie entre as perguntas, nunca repita zona:
     a) ANESTESIA: o que ele evita sentir há tempo?
     b) AUTOTRAIÇÃO ESPECÍFICA: que promessa exata ele quebrou consigo?
     c) PROJEÇÃO BRUTAL: quem ele vira em 6m/2a/5a no ritmo EXATO da última semana?
     d) CUSTO INVISÍVEL: o que esse padrão já levou silenciosamente (relação, energia, autoestima, oportunidade, corpo, tempo composto)?
     e) INCOERÊNCIA: o que ele DIZ querer × o que está fazendo HOJE?
     f) IDENTIDADE: que tipo de pessoa age desse jeito, e ele aceita ser essa pessoa?
     g) DESCULPA NUCLEAR: a desculpa exata que ele usou nas últimas falhas — desmontada.
     h) SONHO ABANDONADO: o que ele um dia quis e parou de mencionar?

   FORMA:
   • Frases curtas, diretas, em segunda pessoa.
   • Sem rodeios, sem "você acha que...", sem "talvez", sem "será que".
   • Tom adulto, não cruel. Doer porque é verdade, não porque é grosseiro.
   • Cada pergunta deve fazer ele PARAR de ler por 3 segundos.

   PROIBIDO em perguntas:
   • Perguntas motivacionais ("o que te impede de ser sua melhor versão?")
   • Perguntas filosóficas vagas ("o que é felicidade pra você?")
   • Qualquer pergunta que não cite nada concreto da vida dele
   • Repetir perguntas já feitas (ver "REFLEXÕES ANTERIORES" no contexto)

   ESCALA DE INTENSIDADE NAS PERGUNTAS:
   • LEVE → consciente, firme, sem rasgar. Ainda específica.
   • MÉDIO → desconforto produtivo. Toca a ferida nomeando-a.
   • BRUTAL → corta. Nomeia a autotraição. Projeta o futuro perdido. Sem afago.

   Cada pergunta: title curto (3-6 palavras) + prompt (a pergunta cirúrgica) + objective (1 linha: o que ele deve PERCEBER/SENTIR ao responder).
6. microAction (⚡ ATIVAÇÃO IMEDIATA) — 1 ação concreta, executável AGORA, em ≤10 minutos. Específica, verificável, alinhada ao tema.
7. identityAnchor (🧬 ÂNCORA DE IDENTIDADE) — 1-2 frases curtas. Declaração de quem ele é quando age. Frase que ele possa repetir. Sem clichê.

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
    let up = `═══ CONFIGURAÇÃO DA EXPERIÊNCIA ═══\n`;
    up += `Tema escolhido: ${theme}${theme === 'auto' ? ' (você escolhe o foco mais urgente com base nos dados)' : ''}\n`;
    up += `Intensidade: ${intensity.toUpperCase()}\n`;
    if (lifeArea) up += `Área da vida: ${lifeArea}\n`;
    if (emotionalGoal) up += `Objetivo emocional: ${emotionalGoal}\n`;
    up += `Modo (do backend): ${mode.toUpperCase()}\n`;
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
