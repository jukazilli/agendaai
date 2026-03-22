# 76. Execucao financeiro base e dashboard fluxo de caixa - 2026-03-21

## Objetivo

Materializar uma base financeira minima no `AgendaAI` sem remover o reflexo operacional existente por `cash entries`, e remasterizar o `dashboard` para abrir primeiro em `Fluxo de caixa`.

## Fontes consultadas

### Documentacao

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\10_backlog\00_backlog_estruturado_por_dependencia.md`

### Benchmark conceitual interno

- TOTVS Gestao Financeira 12.1.1
- Protheus SIGAFIN FINA100 Movimentacao Bancaria

## Escopo executado

### Contracts

- criadas entidades novas em `C:\projetos\agendaai\packages\contracts\src\v1\finance.ts`:
  - `Bank`
  - `BankBalance`
  - `RevenueSchedule`
  - `ExpenseSchedule`
  - `BankMovement`
  - `AdminFinancialReadModel`
- `codigo` passou a ser parte formal dos cadastros financeiros;
- `shared.ts` recebeu `dateStringSchema`;
- `index.ts` passou a exportar os contratos financeiros.

### Backend

- `C:\projetos\agendaai\services\api-rest\src\store.ts`
  - persistencia em memoria de bancos, saldos, receitas, despesas e movimentos;
  - seeds minimas por tenant para banco inicial e saldo;
  - operacoes de `receber`, `pagar` e `transferir`;
  - recalculo de saldo atual a partir de saldo inicial e movimentos.
- `C:\projetos\agendaai\services\api-rest\src\postgres-store.ts`
  - paridade de snapshot e persistencia Postgres para as novas tabelas.
- `C:\projetos\agendaai\services\api-rest\src\financial-read-model.ts`
  - consolidacao de caixa, contas, recebimentos, pagamentos e movimentos;
  - `cash entries` passaram a alimentar o lado de recebimentos do financeiro.
- `C:\projetos\agendaai\services\api-rest\src\app.ts`
  - novas rotas administrativas:
    - `/v1/admin/banks`
    - `/v1/admin/bank-balances`
    - `/v1/admin/revenues`
    - `/v1/admin/expenses`
    - `/v1/admin/bank-movements`
    - `/v1/admin/read-models/financial`

### Admin web

- `C:\projetos\agendaai\apps\admin-web\src\lib\admin-api.ts`
  - bootstrap passou a carregar bancos, saldos, receitas, despesas, movimentos e o read model financeiro;
  - client passou a expor CRUD e acoes financeiras.
- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
  - rota nova `financeiro`;
  - `dashboard` passou a abrir em `Fluxo de caixa`;
  - tabs do dashboard reduzidas para:
    - `Fluxo de caixa`
    - `Agenda da semana`
    - `Radar da semana`
  - o grafico inicial antigo saiu da superficie principal;
  - `financeiro` passou a expor abas:
    - `Fluxo de caixa`
    - `Bancos`
    - `Saldos iniciais`
    - `Receitas`
    - `Despesas`
    - `Movimentos`
  - modais de `Incluir banco`, `Saldo inicial`, `Receber`, `Pagar` e `Transferir`;
  - o modal financeiro foi ligado ao retorno principal;
  - o legado quebrado de `renderDashboardViewLegacy()` foi neutralizado para nao quebrar o `tsc`.
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`
  - ajustes para cards clicaveis do financeiro;
  - toolbar local do `Fluxo de caixa` extraida do header do painel para evitar overlap e bloquear clique.

## Validacao

### Build e lint

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/contracts build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Todos passaram.

### Browser QA

Validacao em `http://127.0.0.1:4174` com backend local `http://127.0.0.1:3333` e tenant de QA criado por onboarding local.

Fluxos confirmados:

- `#dashboard` abre no tab `Fluxo de caixa`;
- conta seeded `Banco do Brasil 0001/12345-6` aparece no seletor e em `Contas e saldos`;
- `Incluir banco` abre modal funcional;
- `Abrir financeiro` troca para a rota `#financeiro`;
- a rota `#financeiro` abre com tabs locais do modulo;
- o overlap que bloqueava clique nas acoes do `Fluxo de caixa` foi corrigido.

## Residuos

- `favicon.ico` continua `404` no ambiente local;
- `@agendaai/admin-web build` continua com warning de chunk grande;
- a integracao desses objetos financeiros no builder de `Relatorios` foi apenas preparada conceitualmente e segue como proximo corte controlado.
