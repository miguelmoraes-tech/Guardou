"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeISO } from "@/lib/format";
import { NovoPratoForm } from "@/components/admin/NovoPratoForm";
import { PratosList } from "@/components/admin/PratosList";
import { ReservasList } from "@/components/admin/ReservasList";
import { QrCodeCard } from "@/components/admin/QrCodeCard";
import type { PratoDoDia, ReservaComPrato } from "@/lib/types";

type AdminClientProps = {
  pratosIniciais: PratoDoDia[];
  reservasIniciais: ReservaComPrato[];
};

export function AdminClient({ pratosIniciais, reservasIniciais }: AdminClientProps) {
  const [pratos, setPratos] = useState<PratoDoDia[]>(pratosIniciais);
  const [reservas, setReservas] = useState<ReservaComPrato[]>(reservasIniciais);

  const recarregar = useCallback(async () => {
    const supabase = createClient();
    const hoje = hojeISO();

    const [{ data: pratosData }, { data: reservasData }] = await Promise.all([
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

    if (pratosData) setPratos(pratosData as PratoDoDia[]);
    if (reservasData) setReservas(reservasData as unknown as ReservaComPrato[]);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel("admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pratos_do_dia" },
        () => recarregar()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reservas" },
        () => recarregar()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [recarregar]);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <NovoPratoForm onCriado={recarregar} />
        </div>
        <QrCodeCard />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-stone-800">Pratos de hoje</h2>
        <PratosList pratos={pratos} onAlterado={recarregar} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold text-stone-800">Reservas de hoje</h2>
        <ReservasList reservas={reservas} onAlterado={recarregar} />
      </section>
    </div>
  );
}
