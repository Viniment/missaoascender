import { toast } from "sonner";

export const CONNECTION_CHECK_INTERVAL_MS = 5000;
export const SAVE_RETRY_ATTEMPTS = 2;

let lastSaveFailureAt = 0;

export function markSaveFailure() {
  lastSaveFailureAt = Date.now();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("new-lifeup:save-failure"));
  }
}

export function markSaveRetry(attempt: number) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("new-lifeup:save-retry", { detail: { attempt } }));
  }
}

export function hasRecentSaveFailure(windowMs = 1500) {
  return Date.now() - lastSaveFailureAt < windowMs;
}

export function notifySaveFailure() {
  toast.error("Não foi possível salvar", {
    description: "Sua alteração não foi confirmada no banco de dados. Verifique a conexão e tente novamente.",
    duration: 5000,
  });
}

export function notifySaveRetry(attempt: number) {
  toast.warning("Tentando salvar novamente...", {
    description: `A conexão falhou. Nova tentativa ${attempt}/${SAVE_RETRY_ATTEMPTS}.`,
    duration: 2500,
  });
}

export function notifyOffline() {
  // The full-screen ConnectionGuard is the single visual connection state.
  // Avoid a second floating toast covering the page.
}
