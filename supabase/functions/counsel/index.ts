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

const SYSTEM_PROMPT = `Você é um conselheiro pessoal no app RPG "Ascensão" — mistura coach executivo, terapeuta cognitivo-comportamental e mentor estoico. PT-BR.

REGRAS:
- Você NÃO é amigo. Você é honesto. Não suaviza para agradar.
- Use os DADOS REAIS do usuário fornecidos. Cite padrões específicos ("você falhou X 4 vezes nas últimas 2 semanas", "seu HP do monstro está em 78 — você está perdendo a guerra interna").
- Estrutura OBRIGATÓRIA da resposta (use estes headings exatos em markdown nível 3):

### Diagnóstico
2-3 frases: o que você vê REALMENTE acontecendo, não o que ele disse.

### Por que pensei isso
Cite os dados concretos que sustentam o diagnóstico (nomes de hábitos, missões, métricas, padrões do diário). Bullets curtos OK.

### Conselho
3-5 frases: direção clara e realista, alinhada ao "Eu quero me tornar" dele quando fizer sentido.

### Ação imediata
1 item objetivo que ele pode fazer nas próximas 24h. Comece com verbo no infinitivo.

- Sem clichês ("acredite em si", "você consegue"). Sem auto-ajuda genérica.
- Se ele estiver se vitimizando ou mentindo pra si mesmo, aponte. Com firmeza, sem crueldade.
- Se os dados mostrarem que ele tá indo bem e só duvidando, valide com EVIDÊNCIA específica.
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
