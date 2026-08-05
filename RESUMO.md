# Resumo — Guardou MVP pronto para demo

Atualizado em 2026-08-04 — autenticação adicionada (login do admin +
identificação leve do cliente + RLS restritiva).

## 🚀 URL de produção

**https://guardou.vercel.app**

⚠️ **Ainda não fiz o deploy desta rodada de mudanças** (auth/RLS) — só
implementei, testei a lógica de banco via PGlite e commitei localmente.
Você precisa rodar a migration nova no Supabase **antes** de dar push, ou
o `/admin` em produção vai ficar inacessível (RLS bloqueando sem o login
funcionando ainda). Passo a passo completo na seção 3.

## 🔑 Login do admin

| | |
|---|---|
| URL | `/login` (redireciona sozinho se você tentar `/admin` sem sessão) |
| Email sugerido | `dono@guardou.app` |
| Senha sugerida | `Guardou@2026` |

**Eu não criei esse usuário no seu projeto Supabase** — não tenho a
service role key nem a senha do banco, só a anon key (e olha lá: tentei
puxar via `vercel env pull` pra ao menos conferir, mas você marcou as
variáveis como "Sensitive" na Vercel, então nem a CLI consegue ler o
valor de volta). Duas formas de criar, na seção 3.

Se preferir outro email/senha, é só usar o que você quiser na hora de
criar — não tem nada fixo no código, esses são só valores sugeridos.

## 1. O que foi implementado nesta rodada

### Login do estabelecimento — autenticação real
- Troquei o client único do supabase-js por dois clients via
  `@supabase/ssr`: [`src/lib/supabase/client.ts`](src/lib/supabase/client.ts)
  (browser) e [`src/lib/supabase/server.ts`](src/lib/supabase/server.ts)
  (Server Components) — sessão viaja em cookies, compartilhada entre os
  dois.
- [`src/proxy.ts`](src/proxy.ts) protege `/admin/:path*`: sem sessão
  válida, redireciona pra `/login`. Nomeei o arquivo `proxy.ts` (não
  `middleware.ts`) porque o Next.js 16 depreciou a convenção antiga
  durante essa sessão — o build mostrava um aviso `"middleware" file
  convention is deprecated`, então já migrei pro nome novo (`proxy.ts` +
  `export async function proxy(...)`), mesmo comportamento.
- Se a chamada ao Supabase Auth falhar (rede fora do ar, credenciais
  erradas), o proxy trata como **deslogado** — falha fechada, nunca deixa
  passar pro admin só porque o Supabase não respondeu.
- `/login` ([`src/app/login/page.tsx`](src/app/login/page.tsx)): formulário
  de email/senha, chama `signInWithPassword`, erro genérico "Email ou
  senha inválidos" (não revela se o email existe).
- Botão "Sair" no header do admin
  ([`LogoutButton.tsx`](src/components/admin/LogoutButton.tsx)): chama
  `signOut()` e redireciona pra `/login`.
- Todos os componentes do admin (formulário de novo prato, listas de
  pratos/reservas, upload de foto) migraram pro client autenticado — sem
  isso, as escritas cairiam na RLS nova mesmo com o usuário logado.

### Identificação do cliente — leve, sem senha
- [`src/lib/clienteIdentidade.ts`](src/lib/clienteIdentidade.ts): salva
  `{ nome, telefone }` no `localStorage` (chave `guardou:cliente`), nada de
  conta/senha/confirmação por SMS ou email.
- Ao clicar "Reservar" pela primeira vez, aparece
  [`IdentificacaoModal`](src/components/IdentificacaoModal.tsx) — "Como
  podemos te chamar?" — só nome e celular. Depois disso, o formulário de
  reserva já abre pré-preenchido.
- Link discreto "Não é você? Preencher com outros dados" dentro do
  formulário de reserva (só aparece quando os campos vieram pré-
  preenchidos) — limpa o localStorage e os campos ficam em branco pra
  digitar de novo. Ao concluir a próxima reserva, o que for digitado é
  salvo de novo.

### RLS mais restritiva + RPC virou SECURITY DEFINER
Migration [`supabase/migrations/0002_auth_e_rls.sql`](supabase/migrations/0002_auth_e_rls.sql).
Antes disso, RLS estava desabilitado (escrita pública em tudo). Agora:

| Tabela | Ação | Quem pode |
|---|---|---|
| `pratos_do_dia` | select | público (`anon` + `authenticated`) |
| `pratos_do_dia` | insert/update/delete | só `authenticated` (`auth.uid() is not null`) |
| `reservas` | insert | público (cliente reserva sem login) |
| `reservas` | select/update/delete | só `authenticated` |
| `storage.objects` (bucket `pratos`) | select | público |
| `storage.objects` (bucket `pratos`) | insert/update | só `authenticated` |

Duas decisões que vale você revisar:
- **Restringi `select` de `reservas` pro admin só** — não foi pedido
  explicitamente, mas o pedido original já dizia "só o admin deve poder
  mudar status de reserva"; deixar `select` público significaria qualquer
  pessoa conseguir ler nome/telefone de todos os clientes que reservaram,
  então travei leitura também por privacidade.
- **Restringi upload/update do Storage** pelo mesmo raciocínio do
  `pratos_do_dia` — não foi pedido, mas deixar o bucket com upload público
  enquanto a tabela ficava travada seria a mesma falha de segurança
  disfarçada (qualquer um subir arquivo arbitrário pro bucket via API,
  sem passar pela UI).

**A função `reservar_prato` precisou virar `SECURITY DEFINER`** — ela faz
`UPDATE` em `pratos_do_dia` (incrementar `quantidade_reservada`), e isso
agora exige `authenticated`. Só que quem reserva é o cliente anônimo. Com
`SECURITY DEFINER`, a função roda com o privilégio de quem é dona dela
(o role de migração, que ignora RLS), então o cliente continua reservando
normalmente — mas esse é o **único** caminho de escrita que sobra pra ele,
e a função já valida tudo (esgotado, prato inexistente, tipo de entrega)
antes de gravar. Adicionei `set search_path = public` na função, prática
recomendada de segurança pra função `SECURITY DEFINER` (evita hijack de
search_path).

### Testei tudo isso com Postgres real (PGlite), de novo
Mesma abordagem da rodada anterior (sem Docker/projeto Supabase real
disponível aqui): criei roles `anon` e `authenticated` de verdade dentro
do PGlite, um stub de `auth.uid()` lendo uma GUC de sessão, apliquei a
migration inteira e testei 15 cenários — todos passando:

- `anon` lê `pratos_do_dia`, mas **não** consegue insert/update/delete
  diretos (permission denied).
- `anon` **não** consegue `select` em `reservas`.
- `anon` consegue `insert` direto em `reservas` (fluxo público preservado).
- `anon` **não** consegue `update` em `reservas`.
- `anon` reserva com sucesso via `reservar_prato` (RPC) mesmo sem nenhum
  grant direto — confirma que o `SECURITY DEFINER` funciona.
- RPC ainda rejeita corretamente prato esgotado após o refactor.
- `authenticated` consegue insert/update/delete em `pratos_do_dia` e em
  `reservas` sem restrição.

(Achei e corrigi dois bugs no *script de teste* nesse processo — não na
migration: eu tinha usado `grant ... to public` em vez de `to anon,
authenticated` no setup base, e `set_config(..., true)` (transação local)
em vez de `false` (sessão), o que fazia o "usuário logado" simulado
resetar entre queries. Corrigido, todos os 15 testes passaram limpos.)

## 2. O que ainda depende de você

Sem service role key, sem senha do banco Postgres, sem Supabase CLI
logada e sem Docker neste ambiente, não consigo:

1. **Rodar a migration `0002_auth_e_rls.sql` no seu projeto real.**
2. **Criar o usuário admin de verdade.** Duas opções:
   - **Dashboard (mais simples)**: Supabase → Authentication → Users →
     Add user → email `dono@guardou.app`, senha `Guardou@2026` (ou as
     suas escolhas), marcar **Auto Confirm User**.
   - **Script**: `SUPABASE_SERVICE_ROLE_KEY=sua-chave node
     scripts/criar-admin.mjs dono@guardou.app "Guardou@2026"` (a service
     role key fica só na sua máquina, no comando — não é salva em
     nenhum arquivo do projeto).
3. **Testar o login de verdade** contra o Supabase real — só validei o
   *comportamento do proxy* localmente (redirecionamento funcionando com
   credenciais placeholder), não o fluxo de login completo.
4. **Dar push e redeployar** — ver checklist exato na seção 3.

## 3. Passo a passo pra você (nesta ordem — importante)

1. No SQL Editor do Supabase, rode
   `supabase/migrations/0002_auth_e_rls.sql`.
2. Crie o usuário admin (uma das duas formas acima).
3. Teste local antes de subir:
   ```bash
   npm run dev
   ```
   - Abra `/admin` deslogado → deve cair em `/login`.
   - Faça login com o usuário criado → deve entrar no admin.
   - Cadastre um prato, marque uma reserva como concluída.
   - Clique em "Sair" → deve voltar pra `/login`.
   - Abra `/` numa aba anônima e confirme que reservar continua
     funcionando **sem login nenhum** (pede nome/telefone uma vez só, no
     modal de identificação).
4. Se tudo funcionar local, `git push origin main` — como o projeto Vercel
   está conectado ao GitHub, isso dispara o deploy sozinho.
5. Depois do deploy, repita o teste do passo 3 em
   `https://guardou.vercel.app` (login, cadastro de prato, reserva sem
   login).

Se pular o passo 1 (migration) antes de testar em produção, o `/admin` vai
carregar mas as leitura/escrita de `reservas`/`pratos_do_dia` vão falhar
silenciosamente (RLS antiga ainda liberada, mas o client novo já espera
cookies de sessão) — então a ordem importa.

## 4. Decisões de design/UX tomadas sozinho (revisão pendente sua)

- **Email/senha do admin escolhidos por mim**: `dono@guardou.app` /
  `Guardou@2026` — troque à vontade, não tem nada fixo no código.
- **Erro de login genérico** ("Email ou senha inválidos"), sem dizer se o
  email existe — prática padrão de segurança pra não ajudar quem está
  tentando adivinhar contas.
- **Identificação do cliente como modal separado**, não reaproveitando os
  campos nome/telefone que já existiam no formulário de reserva — achei
  que descolar "quem é você" de "detalhes desse pedido" ficou mais fiel ao
  pedido ("antes de fazer a primeira reserva... peça nome e telefone em
  uma tela simples"), mesmo que tecnicamente desse pra só pré-preencher os
  campos existentes.
- **`select` de `reservas` e upload de Storage restritos ao admin**: não
  foi pedido explicitamente, expliquei o raciocínio de segurança na seção
  1 — reverta se preferir manter público.
- **`reservar_prato` como `SECURITY DEFINER`**: única forma de manter o
  cliente reservando sem login depois de travar `UPDATE` em
  `pratos_do_dia` pra só-autenticado. Sem isso, a RLS nova quebraria o
  fluxo de reserva inteiro.
- **`proxy.ts` em vez de `middleware.ts`**: o Next 16 (versão que este
  projeto usa) deprecou a convenção `middleware` durante esta própria
  sessão de trabalho — migrei direto pro nome novo pra não entregar código
  já com aviso de depreciação.

## 5. Histórico — deploy inicial (sessão anterior, ainda válido)

### Status de cada etapa do deploy

| Etapa | Status |
|---|---|
| Git commitado e limpo | ✅ |
| Push pro GitHub (`miguelmoraes-tech/Guardou`, branch `main`) | ✅ |
| Projeto Vercel linkado (`.vercel/project.json`) | ✅ |
| Deploy de produção | ✅ `https://guardou.vercel.app` |
| Variáveis de ambiente na Vercel | ✅ |
| QR code apontando pra URL final | ✅ `public/qrcode-cardapio.png` e `/qrcode` |
| Teste HTTP de produção | ✅ sem erro de env var, HTML esperado |

O deploy inicial (sem auth) foi testado e confirmado no ar — veja o
histórico de commits pra detalhes de como o link Vercel/GitHub foi feito,
como a env var `NEXT_PUBLIC_SITE_URL` foi adicionada, e como o QR code foi
regenerado com a URL final. Resumo condensado porque a rodada de auth
desta sessão é o que precisa da sua atenção agora.

### Testes de banco (RPC `reservar_prato`, sem auth) — sessão anterior
Validei reservar até esgotar (sem race condition, `FOR UPDATE`), rejeição
de prato esgotado/inexistente/desativado/tipo de entrega inválido, e
confirmação de que chamadas rejeitadas não deixam registro parcial — tudo
via PGlite. Continua válido; a função só ganhou `SECURITY DEFINER` nesta
rodada, a lógica de negócio interna não mudou (reconfirmei isso nos 15
testes novos).

### Decisões de design da rodada anterior
Cores laranja/vermelho, "Marcar esgotado" vs "Desativar" como ações
separadas, telefone exigindo 11 dígitos, Realtime com poll de 15s como
fallback, fotos placeholder do Unsplash, `NEXT_PUBLIC_SITE_URL` adicionada
por mim direto na Vercel (variável pública, sem risco) — tudo detalhado no
histórico de commits do Git se precisar relembrar o porquê de cada uma.
