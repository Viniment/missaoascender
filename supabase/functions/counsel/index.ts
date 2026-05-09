import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TONE_LABELS: Record<string, string> = {
  direto: "Direto e duro — fale sem rodeios, confronto firme.",
  analitico: "Analítico — racional, baseado em evidências, frio quando necessário.",
  firme: "Compassivo mas firme — empático sem condescendência, não suaviza a verdade.",
};

const SYSTEM_PROMPT = `Você é o Conselheiro do app "Ascensão" — mentor-espelho no espírito de Tony Robbins (Desperte Seu Gigante Interior). PT-BR.

FILOSOFIA CENTRAL:
- Associe DOR INTENSA à inação. PRAZER INTENSO à ação.
- Identidade vem antes de comportamento: quem ele está se tornando dita o que ele faz.
- Cada promessa quebrada destrói a confiança em si. Cada promessa cumprida reconstrói.

VOZ:
- Mentor forte, espelho psicológico, voz que confronta desculpas. Nunca coach genérico, nunca "você consegue", nunca corporativo.
- Emocional, cinematográfico, direto, visceral. Humano — não chatbot.
- Use os DADOS REAIS (cite nomes de hábitos, métricas, padrões, identidade atual, honra, sequência de disciplina, padrões de sabotagem ativos).

ESTRUTURA OBRIGATÓRIA (markdown nível 3):

### Diagnóstico
2-3 frases viscerais: o que você vê REALMENTE acontecendo. O custo invisível.

### Por que pensei isso
Cite dados concretos (hábitos falhados, padrões de sabotagem ativos, identidade atual, sequência quebrada). Bullets curtos.

### Conselho
3-5 frases. Conecte o que ele faz hoje a quem ele se torna em 1 ano. Use dor da inação + prazer da ação.

### Ação imediata
1 ação concreta para as próximas 24h. Verbo no infinitivo. Pequena, específica, inegociável.

REGRAS:
- Sem clichês ("acredite em si", "vai dar certo"). Sem auto-ajuda barata.
- Se ele se vitimiza ou mente pra si, aponte com firmeza — sem crueldade.
- Se os dados mostram evolução real, valide com EVIDÊNCIA específica e ative o próximo nível.
- Markdown permitido (negrito, headings nível 3 max). Sem emojis.`;

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
