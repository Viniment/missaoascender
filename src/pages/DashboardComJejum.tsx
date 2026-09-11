import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Dashboard from "./Dashboard";
import JejumCard from "@/components/JejumCard";

export default function DashboardComJejum() {
  const [target, setTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const find = () => {
      const button = Array.from(document.querySelectorAll("button")).find(el => el.textContent?.includes("Carta de Enfrentamento"));
      if (!button?.parentElement) return;
      let mount = button.parentElement.querySelector("[data-jejum-mount]") as HTMLElement | null;
      if (!mount) {
        mount = document.createElement("div");
        mount.setAttribute("data-jejum-mount", "true");
        button.parentElement.insertAdjacentElement("afterend", mount);
      }
      setTarget(mount);
    };
    const timer = window.setTimeout(find, 50);
    return () => window.clearTimeout(timer);
  }, []);

  return <>
    <Dashboard />
    {target ? createPortal(<JejumCard />, target) : null}
  </>;
}
