"use client";

import type { AulaActionState } from "@/app/admin/aula-actions";
import type { Aula } from "@/lib/types";
import { useActionState } from "react";

type AulaFormProps = {
  action: (state: AulaActionState, data: FormData) => Promise<AulaActionState>;
  materiaId: string;
  aula?: Aula;
  defaultOrder?: number;
};

export function AulaForm({ action, materiaId, aula, defaultOrder = 1 }: AulaFormProps) {
  const [state, formAction, pending] = useActionState(action, { error: "" });
  const field = "w-full min-w-0 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
  return <form action={formAction} className="grid gap-6">
    <input type="hidden" name="materia_id" value={materiaId} />
    {aula && <input type="hidden" name="id" value={aula.id} />}
    <div className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_7rem]">
      <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">Título<input name="titulo" required defaultValue={aula?.titulo ?? ""} className={field} placeholder="Ex.: Governança e Gestão de Dados" /></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">Ordem<input name="ordem" type="number" min="1" defaultValue={aula?.ordem ?? defaultOrder} className={field} /></label>
    </div>
    <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">Descrição da aula<textarea name="descricao" rows={3} defaultValue={aula?.descricao ?? ""} className={field} placeholder="Apresente brevemente o que será estudado nesta aula." /></label>
    {aula ? <>
      <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">Temas abordados <span className="text-xs font-normal text-slate-400">Um tema por linha</span><textarea name="temas" rows={5} defaultValue={aula.temas?.join("\n") ?? ""} className={field} /></label>
      <label className="grid min-w-0 gap-2 text-sm font-bold text-slate-700">Conteúdo em Markdown<textarea name="conteudo" rows={16} defaultValue={aula.conteudo ?? ""} className={`${field} font-mono text-sm leading-6`} /></label>
      <details className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5 open:ring-1 open:ring-[#1473f3]/30">
        <summary className="cursor-pointer text-sm font-bold text-slate-700">Recursos de estudo gerados pela IA</summary>
        <p className="mt-2 text-xs leading-5 text-slate-500">Revise os itens antes de publicar. Nos campos com duas partes, use <strong className="text-slate-700">||</strong> como separador.</p>
        <div className="mt-5 grid gap-5">
          <label className="grid gap-2 text-sm font-bold text-slate-700">Conceitos-chave <span className="text-xs font-normal text-slate-400">Conceito || Definição</span><textarea name="conceitos" rows={6} defaultValue={(aula.conceitos ?? []).map((item) => `${item.titulo} || ${item.descricao}`).join("\n")} className={field} /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Glossário <span className="text-xs font-normal text-slate-400">Termo || Definição</span><textarea name="glossario" rows={6} defaultValue={(aula.glossario ?? []).map((item) => `${item.termo} || ${item.definicao}`).join("\n")} className={field} /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Pontos de prova <span className="text-xs font-normal text-slate-400">Um ponto por linha</span><textarea name="pontos_prova" rows={5} defaultValue={(aula.pontos_prova ?? []).join("\n")} className={field} /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Flashcards <span className="text-xs font-normal text-slate-400">Frente || Verso</span><textarea name="flashcards" rows={7} defaultValue={(aula.flashcards ?? []).map((item) => `${item.frente} || ${item.verso}`).join("\n")} className={field} /></label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">Quiz <span className="text-xs font-normal text-slate-400">Formato JSON — preserve pergunta, opcoes, correta e explicacao</span><textarea name="quiz" rows={12} defaultValue={JSON.stringify(aula.quiz ?? [], null, 2)} className={`${field} font-mono text-xs leading-5`} /></label>
        </div>
      </details>
      <div className="grid gap-3 sm:grid-cols-2"><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" name="publicado" defaultChecked={aula.publicado} className="size-4 accent-[#1473f3]" /> Publicar aula</label><label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700"><input type="checkbox" name="planejada" defaultChecked={aula.planejada ?? false} className="size-4 accent-[#1473f3]" /> Exibir como “Em breve”</label></div>
      <label className="grid gap-2 text-sm font-bold text-slate-700">Data prevista <span className="text-xs font-normal text-slate-400">Opcional, usada quando a aula está em breve</span><input name="data_prevista" type="date" defaultValue={aula.data_prevista ?? ""} className={field} /></label>
    </> : <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">Depois de criar a aula, você poderá enviar o PDF ou outro material para gerar o resumo, revisar os temas e publicar.</p>}
    {state.error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>}
    <button disabled={pending} className="rounded-2xl bg-[#1473f3] px-5 py-3.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Salvando..." : aula ? "Salvar aula" : "Criar aula e adicionar conteúdo"}</button>
  </form>;
}
