-- Additive: preserve all existing uploads, chunks, policies and chat retrieval.
alter table public.aula_materiais add column if not exists source_url text;
comment on column public.aula_materiais.source_url is 'Original public source URL; null for uploaded files. arquivo_path stores an extracted TXT snapshot for external links.';
