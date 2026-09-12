import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Dashboard from "./Dashboard";
import JejumCard from "@/components/JejumCard";
import ConquistaJejumPopup from "@/components/ConquistaJejumPopup";
import UrgeSurfingCard from "@/components/UrgeSurfingCard";

export default function DashboardComJejum() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const find = () => {
      const button = Array.from(document.querySelectorAll("button")).find(el => el.textContent?.includes("Carta de Enfrentamento"));
      if (!button) return;
      let mount = button.nextElementSibling?.matches("[data-jejum-mount]") ? button.nextElementSibling as HTMLElement : null;
      if (!mount) {
        mount = document.createElement("div");
        mount.setAttribute("data-jejum-mount", "true");
        button.insertAdjacentElement("afterend", mount);
      }
      setTarget(mount);
    };
    const timer = window.setTimeout(find, 50);
    return () => window.clearTimeout(timer);
  }, []);

  return <>
    <Dashboard />
    {target ? createPortal(<div className="space-y-4"><JejumCard /><UrgeSurfingCard /></div>, target) : null}
    <ConquistaJejumPopup />
  </>;
}
