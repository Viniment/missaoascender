-- Permite que um administrador aplique pelo próprio painel as colunas
-- necessárias ao rastreador de água e aos marcadores de reset de jejum/água.
-- A função é SECURITY DEFINER porque ALTER TABLE não pode ser executado
-- diretamente pelo cliente via PostgREST.

create or replace function public.admin_aplicar_schema_agua_jejum()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  is_admin boolean;
begin
  select exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = 'admin'
  ) into is_admin;

  if not is_admin then
    raise exception 'Acesso negado: somente administradores podem aplicar esta configuração.';
  end if;

  alter table if exists public.users
    add column if not exists agua_meta_ml integer,
    add column if not exists agua_reset_at timestamptz,
    add column if not exists jejum_reset_at timestamptz;

  comment on column public.users.agua_meta_ml is 'Meta diaria de hidratacao personalizada por usuario, em ml.';
  comment on column public.users.agua_reset_at is 'Marcador administrativo para limpar o rastreador local de agua do usuario.';
  comment on column public.users.jejum_reset_at is 'Marcador administrativo para limpar o historico local de jejum do usuario.';

  notify pgrst, 'reload schema';

  return jsonb_build_object(
    'ok', true,
    'message', 'Colunas de água e jejum verificadas/aplicadas com sucesso.'
  );
end;
$$;

revoke all on function public.admin_aplicar_schema_agua_jejum() from public;
grant execute on function public.admin_aplicar_schema_agua_jejum() to authenticated;

notify pgrst, 'reload schema';
