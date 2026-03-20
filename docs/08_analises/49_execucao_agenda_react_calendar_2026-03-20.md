# 49. Execucao UI/UX Agenda React Calendar - 20/03/2026

## Objetivo

Sanitizar a rota `Agenda / calendario` do `admin-web`, separando leitura operacional de leitura gerencial, implantando calendario React real e movendo capacidade agregada para `Relatorios`.

## Precedencia aplicada

1. runtime real do `admin-web`;
2. regra oficial do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`;
3. avaliacao de bibliotecas de calendario em `docs/08_analises/44_avaliacao_bibliotecas_calendario_agendaai_2026-03-20.md`.

## Decisao tecnica

- `react-big-calendar` adotado nesta etapa por aderir ao corte documentado para agenda densa sem depender de licenca premium;
- agenda passou a operar com tab bar responsiva em dois niveis:
  - `Lista` para acao operacional do dia;
  - `Agenda` para calendario React;
  - dentro de `Agenda`: `Dia`, `Semana` e `Mes`;
- clique em booking ou evento abre o detalhe documental completo da booking na mesma rota;
- capacidade semanal e mensal saiu da agenda e entrou em `Relatorios > Insights da agenda`.

## Mudancas materializadas

- `apps/admin-web/src/App.tsx`
  - importacao e configuracao do `react-big-calendar`;
  - nova composicao da rota `agenda` com `Lista` e `Agenda`;
  - detalhe documental reutilizavel da booking;
  - `Relatorios` reorganizado com tabs `Servicos e equipe`, `Retorno` e `Insights da agenda`;
  - ajuste de hand-off: abrir booking leva para a agenda operacional em formato adequado;
  - descricoes de rota do shell atualizadas no proprio runtime.
- `apps/admin-web/src/styles.css`
  - estilos da agenda React;
  - tab bars responsivas;
  - shell visual dos insights em relatorios;
  - ajustes mobile sem overflow horizontal.
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
  - papel da agenda redefinido como operacional;
  - papel de `Relatorios` atualizado para absorver capacidade agregada.

## Validacao

### Build e tipo

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Ambos passaram em `20/03/2026`.

### Browser QA

Preview local validado em `http://127.0.0.1:4173` em `20/03/2026`.

Checks concluidos:

- rota `#agenda` abriu com nova estrutura operacional;
- tab bar `Lista / Agenda` funcional;
- subtab bar `Dia / Semana / Mes` funcional dentro do calendario React;
- clique em evento no calendario atualizou detalhe completo da booking;
- rota `#relatorios` abriu com tab `Insights da agenda`;
- botao `Abrir agenda` no insight fez hand-off para a agenda semanal;
- viewport `390x844` sem overflow horizontal em `#agenda` e `#relatorios`;
- sidebar permaneceu recolhida fora da tela no breakpoint compacto.

## Residual conhecido

- permanece codigo legado de agenda antiga no arquivo `App.tsx`, mas fora do fluxo ativo desta rota;
- `favicon.ico` segue respondendo `404` no runtime local, sem relacao com este corte;
- o bundle do `admin-web` em producao emite warning de chunk acima de `500 kB`, sem falha de build.
