# Execucao B-08/B-09 - Visibilidade de Pagamentos no Admin

## 1. Objetivo

Fechar uma lacuna operacional entre o runtime de pagamento ja existente e o shell administrativo: o owner precisava enxergar o estado dos `payment intents` e conseguir acionar uma nova sincronizacao sem depender apenas do retorno do cliente na pagina publica.

## 2. Regra de precedencia usada

- codigo real do `api-rest` e do `booking-web` foi tratado como fonte primaria para o estado atual da integracao;
- `docs/07_integracoes/01_mercado_pago_checkout_modelo_inicial.md` e `docs/08_analises/14_execucao_b08_checkout_pro_publico.md` foram usadas para validar o que ja estava prometido documentalmente;
- conclusao: o runtime de `payment intent`, `sync` e webhook existia, mas o `admin-web` ainda nao tinha leitura nem acao sobre essa camada.

## 3. O que entrou neste corte

### Backend

- `services/api-rest/src/store.ts`
  - novo `listPaymentIntents(tenantId)`.

- `services/api-rest/src/postgres-store.ts`
  - delegacao da listagem de `payment intents`.

- `services/api-rest/src/app.ts`
  - `GET /v1/admin/payment-intents`
  - `POST /v1/admin/payment-intents/:paymentIntentId/sync`
  - reaproveitamento da reconciliacao existente por tenant autenticado.

### Frontend admin

- `apps/admin-web/src/lib/admin-api.ts`
  - bootstrap agora traz `paymentIntents`;
  - cliente admin ganhou `syncPaymentIntent`.

- `apps/admin-web/src/App.tsx`
  - agenda administrativa agora mostra status de pagamento por booking;
  - bookings em `aguardando pagamento` passaram a expor estado da `payment intent`;
  - shell ganhou acao manual de `Atualizar pagamento`.

## 4. Ganho real desta rodada

- o owner deixa de operar no escuro quando existe booking preso em `aguardando pagamento`;
- o admin passa a ter uma leitura autenticada do pipeline de pagamento;
- a homologacao real do Mercado Pago fica menos arriscada porque agora existe superficie administrativa para observar o que aconteceu.

## 5. O que continua faltando

- credenciais reais de homologacao do Mercado Pago;
- `notification_url` publica realmente acessivel pelo provider;
- `checkout_transparente`;
- observabilidade mais rica de webhook e tentativas.

## 6. Validacao

- `pnpm --filter @agendaai/api-rest test`
- `pnpm --filter @agendaai/admin-web lint`
- `pnpm --filter @agendaai/admin-web build`

Todos passaram em `19/03/2026`.
