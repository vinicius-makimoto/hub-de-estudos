import { GlossaryExplorer, type GlossaryEntry } from "@/components/glossary-explorer";
import { Header } from "@/components/header";
import { createPublicClient } from "@/lib/supabase/public";
import type { Aula, Materia } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function SubjectGlossaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createPublicClient();
  const [subjectResult, lessonsResult] = await Promise.all([supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em").eq("id", id).eq("publicado", true).maybeSingle(), supabase.from("aulas").select("id, materia_id, titulo, glossario").eq("materia_id", id).eq("publicado", true).order("ordem")]);
  if (!subjectResult.data) notFound();
  const subject = subjectResult.data as Materia;
  const entries = ((lessonsResult.data ?? []) as Pick<Aula, "id" | "materia_id" | "titulo" | "glossario">[]).flatMap((lesson) => (lesson.glossario ?? []).map((item) => ({ ...item, aulaId: lesson.id, aulaTitulo: lesson.titulo, materiaId: subject.id, materiaTitulo: subject.titulo } as GlossaryEntry))).sort((a, b) => a.termo.localeCompare(b.termo, "pt-BR"));
  return <main className="min-h-screen"><Header /><section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><Link href={`/materias/${id}`} className="text-sm font-bold text-slate-500 hover:text-[#69a7ff]">← Voltar à matéria</Link><p className="mt-10 font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Glossário da matéria"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">{subject.titulo}</h1><p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">Consulte os termos gerados a partir das aulas desta matéria.</p><GlossaryExplorer entries={entries} /></section></main>;
}
