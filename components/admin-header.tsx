import { signOutAction } from "@/app/admin/actions";
import Link from "next/link";
import { BookIcon } from "./icons";

export function AdminHeader({ email }: { email?: string }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <Link href="/admin" className="flex items-center gap-3 font-bold text-slate-900">
          <span className="grid size-10 place-items-center rounded-xl bg-[#6750e6] text-white"><BookIcon className="size-5" /></span>
          <span><span className="block text-xs font-bold uppercase tracking-wider text-[#6750e6]">Admin</span>Hub de Estudos</span>
        </Link>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-xs text-slate-500 sm:block">{email}</span>}
          <Link href="/" className="rounded-xl px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100">Ver site</Link>
          <form action={signOutAction}><button className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700">Sair</button></form>
        </div>
      </div>
    </header>
  );
}
