import { GlossaryExplorer, type GlossaryEntry } from "@/components/glossary-explorer";
import { Header } from "@/components/header";
import { createPublicClient } from "@/lib/supabase/public";
import type { Aula, Materia } from "@/lib/types";
import { cacheLife } from "next/cache";

async function loadGlossary() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  const supabase = createPublicClient();
  const [lessonsResult, subjectsResult] = await Promise.all([supabase.from("aulas").select("id, materia_id, titulo, glossario").eq("publicado", true).order("ordem"), supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em").eq("publicado", true)]);
  if (lessonsResult.error || subjectsResult.error) return { entries: [] as GlossaryEntry[], error: "Não foi possível carregar o glossário." };
  const subjects = new Map(((subjectsResult.data ?? []) as Materia[]).map((subject) => [subject.id, subject]));
  const entries = ((lessonsResult.data ?? []) as Pick<Aula, "id" | "materia_id" | "titulo" | "glossario">[]).flatMap((lesson) => { const subject = subjects.get(lesson.materia_id); return subject ? (lesson.glossario ?? []).map((item) => ({ ...item, aulaId: lesson.id, aulaTitulo: lesson.titulo, materiaId: subject.id, materiaTitulo: subject.titulo })) : []; }).sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
  return { entries };
}

export default async function GlossaryPage() {
  const { entries, error } = await loadGlossary();
  return <main className="min-h-screen"><Header /><section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Referência"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">Glossário</h1><p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">Termos extraídos das aulas publicadas, reunidos em um único lugar para consulta rápida.</p>{error ? <p className="mt-8 rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</p> : <GlossaryExplorer entries={entries} />}</section></main>;
}
