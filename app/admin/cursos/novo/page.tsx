import { AdminHeader } from "@/components/admin-header";
import { CursoForm } from "@/components/curso-form";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function NewCourseContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <><AdminHeader email={user.email} /><main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14"><Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#1473f3]">← Voltar ao painel</Link><div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(30,41,59,.08)] sm:p-10"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Novo curso</p><h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Informações do curso</h1><p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Cadastre o curso primeiro. Depois você poderá criar matérias e associá-las a ele.</p><CursoForm /></div></main></>;
}

export default function NewCoursePage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><NewCourseContent /></Suspense>;
}
