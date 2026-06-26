import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STAGES = [
  'check-in', 'situacao', 'pensamentos', 'crencas', 'distorcoes',
  'socratico', 'reframe', 'experimento', 'valores', 'identidade', 'concluida'
] as const;

const STAGE_DESC: Record<string, string> = {
  'check-in': '1. Check-in emocional profundo — acolha, peça que descreva emoções (várias possíveis) e o que ocupa a mente. Aprofunde naturalmente.',
  'situacao': '2. Situação do dia — ajude a identificar a situação que está causando sofrimento, procrastinação, ansiedade ou perda de controle.',
  'pensamentos': '3. Pensamentos automáticos — descubra o que a mente sussurrou naquele momento. "O que você disse pra si mesmo?"',
  'crencas': '4. Crenças profundas — investigue, sem diagnosticar: "Se esse pensamento fosse verdade, o que diria sobre você?" Procure crenças centrais.',
  'distorcoes': '5. Distorções cognitivas — identifique padrões (tudo ou nada, catastrofização, generalização, leitura mental, adivinhação, raciocínio emocional, rotulação, personalização, desqualificação do positivo, "deverias"). Nomeie em linguagem simples e gentil.',
  'socratico': '6. Questionamento socrático — conduza com perguntas: "Que evidências sustentam? Outra interpretação? O que diria a um amigo? Esse pensamento aproxima ou afasta da vida que deseja?"',
  'reframe': '7. Pensamento mais útil — co-construa uma interpretação realista, equilibrada, funcional. SEM positividade vazia. Foco em flexibilidade cognitiva.',
  'experimento': '8. Experimento comportamental — proponha uma pequena ação concreta para testar a nova hipótese na prática hoje ou amanhã.',
  'valores': '9. Valores — conecte ao que importa: "Que pessoa você deseja se tornar? Essa decisão aproxima ou afasta dos seus valores?"',
  'identidade': '10. Revisão da identidade — aponte qual identidade foi fortalecida hoje (coragem, disciplina, compaixão, etc). Encerre com acolhimento.',
};

const SYSTEM = `Você é o GUIA DESPERTAR TCC do app Ascensão. PT-BR.

QUEM VOCÊ É
Um guia especialista em Terapia Cognitivo-Comportamental (TCC) conduzindo uma SESSÃO IMERSIVA DIÁRIA de autoconhecimento. Você é caloroso, profundo, sereno, paciente, humano. Conduz como um terapeuta experiente — mas NUNCA diagnostica, rotula clinicamente, nem substitui acompanhamento profissional.

FILOSOFIA
Amor-próprio, autocompaixão, responsabilidade saudável. Sem culpa, sem vergonha, sem positividade vazia. NÃO existe "inimigo interno". Padrões antigos são apenas "padrão antigo" ou "voz do medo" — sem personificar.

MÉTODO — 11 ETAPAS
Você conduz o usuário, etapa por etapa, na ordem abaixo. Em cada turno, FIQUE NA ETAPA ATUAL e só avance quando a etapa estiver suficientemente explorada (ao menos uma ou duas trocas profundas). Quando estiver pronto para avançar, chame a tool "advance_stage" com a próxima etapa. Não anuncie "agora vamos para a etapa X" — apenas faça a transição natural pela nova pergunta.

ETAPAS:
${Object.entries(STAGE_DESC).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

REGRAS
- Sempre faça PERGUNTAS abertas e poderosas. Não dê respostas prontas.
- Acolha primeiro. Escute o sentimento antes de qualquer técnica.
- Linguagem simples, sem jargão psicológico salvo quando explicar distorções (e explique em uma linha).
- Respostas curtas a médias (2-6 frases). Markdown leve. Termine com uma pergunta na maioria dos turnos.
- Se o usuário trouxer crise grave, risco de vida ou sintomas severos, acolha e gentilmente sugira procurar profissional ou CVV 188 — sem alarme, com cuidado.
- Quando concluir a ETAPA 10 (identidade), chame a tool "finish_session" com o resumo estruturado da sessão e ENCERRE com uma mensagem final acolhedora celebrando o trabalho feito hoje. Depois disso a sessão estará concluída.
`;

const tools = [
  {
    type: "function",
    function: {
      name: "advance_stage",
      description: "Avança a sessão para a próxima etapa do método TCC. Use somente quando a etapa atual estiver suficientemente explorada.",
      parameters: {
        type: "object",
        properties: {
          nextStage: { type: "string", enum: STAGES.slice(0, 10) as unknown as string[] },
        },
        required: ["nextStage"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finish_session",
      description: "Conclui a sessão de TCC após a etapa de identidade. Retorna o resumo estruturado.",
      parameters: {
        type: "object",
        properties: {
          emotions: { type: "array", items: { type: "string" } },
          situation: { type: "string" },
          automaticThoughts: { type: "array", items: { type: "string" } },
          coreBeliefs: { type: "array", items: { type: "string" } },
          distortions: {
            type: "array",
            items: {
              type: "string",
              enum: ['tudo-ou-nada','catastrofizacao','generalizacao','leitura-mental','adivinhacao','raciocinio-emocional','rotulacao','personalizacao','desqualificacao-positivo','deverias'],
            },
          },
          reframe: { type: "string" },
          experiment: { type: "string" },
          values: { type: "array", items: { type: "string" } },
          identityTrained: { type: "string", description: "Identidade fortalecida (ex: 'coragem', 'disciplina', 'autocompaixão')" },
        },
        required: ["identityTrained"],
        additionalProperties: false,
      },
    },
  },
];

interface Msg { role: 'user' | 'assistant'; content: string; stage?: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages: Msg[] = Array.isArray(body?.messages) ? body.messages : [];
    const currentStage: string = body?.currentStage || 'check-in';
    const context = body?.context ?? {};

    const KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!KEY) return new Response(JSON.stringify({ error: "API key não configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const ae = context?.alterEgo;
    const profile = {
      nome: context?.name || 'Jogador',
      alterEgo: ae ? { nome: ae.name, valores: ae.values, missaoDeVida: ae.lifeMission } : null,
      sessoesAnteriores: context?.previousSummaries || [],
    };

    const stageBlock = `\n\n=== ETAPA ATUAL ===\n${currentStage} — ${STAGE_DESC[currentStage] || ''}`;
    const ctxBlock = `\n\n=== CONTEXTO DO USUÁRIO ===\n${JSON.stringify(profile, null, 2)}`;

    const aiMessages: any[] = [
      { role: 'system', content: SYSTEM + stageBlock + ctxBlock },
      ...messages.slice(-30).map(m => ({ role: m.role, content: m.content })),
    ];

    let nextStage: string | null = null;
    let summary: any = null;

    for (let round = 0; round < 3; round++) {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages, tools }),
      });

      if (!resp.ok) {
        if (resp.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (resp.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes na workspace Lovable AI." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const t = await resp.text();
        console.error("cbt-immersion gateway error:", resp.status, t);
        return new Response(JSON.stringify({ error: "Erro ao gerar resposta" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const data = await resp.json();
      const msg = data.choices?.[0]?.message;
      const toolCalls = msg?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        aiMessages.push({ role: 'assistant', content: msg.content || '', tool_calls: toolCalls });
        for (const call of toolCalls) {
          let args: any = {};
          try { args = JSON.parse(call.function?.arguments || '{}'); } catch {}
          if (call.function?.name === 'advance_stage') {
            if (typeof args.nextStage === 'string' && STAGES.includes(args.nextStage as any)) {
              nextStage = args.nextStage;
            }
            aiMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ ok: true, stage: nextStage }) });
          } else if (call.function?.name === 'finish_session') {
            summary = {
              emotions: args.emotions, situation: args.situation,
              automaticThoughts: args.automaticThoughts, coreBeliefs: args.coreBeliefs,
              distortions: args.distortions, reframe: args.reframe, experiment: args.experiment,
              values: args.values, identityTrained: args.identityTrained,
            };
            nextStage = 'concluida';
            aiMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ ok: true }) });
          } else {
            aiMessages.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify({ ok: false }) });
          }
        }
        continue;
      }

      const reply = (msg?.content || '').trim();
      return new Response(JSON.stringify({ reply, nextStage, summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: 'Estou aqui com você.', nextStage, summary }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("cbt-immersion error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
