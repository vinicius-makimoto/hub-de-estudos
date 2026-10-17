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

function readCurso(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    publicado: formData.get("publicado") === "on",
  };
}

export async function createCursoAction(
  _previousState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const supabase = await getAuthenticatedClient();
  const curso = readCurso(formData);
  const cover = formData.get("capa");
  if (!curso.titulo) return { error: "Informe o título do curso." };
  if (cover instanceof File && cover.size > 0 && (!cover.type.startsWith("image/") || !["image/jpeg", "image/png", "image/webp"].includes(cover.type))) return { error: "Envie uma capa JPG, PNG ou WebP." };
  if (cover instanceof File && cover.size > 5 * 1024 * 1024) return { error: "A imagem da capa deve ter no máximo 5 MB." };

  let coverPath: string | null = null;
  let coverUrl: string | null = null;
  if (cover instanceof File && cover.size > 0) {
    const extension = cover.name.split(".").pop()?.toLowerCase() || "jpg";
    coverPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("capas-cursos").upload(coverPath, cover, { contentType: cover.type, upsert: false });
    if (uploadError) return { error: "Não foi possível enviar a capa. Execute a migration do bucket de capas no Supabase." };
    coverUrl = supabase.storage.from("capas-cursos").getPublicUrl(coverPath).data.publicUrl;
  }

  const { data, error } = await supabase.from("cursos").insert({ ...curso, imagem_url: coverUrl }).select("id").single();
  if (error || !data) {
    if (coverPath) await supabase.storage.from("capas-cursos").remove([coverPath]);
    if (error?.code === "42501") return { error: "Seu usuário não possui permissão para criar cursos. A política de acesso do Supabase precisa permitir inserções para usuários autenticados." };
    if (error?.code === "PGRST204" || error?.code === "42703") return { error: "A estrutura da tabela de cursos está desatualizada em relação ao formulário." };
    return { error: "Não foi possível criar o curso. Tente novamente ou confira a configuração do Supabase." };
  }

  revalidatePath("/");
  revalidatePath("/admin");
  redirect(`/admin/materias/nova?curso=${data.id}`);
}

function coverPathFromUrl(url: string | null | undefined) {
  const marker = "/storage/v1/object/public/capas-cursos/";
  const index = url?.indexOf(marker) ?? -1;
  return index >= 0 && url ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

export async function updateCursoAction(_previousState: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const supabase = await getAuthenticatedClient();
  const id = String(formData.get("id") ?? "");
  const curso = readCurso(formData);
  const cover = formData.get("capa");
  if (!id || !curso.titulo) return { error: "Informe o título do curso." };
  if (cover instanceof File && cover.size > 0 && !["image/jpeg", "image/png", "image/webp"].includes(cover.type)) return { error: "Envie uma capa JPG, PNG ou WebP." };
  if (cover instanceof File && cover.size > 5 * 1024 * 1024) return { error: "A imagem da capa deve ter no máximo 5 MB." };

  const { data: current } = await supabase.from("cursos").select("imagem_url").eq("id", id).maybeSingle();
  let newPath: string | null = null;
  let imageUrl = current?.imagem_url ?? null;
  if (cover instanceof File && cover.size > 0) {
    const extension = cover.name.split(".").pop()?.toLowerCase() || "jpg";
    newPath = `${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("capas-cursos").upload(newPath, cover, { contentType: cover.type, upsert: false });
    if (uploadError) return { error: "Não foi possível enviar a nova capa." };
    imageUrl = supabase.storage.from("capas-cursos").getPublicUrl(newPath).data.publicUrl;
  }
  const { error } = await supabase.from("cursos").update({ ...curso, imagem_url: imageUrl }).eq("id", id);
  if (error) {
    if (newPath) await supabase.storage.from("capas-cursos").remove([newPath]);
    return { error: error.code === "42501" ? "Seu usuário não possui permissão para editar cursos." : "Não foi possível salvar o curso." };
  }
  const oldPath = coverPathFromUrl(current?.imagem_url);
  if (newPath && oldPath && oldPath !== newPath) await supabase.storage.from("capas-cursos").remove([oldPath]);
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath(`/cursos/${id}`);
  redirect("/admin");
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

export async function deleteMateriaAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: materia } = await supabase.from("materias").select("id, curso_id").eq("id", id).maybeSingle();
  if (!materia) return;
  const [{ data: materials }, { data: lessons }] = await Promise.all([
    supabase.from("aula_materiais").select("arquivo_path").eq("materia_id", id),
    supabase.from("aulas").select("arquivo_path").eq("materia_id", id),
  ]);
  const paths = Array.from(new Set([...(materials ?? []), ...(lessons ?? [])].map((item) => item.arquivo_path).filter(Boolean)));
  if (paths.length) {
    const { error: storageError } = await supabase.storage.from("materiais").remove(paths);
    if (storageError) throw new Error("Não foi possível remover os arquivos da matéria.");
  }
  const cleanup = [
    await supabase.from("material_chunks").delete().eq("materia_id", id),
    await supabase.from("aula_materiais").delete().eq("materia_id", id),
    await supabase.from("aulas").delete().eq("materia_id", id),
  ];
  if (cleanup.some((result) => result.error)) throw new Error("Não foi possível excluir os dados relacionados à matéria.");
  const { error } = await supabase.from("materias").delete().eq("id", id);
  if (error) throw new Error("Não foi possível excluir a matéria.");

  revalidatePath("/admin");
  revalidatePath(`/cursos/${materia.curso_id}`);
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
