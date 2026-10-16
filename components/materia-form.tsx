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
  const fieldClass = "w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";

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
      <details className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5" open={Boolean(materia?.professor || materia?.total_aulas || materia?.avaliacao || materia?.bibliografia)}>
        <summary className="cursor-pointer text-sm font-bold text-slate-700">Informações acadêmicas <span className="font-normal text-slate-400">(opcional)</span></summary>
        <div className="mt-5 grid gap-5">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_10rem]"><label className="grid gap-2 text-sm font-bold text-slate-700">Professor<input name="professor" defaultValue={materia?.professor ?? ""} className={fieldClass} placeholder="Nome do professor" /></label><label className="grid gap-2 text-sm font-bold text-slate-700">Total de aulas<input name="total_aulas" type="number" min="0" defaultValue={materia?.total_aulas ?? ""} className={fieldClass} /></label></div>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Método de avaliação<textarea name="avaliacao" rows={4} defaultValue={materia?.avaliacao ?? ""} className={fieldClass} placeholder="Critérios, trabalhos, provas e pesos." /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Bibliografia e referências <span className="text-xs font-normal text-slate-400">Uma referência por linha</span><textarea name="bibliografia" rows={6} defaultValue={materia?.bibliografia ?? ""} className={fieldClass} /></label>
        </div>
      </details>
      <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
        <input type="checkbox" name="publicado" defaultChecked={materia?.publicado ?? false} className="size-4 accent-[#1473f3]" />
        Publicar esta matéria no site
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>}
      <button disabled={pending} className="rounded-2xl bg-[#1473f3] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#005de0] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Salvando..." : materia ? "Salvar dados gerais" : "Criar matéria e continuar"}
      </button>
    </form>
  );
}
