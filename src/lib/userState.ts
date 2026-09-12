import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export async function getUserState<T>(userId: string, chave: string, fallback: T): Promise<T> {
  const { data, error } = await db
    .from("user_app_state")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", chave)
    .maybeSingle();
  if (error || !data) return fallback;
  return (data.valor as T) ?? fallback;
}

export async function getOrMigrateLegacyState<T>(userId: string, chave: string, legacyKey: string, fallback: T): Promise<T> {
  const { data, error } = await db
    .from("user_app_state")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", chave)
    .maybeSingle();
  if (data && !error) return (data.valor as T) ?? fallback;
  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    await setUserState(userId, chave, parsed);
    localStorage.removeItem(legacyKey);
    return parsed;
  } catch {
    return fallback;
  }
}

export async function setUserState<T>(userId: string, chave: string, valor: T): Promise<void> {
  const { error } = await db.from("user_app_state").upsert(
    { user_id: userId, chave, valor },
    { onConflict: "user_id,chave" },
  );
  if (error) throw error;
}

export async function deleteUserState(userId: string, chave: string): Promise<void> {
  const { error } = await db
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .eq("chave", chave);
  if (error) throw error;
}

export async function deleteUserStatesByPrefix(userId: string, prefix: string): Promise<void> {
  const { error } = await db
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .like("chave", `${prefix}%`);
  if (error) throw error;
}
