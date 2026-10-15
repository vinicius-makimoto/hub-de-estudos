export function DataError({ message }: { message: string }) {
  return (
    <section id="cursos" className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-6 py-12 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-white text-xl font-bold text-rose-600">!</span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Não foi possível carregar os cursos</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-slate-600">{message}</p>
      </div>
    </section>
  );
}
