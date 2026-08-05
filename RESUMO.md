# Resumo — Guardou MVP pronto para demo

Atualizado em 2026-08-04, à noite — deploy de produção finalizado.

## 🚀 URL de produção

**https://guardou.vercel.app**

Confirmado no ar: `/`, `/admin` e `/qrcode` respondem HTTP 200 e carregam
dados reais do seu projeto Supabase (o card "Frango grelhado, arroz, feijão
e salada" já aparece renderizado no HTML retornado pela Vercel).

## 1. Status de cada etapa do deploy

| Etapa | Status |
|---|---|
| Git commitado e limpo | ✅ |
| Push pro GitHub (`miguelmoraes-tech/Guardou`, branch `main`) | ✅ |
| Projeto Vercel linkado (`.vercel/project.json`) | ✅ |
| Deploy de produção | ✅ `https://guardou.vercel.app` |
| Variáveis de ambiente na Vercel | ✅ (você já tinha adicionado as duas do Supabase; eu adicionei a terceira, ver nota abaixo) |
| QR code apontando pra URL final | ✅ `public/qrcode-cardapio.png` e `/qrcode` |
| Teste HTTP de produção | ✅ sem erro de env var, HTML esperado |
| Teste manual no celular | ⏳ **precisa de você**, veja seção 4 |

### O que eu fiz nesta rodada

1. **Verifiquei o estado do git**: working tree limpo, `origin` já apontava
   pro repo `miguelmoraes-tech/Guardou` (confirmei que ele existe e está
   acessível com `git ls-remote`, mesmo vazio).
2. **Não havia projeto Vercel linkado localmente** (`.vercel/project.json`
   não existia), mas a Vercel CLI já estava autenticada (você deve ter
   completado o login que eu tinha deixado pendente) e já existia um
   projeto chamado `guardou` no seu dashboard (criado ~3 min antes, sem
   deploy ainda — provavelmente quando você foi adicionar as env vars). Eu
   linkei o diretório local a esse projeto existente com `vercel link
   --yes --project guardou`, sem criar um projeto novo.
3. **Dei `git push -u origin main`** — 8 commits organizados foram pro
   GitHub.
4. **O push já disparou o deploy sozinho** (o projeto Vercel estava
   conectado ao repositório do GitHub) — por isso eu **não** rodei `vercel
   --prod` na primeira vez, só acompanhei com `vercel inspect --wait` até
   o status ficar `Ready`.
5. **Testei as 3 rotas com curl** contra `https://guardou.vercel.app` —
   todas 200, HTML sem mensagem de erro, e a home já mostrando prato real
   do seu banco.
6. **Achei um problema**: `NEXT_PUBLIC_SITE_URL` não estava configurada na
   Vercel (você tinha adicionado só as duas do Supabase, como avisado), então
   a página `/qrcode` estava gerando o QR apontando pra `localhost:3000` em
   produção. Corrigi adicionando a variável via `vercel env add
   NEXT_PUBLIC_SITE_URL production --value "https://guardou.vercel.app"`.
7. Como variáveis `NEXT_PUBLIC_*` são embutidas no HTML/JS **no momento do
   build**, só adicionar a env var não mudava o que já estava no ar — rodei
   **um segundo deploy** (`vercel --prod`) pra rebuildar com o valor certo.
   Esse é o único `vercel --prod` manual que rodei, e foi necessário (não
   duplicou nada — confirmei com `vercel ls` que ficaram só os deploys
   esperados, todos `Ready`).
8. Confirmei via curl que `/qrcode` em produção agora contém
   `guardou.vercel.app`, não mais `localhost`.
9. Regenerei `public/qrcode-cardapio.png` localmente com
   `npm run qrcode https://guardou.vercel.app`, commitei e dei push — isso
   disparou um 3º deploy automático (esperado, é só a atualização do PNG).
   Confirmei que o PNG novo responde 200 em produção.

## 2. O que ainda depende de você

- **Testar no celular de verdade** (a rede/HTTPS/câmera pra ler QR code só
  dá pra confirmar num aparelho físico) — passo a passo na seção 4.
- Os 3 pratos de exemplo em produção são os do `supabase/seed.sql` — se
  você já rodou esse script no seu projeto Supabase, ótimo; se editou os
  dados manualmente pelo `/admin`, é isso que vai aparecer na demo (confira
  se está do jeito que você quer antes da apresentação).
- Se quiser trocar as fotos placeholder do Unsplash por fotos reais dos
  pratos, use o `/admin` pra recadastrar ou editar direto no Supabase.

## 3. Testes que rodei antes deste deploy (sessão anterior, ainda válidos)

Sem Docker/Supabase local disponível neste ambiente, validei a lógica mais
crítica (a função `reservar_prato`) rodando o schema inteiro contra um
Postgres real via PGlite (WASM, não ficou como dependência do projeto):
reservar até esgotar (sem race condition, graças ao `FOR UPDATE`), rejeição
de prato esgotado/inexistente/desativado/tipo de entrega inválido, e
confirmação de que chamadas rejeitadas não deixam registro parcial. Detalhes
e mais contexto de UI (spinners, validação, guarda contra duplo clique)
seguem valendo — não mudou nada nessa área nesta rodada.

## 4. Passo a passo pra você testar no celular

1. Abra **https://guardou.vercel.app** no celular (ou escaneie o QR em
   `/qrcode` no computador, ou imprima `public/qrcode-cardapio.png`).
2. Confira se os pratos aparecem certinho: foto, nome, preço, "restantes"
   ou "Esgotado".
3. Toque em "Reservar" num prato disponível → preencha nome, celular
   (a máscara `(11) 91234-5678` deve aparecer sozinha conforme digita),
   escolha "Retirar" ou "Comer no local", escolha um horário entre 11h e
   14h → "Confirmar reserva".
4. Confira a tela de confirmação: "Reserva feita! Pegue às [horário] —
   apresente seu nome no balcão."
5. Em outra aba/dispositivo, abra **https://guardou.vercel.app/admin** e
   confira que a reserva apareceu na lista "Reservas de hoje", com o
   telefone certo.
6. Volte pra `/` (pode ser a mesma aba do celular, sem recarregar) e
   confira que o número de "restantes" no card diminuiu sozinho (Realtime).
7. No admin, clique em "Marcar concluída" na reserva.
8. Tente reservar um prato que já está "Esgotado" — o botão deve estar
   desabilitado e não deixar nem abrir o formulário.

## 5. Decisões de design/UX tomadas sozinho (revisão pendente sua)

- **Cores**: laranja/vermelho (`orange-600`/`red-600`) + tons terrosos
  (`stone-*`) — troque se a lanchonete tiver identidade visual própria.
- **"Marcar esgotado" vs "Desativar" no admin**: são ações separadas —
  "esgotado" só trava a quantidade, "desativar" tira o prato da lista do
  dia inteiramente.
- **Telefone exige 11 dígitos** (celular com DDD): pode recusar número fixo
  de 10 dígitos, escolhi assim porque o pedido original especificava
  "máscara de celular BR".
- **Realtime + poll de 15s como fallback**: se o Realtime cair por algum
  motivo na hora da demo, a lista ainda atualiza sozinha em até 15s.
- **Fotos placeholder do Unsplash**: escolhidas por semelhança visual, não
  são fotos reais dos pratos da lanchonete.
- **`NEXT_PUBLIC_SITE_URL` adicionada por mim direto na Vercel**: é uma
  variável pública (não é segredo — vai parar no HTML mesmo), então achei
  seguro adicionar sozinho pra destravar o QR code sem precisar te
  interromper. As duas variáveis do Supabase eu não mexi, ficaram como você
  configurou.
