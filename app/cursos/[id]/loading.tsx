import { Header } from "@/components/header";

export default function LoadingCourse() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8" aria-label="Carregando matérias" aria-busy="true">
        <div className="skeleton h-5 w-32 rounded-full" />
        <div className="skeleton mt-8 h-64 rounded-[2rem]" />
        <div className="skeleton mt-12 h-8 w-40 rounded-xl" />
        <div className="mt-6 grid gap-4">
          {[0, 1, 2].map((item) => <div key={item} className="skeleton h-28 rounded-3xl" />)}
        </div>
      </div>
    </main>
  );
}
