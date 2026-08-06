# Resumo — Guardou MVP pronto para demo

Atualizado em 2026-08-06 — app virou multi-tenant (várias lanchonetes, cada
uma com seu próprio cardápio e QR code) e validado em produção.

## 🚀 URL de produção

**https://guardou.vercel.app**

## 🏪 Lanchonete da apresentação de amanhã

**Slug: `lanchonete-do-curso`** — link direto pro cardápio dela:
**https://guardou.vercel.app/l/lanchonete-do-curso**

O QR code pra imprimir está dentro do painel dela, em
`/admin/lanchonete-do-curso` → seção "Meu QR Code" → botão "Baixar QR code
(PNG)". Ele já aponta pra essa URL.

⚠️ **Antes da apresentação**: os 3 pratos do seed (+ os que você cadastrou
manualmente) estão datados de **2026-08-05** (ontem) — a coluna `data` de
`pratos_do_dia` é por dia, então o cardápio de hoje vai aparecer **vazio**
("Nenhum prato publicado hoje") até você publicar pratos novos em
`/admin/lanchonete-do-curso` com a data de hoje. Isso é comportamento
normal (já existia antes do multi-tenant), não um bug — só não esqueça de
recadastrar o cardápio de amanhã antes de começar.

## 🗺️ Estrutura de rotas (estado atual)

| Rota | O que é | Autenticação |
|---|---|---|
| `/` | Tela de escolha de perfil ("Sou Cliente" / "Sou Estabelecimento"), cada uma com seu sub-fluxo (ver abaixo) | Nenhuma |
| `/l/[slug]` | Cardápio do dia **daquela lanchonete**, reserva do cliente. Slug inválido mostra tela amigável "Lanchonete não encontrada" | Nenhuma (identificação leve nome+telefone em `localStorage`) |
| `/admin/[slug]` | Painel **daquela lanchonete** (cadastrar prato, gerenciar reservas, ver/baixar QR code, trocar de lanchonete) | **Nenhuma** — ver aviso abaixo |
| `/qrcode` | Cartaz genérico antigo, aponta pra `/` (não pra uma lanchonete específica) — pré-multi-tenant, mantido mas não é o QR que se usa hoje | Nenhuma |
| `/login` | Existe no repo, **não está linkada em lugar nenhum** | Dormant — ver aviso abaixo |

As rotas antigas `/admin` e `/cardapio` (single-tenant) foram **removidas**
nesta rodada — elas não filtravam por lanchonete e vazariam dados de todas
as lanchonetes juntas depois do multi-tenant. `/admin/[slug]` e
`/l/[slug]` são os únicos caminhos agora.

### Sub-fluxo "Sou Estabelecimento" (em `/`)

- Se já existe um slug salvo em `localStorage`
  (`guardou_minha_lanchonete`), redireciona direto pra `/admin/[slug]`.
- Senão, duas opções: **"Criar minha lanchonete"** (nome + logo opcional →
  RPC `criar_lanchonete` gera o slug, com sufixo numérico em caso de
  colisão de nome) ou **"Já tenho uma lanchonete"** (busca/lista as
  existentes). Qualquer uma das duas salva o slug no `localStorage` e
  redireciona pro painel.
- Botão "Trocar de lanchonete" no painel limpa o `localStorage` e volta
  pra `/`.

### Sub-fluxo "Sou Cliente" (em `/`)

- Lista todas as lanchonetes cadastradas (nome + logo) pra quem não tem o
  QR em mãos — normalmente o cliente chega direto em `/l/[slug]` via QR
  code.

## ⚠️ Aviso de segurança — leia antes de usar isso pra valer

Pra zerar fricção na demo, `/admin/[slug]` **não pede login** — qualquer
um que souber (ou adivinhar) o slug de uma lanchonete entra direto no
painel dela, sem senha nenhuma, e a RLS do banco está **pública**
(qualquer um com a anon key pode ler/escrever `lanchonetes`,
`pratos_do_dia` e `reservas` — migration
`supabase/migrations/0003_reverter_rls_para_demo.sql`, agora estendida
pra `lanchonetes` na `0004_multi_tenant.sql`). Isso é aceitável **só**
neste contexto controlado de apresentação — o multi-tenant desta rodada
foi proposital pra reduzir risco de bug de auth, não pra virar produto
multi-cliente de verdade sem antes resolver isso.

**Antes de usar com uma lanchonete de verdade**, reative a autenticação:
1. Rode `supabase/migrations/0002_auth_e_rls.sql` de novo (RLS restrita:
   escrita em `pratos_do_dia`/`reservas` só autenticada) e adapte pra
   `lanchonetes` também.
2. Restaure a proteção de rota: existia um `src/proxy.ts` (removido nesta
   simplificação, ainda no histórico do git) que redirecionava `/admin`
   pra `/login` sem sessão — precisa virar `/admin/[slug]` e confirmar
   que a sessão logada corresponde à lanchonete daquele slug (não só que
   existe uma sessão qualquer).
3. Linke `/login` de volta em algum lugar (a página continua no repo,
   só não está referenciada) e troque o botão "Trocar de lanchonete" do
   admin por "Sair" (`src/components/admin/LogoutButton.tsx`, também
   preservado).
4. O usuário `dono@guardou.app` no Supabase Auth não foi apagado — só
   troque a senha antes de usar de verdade (a senha sugerida ficou
   registrada em texto puro num RESUMO.md anterior, no histórico do git).

## 1. Multi-tenant: cada lanchonete com seu cardápio e QR code (esta rodada)

Migration `supabase/migrations/0004_multi_tenant.sql`: tabela
`lanchonetes` nova (`id`, `nome`, `slug` único, `logo_url`,
`cor_primaria`), `lanchonete_id` (not null, FK) adicionado em
`pratos_do_dia` e `reservas`. RLS continua desabilitado — mesma decisão
já tomada, agora estendida pra tabela nova.

- **RPC `criar_lanchonete(nome, logo_url, cor_primaria)`**: gera o slug a
  partir do nome (`slugify`, minúsculo/sem acento/hifens), resolve
  colisão com sufixo numérico (`-2`, `-3`...) via retry em
  `unique_violation` — atômico mesmo com dois cadastros simultâneos com o
  mesmo nome.
- **RPC `reservar_prato`**: agora grava `lanchonete_id` na reserva
  **herdado do prato** (não confia num valor vindo do cliente) — mesma
  assinatura de antes, nenhuma mudança no `ReservaModal.tsx`.
- **Backfill dos dados existentes**: criei a lanchonete "Lanchonete do
  Curso" e associei a ela todos os pratos que já existiam em produção (os
  3 do seed + 2 cadastrados manualmente por você, incluindo o
  "kakdakdçad") — nenhum prato ficou órfão.
- **Rotas novas**: `/admin/[slug]` e `/l/[slug]` (detalhes na seção de
  rotas acima). As antigas `/admin` e `/cardapio` foram removidas.
- **QR code**: `QrCodeCard` trocou de `QRCodeSVG` pra `QRCodeCanvas` (com
  ref) só pra viabilizar o botão "Baixar QR code (PNG)" — usa
  `canvas.toDataURL('image/png')`. A URL codificada agora é
  `${NEXT_PUBLIC_SITE_URL ?? window.location.origin}/l/[slug]`.
- **Upload de logo**: reaproveita o bucket `pratos` (já público, sem
  auth) numa subpasta `logos/` — não criei bucket novo pra isso.

### Teste de isolamento multi-tenant (local e produção)

Criei uma segunda lanchonete de teste de verdade (via a RPC
`criar_lanchonete`, não inserção direta) tanto local quanto contra
`https://guardou.vercel.app` depois do deploy, em cada ambiente:
1. Cadastrei um prato datado de hoje em cada lanchonete (a "do Curso" e a
   de teste).
2. Confirmei que `/l/[slug]` de cada uma mostra **só** o prato dela — o
   prato da outra não aparece.
3. Reservei o prato da lanchonete de teste via `reservar_prato`.
4. Confirmei que `/admin/[slug]` da lanchonete de teste mostra a reserva,
   e que `/admin/lanchonete-do-curso` **não mostra nada** (isolamento
   também nas reservas, não só no cardápio).
5. Confirmei que o QR code gerado no admin da lanchonete de teste aponta
   pra URL certa (`.../l/[slug-da-teste]`), e que um slug inválido
   (`/l/nao-existe-xyz`) mostra a tela amigável "Lanchonete não
   encontrada" em vez de quebrar.
6. Apaguei a lanchonete de teste e tudo que criei nela (prato + reserva)
   em ambos os ambientes — banco de produção confirmado de volta a
   exatamente os dados que já existiam antes (só "Lanchonete do Curso",
   nenhum prato/reserva extra).

Slug final que vai ser usado na apresentação: **`lanchonete-do-curso`**
(detalhes e link direto na seção "🏪 Lanchonete da apresentação de
amanhã", no topo deste arquivo).

## 2. Refino visual e de UX (rodada anterior, 2026-08-05)

**Nenhuma lógica de negócio, RPC ou schema do banco foi alterada** — só
aparência e experiência. Detalhes:

### Identidade visual
- Paleta de marca formalizada como CSS variables (`@theme` em
  `globals.css`): `brand-*` (laranja/terracota, cor principal),
  `accent-*` (vermelho, erros/gradiente), `warning-*` (âmbar, urgência),
  `success-*` (verde, confirmações). Antes essas cores eram usadas soltas
  (`orange-600`, `red-600` etc.) repetidas em cada componente; agora são
  tokens únicos reutilizados em todo o app.
- Favicon custom (`src/app/icon.svg`, ícone de tigela com gradiente da
  marca) substituindo o ícone padrão do Next.js. Título da aba: "Guardou".
  Tagline atualizada em toda parte: "Reserve seu prato do dia antes que
  acabe."
- Transições de 200-300ms consistentes (hover, troca de estado) e
  animações de entrada leves (fade-in, fade-in-up, sheet-in) em modais e
  na grade de cards — nada aparece "de repente".

### Telas
- **`/` (escolha de perfil)**: wordmark com ícone em gradiente, dois cards
  grandes com ícone + seta indicando ação, tagline correta.
- **Cardápio**: badge "Últimas unidades" agora calculado por **porcentagem
  restante (<30%)**, não mais por um número fixo de unidades — puramente
  uma mudança de critério visual, não mexe em `quantidade_reservada`/
  `quantidade_total` nem na RPC. Texto mudou de "X restantes" pra "X
  disponíveis". Card esgotado agora reduz a opacidade do card inteiro
  (antes só escurecia a foto).
- **Modal de reserva**: campos com mais espaço entre si, ícone de check
  em SVG (antes era emoji ✅, que renderiza diferente por SO/navegador) na
  tela de confirmação, horário e local de retirada destacados num card
  separado, botão de fechar com área de toque maior.
- **Admin**: formulário de novo prato com borda superior colorida
  (destaque visual), contadores nos títulos das seções ("Pratos de hoje
  (3)"), status de reserva com cor por estado (pendente/confirmada/
  concluída/cancelada — antes só distinguia concluída de "todo o resto").

### Bug real encontrado (não é só estilo)
A tabela de reservas do admin usava `overflow-hidden` no container —
isso **cortava** colunas inteiras (telefone, botão "Marcar concluída") em
telas estreitas, em vez de permitir rolagem horizontal. Numa tela de
375px, colunas essenciais simplesmente desapareciam sem aviso. Troquei
pra `overflow-x-auto`. Esse é o tipo de bug que só aparece testando em
viewport pequeno — vale conferir de novo se a lista de reservas crescer
muito (muitas colunas) antes da demo.

## 3. Testes rodados após o refino visual (nada quebrou)

Ciclo completo, direto contra o Supabase real e depois contra
`https://guardou.vercel.app`, duas vezes (local e produção):
1. Admin cadastra prato sem login.
2. Prato aparece no `/cardapio` imediatamente.
3. Cliente reserva sem login (testado até deixar o prato com <30% —
   confirmei visualmente que o badge "Últimas unidades" aparece).
4. Admin marca reserva como concluída — status visual muda de "Pendente"
   pra "Concluída".
5. Dados de teste sempre apagados depois — banco confirmado de volta a
   exatamente os pratos reais (3 do seed + o que você mesmo cadastrou
   manualmente, "kakdakdçad", que não toquei).

## 4. Decisões tomadas sozinho (revisão pendente sua)

- **Removi `/admin` e `/cardapio` (single-tenant) em vez de manter como
  redirect**: o pedido não falou explicitamente delas, mas depois do
  multi-tenant elas ficariam mostrando pratos/reservas de todas as
  lanchonetes misturados (vazamento entre tenants), o que é pior que
  simplesmente não existirem mais. Se você tinha links/favoritos
  antigos apontando pra `/admin` ou `/cardapio`, eles agora quebram —
  me avise se isso for um problema pra amanhã.
- **Logo da lanchonete vai pro bucket `pratos` já existente** (subpasta
  `logos/`), não criei bucket novo — evita mexer em política de storage
  na véspera, e o bucket já é público sem auth do jeito que a demo
  precisa.
- **Não toquei em `/qrcode`** (o pôster genérico que aponta pra `/`,
  pré-multi-tenant): ele não referencia `pratos_do_dia` nem quebra com a
  mudança, só ficou menos útil (não leva direto a um cardápio). O QR que
  importa pra amanhã é o de dentro do admin da lanchonete
  (`/admin/lanchonete-do-curso` → "Meu QR Code").
- **Critério de "quase esgotado" mudou de número fixo pra porcentagem**
  (<30% restante): o pedido especificava esse critério explicitamente;
  antes (na v1 do MVP) era um número fixo de unidades. Só afeta quando o
  badge aparece, não a lógica de reserva.
- **"Onde retirar" na confirmação virou "No balcão, com seu nome"**: o
  schema não tem campo de endereço/local da lanchonete, então usei o
  texto que já existia informalmente ("apresente seu nome no balcão")
  como o "local em destaque" pedido.
- **Não fiz uma reformulação estrutural do dashboard admin** (ex: mover
  formulário pra modal separado) — o layout atual (formulário em
  destaque no topo + listas abaixo) já atendia "formulário em destaque",
  e trocar pra modal traria risco de quebrar o fluxo sem ganho claro pra
  demo de amanhã. Se quiser essa mudança estrutural, me avise.
- **Não reescrevi toda a paleta com nomes 100% novos em todo componente**
  — formalizei os tokens de marca (`brand`/`accent`/`warning`/`success`)
  e troquei os usos principais, mas não fiz um find-and-replace cego de
  cada cor neutra (`stone-*`) já que essas já eram consistentes e o
  Tailwind v4 já as implementa via CSS variables internamente.

## 5. Histórico — rodadas anteriores (contexto, ainda válido)

- **Deploy inicial**: Next.js + Supabase + Vercel configurados, RPC
  `reservar_prato` testada via PGlite (reservar até esgotar, sem race
  condition), seed de 3 pratos reais com fotos do Unsplash.
- **Autenticação (revertida pra demo)**: Supabase Auth + RLS restritiva
  foram implementados e chegaram a rodar em produção; um bug real foi
  encontrado (RPC sem `SECURITY DEFINER` efetivo no banco, corrigido via
  MCP) e outro (`next.config.ts` sem liberar `images.unsplash.com`,
  corrigido). Depois, a pedido, essa autenticação foi revertida pra
  simplificar a demo (ver aviso de segurança no topo deste arquivo) — o
  código de login não foi apagado, só desconectado do fluxo ativo.

Detalhes completos de cada decisão e teste estão no histórico de commits
do Git.
