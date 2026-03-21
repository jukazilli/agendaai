# 71. Execucao — Relatorios hardening, Catalogo popup e Profissionais master-detail

Data: `2026-03-21`

## Precedencia usada

1. implementacao e contratos reais do `api-rest`
2. regra oficial do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
3. builder semantico ja aberto em `Relatorios`

## Corte executado

### 1. Relatorios

- o `ReportsBuilderWorkspace` foi endurecido para tolerar catalogos parciais e rotas antigas sem quebrar a tela;
- `fields`, `groupByOptions`, `relationOptions`, `baseOptions` e `systemDefinitions` passaram a usar fallback defensivo no frontend;
- a abertura de `Cadastro de servicos` no builder foi validada no browser com dados reais do tenant demo;
- a tela voltou a exibir filtros e ordenacao contextualizados mesmo fora da base `bookings`.

Arquivos principais:

- `apps/admin-web/src/reports-builder-workspace.tsx`

### 2. Catalogo

- `catalogo` permaneceu como `registro master` simples;
- `novo`, `visualizar`, `editar` e `excluir` passaram a abrir em popup, em vez de empilhar o formulario abaixo da lista;
- a lista zebrada foi mantida como superficie principal.

Arquivos principais:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

### 3. Profissionais

- `profissionais` deixou o grid de cards como superficie principal;
- a rota passou a usar `master-detail`, com a equipe no painel master e o detalhe relacional no painel direito;
- o detalhe passou a separar `cadastro e servicos` de `horarios`, mantendo o vinculo operacional com agenda e disponibilidade.

Arquivos principais:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Validacao

Executado com sucesso:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA em `http://127.0.0.1:4173` com backend publicado em `https://agendaai-eu7w.onrender.com`:

- login administrativo com `owner@agendaai.demo`;
- `Relatorios` abrindo por hover no shell lateral;
- `Cadastro de servicos` abrindo em dock tab sem quebrar o builder;
- `Catalogo` abrindo `Visualizar` em popup;
- `Profissionais` exibindo lista master e detalhe relacional;
- `Horarios` carregando no detalhe do profissional;
- sem regressao visual evidente em `390x844`.

## Residual

- o fallback local do catalogo do builder ainda nao replica 100% do catalogo remoto mais rico;
- o bundle do `admin-web` continua emitindo warning de chunk grande no build;
- a proxima passada pode focar em completar o fallback do builder e aprofundar `joins` controlados entre bases.
