revoke execute on function public.xp_for_level_reward(integer) from public, anon;
revoke execute on function public.claim_conquista_reward(uuid, uuid) from public, anon;
grant execute on function public.claim_conquista_reward(uuid, uuid) to authenticated;