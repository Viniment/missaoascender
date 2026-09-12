import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Dashboard from "./Dashboard";
import JejumCard from "@/components/JejumCard";
import ConquistaJejumPopup from "@/components/ConquistaJejumPopup";
import UrgeSurfingCard from "@/components/UrgeSurfingCard";

export default function DashboardComJejum() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mount: HTMLElement | null = null;

    const find = () => {
      if (cancelled) return;
      const button = Array.from(document.querySelectorAll("button")).find(
        el => el.textContent?.includes("Carta de Enfrentamento")
      );
      if (!button) return;

      const next = button.nextElementSibling;
      if (next instanceof HTMLElement && next.matches("[data-jejum-mount]")) {
        mount = next;
      } else {
        mount = document.createElement("div");
        mount.setAttribute("data-jejum-mount", "true");
        button.insertAdjacentElement("afterend", mount);
      }

      setTarget(mount);
      observer.disconnect();
    };

    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    find();

    return () => {
      cancelled = true;
      observer.disconnect();
      if (mount?.isConnected) mount.remove();
    };
  }, []);

  return <>
    <Dashboard />
    {target ? createPortal(
      <div className="space-y-2 pt-1">
        <JejumCard />
        <UrgeSurfingCard />
      </div>,
      target
    ) : null}
    <ConquistaJejumPopup />
  </>;
}
