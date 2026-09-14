import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Keeps active UI data fresh without requiring the user to navigate or refresh.
 * Realtime handles immediate user-row changes; the short polling cycle also
 * catches data such as water logs when a specific table is changed elsewhere.
 */
export default function GlobalDataSync({ userId }: { userId: string }) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const refresh = async () => {
      if (cancelled || document.visibilityState === "hidden") return;
      await qc.refetchQueries({ type: "active" });
    };

    const timer = window.setInterval(() => void refresh(), 3000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel(`global-sync-${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "users", filter: `id=eq.${userId}` }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "conquistas", filter: `user_id=eq.${userId}` }, () => void refresh())
      .subscribe();

    void refresh();
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      void supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  return null;
}
