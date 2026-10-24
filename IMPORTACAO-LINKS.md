# Importar materiais de links externos

A integração usa o painel, autenticação, Supabase Storage e RAG existentes. Não é necessário configurar uma nova chave de serviço ou recriar tabelas.

## Ativação

1. Execute `supabase/migrations/20261021_add_external_material_links.sql` no SQL Editor do Supabase. Ela adiciona somente `source_url` à tabela `aula_materiais`.
2. Execute `npm install` e `npm run dev` dentro de `hub-estudos-app`.
3. Entre no `/admin`, abra uma matéria e edite uma aula existente. A seção **Importar material por link** aparece abaixo do upload.
4. Informe título e link compartilhado como **Qualquer pessoa com o link**. Importações bem-sucedidas aparecem em **Arquivos e indexação**, com acesso à origem.

## Funcionamento

- Acesso anônimo HTTPS, sem cookies ou credenciais Google/Microsoft.
- Google Slides exporta PPTX; Google Docs exporta TXT; Drive e OneDrive/SharePoint precisam permitir download público. Pastas e visualizadores que não retornam arquivos são recusados.
- Aceita também arquivos diretos em endpoints HTTPS do Amazon S3, incluindo links temporários assinados da FIAP. Cole a URL completa: os parâmetros de assinatura são mantidos no download. Se o link expirar ou perder permissão, obtenha um novo link na plataforma de origem.
- Aceita apostilas diretas de `https://on1.fiap.com.br/updown/upload_fiap/`, incluindo PDFs com parâmetros de analytics. A URL é preservada no download e cada redirecionamento continua validado.
- Links aceitam até 8192 caracteres. Reimportar o mesmo arquivo S3 com o mesmo título e uma assinatura renovada atualiza o material existente, sem criar uma nova fonte por causa da assinatura.
- Extração de PDF com camada textual, DOCX, PPTX, TXT e Markdown. Não faz OCR nem importa DOC/PPT antigos.
- Limites: 15 MB de download, 40 MB descompactados, 150 mil caracteres, 25 segundos para acesso e seis redirecionamentos. Todos os destinos passam pela lista de domínios permitidos.
- Nenhum token de IA é consumido antes de validar acesso e texto suficiente. Só depois é salva uma cópia TXT e usado o processamento existente da aula, que gera conteúdo e indexa trechos em `material_chunks`.
- O RAG usa as mesmas funções e regras de publicação das aulas já existentes. O upload mantém seus formatos e limite de 25 MB.
- A origem fica em `aula_materiais.source_url`. O reprocessamento de links consulta novamente o provedor e exige acesso público. A remoção usa a rotina existente para excluir o TXT e os trechos.
- Não há sincronização automática de conteúdo ou permissões após a importação. O resumo existente é mantido para revisão se a origem deixar de responder.

## Verificação

`node --test tests/external-material.test.cjs`, `npm run lint`, `npx tsc --noEmit` e `npm run build`.

O teste completo com provedores e banco requer aplicar a migração e experimentar um link público e um privado no Supabase configurado. Nenhuma migração é executada automaticamente.
