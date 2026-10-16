"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type AdminActionState = { error: string };

async function getAuthenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

function readMateria(formData: FormData) {
  return {
    curso_id: String(formData.get("curso_id") ?? "").trim(),
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    professor: String(formData.get("professor") ?? "").trim() || null,
    total_aulas: String(formData.get("total_aulas") ?? "").trim() ? Number(formData.get("total_aulas")) : null,
    avaliacao: String(formData.get("avaliacao") ?? "").trim() || null,
    bibliografia: String(formData.get("bibliografia") ?? "").trim() || null,
    publicado: formData.get("publicado") === "on",
  };
}

export async function createMateriaAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await getAuthenticatedClient();
  const materia = readMateria(formData);
  if (!materia.curso_id || !materia.titulo) return { error: "Selecione o curso e informe o título." };

  const { data, error } = await supabase.from("materias").insert(materia).select("id").single();
  if (error) return { error: "Não foi possível criar a matéria. Verifique as políticas de acesso do Supabase." };

  revalidatePath("/admin");
  revalidatePath(`/cursos/${materia.curso_id}`);
  redirect(`/admin/materias/${data.id}`);
}

export async function updateMateriaAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await getAuthenticatedClient();
  const id = String(formData.get("id") ?? "");
  const materia = readMateria(formData);
  if (!id || !materia.curso_id || !materia.titulo) return { error: "Os dados obrigatórios não foram preenchidos." };

  const { error } = await supabase.from("materias").update(materia).eq("id", id);
  if (error) return { error: "Não foi possível salvar a matéria. Verifique as políticas de acesso do Supabase." };

  revalidatePath("/admin");
  revalidatePath(`/cursos/${materia.curso_id}`);
  revalidatePath(`/materias/${id}`);
  redirect("/admin");
}

export async function toggleMateriaAction(formData: FormData) {
  const supabase = await getAuthenticatedClient();
  const id = String(formData.get("id") ?? "");
  const cursoId = String(formData.get("curso_id") ?? "");
  const publicado = formData.get("publicado") === "true";
  if (!id) return;

  await supabase.from("materias").update({ publicado: !publicado }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath(`/cursos/${cursoId}`);
  revalidatePath(`/materias/${id}`);
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
