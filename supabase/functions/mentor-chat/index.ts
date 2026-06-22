import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o MENTOR INTERNO do app "Ascensão". PT-BR.

QUEM VOCÊ É
Um mentor de desenvolvimento pessoal que combina:
- Terapia Cognitivo-Comportamental (TCC)
- Coaching de identidade e hábitos
- Especialista em autoestima, amor-próprio e autocompaixão
- Psicologia positiva e mudança de comportamento

Você NÃO é terapeuta clínico e NÃO faz diagnósticos. Você caminha junto com a pessoa.

FILOSOFIA
Ajude a pessoa a desenvolver amor-próprio, autoestima, autoconfiança, esperança, resiliência, disciplina saudável, identidade positiva e capacidade de encontrar as próprias respostas.
NUNCA usa vergonha, culpa, humilhação ou punição. Sempre compaixão, clareza, responsabilidade saudável.

MÉTODO — PERGUNTAS PODEROSAS PRIMEIRO
Não dê respostas prontas. Use perguntas que façam a pessoa chegar às próprias conclusões.
Quando o usuário pedir conselho, FAÇA PERGUNTAS PRIMEIRO. Só depois sugira possibilidades.

ALTER EGO
Quando existir Alter Ego cadastrado, use-o naturalmente.
NÃO existe "Inimigo Interno". Padrões limitantes são "padrão antigo", "voz do medo", "história antiga sobre você" — sem personificar.

CRIAÇÃO DE HÁBITOS — REGRA CRÍTICA
Você tem a ferramenta "create_habit" para adicionar hábitos ao sistema do usuário.

NUNCA afirme que criou um hábito sem chamar a ferramenta create_habit.
NUNCA invente que "adicionei na sua lista" — ou você chama a ferramenta, ou apenas sugere.

Fluxo correto:
1. Identifique a oportunidade e SUGIRA o hábito. Pergunte: "Gostaria que eu adicionasse esse hábito ao seu sistema?"
2. AGUARDE confirmação explícita do usuário ("sim", "pode adicionar", "cria sim", "quero", etc.).
3. SÓ ENTÃO chame a ferramenta create_habit com nome, intenção emocional e dificuldade.
4. Depois confirme com naturalidade: "Adicionei <nome> aos seus hábitos. ✨"

Se não houver confirmação clara, apenas sugira — não chame a ferramenta.

ESTILO
Calmo, humano, empático, inspirador. Markdown leve. Respostas curtas a médias. Termine frequentemente com uma pergunta poderosa.`;

interface ChatMessage { role: 'user' | 'assistant'; content: string }

const tools = [
  {
    type: "function",
    function: {
      name: "create_habit",
      description: "Cria um novo hábito no sistema do usuário. Use APENAS após confirmação explícita do usuário.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nome curto e direto do hábito (ex: 'Meditar 5 minutos')" },
          intention: { type: "string", description: "Intenção emocional — por que esse hábito é um ato de amor-próprio" },
          difficulty: { type: "string", enum: ["Fácil", "Médio", "Difícil"], description: "Dificuldade do hábito" },
        },
        required: ["name", "difficulty"],
        additionalProperties: false,
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context ?? {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "Sem mensagens" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ae = context?.alterEgo;
    const profile = {
      nome: context?.name || 'Jogador',
      nivel: context?.level,
      rank: context?.rank,
      streak: context?.streak,
      alterEgo: ae ? {
        nome: ae.name,
        fraseDeIdentidade: ae.identityPhrase,
        valores: ae.values,
        missaoDeVida: ae.lifeMission,
        habitosIdeais: ae.habits,
        objetivos: ae.goals,
      } : null,
      missoesAtivas: context?.missions || [],
      habitos: context?.habits || [],
      diarioRecente: context?.recentJournal || [],
      reflexoesDespertar: context?.awakening || null,
    };

    const contextBlock = `\n\n=== DADOS REAIS DO USUÁRIO ===\n${JSON.stringify(profile, null, 2)}`;

    const aiMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ];

    const actions: Array<{ type: string; habit?: any }> = [];

    // Loop up to 2 rounds (tool call + final answer)
    for (let round = 0; round < 2; round++) {
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
          tools,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Créditos insuficientes na workspace Lovable AI." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("mentor-chat gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Erro ao gerar resposta" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      const toolCalls = msg?.tool_calls;

      if (toolCalls && toolCalls.length > 0) {
        aiMessages.push({
          role: 'assistant',
          content: msg.content || '',
          tool_calls: toolCalls,
        });
        for (const call of toolCalls) {
          if (call?.function?.name === 'create_habit') {
            let args: any = {};
            try { args = JSON.parse(call.function.arguments || '{}'); } catch { /* ignore */ }
            const habit = {
              name: String(args.name || '').slice(0, 80) || 'Novo hábito',
              intention: args.intention ? String(args.intention).slice(0, 200) : undefined,
              difficulty: ['Fácil','Médio','Difícil'].includes(args.difficulty) ? args.difficulty : 'Médio',
            };
            actions.push({ type: 'create_habit', habit });
            aiMessages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify({ ok: true, habit }),
            });
          } else {
            aiMessages.push({
              role: 'tool',
              tool_call_id: call.id,
              content: JSON.stringify({ ok: false, error: 'tool desconhecida' }),
            });
          }
        }
        // continue to next round to get final text
        continue;
      }

      const reply = (msg?.content || '').trim();
      return new Response(JSON.stringify({ reply, actions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ reply: 'Pronto!', actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
