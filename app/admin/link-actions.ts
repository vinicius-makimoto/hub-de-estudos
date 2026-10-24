"use server";

import { createHash } from "node:crypto";
import { importExternalMaterial, materialSourceKey, validateMaterialUrl } from "@/lib/external-material";
import { chunkMaterial } from "@/lib/chunking";
import { createClient } from "@/lib/supabase/server";
import { processStoredLessonMaterialAction } from "./ai-actions";

export async function importLessonLinkAction(input: { aulaId: string; materiaId: string; titulo: string; url: string }): Promise<{ error: string }> {
  if (!input || typeof input.url !== "string" || input.url.length > 8192 || typeof input.titulo !== "string" || !input.titulo.trim() || input.titulo.length > 150) return { error: "Informe um título (até 150 caracteres) e um link válido (até 8192 caracteres)." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sua sessão expirou. Entre novamente para importar o material." };
  const { data: aula } = await supabase.from("aulas").select("id,materia_id").eq("id", input.aulaId).eq("materia_id", input.materiaId).maybeSingle();
  if (!aula) return { error: "A aula não foi encontrada ou não pertence a esta matéria." };
  // Check the additive migration before downloading or spending AI tokens.
  const { error: schemaError } = await supabase.from("aula_materiais").select("source_url").limit(0);
  if (schemaError) return { error: "Execute a migração 20261021_add_external_material_links.sql no Supabase antes de importar links." };
  try {
    const url = validateMaterialUrl(input.url.trim()).href;
    const text = await importExternalMaterial(url);
    if (!chunkMaterial(text).length) return { error: "O material não contém texto suficiente para indexação." };
    const hash = createHash("sha256").update(materialSourceKey(new URL(url))).digest("hex").slice(0, 12);
    const title = input.titulo.trim().replace(/[\r\n/#]/g, " ");
    const fileName = `${title} - link-${hash}.txt`;
    const objectPath = `${aula.materia_id}/${aula.id}/${crypto.randomUUID()}-link-${hash}.txt`;
    const { error: uploadError } = await supabase.storage.from("materiais").upload(objectPath, Buffer.from(text, "utf8"), { contentType: "text/plain; charset=utf-8" });
    if (uploadError) return { error: "Não foi possível salvar o texto extraído no Supabase Storage." };
    // Reuse the existing lesson generation, material tracking and RAG pipeline.
    return await processStoredLessonMaterialAction({ aulaId: aula.id, materiaId: aula.materia_id, fileName, fileType: "text/plain", objectPath, sourceUrl: url });
  } catch (cause) {
    return { error: cause instanceof Error && cause.name !== "TimeoutError" ? cause.message : "O link demorou demais para responder. Confira o acesso público e tente novamente." };
  }
}
