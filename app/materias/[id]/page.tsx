import { BookIcon } from "@/components/icons";
import { Header } from "@/components/header";
import { MarkdownContent } from "@/components/markdown-content";
import { StudyTools } from "@/components/study-tools";
import { SubjectToc } from "@/components/subject-toc";
import { createPublicClient } from "@/lib/supabase/public";
import type { Aula, Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import { withoutEmbeddedReview } from "@/lib/lesson-content";

type SubjectData = {
  materia: Materia | null;
  curso: Curso | null;
  aulas: Aula[];
  error?: string;
};

async function loadSubjectData(id: string): Promise<SubjectData> {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });

  try {
    const supabase = createPublicClient();
    const materiaResult = await supabase
      .from("materias")
      .select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em, professor, total_aulas, avaliacao, bibliografia")
      .eq("id", id)
      .eq("publicado", true)
      .maybeSingle();

    if (materiaResult.error) {
      return { materia: null, curso: null, aulas: [], error: "Não foi possível consultar esta matéria. Confira as permissões de leitura no Supabase." };
    }

    if (!materiaResult.data) return { materia: null, curso: null, aulas: [] };

    const materia = materiaResult.data as Materia;
    const [cursoResult, aulasResult] = await Promise.all([
      supabase.from("cursos").select("*").eq("id", materia.curso_id).maybeSingle(),
      supabase.from("aulas").select("*").eq("materia_id", id).or("publicado.eq.true,planejada.eq.true").order("ordem"),
    ]);

    if (cursoResult.error || aulasResult.error) {
      return { materia: null, curso: null, aulas: [], error: "A matéria foi encontrada, mas não foi possível carregar suas aulas." };
    }

    return { materia, curso: cursoResult.data as Curso | null, aulas: (aulasResult.data ?? []) as Aula[] };
  } catch (error) {
    return {
      materia: null,
      curso: null,
      aulas: [],
      error: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
    };
  }
}

export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { materia, curso, aulas, error } = await loadSubjectData(id);

  if (!error && !materia) notFound();
  const glossaryCount = aulas.reduce((total, aula) => total + (aula.glossario?.length ?? 0), 0);
  const publishedLessons = aulas.filter((aula) => aula.publicado).length;

  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8 sm:pb-20 sm:pt-14">
        <Link href={curso ? `/cursos/${curso.id}` : "/"} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-[#1473f3]">
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
              <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">{curso?.titulo || "Matéria"}</p>
              <h1 className="mt-4 max-w-4xl break-words text-3xl font-black leading-tight tracking-[-.04em] text-slate-950 sm:text-6xl">{materia.titulo}</h1>
              {materia.descricao && <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">{materia.descricao}</p>}
              <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-500">{materia.professor && <span className="rounded-md border border-white/10 bg-white/[.03] px-3 py-2">Professor: {materia.professor}</span>}<span className="rounded-md border border-white/10 bg-white/[.03] px-3 py-2">{publishedLessons} {publishedLessons === 1 ? "aula publicada" : "aulas publicadas"}{materia.total_aulas != null ? ` de ${materia.total_aulas}` : ""}</span></div>
              <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap"><Link href={`/materias/${id}/chat`} className="inline-flex justify-center rounded-lg bg-[#1473f3] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#005de0]">Perguntar aos materiais</Link>{glossaryCount > 0 && <Link href={`/materias/${id}/glossario`} className="inline-flex justify-center rounded-lg border border-white/10 bg-white/[.03] px-4 py-3 text-sm font-bold text-[#69a7ff] transition hover:border-[#1473f3]/50 hover:bg-[#1473f3]/10">Abrir glossário · {glossaryCount} termos</Link>}</div>
            </header>

            {(materia.avaliacao || materia.bibliografia) && <section className="mt-8 grid gap-4 sm:grid-cols-2">{materia.avaliacao && <article className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5"><p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-[#69a7ff]">Avaliação</p><p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-500">{materia.avaliacao}</p></article>}{materia.bibliografia && <article className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5"><p className="font-mono text-xs font-bold uppercase tracking-[.14em] text-[#69a7ff]">Bibliografia</p><ul className="mt-3 grid gap-2">{materia.bibliografia.split("\n").filter(Boolean).map((item) => <li key={item} className="text-sm leading-6 text-slate-500">• {item}</li>)}</ul></article>}</section>}

            <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
              <div className="grid gap-6">
                {aulas.length ? aulas.map((aula, index) => <article id={`aula-${aula.id}`} key={aula.id} className={`scroll-mt-36 overflow-hidden rounded-2xl border bg-white p-4 sm:scroll-mt-24 sm:p-10 ${aula.planejada ? "border-dashed border-white/15 opacity-80" : "border-white/10"}`}>
                  <div className="mb-8 flex items-start gap-4 border-b border-slate-100 pb-6"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-50 text-sm font-black text-[#1473f3]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold uppercase tracking-[.16em] text-slate-400">Aula {index + 1}</p>{aula.planejada && <span className="rounded-md border border-amber-400/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">Em breve</span>}</div><h2 className="mt-1 text-2xl font-bold text-slate-900">{aula.titulo}</h2>{aula.descricao && <p className="mt-2 text-sm leading-6 text-slate-500">{aula.descricao}</p>}{!aula.planejada && ((aula.flashcards?.length ?? 0) > 0 || (aula.quiz?.length ?? 0) > 0) && <a href={`#revisao-${aula.id}`} className="mt-3 inline-flex rounded-lg border border-[#1473f3]/25 bg-[#1473f3]/10 px-3 py-2 text-xs font-bold text-[#1473f3] transition hover:bg-[#1473f3] hover:text-white">Revisar com flashcards e quiz</a>}</div></div>
                  {aula.planejada ? <p className="font-mono text-sm text-slate-400">{aula.data_prevista ? `Disponibilidade prevista: ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(new Date(`${aula.data_prevista}T12:00:00`))}` : "Conteúdo planejado. Volte em breve."}</p> : <>{aula.conteudo ? <MarkdownContent anchorPrefix={`aula-${aula.id}`}>{withoutEmbeddedReview(aula.conteudo, Boolean(aula.conceitos?.length || aula.glossario?.length || aula.pontos_prova?.length || aula.flashcards?.length || aula.quiz?.length))}</MarkdownContent> : <p className="text-sm text-slate-500">Conteúdo em preparação.</p>}<StudyTools aulaId={aula.id} conceitos={aula.conceitos} glossario={aula.glossario} pontosProva={aula.pontos_prova} flashcards={aula.flashcards} quiz={aula.quiz} /></>}
                </article>) : <article id="conteudo" className="scroll-mt-24 rounded-2xl border border-white/10 bg-white p-6 sm:p-10"><div className="mb-8 flex items-center gap-3 border-b border-slate-100 pb-6"><span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-[#1473f3]"><BookIcon className="size-6" /></span><h2 className="text-xl font-bold text-slate-900">Conteúdo</h2></div>{materia.conteudo ? <MarkdownContent>{materia.conteudo}</MarkdownContent> : <p className="text-sm text-slate-500">Conteúdo em preparação.</p>}</article>}
              </div>

              <aside className="lg:sticky lg:top-24 lg:self-start">
                {aulas.length ? <SubjectToc aulas={aulas} /> : <nav aria-label="Sumário da matéria" className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Sumário"}</p><a href="#conteudo" className="mt-4 block text-sm font-bold text-white hover:text-[#69a7ff]">Conteúdo da matéria</a></nav>}
              </aside>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
