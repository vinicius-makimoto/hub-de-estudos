create table if not exists public.material_chunks (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  chunk_index integer not null,
  conteudo text not null,
  fonte_nome text,
  arquivo_path text,
  criado_em timestamp with time zone not null default now(),
  search_vector tsvector generated always as (to_tsvector('portuguese', coalesce(conteudo, ''))) stored,
  unique (aula_id, chunk_index)
);

create index if not exists material_chunks_search_idx on public.material_chunks using gin(search_vector);
create index if not exists material_chunks_materia_idx on public.material_chunks(materia_id);
create index if not exists material_chunks_aula_idx on public.material_chunks(aula_id);

alter table public.material_chunks enable row level security;

drop policy if exists "Leitura pública de trechos publicados" on public.material_chunks;
create policy "Leitura pública de trechos publicados" on public.material_chunks
for select using (
  exists (
    select 1 from public.aulas
    where aulas.id = material_chunks.aula_id and aulas.publicado = true
  )
);

drop policy if exists "Administradores gerenciam trechos" on public.material_chunks;
create policy "Administradores gerenciam trechos" on public.material_chunks
for all to authenticated using (true) with check (true);

create or replace function public.search_material_chunks(
  search_query text,
  target_materia_id uuid,
  match_count integer default 6
)
returns table (
  chunk_id uuid,
  aula_id uuid,
  aula_titulo text,
  materia_id uuid,
  materia_titulo text,
  conteudo text,
  fonte_nome text,
  rank real
)
language sql
stable
security invoker
set search_path = public
as $$
  with query as (
    select websearch_to_tsquery('portuguese', trim(search_query)) as value
  )
  select
    chunks.id,
    chunks.aula_id,
    aulas.titulo,
    chunks.materia_id,
    materias.titulo,
    chunks.conteudo,
    chunks.fonte_nome,
    ts_rank_cd(chunks.search_vector, query.value) as rank
  from public.material_chunks as chunks
  join public.aulas on aulas.id = chunks.aula_id
  join public.materias on materias.id = chunks.materia_id
  cross join query
  where chunks.materia_id = target_materia_id
    and aulas.publicado = true
    and chunks.search_vector @@ query.value
  order by rank desc, chunks.chunk_index asc
  limit greatest(1, least(match_count, 10));
$$;

grant execute on function public.search_material_chunks(text, uuid, integer) to anon, authenticated;
