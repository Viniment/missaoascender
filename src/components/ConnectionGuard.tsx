import { useEffect, useState } from "react";
import { WifiOff, RefreshCw, ShieldAlert } from "lucide-react";
import { CONNECTION_CHECK_INTERVAL_MS, notifyOffline } from "@/lib/reliability";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function checkConnection(): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return false;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "GET",
      cache: "no-store",
      headers: { apikey: SUPABASE_KEY },
    });
    return response.status < 500;
  } catch {
    return false;
  }
}

export default function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const [connected, setConnected] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    let mounted = true;

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
    };
  }, []);

  if (connected) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-background/96 px-5 backdrop-blur-xl">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-primary/25 bg-background/95 p-6 text-center shadow-[0_0_70px_hsl(var(--primary)/0.16)]">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive shadow-[0_0_25px_hsl(var(--destructive)/0.12)]">
          <WifiOff className="h-8 w-8" />
        </div>
        <div className="mb-2 flex items-center justify-center gap-2 text-primary">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-display text-[9px] font-black uppercase tracking-[0.28em]">Sistema bloqueado</span>
        </div>
        <h2 className="font-display text-xl font-black uppercase tracking-[0.12em]">Conexão interrompida</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          O NEW LIFEUP pausou suas ações para proteger seu progresso. Nenhuma recompensa será confirmada enquanto o banco de dados não puder ser alcançado.
        </p>
        <div className="mt-5 flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
          Verificando conexão automaticamente...
        </div>
      </div>
    </div>
  );
}
