import { signOutAction } from "@/app/admin/actions";
import Link from "next/link";

export function AdminHeader({ email }: { email?: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f11]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/admin" className="font-mono text-sm font-bold tracking-[-.03em] text-white sm:text-base">
          <span className="text-[#1473f3]">&lt;/</span>HubEstudos<span className="text-[#1473f3]">/&gt;</span>
          <span className="ml-2 rounded border border-[#1473f3]/30 bg-[#1473f3]/10 px-1.5 py-0.5 font-sans text-[9px] uppercase tracking-[.16em] text-[#69a7ff]">Admin</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {email && <span className="hidden text-xs text-slate-500 sm:block">{email}</span>}
          <Link href="/" className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-white/[.04] hover:text-white sm:text-sm">Ver site</Link>
          <form action={signOutAction}><button className="rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-slate-500 transition hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-300 sm:text-sm">Sair</button></form>
        </div>
      </div>
    </header>
  );
}
