import { toggleMateriaAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { createClient } from "@/lib/supabase/server";
import type { Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { DeleteMateriaButton } from "@/components/delete-materia-button";

async function AdminContent() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [cursosResult, materiasResult] = await Promise.all([
    supabase.from("cursos").select("*").order("titulo"),
    supabase
      .from("materias")
      .select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em")
      .order("criado_em", { ascending: false }),
  ]);
  const cursos = (cursosResult.data ?? []) as Curso[];
  const materias = (materiasResult.data ?? []) as Materia[];
  const courseTitles = new Map(cursos.map((curso) => [curso.id, curso.titulo]));
  const error = cursosResult.error || materiasResult.error;

  return (
    <>
      <AdminHeader email={user.email} />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">
              Gerenciamento
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Painel de conteúdo
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Organize seus conteúdos seguindo as três etapas abaixo.
            </p>
          </div>
          <div className="grid w-full gap-3 sm:flex sm:w-auto sm:flex-wrap">
            <Link href="/admin/cursos/novo" className="rounded-lg bg-[#1473f3] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#005de0]">Começar novo curso</Link>
          </div>
        </div>

        <section aria-labelledby="flow-title" className="mt-8 rounded-2xl border border-[#1473f3]/20 bg-[#0d1a2d] p-4 sm:mt-10 sm:rounded-3xl sm:p-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">Como cadastrar</p><h2 id="flow-title" className="mt-2 text-2xl font-black text-white">Curso → Matéria → Aula</h2></div><p className="max-w-xl text-sm leading-6 text-slate-400">O curso reúne várias matérias. Cada matéria contém suas próprias aulas, materiais, resumo, flashcards e quiz.</p></div>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            <li className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="grid size-9 place-items-center rounded-full bg-[#1473f3] font-black text-white">1</span><h3 className="mt-4 font-bold text-white">Crie o curso</h3><p className="mt-2 text-sm leading-6 text-slate-400">Cadastre a formação principal, como “MBA em AI Engineering”.</p><Link href="/admin/cursos/novo" className="mt-4 inline-flex text-sm font-bold text-[#69a7ff]">Criar curso →</Link></li>
            <li className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="grid size-9 place-items-center rounded-full bg-[#1473f3] font-black text-white">2</span><h3 className="mt-4 font-bold text-white">Adicione uma matéria</h3><p className="mt-2 text-sm leading-6 text-slate-400">Crie uma disciplina e escolha a qual curso ela pertence.</p><Link href="/admin/materias/nova" className="mt-4 inline-flex text-sm font-bold text-[#69a7ff]">Criar matéria →</Link></li>
            <li className="rounded-2xl border border-white/10 bg-white/[.03] p-5"><span className="grid size-9 place-items-center rounded-full bg-[#1473f3] font-black text-white">3</span><h3 className="mt-4 font-bold text-white">Organize as aulas</h3><p className="mt-2 text-sm leading-6 text-slate-400">Abra “Conteúdo e aulas” na matéria para incluir PDFs e publicar.</p></li>
          </ol>
        </section>

        {!error && <section className="mt-12" aria-labelledby="courses-title"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1473f3]">Etapa 1</p><h2 id="courses-title" className="mt-1 text-2xl font-black text-slate-950">Cursos cadastrados</h2><p className="mt-2 text-sm text-slate-500">Escolha um curso para adicionar uma matéria diretamente nele.</p></div><Link href="/admin/cursos/novo" className="rounded-xl border border-[#1473f3]/30 px-4 py-2.5 text-sm font-bold text-[#1473f3] hover:bg-blue-50">+ Novo curso</Link></div>
          {cursos.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{cursos.map((curso) => { const count = materias.filter((materia) => materia.curso_id === curso.id).length; return <article key={curso.id} className="rounded-2xl border border-white/10 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[#1473f3]">{curso.publicado === false ? "Rascunho" : "Publicado"}</p><h3 className="mt-2 font-bold text-slate-900">{curso.titulo}</h3><p className="mt-2 text-sm text-slate-500">{count} {count === 1 ? "matéria cadastrada" : "matérias cadastradas"}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 font-black text-[#1473f3]">{count}</span></div><div className="mt-5 flex flex-wrap gap-2"><Link href={`/admin/materias/nova?curso=${curso.id}`} className="inline-flex rounded-lg bg-[#1473f3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005de0]">+ Adicionar matéria</Link><Link href={`/admin/cursos/${curso.id}`} className="inline-flex rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Editar curso</Link></div></article>; })}</div> : <div className="mt-5 rounded-2xl border border-dashed border-slate-300 p-7 text-center"><p className="font-bold text-slate-700">Você ainda não cadastrou nenhum curso.</p><p className="mt-2 text-sm text-slate-500">Comece pelo curso; em seguida, o sistema levará você ao cadastro da primeira matéria.</p></div>}
        </section>}

        {!error && <div className="mt-12 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1473f3]">Etapas 2 e 3</p><h2 className="mt-1 text-2xl font-black text-slate-950">Matérias e aulas</h2><p className="mt-2 text-sm text-slate-500">Gerencie os dados da disciplina, suas aulas, materiais e publicação.</p></div><Link href="/admin/materias/nova" className="rounded-xl bg-[#1473f3] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#005de0]">+ Nova matéria</Link></div>}

        {error ? (
          <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 p-7 text-sm text-rose-700">
            Não foi possível carregar os dados administrativos. Verifique as
            políticas RLS para usuários autenticados.
          </div>
        ) : materias.length ? (
          <div className="mt-5 grid gap-4">
            {materias.map((materia) => (
              <article
                key={materia.id}
                className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-white p-5 transition hover:border-[#1473f3]/35 sm:flex-row sm:items-center sm:p-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${materia.publicado ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                    >
                      {materia.publicado ? "Publicado" : "Rascunho"}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {courseTitles.get(materia.curso_id) ??
                        "Curso não encontrado"}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold text-slate-900">
                    {materia.titulo}
                  </h2>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {materia.descricao || "Sem descrição"}
                  </p>
                </div>
                <div className="grid w-full gap-2 min-[430px]:flex min-[430px]:flex-wrap sm:w-auto">
                  <Link
                    href={`/admin/materias/${materia.id}`}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1473f3]"
                  >
                     Conteúdo e aulas
                  </Link>
                  <form action={toggleMateriaAction}>
                    <input type="hidden" name="id" value={materia.id} />
                    <input
                      type="hidden"
                      name="curso_id"
                      value={materia.curso_id}
                    />
                    <input
                      type="hidden"
                      name="publicado"
                      value={String(materia.publicado)}
                    />
                    <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100">
                      {materia.publicado ? "Despublicar" : "Publicar"}
                    </button>
                  </form>
                  {materia.publicado && (
                    <Link
                      href={`/materias/${materia.id}`}
                      className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#1473f3] hover:bg-blue-50"
                    >
                      Ver no site
                    </Link>
                  )}
                  <DeleteMateriaButton id={materia.id} titulo={materia.titulo} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Nenhuma matéria cadastrada
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Escolha um curso acima e clique em “Adicionar matéria neste curso”.
            </p>
          </div>
        )}
      </main>
    </>
  );
}

function AdminFallback() {
  return (
    <main className="grid min-h-screen place-items-center">
      <p className="text-sm font-semibold text-slate-500">
        Carregando painel...
      </p>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}
