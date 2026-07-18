import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

const KEY = "nl_low_power";

type Ctx = { lowPower: boolean; setLowPower: (v: boolean) => void; toggle: () => void };
const LowPowerCtx = createContext<Ctx>({ lowPower: false, setLowPower: () => {}, toggle: () => {} });

export function LowPowerProvider({ children }: { children: ReactNode }) {
  const [lowPower, setLowPowerState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY) === "1";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (lowPower) root.classList.add("low-power");
    else root.classList.remove("low-power");
  }, [lowPower]);

  const setLowPower = useCallback((v: boolean) => {
    localStorage.setItem(KEY, v ? "1" : "0");
    setLowPowerState(v);
  }, []);
  const toggle = useCallback(() => setLowPower(!lowPower), [lowPower, setLowPower]);

  return <LowPowerCtx.Provider value={{ lowPower, setLowPower, toggle }}>{children}</LowPowerCtx.Provider>;
}

export function useLowPower() {
  return useContext(LowPowerCtx);
}