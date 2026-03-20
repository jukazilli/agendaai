# 55. Execucao shell remove hero legado nas rotas autenticadas

Data: 20/03/2026

## Objetivo

Remover a camada redundante de `hero` do shell autenticado nas rotas que ja possuem layout proprio (`document view`, `entity view` e `master-detail`), preservando apenas contexto global no chrome.

## Base consultada

Documentacao:

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

Codigo:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Decisao

O shell autenticado nao precisa repetir `eyebrow`, `title` e `description` acima de rotas que ja materializam isso no proprio layout. O controle global que ainda fazia sentido no hero (`Atualizar` e `Sair`) foi absorvido pelo disclosure de `Contexto`.

## Execucao

- o bloco `admin-page-hero` foi removido do shell autenticado;
- `Atualizar painel` e `Sair` foram adicionados ao sheet `Contexto do tenant`;
- o CSS morto do hero legado foi removido;
- o inventario oficial do shell passou a registrar explicitamente que rotas autenticadas com layout proprio nao recebem segundo hero.

## Validacao

Comandos:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA:

- `#dashboard`
- `#clientes`
- `#configuracoes`
- validacao do sheet `Contexto` com `Atualizar painel` e `Sair`

Resultado:

- `lint` passou;
- `build` passou;
- as rotas abriram direto no layout principal, sem a camada extra do hero legado;
- o shell manteve acoes globais sem poluir o topo.
