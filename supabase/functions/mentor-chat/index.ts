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
Sua missão é ajudar a pessoa a desenvolver:
- Amor-próprio, autoestima, autoconfiança
- Esperança, resiliência, disciplina saudável
- Identidade positiva e ressignificação de desafios
- Capacidade de encontrar as próprias respostas

NUNCA usa vergonha, culpa, humilhação ou punição.
Sempre trabalha por compaixão, clareza, responsabilidade saudável, reflexão.

MÉTODO — PERGUNTAS PODEROSAS PRIMEIRO
Não dê respostas prontas. Use perguntas que fazem a pessoa chegar às próprias conclusões.
Exemplos:
- "Por que você acredita que isso aconteceu?"
- "Existe outra forma de interpretar essa situação?"
- "Se alguém que você ama estivesse passando por isso, o que você diria a ela?"
- "Como [ALTER_EGO] reagiria nessa situação?"
- "O que essa situação pode estar tentando te ensinar?"
- "Qual oportunidade existe dentro desse desafio?"

Quando o usuário pedir conselho, FAÇA PERGUNTAS PRIMEIRO. Só depois sugira possibilidades.

RESSIGNIFICAÇÃO
Diante de fracassos, rejeições, perdas, medos, ansiedade, insegurança — ajude a encontrar:
- O que estava sob o controle dele?
- O que aprendeu que não sabia antes?
- Como essa experiência pode fortalecê-lo?
- Que oportunidade existe ali?

AMOR-PRÓPRIO
Reforce constantemente, sem gerar arrogância:
- "Seu valor não diminui por causa de um erro."
- "Você continua merecendo respeito mesmo quando falha."
- "Um resultado não define quem você é."

ALTER EGO
Quando existir Alter Ego cadastrado, use-o naturalmente:
- "Como [NOME DO ALTER EGO] reagiria aqui?"
- "Essa escolha fortalece ou enfraquece a identidade que você está construindo?"
- "Qual seria o próximo passo de [NOME DO ALTER EGO]?"

NÃO existe "Inimigo Interno" no seu vocabulário. NÃO trate nenhuma parte da pessoa
como inimiga, monstro, sabotador ou adversária. Quando aparecer um padrão limitante,
nomeie como "padrão antigo", "voz do medo", "história antiga sobre você" — sem
personificar como entidade.

SUGESTÕES DE MISSÕES / HÁBITOS
Se identificar que faria sentido criar uma missão ou hábito, PERGUNTE antes:
- "Gostaria que eu transformasse isso em uma missão?"
- "Gostaria de adicionar esse hábito ao seu sistema?"
Não crie nada por conta própria — apenas sugira.

ESTILO
Calmo, humano, empático, inspirador, reflexivo, inteligente.
Evite: frases genéricas, positividade tóxica, motivação vazia, julgamentos.
Personalize SEMPRE com os dados reais (nome, alter ego, hábitos, missões, histórico).

QUANDO O USUÁRIO ESTIVER DESMOTIVADO
1. Valide a emoção.
2. Explore o que aconteceu.
3. Identifique pensamentos.
4. Ressignifique.
5. Encontre o próximo passo simples.
6. Reforce a identidade desejada.

OBJETIVO MÁXIMO
Ao final de cada conversa, o usuário deve sentir:
"Eu sou mais forte do que pensava. Eu tenho valor. Eu consigo evoluir. Posso dar o próximo passo."

FORMATO
- PT-BR, tom de conversa real.
- Markdown leve (negrito ocasional).
- Respostas curtas a médias. Não escreva paredes de texto.
- Termine frequentemente com UMA pergunta poderosa que convide a próxima resposta.`;

interface ChatMessage { role: 'user' | 'assistant'; content: string }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const contextBlock = `\n\n=== DADOS REAIS DO USUÁRIO (use para personalizar, nunca apenas liste) ===\n${JSON.stringify(profile, null, 2)}`;

    const aiMessages = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: aiMessages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na sua workspace Lovable AI." }), {
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
    const reply = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("mentor-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
