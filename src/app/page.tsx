import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-orange-50/40 px-4 py-10">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="text-5xl">🍲</span>
        <h1 className="mt-1 text-3xl font-extrabold text-stone-800">Guardou</h1>
        <p className="mt-1 max-w-xs text-stone-500">
          Reserve o prato do dia sem fila, direto pelo celular.
        </p>
      </div>

      <div className="mt-10 flex w-full max-w-sm flex-col gap-4">
        <Link
          href="/cardapio"
          className="flex flex-col items-center gap-1 rounded-2xl bg-orange-600 px-6 py-6 text-center text-white shadow-sm transition hover:bg-orange-700 active:scale-[0.98]"
        >
          <span className="text-2xl">🥡</span>
          <span className="text-lg font-bold">Sou Cliente</span>
          <span className="text-sm text-orange-100">quero reservar um prato</span>
        </Link>

        <Link
          href="/admin"
          className="flex flex-col items-center gap-1 rounded-2xl bg-white px-6 py-6 text-center shadow-sm ring-1 ring-black/5 transition hover:bg-stone-50 active:scale-[0.98]"
        >
          <span className="text-2xl">🏪</span>
          <span className="text-lg font-bold text-stone-800">Sou Estabelecimento</span>
          <span className="text-sm text-stone-500">quero gerenciar o cardápio</span>
        </Link>
      </div>
    </div>
  );
}
