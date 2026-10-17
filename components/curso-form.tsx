"use client";

import { createCursoAction, type AdminActionState } from "@/app/admin/actions";
import type { Curso } from "@/lib/types";
import { useActionState } from "react";

export function CursoForm({ action = createCursoAction, curso }: { action?: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>; curso?: Curso }) {
  const [state, formAction, pending] = useActionState<AdminActionState, FormData>(action, { error: "" });
  const field = "w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

  return <form action={formAction} className="grid gap-6">
    {curso && <input type="hidden" name="id" value={curso.id} />}
    <label className="grid gap-2 text-sm font-bold text-slate-700">Título do curso<input name="titulo" required maxLength={160} defaultValue={curso?.titulo ?? ""} className={field} placeholder="Ex.: MBA em Inteligência Artificial" /></label>
    <label className="grid gap-2 text-sm font-bold text-slate-700">Descrição<textarea name="descricao" rows={4} maxLength={1200} defaultValue={curso?.descricao ?? ""} className={field} placeholder="Apresente brevemente o objetivo do curso" /></label>
    {curso?.imagem_url && <div className="overflow-hidden rounded-2xl border border-slate-200"><div className="h-40 bg-slate-100 bg-cover bg-center" style={{ backgroundImage: `url(${JSON.stringify(curso.imagem_url).slice(1, -1)})` }} /><p className="px-4 py-3 text-xs text-slate-500">Capa atual. Envie outra imagem abaixo somente se quiser substituí-la.</p></div>}
    <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">{curso?.imagem_url ? "Substituir capa" : "Capa do curso"} <span className="text-xs font-normal text-slate-400">Opcional · JPG, PNG ou WebP · máximo 5 MB</span><input name="capa" type="file" accept="image/jpeg,image/png,image/webp" className={`${field} overflow-hidden text-xs file:mr-2 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-[#1473f3] sm:text-sm sm:file:mr-4 sm:file:text-sm`} /></label>
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" name="publicado" defaultChecked={curso?.publicado ?? true} className="size-4 accent-[#1473f3]" />Publicar este curso no site</label>
    {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>}
    <button disabled={pending} className="rounded-2xl bg-[#1473f3] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#005de0] disabled:cursor-not-allowed disabled:opacity-60">{pending ? "Salvando..." : curso ? "Salvar alterações" : "Criar curso"}</button>
  </form>;
}
