alter table public.materias
  add column if not exists professor text,
  add column if not exists total_aulas integer,
  add column if not exists avaliacao text,
  add column if not exists bibliografia text;

alter table public.aulas
  add column if not exists planejada boolean not null default false,
  add column if not exists data_prevista date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'materias_total_aulas_check') then
    alter table public.materias add constraint materias_total_aulas_check check (total_aulas is null or total_aulas >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'aulas_publicacao_status_check') then
    alter table public.aulas add constraint aulas_publicacao_status_check check (not (planejada and publicado));
  end if;
end $$;

comment on column public.materias.professor is 'Professor ou responsável pela matéria.';
comment on column public.materias.total_aulas is 'Quantidade planejada de aulas.';
comment on column public.materias.avaliacao is 'Método e critérios de avaliação.';
comment on column public.materias.bibliografia is 'Bibliografia e referências, uma por linha.';
comment on column public.aulas.planejada is 'Indica aula futura visível como em breve.';
comment on column public.aulas.data_prevista is 'Data prevista para disponibilização da aula.';
