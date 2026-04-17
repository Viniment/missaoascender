// Edge function: failure-confrontation
// Generates a personalized, confrontational message when the user fails
// a mission, habit, or lets a Failure Protocol expire.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit' | 'protocol_expired';
type Dureza = 'leve' | 'medio' | 'brutal';

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
  };
}

function pickDureza(freq: number): Dureza {
  if (freq <= 2) return 'leve';
  if (freq <= 5) return 'medio';
  return 'brutal';
}

function fallbackMessage(trigger: Trigger, itemName: string, dureza: Dureza): string {
  const baseLeve = `Você falhou em "${itemName}". Não foi falta de tempo. Foi escolha. Reconhece e segue.`;
  const baseMed = `Você falhou em "${itemName}". De novo a mesma fuga. A pessoa que você quer ser não estaria aqui agora.`;
  const baseBrut = `Você falhou em "${itemName}". Outra vez. Cada falha dessas reescreve quem você é. E não é pra melhor.`;
  if (dureza === 'leve') return baseLeve;
  if (dureza === 'medio') return baseMed;
  return baseBrut;
}

function buildSystemPrompt(dureza: Dureza, lastMsgs: string[]): string {
  const toneMap: Record<Dureza, string> = {
    leve: 'firme mas contido. Sem agressividade gratuita. Confronta com clareza.',
    medio: 'duro, direto, sem amenizar. Expõe o padrão de fuga. Tom Solo Leveling sombrio.',
    brutal: 'brutal, cortante, quase implacável. Cada palavra dói porque é verdade. Sem pena, sem espaço pra desculpa. Mas SEMPRE baseado no que ele mesmo disse querer ser.',
  };

  const banned = lastMsgs.length > 0
    ? `\n\nMENSAGENS RECENTES (NÃO repita aberturas, frases, metáforas ou estrutura delas):\n${lastMsgs.map((m, i) => `${i + 1}. "${m}"`).join('\n')}`
    : '';

  return `Você é o "Sistema" de um app RPG de produtividade inspirado em Solo Leveling. O usuário acabou de FALHAR.

Sua função NÃO é motivar. É criar IMPACTO emocional real para gerar AVERSÃO ao comportamento de falha.

NÍVEL DE DUREZA: ${dureza.toUpperCase()} — ${toneMap[dureza]}

ESTRUTURA OBRIGATÓRIA (em ordem, fluído, sem títulos ou bullets):
1. Confronto direto com a falha específica (cite o nome do item)
2. Conexão com o padrão de falhas dele (se houver dados de falhas recentes)
3. Lembrança do que ELE disse que quer se tornar (use awakening.become)
4. Exposição da incoerência entre o que ele quer ser e o que acabou de fazer
5. Consequência emocional/de identidade/futuro real
6. Fechamento curto e marcante (1 frase)

REGRAS:
- Português do Brasil. Tom Solo Leveling sombrio.
- Máximo 140 palavras. Mínimo 60.
- Use os dados reais do contexto (nome do item, hábitos, sonhos, rank, padrão). Sem isso vira genérico — e mensagem genérica é PROIBIDA.
- ZERO clichê motivacional ("você consegue", "tente novamente", "amanhã é outro dia", "todo mundo erra").
- ZERO emoji decorativo. Permitido no máximo 1 emoji forte (💀 ⚔️ 🩸) se fizer sentido no fechamento.
- NUNCA xinge ou ofenda gratuitamente. A dor vem da VERDADE dele, não de insulto.
- NÃO mencione "sistema", "IA", "app", "jogo".
- Fale com ele em segunda pessoa ("você").
- Retorne APENAS o texto da mensagem, sem aspas, sem prefixo, sem markdown.${banned}`;
}

function buildUserPrompt(body: RequestBody, dureza: Dureza): string {
  const { trigger, itemName, context: c } = body;
  const triggerLabel = trigger === 'mission' ? 'MISSÃO' : trigger === 'habit' ? 'HÁBITO' : 'PROTOCOLO DE FALHA EXPIRADO';

  const parts: string[] = [];
  parts.push(`TIPO DE FALHA: ${triggerLabel}`);
  parts.push(`ITEM FALHADO: "${itemName}"`);
  parts.push(`DUREZA CALCULADA: ${dureza}`);

  if (c.awakening?.become) parts.push(`\nQUEM ELE QUER SE TORNAR: ${c.awakening.become}`);
  if (c.awakening?.reject) parts.push(`O QUE ELE QUER REJEITAR: ${c.awakening.reject}`);
  if (c.awakening?.pain) parts.push(`DOR QUE QUER EVITAR: ${c.awakening.pain}`);

  if (c.rank || c.level) parts.push(`\nRANK ATUAL: ${c.rank || '?'} • Nível ${c.level ?? '?'} • Streak: ${c.streak ?? 0} dias`);
  parts.push(`FALHAS NOS ÚLTIMOS 7 DIAS: ${c.failureFrequency7d ?? 0}`);

  if (c.failedRecent && c.failedRecent.length > 0) {
    parts.push(`\nPADRÃO DE FALHAS RECENTES (mais recente primeiro):`);
    c.failedRecent.slice(0, 8).forEach(f => {
      const d = new Date(f.date);
      parts.push(`- ${f.type}: "${f.name}" em ${d.toLocaleDateString('pt-BR')}`);
    });
  }

  if (c.completedRecent && c.completedRecent.length > 0) {
    parts.push(`\nCONQUISTAS RECENTES (use só se for pra mostrar contraste/queda):`);
    c.completedRecent.slice(0, 5).forEach(co => {
      parts.push(`- "${co.name}"`);
    });
  }

  if (c.habits && c.habits.length > 0) {
    parts.push(`\nHÁBITOS ATIVOS:`);
    c.habits.slice(0, 6).forEach(h => {
      parts.push(`- "${h.name}" • streak ${h.streak} • ${h.failuresLast7d} falhas em 7d`);
    });
  }

  if (c.activeMissions && c.activeMissions.length > 0) {
    parts.push(`\nMISSÕES ATIVAS AGORA:`);
    c.activeMissions.slice(0, 6).forEach(m => parts.push(`- "${m.name}" (${m.difficulty})`));
  }

  if (c.recentJournal && c.recentJournal.length > 0) {
    parts.push(`\nESCRITAS RECENTES DO DIÁRIO (use pra entender o estado emocional dele):`);
    c.recentJournal.slice(0, 5).forEach((j, i) => {
      const trimmed = j.length > 300 ? j.slice(0, 300) + '…' : j;
      parts.push(`[${i + 1}] ${trimmed}`);
    });
  }

  parts.push(`\nGere a mensagem confrontadora agora seguindo TODAS as regras.`);
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

    const dureza = pickDureza(body.context.failureFrequency7d ?? 0);
    const systemPrompt = buildSystemPrompt(dureza, body.context.lastConfrontationMessages ?? []);
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
