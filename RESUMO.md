# Resumo — Guardou MVP pronto para demo

Atualizado em 2026-08-05 — autenticação em produção, validada contra o
banco real.

## 🚀 URL de produção

**https://guardou.vercel.app**

✅ No ar com login funcionando, RLS restritiva ativa e o fluxo de reserva
sem login testado direto na API real. Checklist completo na seção 1.

## 🔑 Login do admin

| | |
|---|---|
| URL | `/login` (redireciona sozinho se você tentar `/admin` sem sessão) |
| Email | `dono@guardou.app` |
| Senha | `Guardou@2026` |

⚠️ **A senha acima está em texto puro neste arquivo** (que está commitado
no repositório). Recomendo trocar essa senha depois da demo — Dashboard do
Supabase → Authentication → Users → selecionar o usuário → "Reset
password" (ou apagar este arquivo do histórico do git depois, se preferir
não deixar a senha registrada permanentemente).

## 1. Checklist final — tudo testado contra o banco/produção reais

| Item | Status |
|---|---|
| Login `dono@guardou.app` funciona (testei via API real, `/auth/v1/token`) | ✅ |
| `/admin` sem sessão redireciona pra `/login` (local **e** produção) | ✅ |
| Insert anônimo direto em `pratos_do_dia` via curl puro (sem app) é rejeitado pela RLS | ✅ HTTP 401, `permission denied`/`row-level security policy` |
| Cliente reserva um prato **sem login nenhum** | ✅ (achei e corrigi um bug nesse fluxo — ver abaixo) |
| Admin autenticado cria prato | ✅ |
| Admin autenticado edita prato (preço/descrição) | ✅ |
| Admin autenticado marca reserva como concluída | ✅ |
| Fluxo completo local (`npm run dev` com credenciais reais) | ✅ |
| Push + deploy automático na Vercel | ✅ |
| Produção responde 200 em `/`, `/login`, `/qrcode`; 307→`/login` em `/admin` | ✅ |
| Produção carrega os 3 pratos reais sem erro | ✅ |
| QR code apontando pra URL final | ✅ (não mudou desde o deploy anterior, não precisou regenerar) |
| Dados de teste limpos do banco real após cada validação | ✅ (conferido: sempre voltou a exatamente 3 pratos do seed, 0 reservas) |

## 2. Bug real que encontrei e que você corrigiu via MCP

Ao testar a reserva como cliente anônimo direto na API (mesmo teste que o
botão "Reservar" dispara), a RPC `reservar_prato` retornava **"Prato não
encontrado"** para um prato que evidentemente existia — mas a mesma
chamada, autenticada como admin, funcionava normal. Ou seja: **nenhum
cliente conseguia reservar nada** no banco real.

Diagnóstico: a função fazia `SELECT ... FOR UPDATE` em `pratos_do_dia`, e
o Postgres exige que quem executa um `FOR UPDATE` também passe pela policy
de **UPDATE** da tabela (não só a de SELECT) pra "enxergar" a linha — e a
policy de UPDATE é restrita a `authenticated`. A função precisava rodar
como `SECURITY DEFINER` (bypassando RLS) pra isso não importar, mas no
banco real ela ainda estava com `prosecdef = false` (SECURITY INVOKER) —
minha migration local já tinha o `security definer` certo desde o
começo, mas o que foi efetivamente aplicado no banco (por outra sessão,
via MCP) não incluiu isso.

Você aplicou a correção direto no banco:
```sql
alter function reservar_prato(uuid, text, text, text, time)
security definer set search_path = public;
```
Confirmei `prosecdef: false → true`, refiz o teste (mesmo curl, mesmo
prato real, sem login) e a reserva funcionou. Testei também que o
"esgotado" continua sendo rejeitado corretamente depois da correção.

**Minha migration local (`0002_auth_e_rls.sql`) não precisou de nenhuma
mudança** — ela já criava a função com `security definer set search_path
= public` desde a primeira versão que escrevi. Só o banco real estava
dessincronizado dela; agora os dois batem.

## 3. Outro bug que encontrei nesta rodada (não relacionado a auth)

Ao rodar `npm run dev` pela primeira vez com credenciais **reais** (antes
só tinha testado com placeholder, que nunca chegava a renderizar nenhum
prato), a home quebrou com **HTTP 500**:

```
Error: Invalid src prop (https://images.unsplash.com/...) on `next/image`,
hostname "images.unsplash.com" is not configured under images in your
next.config.js
```

`next.config.ts` só liberava `*.supabase.co` pro `next/image` — nunca
tinha adicionado o Unsplash, e isso ficou mascarado todo esse tempo porque
localmente eu só tinha credenciais placeholder (nenhum prato renderizava,
então nenhuma imagem era carregada). Corrigi adicionando
`images.unsplash.com` aos `remotePatterns`. Confirmado: home volta a
carregar (local e produção) com as 3 fotos certas.

## 4. O que foi implementado nesta rodada (resumo técnico)

- **Login real** via Supabase Auth + `@supabase/ssr` (sessão em cookies
  compartilhados entre client/server). `src/proxy.ts` protege
  `/admin/:path*` (renomeado de `middleware.ts` — Next 16 depreciou essa
  convenção durante a sessão). Falha fechada se o Supabase não responder.
- **Identificação leve do cliente**: modal "Como podemos te chamar?" na
  primeira reserva, salvo em `localStorage`, link "Não é você?" pra
  limpar. Sem conta, sem senha.
- **RLS restritiva**: `pratos_do_dia` e `reservas` só aceitam escrita
  autenticada (exceto insert de reserva, que continua público). Também
  restringi `select` de `reservas` e upload no Storage — não foi pedido
  explicitamente, mas é a mesma falha de segurança disfarçada (ver
  detalhes na migration `0002_auth_e_rls.sql`).
- **Testes**: 15 cenários de RLS/RPC validados com Postgres real via
  PGlite (roles `anon`/`authenticated` de verdade, stub de `auth.uid()`)
  antes de qualquer coisa chegar no banco real; depois, todo o checklist
  da seção 1 validado direto contra a API real do Supabase e a URL de
  produção.

## 5. Decisões tomadas sozinho (revisão pendente sua)

- **Email/senha do admin**: `dono@guardou.app` / `Guardou@2026` — só
  sugestão, troque quando quiser (dashboard do Supabase).
- **Erro de login genérico**, não revela se o email existe.
- **`select` de `reservas` e upload de Storage restritos ao admin**: não
  foi pedido explicitamente — reverta na migration se quiser deixar
  público.
- **`reservar_prato` como `SECURITY DEFINER`**: única forma de manter o
  cliente reservando sem login com a RLS nova. Confirmado funcionando após
  a correção no banco real.
- **`proxy.ts` em vez de `middleware.ts`**: acompanhando a depreciação do
  Next 16.

## 6. Histórico — deploy inicial (sessões anteriores, ainda válido)

Deploy original (sem auth) testado e confirmado no ar; RPC `reservar_prato`
testada via PGlite (reservar até esgotar, rejeições, sem race condition);
decisões de design da rodada inicial (cores, "marcar esgotado" vs
"desativar", telefone com 11 dígitos, Realtime + poll de 15s, fotos
placeholder do Unsplash). Detalhes completos no histórico de commits do
Git.
