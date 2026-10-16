"use server";

import { createClient } from "@/lib/supabase/server";
import { chunkMaterial } from "@/lib/chunking";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AulaActionState = { error: string };

function readPairs(value: FormDataEntryValue | null, left: string, right: string) {
  return String(value ?? "").split("\n").flatMap((line) => {
    const [first, ...rest] = line.split("||");
    const second = rest.join("||").trim();
    if (!first?.trim() || !second) return [];
    return [{ [left]: first.trim(), [right]: second }];
  });
}

function readQuiz(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object");
  } catch {
    return null;
  }
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

function readAula(formData: FormData) {
  const quiz = readQuiz(formData.get("quiz"));
  return {
    materia_id: String(formData.get("materia_id") ?? ""),
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    conteudo: String(formData.get("conteudo") ?? "").trim() || null,
    temas: String(formData.get("temas") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
    ordem: Number(formData.get("ordem") ?? 0),
    publicado: formData.get("publicado") === "on",
    planejada: formData.get("planejada") === "on",
    data_prevista: String(formData.get("data_prevista") ?? "").trim() || null,
    conceitos: readPairs(formData.get("conceitos"), "titulo", "descricao"),
    glossario: readPairs(formData.get("glossario"), "termo", "definicao"),
    pontos_prova: String(formData.get("pontos_prova") ?? "").split("\n").map((item) => item.trim()).filter(Boolean),
    flashcards: readPairs(formData.get("flashcards"), "frente", "verso"),
    quiz,
    atualizado_em: new Date().toISOString(),
  };
}

export async function createAulaAction(_state: AulaActionState, formData: FormData): Promise<AulaActionState> {
  const supabase = await authenticatedClient();
  const aula = readAula(formData);
  if (!aula.materia_id || !aula.titulo) return { error: "Informe o título da aula." };
  if (aula.quiz === null) return { error: "O JSON do quiz não é válido." };
  if (aula.publicado && aula.planejada) return { error: "Uma aula não pode estar publicada e marcada como em breve ao mesmo tempo." };
  const { data, error } = await supabase.from("aulas").insert(aula).select("id").single();
  if (error) return { error: "Não foi possível criar a aula." };
  revalidatePath(`/admin/materias/${aula.materia_id}`);
  redirect(`/admin/aulas/${data.id}`);
}

export async function updateAulaAction(_state: AulaActionState, formData: FormData): Promise<AulaActionState> {
  const supabase = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const aula = readAula(formData);
  if (!id || !aula.materia_id || !aula.titulo) return { error: "Preencha os campos obrigatórios." };
  if (aula.quiz === null) return { error: "O JSON do quiz não é válido." };
  if (aula.publicado && aula.planejada) return { error: "Uma aula não pode estar publicada e marcada como em breve ao mesmo tempo." };
  const { error } = await supabase.from("aulas").update(aula).eq("id", id);
  if (error) return { error: "Não foi possível salvar a aula." };
  const { error: deleteIndexError } = await supabase.from("material_chunks").delete().eq("aula_id", id).gte("chunk_index", 100000);
  if (deleteIndexError) return { error: "A aula foi salva, mas o índice do chat não pôde ser atualizado." };
  const reviewedChunks = chunkMaterial(aula.conteudo ?? "");
  if (reviewedChunks.length) {
    const { error: indexError } = await supabase.from("material_chunks").insert(reviewedChunks.map((conteudo, index) => ({ aula_id: id, materia_id: aula.materia_id, chunk_index: 100000 + index, conteudo, fonte_nome: "Conteúdo revisado da aula" })));
    if (indexError) return { error: "A aula foi salva, mas o conteúdo revisado não pôde ser indexado." };
  }
  revalidatePath(`/admin/materias/${aula.materia_id}`);
  revalidatePath(`/admin/aulas/${id}`);
  revalidatePath(`/materias/${aula.materia_id}`);
  redirect(`/admin/materias/${aula.materia_id}`);
}

export async function toggleAulaAction(formData: FormData) {
  const supabase = await authenticatedClient();
  const id = String(formData.get("id") ?? "");
  const materiaId = String(formData.get("materia_id") ?? "");
  const publicado = formData.get("publicado") === "true";
  await supabase.from("aulas").update({ publicado: !publicado, planejada: false, atualizado_em: new Date().toISOString() }).eq("id", id);
  revalidatePath(`/admin/materias/${materiaId}`);
  revalidatePath(`/materias/${materiaId}`);
}
