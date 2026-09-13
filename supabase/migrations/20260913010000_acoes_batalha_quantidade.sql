-- Quantidade diária para AÇÕES DE BATALHA (habitos).
-- Mini-Vitórias não usam estes campos.

alter table public.habitos
  add column if not exists tipo_tarefa text not null default 'unica',
  add column if not exists quantidade_meta integer not null default 1;

alter table public.habitos
  drop constraint if exists habitos_tipo_tarefa_check;

alter table public.habitos
  add constraint habitos_tipo_tarefa_check
  check (tipo_tarefa in ('unica', 'quantidade'));

alter table public.habitos
  drop constraint if exists habitos_quantidade_meta_check;

alter table public.habitos
  add constraint habitos_quantidade_meta_check
  check (quantidade_meta >= 1);

alter table public.habito_logs
  add column if not exists quantidade_atual integer not null default 1;

alter table public.habito_logs
  drop constraint if exists habito_logs_quantidade_atual_check;

alter table public.habito_logs
  add constraint habito_logs_quantidade_atual_check
  check (quantidade_atual >= 0);

update public.habitos
set quantidade_meta = 1
where quantidade_meta is null or quantidade_meta < 1;

update public.habito_logs
set quantidade_atual = 1
where quantidade_atual is null or quantidade_atual < 0;
