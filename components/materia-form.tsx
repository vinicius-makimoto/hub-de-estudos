"use client";

import type { AdminActionState } from "@/app/admin/actions";
import type { Curso, Materia } from "@/lib/types";
import { useActionState } from "react";

type MateriaFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  cursos: Curso[];
  materia?: Materia;
};

export function MateriaForm({ action, cursos, materia }: MateriaFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  const fieldClass = "rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

  return (
    <form action={formAction} className="grid gap-6">
      {materia && <input type="hidden" name="id" value={materia.id} />}
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Curso
        <select name="curso_id" required defaultValue={materia?.curso_id ?? ""} className={fieldClass}>
          <option value="" disabled>Selecione um curso</option>
          {cursos.map((curso) => <option key={curso.id} value={curso.id}>{curso.titulo}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Título
        <input name="titulo" required maxLength={160} defaultValue={materia?.titulo ?? ""} className={fieldClass} placeholder="Ex.: Fundamentos de AI Engineering" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Descrição
        <textarea name="descricao" rows={3} defaultValue={materia?.descricao ?? ""} className={fieldClass} placeholder="Uma breve apresentação da matéria" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Conteúdo
        <textarea name="conteudo" rows={14} defaultValue={materia?.conteudo ?? ""} className={`${fieldClass} font-mono text-sm leading-6`} placeholder="Cole ou escreva aqui o material de estudo..." />
      </label>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
        <input type="checkbox" name="publicado" defaultChecked={materia?.publicado ?? false} className="size-4 accent-[#6750e6]" />
        Publicar esta matéria no site
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>}
      <button disabled={pending} className="rounded-2xl bg-[#6750e6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-[#4936c9] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Salvando..." : materia ? "Salvar alterações" : "Criar matéria"}
      </button>
    </form>
  );
}
