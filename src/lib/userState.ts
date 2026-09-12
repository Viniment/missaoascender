import { supabase } from "@/integrations/supabase/client";

export async function getUserState<T>(userId: string, chave: string, fallback: T): Promise<T> {
  const { data, error } = await supabase
    .from("user_app_state")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", chave)
    .maybeSingle();
  if (error || !data) return fallback;
  return (data.valor as T) ?? fallback;
}

export async function setUserState<T>(userId: string, chave: string, valor: T): Promise<void> {
  const { error } = await supabase.from("user_app_state").upsert(
    { user_id: userId, chave, valor: valor as any },
    { onConflict: "user_id,chave" },
  );
  if (error) throw error;
}

export async function deleteUserState(userId: string, chave: string): Promise<void> {
  const { error } = await supabase
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .eq("chave", chave);
  if (error) throw error;
}

export async function deleteUserStatesByPrefix(userId: string, prefix: string): Promise<void> {
  const { error } = await supabase
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .like("chave", `${prefix}%`);
  if (error) throw error;
}
