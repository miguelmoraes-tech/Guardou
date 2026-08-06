"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeISO } from "@/lib/format";
import { NovoPratoForm } from "@/components/admin/NovoPratoForm";
import { PratosList } from "@/components/admin/PratosList";
import { ReservasList } from "@/components/admin/ReservasList";
import { QrCodeCard } from "@/components/admin/QrCodeCard";
import type { Lanchonete, PratoDoDia, ReservaComPrato } from "@/lib/types";

type AdminClientProps = {
  lanchonete: Lanchonete;
  pratosIniciais: PratoDoDia[];
  reservasIniciais: ReservaComPrato[];
};

export function AdminClient({
  lanchonete,
  pratosIniciais,
  reservasIniciais,
}: AdminClientProps) {
  const [pratos, setPratos] = useState<PratoDoDia[]>(pratosIniciais);
  const [reservas, setReservas] = useState<ReservaComPrato[]>(reservasIniciais);

  const recarregar = useCallback(async () => {
    const supabase = createClient();
    const hoje = hojeISO();

    const [{ data: pratosData }, { data: reservasData }] = await Promise.all([
      supabase
        .from("pratos_do_dia")
        .select("*")
        .eq("lanchonete_id", lanchonete.id)
        .eq("data", hoje)
        .order("created_at", { ascending: true }),
      supabase
        .from("reservas")
        .select("*, pratos_do_dia!inner(nome)")
        .eq("lanchonete_id", lanchonete.id)
        .eq("pratos_do_dia.data", hoje)
        .order("horario_desejado", { ascending: true }),
    ]);

    if (pratosData) setPratos(pratosData as PratoDoDia[]);
    if (reservasData) setReservas(reservasData as unknown as ReservaComPrato[]);
  }, [lanchonete.id]);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`admin-realtime-${lanchonete.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pratos_do_dia",
          filter: `lanchonete_id=eq.${lanchonete.id}`,
        },
        () => recarregar()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "reservas",
          filter: `lanchonete_id=eq.${lanchonete.id}`,
        },
        () => recarregar()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [lanchonete.id, recarregar]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NovoPratoForm lanchoneteId={lanchonete.id} onCriado={recarregar} />
        </div>
        <QrCodeCard slug={lanchonete.slug} nome={lanchonete.nome} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
          Pratos de hoje
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600">
            {pratos.length}
          </span>
        </h2>
        <PratosList pratos={pratos} onAlterado={recarregar} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-stone-800">
          Reservas de hoje
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-xs font-bold text-stone-600">
            {reservas.length}
          </span>
        </h2>
        <ReservasList reservas={reservas} onAlterado={recarregar} />
      </section>
    </div>
  );
}
