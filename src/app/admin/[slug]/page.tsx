import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/format";
import { AdminClient } from "@/components/admin/AdminClient";
import { TrocarLanchoneteButton } from "@/components/admin/TrocarLanchoneteButton";
import type { Lanchonete, PratoDoDia, ReservaComPrato } from "@/lib/types";

export const revalidate = 0;

async function buscarLanchonete(slug: string): Promise<Lanchonete | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("lanchonetes")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return (data as Lanchonete) ?? null;
}

async function buscarDadosDeHoje(lanchoneteId: string) {
  const supabase = await createClient();
  const hoje = hojeISO();

  const [{ data: pratos }, { data: reservas }] = await Promise.all([
    supabase
      .from("pratos_do_dia")
      .select("*")
      .eq("lanchonete_id", lanchoneteId)
      .eq("data", hoje)
      .order("created_at", { ascending: true }),
    supabase
      .from("reservas")
      .select("*, pratos_do_dia!inner(nome)")
      .eq("lanchonete_id", lanchoneteId)
      .eq("pratos_do_dia.data", hoje)
      .order("horario_desejado", { ascending: true }),
  ]);

  return {
    pratos: (pratos as PratoDoDia[]) ?? [],
    reservas: (reservas as unknown as ReservaComPrato[]) ?? [],
  };
}

export default async function AdminPage(props: PageProps<"/admin/[slug]">) {
  const { slug } = await props.params;
  const lanchonete = await buscarLanchonete(slug);

  if (!lanchonete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-stone-50 px-4 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-stone-800">Lanchonete não encontrada</h1>
        <p className="max-w-xs text-stone-500">
          Esse link não corresponde a nenhuma lanchonete cadastrada.
        </p>
        <Link
          href="/"
          className="mt-2 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white transition hover:bg-brand-700"
        >
          Voltar ao início
        </Link>
      </div>
    );
  }

  const { pratos, reservas } = await buscarDadosDeHoje(lanchonete.id);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-gradient-to-br from-stone-800 to-stone-900 px-4 py-6 text-white shadow-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-stone-300">
              Painel da lanchonete
            </p>
            <h1 className="mt-1 text-2xl font-extrabold">🍲 {lanchonete.nome}</h1>
          </div>
          <TrocarLanchoneteButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <AdminClient
          lanchonete={lanchonete}
          pratosIniciais={pratos}
          reservasIniciais={reservas}
        />
      </main>
    </div>
  );
}
