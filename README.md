# Guardou — Reserva de cardápio do dia

MVP para lanchonetes reservarem o prato do dia sem fila. Cliente reserva pelo
celular (via link/QR code no balcão), a lanchonete gerencia tudo pelo painel
`/admin`.

- **Home** (`/`): tela de escolha — "Sou Cliente" ou "Sou Estabelecimento".
- **Cliente** (`/cardapio`): vê o cardápio de hoje, reserva um prato com
  nome, telefone, tipo de entrega e horário. Identificação leve (nome +
  telefone salvos no navegador, sem senha) na primeira reserva. Atualiza em
  tempo real conforme outras pessoas reservam.
- **Admin** (`/admin`): cadastra pratos do dia (com foto), marca pratos como
  esgotados/desativados, e acompanha/conclui as reservas do dia. **Sem login
  no momento** — é uma simplificação pra demo, ver aviso de segurança
  abaixo.
- **QR code** (`/qrcode`): página pronta pra imprimir, com QR apontando pra
  home. Também existe um PNG em [`public/qrcode-cardapio.png`](public/qrcode-cardapio.png)
  gerado via `npm run qrcode`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres +
Storage + Realtime).

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. Em **SQL Editor**, rode em ordem:
   - [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
     — tabelas `pratos_do_dia`/`reservas`, função `reservar_prato` (reserva
     atômica, testada com Postgres real via PGlite — veja `RESUMO.md`),
     Realtime, bucket público `pratos` no Storage.
   - [`supabase/migrations/0003_reverter_rls_para_demo.sql`](supabase/migrations/0003_reverter_rls_para_demo.sql)
     — mantém escrita pública em tudo (sem exigir login), do jeito que a
     demo de amanhã precisa. **Pule a `0002_auth_e_rls.sql`** por enquanto
     (ela existe no repo, mas foi revertida pela `0003` — só volte a
     rodá-la quando for reativar autenticação de verdade, veja o aviso
     abaixo).
3. (Opcional, recomendado para a demo) Rode também
   [`supabase/seed.sql`](supabase/seed.sql) no SQL Editor — cadastra 3 pratos
   de exemplo já cobrindo os três estados de card: disponível, quase
   esgotado e esgotado.
4. Em **Project Settings > API**, copie a **Project URL** e a **anon public
   key**.

## 2. Configurar variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-public
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` é usada pra gerar o QR code em `/admin` e `/qrcode`.
Ao fazer deploy (ex: Vercel), troque pela URL pública do site e regenere o
PNG com `npm run qrcode https://sua-url.vercel.app`.

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) (escolha de perfil),
[http://localhost:3000/cardapio](http://localhost:3000/cardapio) (cliente),
[http://localhost:3000/admin](http://localhost:3000/admin) (painel) e
[http://localhost:3000/qrcode](http://localhost:3000/qrcode) (cartaz pra
imprimir).

## Fluxo de demo sugerido

1. Rode `supabase/seed.sql` (passo 1.3 acima) pra já ter 3 pratos com foto
   nos três estados (disponível / quase esgotado / esgotado).
2. Abra `/` e mostre a escolha de perfil.
3. Clique em "Sou Cliente" → mostre os três cards, o esgotado já aparece com
   botão desabilitado.
4. Faça uma reserva no prato "quase esgotado" e mostre a tela de confirmação.
5. Volte em `/` → "Sou Estabelecimento" → `/admin`: a reserva aparece na
   lista, e o prato agora está esgotado — mostre o card em `/cardapio`
   atualizando sozinho via Realtime.
6. Marque a reserva como "concluída" no admin. Botão "← Voltar" leva de
   volta pra escolha de perfil.

## ⚠️ Sobre segurança (RLS e autenticação)

**Estado atual (demo):** `/admin` não exige login — é só separação visual
de papéis na home. RLS está desabilitada, escrita em `pratos_do_dia` e
`reservas` é pública (migration `0003_reverter_rls_para_demo.sql`). Isso é
aceitável **só** nesse contexto controlado de demo/apresentação.

**Antes de usar isso com uma lanchonete de verdade**, reative a
autenticação:
1. Rode `supabase/migrations/0002_auth_e_rls.sql` (ou uma versão
   atualizada dela) de novo.
2. Restaure `src/proxy.ts` protegendo `/admin/:path*` — o arquivo ainda
   existe no histórico do git (removido nesta rodada), ou recrie a partir
   do padrão `@supabase/ssr` + `createServerClient` + `auth.getUser()`.
3. Linke `/login` de volta em algum lugar visível (a página continua no
   repo, só não está linkada agora) e troque o botão "← Voltar" do admin
   por um botão "Sair" (componente `LogoutButton.tsx`, também preservado).
4. O usuário `dono@guardou.app` no Supabase Auth não foi apagado — só
   troque a senha antes de usar de verdade.

Detalhes completos de cada mudança estão no `RESUMO.md`.

## Deploy

Veja `RESUMO.md` pro passo a passo de deploy na Vercel e o estado atual do
repositório Git.
