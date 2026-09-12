-- Sincroniza os marcos de jejum no banco sem depender de permissao de UPDATE/UPSERT do cliente.
-- Mantem todos os marcos cruzados e corrige titulos antigos para o padrao "X Horas de Jejum".

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
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'not authorized';
  end if;

  max_milestone := greatest(0, floor(greatest(coalesce(p_max_hours, 0), 0) / 8) * 8);

  if max_milestone < 8 then
    return jsonb_build_object('max_milestone', 0, 'count', 0, 'highest', null);
  end if;

  for h in 8..max_milestone by 8 loop
    update public.conquistas
       set titulo = format('%s Horas de Jejum', h),
           descricao = format('Voce alcancou %s horas de jejum em uma sessao registrada.', h)
     where user_id = p_user_id
       and tipo = format('jejum_%sh', h);

    insert into public.conquistas(user_id, tipo, titulo, descricao)
    values (
      p_user_id,
      format('jejum_%sh', h),
      format('%s Horas de Jejum', h),
      format('Voce alcancou %s horas de jejum em uma sessao registrada.', h)
    )
    on conflict (user_id, tipo) do update
      set titulo = excluded.titulo,
          descricao = excluded.descricao;

    total := total + 1;
  end loop;

  return jsonb_build_object('max_milestone', max_milestone, 'count', total, 'highest', max_milestone);
end;
$$;

grant execute on function public.sync_jejum_conquistas(uuid, numeric) to authenticated;
