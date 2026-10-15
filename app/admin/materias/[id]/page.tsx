import { updateMateriaAction } from "@/app/admin/actions";
import { AdminHeader } from "@/components/admin-header";
import { MateriaForm } from "@/components/materia-form";
import { createClient } from "@/lib/supabase/server";
import type { Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

async function EditSubjectContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [coursesResult, subjectResult] = await Promise.all([
    supabase.from("cursos").select("*").order("titulo"),
    supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em").eq("id", id).maybeSingle(),
  ]);
  if (!subjectResult.data) notFound();

  return (
    <>
      <AdminHeader email={user.email} />
      <main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#6750e6]">← Voltar ao painel</Link>
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(30,41,59,.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#6750e6]">Edição</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Editar matéria</h1>
          <p className="mb-8 mt-3 text-sm text-slate-500">Atualize o conteúdo e escolha quando ele ficará disponível no site.</p>
          <MateriaForm action={updateMateriaAction} cursos={(coursesResult.data ?? []) as Curso[]} materia={subjectResult.data as Materia} />
        </div>
      </main>
    </>
  );
}

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><EditSubjectContent params={params} /></Suspense>;
}
