# Execucao B-08 - Homologacao Parcial do Mercado Pago

## 1. Objetivo

Validar as credenciais reais de homologacao do Mercado Pago no runtime do `AgendaAI`, mesmo sem `notification_url` publica disponivel nesta etapa.

## 2. O que foi validado

- `TenantPaymentSettings` do tenant demo foram ativadas localmente com `checkout_pro`;
- a politica comercial do servico `Corte Rapido` foi ajustada para `deposit`;
- o `api-rest` criou uma `payment intent` real e recebeu do Mercado Pago:
  - `preferenceId` real;
  - `initPoint` real de Checkout Pro;
  - estado inicial `pending`.

## 3. Restricao encontrada

Na maquina local, o runtime Node encontrou `SELF_SIGNED_CERT_IN_CHAIN` ao falar com `api.mercadopago.com`.

Para nao afrouxar o projeto por padrao, o bypass ficou atras de flag explicita:

- `AGENDAAI_INSECURE_MP_TLS=1`

Essa flag existe apenas para destravar homologacao local em ambiente com inspecao TLS corporativa. Sem a flag, o comportamento continua estrito.

## 4. O que nao foi fechado ainda

- `notification_url` publica HTTPS apontando para o `AgendaAI`;
- `back_urls` HTTPS reais voltando para o `booking-web`;
- smoke completo de retorno ao slug;
- webhook real chegando no runtime;
- conciliacao automatica ponta a ponta sem URL provisoria.

## 5. Leitura objetiva do estado

O `AgendaAI` ja passou da fase de "credencial nao validada". A lacuna remanescente agora e de infraestrutura publica para callback e retorno do Checkout Pro, nao mais de autenticacao com o provider.

## 6. Validacao executada

- `pnpm --filter @agendaai/api-rest test`
- `pnpm --filter @agendaai/api-rest lint`
- `pnpm --filter @agendaai/api-rest build`
- criacao real de `payment intent` no tenant demo com retorno de `preferenceId` e `initPoint`

Tudo validado em `19/03/2026`.
