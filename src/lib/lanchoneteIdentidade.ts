const CHAVE = "guardou_minha_lanchonete";

export function lerMinhaLanchonete(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CHAVE);
}

export function salvarMinhaLanchonete(slug: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, slug);
}

export function limparMinhaLanchonete(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE);
}
