-- Ferramenta administrativa para reconstruir do zero os marcos de jejum.
-- Remove registros antigos de jejum e recria a escada canônica de 8 em 8 horas.

create or replace function public.admin_rebuild_jejum_conquistas(p_user_id uuid, p_max_hours numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  h integer;
  max_milestone integer;
  total integer := 0;
  is_admin boolean;
begin
  select exists(
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ) into is_admin;

  if auth.uid() is null or not is_admin then
    raise exception 'not authorized';
  end if;

  max_milestone := greatest(0, floor(greatest(coalesce(p_max_hours, 0), 0) / 8) * 8);

  delete from public.conquistas
   where user_id = p_user_id
     and tipo like 'jejum_%';

  if max_milestone < 8 then
    return jsonb_build_object('max_milestone', 0, 'count', 0);
  end if;

  for h in 8..max_milestone by 8 loop
    insert into public.conquistas(user_id, tipo, titulo, descricao)
    values (
      p_user_id,
      'jejum_' || h || 'h',
      h || ' Horas de Jejum',
      'Você registrou uma sessão de ' || h || ' horas de jejum ou mais.'
    );
    total := total + 1;
  end loop;

  return jsonb_build_object('max_milestone', max_milestone, 'count', total);
end;
$$;

grant execute on function public.admin_rebuild_jejum_conquistas(uuid, numeric) to authenticated;
