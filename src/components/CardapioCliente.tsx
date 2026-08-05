"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { hojeISO } from "@/lib/format";
import { PratoCard } from "@/components/PratoCard";
import { ReservaModal } from "@/components/ReservaModal";
import type { PratoDoDia } from "@/lib/types";

type CardapioClienteProps = {
  pratosIniciais: PratoDoDia[];
};

export function CardapioCliente({ pratosIniciais }: CardapioClienteProps) {
  const [pratos, setPratos] = useState<PratoDoDia[]>(pratosIniciais);
  const [pratoSelecionado, setPratoSelecionado] = useState<PratoDoDia | null>(null);

  const buscarPratos = useCallback(async () => {
    const { data } = await supabase
      .from("pratos_do_dia")
      .select("*")
      .eq("data", hojeISO())
      .eq("ativo", true)
      .order("created_at", { ascending: true });

    if (data) setPratos(data as PratoDoDia[]);
  }, []);

  useEffect(() => {
    const canal = supabase
      .channel("pratos-do-dia-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pratos_do_dia" },
        () => {
          buscarPratos();
        }
      )
      .subscribe();

    const intervalo = setInterval(buscarPratos, 15000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
    };
  }, [buscarPratos]);

  return (
    <>
      {pratos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/60 px-6 py-20 text-center ring-1 ring-black/5">
          <span className="text-5xl">🍳</span>
          <h2 className="text-lg font-bold text-stone-700">
            Nenhum prato publicado hoje
          </h2>
          <p className="max-w-xs text-sm text-stone-500">
            Volta mais tarde — o cardápio de hoje está sendo preparado pela
            cozinha.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pratos.map((prato) => (
            <PratoCard
              key={prato.id}
              prato={prato}
              onReservar={setPratoSelecionado}
            />
          ))}
        </div>
      )}

      {pratoSelecionado && (
        <ReservaModal
          prato={pratoSelecionado}
          onClose={() => setPratoSelecionado(null)}
          onReservado={buscarPratos}
        />
      )}
    </>
  );
}
