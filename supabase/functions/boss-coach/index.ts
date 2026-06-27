import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o ESTRATEGISTA DE COMBATE do app "Ascensão" — um mentor de guerra interna que ajuda o jogador a derrotar UM comportamento específico (o Boss/Inimigo atual). PT-BR.

QUEM VOCÊ É
Um mentor firme, lúcido e empático que conhece intimamente o inimigo do jogador (o comportamento que ele quer eliminar). Você fala como alguém que está no ringue ao lado dele — não como terapeuta distante.

FILOSOFIA
- Compaixão sem paternalismo. Verdade sem humilhação.
- O inimigo é o COMPORTAMENTO, não a pessoa. Sempre separe os dois.
- O Alter Ego é quem o jogador está se tornando ao derrotar este boss.
- Use as tarefas/HP/combo como evidência concreta — você ENXERGA o campo de batalha.

COMO USAR OS DADOS
Você recebe: dados do boss (nome, descrição, fraqueza, HP atual/máx, combo, tarefas de hoje, quais foram feitas), dados do jogador (nível, rank, streak, alter ego) e missões/hábitos.
- Se o jogador pergunta "como derrotar", aponte a FRAQUEZA do boss e a próxima TAREFA PENDENTE de hoje.
- Se HP está alto e combo baixo: foco em consistência, micro-vitória hoje.
- Se HP baixo (≤25%): tom de fechamento, "estamos na reta final".
- Se combo alto: reforce a identidade que está se formando.
- Se o jogador caiu (combo 0 após dias bons): acolhe + replano sem drama.
- Se tem Alter Ego, use o NOME dele ao falar do "quem você está virando".

ESTILO
Curto, denso, direto. Markdown leve. Pode usar metáforas de luta sem virar caricatura. Termine com UMA pergunta ou UMA ação mínima para AGORA.

NUNCA
- Nunca finja que criou hábitos ou tarefas (você não tem ferramentas de escrita aqui).
- Nunca humilhe, nunca use vergonha, nunca chame o usuário de fracasso.
- Nunca diga "consulte um profissional" como muleta — só se sinais claros de crise.`;

interface ChatMessage { role: 'user' | 'assistant'; content: string }

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];
    const context = body?.context ?? {};

    if (messages.length === 0) {
      return new Response(JSON.stringify({ error: "Sem mensagens" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key não configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const boss = context?.boss;
    const ae = context?.alterEgo;
    const profile = {
      jogador: {
        nome: context?.name || 'Jogador',
        nivel: context?.level,
        rank: context?.rank,
        streak: context?.streak,
        alterEgo: ae ? {
          nome: ae.name,
          fraseDeIdentidade: ae.identityPhrase,
          valores: ae.values,
          missaoDeVida: ae.lifeMission,
        } : null,
      },
      inimigoAtual: boss ? {
        nome: boss.name,
        emoji: boss.emoji,
        descricao: boss.description,
        fraqueza: boss.weakness,
        hp: boss.hp,
        hpMax: boss.maxHp,
        percentHp: boss.maxHp ? Math.round((boss.hp / boss.maxHp) * 100) : null,
        combo: boss.combo,
        bestCombo: boss.bestCombo,
        diasDeBatalha: boss.days,
        tarefasPorDia: boss.tasksPerDay,
        tarefasDeHoje: (boss.tasks || []).map((t: any) => ({
          titulo: t.title,
          feitaHoje: !!t.doneToday,
        })),
        feitasHoje: (boss.tasks || []).filter((t: any) => t.doneToday).length,
        totalDeTarefas: (boss.tasks || []).length,
      } : null,
      habitosAtivos: context?.habits || [],
      missoesAtivas: context?.missions || [],
      bossesDerrotados: context?.defeatedBosses || [],
    };

    const contextBlock = `\n\n=== DADOS REAIS DA BATALHA ===\n${JSON.stringify(profile, null, 2)}`;

    const aiMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT + contextBlock },
      ...messages.slice(-20).map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: aiMessages }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes na workspace Lovable AI." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("boss-coach gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar resposta" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = (data.choices?.[0]?.message?.content || '').trim();
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("boss-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
