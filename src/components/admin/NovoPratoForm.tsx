"use client";

import { useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { enviarFotoPrato } from "@/lib/upload";
import { hojeISO } from "@/lib/format";
import { Spinner } from "@/components/Spinner";

type NovoPratoFormProps = {
  onCriado: () => void;
};

export function NovoPratoForm({ onCriado }: NovoPratoFormProps) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidadeTotal, setQuantidadeTotal] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  function handleFotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] ?? null;
    setFoto(arquivo);
    setPreviewUrl(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setPreco("");
    setQuantidadeTotal("");
    setFoto(null);
    setPreviewUrl(null);
    if (inputFotoRef.current) inputFotoRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviando) return;
    setErro(null);

    const precoNumerico = Number(preco.replace(",", "."));
    const quantidadeNumerica = Number(quantidadeTotal);

    if (!nome.trim() || !precoNumerico || precoNumerico <= 0) {
      setErro("Preencha nome e um preço válido.");
      return;
    }
    if (!quantidadeNumerica || quantidadeNumerica <= 0) {
      setErro("Informe a quantidade disponível hoje.");
      return;
    }

    setEnviando(true);
    try {
      let fotoUrl: string | null = null;
      if (foto) {
        fotoUrl = await enviarFotoPrato(foto);
      }

      const { error } = await supabase.from("pratos_do_dia").insert({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        preco: precoNumerico,
        quantidade_total: quantidadeNumerica,
        foto_url: fotoUrl,
        data: hojeISO(),
      });

      if (error) throw error;

      limparFormulario();
      onCriado();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar o prato.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"
    >
      <h2 className="text-lg font-bold text-stone-800">Novo prato do dia</h2>

      <div className="flex flex-col gap-4 sm:flex-row">
        <label className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 text-center transition hover:border-orange-400 sm:w-40 sm:shrink-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Pré-visualização"
              className="h-24 w-24 rounded-lg object-cover"
            />
          ) : (
            <span className="text-3xl">📷</span>
          )}
          <span className="text-xs font-medium text-stone-500">
            {foto ? foto.name : "Adicionar foto"}
          </span>
          <input
            ref={inputFotoRef}
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="hidden"
          />
        </label>

        <div className="flex flex-1 flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Nome do prato</span>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Feijoada completa"
              className="rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-stone-700">Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ingredientes, acompanhamentos..."
              rows={2}
              className="resize-none rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-stone-700">Preço (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            required
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="25,90"
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-stone-700">Quantidade hoje</span>
          <input
            type="number"
            min={1}
            required
            value={quantidadeTotal}
            onChange={(e) => setQuantidadeTotal(e.target.value)}
            placeholder="20"
            className="rounded-xl border border-stone-300 px-4 py-2.5 text-stone-800 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </label>
      </div>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        aria-busy={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 py-3 font-bold text-white transition hover:bg-orange-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando && <Spinner />}
        {enviando ? "Publicando..." : "Publicar prato"}
      </button>
    </form>
  );
}
