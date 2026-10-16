import { GlobalSearch, type SearchEntry } from "@/components/global-search";
import { Header } from "@/components/header";
import { createPublicClient } from "@/lib/supabase/public";
import type { Aula, Curso, Materia } from "@/lib/types";
import { cacheLife } from "next/cache";

async function loadSearchEntries() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 3600 });
  const supabase = createPublicClient();
  const [coursesResult, subjectsResult, lessonsResult] = await Promise.all([supabase.from("cursos").select("*"), supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em").eq("publicado", true), supabase.from("aulas").select("*").eq("publicado", true)]);
  if (coursesResult.error || subjectsResult.error || lessonsResult.error) return [] as SearchEntry[];
  const courses = (coursesResult.data ?? []) as Curso[]; const subjects = (subjectsResult.data ?? []) as Materia[]; const lessons = (lessonsResult.data ?? []) as Aula[];
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]));
  const entries: SearchEntry[] = courses.map((course) => ({ id: course.id, tipo: "Curso", titulo: course.titulo, descricao: course.descricao ?? "Curso disponível no hub.", href: `/cursos/${course.id}`, searchText: `${course.categoria ?? ""}` }));
  entries.push(...subjects.map((subject) => ({ id: subject.id, tipo: "Matéria" as const, titulo: subject.titulo, descricao: subject.descricao ?? "Matéria disponível para estudo.", href: `/materias/${subject.id}`, searchText: "" })));
  entries.push(...lessons.map((lesson) => { const subject = subjectMap.get(lesson.materia_id); return { id: lesson.id, tipo: "Aula" as const, titulo: lesson.titulo, descricao: lesson.descricao ?? "Aula disponível para estudo.", href: `/materias/${lesson.materia_id}#aula-${lesson.id}`, searchText: `${subject?.titulo ?? ""} ${(lesson.temas ?? []).join(" ")} ${(lesson.conceitos ?? []).map((item) => `${item.titulo} ${item.descricao}`).join(" ")}` }; }));
  entries.push(...lessons.flatMap((lesson) => (lesson.glossario ?? []).map((item, index) => ({ id: `${lesson.id}-${index}`, tipo: "Glossário" as const, titulo: item.termo, descricao: item.definicao, href: `/materias/${lesson.materia_id}#aula-${lesson.id}`, searchText: `${lesson.titulo} ${subjectMap.get(lesson.materia_id)?.titulo ?? ""}` }))));
  return entries;
}

export default async function SearchPage() { const entries = await loadSearchEntries(); return <main className="min-h-screen"><Header /><section className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16"><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Busca global"}</p><h1 className="mt-3 text-4xl font-black tracking-[-.04em] text-white sm:text-5xl">Encontre qualquer conteúdo</h1><p className="mt-4 max-w-2xl text-base leading-8 text-slate-500">Pesquise simultaneamente em cursos, matérias, aulas, conceitos e termos do glossário.</p><GlobalSearch entries={entries} /></section></main>; }
