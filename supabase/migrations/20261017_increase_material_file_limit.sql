-- PDFs maiores são enviados diretamente ao Storage, sem atravessar o limite
-- de corpo das Server Actions do Next.js/Vercel.
update storage.buckets
set file_size_limit = 26214400
where id = 'materiais';
