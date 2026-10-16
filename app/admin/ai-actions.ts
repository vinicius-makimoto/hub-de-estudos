"use server";

import { generateStudyMaterial } from "@/lib/groq";
import { chunkMaterial } from "@/lib/chunking";
import { extractMaterialText, isAcceptedMaterial } from "@/lib/material-extraction";
import { createClient } from "@/lib/supabase/server";
import type { Conceito, Flashcard, GlossarioItem, QuizQuestion } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AiActionState = { error: string };

function safeFileName(fileName: string) {
  return fileName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

function normalizedKey(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function mergeUnique<T>(existing: unknown, incoming: T[], key: (item: T) => string, limit: number) {
  const merged = [...(Array.isArray(existing) ? existing as T[] : []), ...incoming];
  const seen = new Set<string>();
  return merged.filter((item) => {
    const value = normalizedKey(key(item));
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  }).slice(0, limit);
}

export async function generateFromFileAction(
  _previousState: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const materiaId = String(formData.get("materia_id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const file = formData.get("arquivo");

  if (!materiaId || !(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo para continuar." };
  if (!isAcceptedMaterial(file.name)) return { error: "Envie um arquivo TXT, Markdown, PDF ou DOCX." };
  if (file.size > 8 * 1024 * 1024) return { error: "O arquivo deve ter no máximo 8 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: materia, error: materiaError } = await supabase
    .from("materias")
    .select("id, titulo, curso_id")
    .eq("id", materiaId)
    .maybeSingle();
  if (materiaError || !materia) return { error: "A matéria não foi encontrada ou você não possui acesso." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `${materiaId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("materiais").upload(objectPath, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadError) return { error: "Não foi possível armazenar o arquivo. Confira o bucket e as políticas do Supabase Storage." };

    const extractedText = await extractMaterialText(file);
    const generated = await generateStudyMaterial(materia.titulo, extractedText);
    const { error: updateError } = await supabase.from("materias").update({ conteudo: generated.conteudo }).eq("id", materiaId);
    if (updateError) return { error: "O resumo foi gerado, mas não foi possível salvá-lo na matéria." };

    revalidatePath("/admin");
    revalidatePath(`/admin/materias/${materiaId}`);
    revalidatePath(`/materias/${materiaId}`);
    revalidatePath(`/cursos/${cursoId || materia.curso_id}`);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Não foi possível processar o arquivo." };
  }

  redirect(`/admin/materias/${materiaId}`);
}

export async function generateLessonFromFileAction(
  _previousState: AiActionState,
  formData: FormData,
): Promise<AiActionState> {
  const aulaId = String(formData.get("aula_id") ?? "");
  const materiaId = String(formData.get("materia_id") ?? "");
  const file = formData.get("arquivo");
  if (!aulaId || !(file instanceof File) || file.size === 0) return { error: "Selecione um arquivo." };
  if (!isAcceptedMaterial(file.name)) return { error: "Envie um TXT, Markdown, PDF ou DOCX." };
  if (file.size > 8 * 1024 * 1024) return { error: "O arquivo deve ter no máximo 8 MB." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: aula } = await supabase.from("aulas").select("id, titulo, materia_id, descricao, conteudo, temas, conceitos, glossario, pontos_prova, flashcards, quiz").eq("id", aulaId).maybeSingle();
  if (!aula) return { error: "A aula não foi encontrada." };

  let trackedMaterialId: string | null = null;
  try {
    const { data: existingMaterial, error: existingMaterialError } = await supabase.from("aula_materiais").select("id, arquivo_path").eq("aula_id", aulaId).eq("nome", file.name).maybeSingle();
    if (existingMaterialError) return { error: "Execute a migration de gestão de materiais antes de enviar novos arquivos." };
    const buffer = Buffer.from(await file.arrayBuffer());
    const objectPath = `${aula.materia_id}/${aula.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage.from("materiais").upload(objectPath, buffer, { contentType: file.type || "application/octet-stream" });
    if (uploadError) return { error: "Não foi possível armazenar o arquivo." };
    const { data: trackedMaterial, error: trackError } = await supabase.from("aula_materiais").upsert({ aula_id: aulaId, materia_id: aula.materia_id, nome: file.name, arquivo_path: objectPath, tamanho_bytes: file.size, tipo_mime: file.type || null, status: "processando", erro: null, total_trechos: 0, atualizado_em: new Date().toISOString(), indexado_em: null }, { onConflict: "aula_id,nome" }).select("id").single();
    if (trackError || !trackedMaterial) {
      await supabase.storage.from("materiais").remove([objectPath]);
      return { error: "Não foi possível registrar o material. Execute a migration mais recente no Supabase." };
    }
    trackedMaterialId = trackedMaterial.id;
    if (existingMaterial?.arquivo_path && existingMaterial.arquivo_path !== objectPath) await supabase.storage.from("materiais").remove([existingMaterial.arquivo_path]);
    const extractedText = await extractMaterialText(file);
    const generated = await generateStudyMaterial(aula.titulo, extractedText);
    const sourceHeading = `## Material: ${file.name}`;
    const lessonUpdate = {
      conteudo: aula.conteudo ? `${aula.conteudo}\n\n---\n\n${sourceHeading}\n\n${generated.conteudo}` : `${sourceHeading}\n\n${generated.conteudo}`,
      temas: mergeUnique<string>(aula.temas, generated.temas, (item) => item, 30),
      conceitos: mergeUnique<Conceito>(aula.conceitos, generated.conceitos, (item) => item.titulo, 40),
      glossario: mergeUnique<GlossarioItem>(aula.glossario, generated.glossario, (item) => item.termo, 80),
      pontos_prova: mergeUnique<string>(aula.pontos_prova, generated.pontos_prova, (item) => item, 40),
      flashcards: mergeUnique<Flashcard>(aula.flashcards, generated.flashcards, (item) => item.frente, 50),
      quiz: mergeUnique<QuizQuestion>(aula.quiz, generated.quiz, (item) => item.pergunta, 30),
      arquivo_path: objectPath,
      atualizado_em: new Date().toISOString(),
      ...(!aula.descricao && generated.descricao ? { descricao: generated.descricao } : {}),
    };
    const { error: updateError } = await supabase.from("aulas").update(lessonUpdate).eq("id", aulaId);
    if (updateError) throw new Error("O resumo foi gerado, mas não foi possível salvá-lo.");
    const chunks = chunkMaterial(extractedText);
    const { error: deleteChunksError } = await supabase.from("material_chunks").delete().eq("aula_id", aulaId).eq("fonte_nome", file.name);
    if (deleteChunksError) throw new Error("O conteúdo foi gerado, mas não foi possível atualizar o índice de consulta.");
    const { data: lastChunk, error: lastChunkError } = await supabase.from("material_chunks").select("chunk_index").eq("aula_id", aulaId).lt("chunk_index", 100000).order("chunk_index", { ascending: false }).limit(1).maybeSingle();
    if (lastChunkError) throw new Error("O conteúdo foi gerado, mas não foi possível organizar o índice de consulta.");
    const firstChunkIndex = (lastChunk?.chunk_index ?? -1) + 1;
    if (chunks.length) {
      const { error: chunksError } = await supabase.from("material_chunks").insert(chunks.map((conteudo, chunkIndex) => ({ material_id: trackedMaterialId, aula_id: aulaId, materia_id: aula.materia_id, chunk_index: firstChunkIndex + chunkIndex, conteudo, fonte_nome: file.name, arquivo_path: objectPath })));
      if (chunksError) throw new Error("O conteúdo foi gerado, mas os trechos do chat não puderam ser indexados.");
    }
    await supabase.from("aula_materiais").update({ status: "indexado", erro: null, total_trechos: chunks.length, indexado_em: new Date().toISOString(), atualizado_em: new Date().toISOString() }).eq("id", trackedMaterialId);
    revalidatePath(`/admin/aulas/${aulaId}`);
    revalidatePath(`/admin/materias/${materiaId || aula.materia_id}`);
    revalidatePath(`/materias/${materiaId || aula.materia_id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível processar o arquivo.";
    if (trackedMaterialId) await supabase.from("aula_materiais").update({ status: "erro", erro: message, atualizado_em: new Date().toISOString() }).eq("id", trackedMaterialId);
    return { error: message };
  }
  redirect(`/admin/aulas/${aulaId}`);
}
