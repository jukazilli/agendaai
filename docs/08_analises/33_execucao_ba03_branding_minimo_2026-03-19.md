# Execucao BA-03 - Branding Minimo da Implantacao - 2026-03-19

## Objetivo

Fechar a lacuna final do backlog beta/MVP, adicionando branding minimo editavel no `admin-web` e refletindo essa identidade na slug publica sem abrir um modulo visual maior que o escopo combinado.

## Regra de precedencia usada

- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md` para o criterio de `BA-03`;
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` e `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md` para a exigencia de branding minimo em implantacao/configuracoes;
- codigo real em `packages/contracts`, `services/api-rest`, `apps/admin-web` e `apps/booking-web` como fonte final de runtime.

## Divergencia encontrada

As docs oficiais exigiam `branding minimo`, mas os contratos e o runtime do tenant ainda so suportavam:

- `nome`;
- `slug`;
- `timezone`;
- configuracao de Mercado Pago.

Nao havia definicao canonica de quais campos eram o branding minimo. O menor recorte seguro adotado foi:

- `tagline` curta da marca;
- `accentColor` em formato `#RRGGBB`.

Esse recorte foi considerado suficiente porque:

- nao exige upload de imagem nem storage de assets;
- e editavel no shell administrativo atual;
- e gera reflexo visivel na slug publica;
- nao reabre uma rodada pesada de UI/UX antes de fechar o MVP.

## Codigo alterado

- `packages/contracts/src/v1/tenant.ts`
- `packages/contracts/src/index.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/postgres-store.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`
- `apps/admin-web/src/lib/admin-api.ts`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `apps/booking-web/lib/public-api.ts`
- `apps/booking-web/app/[slug]/booking-flow.tsx`
- `apps/booking-web/app/globals.css`

## Entrega executada

- contrato de `tenant.branding` versionado em `packages/contracts`;
- endpoint administrativo `PATCH /v1/admin/tenant/branding`;
- persistencia do branding minimo no store em memoria e no snapshot Postgres;
- formulario de branding minimo no shell admin, com:
  - `tagline`;
  - `accentColor`;
  - preview simples;
- payload publico por `slug` passando a expor o branding do tenant;
- `booking-web` consumindo `tagline` e `accentColor` para personalizar a jornada publica.

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/contracts build`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/booking-web build`

## Decisao de status

`BA-03` passa para `FECHADO`.

Justificativa:

- slug publica ja era editavel;
- Mercado Pago ja estava editavel e homologado no ambiente publicado;
- o branding minimo passou a ser configuravel no shell admin e refletido na slug publica;
- o backlog beta nao exige upload de logo, editor visual ou theming completo.

## Impacto no percentual

- backlog estrutural: `72%`
- backlog beta/MVP: `100%`

## Proximo passo recomendado

O backlog beta/MVP ficou fechado no menor corte operacional combinado. A partir deste ponto:

1. ja existe base legitima para iniciar rodada pesada de UI/UX, desde que o escopo beta fique congelado;
2. no roadmap estrutural, a decisao pendente passa a ser `checkout_transparente` em `B-08`;
3. os proximos itens nao-beta passam a ser endurecimento estrutural, nao lacuna de MVP.
