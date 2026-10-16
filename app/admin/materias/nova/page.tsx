import { createMateriaAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { MateriaForm } from "@/components/materia-form";
import { createClient } from "@/lib/supabase/server";
import type { Curso } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

async function NewSubjectContent() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("cursos").select("*").order("titulo");

  return (
    <>
      <AdminHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#1473f3]">← Voltar ao painel</Link>
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(30,41,59,.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Etapa 1 de 2</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Dados gerais da matéria</h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Selecione o curso e informe o título e a descrição geral. Na próxima etapa, você organizará as aulas e adicionará um material diferente a cada uma.</p>
          <MateriaForm action={createMateriaAction} cursos={(data ?? []) as Curso[]} />
        </div>
      </main>
    </>
  );
}

export default function NewSubjectPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><NewSubjectContent /></Suspense>;
}
