import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const localStateKey = (userId: string, chave: string) => `ascensao:db-state:${userId}:${chave}`;

function readLocalState<T>(userId: string, chave: string): T | null {
  try {
    const raw = localStorage.getItem(localStateKey(userId, chave));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeLocalState<T>(userId: string, chave: string, valor: T): void {
  try {
    localStorage.setItem(localStateKey(userId, chave), JSON.stringify(valor));
  } catch {
    // O cache local é apenas uma proteção contra falhas temporárias do banco.
  }
}

function removeLocalState(userId: string, chave: string): void {
  try {
    localStorage.removeItem(localStateKey(userId, chave));
  } catch {
    // Ignora falhas do storage local.
  }
}

export async function getUserState<T>(userId: string, chave: string, fallback: T): Promise<T> {
  const { data, error } = await db
    .from("user_app_state")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", chave)
    .maybeSingle();

  if (!error && data) {
    const valor = (data.valor as T) ?? fallback;
    writeLocalState(userId, chave, valor);
    return valor;
  }

  return readLocalState<T>(userId, chave) ?? fallback;
}

export async function getOrMigrateLegacyState<T>(userId: string, chave: string, legacyKey: string, fallback: T): Promise<T> {
  const { data, error } = await db
    .from("user_app_state")
    .select("valor")
    .eq("user_id", userId)
    .eq("chave", chave)
    .maybeSingle();

  if (!error && data) {
    const valor = (data.valor as T) ?? fallback;
    writeLocalState(userId, chave, valor);
    return valor;
  }

  const cached = readLocalState<T>(userId, chave);
  if (cached !== null) return cached;

  try {
    const raw = localStorage.getItem(legacyKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    await setUserState(userId, chave, parsed);
    return parsed;
  } catch {
    return fallback;
  }
}

export async function setUserState<T>(userId: string, chave: string, valor: T): Promise<void> {
  // Atualiza imediatamente um espelho local para que uma falha transitória do
  // PostgREST não faça a ação parecer um botão quebrado nem apague o progresso.
  writeLocalState(userId, chave, valor);

  const { error } = await db.from("user_app_state").upsert(
    { user_id: userId, chave, valor },
    { onConflict: "user_id,chave" },
  );

  if (error) {
    console.warn(`[Ascensão] Não foi possível sincronizar "${chave}" com o banco. O estado ficou protegido localmente.`, error);
  } else {
    // O banco voltou a responder: o cache continua apenas como espelho rápido.
    writeLocalState(userId, chave, valor);
  }
}

export async function deleteUserState(userId: string, chave: string): Promise<void> {
  const { error } = await db
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .eq("chave", chave);

  if (error) {
    console.warn(`[Ascensão] Não foi possível excluir "${chave}" do banco.`, error);
    return;
  }

  removeLocalState(userId, chave);
}

export async function deleteUserStatesByPrefix(userId: string, prefix: string): Promise<void> {
  const { error } = await db
    .from("user_app_state")
    .delete()
    .eq("user_id", userId)
    .like("chave", `${prefix}%`);

  if (error) {
    console.warn(`[Ascensão] Não foi possível excluir estados com prefixo "${prefix}" do banco.`, error);
    return;
  }

  try {
    const prefixKey = `ascensao:db-state:${userId}:${prefix}`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefixKey)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignora falhas do storage local.
  }
}
