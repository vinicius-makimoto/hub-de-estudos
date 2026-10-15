"use client";

import { useSyncExternalStore } from "react";

const eventName = "study-progress-change";

function storageKey(id: string) {
  return `hub-estudos:materia:${id}:concluida`;
}

export function StudyProgress({ materiaId }: { materiaId: string }) {
  const completed = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("storage", onStoreChange);
      window.addEventListener(eventName, onStoreChange);
      return () => {
        window.removeEventListener("storage", onStoreChange);
        window.removeEventListener(eventName, onStoreChange);
      };
    },
    () => window.localStorage.getItem(storageKey(materiaId)) === "true",
    () => false,
  );

  function toggleCompleted() {
    window.localStorage.setItem(storageKey(materiaId), String(!completed));
    window.dispatchEvent(new Event(eventName));
  }

  return (
    <div className={`rounded-3xl border p-5 transition ${completed ? "border-emerald-200 bg-emerald-50" : "border-violet-100 bg-violet-50"}`}>
      <p className={`text-xs font-bold uppercase tracking-[.16em] ${completed ? "text-emerald-700" : "text-[#6750e6]"}`}>Seu progresso</p>
      <p className="mt-2 text-sm font-semibold text-slate-700">{completed ? "Matéria concluída" : "Em andamento"}</p>
      <button type="button" onClick={toggleCompleted} className={`mt-4 w-full rounded-xl px-4 py-3 text-sm font-bold transition ${completed ? "bg-white text-emerald-700 shadow-sm hover:bg-emerald-100" : "bg-[#6750e6] text-white hover:bg-[#4936c9]"}`}>
        {completed ? "Marcar como não concluída" : "Marcar como concluída"}
      </button>
    </div>
  );
}
