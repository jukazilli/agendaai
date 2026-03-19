# Execucao B-10 - Reflexo Financeiro no Dashboard

## 1. Objetivo

Abrir o primeiro corte real de `B-10` sem inventar um modulo financeiro persistido fora do escopo atual.

## 2. Regra de precedencia

- contratos reais de `booking`, `service` e `paymentIntent`;
- shell administrativo ja materializado no `admin-web`;
- leitura honesta: o que puder ser derivado do runtime vira funcional; o que depender de `cash entry`, conciliacao presencial ou cohort continua fora.

## 3. O que foi implementado

No `dashboard` do `admin-web`:

- filtro por periodo (`7 dias`, `30 dias`, `Tudo`);
- receita reconhecida derivada de `booking.status = concluido` + `service.precoBase`;
- entrada online aprovada derivada de `payment intents` aprovadas conciliadas com bookings concluidas;
- ticket medio do periodo;
- taxa de no-show do periodo;
- lista de movimentos reconhecidos com servico, cliente, horario, valor reconhecido e valor online aprovado;
- taxonomia explicita do que ainda continua `(nao funcional)`.

## 4. Como a receita foi reconhecida

Sem criar entidade nova no backend, o shell agora reconhece:

- `receita reconhecida`: soma de `Service.precoBase` para bookings concluidas no periodo;
- `entrada online aprovada`: soma de `PaymentIntent.amount` apenas quando a intent esta `approved` ou `authorized` e ligada a uma booking concluida;
- `ticket medio`: `receita reconhecida / quantidade de bookings concluidas`.

Isso nao substitui um futuro `cash entry` persistido nem um fechamento financeiro formal.

## 5. Evidencia validada

Validacao tecnica:

- `pnpm --filter @agendaai/admin-web lint`
- `pnpm --filter @agendaai/admin-web build`

Smoke funcional:

- `admin-web` local aberto em `http://127.0.0.1:4173/#dashboard` usando o backend publicado em `https://agendaai-eu7w.onrender.com`;
- cards financeiros renderizados com dados reais do tenant demo;
- mutacao real de uma booking confirmada com pagamento aprovado para `concluido`;
- refresh do dashboard refletindo imediatamente:
  - `Receita reconhecida = R$ 285,00`
  - `Entrada online aprovada = R$ 19,50`
  - novo movimento `Corte Rapido / Smoke Webhook Probe` no topo da lista.

## 6. Leitura objetiva do estado

`B-10` deixou de ser `NAO IMPLEMENTADO` e passou a `PARCIAL`.

O produto ja consegue:

- refletir conclusao operacional em receita reconhecida;
- separar receita reconhecida de entrada online aprovada;
- expor um relatorio essencial de agenda/receita por periodo dentro do dashboard.

## 7. O que continua aberto

- `cash entry` persistido;
- caixa presencial;
- conciliacao financeira completa;
- relatorio de clientes sem retorno;
- tela dedicada de relatorios/financeiro separada do dashboard;
- estornos, repasses e saldo consolidado do periodo.

## 8. Conclusao

O proximo gargalo logico deixa de ser "receita inexistente no shell" e passa a ser "relatorio ainda sem camada de clientes sem retorno e sem modelo financeiro persistido". O corte seguinte deve endurecer `BA-11` e preparar a transicao de `B-10` parcial para algo mais proximo de fechamento.
