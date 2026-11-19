alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists document_type text,
  add column if not exists document_number text,
  add column if not exists consent_at timestamptz;

create unique index if not exists profiles_document_number_unique
on public.profiles (document_number)
where document_number is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    first_name,
    last_name,
    document_type,
    document_number,
    phone,
    consent_at
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Usuario GRIU'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'document_type',
    new.raw_user_meta_data->>'document_number',
    new.raw_user_meta_data->>'phone',
    case
      when coalesce((new.raw_user_meta_data->>'consent_accepted')::boolean, false)
      then now()
      else null
    end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    document_type = excluded.document_type,
    document_number = excluded.document_number,
    phone = excluded.phone,
    consent_at = excluded.consent_at;

  return new;
end;
$$;
