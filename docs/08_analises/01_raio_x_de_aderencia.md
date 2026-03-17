# Raio-X de Aderencia

| Item | Promessa documental | Evidencia real | Status | Gap principal | Acao recomendada |
| --- | --- | --- | --- | --- | --- |
| Ideia consolidada | produto precisa existir como plataforma de retorno | `docs/01_conceito_e_briefing/00_ideia_base.md` | FECHADO | nenhum | manter como base historica |
| Briefing inicial | escopo e publico precisam estar claros | `docs/01_conceito_e_briefing/01_briefing_inicial.md` | FECHADO | nenhum | versionar novas mudancas a partir dele |
| UI/UX Research | direcao visual antes do style guide | `docs/04_padroes_ui/00_ui_ux_research.md` | FECHADO | benchmark externo homologado ainda nao materializado no produto real | materializar a direcao no frontend quando a fundacao comecar |
| Style Guide | identidade com wordmark | `docs/04_padroes_ui/01_style_guide.md` e `apps/marketing-site/src/pages/index.astro` | FECHADO | falta virar componente reutilizavel no frontend futuro | carregar o wordmark para o app real na fundacao |
| Design System | sistema de interface antes de codar | `docs/04_padroes_ui/02_design_system.md` e `packages/ui` | FECHADO | foundations materializadas, mas componentes ainda nao implementados | seguir para componentes base junto da abertura das jornadas reais |
| Contracts base | schemas versionados compartilhados | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`, `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md` e `packages/contracts` | FECHADO | faltam contracts de `professional`, `payment`, `cash-entry` e eventos, fora do escopo de `B-04` | usar esta base em `B-05` |
| MAE | arquitetura estrutural precisa existir | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`, `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md` e `packages/contracts` | FECHADO | pendencias de providers e eventos continuam abertas | seguir para `B-05` e ADRs transversais |
| Estrutura MFEE | arvore documental oficial | pasta `docs/` criada | FECHADO | sprints ainda vazias de execucao | popular a medida que houver entrega |
| Esqueleto de monorepo | projeto precisa ter estrutura inicial | `pnpm-workspace.yaml`, manifests, builds e lints locais | FECHADO | nenhuma lacuna fundacional critica nesta etapa | manter consistencia enquanto os modulos reais avancam |
| Booking publico | fluxo cliente final | scaffold buildavel em `apps/booking-web` | PARCIAL | sem jornada real, disponibilidade e fechamento | atacar trilha de booking apos `B-05` e `B-06` |
| Backoffice admin | dashboard e operacao | scaffold buildavel em `apps/admin-web` | PARCIAL | sem auth, shell real e operacao | atacar trilha admin apos `B-05` e o dominio core |
| API REST | comandos transacionais | scaffold buildavel em `services/api-rest` e contracts base em `packages/contracts` | PARCIAL | sem runtime, tenancy e endpoints | iniciar modulo real em `B-05` |
| GraphQL BFF | leitura agregada | apenas documentado | NAO IMPLEMENTADO | sem read model | postergar para fase 2 |
| Analytics Python | analise e score | apenas documentado | NAO IMPLEMENTADO | sem pipeline de dados | postergar para fase 2 |
| Integracoes externas | mensagens, pagamentos e calendar | apenas documentado | NAO IMPLEMENTADO | providers indefinidos | fechar selecao de providers |
