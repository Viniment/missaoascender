import Shell from "@/components/Shell";
import { Link } from "react-router-dom";
import { Brain, Waves, FlaskConical, Radar, ChevronRight } from "lucide-react";

export default function Mente() {
  return (
    <Shell>
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        <header className="rpg-panel p-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Central da Mente</p>
          <h1 className="font-display text-lg tracking-widest">Ferramentas cognitivas</h1>
          <p className="text-[11px] text-muted-foreground mt-1">TCC, mindfulness, leitura de padrões e radar preditivo — tudo num só lugar.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/reestruturacao"
            className="rpg-panel p-3.5 flex items-center gap-3 hover:border-primary hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition group"
          >
            <div className="w-10 h-10 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary group-hover:scale-110 transition">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-primary">TCC</p>
              <h3 className="font-display text-sm tracking-widest">Reestruturar</h3>
              <p className="text-[11px] text-muted-foreground">Desmontar um pensamento.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
          </Link>

          <Link
            to="/urge-surfing"
            className="rpg-panel p-3.5 flex items-center gap-3 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.2)] transition group"
          >
            <div className="w-10 h-10 rounded-md grid place-items-center bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 group-hover:scale-110 transition">
              <Waves className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Mindfulness</p>
              <h3 className="font-display text-sm tracking-widest">Surfar a Onda</h3>
              <p className="text-[11px] text-muted-foreground">Atravessar um desejo sem ceder.</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-cyan-300" />
          </Link>
        </div>

        <Link
          to="/laboratorio"
          className="rpg-panel p-3.5 flex items-center gap-3 hover:border-primary hover:shadow-[0_0_25px_rgba(139,92,246,0.2)] transition group"
        >
          <div className="w-10 h-10 rounded-md grid place-items-center bg-primary/15 border border-primary/40 text-primary group-hover:scale-110 transition">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary">Laboratório</p>
            <h3 className="font-display text-sm tracking-widest">Padrões & Sabotagens</h3>
            <p className="text-[11px] text-muted-foreground">A IA cruza seus dados e mostra o que se repete.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
        </Link>

        <Link
          to="/predicao"
          className="rpg-panel p-3.5 flex items-center gap-3 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(251,191,36,0.2)] transition group"
        >
          <div className="w-10 h-10 rounded-md grid place-items-center bg-amber-500/15 border border-amber-500/40 text-amber-300 group-hover:scale-110 transition">
            <Radar className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300">Radar preditivo</p>
            <h3 className="font-display text-sm tracking-widest">Próxima Onda</h3>
            <p className="text-[11px] text-muted-foreground">A IA antecipa sua próxima fissura e monta a blindagem.</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-amber-300" />
        </Link>
      </div>
    </Shell>
  );
}