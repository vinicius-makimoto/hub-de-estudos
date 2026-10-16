import { updateAulaAction } from "@/app/admin/aula-actions";
import { AdminHeader } from "@/components/admin-header";
import { AiLessonImporter } from "@/components/ai-lesson-importer";
import { AulaForm } from "@/components/aula-form";
import { MaterialManager } from "@/components/material-manager";
import { createClient } from "@/lib/supabase/server";
import type { Aula, AulaMaterial } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const [lessonResult, materialsResult] = await Promise.all([supabase.from("aulas").select("*").eq("id", id).maybeSingle(), supabase.from("aula_materiais").select("*").eq("aula_id", id).order("criado_em", { ascending: false })]);
  if (!lessonResult.data) notFound(); const aula = lessonResult.data as Aula;
  return <><AdminHeader email={user.email}/><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href={`/admin/materias/${aula.materia_id}`} className="text-sm font-bold text-slate-500">← Voltar à matéria</Link><div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Edição de aula</p><h1 className="mb-8 mt-2 text-3xl font-black">{aula.titulo}</h1><AiLessonImporter aulaId={aula.id} materiaId={aula.materia_id}/><MaterialManager materials={(materialsResult.data ?? []) as AulaMaterial[]} unavailable={Boolean(materialsResult.error)}/><AulaForm action={updateAulaAction} materiaId={aula.materia_id} aula={aula}/></div></main></>;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><Content params={params}/></Suspense>; }
