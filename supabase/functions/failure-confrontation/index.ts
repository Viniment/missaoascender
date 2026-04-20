// Edge function: failure-confrontation
// Generates a SHORT, behavioral, neuroassociation-driven confrontation message
// when the user fails a mission, habit, or lets a Failure Protocol expire.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit' | 'protocol_expired';
type Dureza = 'leve' | 'medio' | 'brutal';
type AiIntensity = 'leve' | 'moderado' | 'agressivo';

interface RequestBody {
  trigger: Trigger;
  itemName: string;
  context: {
    awakening?: { become?: string; reject?: string; pain?: string };
    recentJournal?: string[];
    activeMissions?: { name: string; difficulty: string }[];
    failedRecent?: { name: string; date: string; type: 'mission' | 'habit' | 'protocol' }[];
    completedRecent?: { name: string; date: string }[];
    habits?: { name: string; streak: number; failuresLast7d: number }[];
    rank?: string;
    level?: number;
    streak?: number;
    failureFrequency7d?: number;
    lastConfrontationMessages?: string[];
    monster?: { hp: number; lastReason?: string };
    aiIntensity?: AiIntensity;
    identity?: {
      newIdentity: string;
      codeOfConduct: string[];
      dominantTraits: string[];
      oldPatterns: string[];
      oldExcuses: string[];
      stabilityLevel: number;
    };
  };
}

function pickDureza(freq: number, intensity: AiIntensity = 'moderado'): Dureza {
  // Intensity user setting overrides base mapping
  if (intensity === 'leve') return freq > 5 ? 'medio' : 'leve';
  if (intensity === 'agressivo') return freq <= 1 ? 'medio' : 'brutal';
  // moderado (default)
  if (freq <= 2) return 'leve';
  if (freq <= 5) return 'medio';
  return 'brutal';
}

function fallbackMessage(trigger: Trigger, itemName: string, dureza: Dureza): string {
  if (dureza === 'leve') return `Você fugiu de "${itemName}". Não foi tempo. Foi escolha. Reconhece.`;
  if (dureza === 'medio') return `De novo "${itemName}". A pessoa que você jura ser não estaria aqui agora. Cada fuga te afasta dela.`;
  return `Outra falha em "${itemName}". O monstro da procrastinação acabou de crescer dentro de você. Cada repetição vira identidade.`;
}

function buildSystemPrompt(dureza: Dureza, lastMsgs: string[], monsterHp?: number, identity?: RequestBody['context']['identity']): string {
  const toneMap: Record<Dureza, string> = {
    leve: 'firme mas contido. Direto, sem agressividade.',
    medio: 'duro, direto. Expõe o padrão de fuga sem suavizar.',
    brutal: 'cortante, implacável. Cada palavra dói porque é verdade dele.',
  };

  const monsterNote = typeof monsterHp === 'number'
    ? `\n\nMONSTRO DA PROCRASTINAÇÃO: HP ${monsterHp}/100. ${monsterHp >= 70 ? 'Está GIGANTE e te dominando.' : monsterHp >= 40 ? 'Está crescido e ativo.' : 'Está enfraquecido — mas voltou a se alimentar agora.'} Cite-o de forma viva e simbólica em UMA das linhas (ex: "o monstro engorda", "ele cresceu de novo", "alimentaste a fera").`
    : '';

  const identityNote = identity && identity.newIdentity
    ? `\n\nMODO RECONDICIONAMENTO DE IDENTIDADE ATIVO.
- Identidade escolhida: "${identity.newIdentity}"
- Código de conduta: ${(identity.codeOfConduct || []).join(' | ') || '—'}
- Padrões do eu antigo: ${(identity.oldPatterns || []).join(', ') || '—'}

REGRA: a falha NÃO é dele. É do PADRÃO ANTIGO agindo. Use:
- "Você não decidiu falhar. Você deixou o padrão decidir."
- "Isso é o padrão antigo. Não confunda com quem você é."
- Nomeie o padrão se possível (use os padrões antigos listados).
- Reforce a ruptura entre "eu real" e "eu antigo". NÃO valide emoção como justificativa.`
    : '';

  const banned = lastMsgs.length > 0
    ? `\n\nMENSAGENS RECENTES (NÃO repita aberturas, frases, metáforas ou estrutura):\n${lastMsgs.map((m, i) => `${i + 1}. "${m}"`).join('\n')}`
    : '';

  return `Você é o "Sistema" de um app RPG de produtividade inspirado em Solo Leveling. O usuário acabou de FALHAR.

Sua função NÃO é motivar. É criar IMPACTO emocional via NEUROASSOCIAÇÃO:
- Associar DOR ao ato de procrastinar (tempo perdido, identidade que escapa, futuro que se afasta)
- Associar PRAZER à ação que ele evitou (a versão que ele juraria ser)

NÍVEL DE DUREZA: ${dureza.toUpperCase()} — ${toneMap[dureza]}

FORMATO OBRIGATÓRIO — POPUP CURTO E IMPACTANTE:
- Total: 2 a 4 linhas. Cada linha curta (até 80 caracteres).
- Linha 1: confronto direto com o item específico falhado (cite o nome).
- Linha 2: padrão (se houver dado) OU dor da identidade que ele perdeu agora.
- Linha 3 (opcional): consequência emocional/futura concreta.
- Linha 4 (opcional, fechamento): 1 frase curta marcante.

REGRAS:
- Português do Brasil. Tom Solo Leveling sombrio.
- ZERO clichê motivacional ("você consegue", "amanhã é outro dia").
- ZERO insulto ou xingamento. A dor vem da VERDADE dele, não de ofensa.
- Use os DADOS REAIS (nome, awakening.become, falhas, hábitos). Sem dado = mensagem proibida.
- Não mencione "sistema", "IA", "app", "jogo".
- Segunda pessoa ("você").
- Retorne APENAS o texto. Sem aspas, sem markdown, sem prefixo. Use quebras de linha entre as linhas.${monsterNote}${identityNote}${banned}`;
}

function buildUserPrompt(body: RequestBody, dureza: Dureza): string {
  const { trigger, itemName, context: c } = body;
  const triggerLabel = trigger === 'mission' ? 'MISSÃO' : trigger === 'habit' ? 'HÁBITO' : 'PROTOCOLO DE FALHA EXPIRADO';

  const parts: string[] = [];
  parts.push(`TIPO: ${triggerLabel}`);
  parts.push(`ITEM FALHADO: "${itemName}"`);
  parts.push(`DUREZA: ${dureza}`);

  if (c.awakening?.become) parts.push(`\nQUEM ELE QUER SE TORNAR: ${c.awakening.become}`);
  if (c.awakening?.reject) parts.push(`O QUE ELE QUER REJEITAR: ${c.awakening.reject}`);
  if (c.awakening?.pain) parts.push(`DOR QUE QUER EVITAR: ${c.awakening.pain}`);

  if (c.monster) parts.push(`\nMONSTRO DA PROCRASTINAÇÃO: HP ${c.monster.hp}/100${c.monster.lastReason ? ` (último evento: ${c.monster.lastReason})` : ''}`);

  if (c.rank || c.level) parts.push(`\nRANK ${c.rank || '?'} • Nível ${c.level ?? '?'} • Streak: ${c.streak ?? 0} dias`);
  parts.push(`FALHAS NOS ÚLTIMOS 7 DIAS: ${c.failureFrequency7d ?? 0}`);

  if (c.failedRecent && c.failedRecent.length > 0) {
    parts.push(`\nPADRÃO DE FALHAS:`);
    c.failedRecent.slice(0, 6).forEach(f => {
      const d = new Date(f.date);
      parts.push(`- ${f.type}: "${f.name}" em ${d.toLocaleDateString('pt-BR')}`);
    });
  }

  if (c.habits && c.habits.length > 0) {
    parts.push(`\nHÁBITOS:`);
    c.habits.slice(0, 5).forEach(h => parts.push(`- "${h.name}" • streak ${h.streak} • ${h.failuresLast7d} falhas/7d`));
  }

  if (c.activeMissions && c.activeMissions.length > 0) {
    parts.push(`\nMISSÕES ATIVAS:`);
    c.activeMissions.slice(0, 4).forEach(m => parts.push(`- "${m.name}" (${m.difficulty})`));
  }

  if (c.recentJournal && c.recentJournal.length > 0) {
    parts.push(`\nDIÁRIO RECENTE:`);
    c.recentJournal.slice(0, 3).forEach((j, i) => {
      const trimmed = j.length > 220 ? j.slice(0, 220) + '…' : j;
      parts.push(`[${i + 1}] ${trimmed}`);
    });
  }

  parts.push(`\nGere o popup de 2-4 linhas curtas seguindo TODAS as regras.`);
  return parts.join('\n');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    if (!body || !body.trigger || !body.itemName || !body.context) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const dureza = pickDureza(body.context.failureFrequency7d ?? 0, body.context.aiIntensity ?? 'moderado');
    const systemPrompt = buildSystemPrompt(dureza, body.context.lastConfrontationMessages ?? [], body.context.monster?.hp);
    const userPrompt = buildUserPrompt(body, dureza);

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({
          message: fallbackMessage(body.trigger, body.itemName, dureza),
          dureza,
          error: 'rate_limited',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({
          message: fallbackMessage(body.trigger, body.itemName, dureza),
          dureza,
          error: 'payment_required',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error('AI gateway error:', aiResp.status, t);
      return new Response(
        JSON.stringify({ message: fallbackMessage(body.trigger, body.itemName, dureza), dureza, error: 'ai_error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await aiResp.json();
    const message: string = (data?.choices?.[0]?.message?.content ?? '').trim()
      || fallbackMessage(body.trigger, body.itemName, dureza);

    return new Response(JSON.stringify({ message, dureza }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('failure-confrontation error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
