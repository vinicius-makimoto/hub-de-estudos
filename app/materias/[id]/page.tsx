import { BookIcon } from "@/components/icons";
import { Header } from "@/components/header";
import { StudyProgress } from "@/components/study-progress";
import { createPublicClient } from "@/lib/supabase/public";
import type { Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

type SubjectData = {
  materia: Materia | null;
  curso: Curso | null;
  error?: string;
};

async function loadSubjectData(id: string): Promise<SubjectData> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    const supabase = createPublicClient();
    const materiaResult = await supabase
      .from("materias")
      .select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em")
      .eq("id", id)
      .eq("publicado", true)
      .maybeSingle();

    if (materiaResult.error) {
      return { materia: null, curso: null, error: "Não foi possível consultar esta matéria. Confira as permissões de leitura no Supabase." };
    }

    if (!materiaResult.data) return { materia: null, curso: null };

    const materia = materiaResult.data as Materia;
    const cursoResult = await supabase.from("cursos").select("*").eq("id", materia.curso_id).maybeSingle();

    if (cursoResult.error) {
      return { materia: null, curso: null, error: "A matéria foi encontrada, mas não foi possível carregar seu curso." };
    }

    return { materia, curso: cursoResult.data as Curso | null };
  } catch (error) {
    return {
      materia: null,
      curso: null,
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
    };
  }
}

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { materia, curso, error } = await loadSubjectData(id);

  if (!error && !materia) notFound();

  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <Link href={curso ? `/cursos/${curso.id}` : "/"} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#6750e6]">
          <span aria-hidden="true">←</span> {curso ? "Voltar às matérias" : "Voltar aos cursos"}
        </Link>

        {error ? (
          <section className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-xl font-bold text-rose-600">!</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Não foi possível carregar a matéria</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">{error}</p>
          </section>
        ) : materia ? (
          <>
            <header className="mt-8 border-b border-slate-200 pb-10">
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#6750e6]">{curso?.titulo || "Matéria"}</p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight tracking-[-.04em] text-slate-950 sm:text-6xl">{materia.titulo}</h1>
              {materia.descricao && <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{materia.descricao}</p>}
            </header>

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(30,41,59,.06)] sm:p-10">
                <div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-violet-50 text-[#6750e6]"><BookIcon className="size-6" /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Material de estudo</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">Conteúdo</h2>
                  </div>
                </div>
                {materia.conteudo ? (
                  <div className="whitespace-pre-wrap text-base leading-8 text-slate-700">{materia.conteudo}</div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
                    <h2 className="font-bold text-slate-900">Conteúdo em preparação</h2>
                    <p className="mt-2 text-sm text-slate-500">O material desta matéria será disponibilizado em breve.</p>
                  </div>
                )}
              </article>

              <aside className="lg:sticky lg:top-6">
                <StudyProgress materiaId={materia.id} />
                <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
                  <p className="font-bold text-slate-800">Dica de estudo</p>
                  <p className="mt-2 leading-6">Leia o conteúdo com calma e marque a matéria como concluída quando finalizar.</p>
                </div>
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
