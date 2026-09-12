create or replace function public.admin_preparar_agua_jejum()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Acesso negado: apenas administradores podem preparar o banco.';
  end if;

  alter table public.users
    add column if not exists agua_meta_ml integer,
    add column if not exists agua_reset_at timestamptz,
    add column if not exists jejum_reset_at timestamptz;

  comment on column public.users.agua_meta_ml is 'Meta diaria de hidratacao personalizada por usuario, em ml.';
  comment on column public.users.agua_reset_at is 'Marcador administrativo para limpar o rastreador local de agua do usuario.';
  comment on column public.users.jejum_reset_at is 'Marcador administrativo para limpar o historico local de jejum do usuario.';

  notify pgrst, 'reload schema';

  return jsonb_build_object(
    'ok', true,
    'message', 'Estrutura de agua e jejum preparada com sucesso.'
  );
end;
$$;

grant execute on function public.admin_preparar_agua_jejum() to authenticated;
