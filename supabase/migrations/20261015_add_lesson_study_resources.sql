alter table public.aulas
  add column if not exists conceitos jsonb not null default '[]'::jsonb,
  add column if not exists glossario jsonb not null default '[]'::jsonb,
  add column if not exists pontos_prova text[] not null default '{}',
  add column if not exists flashcards jsonb not null default '[]'::jsonb,
  add column if not exists quiz jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'aulas_conceitos_array_check') then
    alter table public.aulas add constraint aulas_conceitos_array_check check (jsonb_typeof(conceitos) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'aulas_glossario_array_check') then
    alter table public.aulas add constraint aulas_glossario_array_check check (jsonb_typeof(glossario) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'aulas_flashcards_array_check') then
    alter table public.aulas add constraint aulas_flashcards_array_check check (jsonb_typeof(flashcards) = 'array');
  end if;
  if not exists (select 1 from pg_constraint where conname = 'aulas_quiz_array_check') then
    alter table public.aulas add constraint aulas_quiz_array_check check (jsonb_typeof(quiz) = 'array');
  end if;
end $$;

comment on column public.aulas.conceitos is 'Conceitos-chave gerados ou revisados para a aula.';
comment on column public.aulas.glossario is 'Termos e definições associados à aula.';
comment on column public.aulas.pontos_prova is 'Pontos de atenção e revisão para avaliação.';
comment on column public.aulas.flashcards is 'Cartões de memorização com frente e verso.';
comment on column public.aulas.quiz is 'Questões de múltipla escolha com resposta e explicação.';
