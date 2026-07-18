import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Megaphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Aviso = { id: string; titulo: string; mensagem: string; tipo: string };

export default function AvisosBanner() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const uid = user?.id;

  const { data: avisos } = useQuery({
    queryKey: ["avisos", uid],
    queryFn: async (): Promise<Aviso[]> => {
      if (!uid) return [];
      const [{ data: todos }, { data: lidos }] = await Promise.all([
        supabase.from("avisos").select("id,titulo,mensagem,tipo").eq("ativo", true).order("criado_em", { ascending: false }),
        supabase.from("avisos_lidos").select("aviso_id").eq("user_id", uid),
      ]);
      const lidosSet = new Set((lidos ?? []).map((l: any) => l.aviso_id));
      return ((todos ?? []) as Aviso[]).filter(a => !lidosSet.has(a.id));
    },
    enabled: !!uid,
    refetchInterval: 60_000,
  });

  const marcarLido = async (id: string) => {
    if (!uid) return;
    await supabase.from("avisos_lidos").insert({ aviso_id: id, user_id: uid });
  };

  // Auto-mark as read on display — só aparece uma vez.
  useEffect(() => {
    if (!uid || !avisos?.length) return;
    (async () => {
      await Promise.all(avisos.map(a =>
        supabase.from("avisos_lidos").insert({ aviso_id: a.id, user_id: uid })
      ));
      // Refetch depois de alguns segundos, para o usuário conseguir ler.
      setTimeout(() => {
        qc.invalidateQueries({ queryKey: ["avisos", uid] });
      }, 15000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, avisos?.map(a => a.id).join(",")]);

  if (!avisos?.length) return null;

  const tipoCor = (t: string) =>
    t === "alerta" ? "border-destructive/60 bg-destructive/10 text-destructive"
    : t === "sucesso" ? "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
    : "border-primary/60 bg-primary/10 text-primary";

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {avisos.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className={`relative rounded-lg border-2 p-3 ${tipoCor(a.tipo)}`}
          >
            <div className="flex items-start gap-2">
              <Megaphone className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-display text-xs uppercase tracking-[0.2em] leading-tight">{a.titulo}</p>
                <p className="text-sm text-foreground/90 mt-1">{a.mensagem}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}