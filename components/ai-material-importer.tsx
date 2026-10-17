"use client";

import { prepareMaterialUploadAction, processStoredSubjectMaterialAction } from "@/app/admin/ai-actions";
import { createClient } from "@/lib/supabase/client";
import { FormEvent, useState, useTransition } from "react";

export function AiMaterialImporter({ materiaId, cursoId }: { materiaId: string; cursoId: string }) {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = new FormData(form).get("arquivo");
    if (!(file instanceof File) || !file.size) return setError("Selecione um arquivo para continuar.");
    if (file.size > 25 * 1024 * 1024) return setError("O arquivo deve ter no máximo 25 MB.");
    setError("");
    startTransition(async () => {
      const prepared = await prepareMaterialUploadAction({ materiaId, fileName: file.name });
      if (!prepared.path || !prepared.token) return setError(prepared.error || "Não foi possível preparar o envio.");
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage.from("materiais").uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type || "application/octet-stream" });
      if (uploadError) return setError(`Não foi possível enviar o arquivo: ${uploadError.message}`);
      const result = await processStoredSubjectMaterialAction({ materiaId, cursoId, fileName: file.name, fileType: file.type, objectPath: prepared.path });
      if (result.error) return setError(result.error);
      form.reset();
      window.location.reload();
    });
  }

  return (
    <section className="relative mb-8 overflow-hidden rounded-2xl border border-[#1473f3]/25 bg-[#0d1a2d] p-5 sm:p-6">
      <div aria-hidden="true" className="absolute -right-20 -top-24 size-56 rounded-full bg-[#1473f3]/10 blur-3xl" />
      <p className="relative font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Assistente de conteúdo"}</p>
      <h2 className="relative mt-2 text-xl font-bold text-slate-900">Gerar resumo com IA</h2>
      <p className="relative mt-2 text-sm leading-6 text-slate-500">Envie um TXT, Markdown, PDF ou DOCX. A Groq criará um rascunho e preencherá o campo de conteúdo para sua revisão.</p>
      <form onSubmit={submit} className="relative mt-5 grid gap-4">
        <input type="hidden" name="materia_id" value={materiaId} />
        <input type="hidden" name="curso_id" value={cursoId} />
        <input name="arquivo" type="file" required accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="block w-full min-w-0 rounded-xl border border-white/10 bg-[#08111f] px-3 py-3 text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-[#1473f3] file:px-4 file:py-2 file:text-sm file:font-bold file:text-white hover:file:bg-[#005de0]" />
        <p className="text-xs text-slate-500">Máximo de 25 MB. O conteúdo existente será substituído somente após a geração ser concluída.</p>
        {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <button disabled={pending} className="rounded-lg bg-[#1473f3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#005de0] disabled:cursor-wait disabled:opacity-60">
          {pending ? "Extraindo e gerando resumo..." : "Enviar e gerar rascunho"}
        </button>
      </form>
    </section>
  );
}
