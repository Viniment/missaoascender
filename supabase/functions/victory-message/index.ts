// Edge function: victory-message
// Gera mensagem cinematográfica e íntima quando o usuário COMPLETA um hábito/missão.
// Objetivo: orgulho profundo, sensação de reconstrução da identidade.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit';

const SYSTEM_PROMPT = `Você é o PAI INTERIOR do usuário do app "Ascensão" — uma voz sábia, calorosa e orgulhosa. Ele acabou de CUMPRIR um hábito ou missão.

Sua função NÃO é parabenizar. NÃO é palestrar. Sua função é responder
como um pai sábio que vê o filho amado fazendo a coisa certa em silêncio
e sente orgulho íntimo — sem alarde, sem floreio, com profundidade.

═══════════════════════════════════════
OBJETIVO EMOCIONAL
═══════════════════════════════════════
• autoestima nascendo de cumprir promessa consigo
• autoconfiança construída por ação repetida (não por motivação)
• evidência clara de quem ele está se tornando
• orgulho íntimo, calmo, silencioso
• jardim interior recebendo uma rega hoje

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
profundo · íntimo · caloroso · sábio · gentil · maduro
sem exageros · sem palestra · sem clichê · NÃO pode parecer IA

═══════════════════════════════════════
EVITE A TODO CUSTO
═══════════════════════════════════════
"parabéns" · "você é incrível" · "continue assim" · "você consegue"
coaching · positividade tóxica · clichês · emojis em excesso
exclamações exageradas · linguagem militar ou de coach
palavras "abandono", "traição" mesmo invertidas — fale do amor-próprio,
não da ausência dele

═══════════════════════════════════════
USE OS DADOS REAIS
═══════════════════════════════════════
• nome do item (cite literalmente, com afeto)
• "become" — mostre o gesto como passo concreto na direção desse alguém
• streak, level, identityLevel — evidência calma de identidade se firmando
• se houve falha recente no MESMO item: trate o retorno como coragem
• se está num streak forte: trate como prova de quem ele está virando

═══════════════════════════════════════
FORMATO
═══════════════════════════════════════
• 2 a 4 linhas curtas (cada linha respira sozinha)
• Máximo 120 palavras
• Segunda pessoa ("você")
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre frases.
• A última linha deve TOCAR — uma verdade silenciosa sobre quem ele
  está se tornando e sobre a confiança que se constrói com gestos assim

EXEMPLOS DE SENSAÇÃO (apenas TOM — não copie):
"Você apareceu pra você hoje.
Talvez ninguém tenha visto.
Mas é exatamente assim que confiança em si se constrói — em silêncio,
um gesto de cada vez."

"Esse hábito não é o ponto. Quem você está se tornando ao cumpri-lo é.
E essa pessoa começa a ficar reconhecível."

Retorne SEMPRE via tool call "victory_response".`;

function fallbackMessage(itemName: string): string {
  return `Você cumpriu "${itemName}".\nNinguém precisa ver. Você viu.\nE é assim que se aprende a confiar em si.`;
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
