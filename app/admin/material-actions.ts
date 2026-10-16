"use server";

import { chunkMaterial } from "@/lib/chunking";
import { extractMaterialText } from "@/lib/material-extraction";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type MaterialActionState = { error: string; message: string };

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function reprocessMaterialAction(_state: MaterialActionState, formData: FormData): Promise<MaterialActionState> {
  const materialId = String(formData.get("material_id") ?? "");
  const supabase = await authenticatedClient();
  const { data: material } = await supabase.from("aula_materiais").select("*").eq("id", materialId).maybeSingle();
  if (!material) return { error: "Material não encontrado.", message: "" };

  await supabase.from("aula_materiais").update({ status: "processando", erro: null, atualizado_em: new Date().toISOString() }).eq("id", materialId);
  try {
    const { data: blob, error: downloadError } = await supabase.storage.from("materiais").download(material.arquivo_path);
    if (downloadError || !blob) throw new Error("O arquivo não foi encontrado no armazenamento.");
    const file = new File([await blob.arrayBuffer()], material.nome, { type: material.tipo_mime || blob.type || "application/octet-stream" });
    const text = await extractMaterialText(file);
    const chunks = chunkMaterial(text);
    if (!chunks.length) throw new Error("O arquivo não contém texto suficiente para indexação.");

    const { error: deleteError } = await supabase.from("material_chunks").delete().eq("material_id", materialId);
    if (deleteError) throw new Error("Não foi possível limpar o índice anterior.");
    const { data: lastChunk } = await supabase.from("material_chunks").select("chunk_index").eq("aula_id", material.aula_id).lt("chunk_index", 100000).order("chunk_index", { ascending: false }).limit(1).maybeSingle();
    const firstIndex = (lastChunk?.chunk_index ?? -1) + 1;
    const { error: insertError } = await supabase.from("material_chunks").insert(chunks.map((conteudo, index) => ({ material_id: materialId, aula_id: material.aula_id, materia_id: material.materia_id, chunk_index: firstIndex + index, conteudo, fonte_nome: material.nome, arquivo_path: material.arquivo_path })));
    if (insertError) throw new Error("Não foi possível reconstruir o índice do material.");
    await supabase.from("aula_materiais").update({ status: "indexado", erro: null, total_trechos: chunks.length, indexado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() }).eq("id", materialId);
    revalidatePath(`/admin/aulas/${material.aula_id}`);
    return { error: "", message: "Material reprocessado e indexado." };
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Não foi possível reprocessar o material.";
    await supabase.from("aula_materiais").update({ status: "erro", erro: message, atualizado_em: new Date().toISOString() }).eq("id", materialId);
    revalidatePath(`/admin/aulas/${material.aula_id}`);
    return { error: message, message: "" };
  }
}

export async function deleteMaterialAction(_state: MaterialActionState, formData: FormData): Promise<MaterialActionState> {
  const materialId = String(formData.get("material_id") ?? "");
  const supabase = await authenticatedClient();
  const { data: material } = await supabase.from("aula_materiais").select("id, aula_id, arquivo_path").eq("id", materialId).maybeSingle();
  if (!material) return { error: "Material não encontrado.", message: "" };
  const { error: storageError } = await supabase.storage.from("materiais").remove([material.arquivo_path]);
  if (storageError) return { error: "Não foi possível remover o arquivo do armazenamento.", message: "" };
  const { error } = await supabase.from("aula_materiais").delete().eq("id", materialId);
  if (error) return { error: "Não foi possível remover o registro do material.", message: "" };
  revalidatePath(`/admin/aulas/${material.aula_id}`);
  return { error: "", message: "Material e índice removidos." };
}
