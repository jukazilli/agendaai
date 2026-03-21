# 62. Execucao Relatorios Shell Hover e Lookup Popup

Data: 20/03/2026  
Projeto: `agendaai`  
Superficie: `apps/admin-web`  
Modulo: `Relatorios`

## 1. Objetivo

Fechar dois ajustes de UX no modulo de `Relatorios`:

- mover a abertura das visoes para o hover do item lateral `Relatorios`, aproximando o shell do comportamento visto na referencia do MoveDesk;
- transformar campos de lookup do modal de filtros em consulta com lupa e popup tabular.

## 2. Fonte de verdade

Precedencia aplicada:

1. backend real e contratos existentes;
2. shell oficial em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`;
3. referencia visual enviada pelo usuario.

## 3. Decisoes tomadas

- o menu de visoes deixou de ser o mecanismo primario dentro da tela no desktop;
- a descoberta das visoes passou para o item lateral `Relatorios`;
- a rota continua exibindo as abas abertas do workspace, mas nao carrega mais o botao `Visoes` como CTA principal no desktop;
- em modo compacto, o disclosure interno continua como fallback porque o shell mobile nao possui hover;
- lookups dos filtros agora exigem clique explicito na lupa para abrir a consulta;
- como o backend ainda nao modela `codigo` persistido proprio para `servicos`, `profissionais` e `clientes`, a coluna `codigo` da consulta usa o identificador atual resumido.

## 4. Implementacao

Arquivos alterados:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/reports-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

### 4.1 Shell lateral

- hover no item `Relatorios` do rail lateral agora abre um flyout com:
  - `Visao executiva`
  - `Receita e servicos`
  - `Equipe e produtividade`
  - `Retorno e retencao`
  - `Radar semanal`
  - `Visao mensal`
  - `Pendencias operacionais`
- ao clicar em uma opcao, o sistema:
  - abre a tab do report no workspace local;
  - navega para a rota `#relatorios`;
  - fecha o flyout.

### 4.2 Lookup popup

- campos `Do servico`, `Ate o servico`, `Do profissional`, `Ate o profissional` e `Cliente` agora exibem icone de lupa;
- a lupa abre um popup lateral dentro do modal de filtros;
- a consulta mostra tabela aderente ao tipo:
  - servicos: `Codigo`, `Descricao`
  - profissionais: `Codigo`, `Nome`
  - clientes: `Codigo`, `Nome`, `Telefone`
- selecionar uma linha preenche o filtro atual e fecha a consulta.

## 5. Validacao

Validacoes executadas:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA:

- rota de partida `http://localhost:5173/#dashboard`
- hover no item lateral `Relatorios` abriu o flyout com as visoes disponiveis;
- clique em `Retorno e retencao` abriu a rota `#relatorios` com a dockview correta;
- o botao `Visoes` deixou de aparecer como CTA interno no desktop;
- no modal `Filtrar`, a lupa do campo `Cliente` abriu a consulta tabular;
- a consulta exibiu colunas `Codigo`, `Nome` e `Telefone`;
- selecionar `Cliente Balcao QA` preencheu o campo e os filtros aplicados refletiram na leitura da aba.

Residual conhecido:

- continua o `404` de `favicon.ico` no ambiente local;
- o build ainda alerta sobre chunk grande, sem relacao direta com este corte.
