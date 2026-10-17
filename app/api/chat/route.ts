import { answerWithStudyContext, type ChatHistoryItem } from "@/lib/groq";
import { createPublicClient } from "@/lib/supabase/public";
import { NextResponse } from "next/server";

type RetrievedChunk = { chunk_id: string; aula_id: string; aula_titulo: string; materia_id: string; materia_titulo: string; conteudo: string; fonte_nome: string | null; rank: number };
type ChatBody = { materiaId?: string; question?: string; history?: ChatHistoryItem[] };

const retrievalStopWords = new Set(["a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos", "e", "ela", "ele", "em", "entre", "essa", "esse", "esta", "este", "isso", "na", "nas", "no", "nos", "o", "os", "ou", "para", "por", "qual", "que", "se", "ser", "sobre", "tem", "uma", "um"]);

function retrievalTerms(question: string) {
  return Array.from(new Set(question.normalize("NFC").match(/[\p{L}\p{N}]{3,}/gu) ?? []))
    .filter((term) => !retrievalStopWords.has(term.toLocaleLowerCase("pt-BR")))
    .sort((left, right) => Number(/^[A-Z0-9]{2,}$/.test(right)) - Number(/^[A-Z0-9]{2,}$/.test(left)) || right.length - left.length)
    .slice(0, 4);
}

function isContextDependent(question: string) {
  return /\b(isso|isto|essa|esse|ele|ela|anterior|acima|tamb[eé]m|nesse|nessa|disso|dela|dele)\b/i.test(question) || /^(e|mas|por que|como assim)\b/i.test(question.trim());
}

function readHistory(value: unknown): ChatHistoryItem[] {
  if (!Array.isArray(value)) return [];
  return value.slice(-6).flatMap((item): ChatHistoryItem[] => {
    if (!item || typeof item !== "object") return [];
    const role = "role" in item ? item.role : null;
    const content = "content" in item && typeof item.content === "string" ? item.content.trim().slice(0, 700) : "";
    return (role === "user" || role === "assistant") && content ? [{ role, content }] : [];
  });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatBody;
    const materiaId = body.materiaId?.trim();
    const question = body.question?.trim();
    if (!materiaId || !question) return NextResponse.json({ error: "Informe uma pergunta." }, { status: 400 });
    if (question.length > 500) return NextResponse.json({ error: "A pergunta deve ter no máximo 500 caracteres." }, { status: 400 });

    const supabase = createPublicClient();
    const { data: subject } = await supabase.from("materias").select("id").eq("id", materiaId).eq("publicado", true).maybeSingle();
    if (!subject) return NextResponse.json({ error: "Matéria não encontrada." }, { status: 404 });
    const history = readHistory(body.history);
    const previousQuestion = [...history].reverse().find((item) => item.role === "user")?.content;
    const retrievalQuery = previousQuestion && isContextDependent(question) ? `${previousQuestion} ${question}`.slice(0, 900) : question;
    const terms = retrievalTerms(question);
    const searches = await Promise.all([
      supabase.rpc("search_material_chunks", { search_query: retrievalQuery, target_materia_id: materiaId, match_count: 8 }),
      ...terms.map((term) => supabase.rpc("search_material_chunks", { search_query: term, target_materia_id: materiaId, match_count: 4 })),
    ]);
    if (searches[0].error) return NextResponse.json({ error: "Não foi possível consultar os materiais agora." }, { status: 500 });
    const combined = searches.flatMap((result) => (result.data ?? []) as RetrievedChunk[]);
    const byId = new Map<string, RetrievedChunk & { retrievalScore: number }>();
    for (const chunk of combined) {
      const normalizedContent = chunk.conteudo.toLocaleLowerCase("pt-BR");
      const exactMatches = terms.filter((term) => normalizedContent.includes(term.toLocaleLowerCase("pt-BR"))).length;
      const retrievalScore = chunk.rank + exactMatches * 0.35;
      const previous = byId.get(chunk.chunk_id);
      if (!previous || retrievalScore > previous.retrievalScore) byId.set(chunk.chunk_id, { ...chunk, retrievalScore });
    }
    const chunks = [...byId.values()].sort((left, right) => right.retrievalScore - left.retrievalScore).slice(0, 10);
    if (!chunks.length || Math.max(...chunks.map((chunk) => chunk.rank)) < 0.015) {
      const answer = "Não encontrei evidências suficientes nos materiais indexados para responder com segurança. Tente usar termos presentes nas aulas ou adicione um material sobre esse assunto.";
      const { data: recordedId } = await supabase.rpc("record_chat_interaction", { target_materia_id: materiaId, user_question: question, assistant_answer: answer, source_chunk_ids: [], is_grounded: false });
      return NextResponse.json({ answer, references: [], grounded: false, interactionId: typeof recordedId === "string" ? recordedId : null });
    }

    const result = await answerWithStudyContext(question, chunks.map((chunk) => ({ aulaTitulo: chunk.aula_titulo, conteudo: chunk.conteudo, fonteNome: chunk.fonte_nome })), history);
    const references = result.citedIndexes.map((index) => {
      const chunk = chunks[index - 1];
      return { index, chunkId: chunk.chunk_id, aulaId: chunk.aula_id, aulaTitulo: chunk.aula_titulo, fonteNome: chunk.fonte_nome, excerpt: chunk.conteudo.slice(0, 360).trim() };
    });
    let interactionId: string | null = null;
    const { data: recordedId } = await supabase.rpc("record_chat_interaction", { target_materia_id: materiaId, user_question: question, assistant_answer: result.answer, source_chunk_ids: references.map((reference) => reference.chunkId), is_grounded: result.grounded });
    if (typeof recordedId === "string") interactionId = recordedId;
    return NextResponse.json({ answer: result.answer, references, grounded: result.grounded, interactionId });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível responder agora." }, { status: 500 });
  }
}
