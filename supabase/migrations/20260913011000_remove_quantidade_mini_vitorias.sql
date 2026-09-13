-- Mini-Vitórias são marcos únicos. Quantidade pertence somente às Ações de Batalha.
alter table public.mini_vitorias
  drop column if exists tipo,
  drop column if exists quantidade_meta,
  drop column if exists quantidade_atual;
