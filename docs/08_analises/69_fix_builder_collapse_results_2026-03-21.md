# 69. Fix `Ocultar builder` sem esconder o relatorio aberto

Data: 2026-03-21

## Contexto

No builder semantico de `Relatorios`, o comando `Ocultar builder` precisava recolher apenas a coluna de configuracao, mantendo:

- dock tab aberta;
- cabecalho do relatorio ativo;
- preview/resultado do relatorio.

No runtime real, o layout colapsado deixava o painel de resultado com largura residual e a tela aparentava ficar em branco.

## Causa

O CSS do workspace combinava:

- `grid-template-columns: 0 minmax(0, 1fr)` no estado colapsado;
- `grid-column: 2` fixo para `.reports-builder-results-panel`.

Quando o builder era ocultado, o browser mantinha uma coluna implicita para o painel de resultado e o componente acabava renderizado fora da largura util ou com largura residual.

## Correcao aplicada

Arquivo afetado:

- `apps/admin-web/src/styles.css`

Mudancas:

1. `reports-builder-workspace.is-collapsed` passou a usar uma unica coluna:
   - `grid-template-columns: minmax(0, 1fr);`

2. No estado colapsado, o painel de resultado passa a ocupar explicitamente a coluna `1`:
   - `.reports-builder-workspace.is-collapsed .reports-builder-results-panel { grid-column: 1; }`

3. O painel de resultado ganhou `min-width: 0` para evitar estouro e garantir distribuicao correta da largura.

## Validacao

Validacoes executadas:

- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/admin-web build`
- Browser QA em `http://127.0.0.1:5173/#relatorios`

Resultado observado:

- `Mostrar builder` / `Ocultar builder` continuam funcionando;
- a dock tab permanece aberta;
- o painel do relatorio ativo continua visivel quando o builder e recolhido;
- o modulo deixou de ficar com area branca no estado colapsado.
