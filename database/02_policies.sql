create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.profiles
        where id = auth.uid()
        and role = 'admin'
    );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', 'Usuario GRIU')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

grant execute on function public.is_admin() to authenticated;

create policy "Usuarios consultan su perfil"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "Usuarios actualizan su perfil"
on public.profiles
for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

create policy "Usuarios consultan categorias"
on public.incident_categories
for select
to authenticated
using (true);

create policy "Ciudadanos crean reportes"
on public.reports
for insert
to authenticated
with check (reporter_id = auth.uid());

create policy "Ciudadanos y administradores consultan reportes"
on public.reports
for select
to authenticated
using (reporter_id = auth.uid() or public.is_admin());

create policy "Administradores actualizan reportes"
on public.reports
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Usuarios consultan seguimientos autorizados"
on public.report_updates
for select
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.reports r
        where r.id = report_id
        and r.reporter_id = auth.uid()
    )
);

create policy "Administradores crean seguimientos"
on public.report_updates
for insert
to authenticated
with check (public.is_admin());

create policy "Usuarios consultan adjuntos autorizados"
on public.report_attachments
for select
to authenticated
using (
    public.is_admin()
    or exists (
        select 1
        from public.reports r
        where r.id = report_id
        and r.reporter_id = auth.uid()
    )
);

create policy "Usuarios cargan adjuntos de sus reportes"
on public.report_attachments
for insert
to authenticated
with check (
    uploaded_by = auth.uid()
    and exists (
        select 1
        from public.reports r
        where r.id = report_id
        and r.reporter_id = auth.uid()
    )
);