"use client";

import { deleteMateriaAction } from "@/app/admin/actions";

export function DeleteMateriaButton({ id, titulo }: { id: string; titulo: string }) {
  return <form action={deleteMateriaAction} onSubmit={(event) => { if (!window.confirm(`Excluir a matéria “${titulo}” e todas as suas aulas e materiais? Esta ação não pode ser desfeita.`)) event.preventDefault(); }}>
    <input type="hidden" name="id" value={id} />
    <button type="submit" className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50">Excluir</button>
  </form>;
}
