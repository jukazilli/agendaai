# Backlog Estruturado por Dependencia

Este backlog continua sendo a linha estrutural de `development`.

O corte derivado de `beta teste` para o `AgendaAI` esta em:

- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`

## Trilha A - Fundacao de plataforma

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | B-01 | Inicializar monorepo e manifests | nenhuma | FECHADO | apps, services e packages buildando localmente | workspace funcional |
| 2 | B-02 | Definir ADR de auth, tenancy e slug | B-01 | FECHADO | ADR aprovada e refletida em contracts | ADR publicada |
| 3 | B-03 | Materializar tokens e base do design system | B-01 | FECHADO | `packages/ui` com tokens e foundations | package publicado localmente |
| 4 | B-04 | Criar package de contracts e schemas base | B-02 | FECHADO | schemas de tenant, client, service e booking | validacao compartilhada em `packages/contracts` |

## Trilha B - Dominio core

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 5 | B-05 | Implementar `api-rest` com tenancy | B-02, B-04 | FECHADO | auth, tenant context e CRUD base funcionando | runtime em `services/api-rest` com endpoints e testes |
| 6 | B-06 | Implementar catalogo, equipe e disponibilidade | B-05 | FECHADO | servicos, profissionais e horarios operando | fluxos API, slots e persistencia em memoria com testes |
| 7 | B-07 | Implementar booking publico | B-03, B-05, B-06 | FECHADO | jornada publica fecha sem sinal obrigatorio | UI funcional, smoke mobile e testes |
| 8 | B-08 | Integrar opcao de sinal/pagamento e configuracao admin | B-07 | PARCIAL | checkout pro com sinal retornando ao booking, reconciliacao basica e configuracao administrativa de cobranca ativa | config admin, payment intent, sync, webhook, listagem autenticada de `payment intents`, sync manual, conciliacao por `externalReference`, credenciais reais validadas, `notification_url` e `back_urls` publicas, deploy web ativo, aprovacao real homologada com conta compradora de teste, retorno ao slug e `booking` confirmada; permanece parcial apenas por `checkout_transparente` e endurecimento final de observabilidade |

## Trilha C - Operacao e receita

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | B-09 | Implementar agenda e dashboard operacional | B-06, B-07 | FECHADO | agenda do dia consulta bookings reais e permite confirmar, concluir, cancelar e reagendar no shell admin com navegacao clara entre dashboard e operacao | shell modular com dashboard, agenda, catalogo, profissionais, clientes e configuracoes materializado; agenda agora expoe estado de `payment intent`, sync manual, conciliacao sem `paymentId` previamente salvo, timeline diaria por data, reagendamento por slot real, grade semanal de capacidade por profissional e calendario mensal navegavel |
| 10 | B-10 | Confirmar execucao e reconhecer receita | B-09 | FECHADO | atendimento concluido gera reflexo financeiro | `cash entry` minima agora persiste receita reconhecida por `booking` concluida e entrada online aprovada, refletindo no `api-rest`, no bootstrap do `admin-web` e nos paines gerenciais |
| 11 | B-11 | Implementar carteira basica de clientes | B-07, B-10 | FECHADO | cliente exibe historico e ultima visita | `admin-web` agora entrega carteira com ultima visita, historico recente, segmento de retorno, receita persistida minima e movimentos financeiros por cliente |
| 12 | B-12 | Implementar relatorios essenciais | B-10, B-11 | FECHADO | agenda, receita e retorno com filtros basicos | `admin-web` possui rota dedicada de `relatorios` ligada a `GET /v1/admin/read-models/reports`, com periodo, servico, profissional, comparativo, buckets de retorno, recorrencia basica e leitura financeira apoiada por `cash entries` |

## Trilha D - Integracoes e endurecimento

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | B-13 | Implementar notificacoes e lembretes | B-07 | NAO IMPLEMENTADO | booking e pos-atendimento disparam mensagens | job executado |
| 14 | B-14 | Integrar Google Calendar | B-09 | NAO IMPLEMENTADO | sincronizacao minima funcionando | eventos refletidos |
| 15 | B-15 | Preparar read models e GraphQL BFF | B-12 | NAO IMPLEMENTADO | dashboard agregado sem pressionar dominio | consultas agregadas |
| 16 | B-16 | Abrir trilha de analytics Python | B-12 | NAO IMPLEMENTADO | pipeline inicial de cohort e score | job e dataset inicial |
