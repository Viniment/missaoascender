import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const {
      heroi_nome, titulo, sonho, desculpas, funcao_protetora, custo_procrastinacao,
      inimigo_nome, gatilho, mentiras, habitos_positivos, habitos_negativos, streak,
    } = await req.json();

    const seed = Math.random().toString(36).slice(2, 7);

    const system = [
      "Você escreve uma CARTA DE ENFRENTAMENTO em PT-BR: uma mensagem que o próprio usuário escreveu para si mesmo, para ler no instante em que estiver prestes a ceder a um impulso, compulsão ou procrastinação.",
      "REGRA OBRIGATÓRIA: PRIMEIRA PESSOA. Escreva como se o usuário estivesse falando consigo mesmo ('Eu consigo', 'Eu escolho', 'Eu não vou me abandonar'). NUNCA use 'você', 'tu' ou imperativos dirigidos a outra pessoa.",
      "Use SOMENTE as informações fornecidas. Não invente fatos, nomes, histórias ou detalhes pessoais. Se um dado não existir, ignore-o.",
      "Construa a carta naturalmente (sem títulos, sem lista, sem formulário) passando por: o que estou sentindo agora; o que meu padrão quer que eu faça; o preço concreto de ceder (afastamento dos meus objetivos, fortalecimento do velho padrão); o que eu realmente quero construir; que eu posso sentir desconforto/vontade sem obedecer; como cada escolha treina uma identidade; a autotraição de abandonar o que eu mesmo decidi construir; minha lealdade ao futuro; uma conclusão curta e poderosa.",
      "Tom: visceral, intenso, direto, emocional, profundo, pessoal, com sensação de confronto interno com o velho padrão — uma declaração de guerra ao padrão, não uma mensagem de coach.",
      "PROIBIDO: frases genéricas de motivação, positividade artificial, humilhação, insultos, culpa destrutiva, ameaças, afirmações científicas inventadas, emojis, hashtags, markdown, aspas ao redor do texto, metáforas épicas de fantasia (espada, guerreiro, trevas).",
      "Confronte o padrão, nunca a autoestima. Cite o sonho, os hábitos e o gatilho de forma concreta quando existirem.",
      "Tamanho: 150 a 260 palavras. Frases curtas. Parágrafos curtos separados por linha em branco. Pode começar com uma frase de abertura em CAIXA ALTA.",
      "Varie estrutura e abertura a cada geração (use o SEED).",
    ].join(" ");

    const lst = (a: unknown) => Array.isArray(a) && a.length ? a.filter(Boolean).join("; ") : null;
    const user = [
      `SEED: ${seed}`,
      heroi_nome ? `Meu nome: ${heroi_nome}` : null,
      titulo ? `Título que escolhi para mim: ${titulo}` : null,
      sonho ? `Meu sonho / o que quero construir: ${sonho}` : null,
      lst(desculpas) ? `Desculpas que costumo usar para ceder: ${lst(desculpas)}` : null,
      funcao_protetora ? `O que meu padrão tenta me proteger de sentir: ${funcao_protetora}` : null,
      custo_procrastinacao ? `O que a procrastinação/o padrão já me custou: ${custo_procrastinacao}` : null,
      inimigo_nome ? `Nome que dei ao meu padrão interno: ${inimigo_nome}` : null,
      gatilho ? `Gatilho principal: ${gatilho}` : null,
      lst(mentiras) ? `Mentiras que o padrão me conta: ${lst(mentiras)}` : null,
      lst(habitos_positivos) ? `Hábitos que estou construindo: ${lst(habitos_positivos)}` : null,
      lst(habitos_negativos) ? `Padrões que quero abandonar: ${lst(habitos_negativos)}` : null,
      typeof streak === "number" ? `Dias consecutivos de constância: ${streak}` : null,
      "Escreva a carta agora, em primeira pessoa.",
    ].filter(Boolean).join("\n");

    const carta = await chatText(system, user);
    return new Response(JSON.stringify({ carta }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
