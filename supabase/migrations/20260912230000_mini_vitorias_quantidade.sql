alter table public.mini_vitorias
  add column if not exists tipo text not null default 'unica',
  add column if not exists quantidade_meta integer not null default 1,
  add column if not exists quantidade_atual integer not null default 0;

alter table public.mini_vitorias
  drop constraint if exists mini_vitorias_tipo_check;

alter table public.mini_vitorias
  add constraint mini_vitorias_tipo_check
  check (tipo in ('unica', 'quantidade'));

alter table public.mini_vitorias
  drop constraint if exists mini_vitorias_quantidade_meta_check;

alter table public.mini_vitorias
  add constraint mini_vitorias_quantidade_meta_check
  check (quantidade_meta >= 1);

alter table public.mini_vitorias
  drop constraint if exists mini_vitorias_quantidade_atual_check;

alter table public.mini_vitorias
  add constraint mini_vitorias_quantidade_atual_check
  check (quantidade_atual >= 0 and quantidade_atual <= quantidade_meta);

update public.mini_vitorias
set quantidade_atual = case when concluida then quantidade_meta else 0 end
where quantidade_atual = 0;
