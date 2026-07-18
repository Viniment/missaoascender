import { corsHeaders } from "../_shared/cors.ts";
import { chatText } from "../_shared/ai.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    const user = userRes.user;
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const since = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
    const [{ data: logs }, { data: heroi }, { data: inim }, { data: mvs }] = await Promise.all([
      supabase.from("habito_logs").select("data, habito_id, habitos(nome, tipo)").eq("user_id", user.id).gte("data", since),
      supabase.from("users").select("*").eq("id", user.id).maybeSingle(),
      supabase.from("inimigo").select("nome, hp_atual, hp_max").eq("user_id", user.id).eq("ativo", true).maybeSingle(),
      supabase.from("mini_vitorias").select("titulo, concluida").eq("user_id", user.id).gte("concluida_em", since),
    ]);

    const system = "Você é o Mentor. Gere um resumo semanal em PT-BR (3-5 frases), motivador, sem emojis, sem markdown, tom RPG épico. Fale das batalhas, do inimigo e dos próximos passos.";
    const user_prompt = JSON.stringify({ heroi, inim, logs: logs?.slice(0, 60), mvs });
    const resumo = await chatText(system, user_prompt);
    return new Response(JSON.stringify({ resumo }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});