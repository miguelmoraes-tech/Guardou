import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/format";
import { CardapioCliente } from "@/components/CardapioCliente";
import type { Lanchonete, PratoDoDia } from "@/lib/types";

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

async function buscarPratosDeHoje(lanchoneteId: string): Promise<PratoDoDia[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pratos_do_dia")
    .select("*")
    .eq("lanchonete_id", lanchoneteId)
    .eq("data", hojeISO())
    .eq("ativo", true)
    .order("created_at", { ascending: true });

  return (data as PratoDoDia[]) ?? [];
}

export default async function CardapioPage(props: PageProps<"/l/[slug]">) {
  const { slug } = await props.params;
  const lanchonete = await buscarLanchonete(slug);

  if (!lanchonete) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-brand-50/40 px-4 text-center">
        <span className="text-5xl">🔍</span>
        <h1 className="text-xl font-bold text-stone-800">Lanchonete não encontrada</h1>
        <p className="max-w-xs text-stone-500">
          Esse link não corresponde a nenhuma lanchonete cadastrada. Confira o QR code
          ou o link com o estabelecimento.
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

  const pratos = await buscarPratosDeHoje(lanchonete.id);

  return (
    <div className="min-h-screen bg-brand-50/40">
      <header className="bg-gradient-to-br from-brand-600 to-accent-700 px-4 pb-8 pt-6 text-white shadow-md">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/"
            className="text-sm font-medium text-white/80 transition hover:text-white"
          >
            ← Início
          </Link>
          <div className="mt-3 flex items-center gap-3">
            {lanchonete.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lanchonete.logo_url}
                alt={lanchonete.nome}
                className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-white/30"
              />
            )}
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-100">
                Cardápio de hoje
              </p>
              <h1 className="mt-0.5 text-3xl font-extrabold">{lanchonete.nome}</h1>
            </div>
          </div>
          <p className="mt-2 max-w-md text-brand-50">
            Reserve seu prato do dia antes que acabe.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <CardapioCliente lanchoneteId={lanchonete.id} pratosIniciais={pratos} />
      </main>

      <footer className="pb-8 pt-4 text-center text-xs text-stone-400">
        feito com 🧡 por Guardou
      </footer>
    </div>
  );
}
