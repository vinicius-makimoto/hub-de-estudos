import { createMateriaAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { MateriaForm } from "@/components/materia-form";
import { createClient } from "@/lib/supabase/server";
import type { Curso } from "@/lib/types";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

async function NewSubjectContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data } = await supabase.from("cursos").select("*").order("titulo");

  return (
    <>
      <AdminHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#6750e6]">← Voltar ao painel</Link>
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(30,41,59,.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#6750e6]">Cadastro</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Nova matéria</h1>
          <p className="mb-8 mt-3 text-sm text-slate-500">Comece como rascunho e publique quando o conteúdo estiver pronto.</p>
          <MateriaForm action={createMateriaAction} cursos={(data ?? []) as Curso[]} />
        </div>
      </main>
    </>
  );
}

export default function NewSubjectPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><NewSubjectContent /></Suspense>;
}
