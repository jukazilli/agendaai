# 67. Hardening Builder Relatorios 404 Fallback

Data: `2026-03-21`  
Projeto: `agendaai`  
Modulo: `Relatorios`

## 1. Sintoma observado

Ao entrar em `Relatorios`, o usuario via:

- `Route GET:/v1/admin/report-definitions not found`;
- rota em estado vazio, sem builder util;
- ausencia de opcoes no hover de `Relatorios`;
- percepcao de botoes fora do fluxo visual padrao, porque nenhuma dock tab era aberta.

## 2. Causa raiz

O `admin-web` estava carregando `catalog` e `report-definitions` em `Promise.all`.

Quando o `apiBaseUrl` salvo na sessao apontava para um backend ainda antigo, sem as novas rotas do builder:

- `GET /v1/admin/report-definitions` retornava `404`;
- a carga inteira falhava;
- o frontend zerava `reportsCatalog` e `savedReportDefinitions`;
- o shell lateral ficava sem visoes para abrir;
- a rota permanecia vazia.

## 3. Correcao aplicada

Foram introduzidos tres endurecimentos:

1. fallback local do `catalogo semantico` no frontend quando o backend ainda nao expoe as rotas do builder;
2. tratamento separado para `catalog` e `report-definitions`, sem derrubar o modulo inteiro por um unico `404`;
3. auto-abertura da visao padrao `Visao executiva` ao entrar em `#relatorios`, evitando a tela vazia na primeira entrada.

Tambem foi removida a exposicao do erro cru de rota inexistente para o usuario final, substituindo por mensagem de compatibilidade mais clara quando necessario.

## 4. Arquivos alterados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/lib/report-builder-fallback.ts`

## 5. Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- browser QA em `http://127.0.0.1:4173/#relatorios`

Resultado:

- `Relatorios` entra com `Visao executiva` aberta;
- topbar e acoes do builder aparecem no estado normal;
- nao houve mais erro de console no browser local;
- o flyout lateral de `Relatorios` continua funcional.
