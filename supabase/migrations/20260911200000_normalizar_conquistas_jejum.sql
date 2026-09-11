-- Normaliza os nomes antigos das conquistas de jejum para o novo padrão.
-- Os marcos são exibidos pela aplicação; aqui também corrigimos os registros
-- já desbloqueados para que o banco não mantenha os títulos antigos.

UPDATE public.conquistas
SET titulo = regexp_replace(tipo, '^jejum_([0-9]+)h$', '\1 Horas De Jejum')
WHERE tipo ~ '^jejum_[0-9]+h$';

-- Garante que a alteração também seja aplicada ao ledger quando a conquista
-- já tiver sido resgatada: o ID continua sendo jejum_Xh, então não há quebra
-- de idempotência nem criação de uma segunda recompensa.
