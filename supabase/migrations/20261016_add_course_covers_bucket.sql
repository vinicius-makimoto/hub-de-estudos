insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('capas-cursos', 'capas-cursos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Leitura pública de capas dos cursos" on storage.objects;
create policy "Leitura pública de capas dos cursos" on storage.objects
for select using (bucket_id = 'capas-cursos');

drop policy if exists "Administradores enviam capas dos cursos" on storage.objects;
create policy "Administradores enviam capas dos cursos" on storage.objects
for insert to authenticated with check (bucket_id = 'capas-cursos');

drop policy if exists "Administradores atualizam capas dos cursos" on storage.objects;
create policy "Administradores atualizam capas dos cursos" on storage.objects
for update to authenticated using (bucket_id = 'capas-cursos') with check (bucket_id = 'capas-cursos');

drop policy if exists "Administradores removem capas dos cursos" on storage.objects;
create policy "Administradores removem capas dos cursos" on storage.objects
for delete to authenticated using (bucket_id = 'capas-cursos');
