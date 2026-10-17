import { CourseExplorer } from "@/components/course-explorer";
import { DataError } from "@/components/data-error";
import { EmptyCourses } from "@/components/empty-courses";
import { Header } from "@/components/header";
import { HomeOverview } from "@/components/home-overview";
import { createPublicClient } from "@/lib/supabase/public";
import type { Aula, Curso, Materia } from "@/lib/types";
import { cacheLife } from "next/cache";

async function loadHomeData() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    const supabase = createPublicClient();
    const [coursesResult, subjectsResult, lessonsResult] = await Promise.all([
      supabase.from("cursos").select("*").order("titulo", { ascending: true }),
      supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em").eq("publicado", true),
      supabase.from("aulas").select("id, materia_id, titulo, conceitos, glossario, flashcards, quiz, criado_em, atualizado_em").eq("publicado", true).order("atualizado_em", { ascending: false }),
    ]);
    if (coursesResult.error || subjectsResult.error || lessonsResult.error) return { cursos: [] as Curso[], error: "A consulta ao Supabase falhou. Confira as permissões de leitura e tente novamente." };
    const cursos = (coursesResult.data ?? []) as Curso[];
    const materias = (subjectsResult.data ?? []) as Materia[];
    const aulas = (lessonsResult.data ?? []) as Pick<Aula, "id" | "materia_id" | "titulo" | "conceitos" | "glossario" | "flashcards" | "quiz" | "criado_em" | "atualizado_em">[];
    const subjectMap = new Map(materias.map((subject) => [subject.id, subject]));
    const stats = { cursos: cursos.length, materias: materias.length, aulas: aulas.length, conceitos: aulas.reduce((sum, lesson) => sum + (lesson.conceitos?.length ?? 0), 0), termos: aulas.reduce((sum, lesson) => sum + (lesson.glossario?.length ?? 0), 0), flashcards: aulas.reduce((sum, lesson) => sum + (lesson.flashcards?.length ?? 0), 0), questoes: aulas.reduce((sum, lesson) => sum + (lesson.quiz?.length ?? 0), 0) };
    const recent = aulas.slice(0, 5).flatMap((lesson) => { const subject = subjectMap.get(lesson.materia_id); return subject ? [{ id: lesson.id, materiaId: subject.id, titulo: lesson.titulo, materiaTitulo: subject.titulo, atualizadoEm: lesson.atualizado_em || lesson.criado_em }] : []; });
    return { cursos, stats, recent };
  } catch (error) {
    return { cursos: [] as Curso[], error: error instanceof Error ? error.message : "Ocorreu um erro inesperado." };
  }
}

export default async function Home() {
  const { cursos, stats, recent, error } = await loadHomeData();
  return (
    <main className="min-h-screen">
      <Header />
      <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:gap-14 sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,.75fr)] lg:items-center lg:pb-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1473f3]/30 bg-[#1473f3]/10 px-4 py-2 text-xs font-bold tracking-[.08em] text-[#9bc5ff]"><span className="size-1.5 rounded-full bg-[#1473f3] shadow-[0_0_12px_rgba(20,115,243,.8)]" /> SUA BASE DE CONHECIMENTO</span>
          <h1 className="mt-7 text-3xl font-black leading-[1.08] tracking-[-.045em] text-slate-950 min-[360px]:text-4xl sm:text-6xl">Aprenda, organize e <span className="text-[#1473f3]">transforme conteúdo.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">Um ambiente pessoal para estruturar cursos, sintetizar materiais com IA e consultar seus estudos sem perder o contexto.</p>
          <a href="#cursos" className="mt-8 inline-flex w-full justify-center rounded-lg bg-[#1473f3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#005de0] focus:outline-none focus:ring-2 focus:ring-[#69a7ff] focus:ring-offset-2 focus:ring-offset-[#0f0f11] sm:w-auto">Explorar cursos <span className="ml-2" aria-hidden="true">→</span></a>
        </div>
        <div aria-hidden="true" className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0d1a2d] shadow-[0_24px_70px_rgba(0,0,0,.35)]">
          <div className="flex items-center gap-2 border-b border-white/10 px-5 py-4"><span className="size-2 rounded-full bg-white/20" /><span className="size-2 rounded-full bg-white/15" /><span className="size-2 rounded-full bg-white/10" /><span className="ml-auto font-mono text-[10px] text-slate-400">study@hub ~</span></div>
          <div className="space-y-5 p-6 font-mono text-sm sm:p-8"><p className="text-[#69a7ff]">$ trilha --organizar</p><div className="border-l-2 border-[#1473f3] bg-[#1473f3]/[.08] px-4 py-4 text-slate-700">conteúdo → resumo → revisão</div><div><p className="text-slate-400">{"// seus materiais"}</p><p className="mt-2 leading-7 text-slate-700">cursos · matérias · aulas</p></div><div><p className="text-slate-400">{"// inteligência aplicada"}</p><p className="mt-2 leading-7 text-slate-700">RAG · síntese · contexto</p></div></div>
        </div>
      </section>
      {!error && stats && recent && <HomeOverview stats={stats} recent={recent} />}
      {error ? <DataError message={error} /> : cursos.length ? <CourseExplorer cursos={cursos} /> : <EmptyCourses />}
    </main>
  );
}
