import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { slugifyHeading } from "@/lib/markdown-headings";
import type { ReactNode } from "react";

function nodeText(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(nodeText).join("");
  if (value && typeof value === "object" && "props" in value) return nodeText((value as { props: { children?: ReactNode } }).props.children);
  return "";
}

export function MarkdownContent({ children, anchorPrefix = "conteudo" }: { children: string; anchorPrefix?: string }) {
  const occurrences = new Map<string, number>();
  function headingId(value: ReactNode) {
    const slug = slugifyHeading(nodeText(value));
    const occurrence = (occurrences.get(slug) ?? 0) + 1;
    occurrences.set(slug, occurrence);
    return `${anchorPrefix}-${slug}${occurrence > 1 ? `-${occurrence}` : ""}`;
  }
  return (
    <div className="min-w-0 text-base leading-8 text-slate-700">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          h1: ({ children }) => <h1 id={headingId(children)} className="mb-5 mt-10 scroll-mt-24 text-3xl font-black tracking-tight text-slate-950 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 id={headingId(children)} className="mb-4 mt-10 scroll-mt-24 border-b border-slate-100 pb-3 text-2xl font-bold tracking-tight text-slate-900">{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)} className="mb-3 mt-8 scroll-mt-24 text-xl font-bold text-slate-900">{children}</h3>,
          h4: ({ children }) => <h4 id={headingId(children)} className="mb-2 mt-6 scroll-mt-24 text-lg font-bold text-slate-900">{children}</h4>,
          p: ({ children }) => <p className="my-4 leading-8">{children}</p>,
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          ul: ({ children }) => <ul className="my-5 list-disc space-y-2 pl-6 marker:text-[#1473f3]">{children}</ul>,
          ol: ({ children }) => <ol className="my-5 list-decimal space-y-2 pl-6 marker:font-bold marker:text-[#1473f3]">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          hr: () => <hr className="my-10 border-slate-200" />,
          blockquote: ({ children }) => <blockquote className="my-6 border-l-4 border-blue-300 bg-blue-50 px-5 py-3 italic text-slate-600">{children}</blockquote>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noreferrer" className="font-semibold text-[#1473f3] underline decoration-blue-200 underline-offset-4 hover:text-[#005de0]">{children}</a>,
          code: ({ children, className }) => className ? (
            <code className={`${className} block overflow-x-auto rounded-2xl bg-slate-950 p-5 text-sm leading-6 text-slate-100`}>{children}</code>
          ) : (
            <code className="rounded bg-slate-100 px-1.5 py-1 font-mono text-[.9em] text-blue-800">{children}</code>
          ),
          pre: ({ children }) => <pre className="my-6 overflow-hidden rounded-2xl">{children}</pre>,
          table: ({ children }) => <div className="my-7 overflow-x-auto rounded-2xl border border-slate-200"><table className="w-full min-w-[40rem] border-collapse text-left text-sm">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-slate-100 text-slate-800">{children}</thead>,
          th: ({ children }) => <th className="border-b border-slate-200 px-4 py-3 font-bold">{children}</th>,
          td: ({ children }) => <td className="border-b border-slate-100 px-4 py-3 align-top leading-6">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
