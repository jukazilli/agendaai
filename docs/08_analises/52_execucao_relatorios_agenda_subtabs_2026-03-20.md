# 52. Relatorios: subtabs dedicadas para Agenda

Data: 20/03/2026  
Escopo: `apps/admin-web`  
Rota: `#relatorios`

## Objetivo

Fechar a densidade restante da aba `Agenda` em `Relatorios`, separando `Radar da semana` e `Leitura do mes` em sub-visoes dedicadas, em vez de manter as duas leituras empilhadas na mesma superficie.

## Documentacao consultada

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Codigo verificado

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Precedencia aplicada

1. shell oficial documentado
2. implementacao ativa de `renderReportsViewV2()`
3. browser QA local

## O que mudou

- adicao de sub-tab bar dentro de `Relatorios > Agenda`
- separacao entre:
  - `Radar da semana`
  - `Leitura do mes`
- cada sub-visao passou a renderizar apenas seu proprio bloco gerencial
- os hand-offs para `Agenda / calendario` continuam preservados:
  - semanal abre a agenda em `week`
  - mensal abre a agenda em `month`

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- browser QA local em `http://127.0.0.1:4173/?fresh=52#relatorios`

## Evidencias

- a tab principal `Agenda` exibiu as subtabs `Radar da semana` e `Leitura do mes`
- a troca entre subtabs foi refletida no DOM e no snapshot do browser
- em `390x844`, `document.documentElement.scrollWidth <= window.innerWidth`

## Resultado

`Relatorios > Agenda` deixa de concentrar duas leituras gerenciais concorrentes na mesma aba.  
O modulo continua analitico, com filtros preservados, e a `Agenda` operacional continua sendo o destino correto para acao.
