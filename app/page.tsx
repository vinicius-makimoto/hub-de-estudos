import { CourseExplorer } from "@/components/course-explorer";
import { DataError } from "@/components/data-error";
import { EmptyCourses } from "@/components/empty-courses";
import { Header } from "@/components/header";
import { createPublicClient } from "@/lib/supabase/public";
import type { Curso } from "@/lib/types";
import { cacheLife } from "next/cache";

async function loadCursos(): Promise<{ cursos: Curso[]; error?: string }> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase.from("cursos").select("*").order("titulo", { ascending: true });
    if (error) return { cursos: [], error: "A consulta ao Supabase falhou. Confira as permissões de leitura da tabela e tente novamente." };
    return { cursos: (data ?? []) as Curso[] };
  } catch (error) {
    return { cursos: [], error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export default async function Home() {
  const { cursos, error } = await loadCursos();
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto max-w-6xl px-5 pb-14 pt-16 sm:px-8 sm:pb-20 sm:pt-24">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full border border-violet-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[.16em] text-[#6750e6] shadow-sm">Aprenda no seu ritmo</span>
          <h1 className="mt-7 text-4xl font-black leading-[1.08] tracking-[-.04em] text-slate-950 sm:text-6xl">Tudo o que você aprende, <span className="text-[#6750e6]">em um só lugar.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Organize seus cursos, encontre rapidamente o que precisa e avance pelas matérias com clareza.</p>
          <a href="#cursos" className="mt-8 inline-flex rounded-2xl bg-[#6750e6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-[#4936c9]">Explorar cursos</a>
        </div>
      </section>
      {error ? <DataError message={error} /> : cursos.length ? <CourseExplorer cursos={cursos} /> : <EmptyCourses />}
    </main>
  );
}
