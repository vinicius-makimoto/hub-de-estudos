"use client";

import type { Conceito, Flashcard, GlossarioItem, QuizQuestion } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

type StudyToolsProps = {
  aulaId: string;
  conceitos?: Conceito[];
  glossario?: GlossarioItem[];
  pontosProva?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizQuestion[];
};

type Tool = "conceitos" | "glossario" | "prova" | "flashcards" | "quiz";
type SavedProgress = { rememberedCards: number[]; bestScore: number; attempts: number };
const emptyProgress: SavedProgress = { rememberedCards: [], bestScore: 0, attempts: 0 };

export function StudyTools({ aulaId, conceitos = [], glossario = [], pontosProva = [], flashcards = [], quiz = [] }: StudyToolsProps) {
  const storageKey = `hub-estudos:revisao:${aulaId}`;
  const tools = useMemo(() => [
    { id: "conceitos" as const, label: "Conceitos", count: conceitos.length },
    { id: "glossario" as const, label: "Glossário", count: glossario.length },
    { id: "prova" as const, label: "Pontos de prova", count: pontosProva.length },
    { id: "flashcards" as const, label: "Flashcards", count: flashcards.length },
    { id: "quiz" as const, label: "Quiz", count: quiz.length },
  ].filter((tool) => tool.count > 0), [conceitos.length, flashcards.length, glossario.length, pontosProva.length, quiz.length]);
  const [active, setActive] = useState<Tool>((tools.find((tool) => tool.id === "flashcards")?.id ?? tools[0]?.id ?? "conceitos") as Tool);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [rememberedCards, setRememberedCards] = useState<Set<number>>(new Set());
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [confirmedAnswers, setConfirmedAnswers] = useState<Set<number>>(new Set());
  const [bestScore, setBestScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "null") as SavedProgress | null;
        if (saved) {
          setRememberedCards(new Set(saved.rememberedCards.filter((index) => index < flashcards.length)));
          setBestScore(saved.bestScore || 0);
          setAttempts(saved.attempts || 0);
        }
      } catch { localStorage.removeItem(storageKey); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [flashcards.length, storageKey]);

  if (!tools.length) return null;
  const score = quiz.reduce((total, question, index) => total + (confirmedAnswers.has(index) && answers[index] === question.correta ? 1 : 0), 0);
  const quizFinished = quiz.length > 0 && confirmedAnswers.size === quiz.length;
  const card = flashcards[cardIndex];
  const cardProgress = flashcards.length ? Math.round((rememberedCards.size / flashcards.length) * 100) : 0;

  function saveProgress(next: Partial<SavedProgress>) {
    const progress = { ...emptyProgress, rememberedCards: [...rememberedCards], bestScore, attempts, ...next };
    localStorage.setItem(storageKey, JSON.stringify(progress));
  }

  function rateCard(remembered: boolean) {
    const next = new Set(rememberedCards);
    if (remembered) next.add(cardIndex); else next.delete(cardIndex);
    setRememberedCards(next);
    saveProgress({ rememberedCards: [...next] });
    if (cardIndex < flashcards.length - 1) { setCardIndex((value) => value + 1); setFlipped(false); }
  }

  function confirmAnswer(questionIndex: number) {
    if (answers[questionIndex] == null || confirmedAnswers.has(questionIndex)) return;
    const nextConfirmed = new Set(confirmedAnswers).add(questionIndex);
    setConfirmedAnswers(nextConfirmed);
    if (nextConfirmed.size === quiz.length) {
      const finalScore = quiz.reduce((total, question, index) => total + (answers[index] === question.correta ? 1 : 0), 0);
      const nextBest = Math.max(bestScore, finalScore);
      const nextAttempts = attempts + 1;
      setBestScore(nextBest);
      setAttempts(nextAttempts);
      saveProgress({ bestScore: nextBest, attempts: nextAttempts });
    }
  }

  function resetQuiz() {
    setAnswers({});
    setConfirmedAnswers(new Set());
  }

  return <section id={`revisao-${aulaId}`} className="mt-10 scroll-mt-24 border-t border-white/10 pt-8" aria-labelledby={`study-tools-title-${aulaId}`}>
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Revisão ativa"}</p><h3 id={`study-tools-title-${aulaId}`} className="mt-2 text-xl font-bold text-slate-900">Flashcards e quiz da aula</h3></div><span className="text-xs text-slate-400">Seu progresso fica salvo neste navegador</span></div>
    <div className="mt-5 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label="Ferramentas da aula">{tools.map((tool) => <button key={tool.id} type="button" role="tab" aria-selected={active === tool.id} onClick={() => setActive(tool.id)} className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold transition ${active === tool.id ? "border-[#1473f3] bg-[#1473f3] text-white" : "border-white/10 bg-white/[.03] text-slate-500 hover:border-[#1473f3]/40 hover:text-white"}`}>{tool.label} <span className="ml-1 opacity-70">{tool.count}</span></button>)}</div>
    <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d1a2d] p-5 sm:p-6">
      {active === "conceitos" && <div className="grid gap-3 sm:grid-cols-2">{conceitos.map((item) => <article key={item.titulo} className="rounded-xl border border-white/10 bg-white/[.03] p-4"><h4 className="font-bold text-[#9bc5ff]">{item.titulo}</h4><p className="mt-2 text-sm leading-6 text-slate-400">{item.descricao}</p></article>)}</div>}
      {active === "glossario" && <dl className="grid gap-4">{glossario.map((item) => <div key={item.termo} className="border-b border-white/10 pb-4 last:border-0 last:pb-0"><dt className="font-mono text-sm font-bold text-[#9bc5ff]">{item.termo}</dt><dd className="mt-1 text-sm leading-6 text-slate-400">{item.definicao}</dd></div>)}</dl>}
      {active === "prova" && <ul className="grid gap-3">{pontosProva.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-slate-300"><span className="mt-0.5 text-[#1473f3]">★</span><span>{point}</span></li>)}</ul>}
      {active === "flashcards" && card && <div><div className="mb-4 flex items-center justify-between gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${cardProgress}%` }}/></div><span className="font-mono text-xs text-slate-400">{rememberedCards.size}/{flashcards.length} lembrados</span></div><button type="button" onClick={() => setFlipped((value) => !value)} aria-pressed={flipped} className="min-h-52 w-full rounded-xl border border-[#1473f3]/25 bg-[#08111f] p-7 text-left transition hover:border-[#1473f3]/60"><span className="font-mono text-xs uppercase tracking-[.15em] text-[#69a7ff]">{flipped ? "Resposta" : "Pergunta"}</span><span className="mt-5 block text-lg font-bold leading-8 text-white">{flipped ? card.verso : card.frente}</span><span className="mt-6 block text-xs text-slate-400">Clique para virar o cartão</span></button>{flipped && <div className="mt-4 grid gap-2 sm:grid-cols-2"><button type="button" onClick={() => rateCard(false)} className="rounded-lg border border-amber-400/25 px-4 py-3 text-sm font-bold text-amber-200 hover:bg-amber-400/10">Preciso revisar</button><button type="button" onClick={() => rateCard(true)} className="rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-400">Lembrei</button></div>}<div className="mt-4 flex items-center justify-between"><button type="button" disabled={cardIndex === 0} onClick={() => { setCardIndex((value) => value - 1); setFlipped(false); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 disabled:opacity-30">← Anterior</button><span className="font-mono text-xs text-slate-400">{cardIndex + 1} / {flashcards.length}</span><button type="button" disabled={cardIndex === flashcards.length - 1} onClick={() => { setCardIndex((value) => value + 1); setFlipped(false); }} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-400 disabled:opacity-30">Próximo →</button></div></div>}
      {active === "quiz" && <div className="grid gap-7">{(attempts > 0 || bestScore > 0) && <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-[#08111f] p-3 text-xs text-slate-400"><span>Tentativas: <strong className="text-white">{attempts}</strong></span><span>Melhor resultado: <strong className="text-[#69a7ff]">{bestScore}/{quiz.length}</strong></span></div>}{quiz.map((question, questionIndex) => { const confirmed = confirmedAnswers.has(questionIndex); const answeredCorrectly = confirmed && answers[questionIndex] === question.correta; return <fieldset key={`${question.pergunta}-${questionIndex}`} className="border-b border-white/10 pb-7 last:border-0 last:pb-0"><legend className="font-bold leading-7 text-white"><span className="mr-2 font-mono text-[#69a7ff]">{String(questionIndex + 1).padStart(2, "0")}</span>{question.pergunta}</legend><div className="mt-4 grid gap-2">{question.opcoes.map((option, optionIndex) => { const selected = answers[questionIndex] === optionIndex; const correct = confirmed && optionIndex === question.correta; const wrong = confirmed && selected && optionIndex !== question.correta; return <label key={`${option}-${optionIndex}`} className={`flex gap-3 rounded-xl border p-3 text-sm leading-6 transition ${confirmed ? "cursor-default" : "cursor-pointer"} ${correct ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200" : wrong ? "border-rose-400/40 bg-rose-500/10 text-rose-200" : selected ? "border-[#1473f3]/60 bg-[#1473f3]/10 text-white" : "border-white/10 text-slate-400 hover:border-white/20"}`}><input type="radio" name={`question-${aulaId}-${questionIndex}`} checked={selected} disabled={confirmed} onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: optionIndex }))} className="mt-1 accent-[#1473f3]"/><span>{option}</span></label>; })}</div>{confirmed ? <div role="status" className={`mt-3 rounded-xl border p-3 text-sm leading-6 ${answeredCorrectly ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200" : "border-rose-400/30 bg-rose-500/10 text-rose-200"}`}><p className="font-bold">{answeredCorrectly ? "Resposta correta!" : "Resposta incorreta."}</p><p className="mt-1"><strong>Explicação:</strong> {question.explicacao}</p></div> : <button type="button" disabled={answers[questionIndex] == null} onClick={() => confirmAnswer(questionIndex)} className="mt-3 rounded-lg bg-[#1473f3] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#005de0] disabled:cursor-not-allowed disabled:opacity-40">Confirmar resposta</button>}</fieldset>; })}{quizFinished ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1473f3]/25 bg-[#1473f3]/10 p-4" role="status"><p className="font-bold text-white">Resultado: <span className="text-[#69a7ff]">{score} de {quiz.length}</span> · {Math.round((score / quiz.length) * 100)}%</p><button type="button" onClick={resetQuiz} className="rounded-lg bg-[#1473f3] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#005de0]">Tentar novamente</button></div> : <p className="text-xs text-slate-400">Escolha uma alternativa e confirme cada resposta para concluir o quiz.</p>}</div>}
    </div>
  </section>;
}
