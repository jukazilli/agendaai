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
- `admin-web` agora opera onboarding, slug, Mercado Pago, servicos, profissionais, disponibilidade, agenda operacional com acoes de booking, leitura basica de clientes e visibilidade de `payment intent` dentro de um shell modular com navegacao lateral, dashboard, agenda, catalogo, profissionais, clientes e configuracoes;
- `B-01` concluido;
- ADR de auth, tenancy e slug publicada;
- `B-03` concluido com tokens e foundations em `packages/ui`;
- `B-04` concluido com schemas versionados em `packages/contracts`;
- `B-05` concluido com runtime multi-tenant em `services/api-rest`;
- `B-06` concluido com profissionais, disponibilidade e slots em `services/api-rest`;
- `B-07` concluido com booking publico por `slug`;
- `B-08` ja homologou o caminho real de `checkout_pro`, com `payment intent`, `sync`, callback/retorno publicados e booking confirmada em homologacao;
- `B-09` agora possui timeline diaria, reagendamento por slot real e grade semanal de capacidade no `admin-web`;
- `api-rest`, `booking-web` e `admin-web` ja estao publicados em `Render` + `Vercel`;
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
11. `docs/08_analises/18_execucao_b09_shell_admin_modular_2026-03-19.md`
12. `docs/08_analises/19_execucao_b08_b09_pagamentos_admin_2026-03-19.md`
13. `docs/08_analises/20_execucao_b08_conciliacao_resiliente_2026-03-19.md`
14. `docs/08_analises/21_execucao_b08_homologacao_parcial_mercado_pago_2026-03-19.md`
15. `docs/08_analises/22_preparacao_publicacao_vercel_render_2026-03-19.md`
16. `docs/08_analises/23_execucao_b08_publicacao_e_homologacao_live_2026-03-19.md`
17. `docs/08_analises/24_execucao_b08_homologacao_aprovada_live_2026-03-19.md`
18. `docs/08_analises/25_execucao_b09_agenda_reagendamento_2026-03-19.md`
19. `docs/08_analises/26_execucao_b09_calendario_semanal_capacidade_2026-03-19.md`
20. `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
21. `docs/09_sprints/02_desvio_beta_agendaai_2026-03-18.md`
22. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
23. `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`

## Proximo passo recomendado

Abrir `B-10` com o primeiro reflexo financeiro de atendimento concluido e relatorios essenciais de agenda/receita. Em paralelo, decidir se `checkout_transparente` continua dentro de `B-08` estrutural ou vira trilha propria.
