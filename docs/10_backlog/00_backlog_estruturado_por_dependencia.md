# Backlog Estruturado por Dependencia

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
| 5 | B-05 | Implementar `api-rest` com tenancy | B-02, B-04 | NAO IMPLEMENTADO | auth, tenant context e CRUD base funcionando | endpoints e testes |
| 6 | B-06 | Implementar catalogo, equipe e disponibilidade | B-05 | NAO IMPLEMENTADO | servicos, profissionais e horarios operando | fluxos API e dados persistidos |
| 7 | B-07 | Implementar booking publico | B-03, B-05, B-06 | NAO IMPLEMENTADO | jornada publica fecha sem sinal obrigatorio | UI funcional e testes |
| 8 | B-08 | Integrar opcao de sinal/pagamento | B-07 | NAO IMPLEMENTADO | reserva com sinal confirmada por provider | webhook e reconciliacao basica |

## Trilha C - Operacao e receita

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 9 | B-09 | Implementar agenda e dashboard operacional | B-06, B-07 | NAO IMPLEMENTADO | agenda do dia e calendario consultam bookings reais | telas e testes |
| 10 | B-10 | Confirmar execucao e reconhecer receita | B-09 | NAO IMPLEMENTADO | atendimento concluido gera reflexo financeiro | transacao e UI operando |
| 11 | B-11 | Implementar carteira basica de clientes | B-07, B-10 | NAO IMPLEMENTADO | cliente exibe historico e ultima visita | tela e API funcionais |
| 12 | B-12 | Implementar relatorios essenciais | B-10, B-11 | NAO IMPLEMENTADO | agenda, receita e retorno com filtros basicos | consultas e telas |

## Trilha D - Integracoes e endurecimento

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto | Evidencia esperada |
| --- | --- | --- | --- | --- | --- | --- |
| 13 | B-13 | Implementar notificacoes e lembretes | B-07 | NAO IMPLEMENTADO | booking e pos-atendimento disparam mensagens | job executado |
| 14 | B-14 | Integrar Google Calendar | B-09 | NAO IMPLEMENTADO | sincronizacao minima funcionando | eventos refletidos |
| 15 | B-15 | Preparar read models e GraphQL BFF | B-12 | NAO IMPLEMENTADO | dashboard agregado sem pressionar dominio | consultas agregadas |
| 16 | B-16 | Abrir trilha de analytics Python | B-12 | NAO IMPLEMENTADO | pipeline inicial de cohort e score | job e dataset inicial |
