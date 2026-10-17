import Link from "next/link";

type RecentLesson = { id: string; materiaId: string; titulo: string; materiaTitulo: string; atualizadoEm: string };
type Stats = { cursos: number; materias: number; aulas: number; conceitos: number; termos: number; flashcards: number; questoes: number };

export function HomeOverview({ stats, recent }: { stats: Stats; recent: RecentLesson[] }) {
  const cards = [{ label: "Cursos", value: stats.cursos }, { label: "Matérias", value: stats.materias }, { label: "Aulas", value: stats.aulas }, { label: "Conceitos", value: stats.conceitos }, { label: "Glossário", value: stats.termos }, { label: "Flashcards", value: stats.flashcards }, { label: "Questões", value: stats.questoes }];
  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "America/Sao_Paulo" });
  return <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-8 sm:pb-20">
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-4 lg:grid-cols-7">
      {cards.map((card) => <div key={card.label} className="bg-[#0d1a2d] px-3 py-4 text-center sm:px-4 sm:py-5"><strong className="block font-mono text-xl text-white sm:text-2xl">{card.value}</strong><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.08em] text-slate-400 sm:text-xs sm:tracking-[.1em]">{card.label}</span></div>)}
    </div>
    {recent.length > 0 && <div className="mt-10 sm:mt-14"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Atualizações"}</p><h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Adicionado recentemente</h2></div></div><div className="mt-6 grid gap-3">{recent.map((lesson) => <Link key={lesson.id} href={`/materias/${lesson.materiaId}#aula-${lesson.id}`} className="group grid gap-3 rounded-2xl border border-white/10 bg-white p-4 transition hover:border-[#1473f3]/40 hover:bg-[#162945] sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:items-center sm:p-5"><time className="font-mono text-xs uppercase text-slate-400" dateTime={lesson.atualizadoEm}>{formatter.format(new Date(lesson.atualizadoEm))}</time><div className="min-w-0"><h3 className="break-words font-bold text-white sm:truncate">{lesson.titulo}</h3><p className="mt-1 break-words text-sm text-slate-500 sm:truncate">{lesson.materiaTitulo}</p></div><span className="text-sm text-[#69a7ff] transition group-hover:translate-x-1">Abrir →</span></Link>)}</div></div>}
  </section>;
}
