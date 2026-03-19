# Execucao B-08 - Checkout Pro no Booking Publico

## 1. Objetivo

Fechar o menor corte funcional de pagamento online no `AgendaAI`, ligando o `booking-web` ao runtime real de `payment intent`, `sync` e webhook que ja existia no `api-rest`.

## 2. Leitura corrigida do estado

Ao revisar o codigo real, ficou evidente uma divergencia documental:

- o `api-rest` ja possuia rotas publicas de `payment-intents`, reconciliacao por `sync` e webhook Mercado Pago;
- o gargalo real estava no `booking-web`, que ainda bloqueava qualquer servico com sinal.

## 3. O que entrou nesta rodada

- branch do submit publico entre:
  - booking imediato para servicos sem sinal;
  - criacao de `payment intent` para servicos com sinal;
- proxies Next para:
  - `POST /api/public/tenants/[slug]/payment-intents`
  - `POST /api/public/tenants/[slug]/payment-intents/[paymentIntentId]/sync`
- redirecionamento para `initPoint` do Checkout Pro;
- retorno do Mercado Pago tratado na propria pagina do slug;
- sincronizacao de status via `paymentIntentId` e `payment_id`;
- estados de `aguardando pagamento`, `aprovado` e `falha` no frontend publico.

## 4. Arquivos tocados

- `apps/booking-web/app/[slug]/booking-flow.tsx`
- `apps/booking-web/app/api/public/tenants/[slug]/payment-intents/route.ts`
- `apps/booking-web/app/api/public/tenants/[slug]/payment-intents/[paymentIntentId]/sync/route.ts`
- `apps/booking-web/app/globals.css`
- `apps/booking-web/lib/public-api.ts`

## 5. O que continua pendente

- homologacao real com credenciais validas do Mercado Pago;
- suporte publico a `checkout_transparente`;
- endurecimento de expiracao/limpeza de slots presos em `aguardando pagamento`;
- reflexo financeiro do atendimento concluido em `B-10`.

## 6. Validacao

- `pnpm --filter @agendaai/booking-web lint`
- `pnpm --filter @agendaai/booking-web build`
- `pnpm lint`
- `pnpm build`
- `pnpm --filter @agendaai/api-rest test`

## 7. Observacao de risco

Sem credenciais reais do Mercado Pago nesta rodada, o fechamento foi validado por build, testes automatizados e contratos reais do backend, mas nao por smoke end-to-end em ambiente externo do provider.
