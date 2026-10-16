import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f11]/85 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group font-mono text-sm font-bold tracking-[-.03em] text-white sm:text-base" aria-label="Hub de Estudos — início">
          <span className="text-[#1473f3]">&lt;/</span>
          <span className="transition group-hover:text-[#69a7ff]">HubEstudos</span>
          <span className="text-[#1473f3]">/&gt;</span>
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-2 text-sm font-semibold text-[#aab4c3] sm:gap-6">
          <Link href="/#cursos" className="hidden transition hover:text-white sm:block">Cursos</Link>
          <Link href="/glossario" className="hidden transition hover:text-white sm:block">Glossário</Link>
          <Link href="/buscar" className="hidden transition hover:text-white sm:block">Buscar</Link>
          <Link href="/admin" className="rounded-lg border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#1473f3]/60 hover:bg-[#1473f3]/10 sm:px-4 sm:text-sm">Painel</Link>
        </nav>
      </div>
    </header>
  );
}
