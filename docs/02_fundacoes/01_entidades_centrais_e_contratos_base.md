# Entidades Centrais e Contratos Base

## 1. Entidades centrais

| Entidade | Papel | Campos minimos |
| --- | --- | --- |
| Tenant | unidade de isolamento do negocio | id, slug, nome, status, timezone |
| AdminUser | operador autenticado | id, tenantId, nome, email, role, status |
| Client | cliente final | id, tenantId, nome, telefone, email, origem |
| Professional | executor do servico | id, tenantId, nome, status, especialidades |
| Service | item agendavel com regra comercial | id, tenantId, nome, duracaoMin, precoBase, exigeSinal, paymentPolicy |
| Catalog | agrupador comercial de servicos, produtos, kits e combos | id, tenantId, nome, status |
| AvailabilityRule | regra recorrente de agenda | id, tenantId, professionalId, weekday, faixa |
| Booking | reserva do horario | id, tenantId, clientId, serviceId, professionalId, status, startAt, endAt |
| TenantPaymentSettings | configuracao tenant-level de pagamento | tenantId, provider, checkoutMode, publicKey, accessToken, notificationUrl, backUrls, status |
| PaymentIntent | sinal ou pagamento associado | id, bookingId, provider, checkoutMode, externalReference, amount, status |
| CashEntry | reflexo financeiro | id, tenantId, tipo, origem, valor, status |
| Campaign | acao de relacionamento | id, tenantId, nome, segmento, canal, status |
| NotificationEvent | mensagem operacional | id, tenantId, tipo, canal, status, payload |

## 2. Contratos base de dominio

- `CreateTenant`
- `ConfigureTenantSlug`
- `CreateService`
- `CreateProfessional`
- `SetAvailability`
- `CreateBooking`
- `UpsertTenantPaymentSettings`
- `ConfirmBookingPayment`
- `MarkBookingCompleted`
- `CreateCashEntry`
- `DispatchReminder`

## 3. Regras base

- nenhum dado transacional existe sem `tenantId`;
- slug precisa ser unica;
- booking nao pode ser confirmado em horario indisponivel;
- configuracao do provider vive na visao administrativa;
- politica de cobranca por item comercial vive na configuracao de catalogo;
- atendimento concluido e o gatilho minimo para receita operacional;
- notificacoes devem ser idempotentes.

## 4. Contratos entre camadas

- `api-rest` expone comandos e consultas simples;
- `graphql-bff` compoe visoes de leitura densas;
- `packages/contracts` guarda schemas versionados;
- eventos assicronos conectam booking, notificacao e financeiro.
