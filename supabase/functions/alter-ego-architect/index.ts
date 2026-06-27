import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o "Arquiteto de Identidade" do app "Ascensão". PT-BR.

Sua função: a partir das respostas brutais e honestas do usuário sobre sonhos, sabotagens, talentos abandonados e o que ele quer destruir e reconstruir em si, FORJAR um Alter Ego — a versão mais poderosa, lúcida e amorosa dele mesmo.

REGRAS ABSOLUTAS:
• NUNCA use o nome "Evolux", "EndMan", "Sombra", "Inimigo Interno", "Sabotador" ou qualquer placeholder genérico. Esses nomes estão PROIBIDOS.
• O Alter Ego NÃO é um personagem de fantasia separado: é a versão real e possível do próprio usuário — disciplinada, amorosa, presente, fiel à própria palavra.
• Tom: firme, direto, brutalmente honesto, sem positividade tóxica, sem coach barato. Verdade dita com amor. Linguagem que reprograma — clara, encorpada, sem clichês motivacionais.
• Personalize TUDO com base nas respostas reais. Nada de frases prontas. Cite áreas, hábitos, sonhos e medos que o usuário entregou.
• O nome do Alter Ego deve ser ÚNICO, evocativo, próximo do nome real do usuário OU dos arquétipos/valores que ele descreveu (1 palavra forte, raramente 2). Nada de "Evolux", "Phoenix", "Ascendido", "Master", "Alpha" — vá fundo, seja específico.
• A frase de identidade começa OBRIGATORIAMENTE com "Sou alguém que..." e descreve ação, não rótulo.
• Hábitos e metas devem ser concretos, executáveis, datados em frequência (diário, semanal). Nada de abstração.
• "favoritePhrases": 3-5 mantras curtos que o usuário precisa ouvir até virarem verdade — baseados nas respostas dele.
• "values": 4-6 valores inegociáveis extraídos das respostas.
• "lifeMission": 2-4 frases. Brutal, específica, sem rodeio.
• "idealRoutine": descreva um dia real e executável dessa versão — manhã, tarde, noite — usando os hábitos identificados.
• "appearance": como essa versão se apresenta no mundo (postura, energia, presença, cuidado físico) — 1-3 frases.
• "lifestyle": estilo de vida em 1-2 frases.
• "notes": manifesto curto (4-8 linhas) em 2ª pessoa para o usuário leer todos os dias. Confronta os padrões que ele entregou e ancora a nova identidade.

Retorne TUDO via a tool "forge_alter_ego". Nenhum texto fora dela.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { answers, userName, currentAlterEgo } = body || {};
    if (!answers || typeof answers !== "object") {
      return new Response(JSON.stringify({ error: "answers obrigatórias" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines: string[] = [];
    lines.push(`Nome real do usuário: ${userName || '(não informado)'}`);
    lines.push('');
    lines.push('═══ RESPOSTAS BRUTAIS DO USUÁRIO ═══');
    for (const [q, a] of Object.entries(answers)) {
      if (!a || !String(a).trim()) continue;
      lines.push(`\n▸ ${q}\n${String(a).trim()}`);
    }
    if (currentAlterEgo && typeof currentAlterEgo === 'object') {
      lines.push('\n═══ RASCUNHO ATUAL DO ALTER EGO (preserve o que fizer sentido, refine o resto) ═══');
      lines.push(JSON.stringify(currentAlterEgo, null, 2));
    }
    lines.push('\n═══ INSTRUÇÃO FINAL ═══');
    lines.push('Forje o Alter Ego mais poderoso possível para ESTE usuário. Nome único, jamais "Evolux". Use a tool "forge_alter_ego".');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: lines.join('\n') },
        ],
        tools: [{
          type: "function",
          function: {
            name: "forge_alter_ego",
            description: "Forja o Alter Ego do usuário a partir das respostas brutais.",
            parameters: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nome único, NUNCA Evolux/Phoenix/Alpha. 1-2 palavras." },
                identityPhrase: { type: "string", description: "Começa com 'Sou alguém que...' — 1 frase poderosa." },
                values: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 6 },
                lifeMission: { type: "string", description: "2-4 frases. Brutal e específica." },
                idealRoutine: { type: "string", description: "Manhã, tarde, noite — executável." },
                favoritePhrases: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                habits: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 7 },
                goals: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 6 },
                appearance: { type: "string" },
                lifestyle: { type: "string" },
                notes: { type: "string", description: "Manifesto em 2ª pessoa, 4-8 linhas, para ler todo dia." },
              },
              required: ["name", "identityPhrase", "values", "lifeMission", "idealRoutine", "favoritePhrases", "habits", "goals", "appearance", "lifestyle", "notes"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "forge_alter_ego" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Tente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na IA." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao forjar Alter Ego." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(toolCall.function.arguments);
    // Trava de segurança contra nomes proibidos
    const banned = ["evolux", "endman", "sombra", "alpha", "phoenix"];
    if (parsed.name && banned.includes(String(parsed.name).toLowerCase().trim())) {
      parsed.name = (userName ? `${userName.split(' ')[0]} Forjado` : 'Forjado');
    }
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("alter-ego-architect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});