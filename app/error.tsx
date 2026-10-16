"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-rose-100 text-2xl font-bold text-rose-600">!</span>
        <h1 className="mt-5 text-2xl font-bold text-slate-900">Algo não saiu como esperado</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">Não conseguimos abrir esta página. Você pode tentar novamente agora.</p>
        <button onClick={reset} className="mt-6 rounded-xl bg-[#1473f3] px-5 py-3 text-sm font-bold text-white hover:bg-[#005de0]">Tentar novamente</button>
      </div>
    </main>
  );
}
