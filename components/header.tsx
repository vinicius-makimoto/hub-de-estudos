import Link from "next/link";
import { BookIcon } from "./icons";

export function Header() {
  return (
    <header className="border-b border-slate-200/70 bg-white/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3 font-bold tracking-tight text-slate-900" aria-label="Hub de Estudos — início">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6750e6] text-white shadow-lg shadow-violet-200"><BookIcon className="size-5" /></span>
          <span className="text-lg">Hub de Estudos</span>
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-6 text-sm font-semibold text-slate-600">
          <a href="#cursos" className="transition hover:text-[#6750e6]">Cursos</a>
          <span className="hidden rounded-full bg-violet-50 px-3 py-1.5 text-[#6750e6] sm:inline">Sua jornada começa aqui</span>
        </nav>
      </div>
    </header>
  );
}
