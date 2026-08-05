"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatarHorario } from "@/lib/format";
import type { ReservaComPrato } from "@/lib/types";

type ReservasListProps = {
  reservas: ReservaComPrato[];
  onAlterado: () => void;
};

const ENTREGA_LABEL: Record<string, string> = {
  retirada: "🥡 Retirar",
  comer_no_local: "🍽️ Comer no local",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  pendente: "bg-brand-100 text-brand-700",
  confirmada: "bg-warning-100 text-warning-700",
  concluida: "bg-success-100 text-success-700",
  cancelada: "bg-stone-200 text-stone-500",
};

export function ReservasList({ reservas, onAlterado }: ReservasListProps) {
  const [processando, setProcessando] = useState<string | null>(null);

  async function marcarConcluida(id: string) {
    setProcessando(id);
    const supabase = createClient();
    await supabase.from("reservas").update({ status: "concluida" }).eq("id", id);
    setProcessando(null);
    onAlterado();
  }

  if (reservas.length === 0) {
    return (
      <p className="rounded-2xl bg-white p-5 text-center text-sm text-stone-400 ring-1 ring-stone-900/5">
        Nenhuma reserva hoje ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-400">
          <tr>
            <th className="px-4 py-3 font-semibold">Horário</th>
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold">Prato</th>
            <th className="px-4 py-3 font-semibold">Entrega</th>
            <th className="px-4 py-3 font-semibold">Telefone</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {reservas.map((reserva) => (
            <tr
              key={reserva.id}
              className={`transition-opacity duration-200 ${
                reserva.status === "concluida" ? "opacity-50" : ""
              }`}
            >
              <td className="px-4 py-3 font-bold text-brand-700">
                {formatarHorario(reserva.horario_desejado)}
              </td>
              <td className="px-4 py-3 font-medium text-stone-800">
                {reserva.cliente_nome}
              </td>
              <td className="px-4 py-3 text-stone-600">
                {reserva.pratos_do_dia?.nome ?? "—"}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                {ENTREGA_LABEL[reserva.tipo_entrega]}
              </td>
              <td className="px-4 py-3 text-stone-600">{reserva.cliente_telefone}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap ${
                    STATUS_COLOR[reserva.status] ?? "bg-stone-100 text-stone-600"
                  }`}
                >
                  {STATUS_LABEL[reserva.status] ?? reserva.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                {reserva.status !== "concluida" && (
                  <button
                    type="button"
                    disabled={processando === reserva.id}
                    onClick={() => marcarConcluida(reserva.id)}
                    className="whitespace-nowrap rounded-lg bg-success-600 px-3 py-1.5 text-xs font-bold text-white transition-colors duration-150 hover:bg-success-700 disabled:opacity-50"
                  >
                    Marcar concluída
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
