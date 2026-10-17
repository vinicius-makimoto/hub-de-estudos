import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f11]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:min-h-18 sm:flex-nowrap sm:px-8 sm:py-0">
        <Link href="/" className="group font-mono text-sm font-bold tracking-[-.03em] text-white sm:text-base" aria-label="Hub de Estudos — início">
          <span className="text-[#1473f3]">&lt;/</span>
          <span className="transition group-hover:text-[#69a7ff]">HubEstudos</span>
          <span className="text-[#1473f3]">/&gt;</span>
        </Link>
        <nav aria-label="Navegação principal" className="order-3 flex w-full items-center justify-between gap-2 overflow-x-auto border-t border-white/10 pt-3 text-xs font-semibold text-[#aab4c3] sm:order-none sm:w-auto sm:justify-start sm:gap-6 sm:overflow-visible sm:border-0 sm:pt-0 sm:text-sm">
          <Link href="/#cursos" className="shrink-0 rounded-lg px-2 py-2 transition hover:text-white sm:px-0">Cursos</Link>
          <Link href="/glossario" className="shrink-0 rounded-lg px-2 py-2 transition hover:text-white sm:px-0">Glossário</Link>
          <Link href="/buscar" className="shrink-0 rounded-lg px-2 py-2 transition hover:text-white sm:px-0">Buscar</Link>
          <Link href="/admin" className="rounded-lg border border-white/10 bg-white/[.04] px-3.5 py-2 text-xs font-bold text-white transition hover:border-[#1473f3]/60 hover:bg-[#1473f3]/10 sm:px-4 sm:text-sm">Painel</Link>
        </nav>
      </div>
    </header>
  );
}
