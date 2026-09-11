create or replace function public.xp_for_level_reward(p_level integer)
returns integer
language sql
immutable
security invoker
set search_path = public
as $$
  select round(100 * power(1.35, p_level - 1))::integer;
$$;

revoke execute on function public.xp_for_level_reward(integer) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;