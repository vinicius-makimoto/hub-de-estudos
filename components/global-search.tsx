"use client";

import { SearchIcon } from "@/components/icons";
import Link from "next/link";
import { useMemo, useState } from "react";

export type SearchEntry = { id: string; tipo: "Curso" | "Matéria" | "Aula" | "Glossário"; titulo: string; descricao: string; href: string; searchText: string };
function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

export function GlobalSearch({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => { const term = normalize(query.trim()); return term.length >= 2 ? entries.filter((entry) => normalize(`${entry.titulo} ${entry.descricao} ${entry.searchText}`).includes(term)).slice(0, 60) : []; }, [entries, query]);
  return <div className="mt-8"><label className="relative block"><span className="sr-only">Buscar em todo o hub</span><SearchIcon className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Busque por curso, matéria, aula, conceito ou termo..." className="w-full rounded-2xl border border-white/10 bg-[#0d1a2d] py-5 pl-14 pr-5 text-base outline-none transition placeholder:text-slate-400 focus:border-[#1473f3] focus:ring-2 focus:ring-[#1473f3]/20" /></label>{query.trim().length < 2 ? <p className="mt-5 text-sm text-slate-400">Digite pelo menos dois caracteres para começar.</p> : <><p className="mt-5 font-mono text-xs text-slate-400">{results.length} {results.length === 1 ? "resultado" : "resultados"}</p><div className="mt-5 grid gap-3">{results.map((entry) => <Link key={`${entry.tipo}-${entry.id}`} href={entry.href} className="group rounded-2xl border border-white/10 bg-white p-5 transition hover:border-[#1473f3]/40 hover:bg-[#162945]"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><span className="font-mono text-[10px] font-bold uppercase tracking-[.14em] text-[#69a7ff]">{entry.tipo}</span><h2 className="mt-2 font-bold text-white">{entry.titulo}</h2><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{entry.descricao}</p></div><span className="shrink-0 text-[#69a7ff] transition group-hover:translate-x-1">→</span></div></Link>)}{results.length === 0 && <div className="rounded-2xl border border-dashed border-white/15 px-6 py-14 text-center text-sm text-slate-500">Nenhum conteúdo corresponde à sua busca.</div>}</div></>}</div>;
}
