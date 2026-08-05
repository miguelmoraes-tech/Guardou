export function formatarPreco(preco: number): string {
  return preco.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatarHorario(horario: string): string {
  // horario vem do banco como "HH:MM:SS" — exibe só "HH:MM"
  return horario.slice(0, 5);
}

export const HORARIO_FUNCIONAMENTO = {
  abertura: "11:00",
  fechamento: "14:00",
} as const;

export function unidadesRestantes(prato: {
  quantidade_total: number;
  quantidade_reservada: number;
}): number {
  return Math.max(0, prato.quantidade_total - prato.quantidade_reservada);
}

export function pratoEsgotado(prato: {
  quantidade_total: number;
  quantidade_reservada: number;
}): boolean {
  return prato.quantidade_reservada >= prato.quantidade_total;
}

// Só de exibição: mostra o badge de urgência quando resta menos de 30%.
export function pratoQuaseEsgotado(prato: {
  quantidade_total: number;
  quantidade_reservada: number;
}): boolean {
  if (prato.quantidade_total <= 0) return false;
  const restantes = unidadesRestantes(prato);
  return restantes > 0 && restantes / prato.quantidade_total < 0.3;
}

export function hojeISO(): string {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();
  const local = new Date(agora.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
