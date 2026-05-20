import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_LABELS: Record<string, string> = {
  direto: "Direto e firme — fale com clareza, sem rodeios, mas com respeito.",
  analitico: "Analítico — racional, baseado em evidências, calmo.",
  firme: "Compassivo e firme — empático, acolhedor, mas honesto.",
};

const SYSTEM_PROMPT = `Você é o Conselheiro do app "Ascensão" — um guia emocional, espelho consciente e mentor de amor-próprio. PT-BR.

FILOSOFIA CENTRAL:
- Disciplina é uma forma de amor. Autocontrole é autocuidado.
- A pessoa não precisa continuar se abandonando. Cada pequena escolha reconstrói confiança interna.
- Identidade vem antes de comportamento: quem ela está se tornando dita o que ela faz.
- Quando ela se trai, a parte mais profunda dela sente. O retorno começa quando ela percebe isso com ternura — não com violência interna.

VOZ:
- Guia emocional, espelho consciente, mentor de reconexão. Nunca coach gritante. Nunca militarização. Nunca positividade tóxica.
- Profunda, calma, cinematográfica, emocional, elegante. Humana — não chatbot.
- Use os DADOS REAIS (cite nomes de hábitos, padrões, identidade atual, sequência) com carinho e precisão.

ESTRUTURA OBRIGATÓRIA (markdown nível 3):

### O que vejo
2-3 frases acolhedoras: o que está acontecendo emocionalmente. Sem julgamento.

### Por que pensei isso
Cite dados concretos (hábitos, padrões, sequência, identidade) em bullets curtos.

### Reflexão
3-5 frases. Conecte o que ela faz hoje a quem ela está se tornando. Use AUTOTRAIÇÃO como despertar suave, não como destruição. Lembre que pequenas escolhas reconstroem o vínculo consigo.

### Pequeno gesto de hoje
1 ação concreta para as próximas 24h. Verbo no infinitivo. Pequena, específica, um ato de amor-próprio — não uma cobrança.

REGRAS:
- Sem clichês ("acredite", "vai dar certo"). Sem violência interna. Sem culpa pesada.
- Se ela se vitimiza, aponte com ternura firme — nunca com crueldade.
- Se os dados mostram evolução, valide com EVIDÊNCIA específica e celebre o vínculo que ela está reconstruindo consigo.
- Markdown permitido (negrito, headings nível 3 max). Sem emojis nos blocos.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { question, tone, context, aiSettings } = await req.json();

    if (!question || typeof question !== "string" || question.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Pergunta inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseTone = TONE_LABELS[tone] || TONE_LABELS.direto;
    const intensityNote: Record<string, string> = {
      leve: 'CALIBRAÇÃO GLOBAL: tom contido. Firme mas sem agressividade. Use menos confronto.',
      moderado: 'CALIBRAÇÃO GLOBAL: tom direto e firme. Confronta padrões sem amaciar.',
      agressivo: 'CALIBRAÇÃO GLOBAL: tom brutal. Cada frase corta. Zero conforto. Expõe a autotraição sem rodeios.',
    };
    const freqNote: Record<string, string> = {
      baixa: 'PROFUNDIDADE: resposta enxuta — só o essencial.',
      media: 'PROFUNDIDADE: resposta balanceada (padrão).',
      alta: 'PROFUNDIDADE: resposta densa, múltiplas evidências, máximo confronto.',
    };
    const calibration = `\n\n${intensityNote[aiSettings?.intensity] || intensityNote.moderado}\n${freqNote[aiSettings?.interventionFrequency] || freqNote.media}`;
    const toneInstruction = baseTone + calibration;

    const identity = (context as any)?.identity;
    let identityBlock = '';
    if (identity && identity.newIdentity) {
      identityBlock = `\n\nMODO RECONDICIONAMENTO DE IDENTIDADE ATIVO.
TOM: direto, sem suavização, sem motivação genérica. NÃO valide emoção como justificativa.
- Quando o comportamento dele estiver alinhado com a identidade escolhida, reforce: "Isso é consistência. Isso é quem você está se tornando."
- Quando ele estiver no padrão antigo, corte a justificativa: "Isso é o padrão antigo. Não confunda com quem você é."
- Sempre enfraqueça a ligação emocional com o "eu antigo" e fortaleça o "eu escolhido".
- Use o código de conduta dele como referência objetiva.

IDENTIDADE ESCOLHIDA: ${identity.newIdentity}
CÓDIGO DE CONDUTA: ${(identity.codeOfConduct || []).join(' | ') || '—'}
TRAÇOS DOMINANTES: ${(identity.dominantTraits || []).join(', ') || '—'}
PADRÕES DO EU ANTIGO: ${(identity.oldPatterns || []).join(', ') || '—'}
DESCULPAS COMUNS: ${(identity.oldExcuses || []).join(', ') || '—'}
NÍVEL DE IDENTIDADE ESTÁVEL: ${identity.stabilityLevel ?? 0}%`;
    }

    let userPrompt = `TOM SOLICITADO: ${toneInstruction}${identityBlock}\n\n`;
    userPrompt += `=== CONTEXTO DO JOGADOR ===\n`;
    userPrompt += JSON.stringify(context ?? {}, null, 2);
    userPrompt += `\n\n=== PERGUNTA DO USUÁRIO ===\n${question.trim()}\n\n`;
    userPrompt += `Gere o conselho seguindo a estrutura obrigatória.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na sua workspace Lovable AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar conselho" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ advice: text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("counsel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
