import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/format";
import { AdminClient } from "@/components/admin/AdminClient";
import type { PratoDoDia, ReservaComPrato } from "@/lib/types";

export const revalidate = 0;

async function buscarDadosDeHoje() {
  const supabase = await createClient();
  const hoje = hojeISO();

  const [{ data: pratos }, { data: reservas }] = await Promise.all([
    supabase
      .from("pratos_do_dia")
      .select("*")
      .eq("data", hoje)
      .order("created_at", { ascending: true }),
    supabase
      .from("reservas")
      .select("*, pratos_do_dia!inner(nome)")
      .eq("pratos_do_dia.data", hoje)
      .order("horario_desejado", { ascending: true }),
  ]);

  return {
    pratos: (pratos as PratoDoDia[]) ?? [],
    reservas: (reservas as unknown as ReservaComPrato[]) ?? [],
  };
}

export default async function AdminPage() {
  const { pratos, reservas } = await buscarDadosDeHoje();

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-br from-stone-800 to-stone-900 px-4 py-6 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-300">
              Painel da lanchonete
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">🍲 Guardou · Admin</h1>
          </div>
          <Link
            href="/"
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminClient pratosIniciais={pratos} reservasIniciais={reservas} />
      </main>
    </div>
  );
}
