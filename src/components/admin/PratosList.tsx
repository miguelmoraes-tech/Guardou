"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatarPreco, pratoEsgotado, unidadesRestantes } from "@/lib/format";
import type { PratoDoDia } from "@/lib/types";

type PratosListProps = {
  pratos: PratoDoDia[];
  onAlterado: () => void;
};

export function PratosList({ pratos, onAlterado }: PratosListProps) {
  const [processando, setProcessando] = useState<string | null>(null);

  async function marcarEsgotado(prato: PratoDoDia) {
    setProcessando(prato.id);
    const supabase = createClient();
    await supabase
      .from("pratos_do_dia")
      .update({ quantidade_reservada: prato.quantidade_total })
      .eq("id", prato.id);
    setProcessando(null);
    onAlterado();
  }

  async function desativar(prato: PratoDoDia) {
    setProcessando(prato.id);
    const supabase = createClient();
    await supabase.from("pratos_do_dia").update({ ativo: false }).eq("id", prato.id);
    setProcessando(null);
    onAlterado();
  }

  if (pratos.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-5 text-center text-sm text-stone-400 ring-1 ring-stone-900/5">
        Nenhum prato cadastrado hoje ainda.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pratos.map((prato) => {
        const esgotado = pratoEsgotado(prato);
        return (
          <div
            key={prato.id}
            className={`flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-stone-900/5 transition-opacity duration-200 ${
              !prato.ativo ? "opacity-50" : ""
            }`}
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-100 text-2xl">
              {prato.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={prato.foto_url}
                  alt={prato.nome}
                  className="h-full w-full object-cover"
                />
              ) : (
                "🍽️"
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-stone-800">{prato.nome}</p>
              <p className="text-sm text-stone-500">
                {formatarPreco(prato.preco)} · {unidadesRestantes(prato)}/
                {prato.quantidade_total} disponíveis
              </p>
              {!prato.ativo && (
                <span className="text-xs font-semibold text-stone-400">Desativado</span>
              )}
              {prato.ativo && esgotado && (
                <span className="text-xs font-semibold text-accent-600">Esgotado</span>
              )}
            </div>

            {prato.ativo && (
              <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                {!esgotado && (
                  <button
                    type="button"
                    disabled={processando === prato.id}
                    onClick={() => marcarEsgotado(prato)}
                    className="whitespace-nowrap rounded-lg bg-warning-100 px-3 py-1.5 text-xs font-bold text-warning-700 transition-colors duration-150 hover:bg-amber-200 disabled:opacity-50"
                  >
                    Marcar esgotado
                  </button>
                )}
                <button
                  type="button"
                  disabled={processando === prato.id}
                  onClick={() => desativar(prato)}
                  className="whitespace-nowrap rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-600 transition-colors duration-150 hover:bg-stone-200 disabled:opacity-50"
                >
                  Desativar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
