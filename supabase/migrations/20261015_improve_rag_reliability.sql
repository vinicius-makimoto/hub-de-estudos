create table if not exists public.chat_interactions (
  id uuid primary key default gen_random_uuid(),
  materia_id uuid not null references public.materias(id) on delete cascade,
  pergunta text not null check (char_length(pergunta) between 1 and 500),
  resposta text not null check (char_length(resposta) between 1 and 12000),
  chunk_ids uuid[] not null default '{}',
  fundamentada boolean not null default false,
  feedback smallint check (feedback in (-1, 1)),
  criado_em timestamp with time zone not null default now()
);

create index if not exists chat_interactions_materia_idx on public.chat_interactions(materia_id, criado_em desc);
alter table public.chat_interactions enable row level security;

create or replace function public.record_chat_interaction(
  target_materia_id uuid,
  user_question text,
  assistant_answer text,
  source_chunk_ids uuid[],
  is_grounded boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare new_id uuid;
begin
  if char_length(trim(user_question)) not between 1 and 500 or char_length(trim(assistant_answer)) not between 1 and 12000 then
    raise exception 'invalid chat interaction';
  end if;
  if not exists (select 1 from public.materias where id = target_materia_id and publicado = true) then
    raise exception 'subject unavailable';
  end if;
  insert into public.chat_interactions (materia_id, pergunta, resposta, chunk_ids, fundamentada)
  values (target_materia_id, trim(user_question), trim(assistant_answer), coalesce(source_chunk_ids, '{}'), is_grounded)
  returning id into new_id;
  return new_id;
end;
$$;

create or replace function public.submit_chat_feedback(interaction_id uuid, feedback_rating smallint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if feedback_rating not in (-1, 1) then raise exception 'invalid feedback'; end if;
  update public.chat_interactions set feedback = feedback_rating where id = interaction_id;
end;
$$;

revoke all on function public.record_chat_interaction(uuid, text, text, uuid[], boolean) from public;
revoke all on function public.submit_chat_feedback(uuid, smallint) from public;
grant execute on function public.record_chat_interaction(uuid, text, text, uuid[], boolean) to anon, authenticated;
grant execute on function public.submit_chat_feedback(uuid, smallint) to anon, authenticated;

create or replace function public.search_material_chunks(search_query text, target_materia_id uuid, match_count integer default 8)
returns table (chunk_id uuid, aula_id uuid, aula_titulo text, materia_id uuid, materia_titulo text, conteudo text, fonte_nome text, rank real)
language sql stable security invoker set search_path = public
as $$
  with lexemes as (
    select distinct unnest(tsvector_to_array(to_tsvector('portuguese', left(trim(search_query), 900)))) as word
  ), query as (
    select to_tsquery('portuguese', string_agg(word, ' | ')) as value from lexemes
  )
  select chunks.id, chunks.aula_id, aulas.titulo, chunks.materia_id, materias.titulo, chunks.conteudo, chunks.fonte_nome,
    ts_rank_cd(chunks.search_vector, query.value, 32)::real as rank
  from public.material_chunks chunks
  join public.aulas on aulas.id = chunks.aula_id
  join public.materias on materias.id = chunks.materia_id
  cross join query
  where chunks.materia_id = target_materia_id and aulas.publicado = true and query.value is not null and chunks.search_vector @@ query.value
  order by rank desc, chunks.chunk_index asc
  limit greatest(1, least(match_count, 12));
$$;
