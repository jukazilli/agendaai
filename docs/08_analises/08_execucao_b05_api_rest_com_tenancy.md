# Execucao B-05 API REST com Tenancy

## 1. Objetivo

Registrar a execucao de `B-05` com evidencia local, provando que `services/api-rest` deixou de ser scaffold e passou a expor runtime transacional com auth admin, resolucao de tenant context e CRUD base para as entidades ja cobertas em `packages/contracts`.

## 2. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/02_fundacoes/00_fundacao_de_produto_e_stack.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/00_governanca/03_relatorio_de_risco_estrutural.md`
- `services/api-rest/package.json`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/index.ts`
- `services/api-rest/src/api-rest.test.ts`
- validacao local de `pnpm --filter @agendaai/api-rest lint`
- validacao local de `pnpm --filter @agendaai/api-rest test`
- validacao local de `pnpm --filter @agendaai/api-rest build`
- validacao local de `pnpm lint`
- validacao local de `pnpm build`

## 3. Regra de precedencia aplicada

1. backlog oficial do `agendaai`;
2. ADR de auth, tenancy e slug;
3. entidades, jornadas e shells oficiais;
4. implementacao real em `services/api-rest`.

Quando a documentacao nao congelava comportamento detalhado, a implementacao ficou no menor corte seguro para `B-05`, sem antecipar `B-06`, `B-07` ou provedores externos.

## 4. Evidencia concreta de conclusao do B-05

Artefatos publicados nesta rodada:

- `services/api-rest/package.json`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/index.ts`
- `services/api-rest/src/api-rest.test.ts`

Provas de aderencia ao criterio de pronto do backlog:

| Criterio do backlog | Evidencia local |
| --- | --- |
| auth funcionando | `POST /v1/onboarding/tenants`, `POST /v1/admin/auth/sessions` e `GET /v1/admin/auth/session` em `services/api-rest/src/app.ts` |
| tenant context funcionando | sessao admin carrega `tenantId`; rotas admin resolvem o tenant pela sessao; rota publica resolve tenant por `slug`; testes validam isolamento entre tenants |
| CRUD base funcionando | rotas de `tenant`, `service`, `client` e `booking` publicadas em `services/api-rest/src/app.ts` com persistencia em memoria em `services/api-rest/src/store.ts` |
| endpoints e testes | `services/api-rest/src/api-rest.test.ts` cobre onboarding, sessao admin, isolamento por tenant, update de slug e CRUD base |

Validacao local executada e aprovada:

- `pnpm --filter @agendaai/api-rest lint`
- `pnpm --filter @agendaai/api-rest test`
- `pnpm --filter @agendaai/api-rest build`
- `pnpm lint`
- `pnpm build`

## 5. O que entrou de fato no runtime

Rotas publicadas:

- `GET /health`
- `POST /v1/onboarding/tenants`
- `POST /v1/admin/auth/sessions`
- `GET /v1/admin/auth/session`
- `GET /v1/public/tenants/:slug`
- `GET /v1/admin/tenant`
- `PATCH /v1/admin/tenant/slug`
- CRUD base para `services`
- CRUD base para `clients`
- CRUD base para `bookings`

Regras efetivamente materializadas:

- cliente externo nao escolhe `tenantId` como fonte de autorizacao;
- rotas admin usam bearer token emitido pelo runtime;
- rotas admin resolvem `tenantId` pela sessao;
- rotas publicas resolvem tenant pela `slug`;
- `service`, `client` e `booking` ficam isolados por tenant em todas as consultas e mutacoes;
- `booking` administrativa exige `client` e `service` do mesmo tenant.

## 6. O que nao foi inventado nesta rodada

- nao foi escolhido provedor real de auth; a sessao desta rodada e in-memory, coerente com o fato de a ADR deixar o provedor fora de escopo;
- nao foi aberto `professional` nem `availability`, porque isso pertence a `B-06`;
- nao foi aberta integracao de pagamento, notificacao ou calendario, porque isso pertence a trilhas posteriores;
- nao foi congelada nova regra de timezone; as datas continuam tratadas como strings validadas pelos contracts existentes.

## 7. Lacunas e divergencias remanescentes com prova concreta

| Item | Evidencia documental | Evidencia na implementacao | Leitura objetiva |
| --- | --- | --- | --- |
| `Professional` e disponibilidade ainda nao existem no runtime | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` documenta `Professional` e `AvailabilityRule`; `docs/05_jornadas/00_jornadas_core.md` exige profissional com disponibilidade em `J-02` e horario disponivel em `J-03` | `services/api-rest/src/store.ts` cobre apenas `tenant`, `admin user`, `service`, `client` e `booking` | lacuna real e esperada; vira o foco de `B-06` |
| Matriz de permissao continua subespecificada | `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` diz que funcoes de equipe podem ter permissao parcial; a ADR define papeis `owner`, `manager` e `staff`, mas nao congela matriz por rota | `services/api-rest/src/app.ts` autentica qualquer papel admin sem diferenciar autorizacoes finas | lacuna documental real; nao bloqueia `B-05`, mas precisa ser fechada antes de expandir o backoffice |
| Timezone segue sem regra canonica de persistencia | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` inclui `timezone` em `Tenant`; nenhuma ADR dedicada foi encontrada | `services/api-rest/src/store.ts` persiste `startAt` e `endAt` como strings; `packages/contracts` faz validacao conservadora | lacuna real ja apontada em `B-04`; passa a pressionar `B-06` |
| Stack do service diverge parcialmente da linha descrita no MAE | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` cita `NestJS com adapter Fastify` para `services/api-rest` | o runtime desta rodada foi implementado diretamente em `Fastify`, sem camada NestJS | divergencia concreta, mas nao bloqueia o criterio funcional de `B-05`; deve ser assumida conscientemente ou revisitada numa futura hardening pass |

## 8. Resultado pratico

`api-rest` saiu de:

- package scaffold sem runtime;

para:

- service real com sessao admin, tenant context, rotas publicas por slug e CRUD base transacional em memoria.

Isso reduz o principal risco estrutural que estava explicitamente aberto na governanca:

- multi-tenancy mal resolvido na API.

## 9. Proximo passo confirmado

O proximo passo estrutural passa a ser `B-06`.

Motivo:

- `B-05` ja fecha o corte de auth, tenant context e CRUD base;
- `docs/05_jornadas/00_jornadas_core.md` e `docs/06_modulos/00_mapa_de_modulos.md` mostram que o proximo gargalo real e `professional`, disponibilidade e agenda;
- sem `B-06`, `booking-web` e `admin-web` continuam sem fluxo operacional real.
