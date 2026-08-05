"use client";

import { useState, type FormEvent } from "react";
import { IMaskInput } from "react-imask";
import { createClient } from "@/lib/supabase/client";
import { formatarHorario, formatarPreco, HORARIO_FUNCIONAMENTO } from "@/lib/format";
import { limparIdentidadeCliente, salvarIdentidadeCliente } from "@/lib/clienteIdentidade";
import { Spinner } from "@/components/Spinner";
import type { PratoDoDia, TipoEntrega } from "@/lib/types";
import type { IdentidadeCliente } from "@/lib/clienteIdentidade";

type ReservaModalProps = {
  prato: PratoDoDia;
  identidadeInicial?: IdentidadeCliente | null;
  onClose: () => void;
  onReservado: () => void;
};

export function ReservaModal({
  prato,
  identidadeInicial,
  onClose,
  onReservado,
}: ReservaModalProps) {
  const [nome, setNome] = useState(identidadeInicial?.nome ?? "");
  const [telefone, setTelefone] = useState(identidadeInicial?.telefone ?? "");
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");
  const [horario, setHorario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [horarioConfirmado, setHorarioConfirmado] = useState<string | null>(null);

  function validar(): string | null {
    if (!nome.trim()) return "Digite seu nome.";
    if (telefone.replace(/\D/g, "").length !== 11) {
      return "Digite um celular válido, com DDD.";
    }
    if (!horario) return "Escolha um horário.";
    if (
      horario < HORARIO_FUNCIONAMENTO.abertura ||
      horario > HORARIO_FUNCIONAMENTO.fechamento
    ) {
      return `Escolha um horário entre ${HORARIO_FUNCIONAMENTO.abertura} e ${HORARIO_FUNCIONAMENTO.fechamento}.`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviando) return; // evita reserva duplicada em clique duplo
    setErro(null);

    const mensagemValidacao = validar();
    if (mensagemValidacao) {
      setErro(mensagemValidacao);
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("reservar_prato", {
      p_prato_id: prato.id,
      p_cliente_nome: nome.trim(),
      p_cliente_telefone: telefone,
      p_tipo_entrega: tipoEntrega,
      p_horario_desejado: horario,
    });

    if (error) {
      setEnviando(false);
      setErro(
        /esgotado/i.test(error.message)
          ? "Ops, esse prato acabou de esgotar! Escolha outro."
          : /não encontrado|indisponível/i.test(error.message)
            ? "Esse prato não está mais disponível. Escolha outro."
            : "Não foi possível concluir a reserva. Tente novamente."
      );
      return;
    }

    salvarIdentidadeCliente({ nome: nome.trim(), telefone });
    setHorarioConfirmado(horario);
    onReservado();
  }

  function handleNaoEVoce() {
    limparIdentidadeCliente();
    setNome("");
    setTelefone("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-stone-900/50 backdrop-blur-[1px] animate-fade-in sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-xl animate-sheet-in sm:rounded-3xl">
        {horarioConfirmado ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-9 w-9 text-success-600"
                aria-hidden="true"
              >
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-stone-800">
              Reserva feita!
            </h2>
            <p className="text-stone-600">
              Seu prato de <span className="font-semibold">{prato.nome}</span>{" "}
              está garantido.
            </p>

            <div className="w-full rounded-2xl bg-brand-50 px-5 py-4 ring-1 ring-brand-600/10">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-500">
                  Horário
                </span>
                <span className="text-lg font-extrabold text-brand-700">
                  {formatarHorario(horarioConfirmado)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-brand-600/10 pt-2">
                <span className="text-sm font-medium text-stone-500">
                  Onde retirar
                </span>
                <span className="text-sm font-bold text-stone-700">
                  No balcão, com seu nome
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-brand-600 py-3.5 font-bold text-white transition-transform duration-200 hover:bg-brand-700 active:scale-[0.98]"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-stone-800">
                  Reservar {prato.nome}
                </h2>
                <p className="text-sm font-bold text-brand-700">
                  {formatarPreco(prato.preco)}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-stone-400 transition hover:bg-stone-100 hover:text-stone-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <fieldset disabled={enviando} className="contents">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-stone-700">Seu nome</span>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-stone-700">Celular</span>
                <IMaskInput
                  mask="(00) 00000-0000"
                  value={telefone}
                  onAccept={(value: string) => setTelefone(value)}
                  placeholder="(11) 91234-5678"
                  required
                  type="tel"
                  className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              {identidadeInicial && (
                <button
                  type="button"
                  onClick={handleNaoEVoce}
                  className="-mt-3 self-start text-xs font-semibold text-brand-600 underline-offset-2 hover:underline"
                >
                  Não é você? Preencher com outros dados
                </button>
              )}

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-stone-700">
                  Como vai ser?
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { value: "retirada", label: "🥡 Retirar" },
                      { value: "comer_no_local", label: "🍽️ Comer no local" },
                    ] as const
                  ).map((opcao) => (
                    <button
                      key={opcao.value}
                      type="button"
                      onClick={() => setTipoEntrega(opcao.value)}
                      className={`rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-colors duration-150 ${
                        tipoEntrega === opcao.value
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-stone-200 text-stone-500"
                      }`}
                    >
                      {opcao.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-stone-700">
                  Horário desejado
                </span>
                <input
                  type="time"
                  required
                  value={horario}
                  min={HORARIO_FUNCIONAMENTO.abertura}
                  max={HORARIO_FUNCIONAMENTO.fechamento}
                  onChange={(e) => setHorario(e.target.value)}
                  className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
                <span className="text-xs text-stone-400">
                  Funcionamento: {HORARIO_FUNCIONAMENTO.abertura} às{" "}
                  {HORARIO_FUNCIONAMENTO.fechamento}
                </span>
              </label>
              </fieldset>

              {erro && (
                <p className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-700">
                  {erro}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                aria-busy={enviando}
                className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-bold text-white transition-transform duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando && <Spinner />}
                {enviando ? "Reservando..." : "Confirmar reserva"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
