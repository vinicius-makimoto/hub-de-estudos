import { Header } from "@/components/header";

export default function Loading() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="skeleton h-5 w-36 rounded-full" />
        <div className="skeleton mt-7 h-14 max-w-2xl rounded-2xl" />
        <div className="skeleton mt-4 h-7 max-w-xl rounded-xl" />
        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-label="Carregando cursos" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="overflow-hidden rounded-3xl border border-slate-200 bg-white"><div className="skeleton h-36" /><div className="p-6"><div className="skeleton h-5 w-24 rounded-full" /><div className="skeleton mt-5 h-7 w-4/5 rounded-lg" /><div className="skeleton mt-4 h-10 rounded-lg" /></div></div>)}
        </div>
      </div>
    </main>
  );
}
