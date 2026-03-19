# Mercado Pago - Modelo Inicial de Integracao

## 1. Objetivo

Registrar o modelo inicial de integracao do `AgendaAI` com Mercado Pago para `B-08`, cobrindo:

- configuracao tenant-level na visao administrativa;
- politica de cobranca por item comercial;
- campos minimos para Checkout Pro e Checkout Transparente;
- base documental para `payment intent` e webhook.

## 2. Fontes oficiais consultadas

- Checkout Pro - Preferences API:
  `https://www.mercadopago.com.br/developers/pt/reference/preferences/_checkout_preferences/post`
- Checkout API / Checkout Transparente - Payments API:
  `https://www.mercadopago.com.br/developers/pt/reference/payments/_payments/post`
- Webhooks:
  `https://www.mercadopago.com.br/developers/pt/guides/notifications/webhooks`

## 3. Leitura objetiva das docs oficiais

Campos e decisoes que impactam diretamente o modelo do `AgendaAI`:

- Checkout Pro depende de uma preferencia com `items`, `external_reference`, `notification_url`, `back_urls`, `auto_return` e `binary_mode`.
- Checkout Transparente depende da criacao de `payments` com `transaction_amount`, `token`, `installments`, `payment_method_id`, `payer`, `notification_url` e idempotencia.
- Ambos os modos precisam de correlacao interna via `external_reference` e retorno assicrono por webhook.
- A configuracao do provider e do modo de checkout e administrativa, nao publica.

## 4. Decisao estrutural para o AgendaAI

Tenant-level:

- `TenantPaymentSettings` guarda a conexao Mercado Pago do negocio.
- Essa configuracao pertence a implantacao e a `app` administrativa.

Item comercial:

- `ServicePaymentPolicy` governa se o item fecha sem cobranca, com sinal ou com pagamento integral.
- O mesmo conceito deve aparecer futuramente na configuracao de produtos, servicos, kits e combos.

Transacao:

- `PaymentIntent` representa a tentativa concreta de cobranca vinculada a uma `Booking`.
- `PaymentWebhookNotification` representa o payload minimo necessario para reconciliacao.

## 5. Campos minimos adotados

`TenantPaymentSettings`:

- `provider`
- `status`
- `checkoutMode`
- `publicKey`
- `accessToken`
- `notificationUrl`
- `backUrls`
- `autoReturn`
- `binaryMode`
- `defaultInstallments`
- `expirationMinutes`
- `statementDescriptor`

`ServicePaymentPolicy`:

- `collectionMode`
- `provider`
- `checkoutMode`
- `chargeType`
- `fixedAmount`
- `percentage`
- `currencyId`
- `acceptedMethods`
- `maxInstallments`
- `capture`
- `expirationMinutes`

`PaymentIntent`:

- `provider`
- `checkoutMode`
- `externalReference`
- `amount`
- `currencyId`
- `status`
- `paymentId`
- `preferenceId`
- `initPoint`
- `sandboxInitPoint`
- `notificationUrl`

## 6. Regras de produto travadas nesta rodada

- a visao publica do cliente nao configura provider;
- a visao administrativa configura provider e politica de cobranca;
- `service.exigeSinal` continua como flag de compatibilidade, mas a direcao passa a ser `paymentPolicy`;
- `B-08` nao fecha sem webhook e reconciliacao basica;
- `B-09` nao deve assumir pagamento funcionando sem `payment intent` conciliada.
