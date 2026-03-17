# Raio-X de Aderencia

| Item | Promessa documental | Evidencia real | Status | Gap principal | Acao recomendada |
| --- | --- | --- | --- | --- | --- |
| Ideia consolidada | produto precisa existir como plataforma de retorno | `docs/01_conceito_e_briefing/00_ideia_base.md` | FECHADO | nenhum | manter como base historica |
| Briefing inicial | escopo e publico precisam estar claros | `docs/01_conceito_e_briefing/01_briefing_inicial.md` | FECHADO | nenhum | versionar novas mudancas a partir dele |
| UI/UX Research | direcao visual antes do style guide | `docs/04_padroes_ui/00_ui_ux_research.md` | FECHADO | benchmark externo homologado ainda nao materializado no produto real | materializar a direcao no frontend quando a fundacao comecar |
| Style Guide | identidade com wordmark | `docs/04_padroes_ui/01_style_guide.md` e `apps/marketing-site/src/pages/index.astro` | FECHADO | falta virar componente reutilizavel no frontend futuro | carregar o wordmark para o app real na fundacao |
| Design System | sistema de interface antes de codar | `docs/04_padroes_ui/02_design_system.md` e `packages/ui` | FECHADO | foundations materializadas, mas componentes ainda nao implementados | seguir para componentes base junto da abertura das jornadas reais |
| Contracts compartilhados | schemas versionados de dominio | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`, `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md` e `packages/contracts` | FECHADO | faltam contracts de `payment`, `cash-entry`, `campaign`, `notification` e eventos | usar esta base em `B-07` e trilhas seguintes |
| MAE | arquitetura estrutural precisa existir | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`, `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`, `packages/contracts` e `services/api-rest` | FECHADO | pendencias de providers, eventos, RBAC fino e timezone continuam abertas | seguir para `B-07` e ADRs transversais |
| Estrutura MFEE | arvore documental oficial | pasta `docs/` criada | FECHADO | sprints ainda vazias de execucao | popular a medida que houver entrega |
| Esqueleto de monorepo | projeto precisa ter estrutura inicial | `pnpm-workspace.yaml`, manifests, builds e lints locais | FECHADO | nenhuma lacuna fundacional critica nesta etapa | manter consistencia enquanto os modulos reais avancam |
| Booking publico | fluxo cliente final | scaffold buildavel em `apps/booking-web` + base publica de catalogo, profissionais e slots em `services/api-rest` | PARCIAL | sem jornada real, captura de dados e fechamento da reserva | atacar trilha de booking em `B-07` |
| Backoffice admin | dashboard e operacao | scaffold buildavel em `apps/admin-web` + runtime admin para `services`, `professionals` e disponibilidade | PARCIAL | sem auth integrada ao frontend, shell real e operacao visual | atacar trilha admin apos `B-07` e o dominio core |
| API REST | comandos transacionais | runtime em `services/api-rest` com onboarding, sessao admin, lookup publico por slug, CRUD de `service`, `client`, `professional`, regras de disponibilidade e slots | PARCIAL | faltam booking publico, pagamentos, eventos, timezone canonico e possivel alinhamento final de framework | abrir `B-07` sobre esta base |
| GraphQL BFF | leitura agregada | apenas documentado | NAO IMPLEMENTADO | sem read model | postergar para fase 2 |
| Analytics Python | analise e score | apenas documentado | NAO IMPLEMENTADO | sem pipeline de dados | postergar para fase 2 |
| Integracoes externas | mensagens, pagamentos e calendar | apenas documentado | NAO IMPLEMENTADO | providers indefinidos | fechar selecao de providers |
