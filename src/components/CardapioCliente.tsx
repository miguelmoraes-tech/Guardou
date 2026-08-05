"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeISO } from "@/lib/format";
import { lerIdentidadeCliente, salvarIdentidadeCliente } from "@/lib/clienteIdentidade";
import { PratoCard } from "@/components/PratoCard";
import { ReservaModal } from "@/components/ReservaModal";
import { IdentificacaoModal } from "@/components/IdentificacaoModal";
import type { PratoDoDia } from "@/lib/types";
import type { IdentidadeCliente } from "@/lib/clienteIdentidade";

type CardapioClienteProps = {
  pratosIniciais: PratoDoDia[];
};

export function CardapioCliente({ pratosIniciais }: CardapioClienteProps) {
  const [pratos, setPratos] = useState<PratoDoDia[]>(pratosIniciais);
  const [pratoSelecionado, setPratoSelecionado] = useState<PratoDoDia | null>(null);
  const [pratoParaIdentificar, setPratoParaIdentificar] = useState<PratoDoDia | null>(
    null
  );
  const [identidade, setIdentidade] = useState<IdentidadeCliente | null>(null);

  const buscarPratos = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("pratos_do_dia")
      .select("*")
      .eq("data", hojeISO())
      .eq("ativo", true)
      .order("created_at", { ascending: true });

    if (data) setPratos(data as PratoDoDia[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
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

  function handleReservar(prato: PratoDoDia) {
    const salva = lerIdentidadeCliente();
    if (salva) {
      setIdentidade(salva);
      setPratoSelecionado(prato);
    } else {
      setPratoParaIdentificar(prato);
    }
  }

  function handleIdentificado(dados: IdentidadeCliente) {
    salvarIdentidadeCliente(dados);
    setIdentidade(dados);
    setPratoSelecionado(pratoParaIdentificar);
    setPratoParaIdentificar(null);
  }

  return (
    <>
      {pratos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-3xl bg-white/60 px-6 py-20 text-center ring-1 ring-stone-900/5 animate-fade-in">
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
          {pratos.map((prato, indice) => (
            <div
              key={prato.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${Math.min(indice, 6) * 40}ms` }}
            >
              <PratoCard prato={prato} onReservar={handleReservar} />
            </div>
          ))}
        </div>
      )}

      {pratoParaIdentificar && (
        <IdentificacaoModal
          onCancelar={() => setPratoParaIdentificar(null)}
          onIdentificado={handleIdentificado}
        />
      )}

      {pratoSelecionado && (
        <ReservaModal
          prato={pratoSelecionado}
          identidadeInicial={identidade}
          onClose={() => setPratoSelecionado(null)}
          onReservado={buscarPratos}
        />
      )}
    </>
  );
}
