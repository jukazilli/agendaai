# 66. Execucao Builder Relatorios Semantico

Data: `2026-03-21`  
Projeto: `agendaai`  
Modulo: `Relatorios`

## 1. Objetivo

Materializar `B-18` no codigo real:

- substituir a rota fixa de `Relatorios` por `builder workspace` em pagina em branco;
- abrir definicoes do sistema em `dock tabs` pelo shell lateral;
- persistir `modelos salvos` como `report_definitions`;
- executar o relatorio no backend real, sem salvar snapshot do resultado;
- introduzir `codigo` persistido nas entidades usadas por lookup.

## 2. Regra de precedencia aplicada

Precedencia usada nesta execucao:

1. backend real e contratos versionados;
2. documentacao oficial do shell e backlog;
3. mock HTML enviado como referencia de composicao;
4. benchmark externo apenas como referencia interna controlada, sem exposicao publica.

Arquivos de documentacao consultados:

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/08_analises/64_arquitetura_builder_semantico_relatorios_2026-03-20.md`
- `docs/08_analises/65_avaliacao_mock_relatorio_dinamico_2026-03-21.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`

## 3. Implementacao materializada

### 3.1 Contratos

Foram expandidos os contratos compartilhados:

- `Service` agora expõe `codigo`;
- `Professional` agora expõe `codigo`;
- `Client` agora expõe `codigo`.

Tambem foi introduzida a camada versionada do builder em:

- `packages/contracts/src/v1/report-builder.ts`

Tipos materializados:

- `ReportDefinition`
- `ReportDefinitionSummary`
- `ReportCatalogField`
- `ReportMetricDefinition`
- `ReportFilterNode`
- `ReportSortDefinition`
- `ReportExecutionRequest`
- `ReportExecutionResponse`

## 3.2 Backend

O `api-rest` passou a expor rotas novas:

- `GET /v1/admin/reporting/catalog`
- `GET /v1/admin/report-definitions`
- `POST /v1/admin/report-definitions`
- `PATCH /v1/admin/report-definitions/:definitionId`
- `DELETE /v1/admin/report-definitions/:definitionId`
- `POST /v1/admin/report-definitions/:definitionId/execute`
- `POST /v1/admin/reporting/execute`

Persistencia materializada:

- store local em memoria/snapshot;
- tabela `report_definitions` em Postgres quando `DATABASE_URL` existe.

O motor semantico inicial foi implementado em:

- `services/api-rest/src/report-builder.ts`

Definicoes de sistema seedadas:

- `Visao executiva`
- `Receita e servicos`
- `Equipe e produtividade`
- `Pendencias operacionais`
- `Retorno e retencao`
- `Radar semanal`
- `Visao mensal`

## 3.3 Frontend

O modulo antigo foi substituido por `ReportsBuilderWorkspace`, com:

- `dock tabs` dedicadas por relatorio;
- builder lateral com estrutura base, filtros, ordenacao e agrupamento;
- preview de expressao literal;
- preview tecnico do payload JSON;
- resultado real do backend;
- modal `Filtrar` por relatorio;
- modal `Modelos salvos`;
- modal `Salvar modelo`;
- popup de lookup por lupa.

Lookups materializados:

- servicos: `Codigo`, `Descricao`, `Auxiliar`;
- profissionais: `Codigo`, `Nome`, `Auxiliar`;
- clientes: `Codigo`, `Nome`, `Telefone`.

## 4. Regras fechadas neste corte

- `Relatorios` deixou de operar como pagina fixa de cards e filtros globais no topo;
- o shell lateral passou a abrir as visoes por `hover` no desktop;
- cada clique em uma visao abre uma `dock tab` dedicada;
- cada relatorio possui seu proprio botao `Filtrar`;
- filtros aplicados pertencem apenas ao relatorio atual;
- o sistema salva apenas a definicao reutilizavel;
- o resultado executado nao e persistido como snapshot;
- `modelos rapidos` continuam fora do corte.

## 5. Validacao executada

Validacoes de build e tipos:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/contracts build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web build`

Browser QA real no admin local:

- hover em `Relatorios` no shell lateral exibiu as definicoes do sistema;
- clique em `Visao executiva` abriu a dock tab dedicada;
- `Executar` retornou resultado real do backend local;
- `Filtrar` abriu modal proprio do relatorio;
- o icone de lupa abriu popup tabular de lookup;
- `Salvar modelo` persistiu `Visao executiva QA` com codigo `RPT-0001`;
- `Modelos salvos` listou o modelo salvo apos refresh da rota.

## 6. Risco residual

- o tenant local usado na QA estava sem massa comercial suficiente, entao o lookup de servicos abriu sem linhas;
- o build do `admin-web` continua emitindo warning de chunk grande;
- o modulo ainda possui legado morto do workspace anterior em `App.tsx`, sem impacto funcional imediato, mas elegivel para limpeza posterior.

## 7. Conclusao

`B-18` foi materializado.

O modulo `Relatorios` agora opera sobre builder semantico real, com contratos versionados, execucao validada no backend, `dock tabs`, filtros por modal, lookup por lupa e persistencia de `modelos salvos`, mantendo a regra central do projeto:

> o backend existente continua mandando na verdade do sistema.
