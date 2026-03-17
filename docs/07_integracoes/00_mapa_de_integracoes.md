# Mapa de Integracoes

## Integracoes externas planejadas

| Integracao | Objetivo | Direcao | Fase | Observacao |
| --- | --- | --- | --- | --- |
| Provedor de pagamento | sinal e confirmacao de reserva | bidirecional | MVP | provider ainda pendente |
| WhatsApp/SMS | confirmacoes e lembretes | saida | MVP | provider ainda pendente |
| E-mail transacional | onboarding e comprovantes | saida | MVP | simples e desacoplado |
| Google Calendar | sincronizar compromissos | bidirecional controlada | Pos-MVP inicial | comecar com sync unidirecional se necessario |
| GraphQL BFF | leitura agregada | interna | Fase 2 | nao bloquear MVP transacional |
| Analytics Python | cohorts e score | interna | Fase 2 | sem entrar no caminho critico |

## Eventos internos recomendados

- `tenant.created`
- `service.created`
- `availability.updated`
- `booking.created`
- `booking.payment_confirmed`
- `booking.confirmed`
- `booking.completed`
- `cash_entry.created`
- `campaign.dispatched`
- `notification.sent`

## Regras

- providers externos entram por adaptadores;
- payloads precisam carregar `tenantId`;
- eventos criticos precisam ser idempotentes;
- falha em notificacao nao pode corromper booking transacional.
