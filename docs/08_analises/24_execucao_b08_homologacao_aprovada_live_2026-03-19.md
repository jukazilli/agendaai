# Execucao B-08 - Homologacao Aprovada Live

## 1. Objetivo

Fechar a homologacao real do `Checkout Pro` no ambiente publicado, saindo de `payment intent criada` para `pagamento aprovado com booking confirmado`.

## 2. Precedencia usada

- codigo real do `api-rest` e do `booking-web` como fonte principal de verdade;
- ambiente publicado como prova operacional;
- documentacao oficial do Mercado Pago como apoio para a estrategia de teste com conta compradora de teste.

## 3. O que foi executado

### Primeira tentativa

Foi tentada a compra sem conta Mercado Pago, usando:

- cartao de teste `Mastercard`
- nome do titular `APRO`
- CPF `12345678909`

O provider retornou erro generico e nao concluiu a aprovacao.

### Segunda tentativa

Foi seguida a estrategia correta com conta compradora de teste:

- usuario comprador: `TESTUSER2668930937191496716`
- senha: credencial de teste fornecida pelo usuario
- codigo de verificacao por e-mail: credencial de teste fornecida pelo usuario
- meio de pagamento usado: saldo da conta compradora de teste

## 4. Evidencia operacional validada

### Fluxo no provider

O Mercado Pago retornou:

- pagina `Pronto! Seu pagamento ja foi aprovado`
- `Operacao #150326602931` na primeira aprovacao real

Depois, em uma segunda rodada de sonda, foi observada outra aprovacao:

- `paymentId`: `150326751763`

### Retorno publico ao AgendaAI

O `booking-web` publicado retornou para:

- `status=approved`
- `collection_status=approved`
- `payment_id` presente

E exibiu as mensagens:

- `reserva confirmada` para a primeira aprovacao
- `pagamento aprovado` na segunda rodada validada

### Estado administrativo do tenant

Leitura real do backend publicado depois da aprovacao:

- `paymentIntentId`: `213a2798-480b-41b0-8019-eeca379ecdc0`
- `paymentIntent.status`: `approved`
- `paymentId`: `150326602931`
- `bookingId`: `afea81f1-07d9-4723-85ec-9ca53debe880`
- `booking.status`: `confirmado`

Na rodada de sonda, poucos segundos apos validar o desafio do provider e antes da releitura publica final, o backend ja retornava:

- `paymentIntent.status = approved`
- `paymentId` preenchido

Leitura objetiva: ha evidencia forte de callback do provider atualizando o runtime publicado sem depender apenas da navegacao manual no slug.

## 5. Leitura objetiva do estado

O `AgendaAI` ja validou em ambiente publicado:

- configuracao admin de `Mercado Pago`;
- criacao real de `payment intent`;
- redirecionamento real ao `Checkout Pro`;
- autenticacao com conta compradora de teste;
- aprovacao real de pagamento em homologacao;
- retorno ao `booking-web` com query params reais do provider;
- `payment intent` aprovada no backend;
- `booking` confirmada no backend.

## 6. O que continua aberto

- suporte a `checkout_transparente`;
- endurecimento de mensagens e observabilidade do webhook;
- calendario mais rico e reagendamento em `B-09`;
- abertura de `B-10` para reflexo financeiro e relatorios.

## 7. Conclusao

No backlog beta, `BA-08` pode ser considerado fechado.

No backlog estrutural, `B-08` deixa de ser gargalo operacional do beta via `checkout_pro`. Ele ainda permanece parcial apenas se o projeto continuar tratando `checkout_transparente` como parte do mesmo corte estrutural; fora isso, o caminho real de sinal/pagamento ja foi homologado ponta a ponta.
