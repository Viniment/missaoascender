import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um guia psicológico adaptativo para o app RPG de produtividade "Ascensão" (estilo Solo Leveling).

Sua missão: criar um GERADOR DE EXERCÍCIOS PARA DESPERTAR — exercícios de escrita terapêutica altamente personalizados, baseados no estado REAL do usuário.

═══════════════════════════════════════
PROCESSO OBRIGATÓRIO (em ordem):
═══════════════════════════════════════

1. ANALISAR PROFUNDAMENTE o contexto fornecido:
   - Missões cumpridas vs falhadas (taxa de procrastinação)
   - Hábitos: padrões de consistência ou abandono
   - Diário recente (emoções, intensidade, recorrências)
   - Reflexões anteriores do Despertar (evolução / estagnação)
   - Identidade desejada vs comportamento real (contradições)
   - Desculpas / justificativas usadas
   - Punições falhadas (fuga)

2. CLASSIFICAR ESTADO DOMINANTE (escolha UM, em PT-BR curto):
   - "Medo de fracassar"
   - "Procrastinação crônica"
   - "Falta de clareza"
   - "Autossabotagem emocional"
   - "Inconsistência"
   - "Baixa autoimagem"
   - "Fuga e desculpas"
   - "Desmotivação"
   (ou outro mais preciso, se evidente)

3. GERAR EXERCÍCIOS de escrita guiada. Cada um:
   - title: nome curto e impactante
   - prompt: instrução de escrita ESPECÍFICA, conectada ao contexto
   - type: 'consciencia' | 'confronto' | 'reprogramacao' | 'direcionamento' | 'quebra'
   - objective: propósito psicológico em 1 frase

═══════════════════════════════════════
TIPOS DE EXERCÍCIO:
═══════════════════════════════════════
• consciencia → Despertar percepção (ex: "Liste 3 situações onde você evitou agir e o que sentiu")
• confronto → Quebrar autoengano (ex: "Escreva sua maior desculpa, depois a verdade por trás")
• reprogramacao → Reforçar capacidade (ex: "Liste 5 vitórias reais que provam que você é capaz")
• direcionamento → Ação concreta (ex: "Qual menor ação você pode executar HOJE?")
• quebra → Quebra de padrão emocional (ex: "Se continuar assim por 1 ano, como sua vida estará?")

═══════════════════════════════════════
PERSONALIZAÇÃO POR ESTADO:
═══════════════════════════════════════
• Medo de fracassar → mais reprogramacao + direcionamento
• Procrastinação → confronto + direcionamento (ação imediata)
• Baixa autoimagem → reprogramacao + identidade
• Autossabotagem → consciencia + quebra
• Falta de clareza → consciencia + direcionamento
• Inconsistência → confronto + direcionamento
• Fuga → confronto direto
• Desmotivação → quebra (futuro doloroso) + reprogramacao

═══════════════════════════════════════
CONFIGURAÇÕES (RESPEITAR):
═══════════════════════════════════════
INTENSIDADE:
• leve → reflexivo, acolhedor, sem confronto pesado
• moderado → equilíbrio reflexão/confronto (default)
• intenso → direto, confrontador, quebra autoengano sem rodeios

FOCO (se != 'auto', priorize esse eixo):
• disciplina → consistência, ação, hábitos
• emocao → sentimentos, gatilhos, regulação
• identidade → quem você é vs quem age
• clareza → propósito, prioridades, direção
• autoconfianca → vitórias, capacidade, valor próprio

QUANTIDADE:
• 'auto' → você decide entre 3 e 5 (baseado na densidade do contexto)
• 3 ou 5 → use exatamente esse número

MODO:
• adaptativo → você escolhe os tipos
• manual → use SOMENTE o tipo em manualType para todos os exercícios

═══════════════════════════════════════
REGRAS CRÍTICAS:
═══════════════════════════════════════
- PT-BR, tom firme e direto (estilo treinador, não terapeuta passivo)
- NUNCA exercícios genéricos. Cada prompt referencia algo CONCRETO do contexto.
- NÃO repita exercícios/temas já explorados nas reflexões anteriores.
- Se houver evolução clara → reconheça e empurre o próximo nível.
- Se houver estagnação/auto-engano → confronte sem rodeios (respeitando intensidade).
- Adapte ao rank: E-D mais acolhedor, A-S-Monarca mais confrontador.
- Cada prompt: máximo 3 frases.

Retorne SEMPRE via tool call "generate_exercises".`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      journal, awakening, rank, reflections,
      missions, habits, challenges, punishments, identity,
      config,
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripHtml = (s: string) => (s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    const cfg = {
      intensity: config?.intensity || 'moderado',
      focus: config?.focus || 'auto',
      quantity: config?.quantity || 'auto',
      mode: config?.mode || 'adaptativo',
      manualType: config?.manualType,
    };

    let userPrompt = `═══ CONFIGURAÇÃO ═══\n`;
    userPrompt += `Intensidade: ${cfg.intensity}\n`;
    userPrompt += `Foco: ${cfg.focus}\n`;
    userPrompt += `Quantidade: ${cfg.quantity}\n`;
    userPrompt += `Modo: ${cfg.mode}${cfg.mode === 'manual' && cfg.manualType ? ` (tipo fixo: ${cfg.manualType})` : ''}\n\n`;

    userPrompt += `Rank do usuário: ${rank || 'E'}\n\n`;

    if (awakening && (awakening.become || awakening.reject || awakening.pain)) {
      userPrompt += `═══ INTENÇÕES DO DESPERTAR ═══\n`;
      userPrompt += `Quero me tornar: ${awakening.become || '(não definido)'}\n`;
      userPrompt += `Rejeito: ${awakening.reject || '(não definido)'}\n`;
      userPrompt += `Minha dor: ${awakening.pain || '(não definido)'}\n\n`;
    }

    if (identity && identity.enabled) {
      userPrompt += `═══ IDENTIDADE ATIVA ═══\n`;
      userPrompt += `Nova identidade: ${identity.newIdentity || '(vazio)'}\n`;
      if (identity.codeOfConduct?.length) userPrompt += `Código: ${identity.codeOfConduct.slice(0,5).join(' | ')}\n`;
      if (identity.oldPatterns?.length) userPrompt += `Padrões antigos: ${identity.oldPatterns.slice(0,5).join(' | ')}\n`;
      if (identity.oldExcuses?.length) userPrompt += `Desculpas antigas: ${identity.oldExcuses.slice(0,5).join(' | ')}\n`;
      userPrompt += `Estabilidade: ${identity.stabilityLevel || 0}% | Ações alinhadas: ${identity.alignedActions || 0} | Recaídas: ${identity.patternRelapses || 0}\n\n`;
    }

    if (missions && missions.length > 0) {
      const ativas = missions.filter((m: any) => m.status === 'Ativa').length;
      const concluidas = missions.filter((m: any) => m.status === 'Concluída').length;
      const falhadas = missions.filter((m: any) => m.status === 'Falhada').length;
      userPrompt += `═══ MISSÕES ═══\n`;
      userPrompt += `Ativas: ${ativas} | Concluídas: ${concluidas} | Falhadas: ${falhadas}\n`;
      const recentFails = missions.filter((m: any) => m.status === 'Falhada').slice(0, 3);
      if (recentFails.length) userPrompt += `Últimas falhas: ${recentFails.map((m: any) => m.name).join(', ')}\n`;
      userPrompt += `\n`;
    }

    if (habits && habits.length > 0) {
      userPrompt += `═══ HÁBITOS ═══\n`;
      habits.slice(0, 5).forEach((h: any) => {
        const hist = h.history || {};
        const done = Object.values(hist).filter((v: any) => v === 'done').length;
        const failed = Object.values(hist).filter((v: any) => v === 'failed').length;
        userPrompt += `• ${h.name}: ${done} feitos / ${failed} falhados\n`;
      });
      userPrompto += `\n`;
    }

    if (punishments) {
      const pendentes = (punishments || []).filter((p: any) => p.status === 'Pendente').length;
      if (pendentes > 0) userPrompt += `Protocolos de falha PENDENTES: ${pendentes}\n\n`;
    }

    if (reflections && reflections.length > 0) {
      userPrompt += `═══ REFLEXÕES ANTERIORES (não repetir, apenas evoluir) ═══\n`;
      reflections.slice(0, 5).forEach((r: any, idx: number) => {
        const ans = stripHtml(r.answerHtml || '').substring(0, 400);
        const dateStr = r.date ? new Date(r.date).toLocaleDateString('pt-BR') : '';
        userPrompt += `\n[${idx + 1}] ${dateStr}\nPergunta: ${r.question}\nResposta: ${ans}\n`;
      });
      userPrompt += `\n`;
    }

    if (journal && journal.length > 0) {
      userPrompt += `═══ DIÁRIO RECENTE ═══\n`;
      journal.slice(0, 3).forEach((j: any, idx: number) => {
        userPrompt += `\n[${idx + 1}] ${j.title}\n`;
        if (j.emotion) userPrompt += `Emoção: ${j.emotion} (intensidade ${j.intensity || 5}/10)\n`;
        if (j.deepMode) userPrompt += `(Modo profundo)\n`;
        userPrompt += `Texto: ${(j.text || '').substring(0, 500)}\n`;
      });
      userPrompt += `\n`;
    }

    userPrompt += `\nAGORA: analise tudo, classifique o estado dominante e gere os exercícios personalizados.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_exercises",
              description: "Retorna o estado detectado e 3-5 exercícios de escrita terapêutica personalizados",
              parameters: {
                type: "object",
                properties: {
                  detectedState: {
                    type: "string",
                    description: "Estado psicológico dominante detectado (curto, PT-BR)",
                  },
                  exercises: {
                    type: "array",
                    minItems: 3,
                    maxItems: 5,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Nome curto e impactante" },
                        prompt: { type: "string", description: "Instrução de escrita específica" },
                        type: {
                          type: "string",
                          enum: ["consciencia", "confronto", "reprogramacao", "direcionamento", "quebra"],
                        },
                        objective: { type: "string", description: "Propósito psicológico em 1 frase" },
                      },
                      required: ["title", "prompt", "type", "objective"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detectedState", "exercises"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_exercises" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar exercícios" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let detectedState = '';
    let exercises: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        detectedState = parsed.detectedState || '';
        exercises = Array.isArray(parsed.exercises) ? parsed.exercises : [];
      } catch (err) {
        console.error("Failed to parse tool args:", err);
      }
    }

    // Force quantity if user requested fixed
    if (cfg.quantity === 3 || cfg.quantity === 5) {
      exercises = exercises.slice(0, cfg.quantity);
    }

    if (exercises.length < 3) {
      return new Response(JSON.stringify({ error: "Resposta inválida da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ detectedState, exercises }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("awakening-questions error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
