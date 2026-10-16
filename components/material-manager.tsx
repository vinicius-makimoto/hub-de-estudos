"use client";

import { deleteMaterialAction, reprocessMaterialAction } from "@/app/admin/material-actions";
import type { AulaMaterial } from "@/lib/types";
import { useActionState } from "react";

const initialState = { error: "", message: "" };

function formatSize(value: number | null) {
  if (value == null) return "Tamanho desconhecido";
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function MaterialRow({ material }: { material: AulaMaterial }) {
  const [reprocessState, reprocessAction, reprocessing] = useActionState(reprocessMaterialAction, initialState);
  const [deleteState, deleteAction, deleting] = useActionState(deleteMaterialAction, initialState);
  const statusStyle = material.status === "indexado" ? "bg-emerald-400/10 text-emerald-300" : material.status === "erro" ? "bg-rose-400/10 text-rose-300" : "bg-amber-400/10 text-amber-200";
  return <article className="rounded-xl border border-white/10 bg-[#08111f] p-4">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="break-all text-sm font-bold text-white">{material.nome}</h3><span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${statusStyle}`}>{material.status}</span></div><p className="mt-2 text-xs text-slate-400">{formatSize(material.tamanho_bytes)} · {material.total_trechos} {material.total_trechos === 1 ? "trecho indexado" : "trechos indexados"}</p>{material.erro && <p className="mt-2 text-xs leading-5 text-rose-300">{material.erro}</p>}</div>
      <div className="flex shrink-0 flex-wrap gap-2"><form action={reprocessAction}><input type="hidden" name="material_id" value={material.id}/><button disabled={reprocessing || deleting} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:border-[#1473f3]/50 hover:text-white disabled:opacity-50">{reprocessing ? "Reprocessando…" : "Reprocessar"}</button></form><form action={deleteAction} onSubmit={(event) => { if (!window.confirm(`Remover ${material.nome} e seu índice do chat?`)) event.preventDefault(); }}><input type="hidden" name="material_id" value={material.id}/><button disabled={deleting || reprocessing} className="rounded-lg border border-rose-400/20 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-400/10 disabled:opacity-50">{deleting ? "Removendo…" : "Remover"}</button></form></div>
    </div>
    {(reprocessState.error || deleteState.error) && <p role="alert" className="mt-3 text-xs text-rose-300">{reprocessState.error || deleteState.error}</p>}
    {(reprocessState.message || deleteState.message) && <p role="status" className="mt-3 text-xs text-emerald-300">{reprocessState.message || deleteState.message}</p>}
  </article>;
}

export function MaterialManager({ materials, unavailable = false }: { materials: AulaMaterial[]; unavailable?: boolean }) {
  return <section className="mb-8 rounded-2xl border border-white/10 bg-[#0d1a2d] p-5 sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Materiais da aula"}</p><h2 className="mt-2 text-xl font-bold text-white">Arquivos e indexação</h2></div><span className="text-xs text-slate-400">{materials.length} {materials.length === 1 ? "arquivo" : "arquivos"}</span></div>{unavailable ? <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-200">Execute a migration de gestão de materiais para habilitar esta seção.</p> : materials.length ? <div className="mt-5 grid gap-3">{materials.map((material) => <MaterialRow key={material.id} material={material}/>)}</div> : <p className="mt-4 text-sm text-slate-400">Nenhum arquivo registrado. Envie o primeiro material acima.</p>}<p className="mt-4 text-xs leading-5 text-slate-500">Remover um arquivo exclui também seus trechos do chat. O resumo já gerado permanece disponível para revisão manual.</p></section>;
}
