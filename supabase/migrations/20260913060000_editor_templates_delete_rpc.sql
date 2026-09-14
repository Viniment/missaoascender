create or replace function public.delete_editor_template(p_template_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado';
  end if;

  delete from public.editor_templates
  where id = p_template_id
    and user_id = auth.uid();

  return found;
end;
$$;

grant execute on function public.delete_editor_template(uuid) to authenticated;
