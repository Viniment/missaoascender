-- Normalizacao definitiva dos marcos de jejum.
-- Corrige tanto tipos quanto titulos legados e garante a escada canonica de 8 em 8 horas.

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
  old_hours integer;
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  max_milestone := greatest(0, floor(greatest(coalesce(p_max_hours, 0), 0) / 8) * 8);

  -- Corrige qualquer registro legado cujo tipo OU titulo contenha "jejum".
  -- O numero de horas e extraido primeiro do titulo e depois do tipo.
  for old_row in
    select id, tipo, titulo
      from public.conquistas
     where user_id = p_user_id
       and (
         lower(coalesce(tipo, '')) like '%jejum%'
         or lower(coalesce(titulo, '')) like '%jejum%'
       )
  loop
    old_hours := null;

    if nullif(regexp_replace(coalesce(old_row.titulo, ''), '[^0-9]', '', 'g'), '') is not null then
      old_hours := nullif(regexp_replace(old_row.titulo, '[^0-9]', '', 'g'), '')::integer;
    elsif nullif(regexp_replace(coalesce(old_row.tipo, ''), '[^0-9]', '', 'g'), '') is not null then
      old_hours := nullif(regexp_replace(old_row.tipo, '[^0-9]', '', 'g'), '')::integer;
    end if;

    if old_hours is not null and old_hours >= 8 then
      update public.conquistas
         set titulo = old_hours || ' Horas de Jejum',
             descricao = 'Voce registrou uma sessao de ' || old_hours || ' horas de jejum ou mais.'
       where id = old_row.id;
    end if;
  end loop;

  -- Garante todos os marcos canonicos alcancados, sem parar em 24h.
  for h in 8..max_milestone by 8 loop
    insert into public.conquistas(user_id, tipo, titulo, descricao)
    values (
      p_user_id,
      'jejum_' || h || 'h',
      h || ' Horas de Jejum',
      'Voce registrou uma sessao de ' || h || ' horas de jejum ou mais.'
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
