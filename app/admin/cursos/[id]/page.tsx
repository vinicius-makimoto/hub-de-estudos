import { updateCursoAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { CursoForm } from "@/components/curso-form";
import { createClient } from "@/lib/supabase/server";
import type { Curso } from "@/lib/types";
import { connection } from "next/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

async function EditCourseContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("cursos").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return <><AdminHeader email={user.email} /><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14"><Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#1473f3]">← Voltar ao painel</Link><div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Edição de curso</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Informações e capa</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Altere o título, a descrição, a publicação ou substitua a imagem de capa.</p><CursoForm action={updateCursoAction} curso={data as Curso} /></div></main></>;
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><EditCourseContent params={params} /></Suspense>;
}
