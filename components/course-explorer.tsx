"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Curso } from "@/lib/types";
import { ArrowIcon, BookIcon, SearchIcon } from "./icons";

const accents = [
  ["from-violet-500 to-indigo-600", "bg-violet-50 text-violet-700"],
  ["from-amber-400 to-orange-500", "bg-amber-50 text-amber-700"],
  ["from-cyan-400 to-blue-600", "bg-cyan-50 text-cyan-700"],
  ["from-emerald-400 to-teal-600", "bg-emerald-50 text-emerald-700"],
];

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function CourseExplorer({ cursos }: { cursos: Curso[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return cursos;
    return cursos.filter((curso) => normalize([curso.titulo, curso.descricao, curso.categoria].filter(Boolean).join(" ")).includes(term));
  }, [cursos, query]);

  return (
    <section id="cursos" className="mx-auto max-w-6xl scroll-mt-6 px-5 pb-20 sm:px-8">
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#6750e6]">Continue aprendendo</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Explore seus cursos</h2>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Buscar cursos</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar por curso ou categoria..." className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((curso, index) => {
            const [gradient, badge] = accents[index % accents.length];
            return (
              <article key={curso.id} className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_35px_rgba(30,41,59,.07)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(68,53,150,.14)]">
                <div className={`relative flex h-36 items-end overflow-hidden bg-gradient-to-br ${gradient} p-5 text-white`}>
                  <div className="absolute -right-8 -top-10 size-36 rounded-full border border-white/20 bg-white/10" />
                  <div className="absolute right-14 top-8 size-14 rounded-full border border-white/15" />
                  <BookIcon className="relative size-10 opacity-95" />
                </div>
                <div className="p-6">
                  <div className="mb-4 flex min-h-6 items-center gap-2">
                    {curso.categoria && <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>{curso.categoria}</span>}
                    {curso.carga_horaria && <span className="text-xs font-medium text-slate-500">{curso.carga_horaria}h</span>}
                  </div>
                  <h3 className="text-xl font-bold leading-snug tracking-tight text-slate-900">{curso.titulo}</h3>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500">{curso.descricao || "Acesse as matérias e organize sua trilha de aprendizagem."}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-xs font-semibold text-slate-500">{curso.total_materias != null ? `${curso.total_materias} ${curso.total_materias === 1 ? "matéria" : "matérias"}` : "Matérias do curso"}</span>
                    <Link href={`/cursos/${curso.id}`} className="flex items-center gap-1 text-sm font-bold text-[#6750e6] transition hover:text-[#4936c9]" aria-label={`Ver matérias de ${curso.titulo}`}>Ver matérias <ArrowIcon className="size-4 transition group-hover:translate-x-1" /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-violet-50 text-[#6750e6]"><SearchIcon className="size-6" /></span>
          <h3 className="mt-5 text-lg font-bold text-slate-900">Nenhum curso encontrado</h3>
          <p className="mt-2 text-sm text-slate-500">Tente outro termo ou limpe sua busca.</p>
          <button onClick={() => setQuery("")} className="mt-5 rounded-xl bg-[#6750e6] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#4936c9]">Limpar busca</button>
        </div>
      )}
    </section>
  );
}
