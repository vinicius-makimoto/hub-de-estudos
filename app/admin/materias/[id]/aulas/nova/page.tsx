import { createAulaAction } from "@/app/admin/aula-actions";
import { AdminHeader } from "@/components/admin-header";
import { AulaForm } from "@/components/aula-form";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

async function Content({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const [materiaResult, lastLessonResult] = await Promise.all([
    supabase.from("materias").select("id, titulo").eq("id", id).maybeSingle(),
    supabase.from("aulas").select("ordem").eq("materia_id", id).order("ordem", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const materia = materiaResult.data;
  if (!materia) notFound();
  const nextOrder = (lastLessonResult.data?.ordem ?? 0) + 1;
  return <><AdminHeader email={user.email}/><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8"><Link href={`/admin/materias/${id}`} className="text-sm font-bold text-slate-500">← Voltar à matéria</Link><div className="mt-8 min-w-0 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Etapa 2 de 2 · {materia.titulo}</p><h1 className="mt-2 text-3xl font-black">Adicionar aula {nextOrder}</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Cadastre primeiro os dados básicos. Em seguida, você poderá enviar o material, gerar o resumo e revisar o conteúdo.</p><AulaForm action={createAulaAction} materiaId={id} defaultOrder={nextOrder}/></div></main></>;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) { return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><Content params={params}/></Suspense>; }
