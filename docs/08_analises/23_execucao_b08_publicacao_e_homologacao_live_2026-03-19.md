# Execucao B-08 - Publicacao e Homologacao Live

## 1. Objetivo

Registrar a virada de ambiente local para ambiente publicado do `AgendaAI` e validar o primeiro smoke real de `Checkout Pro` nas URLs web de producao.

## 2. URLs publicadas

- `api-rest`: `https://agendaai-eu7w.onrender.com`
- `booking-web`: `https://agendaai-booking-web.vercel.app`
- `admin-web`: `https://agendaai-admin-web.vercel.app`

## 3. O que foi executado

### Configuracao do tenant demo no ambiente publicado

Foi ativado `Mercado Pago` no tenant `demo-studio-20260317` ja no runtime hospedado, com:

- `status`: `active`
- `checkoutMode`: `checkout_pro`
- `notificationUrl`: `https://agendaai-eu7w.onrender.com/v1/webhooks/mercado-pago`
- `backUrls.success`: `https://agendaai-booking-web.vercel.app/demo-studio-20260317`
- `backUrls.pending`: `https://agendaai-booking-web.vercel.app/demo-studio-20260317`
- `backUrls.failure`: `https://agendaai-booking-web.vercel.app/demo-studio-20260317`
- `binaryMode`: `true`
- `defaultInstallments`: `1`
- `expirationMinutes`: `30`

### Validacao HTTP do ambiente web

Foram validadas as seguintes respostas:

- `GET /health` no backend publicado com `status: ok`
- `GET /v1/public/tenants/demo-studio-20260317` no backend publicado
- `booking-web` publicado respondendo em `200`
- `admin-web` publicado respondendo em `200`

### Smoke real do checkout publicado

Foi criada `payment intent` real no ambiente publicado para o servico `Corte Rapido`, com:

- `booking.status`: `aguardando pagamento`
- `paymentIntent.status`: `pending`
- `paymentIntent.preferenceId` real do Mercado Pago
- `paymentIntent.initPoint` real do Checkout Pro

Depois disso, o `booking-web` publicado foi navegado em viewport mobile e o botao `Pagar sinal` redirecionou para a URL real do Mercado Pago:

- `https://www.mercadopago.com.br/checkout/v1/payment/redirect/?preference-id=...`

## 4. Leitura objetiva do estado

O bloqueio de infraestrutura publica foi removido.

O `AgendaAI` agora ja possui:

- backend publicado;
- booking publico publicado;
- admin web publicado;
- `notification_url` publica real;
- `back_urls` publicas reais;
- criacao real de `payment intent` no ambiente hospedado;
- redirecionamento real ao `Checkout Pro` no navegador.

## 5. O que continua aberto

- aprovacao real de pagamento e retorno completo ao slug;
- recebimento de webhook real com conciliacao automatica ponta a ponta;
- suporte a `checkout_transparente`;
- endurecimento de `B-09` com calendario mais rico e reagendamento.

## 6. Evidencia operacional desta rodada

- `paymentSettings.status`: `active`
- `paymentSettings.checkoutMode`: `checkout_pro`
- `paymentIntents` do tenant demo: `3`
- ultimo `paymentIntent.status`: `pending`
- ultimo `paymentIntent.preferenceId`: presente
- `bookings` do tenant demo: `13`
- ultimo `booking.status`: `aguardando pagamento`
- `clients` do tenant demo: `6`

## 7. Conclusao

`B-08` continua `PARCIAL` no backlog estrutural porque a homologacao ainda nao fechou o ciclo `approved + webhook + retorno + sync final`.

No backlog beta, a criacao real de `payment intent` com provider hospedado ja pode ser tratada como entregue. A proxima trava operacional agora e homologar aprovacao real e, em seguida, seguir para calendario/reagendamento do `admin-web`.
