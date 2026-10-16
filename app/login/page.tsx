import { BookIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(30,41,59,.12)] sm:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#1473f3] text-white shadow-lg shadow-blue-200"><BookIcon className="size-6" /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[.18em] text-[#1473f3]">Área administrativa</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Acesse o Hub de Estudos</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Entre com o usuário administrador cadastrado no Supabase.</p>
        <LoginForm />
        <Link href="/" className="mt-6 block text-center text-sm font-semibold text-slate-500 transition hover:text-[#1473f3]">← Voltar ao site</Link>
      </div>
    </main>
  );
}
