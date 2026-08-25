-- Migration 0003 — remove pgcrypto dependency from the signup trigger.
-- Local stacks expose pgcrypto under "extensions", so gen_random_bytes was
-- unresolvable inside the definer function. md5(random()) is core-PG safe.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username)
  values (new.id, 'typer_' || substr(md5(clock_timestamp()::text || new.id::text), 1, 8))
  on conflict (id) do nothing;
  return new;
end; $$;
