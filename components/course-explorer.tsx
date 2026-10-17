"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Curso } from "@/lib/types";
import { ArrowIcon, SearchIcon } from "./icons";

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
    <section id="cursos" className="mx-auto max-w-6xl scroll-mt-32 px-4 pb-16 sm:scroll-mt-20 sm:px-8 sm:pb-20">
      <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Continue aprendendo</p>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Explore seus cursos</h2>
        </div>
        <label className="relative block w-full sm:max-w-sm">
          <span className="sr-only">Buscar cursos</span>
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar por curso ou categoria..." className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100" />
        </label>
      </div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((curso, index) => {
            return (
              <article key={curso.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-[#1473f3]/45 hover:bg-[#162945]">
                <div className="relative flex h-28 items-center justify-between overflow-hidden border-b border-white/10 bg-[#0d1a2d] bg-cover bg-center p-5 text-white" style={curso.imagem_url ? { backgroundImage: `linear-gradient(90deg, rgba(8,17,31,.88), rgba(8,17,31,.35)), url(${JSON.stringify(curso.imagem_url).slice(1, -1)})` } : undefined}>
                  <span className="font-mono text-4xl font-black tracking-[-.08em] text-white/[.08]">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-mono text-xs text-[#69a7ff]">course.open()</span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="mb-4 flex min-h-6 items-center gap-2">
                    {curso.categoria && <span className="rounded-md border border-[#1473f3]/25 bg-[#1473f3]/10 px-2.5 py-1 text-xs font-bold text-[#69a7ff]">{curso.categoria}</span>}
                    {curso.carga_horaria && <span className="text-xs font-medium text-slate-500">{curso.carga_horaria}h</span>}
                  </div>
                  <h3 className="text-xl font-bold leading-snug tracking-tight text-slate-900">{curso.titulo}</h3>
                  <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-relaxed text-slate-500">{curso.descricao || "Acesse as matérias e organize sua trilha de aprendizagem."}</p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <span className="text-xs font-semibold text-slate-500">{curso.total_materias != null ? `${curso.total_materias} ${curso.total_materias === 1 ? "matéria" : "matérias"}` : "Matérias do curso"}</span>
                    <Link href={`/cursos/${curso.id}`} className="flex items-center gap-1 text-sm font-bold text-[#1473f3] transition hover:text-[#005de0]" aria-label={`Ver matérias de ${curso.titulo}`}>Ver matérias <ArrowIcon className="size-4 transition group-hover:translate-x-1" /></Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-16 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-[#1473f3]"><SearchIcon className="size-6" /></span>
          <h3 className="mt-5 text-lg font-bold text-slate-900">Nenhum curso encontrado</h3>
          <p className="mt-2 text-sm text-slate-500">Tente outro termo ou limpe sua busca.</p>
          <button onClick={() => setQuery("")} className="mt-5 rounded-xl bg-[#1473f3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005de0]">Limpar busca</button>
        </div>
      )}
    </section>
  );
}
