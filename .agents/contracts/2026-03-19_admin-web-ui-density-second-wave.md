# Contrato de Corte - Admin Web UI Density Second Wave

## Identificacao

- backlog: BA-04, BA-11, BA-12 e continuidade da execucao visual registrada em `docs/08_analises/34_execucao_uiux_shell_admin_referencia_2026-03-19.md`
- jornada: shell administrativo do `admin-web`
- data: 2026-03-19
- objetivo do dia: corrigir densidade, composicao e hierarquia visual de `catalogo`, `profissionais`, `clientes` e `relatorios` sem reabrir contratos nem reescrever o shell

## Objetivo

- o que entra:
  - refinamento visual das quatro telas restantes do `admin-web`;
  - reorganizacao de layout, cards, listas, filtros e paineis laterais;
  - ajuste de espacamento, tamanhos, hierarquia tipografica e estados vazios para uma experiencia mais compacta e funcional
- o que explicitamente nao entra:
  - mudancas de backend, contratos ou rotas;
  - reescrita global do shell, onboarding ou agenda operacional;
  - novos modulos fora das telas listadas

## Problema

- lacuna a fechar:
  - as telas remanescentes herdaram apenas a casca visual nova e seguem com componentes grandes, blocos genéricos e baixa densidade operacional
- impacto cruzado:
  - precisa manter consistencia com shell, dashboard, operacao diaria e configuracoes ja transplantados

## Restricoes

- tecnicas:
  - preservar `apps/admin-web/src/App.tsx` e `apps/admin-web/src/lib/admin-api.ts` como runtime real;
  - nao mudar contratos nem fetches;
  - manter responsividade desktop/mobile
- documentais:
  - respeitar `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md` e `docs/04_padroes_ui/02_design_system.md`
- de sequencia:
  - pesquisar referencia compacta antes da edicao;
  - validar localmente com lint e build depois da integracao

## Squads autorizados

- supervisor / arquiteto: agente principal
- research: explorer dedicado a hotspots visuais e referencias
- backend core: nao autorizado
- frontend booking: nao autorizado
- frontend admin: agente principal
- docs / audit: agente principal ou squad documental dedicado, se necessario
- integrador: agente principal
- qa / verification: squad dedicado sem editar runtime

## `Write set` por squad

- research:
  - sem escrita em runtime
- backend core:
  - proibido
- frontend booking:
  - proibido
- frontend admin:
  - `apps/admin-web/src/App.tsx`
  - `apps/admin-web/src/styles.css`
- docs / audit:
  - `docs/08_analises/*`
  - `docs/11_auditoria/*`
  - `README.md`
- qa / verification:
  - sem escrita em runtime

## Entradas obrigatorias

- docs:
  - `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
  - `docs/04_padroes_ui/02_design_system.md`
  - `docs/08_analises/34_execucao_uiux_shell_admin_referencia_2026-03-19.md`
- codigo:
  - `apps/admin-web/src/App.tsx`
  - `apps/admin-web/src/styles.css`
- referencias externas permitidas:
  - referencias visuais compactas de dashboard/listagem admin usadas apenas como guia de hierarquia e densidade

## Definition of Done

- backend:
  - nenhuma alteracao
- frontend:
  - `catalogo`, `profissionais`, `clientes` e `relatorios` ficam visualmente mais compactos, com hierarquia clara e sem componentes gigantes ou grudados;
  - contratos, filtros e acoes reais permanecem intactos
- docs:
  - registrar a rodada e atualizar o status do corte visual
- validacao:
  - `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
  - `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`

## Validacao obrigatoria

- comandos:
  - `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
  - `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`
- jornadas:
  - navegar por `#catalogo`, `#profissionais`, `#clientes` e `#relatorios`
- evidencias:
  - diff concentrado nas telas alvo;
  - validacao local concluida;
  - registro documental minimo da rodada

## Decisoes travadas antes da execucao

- preservar shell, rotas e contratos reais;
- atacar densidade e composicao das telas restantes em vez de reabrir dashboard ou sidebar

## Decisoes conscientemente adiadas

- relatorios avancados, cohort, WhatsApp e excecoes de calendario continuam fora do corte
