import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

function isMobile() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}
function isIOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-ignore
    window.navigator.standalone === true
  );
}
function recentlyDismissed() {
  const v = localStorage.getItem(DISMISS_KEY);
  if (!v) return false;
  const t = parseInt(v, 10);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function InstallPWAPrompt() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (!isMobile() || isStandalone() || recentlyDismissed()) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onBIP);

    // iOS não dispara beforeinstallprompt — mostra dica manual
    if (isIOS()) {
      const t = setTimeout(() => setShow(true), 1500);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBIP);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBIP);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setIosHint(false);
  };

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      setShow(false);
    } else if (isIOS()) {
      setIosHint(true);
    }
  };

  return (
    <div className="fixed left-3 right-3 bottom-24 z-[60] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-md rounded-2xl border border-primary/40 bg-background/95 backdrop-blur-xl p-3 shadow-[0_10px_40px_-10px_hsl(var(--primary)/0.7)]">
        {!iosHint ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 grid place-items-center text-primary">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-sm text-foreground">Instalar New LifeUP</div>
              <div className="text-[11px] text-muted-foreground">Adicione ao início e jogue como app.</div>
            </div>
            <button
              onClick={install}
              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-display tracking-wider"
            >
              INSTALAR
            </button>
            <button onClick={dismiss} aria-label="Fechar" className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <Share className="w-5 h-5 text-primary mt-0.5" />
              <div className="text-xs text-foreground/90 leading-relaxed">
                No Safari, toque em <b>Compartilhar</b> e depois em <b>“Adicionar à Tela de Início”</b> para instalar.
              </div>
              <button onClick={dismiss} aria-label="Fechar" className="text-muted-foreground hover:text-foreground p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}