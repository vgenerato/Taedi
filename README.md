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

## Rodando

```bash
npm install
npm run dev        # ambiente de desenvolvimento
npm run build      # gera dist/
npm run preview    # serve o dist/
npm test           # testes de regras e do leitor de PDF
```

Requer Node 22+ (os testes usam o `node --test` com TypeScript nativo).

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
