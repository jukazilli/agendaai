# 74. Execucao UI/UX - Relatorios com UI enxuta e relacoes literais

Data: `2026-03-21`
Modulo: `apps/admin-web`
Rota: `#relatorios`

## Objetivo

Refinar `Relatorios` sem mexer na fundacao do builder:

- retirar o hero textual grande;
- priorizar `dock tabs`, acoes e resultado;
- mover a montagem para faixas horizontais compactas;
- manter `ocultar montagem` escondendo apenas o builder;
- esconder `right` da experiencia v1;
- reforcar linguagem literal na UI.

## Precedencia usada

1. Implementacao real do `reports-builder-workspace.tsx`
2. Regra oficial do shell em `01_admin_shell_e_inventario_de_telas.md`
3. Feedback visual direto do usuario no runtime

## Decisao aplicada

- `Relatorios` deixa de abrir com hero local alto e passa a operar com:
  - `dock tabs`;
  - barra curta de acoes;
  - montagem inline do relatorio;
  - resultado dominante no stage.
- `Expressao literal` continua visivel, mas em cartao compacto.
- `Detalhes tecnicos` continuam disponiveis, porem recolhidos por padrao.
- relacoes expostas na UI v1:
  - `Somente quando houver vinculo`
  - `Manter o item principal mesmo sem vinculo`
- `right` fica fora da interface, mesmo que o contrato ainda aceite compatibilidade mais ampla.

## Arquivos afetados

- `apps/admin-web/src/reports-builder-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/lib/report-builder-fallback.ts`
- `services/api-rest/src/report-builder.ts`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao esperada

- `Relatorios` abre sem hero textual grande;
- `dock tabs` continuam funcionando;
- `Ocultar montagem` nao esconde o resultado;
- `Objeto de negocio` continua por lookup com lupa;
- `Modelos salvos` continuam abrindo `modelos do sistema` e `modelos salvos`;
- a UI nao exibe `right` como modo de relacao.
