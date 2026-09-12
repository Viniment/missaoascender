-- Reparo definitivo dos marcos de jejum.
-- Normaliza registros antigos, corrige seus títulos e garante a escada completa de 8 em 8 horas.

create or replace function public.sync_jejum_conquistas(p_user_id uuid, p_max_hours numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  h integer;
  max_milestone integer;
  total integer := 0;
  old_row record;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  max_milestone := greatest(0, floor(greatest(coalesce(p_max_hours, 0), 0) / 8) * 8);

  -- Primeiro corrige conquistas antigas, mesmo que tenham sido gravadas com
  -- um tipo legado. O número de horas é preservado e o título é normalizado.
  for old_row in
    select id, tipo,
           nullif(regexp_replace(tipo, '[^0-9]', '', 'g'), '')::integer as horas
      from public.conquistas
     where user_id = p_user_id
       and tipo like 'jejum_%'
  loop
    if old_row.horas is not null and old_row.horas >= 8 then
      update public.conquistas
         set titulo = old_row.horas || ' Horas de Jejum',
             descricao = 'Você registrou uma sessão de ' || old_row.horas || ' horas de jejum ou mais.'
       where id = old_row.id;
    end if;
  end loop;

  -- Depois garante todos os marcos canônicos até o maior jejum alcançado.
  for h in 8..max_milestone by 8 loop
    insert into public.conquistas(user_id, tipo, titulo, descricao)
    values (
      p_user_id,
      'jejum_' || h || 'h',
      h || ' Horas de Jejum',
      'Você registrou uma sessão de ' || h || ' horas de jejum ou mais.'
    )
    on conflict (user_id, tipo) do update
      set titulo = excluded.titulo,
          descricao = excluded.descricao;

    total := total + 1;
  end loop;

  return jsonb_build_object(
    'max_milestone', max_milestone,
    'count', total,
    'highest', case when max_milestone >= 8 then max_milestone else null end
  );
end;
$$;

grant execute on function public.sync_jejum_conquistas(uuid, numeric) to authenticated;
