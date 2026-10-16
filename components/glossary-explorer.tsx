"use client";

import { SearchIcon } from "@/components/icons";
import { useMemo, useState } from "react";

export type GlossaryEntry = { termo: string; definicao: string; aulaId: string; aulaTitulo: string; materiaId: string; materiaTitulo: string };

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

export function GlossaryExplorer({ entries }: { entries: GlossaryEntry[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => { const term = normalize(query.trim()); return term ? entries.filter((entry) => normalize(`${entry.termo} ${entry.definicao} ${entry.aulaTitulo} ${entry.materiaTitulo}`).includes(term)) : entries; }, [entries, query]);
  return <><label className="relative mt-8 block max-w-xl"><span className="sr-only">Filtrar termos</span><SearchIcon className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Filtrar por termo, aula ou matéria..." className="w-full rounded-xl border border-white/10 bg-[#0d1a2d] py-3.5 pl-12 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#1473f3] focus:ring-2 focus:ring-[#1473f3]/20" /></label><p className="mt-4 font-mono text-xs text-slate-400">{filtered.length} {filtered.length === 1 ? "termo encontrado" : "termos encontrados"}</p>{filtered.length ? <dl className="mt-6 grid gap-3">{filtered.map((entry, index) => <div key={`${entry.aulaId}-${entry.termo}-${index}`} className="rounded-2xl border border-white/10 bg-white p-5 transition hover:border-[#1473f3]/35 sm:p-6"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><dt className="font-mono text-base font-bold text-[#9bc5ff]">{entry.termo}</dt><a href={`/materias/${entry.materiaId}#aula-${entry.aulaId}`} className="text-xs font-bold text-slate-400 transition hover:text-[#69a7ff]">{entry.materiaTitulo} · {entry.aulaTitulo}</a></div><dd className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">{entry.definicao}</dd></div>)}</dl> : <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center"><p className="font-bold text-slate-700">Nenhum termo encontrado.</p><button type="button" onClick={() => setQuery("")} className="mt-4 text-sm font-bold text-[#69a7ff]">Limpar filtro</button></div>}</>;
}
