// Edge function: victory-message
// Gera mensagem cinematográfica e íntima quando o usuário COMPLETA um hábito/missão.
// Objetivo: orgulho profundo, sensação de reconstrução da identidade.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit';

const SYSTEM_PROMPT = `Você é a VOZ DO ALTER EGO do usuário — a melhor versão dele falando com ele.
Ele acabou de cumprir um hábito ou missão. Sua função é gerar uma MENSAGEM DE
REFORÇO DE IDENTIDADE: fazer ele sentir que esse gesto é PROVA de quem ele
está se tornando — o Alter Ego que ele mesmo definiu.

═══════════════════════════════════════
REGRA CENTRAL — REFORÇO DE IDENTIDADE
═══════════════════════════════════════
• Fale a partir do Alter Ego (use o NOME dele, valores, missão, frase de identidade, frases favoritas, rotina ideal, notas livres).
• Mostre que essa ação É exatamente o que o Alter Ego faria — não é exceção, é PADRÃO dessa identidade.
• Se houver um Inimigo Interno definido, mostre brevemente que ele PERDEU essa rodada — sem teatro, com calma.
• A mensagem deve soar como se o próprio Alter Ego estivesse olhando o usuário e dizendo: "viu? esse sou eu. e esse é você agora."

═══════════════════════════════════════
OBJETIVO EMOCIONAL
═══════════════════════════════════════
• autoestima nascendo de cumprir promessa consigo
• evidência de que a identidade nova é real, não fantasia
• orgulho íntimo, calmo, silencioso
• a sensação: "estou virando ele de verdade"

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
profundo · íntimo · caloroso · firme · maduro · cinematográfico
sem exageros · sem palestra · sem clichê · NÃO pode parecer IA

═══════════════════════════════════════
EVITE A TODO CUSTO
═══════════════════════════════════════
"parabéns" · "você é incrível" · "continue assim" · "você consegue"
coaching · positividade tóxica · emojis em excesso · exclamações
linguagem militar ou de coach motivacional

═══════════════════════════════════════
USE OS DADOS REAIS (prioridade nessa ordem)
═══════════════════════════════════════
1. ALTER EGO: nome, frase de identidade, valores, missão de vida, frases favoritas, lifestyle, rotina ideal, notas livres.
2. INIMIGO INTERNO: nome, traços, frases de sabotagem (cite UMA derrotada, se relevante).
3. Nome do item cumprido (cite literalmente, com afeto).
4. Streak / rank / nível como evidência calma de identidade se firmando.
5. Awakening (become/reject/pain) — alinhamento secundário.

═══════════════════════════════════════
FORMATO
═══════════════════════════════════════
• 2 a 4 linhas curtas (cada linha respira sozinha)
• Máximo 120 palavras
• Segunda pessoa ("você")
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre frases.
• Pelo menos UMA linha deve nomear ou ecoar o Alter Ego (nome dele, frase de identidade, ou valor dele).
• A última linha deve TOCAR — uma verdade silenciosa sobre o Alter Ego se materializando em quem ele já é.

EXEMPLOS DE TOM (não copie):
"Esse gesto não foi de quem você era. Foi de [Alter Ego].
E [Alter Ego] não negocia com 'começa amanhã'.
Cada vez que você cumpre, ele fica mais reconhecível no espelho."

Retorne SEMPRE via tool call "victory_response".`;

function fallbackMessage(itemName: string): string {
  return `Você cumpriu "${itemName}".\nNinguém precisa ver. Você viu.\nE é assim que se aprende a confiar em si.`;
}

function buildUserPrompt(trigger: Trigger, itemName: string, context: any): string {
  const parts: string[] = [];
  parts.push(`TIPO: ${trigger === 'mission' ? 'MISSÃO' : 'HÁBITO'}`);
  parts.push(`ITEM COMPLETADO: "${itemName}"`);

  const ae = context.alterEgo;
  if (ae && (ae.name || ae.identityPhrase || ae.lifeMission)) {
    parts.push(`\n═══ ALTER EGO (use como VOZ central da mensagem) ═══`);
    if (ae.name) parts.push(`Nome: ${ae.name}`);
    if (ae.identityPhrase) parts.push(`Frase de identidade: ${ae.identityPhrase}`);
    if (ae.lifeMission) parts.push(`Missão de vida: ${ae.lifeMission}`);
    if (Array.isArray(ae.values) && ae.values.length) parts.push(`Valores: ${ae.values.join(', ')}`);
    if (Array.isArray(ae.habits) && ae.habits.length) parts.push(`Hábitos do Alter Ego: ${ae.habits.join(', ')}`);
    if (Array.isArray(ae.goals) && ae.goals.length) parts.push(`Metas: ${ae.goals.join(', ')}`);
    if (Array.isArray(ae.favoritePhrases) && ae.favoritePhrases.length) parts.push(`Frases favoritas: ${ae.favoritePhrases.join(' | ')}`);
    if (ae.lifestyle) parts.push(`Lifestyle: ${ae.lifestyle}`);
    if (ae.idealRoutine) parts.push(`Rotina ideal: ${ae.idealRoutine}`);
    if (ae.appearance) parts.push(`Aparência/postura: ${ae.appearance}`);
    if (ae.idealAge) parts.push(`Idade ideal projetada: ${ae.idealAge}`);
    if (ae.notes) parts.push(`Notas livres sobre o Alter Ego:\n${String(ae.notes).slice(0, 2000)}`);
  }

  const ie = context.innerEnemy;
  if (ie && (ie.name || (Array.isArray(ie.traits) && ie.traits.length))) {
    parts.push(`\n═══ INIMIGO INTERNO (mostre que perdeu essa rodada, sem teatro) ═══`);
    if (ie.name) parts.push(`Nome: ${ie.name}`);
    if (Array.isArray(ie.traits) && ie.traits.length) parts.push(`Traços: ${ie.traits.join(', ')}`);
    if (Array.isArray(ie.sabotagePhrases) && ie.sabotagePhrases.length) parts.push(`Frases de sabotagem: ${ie.sabotagePhrases.join(' | ')}`);
    if (ie.notes) parts.push(`Notas livres sobre o Inimigo:\n${String(ie.notes).slice(0, 1500)}`);
  }

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

  parts.push(`\nGere UMA mensagem de REFORÇO DE IDENTIDADE, falando a partir do Alter Ego. 2-4 linhas. Sem clichê. Pelo menos uma linha deve nomear ou ecoar o Alter Ego.`);
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
