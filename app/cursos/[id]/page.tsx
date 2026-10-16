import { BookIcon } from "@/components/icons";
import { Header } from "@/components/header";
import { createPublicClient } from "@/lib/supabase/public";
import type { Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";

type CourseData = {
  curso: Curso | null;
  materias: Materia[];
  error?: string;
};

async function loadCourseData(id: string): Promise<CourseData> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    const supabase = createPublicClient();
    const [cursoResult, materiasResult] = await Promise.all([
      supabase.from("cursos").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("materias")
        .select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em")
        .eq("curso_id", id)
        .eq("publicado", true)
        .order("criado_em", { ascending: true }),
    ]);

    if (cursoResult.error || materiasResult.error) {
      return {
        curso: null,
        materias: [],
        error: "Não foi possível consultar este curso. Confira as permissões de leitura no Supabase e tente novamente.",
      };
    }

    return {
      curso: cursoResult.data as Curso | null,
      materias: (materiasResult.data ?? []) as Materia[],
    };
  } catch (error) {
    return {
      curso: null,
      materias: [],
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
    };
  }
}

export default async function MateriasPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { curso, materias, error } = await loadCourseData(id);

  if (!error && !curso) notFound();

  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#1473f3]">
          <span aria-hidden="true">←</span> Voltar aos cursos
        </Link>

        {error ? (
          <section className="mt-10 rounded-3xl border border-rose-200 bg-rose-50 px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-xl font-bold text-rose-600">!</span>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Não foi possível carregar as matérias</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">{error}</p>
          </section>
        ) : (
          <>
            <section className="relative mt-8 overflow-hidden rounded-2xl border border-[#1473f3]/30 bg-[#0d1a2d] p-8 text-white shadow-[0_24px_70px_rgba(0,0,0,.3)] sm:p-12">
              <div aria-hidden="true" className="absolute -right-20 -top-28 size-80 rounded-full bg-[#1473f3]/15 blur-3xl" />
              <p className="relative font-mono text-xs font-bold uppercase tracking-[.2em] text-[#69a7ff]">{"// Curso"}</p>
              <h1 className="relative mt-4 max-w-3xl text-3xl font-black tracking-[-.03em] sm:text-5xl">{curso?.titulo}</h1>
              <p className="relative mt-5 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                {curso?.descricao || "Acesse as matérias publicadas e avance na sua jornada de aprendizagem."}
              </p>
              <div className="relative mt-8 inline-flex rounded-md border border-white/10 bg-white/[.04] px-4 py-2 font-mono text-xs font-bold text-[#9bc5ff]">
                {materias.length} {materias.length === 1 ? "matéria publicada" : "matérias publicadas"}
              </div>
            </section>

            <section className="mt-12" aria-labelledby="materias-heading">
              <div className="mb-6">
                <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Conteúdo do curso</p>
                <h2 id="materias-heading" className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Matérias</h2>
              </div>

              {materias.length ? (
                <ol className="grid gap-4">
                  {materias.map((materia, index) => (
                    <li key={materia.id}>
                      <Link href={`/materias/${materia.id}`} className="group flex gap-4 rounded-2xl border border-white/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#1473f3]/45 hover:bg-[#162945] focus:outline-none sm:items-center sm:gap-6 sm:p-6">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-[#1473f3]">{String(index + 1).padStart(2, "0")}</span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-bold text-slate-900">{materia.titulo}</h3>
                          <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{materia.descricao || "Conteúdo disponível para estudo."}</p>
                        </div>
                        <BookIcon className="hidden size-6 shrink-0 text-slate-300 transition group-hover:text-[#1473f3] sm:block" />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
                  <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#1473f3]"><BookIcon className="size-7" /></span>
                  <h3 className="mt-5 text-xl font-bold text-slate-900">Nenhuma matéria publicada</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">As matérias deste curso aparecerão aqui assim que forem publicadas.</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
