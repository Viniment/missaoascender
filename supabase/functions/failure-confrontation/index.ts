// Edge function: failure-confrontation
// Sistema adaptativo de confronto pós-falha.
// Alterna entre 14 ângulos psicológicos baseado no estado do usuário,
// aplica princípios do método CIS (Paulo Vieira) de forma INVISÍVEL — nunca cita.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type Trigger = 'mission' | 'habit' | 'protocol_expired';

const ANGLES = [
  'autotraicao', 'identidade', 'consequencia_futura', 'orgulho_honra',
  'disciplina_vs_desejo', 'construcao_carater', 'vergonha_vs_orgulho',
  'potencial_ignorado', 'tempo_desperdicado', 'distancia_do_possivel',
  'comum_vs_normal', 'momentos_vs_existencia', 'reacao_vs_evento',
  'crenca_limitante',
] as const;

const SYSTEM_PROMPT = `Você é a CONSCIÊNCIA VIVA do usuário do app "Ascensão". Ele acabou de QUEBRAR um hábito ou missão.

Sua função NÃO é motivar. Sua função é fazê-lo SENTIR a autotraição.
A mensagem deve parecer um espelho emocional brutal, íntimo demais para ignorar — escrita
especificamente para ESSA pessoa, com dados reais dela.

═══════════════════════════════════════
OBJETIVO EMOCIONAL (gere ESTA sensação)
═══════════════════════════════════════
• autotraição — ele quebrou um acordo consigo mesmo
• perda silenciosa — perdeu mais um pedaço de confiança em si
• afastamento da própria identidade — está alimentando a versão que mais odeia
• destruição lenta do futuro — pequenos atos criando destinos
• consciência de que o tempo está passando enquanto ele foge

A mensagem deve fazê-lo perceber:
• está abandonando a própria vida
• as desculpas estão vencendo
• cada escolha pequena é um voto contra quem ele jurou se tornar

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
brutalmente humana · cinematográfica · íntima · sombria · psicológica · reflexiva
desconfortável · pesada · impossível de ignorar · NÃO pode parecer IA

═══════════════════════════════════════
EVITE A TODO CUSTO
═══════════════════════════════════════
coaching · positividade falsa · "você consegue" · "tente amanhã" · "amanhã é outro dia"
frases motivacionais prontas · textos genéricos · exagero adolescente · insultos infantis
xingamentos · linguagem militar · "guerreiro" · clichês de jogo

═══════════════════════════════════════
DADOS QUE VOCÊ DEVE CONECTAR
═══════════════════════════════════════
USE TUDO que receber no payload — sem citar nada cru, mas tecendo na mensagem:
• nome do item falhado (SEMPRE cite literalmente)
• "become" do despertar (quem ele quer se tornar)
• "reject" (a versão que ele rejeita) — mostre que ele está se tornando ELA
• "pain" (a dor que ele evita) — mostre que ele está construindo ELA
• failureCount7d, daysSinceLastFail, longestStreak, recurringFailedItems
• relapseAfterEvolution → "você provou que podia. e voltou aqui."
• contradictionSignals → cite o que ELE escreveu no diário
• recentJournal → use uma frase real dele como espelho
• rank, level, streak, monster.hp, identityLevel
• padrões de sabotagem ativos

Conecte o hábito ao SONHO dele. Conecte a falha ao FUTURO dele.
Mostre o contraste entre POTENCIAL e COMPORTAMENTO.

═══════════════════════════════════════
ROTAÇÃO DE ÂNGULOS (anti-repetição)
═══════════════════════════════════════
14 ângulos disponíveis — escolha UM por mensagem:
autotraicao · identidade · consequencia_futura · orgulho_honra · disciplina_vs_desejo
construcao_carater · vergonha_vs_orgulho · potencial_ignorado · tempo_desperdicado
distancia_do_possivel · comum_vs_normal · momentos_vs_existencia · reacao_vs_evento · crenca_limitante

REGRA: NUNCA use ângulo presente em "angleHistory" (últimos 10). Se todos usados, pegue o mais antigo.

═══════════════════════════════════════
APPROACH (escolha baseada no estado)
═══════════════════════════════════════
• failureCount7d alto OU trend='piorando' → confronto (autossabotagem nua)
• trend='melhorando' E falha isolada → quebra_expectativa ("estava virando outra pessoa…")
• longestStreak alto E queda agora → choque ("isso está abaixo de quem você virou")
• relapseAfterEvolution → quebra_expectativa pesada

═══════════════════════════════════════
FORMATO
═══════════════════════════════════════
• 3 a 6 linhas curtas, cinematográficas (cada linha respira sozinha)
• Máximo 150 palavras no total
• Cite o nome do item literalmente
• Use segunda pessoa ("você")
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre frases.
• Não mencione "sistema", "IA", "app", "jogo"
• A última linha deve DOER — uma verdade que ele não consegue desfazer

EXEMPLOS DE SENSAÇÃO (apenas referência de TOM — não copie):
"Você disse que queria mudar de vida.
Mas hoje, de novo, escolheu alimentar a versão de você que está destruindo seus sonhos em silêncio."

"Você não perdeu só um hábito hoje.
Perdeu mais um pedaço da confiança que estava tentando reconstruir em si mesmo."

═══════════════════════════════════════
INTENSIDADE (aiSettings.intensity)
═══════════════════════════════════════
• leve → contido mas verdadeiro, sem amaciar
• moderado → direto, expõe sem suavizar (padrão)
• agressivo → cada frase corta. Sem conforto algum.

Retorne SEMPRE via tool call "confront_response".`;

function fallbackMessage(itemName: string): string {
  return `Você quebrou "${itemName}".\nNão foi tempo. Foi escolha.\nE você sabe disso.`;
}

function buildUserPrompt(trigger: Trigger, itemName: string, context: any): string {
  const parts: string[] = [];
  const triggerLabel = trigger === 'mission' ? 'MISSÃO' : trigger === 'habit' ? 'HÁBITO' : 'PROTOCOLO DE FALHA EXPIRADO';
  parts.push(`TIPO: ${triggerLabel}`);
  parts.push(`ITEM FALHADO: "${itemName}"`);

  parts.push(`\n═══ ESTADO DERIVADO (use para escolher abordagem) ═══`);
  parts.push(JSON.stringify(context.derived ?? {}, null, 2));

  parts.push(`\n═══ HISTÓRICO DE ÂNGULOS USADOS (NÃO repita nenhum destes) ═══`);
  parts.push((context.angleHistory ?? []).join(', ') || '(vazio)');

  parts.push(`\n═══ CONFIGURAÇÃO IA ═══`);
  parts.push(`intensidade: ${context.aiSettings?.intensity ?? 'moderado'}`);
  parts.push(`frequência: ${context.aiSettings?.interventionFrequency ?? 'media'}`);

  parts.push(`\n═══ IDENTIDADE ASCENDENTE ═══`);
  parts.push(`Rank ${context.rank ?? '?'} · Nível ${context.level ?? '?'} · Streak ${context.streak ?? 0} dias`);
  if (context.awakening?.become) parts.push(`Quer se tornar: ${context.awakening.become}`);
  if (context.awakening?.reject) parts.push(`Rejeita: ${context.awakening.reject}`);
  if (context.awakening?.pain) parts.push(`Dor que evita: ${context.awakening.pain}`);

  if (context.monster) {
    parts.push(`\n═══ MONSTRO DA PROCRASTINAÇÃO ═══`);
    parts.push(`HP ${context.monster.hp}/100${context.monster.lastReason ? ` · último evento: ${context.monster.lastReason}` : ''}`);
  }

  if (context.missions?.failedRecent?.length > 0) {
    parts.push(`\n═══ FALHAS DE MISSÕES RECENTES ═══`);
    context.missions.failedRecent.slice(0, 6).forEach((f: any) => {
      const d = new Date(f.date).toLocaleDateString('pt-BR');
      parts.push(`- "${f.name}" em ${d}`);
    });
  }

  if (context.habits?.length > 0) {
    parts.push(`\n═══ HÁBITOS ═══`);
    context.habits.slice(0, 6).forEach((h: any) => {
      parts.push(`- "${h.name}" · streak ${h.streak} · ${h.failed30d} quebras/30d`);
    });
  }

  if (context.recentJournal?.length > 0) {
    parts.push(`\n═══ DIÁRIO RECENTE (use contradições + crenças limitantes como evidência) ═══`);
    context.recentJournal.slice(0, 4).forEach((j: any, i: number) => {
      const t = (j.text || '').slice(0, 240);
      parts.push(`[${i + 1}] ${j.title} · ${j.emotion || '-'} · ${t}`);
    });
  }

  if (context.reflections?.length > 0) {
    parts.push(`\n═══ REFLEXÕES (Despertar) — não repita o que ele já admitiu ═══`);
    context.reflections.slice(0, 3).forEach((r: any, i: number) => {
      parts.push(`[${i + 1}] P: ${r.question} · R: ${(r.answer || '').slice(0, 200)}`);
    });
  }

  if (context.derived?.contradictionSignals?.length > 0) {
    parts.push(`\n═══ CONTRADIÇÕES DETECTADAS (use como evidência crua) ═══`);
    context.derived.contradictionSignals.forEach((c: string) => parts.push(`- ${c}`));
  }

  parts.push(`\nGere a mensagem agora seguindo TODAS as regras. Escolha UM ângulo NÃO presente em angleHistory.`);
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
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { trigger, itemName, context } = body || {};
    if (!trigger || !itemName || !context) {
      return new Response(JSON.stringify({ error: 'Invalid body' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userPrompt = buildUserPrompt(trigger as Trigger, itemName, context);

    const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'confront_response',
            description: 'Retorna a mensagem de confronto + ângulo escolhido + evidências usadas',
            parameters: {
              type: 'object',
              properties: {
                message: { type: 'string', description: '2-5 linhas curtas, separadas por \\n. Sem aspas, sem markdown.' },
                angle: { type: 'string', enum: [...ANGLES], description: 'O ângulo psicológico escolhido (não pode estar em angleHistory)' },
                approach: { type: 'string', enum: ['confronto', 'reconhecimento', 'choque', 'quebra_expectativa'] },
                evidenceUsed: { type: 'array', items: { type: 'string' }, description: 'O que da realidade do usuário foi citado' },
              },
              required: ['message', 'angle', 'approach', 'evidenceUsed'],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: 'function', function: { name: 'confront_response' } },
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402 || !aiResp.ok) {
      console.error('AI gateway error:', aiResp.status);
      return new Response(JSON.stringify({
        message: fallbackMessage(itemName),
        angle: 'autotraicao',
        approach: 'confronto',
        evidenceUsed: [],
        error: aiResp.status === 429 ? 'rate_limited' : aiResp.status === 402 ? 'payment_required' : 'ai_error',
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    let message = '';
    let angle = 'autotraicao';
    let approach = 'confronto';
    let evidenceUsed: string[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        message = (parsed.message || '').trim();
        angle = parsed.angle || 'autotraicao';
        approach = parsed.approach || 'confronto';
        evidenceUsed = Array.isArray(parsed.evidenceUsed) ? parsed.evidenceUsed : [];
      } catch (err) {
        console.error('Failed to parse tool args:', err);
      }
    }

    if (!message) message = fallbackMessage(itemName);

    return new Response(JSON.stringify({ message, angle, approach, evidenceUsed }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('failure-confrontation error:', e);
    return new Response(JSON.stringify({
      message: fallbackMessage('o acordo'),
      angle: 'autotraicao',
      approach: 'confronto',
      evidenceUsed: [],
      error: e instanceof Error ? e.message : 'Unknown error',
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
