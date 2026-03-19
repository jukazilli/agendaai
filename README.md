# AgendaAI

AgendaAI e um SaaS multi-tenant de agendamentos para negocios de servico com foco em operacao, retencao, recorrencia e receita.

Este repositorio foi estruturado a partir do ciclo:

`Ideia > Briefing > UI/UX Research > Style Guide > Design System > MAE > MFEE > Revalidacao`

## Estado atual

- base documental oficial criada;
- arquitetura macro definida;
- workspace monorepo inicial materializado com `pnpm`;
- backlog fundacional organizado por dependencia;
- build, lint e testes do `api-rest` foram revalidados localmente em `18/03/2026`;
- `booking-web` ja fecha `B-07` no menor corte real;
- `admin-web` saiu do placeholder e agora opera onboarding, slug, Mercado Pago, servicos, profissionais, disponibilidade, agenda operacional com acoes de booking e leitura basica de clientes, mas ainda em shell single-page;
- `B-01` concluido;
- ADR de auth, tenancy e slug publicada;
- `B-03` concluido com tokens e foundations em `packages/ui`;
- `B-04` concluido com schemas versionados em `packages/contracts`;
- `B-05` concluido com runtime multi-tenant em `services/api-rest`;
- `B-06` concluido com profissionais, disponibilidade e slots em `services/api-rest`;
- `B-07` concluido com booking publico por `slug`;
- `B-08` saiu da fundacao e esta em operacao parcial, com `payment intent`, `sync`, webhook Mercado Pago e `booking-web` integrado ao Checkout Pro;
- existe agora uma trilha derivada de beta em `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`.

## Estrutura principal

```text
/apps
/assets
/docs
/infra
/packages
/scripts
/services
/.agents
```

## Leitura recomendada

1. `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
2. `docs/04_padroes_ui/00_ui_ux_research.md`
3. `docs/04_padroes_ui/01_style_guide.md`
4. `docs/04_padroes_ui/02_design_system.md`
5. `docs/08_analises/10_ponto_de_parada_e_plano_2026-03-18.md`
6. `docs/08_analises/12_execucao_b08_fundacao_pagamentos_e_visao_admin.md`
7. `docs/08_analises/13_execucao_b08_shell_admin_operacional.md`
8. `docs/08_analises/14_execucao_b08_checkout_pro_publico.md`
9. `docs/08_analises/15_execucao_b09_agenda_admin_operacional.md`
10. `docs/08_analises/16_raio_x_admin_shell_navegacao_e_inventario_2026-03-18.md`
11. `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
12. `docs/09_sprints/02_desvio_beta_agendaai_2026-03-18.md`
13. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
14. `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`

## Proximo passo recomendado

Materializar o shell admin com navegacao lateral e modulos separados para `dashboard`, `implantacao`, `catalogo`, `profissionais`, `agenda`, `clientes` e `configuracoes`, e em seguida endurecer `B-08` com homologacao real do Mercado Pago e `B-09` com calendario/reagendamento antes de abrir `B-10`.
