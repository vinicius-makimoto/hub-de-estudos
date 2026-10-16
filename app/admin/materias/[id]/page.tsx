import { updateMateriaAction } from "@/app/admin/actions";
import { toggleAulaAction } from "@/app/admin/aula-actions";
import { AdminHeader } from "@/components/admin-header";
import { MateriaForm } from "@/components/materia-form";
import { createClient } from "@/lib/supabase/server";
import type { Aula, Curso, Materia } from "@/lib/types";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";

async function EditSubjectContent({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [coursesResult, subjectResult, lessonsResult] = await Promise.all([
    supabase.from("cursos").select("*").order("titulo"),
    supabase.from("materias").select("id, curso_id, titulo, descricao, conteudo, publicado, criado_em, professor, total_aulas, avaliacao, bibliografia").eq("id", id).maybeSingle(),
    supabase.from("aulas").select("*").eq("materia_id", id).order("ordem"),
  ]);
  if (!subjectResult.data) notFound();

  return (
    <>
      <AdminHeader email={user.email} />
      <main className="mx-auto w-full min-w-0 max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/admin" className="text-sm font-bold text-slate-500 hover:text-[#1473f3]">← Voltar ao painel</Link>
        <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_rgba(30,41,59,.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Etapa 1 · Dados gerais</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Informações da matéria</h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">Defina o curso, o título e a descrição geral da matéria. O conteúdo de estudo é organizado separadamente nas aulas abaixo.</p>
          <MateriaForm action={updateMateriaAction} cursos={(coursesResult.data ?? []) as Curso[]} materia={subjectResult.data as Materia} />
        </div>
        <section className="mt-8 min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><p className="text-sm font-bold uppercase tracking-[.18em] text-[#1473f3]">Etapa 2 · Organização</p><h2 className="mt-2 text-2xl font-black text-slate-950">Aulas da matéria</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">Crie as aulas em sequência. Cada aula pode receber seu próprio PDF ou conteúdo para gerar um resumo independente.</p></div>
            <Link href={`/admin/materias/${id}/aulas/nova`} className="rounded-2xl bg-slate-900 px-5 py-3 text-center text-sm font-bold text-white">+ Nova aula</Link>
          </div>
          <div className="mt-6 grid min-w-0 max-w-full gap-3">
            {((lessonsResult.data ?? []) as Aula[]).map((aula) => <article key={aula.id} className="grid min-w-0 max-w-full gap-4 overflow-hidden rounded-2xl border border-slate-200 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center lg:grid-cols-[auto_minmax(0,1fr)_auto]">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-sm font-black text-[#1473f3]">{aula.ordem}</span>
              <div className="min-w-0 max-w-full overflow-hidden"><div className="flex min-w-0 flex-wrap items-center gap-2"><h3 className="min-w-0 break-words font-bold text-slate-900">{aula.titulo}</h3><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${aula.publicado ? "bg-emerald-50 text-emerald-700" : aula.planejada ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{aula.publicado ? "Publicada" : aula.planejada ? "Em breve" : "Rascunho"}</span></div><p className="mt-1 max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-sm text-slate-500">{aula.temas.length ? aula.temas.join(" • ") : aula.planejada ? "Aula planejada" : "Sem temas definidos"}</p></div>
              <div className="flex min-w-0 flex-wrap gap-2 sm:col-start-2 lg:col-start-auto"><Link href={`/admin/aulas/${aula.id}`} className="rounded-xl border border-slate-200 px-3 py-2 text-center text-sm font-bold text-slate-600">Editar</Link><form action={toggleAulaAction}><input type="hidden" name="id" value={aula.id}/><input type="hidden" name="materia_id" value={id}/><input type="hidden" name="publicado" value={String(aula.publicado)}/><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">{aula.publicado ? "Despublicar" : "Publicar"}</button></form></div>
            </article>)}
            {!lessonsResult.data?.length && <div className="rounded-2xl border border-dashed border-slate-300 px-5 py-10 text-center"><p className="text-sm font-bold text-slate-700">A matéria ainda não possui aulas.</p><p className="mt-2 text-sm text-slate-500">Comece pela Aula 1 e depois adicione as demais na ordem desejada.</p></div>}
          </div>
        </section>
      </main>
    </>
  );
}

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center">Carregando...</main>}><EditSubjectContent params={params} /></Suspense>;
}
