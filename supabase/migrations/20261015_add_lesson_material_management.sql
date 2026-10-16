create table if not exists public.aula_materiais (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references public.aulas(id) on delete cascade,
  materia_id uuid not null references public.materias(id) on delete cascade,
  nome text not null,
  arquivo_path text not null,
  tamanho_bytes bigint,
  tipo_mime text,
  status text not null default 'processando' check (status in ('processando', 'indexado', 'erro')),
  erro text,
  total_trechos integer not null default 0,
  criado_em timestamp with time zone not null default now(),
  atualizado_em timestamp with time zone not null default now(),
  indexado_em timestamp with time zone,
  unique (aula_id, nome)
);

create index if not exists aula_materiais_aula_idx on public.aula_materiais(aula_id, criado_em desc);
alter table public.aula_materiais enable row level security;

drop policy if exists "Administradores gerenciam materiais das aulas" on public.aula_materiais;
create policy "Administradores gerenciam materiais das aulas" on public.aula_materiais
for all to authenticated using (true) with check (true);

alter table public.material_chunks
add column if not exists material_id uuid references public.aula_materiais(id) on delete cascade;

create index if not exists material_chunks_material_idx on public.material_chunks(material_id);

with existing_sources as (
  select
    chunks.*,
    count(*) over (partition by chunks.aula_id, chunks.fonte_nome, chunks.arquivo_path) as chunk_count,
    row_number() over (partition by chunks.aula_id, chunks.fonte_nome order by chunks.criado_em desc, chunks.chunk_index desc) as source_rank
  from public.material_chunks chunks
  where chunks.arquivo_path is not null and chunks.fonte_nome is not null
)
insert into public.aula_materiais (aula_id, materia_id, nome, arquivo_path, status, total_trechos, criado_em, atualizado_em, indexado_em)
select
  sources.aula_id,
  sources.materia_id,
  sources.fonte_nome,
  sources.arquivo_path,
  'indexado',
  sources.chunk_count::integer,
  sources.criado_em,
  now(),
  now()
from existing_sources sources
where sources.source_rank = 1
on conflict (aula_id, nome) do update set
  arquivo_path = excluded.arquivo_path,
  status = 'indexado',
  total_trechos = excluded.total_trechos,
  atualizado_em = now(),
  indexado_em = now();

update public.material_chunks chunks
set material_id = materials.id
from public.aula_materiais materials
where chunks.material_id is null
  and materials.aula_id = chunks.aula_id
  and materials.nome = chunks.fonte_nome
  and materials.arquivo_path = chunks.arquivo_path;

delete from public.material_chunks
where arquivo_path is not null and material_id is null;
