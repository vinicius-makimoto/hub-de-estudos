"use client";

import { FormEvent, useEffect, useState } from "react";

type Reference = { index: number; aulaId: string; aulaTitulo: string; fonteNome: string | null; excerpt: string };
type Message = { id: string; role: "user" | "assistant"; content: string; references?: Reference[]; grounded?: boolean; interactionId?: string | null; feedback?: 1 | -1 };

export function StudyChat({ materiaId }: { materiaId: string }) {
  const storageKey = `hub-estudos:chat:${materiaId}`;
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) setMessages(JSON.parse(saved) as Message[]);
      } catch { localStorage.removeItem(storageKey); }
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storageKey]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
  }, [hydrated, messages, storageKey]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = question.trim();
    if (!value || pending) return;
    const recentHistory = messages.slice(-6).map(({ role, content }) => ({ role, content }));
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", content: value }]);
    setQuestion(""); setError(""); setPending(true);
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ materiaId, question: value, history: recentHistory }) });
      const payload = (await response.json()) as { answer?: string; references?: Reference[]; grounded?: boolean; interactionId?: string | null; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "Não foi possível obter uma resposta.");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: payload.answer!, references: payload.references, grounded: payload.grounded, interactionId: payload.interactionId }]);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível responder agora."); }
    finally { setPending(false); }
  }

  async function sendFeedback(messageId: string, interactionId: string, rating: 1 | -1) {
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedback: rating } : message));
    try {
      const response = await fetch("/api/chat/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ interactionId, rating }) });
      if (!response.ok) throw new Error();
    } catch {
      setMessages((current) => current.map((message) => message.id === messageId ? { ...message, feedback: undefined } : message));
      setError("Não foi possível registrar o feedback.");
    }
  }

  function clearHistory() { setMessages([]); localStorage.removeItem(storageKey); }

  return <div className="mt-8 grid gap-5">
    <div className="flex justify-end">{messages.length > 0 && <button type="button" onClick={clearHistory} className="text-xs font-bold text-slate-400 transition hover:text-white">Limpar conversa</button>}</div>
    <div className="min-h-80 rounded-2xl border border-white/10 bg-[#0d1a2d] p-4 sm:p-6">{messages.length === 0 ? <div className="grid min-h-64 place-items-center text-center"><div><span className="font-mono text-3xl text-[#1473f3]">?</span><h2 className="mt-3 font-bold text-white">Pergunte aos materiais da matéria</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-400">As respostas usam somente evidências das aulas, mantêm o contexto da conversa e mostram exatamente as fontes citadas.</p></div></div> : <div className="grid gap-5">{messages.map((message) => <article key={message.id} className={message.role === "user" ? "ml-auto max-w-2xl rounded-2xl bg-[#1473f3] px-5 py-4 text-sm leading-7 text-white" : "max-w-3xl rounded-2xl border border-white/10 bg-[#08111f] px-5 py-5 text-sm leading-7 text-slate-200"}>
      {message.role === "assistant" && <span className={`mb-3 inline-flex rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${message.grounded ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>{message.grounded ? "Resposta fundamentada" : "Evidência insuficiente"}</span>}
      <p className="whitespace-pre-wrap">{message.content}</p>
      {message.references && message.references.length > 0 && <div className="mt-5 border-t border-white/10 pt-4"><p className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-[#69a7ff]">Evidências citadas</p><ol className="mt-3 grid gap-3">{message.references.map((reference) => <li key={`${message.id}-${reference.index}`}><a href={`/materias/${materiaId}#aula-${reference.aulaId}`} className="block rounded-lg border border-white/10 p-3 transition hover:border-[#1473f3]/40"><strong className="text-xs text-white">[{reference.index}] {reference.aulaTitulo}</strong><span className="mt-1 block text-xs leading-5 text-slate-400">{reference.excerpt}…</span>{reference.fonteNome && <span className="mt-1 block font-mono text-[10px] text-slate-500">{reference.fonteNome}</span>}</a></li>)}</ol></div>}
      {message.role === "assistant" && message.interactionId && <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3"><span className="mr-1 text-xs text-slate-500">Esta resposta ajudou?</span><button type="button" aria-label="Resposta útil" aria-pressed={message.feedback === 1} onClick={() => sendFeedback(message.id, message.interactionId!, 1)} className={`rounded-lg px-2.5 py-1 text-sm transition ${message.feedback === 1 ? "bg-emerald-400/15 text-emerald-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>Sim</button><button type="button" aria-label="Resposta não útil" aria-pressed={message.feedback === -1} onClick={() => sendFeedback(message.id, message.interactionId!, -1)} className={`rounded-lg px-2.5 py-1 text-sm transition ${message.feedback === -1 ? "bg-rose-400/15 text-rose-300" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>Não</button></div>}
    </article>)}{pending && <p role="status" className="text-sm text-slate-400">Consultando e verificando os materiais…</p>}</div>}</div>
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-4"><label className="sr-only" htmlFor="study-question">Pergunta</label><textarea id="study-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} maxLength={500} rows={3} placeholder="Ex.: Qual é a diferença entre MCP e A2A?" className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-slate-500" /><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"><span className="text-xs text-slate-500">{question.length}/500 · Enter envia, Shift + Enter quebra a linha</span><button disabled={pending || !question.trim()} className="rounded-lg bg-[#1473f3] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#005de0] disabled:cursor-not-allowed disabled:opacity-40">{pending ? "Verificando…" : "Enviar pergunta"}</button></div>{error && <p role="alert" className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{error}</p>}</form>
  </div>;
}
