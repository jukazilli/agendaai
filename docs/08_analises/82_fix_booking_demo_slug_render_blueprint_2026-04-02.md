# Fix Booking Demo Slug + Render Blueprint

## 1. Objetivo

Corrigir a divergencia entre a home publica do `booking-web`, o slug demo realmente seedado no staging e a ausencia de infraestrutura versionada para o primario do `api-rest` no Render.

## 2. Fontes consultadas

- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/08_analises/11_execucao_b07_booking_publico.md`
- `docs/08_analises/38_validacao_contratos_api_ui_2026-03-20.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `apps/booking-web/app/page.tsx`
- `apps/booking-web/app/[slug]/page.tsx`
- `services/api-rest/scripts/seed-demo.ts`
- `services/api-rest/scripts/seed-demo-lib.ts`
- `services/api-rest/scripts/reset-staging.ts`

## 3. Divergencia encontrada

- a documentacao oficial e a validacao publicada tratavam `demo-studio-20260317` como slug demo canonica;
- a home do `booking-web` ainda apontava para `/demo-studio`;
- os scripts de seed/reset do `api-rest` ainda caiam em `demo-studio` por default;
- o primario do Render seguia sem `render.yaml`, portanto sem configuracao versionada de build, start e readiness.

## 4. Ajuste aplicado

### `booking-web`

- a home agora aponta para `/{slug-demo-canonica}`;
- foi adicionada uma rota estatica `app/demo-studio/page.tsx` redirecionando para `demo-studio-20260317` para preservar links legados;
- o slug demo ficou centralizado em `apps/booking-web/lib/demo-slug.ts`.

### `api-rest`

- os scripts `seed-demo` e `reset-staging` passam a usar `demo-studio-20260317` como default;
- `render.yaml` foi adicionado na raiz com:
  - web service `agendaai-api-rest`;
  - build workspace-aware com `pnpm`;
  - `startCommand` do `api-rest`;
  - `healthCheckPath: /ready`;
  - envs obrigatorias versionadas como contrato de deploy.

## 5. Regra de precedencia aplicada

1. docs oficiais de jornada e shell;
2. auditoria e analises de execucao publicadas;
3. comportamento real do staging via gateway publicado;
4. implementacao do `booking-web` e scripts operacionais.

## 6. Resultado esperado

- o `404` do `booking-web` na CTA inicial deixa de acontecer apos novo deploy com este corte;
- o slug demo fica coerente entre docs, seed e URL publicada;
- o primario do Render deixa de depender de configuracao manual dispersa e passa a ter blueprint versionado para o `api-rest`.

## 7. Validacao de deploy em branch

- o preview `4J8SpyPFp` da branch `feat/admin-web-redesign-foundation` falhou na Vercel em `2 de abril de 2026` por `Module not found: Can't resolve '@agendaai/ui'`;
- a causa era contratual: o projeto `agendaai-booking-web` buildava o app sem preparar `packages/ui/dist`;
- o ajuste aplicado foi mover a preparacao de `@agendaai/ui` para o script `build` do proprio `booking-web`, para que qualquer build remoto do app passe a materializar o workspace antes do `next build`.
