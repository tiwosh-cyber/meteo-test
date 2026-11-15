-- METEO TEST · Lot 1 · F-003/004/005/006 · AC-006–015
-- Schéma minimal, rôle Manager protégé, RLS et seed des trois villes fixes.

create table public.weather (
  city text primary key check (city in ('Paris', 'Lyon', 'Marseille')),
  -- numeric accepte Infinity/NaN (PG14+) : les bornes ci-dessous les excluent
  temperature numeric not null check (temperature > '-Infinity' and temperature < 'Infinity'),
  condition text not null check (condition in ('Ensoleillé', 'Nuageux', 'Pluvieux', 'Orageux')),
  humidity numeric not null check (humidity between 0 and 100)
);

-- Source protégée du rôle : aucune politique d'écriture client, ajout par SQL admin uniquement.
create table public.managers (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.managers where user_id = (select auth.uid()));
$$;

alter table public.weather enable row level security;
alter table public.managers enable row level security;

revoke all on public.weather, public.managers from anon, authenticated;
grant select on public.weather to authenticated;
grant update (temperature, condition, humidity) on public.weather to authenticated;
grant select on public.managers to authenticated;
revoke execute on function public.is_manager() from public, anon;
grant execute on function public.is_manager() to authenticated;

create policy "weather: lecture authentifiée" on public.weather
  for select to authenticated using (true);
create policy "weather: modification Manager" on public.weather
  for update to authenticated using ((select public.is_manager())) with check ((select public.is_manager()));
create policy "managers: lecture de sa propre ligne" on public.managers
  for select to authenticated using (user_id = (select auth.uid()));

insert into public.weather (city, temperature, condition, humidity) values
  ('Paris', 22, 'Ensoleillé', 45),
  ('Lyon', 18, 'Nuageux', 60),
  ('Marseille', 26, 'Ensoleillé', 35);
