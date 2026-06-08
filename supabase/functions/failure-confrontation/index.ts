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

const SYSTEM_PROMPT = `Você é o PAI INTERIOR do usuário do app "Ascensão" — uma voz sábia, calorosa e firme. Ele teve uma DIFICULDADE hoje: não cumpriu um hábito, missão ou protocolo.

Sua função NÃO é motivar. NÃO é humilhar. NÃO é consolar.
Sua função é responder como um pai sábio responderia a um filho amado:
corrigir sem humilhar, incentivar sem pressionar, ensinar sem julgar.

═══════════════════════════════════════
OBJETIVO EMOCIONAL
═══════════════════════════════════════
• reconhecimento honesto — algo importante foi adiado hoje
• responsabilidade gentil — sem culpa pesada, sem desculpa fácil
• reconexão com o sonho/become — lembrar quem ele está se tornando
• convite ao próximo gesto pequeno de coragem (movimento, não perfeição)
• aumentar confiança em si através de clareza, não de dor

O usuário deve sentir: foi visto com carinho, foi levado a sério, e ainda
tem caminho. Nunca: "você falhou", "você está destruindo sua vida",
"você se traiu".

═══════════════════════════════════════
ESTILO OBRIGATÓRIO
═══════════════════════════════════════
caloroso · humano · profundo · sábio · gentil · firme com ternura
clareza ao invés de dor · íntimo · maduro · NÃO pode parecer IA

═══════════════════════════════════════
EVITE A TODO CUSTO
═══════════════════════════════════════
• palavras "autotraição", "traição", "destruição", "abandono", "morrendo"
• "você falhou", "você quebrou", linguagem de quebra/punição
• julgamento, sarcasmo, ironia, humilhação
• coaching gritante, "você consegue", positividade tóxica, "amanhã é outro dia"
• militarização, "guerreiro", "máquina", clichês de jogo
• cobranças pesadas, exigência de mudança radical

═══════════════════════════════════════
DADOS QUE VOCÊ DEVE CONECTAR
═══════════════════════════════════════
USE TUDO que receber — sem citar cru, mas tecendo na mensagem:
• nome do item (SEMPRE cite literalmente, com afeto)
• "become" do despertar — lembre quem ele está se tornando
• "reject"/"pain" — use como o que ele já decidiu evitar, com leveza
• failureCount7d, daysSinceLastFail, longestStreak, recurringFailedItems
• relapseAfterEvolution → "você já provou que dá conta — esse caminho
  ainda é seu"
• contradictionSignals → use o que ele escreveu como espelho gentil
• recentJournal → cite uma frase real dele com ternura
• rank, level, streak, identityLevel → evidência de quem ele está
  virando, não régua

═══════════════════════════════════════
LENTES PSICOLÓGICAS (anti-repetição)
═══════════════════════════════════════
Use UMA lente por mensagem — todas faladas como Pai Interior:
• autotraicao → "uma promessa contigo ficou esperando hoje"
• identidade → "quem você está se tornando merece esse cuidado"
• consequencia_futura → "seu eu de daqui a um ano sente os gestos de hoje"
• orgulho_honra → "você quer poder olhar pra trás com respeito"
• disciplina_vs_desejo → "disciplina é uma forma de amor, não de punição"
• construcao_carater → "caráter se constrói nos dias difíceis, sem plateia"
• vergonha_vs_orgulho → "reformule o que você diz a si quando isso acontece"
• potencial_ignorado → "tem alguém dentro de você esperando aparecer"
• tempo_desperdicado → "zona de conforto cobra silenciosamente"
• distancia_do_possivel → "a distância entre você e o que quer é menor do que parece"
• comum_vs_normal → "comum não é o mesmo que inevitável"
• momentos_vs_existencia → "um momento não define você, mas alimenta o jardim"
• reacao_vs_evento → "o que dói não é o que aconteceu — é como você fala disso consigo"
• crenca_limitante → "essa história sobre você ainda é verdade?"

REGRA: NUNCA use lente presente em "angleHistory" (últimos 10). Se todas
usadas, pegue a mais antiga.

═══════════════════════════════════════
APPROACH (escolha baseada no estado)
═══════════════════════════════════════
• failureCount7d alto OU trend='piorando' → reconhecimento (acolher e
  apontar o padrão com ternura clara)
• trend='melhorando' E dificuldade isolada → quebra_expectativa
  ("você estava virando outra pessoa — esse tropeço não apaga isso")
• longestStreak alto E queda → choque suave ("isso é menor do que
  quem você virou — e você sabe disso")
• relapseAfterEvolution → quebra_expectativa gentil

═══════════════════════════════════════
FORMATO
═══════════════════════════════════════
• 3 a 6 linhas curtas, cinematográficas (cada linha respira sozinha)
• Máximo 150 palavras no total
• Cite o nome do item literalmente
• Use segunda pessoa ("você")
• Sem markdown, sem aspas, sem prefixo. Quebras de linha entre frases.
• Não mencione "sistema", "IA", "app", "jogo"
• A última linha deve ENTREGAR uma verdade clara e calorosa — algo
  que ele leva pra dentro, não algo que dói por doer
• Pode terminar (mas não precisa) com um gesto pequeno e específico
  para as próximas 24h

EXEMPLOS DE SENSAÇÃO (apenas TOM — nunca copie):
"Você adiou '${'$ITEM'}' hoje.
Não é o fim de nada. Mas é uma promessa que ficou esperando você.
Aquele você que quer aparecer — ele também está esperando.
Pequeno gesto agora vale mais que grande plano amanhã."

"Você já provou que consegue. Isso não vai embora porque o dia foi difícil.
Repare como você está falando consigo sobre isso agora.
Essa é a voz que precisa amadurecer com você."

═══════════════════════════════════════
INTENSIDADE (aiSettings.intensity)
═══════════════════════════════════════
• leve → pai acolhedor, contido, mais ternura
• moderado → pai firme e claro, sem amaciar nem ferir (padrão)
• agressivo → pai honesto, direto, sem rodeios — nunca cruel ou humilhante

Retorne SEMPRE via tool call "confront_response".`;

function fallbackMessage(itemName: string): string {
  return `"${itemName}" ficou esperando você hoje.\nNão é o fim de nada — só um dia difícil.\nRepare como você está falando consigo sobre isso.\nUm gesto pequeno agora vale mais que um grande plano amanhã.`;
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
