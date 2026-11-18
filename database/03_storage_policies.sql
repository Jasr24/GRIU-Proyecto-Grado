create policy "Usuarios cargan fotografias propias"
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'report-photos'
    and (storage.foldername(name))[1] = (auth.uid())::text
);

create policy "Usuarios consultan fotografias autorizadas"
on storage.objects
for select
to authenticated
using (
    bucket_id = 'report-photos'
    and (
        (storage.foldername(name))[1] = (auth.uid())::text
        or public.is_admin()
    )
);

create policy "Usuarios eliminan fotografias propias"
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'report-photos'
    and (
        (storage.foldername(name))[1] = (auth.uid())::text
        or public.is_admin()
    )
);