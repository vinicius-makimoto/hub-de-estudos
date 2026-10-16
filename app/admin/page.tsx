import { toggleMateriaAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { createClient } from "@/lib/supabase/server";
import type { Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

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
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">
              Gerenciamento
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Matérias
            </h1>
            <p className="mt-3 text-sm text-slate-500">
              Crie, edite e controle o que aparece no Hub de Estudos.
            </p>
          </div>
          <Link
            href="/admin/materias/nova"
            className="rounded-lg bg-[#1473f3] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#005de0]"
          >
            + Nova matéria
          </Link>
        </div>

        {error ? (
          <div className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 p-7 text-sm text-rose-700">
            Não foi possível carregar os dados administrativos. Verifique as
            políticas RLS para usuários autenticados.
          </div>
        ) : materias.length ? (
          <div className="mt-10 grid gap-4">
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
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/materias/${materia.id}`}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-[#1473f3]"
                  >
                    Editar
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
                      Visualizar
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              Nenhuma matéria cadastrada
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Crie a primeira matéria pelo painel.
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
