export type TipoEntrega = "retirada" | "comer_no_local";

export type StatusReserva = "pendente" | "confirmada" | "concluida" | "cancelada";

export type PratoDoDia = {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  foto_url: string | null;
  quantidade_total: number;
  quantidade_reservada: number;
  data: string;
  ativo: boolean;
  created_at: string;
};

export type Reserva = {
  id: string;
  prato_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  tipo_entrega: TipoEntrega;
  horario_desejado: string;
  status: StatusReserva;
  created_at: string;
};

export type ReservaComPrato = Reserva & {
  pratos_do_dia: Pick<PratoDoDia, "nome"> | null;
};
