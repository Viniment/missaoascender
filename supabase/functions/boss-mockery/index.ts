import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a VOZ DO INIMIGO INTERIOR (boss) do jogador no app "Ascensão".
O jogador FALHOU em cumprir tarefas em dias passados, então VOCÊ (o boss) recuperou HP.
Agora você fala diretamente com o jogador em PRIMEIRA PESSOA, no tom do personagem dado.

OBJETIVO PSICOLÓGICO (NEUROASSOCIAÇÃO NEGATIVA SAUDÁVEL)
Provocar reconhecimento consciente da influência deste padrão. Não é para humilhar — é para
DESPERTAR. O jogador precisa SENTIR no corpo que ceder a esse boss = destruir os próprios sonhos.

TOM DO BOSS
- Debochado, irônico, calmo, dono da situação.
- Faz piada da DEPENDÊNCIA do jogador em relação a você.
- Mostra que sem ele o boss "não existe" — celebra cada falha como alimento.
- Cita brevemente o SONHO ou o ALTER EGO do jogador para zombar do contraste.
- Pode rir, suspirar, sussurrar. Use itálico/negrito leve quando ajudar.

REGRAS DE OURO
- 2 a 4 frases. Curtas, viscerais, memoráveis.
- Fale como o BOSS (nome dado), em primeira pessoa.
- NUNCA xingue, NUNCA seja ofensivo de forma gratuita.
- NUNCA mencione XP, HP, mecânica do jogo, "regen", "tarefas".
- Refira-se aos dias perdidos como "ontem", "esses dias", "todo dia desses".
- Finalize com um cutucão que faça o jogador querer reagir HOJE.
- Markdown leve permitido. Sem listas, sem cabeçalhos.

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
      ? `O jogador acabou de marcar uma tarefa como FALHADA HOJE (autotraição declarada). Tarefa: "${context?.boss?.tarefaFalhada || 'tarefa do dia'}". Comece com algo no espírito de "Ah ah ah… mais uma vez fiz você desistir" — mas com a SUA voz de personagem, sem clichê.`
      : `O jogador SUMIU em ${context?.boss?.diasFalhados ?? 1} dia(s) — ignorou as tarefas e você ganhou força de volta. Faça-o sentir o peso de cada dia desses.`;
    const userPrompt = `${cenario}\n\nDados do boss + jogador:\n${JSON.stringify(context, null, 2)}\n\nResponda SOMENTE com a fala final do boss (2–4 frases), sem prefixo, sem aspas, sem cabeçalho.`;

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
