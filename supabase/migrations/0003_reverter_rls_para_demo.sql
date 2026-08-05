-- Guardou — reverte a RLS da 0002_auth_e_rls.sql pra demo de amanhã.
--
-- Contexto: pra zerar fricção na demo, a home virou uma tela de escolha
-- de perfil (Cliente / Estabelecimento) e /admin não pede mais login —
-- é só separação visual dos dois papéis, sem autenticação de verdade.
-- Com /admin sem sessão nenhuma, as policies que exigiam auth.uid() iam
-- só bloquear o próprio dono. Esta migration volta pratos_do_dia,
-- reservas e o bucket "pratos" pro comportamento público da
-- 0001_init.sql.
--
-- ⚠️ AVISO — NÃO USAR ASSIM COM UMA LANCHONETE DE VERDADE. Fora do
-- contexto desta demo, reative a autenticação: rode (uma versão
-- atualizada d)a 0002_auth_e_rls.sql, volte a proteger /admin com
-- src/proxy.ts (existe no repo, só não está sendo usado agora — veja
-- RESUMO.md) e volte a exigir login em /login (a página também continua
-- no repo). O usuário dono@guardou.app no Supabase Auth não foi apagado,
-- só não está em uso.

-- ============================================================
-- pratos_do_dia — volta a ser público (igual 0001)
-- ============================================================

drop policy if exists "Leitura pública dos pratos" on pratos_do_dia;
drop policy if exists "Insert autenticado de pratos" on pratos_do_dia;
drop policy if exists "Update autenticado de pratos" on pratos_do_dia;
drop policy if exists "Delete autenticado de pratos" on pratos_do_dia;

alter table pratos_do_dia disable row level security;

revoke all on pratos_do_dia from anon;
grant select, insert, update, delete on pratos_do_dia to anon, authenticated;

-- ============================================================
-- reservas — volta a ser público (igual 0001)
-- ============================================================

drop policy if exists "Insert público de reservas" on reservas;
drop policy if exists "Leitura autenticada de reservas" on reservas;
drop policy if exists "Update autenticado de reservas" on reservas;
drop policy if exists "Delete autenticado de reservas" on reservas;

alter table reservas disable row level security;

revoke all on reservas from anon;
grant select, insert, update, delete on reservas to anon, authenticated;

-- ============================================================
-- Storage bucket "pratos" — upload/edição públicos de novo (igual 0001)
-- ============================================================

drop policy if exists "Upload autenticado de fotos de pratos" on storage.objects;
create policy "Upload público de fotos de pratos (MVP sem auth)"
on storage.objects for insert
to public
with check (bucket_id = 'pratos');

drop policy if exists "Atualização autenticada de fotos de pratos" on storage.objects;
create policy "Atualização pública de fotos de pratos (MVP sem auth)"
on storage.objects for update
to public
using (bucket_id = 'pratos');

-- "Leitura pública das fotos de pratos" (select), da 0001, não mudou.

-- ============================================================
-- reservar_prato: deixamos como SECURITY DEFINER (não revertido).
-- Com RLS desabilitado isso não faz diferença nenhuma na prática — é
-- inofensivo manter, e evita desfazer uma correção já validada caso a
-- autenticação volte antes desta função ser tocada de novo.
-- ============================================================
