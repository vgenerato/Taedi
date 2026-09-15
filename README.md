# Taedi

Acompanhamento de dieta: você marca cada refeição do dia, o app fecha o dia
quando nada fica para trás e transforma isso em sequência, níveis e metas do
mês. O plano alimentar pode ser importado direto do **PDF da nutricionista**.

Tudo roda no navegador e os dados ficam no próprio aparelho — não há servidor,
conta ou envio de arquivo para fora.

## O que ele faz

- **Hoje** — linha do tempo das refeições do dia, marcadas item a item ou de uma
  vez. O anel do topo mostra o dia inteiro num relance e a refeição da vez fica
  destacada pelo horário. Dá para voltar dias e registrar depois.
- **Gamificação com critério** — 12 XP por refeição, 50 XP por dia fechado,
  sequência de dias completos, dez níveis com nomes de crescimento (Semente →
  Estação inteira) e nove conquistas. Quando o dia fecha, aparece a comemoração
  com o que foi ganho.
- **Plano** — refeições com nome, horário, dias da semana, itens com quantidade,
  substituições e observações. Dá para pausar uma refeição sem apagá-la.
- **Importar PDF** — o texto do PDF é lido no próprio aparelho, as refeições são
  reconhecidas com horário e quantidade, e você revisa tudo antes de aplicar.
  Se o PDF for uma imagem escaneada, é possível colar o texto do plano.
- **Mês** — calendário em anéis (quanto do dia foi cumprido), dias completos,
  aderência, melhor sequência, metas mensais ajustáveis e a curva de peso.
- **Seus dados** — exportação e importação em JSON, tema claro/escuro/sistema.

## Testando

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # gera dist/
npm run preview    # serve o dist/ — é aqui que o PWA funciona de verdade
npm test           # testes de regras e do leitor de PDF
```

Requer Node 22+ (os testes usam o `node --test` com TypeScript nativo).

Três formas de experimentar, da mais rápida à mais parecida com o uso real:

1. **No computador** — `npm run dev`. Serve para mexer no plano, marcar
   refeições e importar um PDF.
2. **No celular, pela rede local** — `npm run dev -- --host` e abra no telefone
   o endereço `Network:` que aparece no terminal (mesmo Wi‑Fi). O app funciona,
   mas instalar na tela de início e o modo offline exigem HTTPS.
3. **Publicado** — o caminho de verdade: uma URL HTTPS, o app instalado na tela
   de início e funcionando sem internet. Veja abaixo.

## Instalar como app (PWA)

O app é um PWA completo: service worker com todos os arquivos em cache
(inclusive o leitor de PDF, que continua funcionando sem rede), ícones,
tela cheia sem barra de navegador e atualização automática quando uma
versão nova é publicada.

- **Android / Chrome / Edge** — abra a URL e toque em *Instalar*, ou use o
  botão **Instalar no aparelho** em Progresso → Ajustes.
- **iPhone / Safari** — Compartilhar → *Adicionar à Tela de Início*.
- **Desktop** — ícone de instalar na barra de endereços.

Depois de instalado, ele abre offline e mantém tudo o que já foi registrado.

## Publicando na Vercel

O repositório já traz `vercel.json` (build, fallback de rota e cache correto
para o service worker). Pelo site: *Add New → Project*, importe este
repositório e clique em Deploy — a detecção de Vite faz o resto. Pelo
terminal:

```bash
npx vercel          # pré-visualização
npx vercel --prod   # produção
```

Qualquer hospedagem de site estático serve (Netlify, Cloudflare Pages, GitHub
Pages); o requisito é HTTPS, que todas oferecem.

## E o Supabase?

Hoje não é necessário: o app é local-first e guarda tudo no aparelho, o que o
deixa rápido, offline e sem nenhum dado de saúde saindo do seu celular. O
backup é o botão de exportar em Progresso → Ajustes.

O Supabase passa a valer a pena quando você quiser **os mesmos registros em
mais de um aparelho** (celular e computador), histórico protegido contra
perder o telefone, ou compartilhar o acompanhamento com a nutricionista.
Nesse caso entram conta de acesso, tabelas para plano, registros e metas com
RLS por usuário e uma sincronização que respeite o modo offline. É uma camada
por cima do que já existe — as regras em `src/lib` não mudam.

## Como o plano é lido do PDF

`src/lib/pdf.ts` extrai os fragmentos de texto do PDF com `pdfjs-dist` e os
reagrupa por linha usando as coordenadas da página. `src/lib/parsePlan.ts`
aplica as heurísticas do formato brasileiro:

- abre uma refeição em nomes conhecidos (café da manhã, colação, almoço,
  pré-treino, ceia…), em "Refeição 3" ou numa linha curta iniciada por horário;
- entende horários escritos como `7h`, `07:00`, `12h30`;
- separa quantidade de alimento (`120 g de frango` → `120 g` + `Frango`), nos
  dois sentidos (`Arroz integral 4 colheres de sopa` também funciona);
- trata linhas iniciadas por "ou" como substituição do item anterior e "Obs:"
  como observação da refeição;
- descarta cabeçalho, rodapé, número de página, CRN, e-mail e site.

O resultado nunca é aplicado direto: a tela de revisão mostra cada refeição
reconhecida, permite desmarcar o que não serve, escolher entre substituir ou
somar ao plano atual e ainda editar o texto extraído para reanalisar.

## Como as contas são feitas

Nada de contador incremental que desanda: **todo progresso é derivado dos
registros** (`src/lib/selectors.ts` e `src/lib/progress.ts`). Apagar uma
refeição de ontem recalcula sequência, XP e aderência na hora.

- **Dia completo** = todas as refeições previstas para aquela data marcadas como
  concluídas. Refeição com apenas alguns itens marcados fica em `partial` e não
  conta.
- **Sequência** = dias completos consecutivos. O dia de hoje, ainda em aberto,
  não interrompe a contagem.
- **Aderência do mês** = refeições concluídas ÷ previstas, contando só a partir
  do seu primeiro registro — quem começa no dia 20 não carrega o mês inteiro.
- **Histórico** = cada dia guarda quais refeições valiam nele. Mudar o plano
  hoje não reescreve o passado.

## Estrutura

```
src/
  lib/          regras puras: datas, plano, registros, progresso, leitura de PDF
  components/   anel, cartão de refeição, folhas (modais), gráfico, comemoração
  screens/      Hoje, Plano, Mês, Progresso
  styles/       tokens → base → componentes → estrutura → telas
tests/          regras de contagem e leitor de plano
```

## Design

Papel quente, tinta escura e um verde de folha como único acento; serifada
(Fraunces) para títulos e números, grotesca (Inter Tight) para interface. O
anel é o vocabulário que se repete: um dia é um círculo dividido em refeições,
um mês é uma grade de círculos. Tokens em `src/styles/tokens.css` — cor,
espaço, raio, sombra e movimento saem todos de lá, inclusive o modo escuro.
