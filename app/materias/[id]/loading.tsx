import { Header } from "@/components/header";

export default function LoadingSubject() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8" aria-label="Carregando matéria" aria-busy="true">
        <div className="skeleton h-5 w-36 rounded-full" />
        <div className="skeleton mt-9 h-14 max-w-3xl rounded-2xl" />
        <div className="skeleton mt-5 h-7 max-w-2xl rounded-xl" />
        <div className="mt-16 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="skeleton h-96 rounded-[2rem]" />
          <div className="skeleton h-52 rounded-3xl" />
        </div>
      </div>
    </main>
  );
}
