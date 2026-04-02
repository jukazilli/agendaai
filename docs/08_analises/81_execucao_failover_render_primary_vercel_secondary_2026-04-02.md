# Execucao - Failover Render primario + Vercel secundario

## 1. Objetivo

Materializar o primeiro corte de failover ativo-passivo do `api-rest` sem abrir risco de multi-writer sobre o store atual baseado em `snapshot + report_definitions`.

## 2. Fontes consultadas

Documentacao do repositorio:

- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/08_analises/22_preparacao_publicacao_vercel_render_2026-03-19.md`
- `README.md`

Codigo validado:

- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/postgres-store.ts`
- `services/api-rest/src/api-rest.test.ts`
- `apps/admin-web/src/lib/admin-api.ts`
- `apps/booking-web/lib/public-api.ts`

Referencia externa oficial:

- `https://vercel.com/docs/project-configuration/vercel-json`

## 3. Regra de precedencia usada

1. docs oficiais do repositorio para tenancy, sessao e deploy;
2. implementacao real do `api-rest`;
3. documentacao oficial da Vercel apenas para o adapter serverless e `vercel.json`.

## 4. Divergencia encontrada

A ADR de auth deixa o provedor exato fora de escopo, e a execucao original de `B-05` assumia sessao administrativa in-memory. Para o failover isso deixou de ser suficiente, porque `Render` e `Vercel` nao compartilham memoria de sessao.

Decisao aplicada:

- manter o shape das rotas de auth;
- trocar a implementacao para JWT assinado;
- preservar `tenantId` e `role` nas claims, em aderencia total com a ADR.

## 5. Implementacao aplicada

### `api-rest`

- `POST /v1/onboarding/tenants` e `POST /v1/admin/auth/sessions` agora retornam JWT assinado, sem depender de sessao server-side compartilhada.
- `GET /v1/admin/auth/session` e o pre-handler admin validam o bearer token via JWT.
- `GET /ready` foi adicionado como readiness real.
- `READ_ONLY_MODE=true` bloqueia mutacoes fora da allowlist minima:
  - `POST /v1/admin/auth/sessions`
  - `GET/HEAD/OPTIONS`

### Runtime secundario

- adapter singleton para Vercel em `services/api-rest/src/vercel-handler.ts`
- entrypoint serverless em `services/api-rest/api/index.ts`
- `services/api-rest/vercel.json` roteando `/health`, `/ready` e `/v1/*`

### Gateway

- worker Cloudflare em `infra/cloudflare/agendaai-api-gateway/src/index.ts`
- failover `Render -> Vercel`
- writes nao allowlisted retornam `503 degraded_mode_write_blocked`

### Frontends

- `admin-web` e `booking-web` passam a assumir `https://api.agendaai.com` fora do ambiente de desenvolvimento local.

## 6. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web build`

## 7. Resultado

O repositorio passa a estar pronto para o rollout operacional do failover ativo-passivo do backend, ainda em modo de fallback somente leitura. Escrita plena no secundario continua explicitamente fora deste corte.
