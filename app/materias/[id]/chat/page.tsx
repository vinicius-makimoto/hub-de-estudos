import { Header } from "@/components/header";
import { StudyChat } from "@/components/study-chat";
import { createPublicClient } from "@/lib/supabase/public";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function MatterChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = createPublicClient();
  const { data } = await supabase.from("materias").select("id, titulo, descricao").eq("id", id).eq("publicado", true).maybeSingle();
  if (!data) notFound();
  return <main className="min-h-screen"><Header /><section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16"><Link href={`/materias/${id}`} className="text-sm font-bold text-slate-500 hover:text-[#69a7ff]">← Voltar à matéria</Link><p className="mt-10 font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Chat com referências"}</p><h1 className="mt-3 text-3xl font-black tracking-[-.04em] text-white sm:text-5xl">Converse com {data.titulo}</h1><p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">Faça perguntas sobre os materiais enviados. O tutor recupera os trechos mais relevantes antes de responder.</p><StudyChat materiaId={id} /></section></main>;
}
