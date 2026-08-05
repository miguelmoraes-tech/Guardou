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

export function hojeISO(): string {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();
  const local = new Date(agora.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}
