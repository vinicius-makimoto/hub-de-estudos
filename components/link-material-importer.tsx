"use client";

import { importLessonLinkAction } from "@/app/admin/link-actions";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LinkMaterialImporter({ aulaId, materiaId }: { aulaId: string; materiaId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await importLessonLinkAction({ aulaId, materiaId, titulo: String(data.get("titulo")), url: String(data.get("url")) });
        if (result.error) { setError(result.error); return; }
        form.reset(); setMessage("Material importado. O conteúdo foi gerado e os trechos estão disponíveis para o chat quando a aula estiver publicada.");
        router.refresh();
      } catch { setError("Não foi possível concluir a importação. Tente novamente."); }
    });
  }
  return <section className="mb-8 rounded-2xl border border-[#1473f3]/25 bg-[#0d1a2d] p-5 sm:p-6">
    <h2 className="text-xl font-bold text-white">Importar material por link</h2>
    <p className="mt-2 text-sm leading-6 text-slate-400">Cole um link do Google Slides, Google Docs, Google Drive, OneDrive/SharePoint, Amazon S3 ou das apostilas em on1.fiap.com.br. O arquivo deve abrir sem login; links temporários precisam estar válidos.</p>
    <form onSubmit={submit} className="mt-5 grid gap-4">
      <label className="text-sm text-slate-300">Título do material<input name="titulo" required maxLength={150} disabled={pending} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#08111f] p-3 text-white" /></label>
      <label className="text-sm text-slate-300">Link do material<input name="url" type="url" required maxLength={8192} disabled={pending} placeholder="https://…" className="mt-2 block w-full rounded-xl border border-white/10 bg-[#08111f] p-3 text-white" /></label>
      <p className="text-xs leading-5 text-slate-500">PDF com texto, DOCX, PPTX, TXT ou Markdown; até 15 MB. Cole a URL completa, incluindo os parâmetros após “?”. Se o link expirar, gere outro na plataforma de origem. O texto importado será somado aos materiais desta aula.</p>
      {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      <p role="status" aria-live="polite" className="text-sm text-emerald-300">{pending ? "Verificando acesso, extraindo texto e gerando conteúdo…" : message}</p>
      <button disabled={pending} className="rounded-lg bg-[#1473f3] px-5 py-3 text-sm font-bold text-white hover:bg-[#005de0] disabled:opacity-60">{pending ? "Importando…" : "Importar e gerar conteúdo"}</button>
    </form>
  </section>;
}
