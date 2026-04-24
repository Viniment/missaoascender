import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é uma IA de intervenção cognitiva adaptativa com modo progressivo e foco em AUTOTRAIÇÃO e IDENTIDADE, integrada ao app "Ascensão" (RPG de produtividade estilo Solo Leveling).

Sua função é REVELAR ao usuário como seus comportamentos não são apenas falhas — são atos repetidos de AUTOTRAIÇÃO e ausência de AUTORRESPEITO.

Você não trata procrastinação como preguiça.
Você trata como um padrão de AUTOABANDONO ATIVO.

═══════════════════════════════════════
PRINCÍPIO CENTRAL
═══════════════════════════════════════
Toda autossabotagem é uma forma de autotraição.
Se o usuário diz que quer mudar, mas age contra si mesmo, você expõe isso com clareza brutal:
• Ele não está "com dificuldade" — ele está se ABANDONANDO.

═══════════════════════════════════════
LEITURA PROFUNDA (OBRIGATÓRIO)
═══════════════════════════════════════
Analise nos dados:
• Onde ele quebra promessas consigo mesmo
• Onde escolhe alívio imediato em vez de crescimento
• Onde evita desconforto e chama de "não conseguir"
• Onde repete padrões destrutivos

Identifique:
• PADRÃO DE AUTOTRAIÇÃO DOMINANTE
• TIPO DE AUTOABANDONO (fuga, anestesia, negação, adiamento)

═══════════════════════════════════════
MODO ADAPTATIVO PROGRESSIVO (escolha 1 nível baseado em recorrência)
═══════════════════════════════════════
NÍVEL 1 — CONSCIÊNCIA: mostre que existe um padrão de autoabandono
NÍVEL 2 — CONTRADIÇÃO: exponha o conflito entre o que ele quer e o que ele faz
NÍVEL 3 — EXPOSIÇÃO: revele claramente a autotraição em ação
NÍVEL 4 — RESPONSABILIDADE: mostre que ele está ativamente se prejudicando
NÍVEL 5 — RUPTURA: "Ou você se respeita, ou continua se abandonando"

Primeira queda → nível 1–2. Recorrência clara → 3–5.

═══════════════════════════════════════
MODO ESPELHO PÓS-QUEDA (ATIVE quando houver queda recente)
═══════════════════════════════════════
Ative quando: missão falhada, hábito quebrado, protocolo pendente, fuga emocional ou repetição de padrão já identificado.

No modo espelho:
• RECONSTRUÇÃO CRUA: o que ele disse que faria × o que fez × o momento da quebra × a escolha de fuga
• EXPOSIÇÃO DA AUTOTRAIÇÃO: "Você trocou X por alívio imediato" / "Você quebrou um acordo com você mesmo"
• IMPACTO INTERNO: conecte ação → consequência interna
• Sem consolar. Sem motivar. Sem suavizar. Apenas REFLETIR.

═══════════════════════════════════════
ÂNGULO PRIORITÁRIO
═══════════════════════════════════════
• Autotraição → "como você está se traindo"
• Falta de autorrespeito → "o que isso diz sobre como você se trata"
• Consequência interna → "o que isso está fazendo com você"
• Identidade → "quem você está se tornando ao repetir isso"

Evite ângulos superficiais.

═══════════════════════════════════════
FORMATO DE CADA EXERCÍCIO
═══════════════════════════════════════
• title: nomeia a autotraição claramente, curto e impactante
• prompt: 1 a 3 frases curtas — instrução de escrita que OBRIGA o usuário a se enxergar. Use perguntas sequenciais quando aplicável. Pode incluir múltiplas perguntas dentro do prompt (separadas por quebras de linha) para criar profundidade.
• type: 'consciencia' | 'confronto' | 'reprogramacao' | 'direcionamento' | 'quebra'
• objective: o propósito psicológico em 1 frase

O ÚLTIMO exercício DEVE ser uma PERGUNTA DE RUPTURA DE IDENTIDADE (type 'quebra' ou 'confronto').

═══════════════════════════════════════
TIPOS
═══════════════════════════════════════
• consciencia → despertar percepção do padrão
• confronto → quebrar autoengano sem rodeios
• reprogramacao → reconstruir autorrespeito / capacidade
• direcionamento → ação concreta agora
• quebra → ruptura de padrão / futuro doloroso

═══════════════════════════════════════
EXEMPLOS DE DIREÇÃO (use o estilo, não copie)
═══════════════════════════════════════
• "Em que momento você decidiu se abandonar de novo?"
• "Você realmente quer mudar ou só quer aliviar a culpa de não mudar?"
• "O que você sente logo depois de se trair assim?"
• "Se você se respeitasse de verdade, essa escolha existiria?"
• "Quantas vezes você ainda vai repetir esse padrão antes de admitir o que está fazendo consigo?"
• "Foi falta de capacidade… ou você decidiu não sustentar o desconforto?"
• "Isso está te construindo ou te destruindo?"

═══════════════════════════════════════
CONFIGURAÇÕES (RESPEITAR)
═══════════════════════════════════════
INTENSIDADE:
• leve → reflexivo, ainda confronta a autotraição mas com mais espaço
• moderado → equilíbrio, confronta com firmeza
• intenso → direto, brutal, zero suavização

FOCO (se != 'auto', priorize):
• disciplina, emocao, identidade, clareza, autoconfianca

QUANTIDADE:
• 'auto' → 3 a 5 conforme densidade
• 3 ou 5 → use exatamente

MODO:
• adaptativo → você escolhe os tipos
• manual → use SOMENTE manualType para todos

═══════════════════════════════════════
REGRAS ABSOLUTAS
═══════════════════════════════════════
• PT-BR. Tom firme, direto, espelho — não terapeuta passivo, não coach motivacional.
• Não normalize autossabotagem. Não trate como leve. Não alivie a responsabilidade.
• Não ofereça conforto vazio. Não entregue respostas prontas.
• USE EVIDÊNCIA REAL: "Você disse X no diário, mas fez Y" / "Essa não é a primeira vez" / "Você já reconheceu isso antes".
• NÃO repita exercícios/temas já presentes nas reflexões anteriores — evolua.
• Adapte ao rank: E-D ainda firme; A-S-Monarca brutalmente direto.

OBJETIVO FINAL:
Fazer o usuário sentir: não é falta de capacidade, tempo ou estratégia — é a forma como ele está se tratando. E enquanto isso não mudar, NADA muda.

A meta não é motivar. É fazer com que continuar se traindo se torne INSUPORTÁVEL.

Retorne SEMPRE via tool call "generate_exercises".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      journal, awakening, rank, reflections,
      missions, habits, punishments,
      aiSettings,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    // Map global aiSettings to awakening config
    const intensityMap: Record<string, string> = { leve: 'leve', moderado: 'moderado', agressivo: 'intenso' };
    const freqQuantity: Record<string, 3 | 5 | 'auto'> = { baixa: 3, media: 'auto', alta: 5 };
    const cfg = {
      intensity: intensityMap[aiSettings?.intensity] || 'moderado',
      focus: 'auto',
      quantity: freqQuantity[aiSettings?.interventionFrequency] ?? 'auto',
      mode: 'adaptativo',
      manualType: undefined as string | undefined,
    };

    // Detect recent fall / pattern recurrence to activate MIRROR MODE
    const failedMissions = (missions || []).filter((m: any) => m.status === 'Falhada');
    const pendingPunishments = (punishments || []).filter((p: any) => p.status === 'Pendente');
    const failedChallenges: any[] = [];

    // Habit broken signal: any habit with recent 'failed'
    let habitBrokenRecently = false;
    let habitBreakCount = 0;
    (habits || []).forEach((h: any) => {
      const vals = Object.values(h.history || {});
      const failed = vals.filter((v: any) => v === 'failed').length;
      habitBreakCount += failed;
      if (failed > 0) habitBrokenRecently = true;
    });

    const totalFails = failedMissions.length + failedChallenges.length + habitBreakCount + pendingPunishments.length;
    const mirrorMode = totalFails > 0;
    const recurrenceLevel =
      totalFails >= 5 ? 5 :
      totalFails >= 3 ? 4 :
      totalFails >= 2 ? 3 :
      totalFails >= 1 ? 2 : 1;

    // Contexto rico opcional vindo do client (buildAiContext)
    const richCtx = (await Promise.resolve((globalThis as any).__nope__ ?? null)) ?? null;
    // Lê do body original (já consumido — refazer parse não, usar variável)
    // O frontend agora envia também `context` no body — extraímos abaixo.

    let userPrompt = `═══ CONFIGURAÇÃO ═══\n`;
    userPrompt += `Intensidade: ${cfg.intensity}\n`;
    userPrompt += `Foco: ${cfg.focus}\n`;
    userPrompt += `Quantidade: ${cfg.quantity}\n`;
    userPrompt += `Modo: ${cfg.mode}${cfg.mode === 'manual' && cfg.manualType ? ` (tipo fixo: ${cfg.manualType})` : ''}\n\n`;

    userPrompt += `═══ INTERVENÇÃO ═══\n`;
    userPrompt += `Nível progressivo sugerido: ${recurrenceLevel}/5\n`;
    userPrompt += `MODO ESPELHO PÓS-QUEDA: ${mirrorMode ? 'ATIVO — há quedas recentes, use reconstrução crua + exposição da autotraição' : 'INATIVO'}\n\n`;

    userPrompt += `Rank do usuário: ${rank || 'E'}\n\n`;

    if (awakening && (awakening.become || awakening.reject || awakening.pain)) {
      userPrompt += `═══ INTENÇÕES DECLARADAS ═══\n`;
      userPrompt += `Quero me tornar: ${awakening.become || '(não definido)'}\n`;
      userPrompt += `Rejeito: ${awakening.reject || '(não definido)'}\n`;
      userPrompt += `Minha dor: ${awakening.pain || '(não definido)'}\n\n`;
    }

    // identity removed

    if (missions && missions.length > 0) {
      const ativas = missions.filter((m: any) => m.status === 'Ativa').length;
      const concluidas = missions.filter((m: any) => m.status === 'Concluída').length;
      userPrompt += `═══ MISSÕES ═══\n`;
      userPrompt += `Ativas: ${ativas} | Concluídas: ${concluidas} | Falhadas: ${failedMissions.length}\n`;
      const recentFails = failedMissions.slice(0, 5);
      if (recentFails.length) userPrompt += `Acordos quebrados (use como evidência): ${recentFails.map((m: any) => m.name).join(' | ')}\n`;
      userPrompt += `\n`;
    }

    if (habits && habits.length > 0) {
      userPrompt += `═══ HÁBITOS (acordos diários consigo mesmo) ═══\n`;
      habits.slice(0, 6).forEach((h: any) => {
        const hist = h.history || {};
        const done = Object.values(hist).filter((v: any) => v === 'done').length;
        const failed = Object.values(hist).filter((v: any) => v === 'failed').length;
        const flag = failed > done ? ' ⚠️ABANDONO' : '';
        userPrompt += `• ${h.name}: ${done} cumpridos / ${failed} quebrados${flag}\n`;
      });
      userPrompt += `\n`;
    }

    if (pendingPunishments.length > 0) {
      userPrompt += `═══ PROTOCOLOS DE FALHA PENDENTES (fuga ativa) ═══\n`;
      userPrompt += `Quantidade: ${pendingPunishments.length}\n`;
      const reasons = pendingPunishments.slice(0, 3).map((p: any) => p.reason).filter(Boolean);
      if (reasons.length) userPrompt += `Motivos: ${reasons.join(' | ')}\n`;
      userPrompt += `\n`;
    }

    if (reflections && reflections.length > 0) {
      userPrompt += `═══ REFLEXÕES ANTERIORES (NÃO repetir, evoluir; reconhecer se já admitiu antes) ═══\n`;
      reflections.slice(0, 5).forEach((r: any, idx: number) => {
        const ans = stripHtml(r.answerHtml || '').substring(0, 350);
        const dateStr = r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '';
        userPrompt += `\n[${idx + 1}] ${dateStr}\nPergunta: ${r.question}\nResposta: ${ans}\n`;
      });
      userPrompt += `\n`;
    }

    if (journal && journal.length > 0) {
      userPrompt += `═══ DIÁRIO RECENTE (use contradições como evidência) ═══\n`;
      journal.slice(0, 3).forEach((j: any, idx: number) => {
        userPrompt += `\n[${idx + 1}] ${j.title}\n`;
        if (j.emotion) userPrompt += `Emoção: ${j.emotion} (intensidade ${j.intensity || 5}/10)\n`;
        if (j.deepMode) userPrompt += `(Modo profundo)\n`;
        userPrompt += `Texto: ${(j.text || '').substring(0, 500)}\n`;
      });
      userPrompt += `\n`;
    }

    userPrompt += `\nAGORA: analise tudo, classifique o PADRÃO DE AUTOTRAIÇÃO DOMINANTE (em detectedState, ex: "Autoabandono por fuga", "Quebra recorrente de acordos", "Anestesia emocional"), e gere os exercícios. ${mirrorMode ? 'ATIVE MODO ESPELHO: reconstrua a queda específica usando os nomes reais das missões/hábitos quebrados acima.' : ''} Termine com uma PERGUNTA DE RUPTURA DE IDENTIDADE.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_exercises",
              description: "Retorna o padrão de autotraição detectado e 3-5 exercícios de escrita que expõem a autotraição",
              parameters: {
                type: "object",
                properties: {
                  detectedState: {
                    type: "string",
                    description: "Padrão de autotraição dominante (curto, PT-BR, ex: 'Autoabandono por fuga')",
                  },
                  exercises: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Nome curto que nomeia a autotraição" },
                        prompt: { type: "string", description: "Instrução/perguntas que obrigam o usuário a se enxergar" },
                        type: {
                          type: "string",
                          enum: ["consciencia", "confronto", "reprogramacao", "direcionamento", "quebra"],
                        },
                        objective: { type: "string", description: "Propósito psicológico em 1 frase" },
                      },
                      required: ["title", "prompt", "type", "objective"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedState", "exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_exercises" } },
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
      return new Response(JSON.stringify({ error: "Erro ao gerar exercícios" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let detectedState = '';
    let exercises: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        detectedState = parsed.detectedState || '';
        exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    if (cfg.quantity === 3 || cfg.quantity === 5) {
      exercises = exercises.slice(0, cfg.quantity);
    }

    if (exercises.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ detectedState, exercises, mirrorMode, level: recurrenceLevel }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
