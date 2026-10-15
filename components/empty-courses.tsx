import { BookIcon } from "./icons";

export function EmptyCourses() {
  return (
    <section id="cursos" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-50 text-[#6750e6]"><BookIcon className="size-7" /></span>
        <h2 className="mt-5 text-xl font-bold text-slate-900">Sua estante está pronta</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">Nenhum curso foi cadastrado ainda. Assim que houver registros na tabela <code className="rounded bg-slate-100 px-1.5 py-0.5">public.cursos</code>, eles aparecerão aqui.</p>
      </div>
    </section>
  );
}
