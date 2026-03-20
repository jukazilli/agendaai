# Execucao - Entity View, Document View e Master-Detail no AgendaAI

## 1. Objetivo

Aplicar no `AgendaAI` os conceitos de `entity view`, `document view` e `master-detail` que ja existem no `vello_food`, sem importar a identidade visual do Vello e sem alterar contratos de backend. O corte ficou restrito a:

- `apps/admin-web`
- `apps/booking-web`
- `packages/ui`

## 2. Fontes consultadas

### 2.1 Vello Food

- `C:\projetos\vello_food\packages\entity-ui\src\components\entity-view.tsx`
- `C:\projetos\vello_food\packages\entity-ui\src\components\document.tsx`
- `C:\projetos\vello_food\packages\entity-core\src\index.ts`
- `C:\projetos\vello_food\docs\v2\03_padroes_ui\03_especificacao_das_libs_e_componentes_oficiais_v2.md`
- `C:\projetos\vello_food\apps\backoffice-web\src\app\(dashboard)\admin\users\[userId]\layout.tsx`
- `C:\projetos\vello_food\apps\backoffice-web\src\app\(dashboard)\admin\sales\orders\[id]\page.tsx`

### 2.2 AgendaAI

- `C:\projetos\agendaai\README.md`
- `C:\projetos\agendaai\docs\03_navegacao_e_shell\00_shells_e_rotas_core.md`
- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\04_padroes_ui\02_design_system.md`
- `C:\projetos\agendaai\docs\08_analises\17_admin_shell_referencia_gemini_contratos_e_plano.md`
- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`
- `C:\projetos\agendaai\apps\booking-web\app\[slug]\booking-flow.tsx`
- `C:\projetos\agendaai\apps\booking-web\app\globals.css`
- `C:\projetos\agendaai\packages\ui\src\index.ts`
- `C:\projetos\agendaai\packages\ui\src\foundations.css`

## 3. Regra de precedencia

1. contratos reais e runtime existente do `AgendaAI`;
2. documentacao oficial do `AgendaAI`;
3. implementacao do `vello_food` como referencia conceitual de composicao;
4. detalhes visuais do `AgendaAI` mantidos pela propria paleta/tokens locais.

Ou seja: o Vello foi usado como padrao de estrutura, nao como fonte de verdade funcional nem visual.

## 4. Transplante realizado

## 4.1 Biblioteca compartilhada

Foi criada uma camada adaptada em `packages/ui` com:

- `EntityViewLayout`
- `EntityIdentityCard`
- `EntitySection`
- `EntityAsideSummary`
- `DocumentViewLayout`
- `DocumentHeader`
- `DocumentSummaryCards`
- `DocumentTabs`
- `DocumentTimeline`
- `DocumentImpactPanel`
- `MasterDetailLayout`
- `ViewBadge`

Esses componentes usam tokens e foundations do `AgendaAI`, incluindo suporte a cor dinamica no `booking-web` via `accentColor` do tenant.

## 4.2 Admin Web

### Profissionais

A area de workspace da rota `#profissionais` passou a usar `entity view`:

- identidade operacional do profissional;
- secoes separadas para cadastro base e servicos vinculados;
- resumo lateral com agenda e disponibilidade;
- rodape de acao padronizado.

### Agenda

A visao diaria da rota `#agenda` passou a usar:

- `master-detail` para separar lista de bookings e detalhe contextual;
- `document view` para a booking selecionada;
- reagendamento mantido dentro do detalhe, usando os mesmos slots reais ja existentes.

As views `semana` e `mes` foram preservadas como estavam.

## 4.3 Booking Web

### Jornada principal

O fluxo publico passou a usar `master-detail`:

- coluna principal com a etapa atual;
- coluna lateral com resumo vivo da reserva;
- nenhuma alteracao de contrato na jornada publica.

### Confirmacao e retorno de pagamento

As superficies de:

- reserva confirmada;
- retorno/sincronizacao de pagamento

passaram a usar `document view`, estruturando cabecalho, resumo, timeline e impactos sem reescrever o fluxo real de booking/pagamento.

## 5. Arquivos alterados

- `packages/ui/src/patterns.tsx`
- `packages/ui/src/index.ts`
- `packages/ui/src/foundations.css`
- `packages/ui/package.json`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `apps/booking-web/app/layout.tsx`
- `apps/booking-web/app/[slug]/booking-flow.tsx`
- `apps/booking-web/app/globals.css`
- `apps/booking-web/package.json`
- `pnpm-lock.yaml`

## 6. Validacao executada

- `pnpm --dir c:\projetos\agendaai --filter @agendaai/ui lint`
- `pnpm --dir c:\projetos\agendaai --filter @agendaai/ui build`
- `pnpm --dir c:\projetos\agendaai --filter @agendaai/booking-web lint`
- `pnpm --dir c:\projetos\agendaai --filter @agendaai/booking-web build`
- `pnpm --dir c:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\projetos\agendaai --filter @agendaai/admin-web build`

## 7. Resultado

O `AgendaAI` agora tem uma base de componentes compartilhados para os tres conceitos e ja os aplica em superficies reais dos dois apps-alvo:

- `admin-web`: `entity view`, `document view` e `master-detail`
- `booking-web`: `document view` e `master-detail`

O corte preserva contratos, paleta e runtime atuais, e cria uma base reutilizavel para continuar a padronizacao das demais telas do painel e da jornada publica.
