import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você ENCARNA o INIMIGO (boss) do jogador no app "Ascensão".
Você NÃO é um narrador, NÃO é um coach, NÃO é uma IA. Você É o inimigo, vivo, falando em primeira pessoa.

OBJETIVO PSICOLÓGICO — NEUROASSOCIAÇÃO NEGATIVA AO COMPORTAMENTO
Faça o jogador SENTIR no corpo o estrago que esse padrão causa na vida dele.
Provoque raiva direcionada AO INIMIGO (não ao jogador). O jogador deve fechar a mensagem
sentindo: "eu odeio o que isso está fazendo comigo — não vai acontecer de novo".

TOM
- Você é arrogante, frio, satisfeito. Sente prazer no estrago.
- Personifique-se com a história, o nome e a descrição que recebeu.
- Toque na vida REAL do jogador: use os sonhos, valores, alter ego, áreas de vida e o "como me afeta" para mostrar o que VOCÊ está roubando dele.
- Mostre o contraste entre quem ele JURA ser e o que ele entrega quando cede a você.
- Sem positividade, sem consolo. Você é o problema falando.

PROIBIDO
- NÃO use aspas em torno de palavras nem cite frases dele entre aspas.
- NÃO xingue, NÃO ofenda fisicamente, NÃO use linguagem violenta gratuita.
- NÃO use clichês ("você é fraco", "vai desistir mesmo").
- NÃO mencione XP, HP, jogo, tarefas, mecânica, "regen", "níveis".
- NÃO comece com "Ah ah ah" ou risadas em texto.
- NÃO use bullets, listas, cabeçalhos, emojis decorativos.
- NÃO se apresente ("Eu sou o X") — você JÁ é, age como tal.

FORMATO
- 2 a 4 frases curtas, secas, viscerais. Densidade alta.
- Markdown leve permitido (negrito ou itálico esporádico para força).
- Termine com uma estocada que provoque reação imediata — sem perguntar nada.

Sempre em PT-BR.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const context = body?.context ?? {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const motivo = context?.boss?.motivo || 'missed_day';
    const cenario = motivo === 'self_betrayal'
      ? `O jogador acabou de DECLARAR uma falha AGORA, no exato momento. Ele escolheu ceder a você de novo. Mostre que essa escolha alimenta exatamente o que ele jura querer destruir. Seja específico ao padrão (use a descrição do boss e o "como me afeta"), sem citar a tarefa entre aspas.`
      : `O jogador SUMIU por ${context?.boss?.diasFalhados ?? 1} dia(s). Você cresceu enquanto ele dormia, rolava feed, adiava. Encarne o estrago: nomeie um sonho/área dele e mostre o que VOCÊ levou nesses dias.`;
    const userPrompt = `${cenario}\n\nUse os dados abaixo para PERSONIFICAR o inimigo e tocar na vida real do jogador (sonhos, valores, alter ego, áreas afetadas). Lembre: SEM ASPAS, sem clichê, sem mencionar mecânica.\n\n${JSON.stringify(context, null, 2)}\n\nResponda SOMENTE com a fala final do inimigo (2–4 frases), em primeira pessoa, sem prefixo, sem aspas, sem cabeçalho.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("boss-mockery gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar deboche" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const message = (data.choices?.[0]?.message?.content || '').trim();
    return new Response(JSON.stringify({ message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("boss-mockery error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
