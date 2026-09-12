create or replace function public.limpar_conquistas_jejum_no_reset()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.jejum_reset_at is distinct from old.jejum_reset_at then
    delete from public.conquistas
    where user_id = new.id
      and tipo like 'jejum_%';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_users_reset_jejum on public.users;
create trigger trg_users_reset_jejum
after update of jejum_reset_at on public.users
for each row
execute function public.limpar_conquistas_jejum_no_reset();
