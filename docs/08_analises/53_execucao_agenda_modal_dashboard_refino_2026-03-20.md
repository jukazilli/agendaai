# 53. Execucao UI/UX agenda modal e refinamento residual do dashboard

Data: 20/03/2026

## Objetivo

Fechar dois pontos do `admin-web`:

1. trocar o detalhe lateral da rota `Agenda / calendario` por modal operacional sem perder o reagendamento por slot real;
2. revisar a densidade residual do `Dashboard`, reduzindo empilhamento nas abas que ainda estavam longas demais.

## Base de decisao

Documentacao consultada:

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

Codigo consultado:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

Precedencia aplicada:

1. inventario oficial do shell para papel de cada tela;
2. implementacao real do `admin-web` como fonte de verdade do runtime;
3. QA no browser local para validar a materializacao.

## Execucao

### Agenda

- o clique em item da `Lista` e em evento do calendario passou a abrir `modal` com o `document view` completo da booking;
- o detalhe fixo da direita foi removido de `lista` e `agenda`, deixando a superficie operacional mais limpa;
- o modal reutiliza o mesmo documento operacional da booking, incluindo contexto, pagamento e reagendamento por slot real.

### Dashboard

- a aba `Resumo executivo` passou a distribuir grafico principal e feed recente em `grid` dedicada;
- a aba `Radar da semana` passou a separar `capacidade por dia` e `carga por profissional` em superficies irmas, em vez de uma pilha longa;
- a aba `Acessos rapidos` passou a distribuir `Base real do tenant` e `Acessos rapidos` em duas superficies dedicadas;
- o topo do shell deixou de repetir a `eyebrow` no `Dashboard`, reduzindo ruido visual.

## Consistencia documental

O inventario oficial foi atualizado para refletir:

- detalhe da booking na agenda abrindo em modal operacional;
- uso de grids dedicadas dentro das visoes do dashboard para evitar colunas longas e densas.

## Validacao

Comandos executados:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA local:

- `Agenda / calendario` em `http://localhost:5174/#agenda`
- `Dashboard` em `http://localhost:5174/#dashboard`
- validacao de modal de booking em desktop e mobile `390x844`
- validacao de overflow horizontal em agenda e dashboard mobile

Resultado:

- `lint` passou;
- `build` passou;
- modal de detalhe da booking abriu corretamente ao clicar no agendamento;
- `dashboard` continuou funcional com abas responsivas e sem overflow horizontal no mobile.

## Residual

- o build continua emitindo `warning` de chunk grande no `admin-web`;
- o preview local para QA foi levantado em runtime e gera logs em `.runtime/playwright-qa/`.
