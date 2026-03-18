# Contrato de Corte - B-07 Booking Publico

## Identificacao

- backlog: `B-07`
- jornada: `J-03 Agendamento publico`
- data: `17/03/2026`
- objetivo do dia: preparar um corte executavel para termos algo demonstravel em `18/03/2026`

## Objetivo

- fechar a menor jornada publica funcional sobre a API real;
- sair de `booking-web` scaffold para `booking-web` demonstravel.

## O que entra

- leitura publica por `slug`;
- exibicao de tenant, servicos, profissionais e slots;
- escolha de horario;
- captura de dados do cliente;
- criacao de booking sem pagamento obrigatorio;
- confirmacao e tratamento de erro.

## O que explicitamente nao entra

- `B-08` pagamento por provider;
- notificacoes;
- dashboard admin;
- GraphQL BFF;
- analytics Python;
- endurecimento de timezone alem do estado atual.

## Problema

- o backend ja sustenta catalogo, profissionais e disponibilidade;
- a jornada publica ainda nao existe em `apps/booking-web`.

## Restricoes

- tecnicas: reaproveitar o `api-rest` atual e nao reabrir persistencia;
- documentais: respeitar backlog, jornadas e shells oficiais;
- de sequencia: nao abrir `B-08` para fechar `B-07`.

## Squads autorizados

- supervisor / arquiteto: ativo
- research: sob demanda
- backend core: autorizado apenas para gaps estritamente necessarios ao booking
- frontend booking: autorizado
- frontend admin: fora do corte
- docs / audit: autorizado
- integrador: ativo
- qa / verification: ativo

## `Write set` por squad

- research: docs e referencias, sem runtime
- backend core: `services/api-rest/*`, `packages/contracts/*`
- frontend booking: `apps/booking-web/*`
- frontend admin: nenhum
- docs / audit: `docs/*`, `.agents/*`, `README.md`
- qa / verification: sem runtime, salvo harness autorizado

## Entradas obrigatorias

- docs: backlog, jornadas, shells, auditoria, analise `B-06`
- codigo: `apps/booking-web/*`, `services/api-rest/src/*`
- referencias externas permitidas: nenhuma obrigatoria para este corte

## Definition of Done

- backend: nenhuma lacuna bloqueante entre a UI e a API publica
- frontend: jornada publica demonstravel com dados reais
- docs: ponto de parada e auditoria atualizados
- validacao: lint, build, teste do `api-rest` e smoke da jornada

## Validacao obrigatoria

- comandos: `pnpm --filter @agendaai/api-rest test`, `pnpm lint`, `pnpm build`
- jornadas: abrir slug, selecionar servico/profissional/horario, criar booking sem sinal
- evidencias: saida dos comandos e estado final da UI

## Decisoes travadas antes da execucao

- servico com sinal obrigatorio nao deve fingir fechamento sem `B-08`
- o corte pode ser uma jornada compacta em vez de um stepper completo
- o runtime em memoria e aceitavel para a demonstracao de `18/03/2026`

## Decisoes conscientemente adiadas

- provider de pagamento
- notificacoes
- timezone canonico
- RBAC fino do admin
