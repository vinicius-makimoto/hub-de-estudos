import { extractMarkdownHeadings } from "@/lib/markdown-headings";
import type { Aula } from "@/lib/types";

export function SubjectToc({ aulas }: { aulas: Aula[] }) {
  return <nav aria-label="Sumário da matéria" className="rounded-2xl border border-white/10 bg-[#0d1a2d] p-5 lg:flex lg:max-h-[calc(100dvh-7.5rem)] lg:flex-col lg:overflow-hidden">
    <div className="shrink-0 border-b border-white/10 pb-4">
      <p className="font-mono text-xs font-bold uppercase tracking-[.18em] text-[#69a7ff]">{"// Sumário"}</p>
      <p className="mt-1 text-[11px] text-slate-500">Abra uma aula e escolha uma seção</p>
    </div>
    <div className="mt-4 grid gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2 [scrollbar-color:#1473f3_transparent] [scrollbar-width:thin]">
      {aulas.map((aula, index) => {
        const headings = aula.planejada || !aula.conteudo ? [] : extractMarkdownHeadings(aula.conteudo, `aula-${aula.id}`);
        return <details key={aula.id} className="group rounded-xl border border-white/10 bg-[#08111f] open:border-[#1473f3]/35">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
            <span className="text-sm font-bold leading-5 text-white"><span className="mr-2 font-mono text-[#69a7ff]">{String(index + 1).padStart(2, "0")}</span>{aula.titulo}</span>
            <span aria-hidden="true" className="mt-0.5 text-[#69a7ff] transition group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-white/10 px-4 py-3">
            <a href={`#aula-${aula.id}`} className="block text-xs font-bold text-[#69a7ff] hover:text-white">Ir para a aula</a>
            {aula.planejada ? <p className="mt-2 text-xs text-amber-300">Conteúdo em breve</p> : headings.length ? <ol className="mt-3 grid gap-1.5 border-l border-[#1473f3]/30 pl-3">{headings.map((heading) => <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 0.65}rem` }}><a href={`#${heading.id}`} className="block text-xs leading-5 text-slate-400 transition hover:text-[#69a7ff]">{heading.text}</a></li>)}</ol> : <p className="mt-2 text-xs text-slate-500">Nenhuma seção identificada no resumo.</p>}
          </div>
        </details>;
      })}
    </div>
  </nav>;
}
