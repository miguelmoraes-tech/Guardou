"use client";

import { useState } from "react";
import { SouEstabelecimento } from "@/components/home/SouEstabelecimento";
import { SouCliente } from "@/components/home/SouCliente";

type Visao = "inicio" | "estabelecimento" | "cliente";

export default function Home() {
  const [visao, setVisao] = useState<Visao>("inicio");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center animate-fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-accent-700 text-3xl shadow-md shadow-brand-900/10">
          🍲
        </div>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-stone-800">
          Guardou
        </h1>
        <p className="max-w-xs text-stone-500">
          Reserve seu prato do dia antes que acabe.
        </p>
      </div>

      <div className="mt-10 flex w-full max-w-sm justify-center">
        {visao === "inicio" && (
          <div className="flex w-full flex-col gap-4 animate-fade-in-up" style={{ animationDelay: "80ms" }}>
            <button
              type="button"
              onClick={() => setVisao("cliente")}
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-700 p-5 text-left text-white shadow-md shadow-brand-900/15 transition-transform duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
                🥡
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-bold">Sou Cliente</span>
                <span className="text-sm text-brand-50/90">
                  quero reservar um prato
                </span>
              </span>
              <span className="ml-auto text-xl text-white/70 transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </button>

            <button
              type="button"
              onClick={() => setVisao("estabelecimento")}
              className="group flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-900/5 transition-transform duration-200 hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">
                🏪
              </span>
              <span className="flex flex-col">
                <span className="text-lg font-bold text-stone-800">
                  Sou Estabelecimento
                </span>
                <span className="text-sm text-stone-500">
                  quero gerenciar o cardápio
                </span>
              </span>
              <span className="ml-auto text-xl text-stone-300 transition-transform duration-200 group-hover:translate-x-0.5">
                →
              </span>
            </button>
          </div>
        )}

        {visao === "estabelecimento" && (
          <SouEstabelecimento onVoltar={() => setVisao("inicio")} />
        )}

        {visao === "cliente" && <SouCliente onVoltar={() => setVisao("inicio")} />}
      </div>
    </div>
  );
}
