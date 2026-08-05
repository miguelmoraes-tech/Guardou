# Resumo — Guardou MVP pronto para demo

Trabalho autônomo concluído em 2026-08-04, à noite, para a demo de amanhã de
manhã. Este arquivo documenta o que foi feito, o que ficou pendente (e por
quê) e o passo a passo exato pra você rodar ao acordar.

## 1. O que foi feito

### Testei a camada de banco de dados com Postgres real
Não havia Docker nem um projeto Supabase hospedado disponível neste
ambiente, então não deu pra rodar `supabase start` nem testar contra o
projeto real. Para não deixar a lógica mais crítica do app (a reserva
atômica) sem teste nenhum, rodei o schema e a função `reservar_prato`
inteiros contra um Postgres real via [PGlite](https://pglite.dev/) (Postgres
compilado pra WASM, roda em Node sem instalar nada permanente — usei como
dependência temporária, não ficou no projeto). Cenários testados, todos
passando:

- Reservar até esgotar (2 reservas num prato com `quantidade_total = 2`) →
  `quantidade_reservada` incrementa certinho, sem race condition (o `FOR
  UPDATE` trava a linha).
- 3ª reserva no mesmo prato → rejeitada com "Prato esgotado", sem quebrar
  nem inserir lixo na tabela `reservas`.
- Reserva num `prato_id` que não existe → rejeitada com "Prato não
  encontrado".
- Reserva com `tipo_entrega` inválido → rejeitada com "Tipo de entrega
  inválido".
- Reserva num prato com `ativo = false` → rejeitada com "Prato
  indisponível".
- Confirmei que só as reservas válidas ficam gravadas (nenhum insert parcial
  sobra de uma chamada que deu erro — a função inteira é uma transação).

**O que isso NÃO cobre:** o fluxo end-to-end pelo navegador contra um
Supabase de verdade (Storage, Realtime, PostgREST). Isso só dá pra testar
com um projeto Supabase real — veja a seção de pendências.

### Corrigi bugs e melhorei os estados de UI
- **Duplo clique / dupla reserva**: o formulário de reserva agora ignora
  submits repetidos enquanto uma reserva está em andamento (`if (enviando)
  return`), e trava todos os campos (`<fieldset disabled>`) durante o envio
  — antes só o botão ficava desabilitado, mas era teoricamente possível
  disparar duas requisições em cliques muito rápidos antes do React
  re-renderizar. O mesmo guard foi adicionado no formulário de novo prato do
  admin.
- **Spinner de loading**: criei um componente `Spinner` reutilizável, usado
  nos botões "Confirmar reserva" e "Publicar prato" enquanto a requisição
  está em voo.
- **Mensagem de erro de prato esgotado**: ajustada pro texto que você pediu
  — "Ops, esse prato acabou de esgotar! Escolha outro." — mais uma mensagem
  separada pra quando o prato foi desativado nesse meio tempo.
- **Validação de formulário**: telefone agora exige os 11 dígitos completos
  do celular (DDD + 9 dígitos), não só ">= 10" como antes. Horário é
  validado tanto pelo `min`/`max` do input quanto por uma checagem
  explícita em JS (`horario < abertura || horario > fechamento`), caso o
  navegador permita digitar fora do range. Nome obrigatório com `trim()`
  pra não aceitar só espaços.

### Populei dados de exemplo
`supabase/seed.sql` — 3 pratos de hoje, com fotos placeholder do Unsplash
(verifiquei as URLs uma a uma, todas retornando 200 e mostrando comida de
verdade antes de usar):

| Prato | Preço | Estado |
|---|---|---|
| Frango grelhado, arroz, feijão e salada | R$ 18,90 | Disponível (3/20 reservados) |
| Feijoada completa | R$ 24,90 | Quase esgotado (4/5 reservados) |
| Estrogonofe de carne | R$ 21,90 | Esgotado (10/10 reservados) |

O script é idempotente — pode rodar de novo que ele limpa os 3 pratos de
hoje com esses nomes antes de reinserir.

### QR code
- `npm run qrcode` gera `public/qrcode-cardapio.png` (1024×1024, já commitado)
  apontando pra `NEXT_PUBLIC_SITE_URL`. Hoje está apontando pra
  `http://localhost:3000` porque ainda não existe URL de deploy — **precisa
  regenerar depois do deploy** (comando exato na seção de pendências).
- Também criei a página `/qrcode`: mostra o QR grande na tela com um botão
  "Imprimir cartaz" (usa `window.print()`), pra você abrir no navegador e
  imprimir direto sem precisar do arquivo PNG, já com a URL certa em tempo
  real (não fica desatualizada como o PNG).

### Git
Repositório local com 7 commits organizados por assunto (scaffold → schema
→ cliente → admin → QR code → deploy config → docs). Histórico limpo, sem
`.env.local` nem nenhum segredo commitado — só `.env.example` com valores
fictícios.

### Build e lint
`npm run build` e `npm run lint` passam limpos. Testei as 3 rotas (`/`,
`/admin`, `/qrcode`) rodando `npm run dev` — todas respondem 200, inclusive
com as credenciais do Supabase ainda como placeholder (o app não quebra,
só não mostra dados até você configurar o `.env.local` de verdade).

## 2. O que ficou pendente (não deu pra automatizar)

Este ambiente não tem Docker, não tem Supabase CLI logado, não tem `gh`
CLI instalado, e a Vercel CLI está instalada mas sem login (tentei `vercel
whoami`, ela abriu um fluxo de OAuth por device code esperando eu visitar
uma URL e confirmar — não dá pra completar isso sem você). Por isso:

1. **Nenhum teste rodou contra o Supabase real** (só contra o Postgres puro
   via PGlite, que valida o schema/RPC mas não Storage/Realtime/PostgREST).
2. **Repositório remoto no GitHub não foi criado.** O `origin` deste repo
   local já aponta pro repo vazio que você tinha criado
   (`github.com/miguelmoraes-tech/Guardou`) — dá pra só dar push nele.
   Se preferir mesmo um repo separado chamado `guardou-mvp` (como pedido),
   siga o passo a passo abaixo.
3. **Deploy na Vercel não foi feito** — precisa de login interativo.
4. **QR code ainda aponta pra localhost** — precisa regenerar com a URL
   real depois do deploy.

## 3. Passo a passo pra amanhã de manhã

### A. Supabase (uns 3 minutos)
1. Crie um projeto em [supabase.com](https://supabase.com) (se ainda não
   tiver).
2. SQL Editor → cole e rode `supabase/migrations/0001_init.sql`.
3. SQL Editor → cole e rode `supabase/seed.sql` (dados de exemplo pra demo).
4. Project Settings → API → copie a **Project URL** e a **anon public key**.
5. No projeto local, copie `.env.example` pra `.env.local` e preencha as
   duas variáveis (a terceira, `NEXT_PUBLIC_SITE_URL`, mexe depois do
   deploy).
6. `npm install && npm run dev` e confira `/` e `/admin` com os 3 pratos de
   exemplo aparecendo.

### B. GitHub — escolha uma opção

**Opção 1 (mais rápida): usar o repo que já está configurado como origin**
```bash
git push -u origin main
```

**Opção 2 (como pedido originalmente): criar `guardou-mvp` separado**
1. Crie o repo em https://github.com/new com o nome `guardou-mvp` (não
   inicialize com README/gitignore, o repo local já tem tudo).
2. Depois:
```bash
git remote set-url origin https://github.com/SEU-USUARIO/guardou-mvp.git
git push -u origin main
```
   (Se tiver o `gh` CLI instalado na sua máquina: `gh repo create
   guardou-mvp --public --source=. --remote=origin --push` faz tudo isso
   de uma vez.)

### C. Deploy na Vercel
1. `npx vercel login` — abre um link, você confirma no navegador.
2. `npx vercel` na raiz do projeto — na primeira vez ele pergunta
   nome do projeto e link do diretório, pode aceitar os defaults (o
   `vercel.json` já fixa framework e comandos de build).
3. No dashboard da Vercel, vá em **Project Settings → Environment
   Variables** e adicione (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → a própria URL que a Vercel vai te dar (ex:
     `https://guardou-mvp.vercel.app`)
4. `npx vercel --prod` pra publicar em produção com as env vars já
   configuradas.
5. Regenere o QR code com a URL final:
   ```bash
   npm run qrcode https://guardou-mvp.vercel.app
   git add public/qrcode-cardapio.png && git commit -m "chore: QR code com URL de produção" && git push
   ```
   (ou simplesmente abra `/qrcode` no site publicado e clique em "Imprimir
   cartaz" — sempre reflete a URL certa, sem precisar regenerar nada)

### D. Teste final antes da apresentação
1. Abra o link de produção no celular, confira os 3 pratos.
2. Reserve o prato "quase esgotado" (Feijoada) até esgotar, confira que o
   botão desabilita e mostra "Esgotado".
3. Abra `/admin` e confira que a reserva aparece na lista.
4. Marque a reserva como concluída.
5. Imprima o cartaz em `/qrcode`.

## 4. Decisões de design/UX que tomei sozinho (pra você revisar)

- **Cores**: laranja/vermelho como cor primária (`orange-600`/`red-600` do
  Tailwind), tons terrosos (`stone-*`) pro texto e fundo neutro — combina
  com comida e é o que você pediu, mas troque se tiver uma identidade
  visual específica da lanchonete.
- **"Marcar esgotado" vs "Desativar" no admin**: separei em duas ações
  porque são coisas diferentes — "esgotado" só trava a quantidade
  (`quantidade_reservada = quantidade_total`, o prato some da home mas
  fica registrado como esgotado), "desativar" tira o prato da lista de
  hoje inteiramente (`ativo = false`, pra quando você cadastrou errado ou
  quer remover mesmo). Achei que um botão só ("desativar") não cobriria os
  dois casos que você descreveu.
- **Telefone exige 11 dígitos** (celular com DDD + 9 dígitos): pode ser
  restritivo demais se algum cliente tiver número fixo de 10 dígitos —
  ajustei pra 11 porque o enunciado pedia "máscara de celular BR"
  especificamente.
- **Atualização em tempo real**: usei Supabase Realtime como principal,
  mas mantive um poll de 15s como rede de segurança (caso a conexão
  websocket caia ou o Realtime não esteja habilitado no projeto por algum
  motivo) — assim a demo não trava mesmo se o Realtime falhar.
- **Placeholders de foto do Unsplash**: escolhi imagens que fazem sentido
  visualmente (frango assado, prato com feijão preto, prato com molho
  cremoso) mas não são fotos reais dos pratos da lanchonete — troque pelas
  fotos de verdade assim que possível, é só reeditar em `supabase/seed.sql`
  ou recadastrar pelo `/admin`.
- **`vercel.json` mínimo**: só fixei framework e comandos de build/install.
  Não coloquei as env vars nele de propósito — variáveis com valores (ainda
  que só a URL pública) não deveriam ir pro Git; ficam no dashboard da
  Vercel.
- **Não copiei o SQL de storage para testar no PGlite**: os testes
  automatizados (seção 1) cobrem só tabelas + RPC, porque `storage.buckets`
  e `storage.objects` são schemas específicos do Supabase que não existem
  num Postgres puro. A parte de Storage (upload de foto) só foi validada
  por revisão de código, não por teste executado.
