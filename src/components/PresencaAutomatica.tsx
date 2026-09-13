import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/utils";

/** Registra a presença uma única vez por usuário/dia. */
export default function PresencaAutomatica({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const executado = useRef<string | null>(null);

  useEffect(() => {
    const data = todayISO();
    const chave = `${userId}:${data}`;
    if (executado.current === chave) return;
    executado.current = chave;
    let cancelado = false;

    const registrar = async () => {
      for (let tentativa = 0; tentativa < 3 && !cancelado; tentativa += 1) {
        const { error } = await (supabase as any).rpc("registrar_presenca_diaria", { p_data: data });
        if (!error) {
          await qc.invalidateQueries({ queryKey: ["heroi", userId] });
          return;
        }
        if (tentativa < 2) await new Promise(resolve => setTimeout(resolve, 800 * (tentativa + 1)));
      }
    };

    void registrar();
    return () => { cancelado = true; };
  }, [userId, qc]);

  return null;
}
