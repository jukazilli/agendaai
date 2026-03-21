# 72. Execucao UI/UX — Relatorios com builder em header sticky

Data: 2026-03-21
Escopo: `apps/admin-web`
Rota: `#relatorios`

## Objetivo

Refinar a experiencia do builder de `Relatorios` sem remover funcionalidade:

- evitar que o builder lateral continue espremendo a area do resultado;
- manter `dock tabs`, filtros por modal, modelos salvos, salvar modelo e executar;
- garantir que `Ocultar builder` esconda apenas a area de montagem;
- manter o contexto da consulta visivel durante a rolagem.

## Precedencia aplicada

1. Implementacao real do `reports-builder-workspace.tsx`
2. Regra canonica do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
3. Referencia visual enviada pelo usuario nesta rodada

## Decisao

O builder nao foi reescrito. A implementacao existente foi preservada e reorganizada visualmente:

- `topbar` do modulo passou a operar em modo `sticky`;
- `dock tabs` tambem ficaram `sticky`, logo abaixo da topbar;
- o painel de montagem deixou de disputar largura com o resultado e passou a operar em largura total;
- a composicao do builder foi reorganizada em `faixas`:
  - `Definicao` em linha inteira;
  - `Filtros do contexto` e `Ordenacao` em superficies lado a lado;
- `Ocultar builder` continua escondendo apenas o painel de montagem, preservando tabs e resultado.

## Arquivos alterados

- `apps/admin-web/src/reports-builder-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao

Executado:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA:

- preview local em `http://127.0.0.1:4174/#relatorios`
- login administrativo com backend publicado
- abertura de `Visao executiva`
- validacao de rolagem com header sticky
- validacao de `Ocultar builder` mantendo a dock tab e o painel de resultado visiveis

## Resultado

O modulo ficou mais legivel e com mais area util para o relatorio, sem perder:

- builder semantico;
- filtros por modal;
- lookup por lupa;
- modelos salvos;
- salvar modelo;
- executar;
- dock tabs dedicadas.

## Residual

- o `admin-web` continua emitindo warning de chunk grande no `build`;
- a proxima onda continua sendo a fase 2 estrutural de `Catalogo` e `Profissionais`.
