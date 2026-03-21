# 61. Execucao UIUX Relatorios Hover e Filtros por Visao

Data: 20/03/2026  
Projeto: `agendaai`  
Superficie: `apps/admin-web`  
Modulo: `Relatorios`

## 1. Objetivo

Ajustar o workspace de `Relatorios` para:

- abrir as visoes por hover, sem depender do clique em `Abrir visoes`;
- remover a faixa fixa de filtros do topo;
- mover a filtragem para um modal proprio por visao;
- permitir lookup por nome, telefone e identificador atual do registro, sem inventar novos campos no backend.

## 2. Fonte de verdade usada

Precedencia aplicada:

1. backend real e contratos existentes;
2. shell oficial em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`;
3. mock enviado pelo usuario para composicao visual do workspace.

Arquivos verificados:

- `packages/contracts/src/v1/reporting.ts`
- `services/api-rest/src/reporting-read-model.ts`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/reports-workspace.tsx`
- `apps/admin-web/src/styles.css`

## 3. Decisao estrutural

- o backend continua mandando na verdade dos dados;
- a UI nao ganhou `codigo` persistido novo para `servico`, `profissional` ou `cliente`, porque esse campo nao existe hoje nos contratos;
- os lookups do modal usam `nome + id curto` para servicos e profissionais, e `nome + telefone` para clientes;
- filtros detalhados continuam respeitando os dados reais carregados pelo runtime e pela leitura administrativa existente.

## 4. Implementacao

### 4.1 Menu de visoes

- `Visoes` agora abre por hover no workspace de relatorios;
- o clique continua existindo como fallback para interacao direta;
- o menu continua abrindo as abas reais do modulo.

Arquivo:

- `apps/admin-web/src/reports-workspace.tsx`

### 4.2 Filtros por visao

- a antiga faixa fixa de `recorte`, `servico`, `profissional` e `janela de retorno` saiu do topo;
- cada visao passou a exibir seu proprio botao `Filtrar`;
- o botao abre um modal com campos especificos por contexto;
- exemplos de campos usados:
  - `Data de`
  - `Ate data`
  - `Do servico`
  - `Ate o servico`
  - `Do profissional`
  - `Ate o profissional`
  - `Cliente`
  - `Janela de retorno`

Arquivos:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/reports-workspace.tsx`
- `apps/admin-web/src/styles.css`

## 5. Validacao

Validacoes executadas:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA em `20/03/2026`:

- rota `http://localhost:5173/#relatorios`
- hover em `Visoes` abriu o menu sem clique;
- a faixa fixa de filtros nao apareceu mais no topo;
- `Visao executiva` exibiu modal de filtros e aplicou lookup por servico + janela de retorno;
- `Retorno e retencao` exibiu modal proprio com lookup de cliente;
- nenhuma quebra estrutural foi observada na rota.

Residual conhecido:

- `favicon.ico` continua respondendo `404` no ambiente local;
- o modulo ainda carrega legado morto abaixo do retorno novo em `renderReportsViewV2`, sem efeito funcional nesta rodada.
