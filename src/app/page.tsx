import { supabase } from "@/lib/supabase";
import { hojeISO } from "@/lib/format";
import { CardapioCliente } from "@/components/CardapioCliente";
import type { PratoDoDia } from "@/lib/types";

export const revalidate = 0;

async function buscarPratosDeHoje(): Promise<PratoDoDia[]> {
  const { data } = await supabase
    .from("pratos_do_dia")
    .select("*")
    .eq("data", hojeISO())
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  return (data as PratoDoDia[]) ?? [];
}

export default async function Home() {
  const pratos = await buscarPratosDeHoje();

  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="bg-gradient-to-br from-orange-600 to-red-600 px-4 pb-8 pt-10 text-white shadow-md">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-orange-100">
            Cardápio de hoje
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">🍲 Guardou</h1>
          <p className="mt-2 max-w-md text-orange-50">
            Reserve seu prato agora e evite fila — pague só na retirada.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <CardapioCliente pratosIniciais={pratos} />
      </main>

      <footer className="pb-8 pt-4 text-center text-xs text-stone-400">
        feito com 🧡 por Guardou
      </footer>
    </div>
  );
}
