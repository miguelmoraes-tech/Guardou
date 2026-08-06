"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { enviarLogoLanchonete } from "@/lib/upload";
import { lerMinhaLanchonete, salvarMinhaLanchonete } from "@/lib/lanchoneteIdentidade";
import { Spinner } from "@/components/Spinner";
import type { Lanchonete } from "@/lib/types";

type SouEstabelecimentoProps = {
  onVoltar: () => void;
};

type Modo = "escolha" | "criar" | "existente";

function inscreverNoStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// getServerSnapshot retorna null (sem localStorage no servidor) — o React
// reconcilia com o snapshot real do cliente automaticamente após montar,
// sem precisar de setState manual num efeito (evita flash divergente do SSR).
function obterSlugSalvoServidor(): string | null {
  return null;
}

export function SouEstabelecimento({ onVoltar }: SouEstabelecimentoProps) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("escolha");
  const slugSalvo = useSyncExternalStore(
    inscreverNoStorage,
    lerMinhaLanchonete,
    obterSlugSalvoServidor
  );

  useEffect(() => {
    if (slugSalvo) {
      router.replace(`/admin/${slugSalvo}`);
    }
  }, [slugSalvo, router]);

  if (slugSalvo) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-stone-400">
        <Spinner />
        <p className="text-sm">Redirecionando pra sua lanchonete...</p>
      </div>
    );
  }

  if (modo === "criar") {
    return <CriarLanchonete onVoltar={() => setModo("escolha")} />;
  }

  if (modo === "existente") {
    return <SelecionarLanchonete onVoltar={() => setModo("escolha")} />;
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 animate-fade-in-up">
      <button
        type="button"
        onClick={() => setModo("criar")}
        className="group flex items-center gap-4 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-700 p-5 text-left text-white shadow-md shadow-brand-900/15 transition-transform duration-200 hover:shadow-lg active:scale-[0.98]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 text-2xl">
          ✨
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold">Criar minha lanchonete</span>
          <span className="text-sm text-brand-50/90">cadastro simples, sem senha</span>
        </span>
        <span className="ml-auto text-xl text-white/70 transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </button>

      <button
        type="button"
        onClick={() => setModo("existente")}
        className="group flex items-center gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-stone-900/5 transition-transform duration-200 hover:shadow-md active:scale-[0.98]"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">
          🔎
        </span>
        <span className="flex flex-col">
          <span className="text-lg font-bold text-stone-800">Já tenho uma lanchonete</span>
          <span className="text-sm text-stone-500">escolher na lista</span>
        </span>
        <span className="ml-auto text-xl text-stone-300 transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </button>

      <button
        type="button"
        onClick={onVoltar}
        className="mt-2 self-center text-sm font-semibold text-stone-400 transition hover:text-stone-600"
      >
        ← Voltar
      </button>
    </div>
  );
}

function CriarLanchonete({ onVoltar }: { onVoltar: () => void }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const inputLogoRef = useRef<HTMLInputElement>(null);

  function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0] ?? null;
    setLogo(arquivo);
    setPreviewUrl(arquivo ? URL.createObjectURL(arquivo) : null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (enviando) return;
    setErro(null);

    if (!nome.trim()) {
      setErro("Digite o nome da sua lanchonete.");
      return;
    }

    setEnviando(true);
    try {
      const supabase = createClient();
      let logoUrl: string | null = null;
      if (logo) {
        logoUrl = await enviarLogoLanchonete(supabase, logo);
      }

      const { data, error } = await supabase.rpc("criar_lanchonete", {
        p_nome: nome.trim(),
        p_logo_url: logoUrl,
      });

      if (error) throw error;
      const lanchonete = data as Lanchonete;
      if (!lanchonete?.slug) throw new Error("Não foi possível criar a lanchonete.");

      salvarMinhaLanchonete(lanchonete.slug);
      router.replace(`/admin/${lanchonete.slug}`);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível criar a lanchonete.");
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5 animate-fade-in-up"
    >
      <h2 className="text-lg font-bold text-stone-800">Criar minha lanchonete</h2>

      <label className="flex flex-col items-center justify-center gap-2 self-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-4 text-center transition-colors duration-150 hover:border-brand-400">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Pré-visualização da logo"
            className="h-16 w-16 rounded-lg object-cover"
          />
        ) : (
          <span className="text-2xl">🖼️</span>
        )}
        <span className="text-xs font-medium text-stone-500">
          {logo ? logo.name : "Logo (opcional)"}
        </span>
        <input
          ref={inputLogoRef}
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="hidden"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-stone-700">Nome da lanchonete</span>
        <input
          type="text"
          required
          autoFocus
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex: Lanchonete do Zé"
          className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        />
      </label>

      {erro && (
        <p className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-700">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        aria-busy={enviando}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-bold text-white transition-transform duration-200 hover:bg-brand-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando && <Spinner />}
        {enviando ? "Criando..." : "Criar lanchonete"}
      </button>

      <button
        type="button"
        onClick={onVoltar}
        disabled={enviando}
        className="self-center text-sm font-semibold text-stone-400 transition hover:text-stone-600"
      >
        ← Voltar
      </button>
    </form>
  );
}

function SelecionarLanchonete({ onVoltar }: { onVoltar: () => void }) {
  const router = useRouter();
  const [lanchonetes, setLanchonetes] = useState<Lanchonete[] | null>(null);
  const [busca, setBusca] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    const supabase = createClient();
    supabase
      .from("lanchonetes")
      .select("*")
      .order("nome", { ascending: true })
      .then(({ data, error }) => {
        if (!ativo) return;
        if (error) {
          setErro("Não foi possível carregar as lanchonetes.");
          return;
        }
        setLanchonetes((data as Lanchonete[]) ?? []);
      });
    return () => {
      ativo = false;
    };
  }, []);

  function escolher(lanchonete: Lanchonete) {
    salvarMinhaLanchonete(lanchonete.slug);
    router.replace(`/admin/${lanchonete.slug}`);
  }

  const filtradas = (lanchonetes ?? []).filter((l) =>
    l.nome.toLowerCase().includes(busca.trim().toLowerCase())
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 animate-fade-in-up">
      <h2 className="text-lg font-bold text-stone-800">Já tenho uma lanchonete</h2>

      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar pelo nome..."
        className="rounded-xl border border-stone-300 px-4 py-3 text-stone-800 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
      />

      {erro && (
        <p className="rounded-lg bg-accent-500/10 px-3 py-2 text-sm font-medium text-accent-700">
          {erro}
        </p>
      )}

      {lanchonetes === null ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : filtradas.length === 0 ? (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-stone-400 ring-1 ring-stone-900/5">
          Nenhuma lanchonete encontrada.
        </p>
      ) : (
        <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
          {filtradas.map((lanchonete) => (
            <button
              key={lanchonete.id}
              type="button"
              onClick={() => escolher(lanchonete)}
              className="flex items-center gap-3 rounded-xl bg-white p-3 text-left shadow-sm ring-1 ring-stone-900/5 transition hover:shadow-md active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-100 text-lg">
                {lanchonete.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={lanchonete.logo_url}
                    alt={lanchonete.nome}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "🏪"
                )}
              </div>
              <span className="font-semibold text-stone-800">{lanchonete.nome}</span>
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onVoltar}
        className="self-center text-sm font-semibold text-stone-400 transition hover:text-stone-600"
      >
        ← Voltar
      </button>
    </div>
  );
}
