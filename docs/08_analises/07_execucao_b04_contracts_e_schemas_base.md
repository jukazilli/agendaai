# Execucao B-04 Contracts e Schemas Base

## 1. Objetivo

Registrar a conclusao de `B-04` com base em evidencia local, provando que `packages/contracts` deixou de ser apenas scaffold e passou a conter validacao compartilhada e versionada para `tenant`, `client`, `service` e `booking`.

## 2. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/02_fundacoes/00_fundacao_de_produto_e_stack.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `packages/contracts/package.json`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/identity.ts`
- `packages/contracts/src/v1/shared.ts`
- `packages/contracts/src/v1/tenant.ts`
- `packages/contracts/src/v1/client.ts`
- `packages/contracts/src/v1/service.ts`
- `packages/contracts/src/v1/booking.ts`
- validacao local de `pnpm --filter @agendaai/contracts lint`
- validacao local de `pnpm --filter @agendaai/contracts build`
- validacao local de `pnpm lint`
- validacao local de `pnpm build`

## 3. Regra de precedencia aplicada

1. backlog e docs oficiais do `agendaai`;
2. ADR de auth, tenancy e slug;
3. entidades e jornadas oficiais;
4. implementacao real em `packages/contracts`.

Quando a documentacao deixava um ponto aberto, o schema foi mantido conservador em vez de inventar regra nova.

## 4. Evidencia concreta de conclusao do B-04

Artefatos publicados nesta rodada:

- `packages/contracts/package.json`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/v1/shared.ts`
- `packages/contracts/src/v1/tenant.ts`
- `packages/contracts/src/v1/client.ts`
- `packages/contracts/src/v1/service.ts`
- `packages/contracts/src/v1/booking.ts`

Provas de aderencia ao criterio de pronto do backlog:

| Criterio do backlog | Evidencia local |
| --- | --- |
| schemas de `tenant` | `packages/contracts/src/v1/tenant.ts` |
| schemas de `client` | `packages/contracts/src/v1/client.ts` |
| schemas de `service` | `packages/contracts/src/v1/service.ts` |
| schemas de `booking` | `packages/contracts/src/v1/booking.ts` |
| validacao compartilhada | `packages/contracts/package.json` inclui `zod`; `packages/contracts/src/v1/shared.ts` centraliza tipos e invariantes compartilhados |
| package buildando localmente | `pnpm --filter @agendaai/contracts build` gerou `packages/contracts/dist/index.js` e `packages/contracts/dist/index.d.ts` |

Validacao local executada e aprovada:

- `pnpm --filter @agendaai/contracts lint`
- `pnpm --filter @agendaai/contracts build`
- `pnpm lint`
- `pnpm build`

## 5. O que entrou de fato no package

Camada compartilhada:

- `contractVersion` em `v1`;
- `contractEnvelopeSchema`;
- `tenantSlugSchema` alinhado com a ADR;
- `tenantContextSourceSchema`;
- `adminRoleSchema`;
- `moneyAmountSchema`, `durationMinutesSchema`, `emailSchema`, `phoneSchema` e `dateTimeStringSchema`.

Schemas versionados:

- `tenantSchema`, `adminUserSchema`, `createTenantSchema`, `configureTenantSlugSchema`, `publicTenantRouteSchema`;
- `clientSchema`, `clientContactInputSchema`;
- `serviceSchema`, `createServiceSchema`;
- `bookingSchema`, `createBookingCommandSchema`, `publicCreateBookingInputSchema`.

## 6. Decisoes que nao foram inventadas nesta rodada

- `publicCreateBookingInputSchema` usa `slug` publica e nao `tenantId`, porque a ADR separa a jornada publica da sessao admin.
- `bookingStatusSchema` foi fechado exatamente com os estados documentados em `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`.
- `serviceStatusSchema` e `tenantStatusSchema` ficaram conservadores como `string nao vazia`, porque a documentacao oficial cita `status`, mas nao congela o conjunto permitido desses estados.
- `dateTimeStringSchema` ficou como string nao vazia, porque existe `timezone` em `Tenant`, mas ainda nao existe documento oficial congelando persistencia, normalizacao e exibicao de data/hora.

## 7. Lacunas remanescentes com prova concreta

| Item | Evidencia documental | Evidencia na implementacao | Leitura objetiva |
| --- | --- | --- | --- |
| Normalizacao de timezone e agenda | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` inclui `timezone` em `Tenant`, mas a busca local nao encontrou ADR ou documento dedicado para persistencia e normalizacao de data/hora | `packages/contracts/src/v1/shared.ts` manteve `dateTimeStringSchema` como string conservadora | lacuna real para `B-05`, `B-06`, `B-07` e `B-09`; precisa ser congelada antes de regras reais de disponibilidade e booking |
| Enums de status fora de booking ainda nao estao congelados | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` lista `status` para `Tenant`, `AdminUser`, `Professional`, `Catalog`, `PaymentIntent`, `CashEntry`, `Campaign` e `NotificationEvent`, mas nao define tabelas de valores permitidos | `tenantStatusSchema` e `serviceStatusSchema` ficaram abertos; nao existe schema para varias dessas entidades ainda | possivel lacuna documental; nao bloqueia `B-04`, mas pode gerar ambiguidade em `B-05`, `B-06`, `B-08`, `B-10` e `B-13` |
| Contracts de entidades posteriores ainda nao existem | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` documenta `Professional`, `PaymentIntent`, `CashEntry`, `Campaign` e `NotificationEvent`, mas o backlog define `B-04` apenas para `tenant`, `client`, `service` e `booking` | `packages/contracts/src/v1/` ainda nao cobre essas entidades | nao e falha desta rodada; e escopo ainda aberto para as trilhas posteriores do backlog |

## 8. Resultado pratico

`packages/contracts` agora pode ser usado como base unica de validacao entre frontend e backend.

O projeto saiu de:

- contratos apenas documentados;

para:

- contratos versionados, tipados, exportados e validados em build/lint.

## 9. Proximo passo confirmado

O proximo passo estrutural passa a ser `B-05`.

Motivo:

- `B-05` depende de `B-02` e `B-04`, ambos agora fechados;
- `services/api-rest` ainda esta apenas como scaffold buildavel;
- tenancy, slug e contratos base ja existem em codigo suficiente para abrir endpoints e casos de uso reais.
