# Hub de Estudos

O **Hub de Estudos** é uma aplicação web para organizar cursos e apoiar o aprendizado com aulas geradas sob demanda. A plataforma reúne cursos e conteúdos em um só lugar e permite explorar matérias, estudar tópicos específicos e revisar conceitos com materiais interativos.

## Funcionalidades

- **Exploração de cursos:** consulta e exibição dos cursos cadastrados no Supabase.
- **Aulas sob demanda:** geração de conteúdo didático a partir de um tema informado pelo aluno.
- **Revisão integrada:** cada aula pode incluir conceitos principais, glossário, pontos de prova, flashcards e quiz com alternativas e explicações.
- **Materiais de referência:** administradores podem importar links públicos para que seus conteúdos sejam considerados na geração das aulas.
- **Indicação de fontes:** quando materiais importados são usados como referência, a resposta da API inclui seus títulos e links.

## Aplicações técnicas

### Geração assistida por IA

A rota `POST /api/gerar-aula` valida o tema enviado, consulta materiais relevantes e solicita a geração de uma aula à API da Groq. O modelo é configurável por variável de ambiente; por padrão, o projeto usa `llama-3.3-70b-versatile`.

A resposta é estruturada em JSON e validada no servidor antes de ser devolvida à aplicação. As referências recuperadas são tratadas como dados de apoio, e não como instruções para o modelo.

### Recuperação de materiais (RAG)

O projeto oferece uma implementação de recuperação de conteúdo para apoiar a geração de aulas:

1. O administrador importa um link público pela área `/admin`.
2. O servidor extrai o texto dos formatos compatíveis e divide o conteúdo em trechos.
3. Os trechos são armazenados no Supabase e indexados para busca textual em português.
4. Ao gerar uma aula, o sistema recupera até quatro trechos relacionados ao tema e os fornece como contexto à Groq.

A busca usa recursos de texto completo do PostgreSQL. **Não utiliza embeddings nem busca vetorial.** Links importados são cópias do conteúdo disponível no momento da importação; alterações posteriores no arquivo original não são sincronizadas automaticamente.

### Importação e segurança

A importação aceita PDF com texto, DOCX, PPTX e TXT, além de formatos exportáveis ou baixáveis em fontes públicas do Google Drive, Google Docs, Google Slides, OneDrive e SharePoint. Não realiza OCR; documentos digitalizados sem camada de texto e formatos não compatíveis não são indexados.

As requisições de importação são feitas sem credenciais do provedor. O servidor valida os destinos e aplica limites de tamanho, tempo e redirecionamento. O cadastro do material e de seus trechos é feito em uma única transação para evitar gravações parciais.

O acesso administrativo usa Supabase Auth e exige o papel `admin` em `app_metadata`. A chave `SUPABASE_SERVICE_ROLE_KEY` e a chave da Groq são usadas exclusivamente no servidor e não devem ser expostas ao navegador. O conteúdo importado é utilizado pela geração pública de aulas; importe somente materiais apropriados para todos os alunos.

### Persistência e controle de acesso

O Supabase fornece autenticação e persistência. A migração `supabase/migrations/202610210001_external_materials.sql` cria as tabelas para materiais externos e trechos, habilita políticas de Row Level Security e configura funções para importação transacional e busca server-side.

A migração é aditiva e precisa ser aplicada manualmente ao projeto Supabase de destino.

## Tecnologias

- **Next.js 16** com App Router e endpoints de API no servidor
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** para autenticação, banco PostgreSQL, RLS e busca textual
- **Groq API** para geração de conteúdo didático
- **Mammoth**, **JSZip** e **pdf-parse** para extração de conteúdo de documentos

## Configuração local

Requisitos: Node.js e um projeto Supabase configurado.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env.local` e configure as variáveis:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima-publica
   GROQ_API_KEY=sua-chave-groq-apenas-no-servidor
   GROQ_MODEL=llama-3.3-70b-versatile
   SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-apenas-no-servidor
   ```

3. Aplique a migração no projeto Supabase de destino e configure um usuário administrador com `app_metadata.role = "admin"` pelo Dashboard ou Admin API do Supabase.

4. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

A aplicação ficará disponível em `http://localhost:3000`. A área administrativa fica em `/admin`.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção |
| `npm run start` | Inicia a aplicação de produção |
| `npm run lint` | Executa o ESLint |

## Estrutura principal

```text
app/
  admin/                 Área administrativa de materiais
  api/
    admin/materiais/     Endpoint de importação de materiais
    gerar-aula/          Endpoint de geração de aulas
  aulas/                 Páginas de aulas
  cursos/                Páginas de cursos
components/               Componentes da interface
lib/                      Integrações, tipos e lógica de negócio
supabase/migrations/      Migrações do banco de dados
tests/                    Testes da importação de materiais
```

Para detalhes do fluxo de importação, limites técnicos e ativação no Supabase, consulte [`IMPORTACAO.md`](./IMPORTACAO.md).
