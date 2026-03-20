# Validacao de Contratos API x Nova Interface - 2026-03-20

## 1. Objetivo

Validar que os contratos de API permaneceram intactos e funcionais apos a rodada de refinamento visual em:

- `apps/admin-web`;
- `apps/booking-web`;
- `packages/ui`.

O foco desta auditoria foi confirmar aderencia entre:

1. contratos versionados em `packages/contracts`;
2. backend real em `services/api-rest`;
3. pontos de consumo da interface nova em `admin-web` e `booking-web`;
4. runtime hospedado publicado.

## 2. Fontes consultadas

### 2.1 Documentacao

- `C:\projetos\agendaai\README.md`
- `C:\projetos\agendaai\docs\02_fundacoes\01_entidades_centrais_e_contratos_base.md`
- `C:\projetos\agendaai\docs\02_fundacoes\02_adr_auth_tenancy_e_slug.md`
- `C:\projetos\agendaai\docs\03_navegacao_e_shell\00_shells_e_rotas_core.md`
- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\07_execucao_b04_contracts_e_schemas_base.md`
- `C:\projetos\agendaai\docs\08_analises\08_execucao_b05_api_rest_com_tenancy.md`
- `C:\projetos\agendaai\docs\08_analises\11_execucao_b07_booking_publico.md`
- `C:\projetos\agendaai\docs\08_analises\17_admin_shell_referencia_gemini_contratos_e_plano.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\37_refinamento_pos_entity_document_master_detail_2026-03-20.md`

### 2.2 Codigo verificado

- `C:\projetos\agendaai\packages\contracts\src\index.ts`
- `C:\projetos\agendaai\packages\contracts\src\v1\availability.ts`
- `C:\projetos\agendaai\packages\contracts\src\v1\booking.ts`
- `C:\projetos\agendaai\packages\contracts\src\v1\client.ts`
- `C:\projetos\agendaai\packages\contracts\src\v1\payment.ts`
- `C:\projetos\agendaai\packages\contracts\src\v1\reporting.ts`
- `C:\projetos\agendaai\apps\admin-web\src\lib\admin-api.ts`
- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\booking-web\lib\public-api.ts`
- `C:\projetos\agendaai\apps\booking-web\app\[slug]\booking-flow.tsx`
- `C:\projetos\agendaai\apps\booking-web\app\api\public\tenants\[slug]\bookings\route.ts`
- `C:\projetos\agendaai\apps\booking-web\app\api\public\tenants\[slug]\payment-intents\route.ts`
- `C:\projetos\agendaai\services\api-rest\src\app.ts`
- `C:\projetos\agendaai\services\api-rest\src\api-rest.test.ts`

## 3. Regra de precedencia

1. contratos reais e codigo do runtime atual;
2. docs oficiais de fundacao, ADR e shell;
3. trilha historica das execucoes em `docs/08_analises`.

Nenhuma doc oficial indicou mudanca de payload ou endpoint causada pelo refinamento visual. Logo, qualquer divergencia nesta rodada deveria ser tratada como bug de integracao, nao como mudanca legitima de contrato.

## 4. O que foi auditado

### 4.1 `admin-web`

Confirmado consumo direto dos mesmos endpoints ja previstos no shell:

- `POST /v1/admin/auth/sessions`
- `GET /v1/admin/auth/session`
- `GET /v1/admin/payment-settings`
- `GET /v1/admin/payment-intents`
- `GET /v1/admin/cash-entries`
- `GET /v1/admin/services`
- `GET /v1/admin/professionals`
- `GET /v1/admin/clients`
- `GET /v1/admin/bookings`
- `GET /v1/admin/read-models/reports`
- `GET/PUT /v1/admin/professionals/:id/availability`
- `GET /v1/admin/availability/slots`
- `PATCH /v1/admin/bookings/:id`
- `POST /v1/admin/payment-intents/:id/sync`

### 4.2 `booking-web`

Confirmado consumo dos contratos publicos por `slug`:

- `GET /v1/public/tenants/:slug/catalog`
- `GET /v1/public/tenants/:slug/availability`
- `POST /v1/public/tenants/:slug/bookings`
- `POST /v1/public/tenants/:slug/payment-intents`
- `POST /v1/public/tenants/:slug/payment-intents/:paymentIntentId/sync`

Tambem foi verificado que o proxy do `Next.js` apenas repassa o corpo para a API real, sem reescrever payload.

## 5. Validacao estrutural executada

Comandos executados no monorepo:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/contracts build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web build`

Resultado:

- `@agendaai/contracts build`: OK
- `@agendaai/api-rest lint`: OK
- `@agendaai/api-rest build`: OK
- `@agendaai/api-rest test`: OK, `12/12` testes passando
- `@agendaai/admin-web build`: OK
- `@agendaai/booking-web build`: OK
- `powershell -NoProfile -ExecutionPolicy Bypass -File C:\projetos\agendaai\scripts\smoke-ui-api-contracts.ps1`: OK

Observacao:

- houve uma falha inicial no `build` do `admin-web` quando ele foi disparado em paralelo ao rebuild de `@agendaai/contracts`; a falha era de ordem de execucao do monorepo, nao de contrato quebrado;
- reexecutado em sequencia, o `build` do `admin-web` passou normalmente.

## 6. Smoke real contra a API publicada

Base usada:

- `https://agendaai-eu7w.onrender.com`

Tenant validado:

- `demo-studio-20260317`

Credencial administrativa validada:

- `owner@agendaai.demo`
- `agendaai-demo`

### 6.1 Fluxo administrativo

O login e o bootstrap administrativo funcionaram com token real e retornaram:

- sessao `owner` autenticada;
- `payment settings` ativas;
- listas de `services`, `professionals`, `clients`, `bookings` e `paymentIntents`;
- `read model` de relatorios autenticado em `/v1/admin/read-models/reports`.

### 6.2 Fluxo publico sem sinal

Foi validado:

1. `GET /v1/public/tenants/demo-studio-20260317/catalog`;
2. `GET /v1/public/tenants/demo-studio-20260317/availability?...`;
3. `POST /v1/public/tenants/demo-studio-20260317/bookings`.

Resultado:

- booking criada com `status=confirmado`;
- `client` criada com `origem` preservada;
- booking passou a aparecer em `GET /v1/admin/bookings`;
- cliente passou a aparecer em `GET /v1/admin/clients`.

### 6.3 Fluxo publico com sinal

Foi validado:

1. `GET /v1/public/tenants/demo-studio-20260317/availability?...` para servico com cobranca;
2. `POST /v1/public/tenants/demo-studio-20260317/payment-intents`.

Resultado:

- booking criada com `status=aguardando pagamento`;
- `paymentIntent` criada com `status=pending`;
- `checkoutMode=checkout_pro`;
- `initPoint` real retornado;
- `payment intent` passou a aparecer em `GET /v1/admin/payment-intents`.

## 7. Esclarecimento de aderencia

Durante a auditoria houve um `400 validation_error` em uma tentativa manual de smoke publico. O motivo foi o payload do teste manual estar incompleto, sem `client.origem`.

Isso nao representou bug da interface, porque o frontend real em `apps/booking-web/app/[slug]/booking-flow.tsx` ja envia `origem` no `client` tanto para:

- `POST /bookings`;
- `POST /payment-intents`.

Ou seja: a falha foi do harness temporario de validacao, nao do `booking-web`.

## 8. Conclusao

Na data de 20/03/2026, nao houve evidencia de quebra de contrato causada pela nova interface.

Os contratos permaneceram intactos e funcionais nos pontos auditados:

- o pacote `@agendaai/contracts` builda;
- o `api-rest` compila e passa na bateria de testes cobrindo onboarding, tenancy, catalogo, disponibilidade, booking, `payment intent`, `sync`, webhook e read model;
- `admin-web` e `booking-web` continuam buildando com a interface nova;
- os endpoints consumidos pela interface refinada responderam corretamente no backend publicado.

## 9. Risco residual

Nao foi identificada quebra de contrato entre frontend novo e backend.

O risco residual desta rodada nao e de contrato, e sim de disciplina de reexecucao. Esse risco ja ficou reduzido porque o smoke HTTP desta auditoria foi materializado em:

- `C:\projetos\agendaai\scripts\smoke-ui-api-contracts.ps1`

Esse script valida novamente `admin + booking` contra a API publicada, incluindo login, bootstrap admin, catalogo publico, disponibilidade, booking sem sinal, `payment intent` com sinal e reflexo no admin.
