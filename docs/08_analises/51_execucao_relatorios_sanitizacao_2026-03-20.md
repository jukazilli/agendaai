# 51. Sanitizacao de UI/UX em Relatorios

Data: 20/03/2026  
Escopo: `apps/admin-web`  
Rota: `#relatorios`

## Objetivo

Reduzir a poluicao visual da rota de relatorios e separar melhor o papel gerencial do modulo, evitando mistura entre KPI, contexto tecnico do shell e blocos analiticos concorrentes no mesmo viewport.

## Precedencia usada

1. runtime real da rota `#relatorios`
2. shell oficial em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
3. validacao local por `lint`, `build` e browser QA

## O que mudou

- reorganizacao da tab bar principal em visoes dedicadas:
  - `Visao executiva`
  - `Servicos`
  - `Equipe`
  - `Retorno`
  - `Agenda`
- remocao do `aside` lateral e do painel de impacto textual da rota
- ocultacao do contexto do recorte atras do botao `Contexto`
- reducao do resumo superior para quatro KPI principais:
  - receita reconhecida
  - bookings no periodo
  - ticket medio
  - clientes unicos
- concentracao da leitura executiva em duas secoes:
  - `Saude do periodo`
  - `Retencao no recorte`
- manutencao dos filtros gerenciais no topo, sem levar operacao diaria para dentro do modulo

## Papel final da tela

`Relatorios` fica como modulo de leitura gerencial e comparativa.  
`Agenda`, `Operacao Diaria` e `Clientes` continuam como destinos das acoes operacionais.

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- browser QA local em `http://127.0.0.1:4173/#relatorios`

## Evidencias do browser QA

- a tab bar principal respondeu corretamente em desktop
- o botao `Contexto` exibiu e ocultou o recorte sem disputar a leitura principal
- as tabs `Retorno` e `Agenda` abriram corretamente
- no viewport `390x844`, `document.documentElement.scrollWidth <= window.innerWidth`

## Residuais

- a visao `Agenda` em `Relatorios` ainda concentra radar semanal e leitura mensal na mesma aba; isso continua funcional, mas pode receber uma sub-tab futura se a densidade voltar a crescer
- o console local continua registrando `404` de `favicon.ico`, residual ja conhecido e fora deste corte
