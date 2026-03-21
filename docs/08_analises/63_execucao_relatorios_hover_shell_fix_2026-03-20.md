# 63. Execucao Relatorios Hover Shell Fix

Data: `2026-03-20`
Modulo: `Relatorios`
Superficie: `apps/admin-web`

## Contexto

Depois da rodada anterior, a regra documental dizia que o desktop deveria abrir as visoes de `Relatorios` por hover no item lateral do shell. No runtime real, o usuario ainda via apenas o tooltip nativo do botao e nao o flyout com as opcoes.

## Diagnostico

- o flyout dependia de estado React (`isSidebarReportsFlyoutOpen`) para montar;
- no browser real, o estado nao estava materializando o painel de forma confiavel no hover inicial do item lateral;
- como efeito, a acao parecia ausente mesmo com a intencao de UX ja implementada.

## Correcao aplicada

- o flyout passou a ficar sempre montado no desktop;
- a exibicao passou a ser controlada por CSS no proprio shell, via `:hover` e `:focus-within`;
- isso elimina a dependencia do estado transitorio para um comportamento que pertence ao rail lateral.

## Arquivos alterados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- browser QA em `http://localhost:5173/#relatorios`

## Resultado observado

- hover em `Relatorios` no shell agora abre o flyout com:
  - `Visao executiva`
  - `Receita e servicos`
  - `Equipe e produtividade`
  - `Pendencias operacionais`
  - `Retorno e retencao`
  - `Radar semanal`
  - `Visao mensal`
- a tela interna continua sem menu redundante no desktop;
- o fallback compacto continua valido para viewport sem hover.
