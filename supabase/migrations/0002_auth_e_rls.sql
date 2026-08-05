-- Guardou — autenticação do estabelecimento (Supabase Auth) e RLS mais
-- restritiva. Antes desta migration, escrita em pratos_do_dia e reservas
-- era pública (RLS desabilitado); agora só usuários autenticados (o dono
-- da lanchonete, logado em /admin) podem escrever. Leitura do cardápio e
-- criação de reserva continuam públicas — o cliente nunca faz login.

-- ============================================================
-- pratos_do_dia: leitura pública, escrita só autenticado
-- ============================================================

alter table pratos_do_dia enable row level security;

drop policy if exists "Leitura pública dos pratos" on pratos_do_dia;
create policy "Leitura pública dos pratos"
on pratos_do_dia for select
to anon, authenticated
using (true);

drop policy if exists "Insert autenticado de pratos" on pratos_do_dia;
create policy "Insert autenticado de pratos"
on pratos_do_dia for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "Update autenticado de pratos" on pratos_do_dia;
create policy "Update autenticado de pratos"
on pratos_do_dia for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Delete autenticado de pratos" on pratos_do_dia;
create policy "Delete autenticado de pratos"
on pratos_do_dia for delete
to authenticated
using (auth.uid() is not null);

revoke all on pratos_do_dia from anon;
grant select on pratos_do_dia to anon;
grant select, insert, update, delete on pratos_do_dia to authenticated;

-- ============================================================
-- reservas: insert público (cliente sem login), leitura/update/delete só
-- autenticado (evita expor telefone de outros clientes e garante que só
-- o admin muda status da reserva).
-- ============================================================

alter table reservas enable row level security;

drop policy if exists "Insert público de reservas" on reservas;
create policy "Insert público de reservas"
on reservas for insert
to anon, authenticated
with check (true);

drop policy if exists "Leitura autenticada de reservas" on reservas;
create policy "Leitura autenticada de reservas"
on reservas for select
to authenticated
using (true);

drop policy if exists "Update autenticado de reservas" on reservas;
create policy "Update autenticado de reservas"
on reservas for update
to authenticated
using (auth.uid() is not null)
with check (auth.uid() is not null);

drop policy if exists "Delete autenticado de reservas" on reservas;
create policy "Delete autenticado de reservas"
on reservas for delete
to authenticated
using (auth.uid() is not null);

revoke all on reservas from anon;
grant insert on reservas to anon;
grant select, insert, update, delete on reservas to authenticated;

-- ============================================================
-- reservar_prato precisa virar SECURITY DEFINER: o cliente (role anon)
-- chama essa função pra reservar, mas ela faz um UPDATE em
-- pratos_do_dia (incrementar quantidade_reservada) — e agora UPDATE
-- nessa tabela exige autenticação por RLS. SECURITY DEFINER faz a função
-- rodar com o privilégio de quem é dona da função (o role de migração,
-- que ignora RLS), então o cliente anônimo continua reservando
-- normalmente — só que agora esse é o ÚNICO caminho de escrita liberado
-- pra ele, e a função já valida tudo (esgotado, prato inexistente, etc)
-- antes de gravar. `set search_path` evita o ataque clássico de hijack
-- de search_path em função SECURITY DEFINER.
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
-- Storage bucket "pratos": leitura pública, upload/edição só autenticado
-- (só o admin logado cadastra prato com foto agora).
-- ============================================================

drop policy if exists "Upload público de fotos de pratos (MVP sem auth)" on storage.objects;
drop policy if exists "Atualização pública de fotos de pratos (MVP sem auth)" on storage.objects;

drop policy if exists "Upload autenticado de fotos de pratos" on storage.objects;
create policy "Upload autenticado de fotos de pratos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'pratos');

drop policy if exists "Atualização autenticada de fotos de pratos" on storage.objects;
create policy "Atualização autenticada de fotos de pratos"
on storage.objects for update
to authenticated
using (bucket_id = 'pratos');

-- "Leitura pública das fotos de pratos" (select), criada na migration
-- 0001, continua valendo e não precisa mudar.
