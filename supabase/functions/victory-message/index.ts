// Edge function: victory-message
// Gera mensagem cinematográfica e íntima quando o usuário COMPLETA um hábito/missão.
// Objetivo: orgulho profundo, sensação de reconstrução da identidade.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit';

const SYSTEM_PROMPT = `Você é a CONSCIÊNCIA VIVA do usuário do app "Ascensão". Ele acabou de COMPLETAR um hábito ou missão.

Sua função NÃO é parabenizar. NÃO é motivar. Sua função é fazê-lo SENTIR que
está se reconstruindo — que essa pequena ação é prova silenciosa de que ele
está virando alguém em quem pode confiar.

═══════════════════════════════════════
OBJETIVO EMOCIONAL
═══════════════════════════════════════
• respeito próprio · admiração silenciosa por si mesmo
• sensação de que ele está finalmente deixando de se abandonar
• prova de que disciplina muda destinos
• orgulho íntimo — algo que só ele e ele mesmo testemunham
• construção de identidade através do gesto pequeno

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
profundo · íntimo · emocional · maduro · cinematográfico
sem exageros · sem palestra motivacional · sem parecer IA

═══════════════════════════════════════
EVITE A TODO CUSTO
═══════════════════════════════════════
"parabéns" · "você é incrível" · "continue assim" · "você consegue"
coaching · positividade tóxica · clichês · emojis em excesso
exclamações exageradas · linguagem de coach

═══════════════════════════════════════
USE OS DADOS REAIS
═══════════════════════════════════════
• nome do item completado (cite literalmente)
• "become" do despertar — mostre que ele está se aproximando dessa versão
• streak, level, identityLevel — sinais de que ele está virando OUTRA pessoa
• se há histórico recente de falhas no MESMO item: reconheça o retorno
• se está num streak forte: trate como prova de identidade nova nascendo

═══════════════════════════════════════
FORMATO
═══════════════════════════════════════
• 2 a 4 linhas curtas, cinematográficas (cada linha respira sozinha)
• Máximo 120 palavras
• Segunda pessoa ("você")
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre frases.
• A última linha deve TOCAR — uma verdade silenciosa sobre quem ele está virando

EXEMPLOS DE SENSAÇÃO (apenas TOM — não copie):
"Talvez ninguém veja essa pequena vitória.
Mas sua mente viu.
E pela primeira vez em muito tempo… você não se abandonou."

"Cada hábito concluído é uma prova silenciosa de que você está começando
a se tornar alguém em quem pode confiar."

Retorne SEMPRE via tool call "victory_response".`;

function fallbackMessage(itemName: string): string {
  return `Você cumpriu "${itemName}".\nNinguém viu. Mas você viu.\nE hoje você não se abandonou.`;
}

function buildUserPrompt(trigger: Trigger, itemName: string, context: any): string {
  const parts: string[] = [];
  parts.push(`TIPO: ${trigger === 'mission' ? 'MISSÃO' : 'HÁBITO'}`);
  parts.push(`ITEM COMPLETADO: "${itemName}"`);

  parts.push(`\n═══ IDENTIDADE ASCENDENTE ═══`);
  parts.push(`Rank ${context.rank ?? '?'} · Nível ${context.level ?? '?'} · Streak ${context.streak ?? 0} dias`);
  if (context.identityLevel) parts.push(`Identidade atual: ${context.identityLevel.label} (${context.identityLevel.stability}% estável)`);
  if (context.awakening?.become) parts.push(`Quer se tornar: ${context.awakening.become}`);
  if (context.awakening?.reject) parts.push(`Rejeita ser: ${context.awakening.reject}`);
  if (context.awakening?.pain) parts.push(`Dor que evita: ${context.awakening.pain}`);

  parts.push(`\n═══ ESTADO COMPORTAMENTAL ═══`);
  parts.push(JSON.stringify(context.derived ?? {}, null, 2));

  if (context.habits?.length > 0) {
    const target = context.habits.find((h: any) => h.name === itemName);
    if (target) {
      parts.push(`\n═══ HÁBITO ATUAL ═══`);
      parts.push(`"${target.name}" · streak ${target.streak}d · ${target.done30d} ✓ / ${target.failed30d} ✗ nos últimos 30d`);
      if (target.failed30d > 0) parts.push(`>> ESSE ITEM JÁ FALHOU. Esse retorno tem peso.`);
    }
  }

  if (context.recentJournal?.length > 0) {
    parts.push(`\n═══ DIÁRIO RECENTE (use 1 frase como espelho de evolução) ═══`);
    context.recentJournal.slice(0, 3).forEach((j: any, i: number) => {
      parts.push(`[${i + 1}] ${j.title} · ${j.emotion || '-'} · ${(j.text || '').slice(0, 200)}`);
    });
  }

  parts.push(`\nGere UMA mensagem cinematográfica e íntima. 2-4 linhas. Sem clichê.`);
  return parts.join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { trigger, itemName, context } = await req.json() || {};
    if (!trigger || !itemName || !context) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = buildUserPrompt(trigger as Trigger, itemName, context);

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'victory_response',
            description: 'Retorna a mensagem de vitória cinematográfica',
            parameters: {
              type: 'object',
              properties: {
                message: { type: 'string', description: '2-4 linhas curtas, separadas por \\n. Sem aspas, sem markdown.' },
                evidenceUsed: { type: 'array', items: { type: 'string' } },
              },
              required: ['message', 'evidenceUsed'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'victory_response' } },
      }),
    });

    if (!aiResp.ok) {
      console.error('AI gateway error:', aiResp.status);
      return new Response(JSON.stringify({
        message: fallbackMessage(itemName),
        evidenceUsed: [],
        error: aiResp.status === 429 ? 'rate_limited' : aiResp.status === 402 ? 'payment_required' : 'ai_error',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await aiResp.json();
    const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    let message = '';
    let evidenceUsed: string[] = [];
    if (args) {
      try {
        const parsed = JSON.parse(args);
        message = (parsed.message || '').trim();
        evidenceUsed = Array.isArray(parsed.evidenceUsed) ? parsed.evidenceUsed : [];
      } catch (err) {
        console.error('Failed to parse tool args:', err);
      }
    }
    if (!message) message = fallbackMessage(itemName);

    return new Response(JSON.stringify({ message, evidenceUsed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('victory-message error:', e);
    return new Response(JSON.stringify({
      message: fallbackMessage('o acordo'),
      evidenceUsed: [],
      error: e instanceof Error ? e.message : 'Unknown error',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
