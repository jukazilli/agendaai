# Mapa de Integracoes

## Integracoes externas planejadas

| Integracao | Objetivo | Direcao | Fase | Observacao |
| --- | --- | --- | --- | --- |
| Mercado Pago | sinal e pagamento antecipado via Checkout Pro ou Checkout Transparente | bidirecional | MVP | provider inicial adotado para a fundacao de `B-08`; falta chamada real e webhook |
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
- `payment.intent_created`
- `payment.notification_received`
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
- configuracao do provider entra pela visao administrativa e pela trilha de implantacao;
- falha em notificacao nao pode corromper booking transacional.
