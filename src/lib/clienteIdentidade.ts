export type IdentidadeCliente = {
  nome: string;
  telefone: string;
};

const CHAVE = "guardou:cliente";

export function lerIdentidadeCliente(): IdentidadeCliente | null {
  if (typeof window === "undefined") return null;

  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return null;

    const dados = JSON.parse(bruto);
    if (typeof dados?.nome === "string" && typeof dados?.telefone === "string") {
      return dados;
    }
    return null;
  } catch {
    return null;
  }
}

export function salvarIdentidadeCliente(identidade: IdentidadeCliente): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(identidade));
}

export function limparIdentidadeCliente(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(CHAVE);
}
