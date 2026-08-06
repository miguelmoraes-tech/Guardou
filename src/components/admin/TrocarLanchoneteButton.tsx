"use client";

import { useRouter } from "next/navigation";
import { limparMinhaLanchonete } from "@/lib/lanchoneteIdentidade";

export function TrocarLanchoneteButton() {
  const router = useRouter();

  function handleTrocar() {
    limparMinhaLanchonete();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleTrocar}
      className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-white/20"
    >
      Trocar de lanchonete
    </button>
  );
}
