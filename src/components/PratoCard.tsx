"use client";

import Image from "next/image";
import { formatarPreco, pratoEsgotado, unidadesRestantes } from "@/lib/format";
import type { PratoDoDia } from "@/lib/types";

type PratoCardProps = {
  prato: PratoDoDia;
  onReservar: (prato: PratoDoDia) => void;
};

export function PratoCard({ prato, onReservar }: PratoCardProps) {
  const esgotado = pratoEsgotado(prato);
  const restantes = unidadesRestantes(prato);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="relative h-48 w-full bg-orange-100">
        {prato.foto_url ? (
          <Image
            src={prato.foto_url}
            alt={prato.nome}
            fill
            sizes="(max-width: 640px) 100vw, 400px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl">
            🍽️
          </div>
        )}

        {esgotado && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded-full bg-white px-4 py-1 text-sm font-bold uppercase tracking-wide text-red-600">
              Esgotado
            </span>
          </div>
        )}

        {!esgotado && restantes <= 3 && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow">
            Só {restantes} {restantes === 1 ? "unidade" : "unidades"}!
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg font-bold text-stone-800">{prato.nome}</h3>
        {prato.descricao && (
          <p className="line-clamp-2 flex-1 text-sm text-stone-500">
            {prato.descricao}
          </p>
        )}

        <div className="mt-1 flex items-center justify-between">
          <span className="text-xl font-extrabold text-orange-600">
            {formatarPreco(prato.preco)}
          </span>
          {!esgotado && (
            <span className="text-xs font-medium text-stone-400">
              {restantes} {restantes === 1 ? "restante" : "restantes"}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={esgotado}
          onClick={() => onReservar(prato)}
          className="mt-2 w-full rounded-xl bg-orange-600 py-3 text-sm font-bold text-white transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
        >
          {esgotado ? "Esgotado" : "Reservar"}
        </button>
      </div>
    </div>
  );
}
