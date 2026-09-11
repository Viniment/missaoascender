-- Persistent RPG rewards for conquest unlocks.
-- Idempotent: a conquest can only be rewarded once per user.

create table if not exists public.hero_attributes (
  user_id uuid primary key references public.users(id) on delete cascade,
  consciencia integer not null default 0,
  foco integer not null default 0,
  autodominio integer not null default 0,
  coragem integer not null default 0,
  disciplina integer not null default 0,
  gestao integer not null default 0,
  resiliencia integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.conquista_recompensas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  conquista_id uuid not null references public.conquistas(id) on delete cascade,
  conquista_tipo text not null,
  xp integer not null default 0,
  ouro integer not null default 0,
  vida integer not null default 1 check (vida between 1 and 5),
  atributo text not null,
  atributo_delta integer not null default 1,
  criado_em timestamptz not null default now(),
  unique(user_id, conquista_id)
);

create index if not exists conquista_recompensas_user_idx on public.conquista_recompensas(user_id, criado_em desc);

alter table public.hero_attributes enable row level security;
alter table public.conquista_recompensas enable row level security;

drop policy if exists "users can read own hero attributes" on public.hero_attributes;
create policy "users can read own hero attributes" on public.hero_attributes for select using (auth.uid() = user_id);

drop policy if exists "users can read own conquest rewards" on public.conquista_recompensas;
create policy "users can read own conquest rewards" on public.conquista_recompensas for select using (auth.uid() = user_id);

create or replace function public.xp_for_level_reward(p_level integer)
returns integer
language sql
immutable
as $$
  select round(100 * power(1.35, p_level - 1))::integer;
$$;

create or replace function public.claim_conquista_reward(p_user_id uuid, p_conquista_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  existing record;
  rarity text;
  xp_reward integer;
  gold_reward integer;
  life_reward integer;
  attr text;
  attr_delta integer;
  current_xp integer;
  current_level integer;
  next_xp integer;
  current_life integer;
  max_life integer;
  current_gold integer;
  gained_levels integer := 0;
  r double precision;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  select id, tipo, titulo into c
  from public.conquistas
  where id = p_conquista_id and user_id = p_user_id;

  if not found then raise exception 'conquista not found'; end if;

  select * into existing from public.conquista_recompensas
  where user_id = p_user_id and conquista_id = p_conquista_id;

  if found then
    return jsonb_build_object('claimed', true, 'xp', existing.xp, 'ouro', existing.ouro, 'vida', existing.vida, 'atributo', existing.atributo, 'atributo_delta', existing.atributo_delta);
  end if;

  -- Difficulty is derived from the achievement ladder already used by the app.
  if c.tipo like 'nivel_100' or c.tipo like 'streak_100' or c.tipo like 'diario_100' or c.tipo like 'dias_limpos_30' or c.tipo = 'mestre_habitos' then
    rarity := 'lendaria';
  elsif c.tipo ~ '_(30|45|60|75)$' or c.tipo in ('streak_21','streak_30','streak_60','inimigos_25','ouro_ganho_5000','ouro_ganho_10000','ouro_cofre_5000') then
    rarity := 'epica';
  elsif c.tipo ~ '_(5|7|10|14|15|20|25)$' then
    rarity := 'rara';
  else
    rarity := 'comum';
  end if;

  if rarity = 'lendaria' then
    xp_reward := 500; gold_reward := 300; attr_delta := 3;
  elsif rarity = 'epica' then
    xp_reward := 175; gold_reward := 100; attr_delta := 2;
  elsif rarity = 'rara' then
    xp_reward := 75; gold_reward := 40; attr_delta := 1;
  else
    xp_reward := 25; gold_reward := 15; attr_delta := 1;
  end if;

  r := random();
  if r < 0.55 then life_reward := 1;
  elsif r < 0.82 then life_reward := 2;
  elsif r < 0.94 then life_reward := 3;
  elsif r < 0.985 then life_reward := 4;
  else life_reward := 5;
  end if;

  -- Map each achievement family to a character attribute.
  if c.tipo like 'diario_%' or c.tipo like 'dias_mente_%' or c.tipo like 'pensamentos_%' then attr := 'consciencia';
  elsif c.tipo like 'escolhas_%' or c.tipo like 'perspectivas_%' then attr := 'foco';
  elsif c.tipo like 'vontades_%' or c.tipo like 'dias_limpos_%' then attr := 'autodominio';
  elsif c.tipo like 'inimigo%' or c.tipo = 'primeiro_inimigo_derrotado' or c.tipo = 'primeira_batalha' then attr := 'coragem';
  elsif c.tipo like 'streak_%' or c.tipo = 'mestre_habitos' then attr := 'disciplina';
  elsif c.tipo like 'ouro_%' or c.tipo like 'compras_%' then attr := 'gestao';
  else attr := 'resiliencia';
  end if;

  insert into public.hero_attributes(user_id) values (p_user_id) on conflict (user_id) do nothing;

  if attr = 'consciencia' then update public.hero_attributes set consciencia=consciencia+attr_delta, updated_at=now() where user_id=p_user_id;
  elsif attr = 'foco' then update public.hero_attributes set foco=foco+attr_delta, updated_at=now() where user_id=p_user_id;
  elsif attr = 'autodominio' then update public.hero_attributes set autodominio=autodominio+attr_delta, updated_at=now() where user_id=p_user_id;
  elsif attr = 'coragem' then update public.hero_attributes set coragem=coragem+attr_delta, updated_at=now() where user_id=p_user_id;
  elsif attr = 'disciplina' then update public.hero_attributes set disciplina=disciplina+attr_delta, updated_at=now() where user_id=p_user_id;
  elsif attr = 'gestao' then update public.hero_attributes set gestao=gestao+attr_delta, updated_at=now() where user_id=p_user_id;
  else update public.hero_attributes set resiliencia=resiliencia+attr_delta, updated_at=now() where user_id=p_user_id;
  end if;

  select xp_atual, nivel, xp_proximo_nivel, vida_atual, vida_max, ouro into current_xp, current_level, next_xp, current_life, max_life, current_gold
  from public.users where id=p_user_id for update;

  current_xp := current_xp + xp_reward;
  while current_xp >= next_xp loop
    current_xp := current_xp - next_xp;
    current_level := current_level + 1;
    next_xp := public.xp_for_level_reward(current_level);
    gained_levels := gained_levels + 1;
  end loop;

  current_life := least(max_life, current_life + life_reward);
  current_gold := greatest(0, current_gold + gold_reward);

  update public.users set xp_atual=current_xp, nivel=current_level, xp_proximo_nivel=next_xp, vida_atual=current_life, ouro=current_gold where id=p_user_id;
  insert into public.transacoes_ouro(user_id, valor, origem, descricao) values (p_user_id, gold_reward, 'conquista', coalesce(c.titulo,'Conquista'));

  insert into public.conquista_recompensas(user_id, conquista_id, conquista_tipo, xp, ouro, vida, atributo, atributo_delta)
  values (p_user_id, p_conquista_id, c.tipo, xp_reward, gold_reward, life_reward, attr, attr_delta);

  return jsonb_build_object('claimed', false, 'xp', xp_reward, 'ouro', gold_reward, 'vida', life_reward, 'atributo', attr, 'atributo_delta', attr_delta, 'raridade', rarity, 'niveis', gained_levels);
end;
$$;

grant execute on function public.claim_conquista_reward(uuid, uuid) to authenticated;
