# 75. Execucao UI/UX - Relatorios com biblioteca de graficos

Data: `2026-03-21`  
Modulo: `apps/admin-web`  
Rota: `#relatorios`

## Objetivo

Sair do estado em que `Relatorios` entregava apenas `kpis + tabela` e materializar modelos reais de visualizacao grafica no builder, sem criar metrica falsa e sem quebrar a leitura tabular ja existente.

## Precedencia usada

1. Implementacao real do `reports-builder-workspace.tsx`
2. Regra oficial do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
3. Catalogo e execucao reais do `report-builder.ts`
4. Documentacao oficial da biblioteca React de graficos usada como referencia de componente

## Decisao aplicada

- biblioteca adotada no `admin-web`: `recharts`
- modelos entregues na v1:
  - `barras`
  - `linhas`
  - `pizza`
  - `medidor`
- visualizacoes legadas continuam compatveis:
  - `ranking` e tratado como `barras`
  - `time_series` e tratado como `linhas`
- o grafico nasce do resultado real ja calculado no builder:
  - primeiro a partir da tabela quando houver agrupamento ou comparativo valido;
  - depois, em alguns casos, por fallback de `kpis`;
  - `medidor` usa apenas relacao real de valor e limite, como capacidade x ocupado.
- `kpi` e `tabela` continuam existindo; o grafico nao substitui o que ja funcionava.

## Arquivos afetados

- `apps/admin-web/package.json`
- `apps/admin-web/src/reports-builder-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/lib/report-builder-fallback.ts`
- `packages/contracts/src/v1/report-builder.ts`
- `services/api-rest/src/report-builder.ts`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/contracts build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`

## Browser QA

Preview local validado em `http://127.0.0.1:4176/#relatorios` com autenticacao administrativa.

Fluxos conferidos:

- `Receita e servicos` abriu com visual de `barras`
- `Visao mensal` abriu com visual de `linhas`
- `Pagamentos e cobranca` foi trocado para `pizza` no builder e renderizou corretamente
- `Ocultar montagem` continuou escondendo apenas a montagem
- `kpis` e `tabela` seguiram presentes junto do grafico

## Risco residual

- o bundle do `admin-web` cresceu e o `vite build` continua emitindo warning de chunk grande
- alguns modelos do sistema podem continuar abrindo com visual legado se a tab ja estava carregada em sessao anterior; basta reabrir a visao para puxar a definicao atualizada
