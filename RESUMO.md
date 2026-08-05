# Resumo — Guardou MVP pronto para demo

Atualizado em 2026-08-05 — refino visual/UX aplicado e validado em produção.

## 🚀 URL de produção

**https://guardou.vercel.app**

## 🗺️ Estrutura de rotas (estado atual)

| Rota | O que é | Autenticação |
|---|---|---|
| `/` | Tela de escolha de perfil ("Sou Cliente" / "Sou Estabelecimento") | Nenhuma |
| `/cardapio` | Cardápio do dia, reserva do cliente | Nenhuma (identificação leve nome+telefone em `localStorage`) |
| `/admin` | Painel do estabelecimento (cadastrar prato, gerenciar reservas) | **Nenhuma no momento** — ver aviso abaixo |
| `/qrcode` | Cartaz pra imprimir com QR apontando pra `/` | Nenhuma |
| `/login` | Existe no repo, **não está linkada em lugar nenhum** | Dormant — ver aviso abaixo |

## ⚠️ Aviso de segurança — leia antes de usar isso pra valer

Pra zerar fricção na demo, `/admin` **não pede login** e a RLS do banco
está **pública** (qualquer um com a anon key pode ler/escrever
`pratos_do_dia` e `reservas` — migration
`supabase/migrations/0003_reverter_rls_para_demo.sql`). Isso é aceitável
**só** neste contexto controlado de apresentação.

**Antes de usar com uma lanchonete de verdade**, reative a autenticação:
1. Rode `supabase/migrations/0002_auth_e_rls.sql` de novo (RLS restrita:
   escrita em `pratos_do_dia`/`reservas` só autenticada).
2. Restaure a proteção de rota: existia um `src/proxy.ts` (removido nesta
   simplificação, ainda no histórico do git) que redirecionava `/admin`
   pra `/login` sem sessão.
3. Linke `/login` de volta em algum lugar (a página continua no repo,
   só não está referenciada) e troque o botão "← Voltar" do admin por
   "Sair" (`src/components/admin/LogoutButton.tsx`, também preservado).
4. O usuário `dono@guardou.app` no Supabase Auth não foi apagado — só
   troque a senha antes de usar de verdade (a senha sugerida ficou
   registrada em texto puro num RESUMO.md anterior, no histórico do git).

## 1. Refino visual e de UX feito nesta rodada

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

## 2. Testes rodados após o refino (nada quebrou)

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

## 3. Decisões tomadas sozinho (revisão pendente sua)

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

## 4. Histórico — rodadas anteriores (contexto, ainda válido)

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
