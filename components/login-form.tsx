"use client";

import { loginAction } from "@/app/login/actions";
import { useActionState } from "react";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });

  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        E-mail
        <input name="email" type="email" autoComplete="email" required className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="voce@exemplo.com" />
      </label>
      <label className="grid gap-2 text-sm font-bold text-slate-700">
        Senha
        <input name="password" type="password" autoComplete="current-password" required className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 font-normal outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100" placeholder="••••••••" />
      </label>
      {state.error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{state.error}</p>}
      <button disabled={pending} className="rounded-2xl bg-[#6750e6] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-[#4936c9] disabled:cursor-not-allowed disabled:opacity-60">
        {pending ? "Entrando..." : "Entrar no painel"}
      </button>
    </form>
  );
}
