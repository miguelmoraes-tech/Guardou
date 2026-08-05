-- Guardou — MVP de reserva de cardápio do dia
-- RLS fica desabilitado por enquanto (demo sem multi-tenant/auth ainda).

create extension if not exists "pgcrypto";

-- ============================================================
-- Tabelas
-- ============================================================

create table if not exists pratos_do_dia (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  preco numeric not null,
  foto_url text,
  quantidade_total int not null,
  quantidade_reservada int not null default 0,
  data date not null default current_date,
  ativo boolean default true,
  created_at timestamptz default now()
);

create table if not exists reservas (
  id uuid primary key default gen_random_uuid(),
  prato_id uuid not null references pratos_do_dia (id) on delete cascade,
  cliente_nome text not null,
  cliente_telefone text not null,
  tipo_entrega text not null check (tipo_entrega in ('retirada', 'comer_no_local')),
  horario_desejado time not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'confirmada', 'concluida', 'cancelada')),
  created_at timestamptz default now()
);

create index if not exists reservas_prato_id_idx on reservas (prato_id);
create index if not exists pratos_do_dia_data_idx on pratos_do_dia (data);

alter table pratos_do_dia disable row level security;
alter table reservas disable row level security;

grant select, insert, update, delete on pratos_do_dia to anon, authenticated;
grant select, insert, update, delete on reservas to anon, authenticated;

-- ============================================================
-- RPC: reservar_prato
-- Atômica (lock de linha com FOR UPDATE) para evitar duas pessoas
-- reservarem a última unidade ao mesmo tempo.
-- ============================================================

create or replace function reservar_prato(
  p_prato_id uuid,
  p_cliente_nome text,
  p_cliente_telefone text,
  p_tipo_entrega text,
  p_horario_desejado time
)
returns reservas
language plpgsql
as $$
declare
  v_prato pratos_do_dia%rowtype;
  v_reserva reservas%rowtype;
begin
  if p_tipo_entrega not in ('retirada', 'comer_no_local') then
    raise exception 'Tipo de entrega inválido';
  end if;

  select * into v_prato
  from pratos_do_dia
  where id = p_prato_id
  for update;

  if not found then
    raise exception 'Prato não encontrado';
  end if;

  if v_prato.ativo is false then
    raise exception 'Prato indisponível';
  end if;

  if v_prato.quantidade_reservada >= v_prato.quantidade_total then
    raise exception 'Prato esgotado';
  end if;

  update pratos_do_dia
  set quantidade_reservada = quantidade_reservada + 1
  where id = p_prato_id;

  insert into reservas (
    prato_id, cliente_nome, cliente_telefone, tipo_entrega, horario_desejado
  )
  values (
    p_prato_id, p_cliente_nome, p_cliente_telefone, p_tipo_entrega, p_horario_desejado
  )
  returning * into v_reserva;

  return v_reserva;
end;
$$;

grant execute on function reservar_prato(uuid, text, text, text, time) to anon, authenticated;

-- ============================================================
-- Realtime — publica mudanças de pratos_do_dia pro front atualizar
-- a quantidade disponível ao vivo.
-- ============================================================

do $$
begin
  alter publication supabase_realtime add table pratos_do_dia;
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table reservas;
exception
  when duplicate_object then null;
end $$;

-- ============================================================
-- Storage — bucket público para fotos dos pratos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('pratos', 'pratos', true)
on conflict (id) do nothing;

drop policy if exists "Leitura pública das fotos de pratos" on storage.objects;
create policy "Leitura pública das fotos de pratos"
on storage.objects for select
to public
using (bucket_id = 'pratos');

drop policy if exists "Upload público de fotos de pratos (MVP sem auth)" on storage.objects;
create policy "Upload público de fotos de pratos (MVP sem auth)"
on storage.objects for insert
to public
with check (bucket_id = 'pratos');

drop policy if exists "Atualização pública de fotos de pratos (MVP sem auth)" on storage.objects;
create policy "Atualização pública de fotos de pratos (MVP sem auth)"
on storage.objects for update
to public
using (bucket_id = 'pratos');
