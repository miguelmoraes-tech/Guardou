"use client";

import { useState, type FormEvent } from "react";
import { IMaskInput } from "react-imask";
import type { IdentidadeCliente } from "@/lib/clienteIdentidade";

type IdentificacaoModalProps = {
  onIdentificado: (identidade: IdentidadeCliente) => void;
  onCancelar: () => void;
};

export function IdentificacaoModal({
  onIdentificado,
  onCancelar,
}: IdentificacaoModalProps) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!nome.trim()) {
      setErro("Digite seu nome.");
      return;
    }
    if (telefone.replace(/\D/g, "").length !== 11) {
      setErro("Digite um celular válido, com DDD.");
      return;
    }
    onIdentificado({ nome: nome.trim(), telefone });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-stone-800">
              Como podemos te chamar?
            </h2>
            <p className="text-sm text-stone-500">
              Só pra agilizar sua reserva — sem senha, sem cadastro.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancelar}
            aria-label="Fechar"
            className="text-2xl leading-none text-stone-400 hover:text-stone-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Seu nome</span>
            <input
              type="text"
              required
              autoFocus
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria Silva"
              className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Celular</span>
            <IMaskInput
              mask="(00) 00000-0000"
              value={telefone}
              onAccept={(value: string) => setTelefone(value)}
              placeholder="(11) 91234-5678"
              required
              type="tel"
              className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="mt-1 w-full rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-700 active:scale-[0.98]"
          >
            Continuar
          </button>
        </form>
      </div>
    </div>
  );
}
