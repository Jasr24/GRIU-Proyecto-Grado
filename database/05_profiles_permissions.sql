-- Permisos mínimos para que un usuario autenticado consulte su propio perfil.
grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;

-- El backend utiliza service_role y necesita consultar las tablas mediante /api/me.
-- Esta clave nunca debe exponerse en el frontend.
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;

drop policy if exists "Usuarios consultan su perfil" on public.profiles;

create policy "Usuarios consultan su perfil"
on public.profiles
for select
to authenticated
using (id = auth.uid());
