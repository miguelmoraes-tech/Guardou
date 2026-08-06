"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Spinner } from "@/components/Spinner";
import type { Lanchonete } from "@/lib/types";

type SouClienteProps = {
  onVoltar: () => void;
};

export function SouCliente({ onVoltar }: SouClienteProps) {
  const [lanchonetes, setLanchonetes] = useState<Lanchonete[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    supabase
      .from("lanchonetes")
      .select("*")
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          setErro("Não foi possível carregar as lanchonetes.");
          return;
        }
        setLanchonetes((data as Lanchonete[]) ?? []);
      });
    return () => {
      ativo = false;
    };
  }, []);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 animate-fade-in-up">
      <div className="text-center">
        <h2 className="text-lg font-bold text-stone-800">Escolha a lanchonete</h2>
        <p className="text-sm text-stone-500">
          Sem QR code em mãos? Escolha na lista pra ver o cardápio.
        </p>
      </div>

      {erro && (
        <p className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-700">
          {erro}
        </p>
      )}

      {lanchonetes === null ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : lanchonetes.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-stone-400 ring-1 ring-stone-900/5">
          Nenhuma lanchonete cadastrada ainda.
        </p>
      ) : (
        <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
          {lanchonetes.map((lanchonete) => (
            <Link
              key={lanchonete.id}
              href={`/l/${lanchonete.slug}`}
              className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-900/5 transition hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-lg">
                {lanchonete.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lanchonete.logo_url}
                    alt={lanchonete.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🏪"
                )}
              </div>
              <span className="font-semibold text-stone-800">{lanchonete.nome}</span>
              <span className="ml-auto text-stone-300">→</span>
            </Link>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onVoltar}
        className="self-center text-sm font-semibold text-stone-400 transition hover:text-stone-600"
      >
        ← Voltar
      </button>
    </div>
  );
}
