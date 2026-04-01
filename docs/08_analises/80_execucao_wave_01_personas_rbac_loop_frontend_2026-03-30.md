# 80. Execucao Wave 01 Personas RBAC Loop Frontend 2026-03-30

## Objetivo

Institucionalizar o loop continuo de melhoria de frontend do `AgendaAI` na branch atual, iniciar a `wave 01` e transformar o `admin-web` em um shell orientado por papel antes de redesenhar as telas internas.

## Precedencia de fonte

1. Documentacao do repositorio e contratos.
2. Implementacao atual da branch `feat/admin-web-redesign-foundation`.
3. Search externo apenas para calibrar padroes de permissao, operacao e shell denso.

## Personas e papeis

### Cliente economico

- `Tenant owner / owner-operator`: compra o produto, mede ROI, quer agenda, caixa e retorno do cliente no mesmo sistema.

### Usuarios finais administrativos

- `Owner-operator` -> backend role `owner`
  - Usa dashboard, agenda, financeiro, clientes, configuracoes e relatorios.
  - Precisa publicar o negocio, operar o dia e decidir com velocidade.
- `Manager / front-desk lead` -> backend role `manager`
  - Usa agenda, dashboard, financeiro, clientes, catalogo, profissionais e relatorios.
  - Precisa corrigir o dia, resolver atritos de agenda e manter a operacao fluida sem entrar em governanca sensivel.
- `Finance/admin assistant` -> arquétipo UX dentro de `manager`
  - Usa principalmente financeiro, agenda e leituras rapidas do dashboard.
  - Precisa de browse, documento, baixa, reversao e fechamento sem formularios espalhados.
- `Staff / colaborador` -> backend role `staff`
  - Usa agenda como workspace principal.
  - Precisa localizar booking, atualizar estado e ver contexto basico do cliente sem carregar CRM ou administracao.
- `Public client` -> fora do RBAC administrativo
  - Pertence ao `booking-web`.
  - Precisa de fluxo curto, confiavel e mobile-first.

## Capability matrix adotado

- `owner`
  - Default route: `dashboard`
  - Rotas visiveis: `dashboard`, `financeiro`, `relatorios`, `agenda`, `catalogo`, `profissionais`, `clientes`, `configuracoes`
  - Acoes habilitadas: shell completo
- `manager`
  - Default route: `agenda`
  - Rotas visiveis: `dashboard`, `financeiro`, `relatorios`, `agenda`, `catalogo`, `profissionais`, `clientes`
  - Restricao principal: sem `configuracoes`
- `staff`
  - Default route: `agenda`
  - Rotas visiveis: `agenda`
  - Restricao principal: sem financeiro, clientes completos, relatorios, catalogo, profissionais e configuracoes

## Backlog priorizado por onda

1. `Wave 01` Personas + capability matrix + regras de navegacao
   - Status: `active`
   - Score alvo: confusao 5, frequencia 5, impacto 5, dependencia 5
2. `Wave 02` Dashboard owner cockpit cashflow-first
3. `Wave 03` Agenda operacional com calendario dominante
4. `Wave 04` Financeiro browse + documento
5. `Wave 05` Clientes master-detail CRM basico
6. `Wave 06` Catalogo com browse denso e popup de registro
7. `Wave 07` Profissionais com frentes dedicadas
8. `Wave 08` Relatorios com builder e dock tabs
9. `Wave 09` Booking publico apos estabilizar o admin

## Search log

### Contexto interno lido

- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/04_padroes_ui/00_ui_ux_research.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `packages/contracts/src/identity.ts`
- `apps/admin-web/src/App.tsx`

### Referencias externas usadas para calibracao

- Square Support:
  - https://squareup.com/help/us/en/article/5350-create-staff-member-profiles-for-square-appointments
  - https://squareup.com/help/us/en/article/5822-employee-permissions
  - https://squareup.com/help/us/en/article/8443-manage-staff-schedules-and-availability-with-square-appointments
- Mindbody:
  - https://www.mindbodyonline.com/business/staff-management
  - https://www.mindbodyonline.com/business/education/blog/studios-salons-spas-use-mindbody
  - https://www.mindbodyonline.com/business/education/blog/studios-salons-spas-customize-mindbody
- TOTVS Protheus:
  - https://centraldeatendimento.totvs.com/hc/pt-br/articles/360033892693-RH-Linha-Protheus-MEU-RH-Configura%C3%A7%C3%A3o-de-permiss%C3%A3o-de-acesso-as-funcionalidades-e-menu-do-MEU-RH
  - https://centraldeatendimento.totvs.com/hc/pt-br/articles/360013342191-RH-Linha-Protheus-GPE-Como-excluir-ou-incluir-rotinas-no-menu
  - https://tdn.totvs.com/x/VUBtDQ

### Leitura sintetizada do search

- Square confirma o valor de permission sets separados para `service provider`, `front desk` e `manager`, com acesso diferente a calendario, clientes e dashboard.
- Mindbody reforca a tese de esconder ou compartilhar informacao sensivel por papel, deixando pagamentos e relatorios com cargos mais altos e operacao diaria com perfis de front desk e providers.
- TOTVS Protheus continua sendo uma referencia valida para menu orientado por rotina, permissao por funcionalidade e exposicao controlada de itens de menu.

## Teoria ativa da wave 01

- Persona alvo: `owner-operator`, `manager-front-desk`, `staff-collaborator`
- Trabalho principal da tela: abrir cada usuario no workspace certo e remover ruido estrutural antes de mexer nas telas internas
- Falha atual: o shell trata os papeis como um unico operador, o que mistura cockpit, operacao e administracao sensivel
- Padrao escolhido: `capability matrix local + route visibility + action availability + default route por papel + simulacao DEV`
- Criterios de aceite:
  - `owner` continua com shell completo
  - `manager` perde configuracoes sensiveis, mas mantem operacao e leitura gerencial
  - `staff` entra em agenda e nao ve modulos administrativos
  - a navegacao nao exibe acao sem permissao
  - o papel efetivo pode ser lido e simulado em `DEV`

## Implementacao aplicada

- Novo arquivo `apps/admin-web/src/admin-shell-config.ts`
  - centraliza `AdminRoute`, `AdminRouteDefinition`, `PersonaBlueprint`, `AdminRouteVisibilityRule`, `AdminActionRule` e `RoleCapabilityMatrix`
  - define matriz de visibilidade e acoes por `owner`, `manager` e `staff`
- Novo arquivo `apps/admin-web/src/admin-improvement-loop.ts`
  - formaliza `ImprovementTask`, `TheoryRecord` e `ValidationRecord`
  - registra backlog por onda e baseline do loop continuo
- `apps/admin-web/src/App.tsx`
  - passa a ler `bootstrap.session.claims.role`
  - aplica filtragem de rotas e abas abertas pelo papel efetivo
  - protege `navigateTo` com fallback para a rota padrao do papel
  - esconde acoes de shell sem permissao
  - adiciona simulacao de papel em `DEV` com persistencia local
  - exibe papel efetivo no shell e no painel de contexto
- `apps/admin-web/src/styles.css`
  - adiciona estilo do simulador de papel do shell

## Validacao

- `Docs`: concluido
- `Search`: concluido
- `Lint`: concluido
  - `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `Build`: concluido
  - `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
  - Warning mantido: bundle principal acima de `500 kB`
- `Browser QA`: concluido
  - Runtime local validado com `api-rest` em `http://127.0.0.1:3333` e `admin-web` em `http://localhost:5173`
  - Fluxo usado: onboarding de tenant `studio-navegacao-qa` -> owner -> override `manager` -> override `staff`
  - Evidencias confirmadas:
    - `owner` com shell completo e `dashboard` como landing
    - `manager` sem `configuracoes`, mantendo `dashboard`, `financeiro`, `relatorios`, `agenda`, `catalogo`, `profissionais` e `clientes`
    - `manager` e `staff` passam a cair em `agenda` quando nao existe hash explicita
    - `staff` fica somente com `agenda`, sem busca global de clientes e sem administracao
  - Ruidos antigos observados no console:
    - `favicon.ico` 404 no dev server
    - 401s de bootstrap antes do login efetivo

## Decisoes aceitas

- Manter o backend com `owner | manager | staff`.
- Tratar `finance/admin/front-desk` como arquétipos UX sobre `manager`, e nao como novos papéis de API.
- Usar `agenda` como rota padrao de `manager` e `staff`.
- Permitir simulacao apenas em `DEV`, sem contaminar producao nem contratos.

## Decisoes rejeitadas

- Criar novos papéis no backend antes de estabilizar a navegacao.
- Reescrever o `admin-web` do zero nesta etapa.
- Levar `booking-web` junto nesta primeira onda antes de estabilizar o shell administrativo.
