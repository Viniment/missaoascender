import { useEffect, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { CONNECTION_CHECK_INTERVAL_MS, SAVE_RETRY_ATTEMPTS, markSaveFailure, markSaveRetry, notifyOffline, notifySaveFailure, notifySaveRetry } from "@/lib/reliability";
import { supabase } from "@/integrations/supabase/client";

const SAVE_FAILURE_CONFIRM_DELAY_MS = 1800;

async function checkConnection(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;

  try {
    // The request only needs to prove that Supabase is reachable.
    // RLS/auth/table errors still mean the server answered, so they must
    // NOT be interpreted as loss of connection.
    const { error } = await supabase.from("users").select("id").limit(1);
    if (!error) return true;
    const status = (error as { status?: number }).status;
    return typeof status === "number" && status > 0;
  } catch {
    return false;
  }
}

function installReliableFetch() {
  const marker = "__newLifeupReliableFetch";
  const current = window.fetch as typeof window.fetch & { [marker]?: boolean };
  if (current[marker]) return () => {};

  const originalFetch = window.fetch.bind(window);
  const reliableFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
    const isSupabase = url.startsWith(import.meta.env.VITE_SUPABASE_URL as string);
    const isWrite = isSupabase && !["GET", "HEAD", "OPTIONS"].includes(method);
    let lastError: unknown = null;
    let lastFailureWasTransport = false;

    for (let attempt = 0; attempt <= SAVE_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await originalFetch(input, init);

        // A normal HTTP response means the request reached Supabase.
        // Do not show the global "save failed" toast for 4xx responses:
        // those are application/database errors and their own callers must
        // decide how to present them. This prevents false global warnings.
        if (!isWrite || response.status < 500 || attempt === SAVE_RETRY_ATTEMPTS) {
          if (isWrite && response.status >= 500 && attempt === SAVE_RETRY_ATTEMPTS) {
            lastError = new Error(`Supabase HTTP ${response.status}`);
            lastFailureWasTransport = true;
          } else {
            return response;
          }
          break;
        }

        lastError = new Error(`Supabase HTTP ${response.status}`);
        lastFailureWasTransport = true;
      } catch (error) {
        lastError = error;
        lastFailureWasTransport = true;
      }

      if (attempt < SAVE_RETRY_ATTEMPTS) {
        const nextAttempt = attempt + 1;
        if (isWrite) {
          markSaveRetry(nextAttempt);
          notifySaveRetry(nextAttempt);
        }
        await new Promise((resolve) => window.setTimeout(resolve, 700 * 2 ** attempt));
      }
    }

    if (isWrite && lastFailureWasTransport) {
      // Give an in-flight request time to finish before declaring failure.
      // This is especially important when the write reached the database but
      // the response was delayed/lost on the way back to the browser.
      await new Promise((resolve) => window.setTimeout(resolve, SAVE_FAILURE_CONFIRM_DELAY_MS));

      const connectionRecovered = await checkConnection();
      if (!connectionRecovered) {
        markSaveFailure();
        notifySaveFailure();
      }
    }

    throw lastError instanceof Error ? lastError : new TypeError("Não foi possível conectar ao servidor");
  };

  reliableFetch[marker] = true;
  window.fetch = reliableFetch;
  return () => { window.fetch = originalFetch; };
}

export default function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;
    const restoreFetch = installReliableFetch();

    const verify = async () => {
      setChecking(true);
      const ok = await checkConnection();
      if (!mounted) return;
      setConnected(ok);
      setChecking(false);
      if (!ok) notifyOffline();
    };

    const onOffline = () => {
      setConnected(false);
      notifyOffline();
    };
    const onOnline = () => void verify();

    void verify();
    const interval = window.setInterval(() => void verify(), CONNECTION_CHECK_INTERVAL_MS);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      restoreFetch();
    };
  }, []);

  if (connected) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-background px-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.035)_0,transparent_55%)]" />
      </div>

      <div className="relative w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border border-primary/20 bg-primary/[0.06] text-primary shadow-[0_0_45px_hsl(var(--primary)/0.10)]">
          <WifiOff className="h-9 w-9" strokeWidth={1.5} />
        </div>

        <div className="mb-3 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.9)]" />
          <span className="font-display text-[9px] font-black uppercase tracking-[0.32em] text-primary/70">
            NEW LIFEUP
          </span>
        </div>

        <h2 className="font-display text-2xl font-black uppercase tracking-[0.12em] text-foreground">
          Conexão perdida
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reconectando ao sistema...
        </p>

        <div className="mx-auto mt-7 flex w-fit items-center gap-2 rounded-full border border-border/40 bg-background/40 px-4 py-2 text-[8px] font-black uppercase tracking-[0.22em] text-muted-foreground/70 backdrop-blur-sm">
          <RefreshCw className={`h-3.5 w-3.5 text-primary ${checking ? "animate-spin" : ""}`} />
          Aguardando conexão
        </div>
      </div>
    </div>
  );
}
