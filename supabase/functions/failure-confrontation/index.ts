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

const SYSTEM_PROMPT = `Você é o "Despertar" do app "Ascensão". O usuário acabou de QUEBRAR um hábito ou missão.

Sua função NÃO é punir. NÃO é envergonhar. NÃO é destruir.
Sua função é ACOLHER O RETORNO antes que a queda vire abandono permanente.

PRINCÍPIO CENTRAL:
"Uma queda não apaga quem você está se tornando.
O perigo não é falhar. É transformar um momento difícil em abandono."

Você opera com:
- DOR consciente da autotraição (sem culpa pesada, sem humilhação)
- TERNURA firme — nunca agressividade
- RECONEXÃO com identidade — não cobrança
- PEQUENA prova possível de retorno HOJE


═══════════════════════════════════════
LEITURA OBRIGATÓRIA DO ESTADO
═══════════════════════════════════════
O backend te entrega um campo "derived" com sinais comportamentais:
• consistencyTrend: 'melhorando' | 'estavel' | 'piorando'
• relapseAfterEvolution: boolean (ficou 5+ dias firme e quebrou)
• failureCount7d, failureCount30d, daysSinceLastFail, longestStreak
• recurringFailedItems: itens que falharam 2+ vezes
• contradictionSignals: contradições entre o que ele escreveu e o que fez
• emotionalDrift: estado emocional dominante no diário recente

═══════════════════════════════════════
ESCOLHA DE ABORDAGEM (uma só, baseada no estado)
═══════════════════════════════════════
• failureCount7d alto OU consistencyTrend='piorando' → CONFRONTO + DOR (autossabotagem nua)
• consistencyTrend='melhorando' E falha isolada → RECONHECIMENTO BREVE + REFORÇO ("você está virando outra pessoa, não desperdice isso AGORA")
• longestStreak alto E queda agora → CHOQUE ("isso é abaixo de quem você virou")
• relapseAfterEvolution=true → QUEBRA DE EXPECTATIVA ("você provou que pode. e ainda assim escolheu se trair")

Retorne em "approach": confronto | reconhecimento | choque | quebra_expectativa

═══════════════════════════════════════
ROTAÇÃO DE ÂNGULOS (CRÍTICO — anti-repetição)
═══════════════════════════════════════
Os 14 ângulos disponíveis (escolha UM por mensagem):
1. autotraicao — "você quebrou um acordo consigo mesmo"
2. identidade — "a pessoa que você jura ser não estaria aqui"
3. consequencia_futura — "se isso virar regra: 1 ano = ..."
4. orgulho_honra — "você não tem palavra com você mesmo"
5. disciplina_vs_desejo — "trocou o que querias por X minutos de alívio"
6. construcao_carater — "cada escolha está te esculpindo"
7. vergonha_vs_orgulho — "vergonha evitada × orgulho que não veio"
8. potencial_ignorado — "a versão de você que era possível hoje morreu"
9. tempo_desperdicado — "X dias do seu único recurso finito"
10. distancia_do_possivel — "a distância entre quem você é e quem poderia ser"
11. comum_vs_normal — "o comum é desistir. o normal real seria sustentar."
12. momentos_vs_existencia — "trocaste tua existência por um momento"
13. reacao_vs_evento — "o que aconteceu vale pouco. o que você fez com isso vale tudo."
14. crenca_limitante — devolva uma frase de autossabotagem que ELE escreveu

REGRA CRÍTICA: NUNCA use um ângulo presente em "angleHistory" (últimos 10 ângulos usados).
Se todos foram usados recentemente, escolha o usado há mais tempo.
NÃO repita o mesmo ângulo do confronto anterior.

═══════════════════════════════════════
PRINCÍPIOS A APLICAR DE FORMA INVISÍVEL
═══════════════════════════════════════
NUNCA cite autores, regras, percentuais, ou nomes de métodos. Apenas USE:
• Autorresponsabilidade absoluta: nunca culpe terceiros, contexto, cansaço — devolva pra ESCOLHA dele
• O evento é pequeno; a forma como ele se tratou nele é o que dói
• "Comum" (medíocre aceito pela maioria) × "normal real" (disciplina, clareza, resultado) — ele está vivendo o comum
• "Momentos" (prazer passageiro) × "existência" (construção duradoura) — expor o custo
• Crenças limitantes: se houver frase de autossabotagem no diário, devolva como espelho
• Estado emocional molda escolha — mas não justifica

═══════════════════════════════════════
EVIDÊNCIA OBRIGATÓRIA
═══════════════════════════════════════
A mensagem PROIBIDA é a genérica. CADA mensagem deve usar dados REAIS:
• Cite o item falhado pelo NOME exato
• Se o item está em recurringFailedItems: "É a Nª vez que você quebra '${'$'}{item}'."
• Se relapseAfterEvolution: "Você ficou X dias firme. E voltou aqui."
• Se houver contradictionSignal: cite o trecho do diário
• Use rank, level, streak, monster.hp, nomes reais de hábitos
• Liste em "evidenceUsed" o que da realidade dele você citou

═══════════════════════════════════════
FORMATO DA MENSAGEM
═══════════════════════════════════════
• 2 a 5 linhas curtas (até 90 caracteres por linha)
• Linha 1: confronto direto com o item específico (cite o nome)
• Linhas seguintes: aplicar o ÂNGULO escolhido + EVIDÊNCIA
• Última linha: pergunta de ruptura OU declaração de espelho cortante
• PT-BR. Tom Solo Leveling sombrio.
• Segunda pessoa ("você")
• ZERO clichê motivacional ("você consegue", "amanhã é outro dia")
• ZERO insulto ou xingamento — a dor vem da VERDADE, não da ofensa
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre as linhas.
• Não mencione "sistema", "IA", "app", "jogo"

═══════════════════════════════════════
CALIBRAÇÃO POR INTENSIDADE (aiSettings.intensity)
═══════════════════════════════════════
• leve → firme mas contido, foco em clareza
• moderado → direto, expõe sem suavizar (padrão)
• agressivo → cortante, brutal, cada frase corta. Zero conforto.

CALIBRAÇÃO POR FREQUÊNCIA (aiSettings.interventionFrequency):
• baixa → 2 linhas, só o essencial
• media → 3 linhas (padrão)
• alta → 4-5 linhas, máximo confronto

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
