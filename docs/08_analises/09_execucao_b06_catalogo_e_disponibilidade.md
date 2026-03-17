# Execucao B-06 Catalogo, Equipe e Disponibilidade

## 1. Objetivo

Registrar a execucao de `B-06` com evidencia local, provando que `packages/contracts` e `services/api-rest` passaram a cobrir `professional`, regras recorrentes de disponibilidade e consulta de horarios, destravando a base estrutural para o booking publico.

## 2. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/08_analises/08_execucao_b05_api_rest_com_tenancy.md`
- `packages/contracts/src/v1/shared.ts`
- `packages/contracts/src/v1/professional.ts`
- `packages/contracts/src/v1/availability.ts`
- `packages/contracts/src/index.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`
- validacao local de `pnpm --filter @agendaai/contracts lint`
- validacao local de `pnpm --filter @agendaai/contracts build`
- validacao local de `pnpm --filter @agendaai/api-rest lint`
- validacao local de `pnpm --filter @agendaai/api-rest test`
- validacao local de `pnpm --filter @agendaai/api-rest build`
- validacao local de `pnpm lint`
- validacao local de `pnpm build`

## 3. Regra de precedencia aplicada

1. backlog oficial do `agendaai`;
2. entidades, jornadas e shells oficiais;
3. ADR de auth, tenancy e slug;
4. implementacao real em `packages/contracts` e `services/api-rest`.

Quando a documentacao nao congelava detalhe estrutural, a implementacao ficou no menor corte seguro para tornar horarios operacionais sem antecipar pagamento, notificacao, calendario ou UI final.

## 4. Evidencia concreta de conclusao do B-06

Artefatos publicados nesta rodada:

- `packages/contracts/src/v1/shared.ts`
- `packages/contracts/src/v1/professional.ts`
- `packages/contracts/src/v1/availability.ts`
- `packages/contracts/src/index.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`

Provas de aderencia ao criterio de pronto do backlog:

| Criterio do backlog | Evidencia local |
| --- | --- |
| servicos operando | CRUD admin de `services` ja existente, mantido e validado no runtime |
| profissionais operando | CRUD admin de `professionals` em `services/api-rest/src/app.ts` e persistencia em `services/api-rest/src/store.ts` |
| horarios operando | `PUT /v1/admin/professionals/:professionalId/availability`, `GET /v1/admin/professionals/:professionalId/availability`, `GET /v1/admin/availability/slots` e `GET /v1/public/tenants/:slug/availability` |
| fluxos API e dados persistidos | runtime em memoria no `api-rest` com isolamento por tenant, regras recorrentes e testes passando |

Validacao local executada e aprovada:

- `pnpm --filter @agendaai/contracts lint`
- `pnpm --filter @agendaai/contracts build`
- `pnpm --filter @agendaai/api-rest lint`
- `pnpm --filter @agendaai/api-rest test`
- `pnpm --filter @agendaai/api-rest build`
- `pnpm lint`
- `pnpm build`

## 5. O que entrou de fato

Contracts novos:

- `professionalSchema`
- `createProfessionalSchema`
- `availabilityRangeSchema`
- `availabilityRuleSchema`
- `availabilityRuleInputSchema`
- `setAvailabilityRulesSchema`
- `weekdayIndexSchema`
- `timeOfDaySchema`

Capacidades novas no `api-rest`:

- CRUD admin de profissionais;
- especialidades por profissional ligadas a `serviceId`;
- replace/list de regras recorrentes de disponibilidade por profissional;
- consulta publica de catalogo, profissionais e slots por `slug`;
- validacao de booking contra especialidade, janela de disponibilidade e conflito de horario;
- remocao de slot ocupado da resposta publica depois que um booking passa a bloquear aquela faixa.

## 6. Decisoes conservadoras que nao fingem definicao documental inexistente

- `status` de `Professional` continua como `string nao vazia`, porque a documentacao oficial cita `status`, mas nao fecha enum;
- `weekday` foi materializado como indice `0..6` e `faixa` como `{ startTime, endTime }`, porque a doc so informa `weekday` e `faixa`, sem formato detalhado;
- os slots publicos usam data e hora em formato local simples, sem resolver timezone de forma canonica, porque essa regra continua ausente nas docs oficiais;
- o `Catalog` como entidade separada nao foi materializado; a rodada operou o conceito de catalogo via exposicao publica de `services` e `professionals`.

## 7. Lacunas e possiveis lacunas remanescentes com prova concreta

| Item | Evidencia documental | Evidencia na implementacao | Leitura objetiva |
| --- | --- | --- | --- |
| `Catalog` continua sem agregado proprio | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` documenta `Catalog` como entidade; `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` cita cadastro de catalogos | o runtime expoe `catalogo` como combinacao de `services` e `professionals`, sem schema ou store dedicados | possivel lacuna de modelagem; nao bloqueia `B-06`, mas pode reaparecer quando o produto precisar agrupar servicos comercialmente |
| Timezone continua sem regra canonica | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` inclui `timezone` em `Tenant`; `docs/08_analises/03_proximos_passos_e_lacunas_validadas.md` ja apontava essa subespecificacao | slots e bookings operam por data e hora local simples em `services/api-rest/src/store.ts` | lacuna real; passa a pressionar diretamente `B-07` e `B-09` |
| RBAC fino continua aberto | `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` diz que funcoes de equipe podem ter permissao parcial; a ADR so congela papeis base | o runtime autentica `owner`, `manager` e `staff` igualmente | lacuna real; nao bloqueia `B-06`, mas precisa ser resolvida antes do backoffice real |
| Stack do `api-rest` ainda diverge do MAE | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` cita `NestJS com adapter Fastify` | o runtime segue em `Fastify` direto | divergencia concreta e consciente; nao impede `B-06`, mas continua aberta para uma futura decisao de hardening |

## 8. Resultado pratico

O projeto saiu de:

- runtime com `service`, `client` e `booking`, mas sem equipe e sem horario operavel;

para:

- runtime com `professional`, regras recorrentes de disponibilidade, slots publicos e validacao de conflito em booking.

Isso cria a base minima que o `booking-web` precisava para o proximo corte.

## 9. Proximo passo confirmado

O proximo passo estrutural passa a ser `B-07`.

Motivo:

- `B-06` ja entrega catalogo, equipe e horarios no backend;
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` e `docs/05_jornadas/00_jornadas_core.md` mostram que a proxima lacuna material e a jornada publica completa;
- `apps/booking-web` ainda esta scaffoldado, mas agora ja existe base de API suficiente para ligacao real.
