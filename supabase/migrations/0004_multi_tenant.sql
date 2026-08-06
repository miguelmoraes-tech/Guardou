-- Guardou — multi-tenant: cada lanchonete é uma entidade própria, com seu
-- próprio cardápio (pratos_do_dia) e suas próprias reservas. Sem senha pro
-- estabelecimento — "criar conta" é só um cadastro simples (nome gera um
-- slug único), sem autenticação real. RLS continua desabilitado, mesma
-- decisão já tomada em 0003_reverter_rls_para_demo.sql, agora estendida
-- pra tabela nova.

create extension if not exists "unaccent";

-- ============================================================
-- Tabela lanchonetes
-- ============================================================

create table if not exists lanchonetes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text not null unique,
  logo_url text,
  cor_primaria text not null default '#dd4e0f',
  created_at timestamptz default now()
);

alter table lanchonetes disable row level security;

grant select, insert, update, delete on lanchonetes to anon, authenticated;

-- ============================================================
-- slugify: normaliza um nome em slug (minúsculo, sem acento, hifens no
-- lugar de espaços/pontuação). Usado por criar_lanchonete.
-- ============================================================

create or replace function slugify(p_texto text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(unaccent(coalesce(p_texto, ''))),
      '[^a-z0-9]+', '-', 'g'
    )
  );
$$;

-- ============================================================
-- criar_lanchonete: gera o slug a partir do nome e resolve colisão
-- adicionando sufixo numérico (-2, -3, ...). O loop com retry no
-- unique_violation garante atomicidade mesmo com cadastros concorrentes.
-- ============================================================

create or replace function criar_lanchonete(
  p_nome text,
  p_logo_url text default null,
  p_cor_primaria text default null
)
returns lanchonetes
language plpgsql
as $$
declare
  v_slug_base text;
  v_slug text;
  v_sufixo int := 1;
  v_lanchonete lanchonetes%rowtype;
begin
  if p_nome is null or trim(p_nome) = '' then
    raise exception 'Nome da lanchonete é obrigatório';
  end if;

  v_slug_base := slugify(p_nome);
  if v_slug_base = '' then
    v_slug_base := 'lanchonete';
  end if;
  v_slug := v_slug_base;

  loop
    begin
      insert into lanchonetes (nome, slug, logo_url, cor_primaria)
      values (
        trim(p_nome),
        v_slug,
        p_logo_url,
        coalesce(p_cor_primaria, '#dd4e0f')
      )
      returning * into v_lanchonete;
      exit;
    exception when unique_violation then
      v_sufixo := v_sufixo + 1;
      v_slug := v_slug_base || '-' || v_sufixo;
    end;
  end loop;

  return v_lanchonete;
end;
$$;

grant execute on function criar_lanchonete(text, text, text) to anon, authenticated;

-- ============================================================
-- pratos_do_dia.lanchonete_id — adiciona nullable, faz backfill de todo
-- prato existente (seed + o que já foi cadastrado manualmente em
-- produção) pra "Lanchonete do Curso", depois torna not null. Não pode
-- ficar prato órfão sem lanchonete.
-- ============================================================

alter table pratos_do_dia add column if not exists lanchonete_id uuid references lanchonetes (id);

insert into lanchonetes (nome, slug)
values ('Lanchonete do Curso', 'lanchonete-do-curso')
on conflict (slug) do nothing;

update pratos_do_dia
set lanchonete_id = (select id from lanchonetes where slug = 'lanchonete-do-curso')
where lanchonete_id is null;

alter table pratos_do_dia alter column lanchonete_id set not null;

create index if not exists pratos_do_dia_lanchonete_id_idx on pratos_do_dia (lanchonete_id);

-- ============================================================
-- reservas.lanchonete_id — mesmo backfill, herdando o lanchonete_id do
-- prato reservado.
-- ============================================================

alter table reservas add column if not exists lanchonete_id uuid references lanchonetes (id);

update reservas r
set lanchonete_id = p.lanchonete_id
from pratos_do_dia p
where r.prato_id = p.id
  and r.lanchonete_id is null;

alter table reservas alter column lanchonete_id set not null;

create index if not exists reservas_lanchonete_id_idx on reservas (lanchonete_id);

-- ============================================================
-- reservar_prato: agora grava lanchonete_id na reserva automaticamente,
-- herdado do prato (v_prato.lanchonete_id) — não confia num parâmetro
-- vindo do cliente, evita reserva gravada com lanchonete errado.
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
security definer
set search_path = public
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
    prato_id, lanchonete_id, cliente_nome, cliente_telefone, tipo_entrega, horario_desejado
  )
  values (
    p_prato_id, v_prato.lanchonete_id, p_cliente_nome, p_cliente_telefone, p_tipo_entrega, p_horario_desejado
  )
  returning * into v_reserva;

  return v_reserva;
end;
$$;

grant execute on function reservar_prato(uuid, text, text, text, time) to anon, authenticated;
