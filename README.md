# Guardou — Reserva de cardápio do dia

MVP para lanchonetes reservarem o prato do dia sem fila. Cliente reserva pelo
celular (via link/QR code no balcão), a lanchonete gerencia tudo pelo painel
`/admin`.

- **Cliente** (`/`): vê o cardápio de hoje, reserva um prato com nome,
  telefone, tipo de entrega e horário. Atualiza em tempo real conforme outras
  pessoas reservam.
- **Admin** (`/admin`): cadastra pratos do dia (com foto), marca pratos como
  esgotados/desativados, e acompanha/conclui as reservas do dia. Sem login
  por enquanto — é uma demo.
- **QR code** (`/qrcode`): página pronta pra imprimir, com QR apontando pra
  home. Também existe um PNG em [`public/qrcode-cardapio.png`](public/qrcode-cardapio.png)
  gerado via `npm run qrcode`.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres +
Storage + Realtime).

## 1. Criar o projeto no Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (grátis).
2. Em **SQL Editor**, cole e rode o conteúdo de
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
   Isso cria as tabelas `pratos_do_dia` e `reservas`, a função `reservar_prato`
   (reserva atômica, sem race condition — testada com Postgres real via
   PGlite, veja `RESUMO.md`), habilita Realtime nas duas tabelas e cria o
   bucket público `pratos` no Storage.
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

Abra [http://localhost:3000](http://localhost:3000) (cliente),
[http://localhost:3000/admin](http://localhost:3000/admin) (painel) e
[http://localhost:3000/qrcode](http://localhost:3000/qrcode) (cartaz pra
imprimir).

## Fluxo de demo sugerido

1. Rode `supabase/seed.sql` (passo 1.3 acima) pra já ter 3 pratos com foto
   nos três estados (disponível / quase esgotado / esgotado).
2. Abra `/` e mostre os três cards — o esgotado já aparece com botão
   desabilitado.
3. Faça uma reserva no prato "quase esgotado" e mostre a tela de confirmação.
4. Abra `/admin` em outra aba: a reserva aparece na lista, e o prato agora
   está esgotado — mostre o card em `/` atualizando sozinho via Realtime.
5. Marque a reserva como "concluída" no admin.

## Sobre segurança (RLS)

RLS está **desabilitado** de propósito nesta fase — é um MVP de demo sem
multi-tenant e sem autenticação. Antes de ir pra produção com dados reais,
adicione autenticação no `/admin` e políticas de RLS nas tabelas.

## Deploy

Veja `RESUMO.md` pro passo a passo de deploy na Vercel e o estado atual do
repositório Git.
