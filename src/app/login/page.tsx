"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/Spinner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setEnviando(false);
      setErro("Email ou senha inválidos.");
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
        <div className="mb-6 flex flex-col items-center gap-1 text-center">
          <span className="text-4xl">🍲</span>
          <h1 className="text-xl font-extrabold text-stone-800">Guardou · Admin</h1>
          <p className="text-sm text-stone-500">Entre pra gerenciar o cardápio</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dono@lanchonete.com"
              className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Senha</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
            />
          </label>

          {erro && (
            <p className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-700">
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            aria-busy={enviando}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando && <Spinner />}
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
