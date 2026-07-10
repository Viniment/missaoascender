import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const KEY = 'ascensao-install-dismissed';

export default function InstallPrompt() {
  const [ev, setEv] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY) === '1') return;
    const handler = (e: Event) => {
      e.preventDefault();
      setEv(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !ev) return null;

  const dismiss = () => {
    localStorage.setItem(KEY, '1');
    setVisible(false);
  };

  const install = async () => {
    await ev.prompt();
    await ev.userChoice;
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] max-w-sm w-[calc(100%-2rem)] rounded-xl border border-primary/50 bg-background/95 backdrop-blur-md shadow-elegant p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
        <Download className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-sm tracking-wider text-primary">Instalar Ascensão</p>
        <p className="text-[11px] text-foreground/60">Acesse rápido da tela inicial.</p>
      </div>
      <button
        onClick={install}
        className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-display tracking-widest hover:opacity-90"
      >
        INSTALAR
      </button>
      <button onClick={dismiss} className="text-foreground/40 hover:text-foreground p-1" aria-label="Dispensar">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}