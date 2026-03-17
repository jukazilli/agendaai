# AgendaAI

AgendaAI e um SaaS multi-tenant de agendamentos para negocios de servico com foco em operacao, retencao, recorrencia e receita.

Este repositorio foi estruturado a partir do ciclo:

`Ideia > Briefing > UI/UX Research > Style Guide > Design System > MAE > MFEE > Revalidacao`

## Estado atual

- base documental oficial criada;
- arquitetura macro definida;
- workspace monorepo inicial materializado com `pnpm`;
- backlog fundacional organizado por dependencia;
- `admin-web`, `booking-web`, `marketing-site`, packages e services ja buildam localmente;
- `B-01` concluido;
- ADR de auth, tenancy e slug publicada;
- `B-03` concluido com tokens e foundations em `packages/ui`;
- `B-04` concluido com schemas versionados em `packages/contracts`;
- `B-05` agora e a proxima frente estrutural.

## Estrutura principal

```text
/apps
/assets
/docs
/infra
/packages
/scripts
/services
```

## Leitura recomendada

1. `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
2. `docs/04_padroes_ui/00_ui_ux_research.md`
3. `docs/04_padroes_ui/01_style_guide.md`
4. `docs/04_padroes_ui/02_design_system.md`
5. `docs/08_analises/01_raio_x_de_aderencia.md`
6. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`

## Proximo passo recomendado

Abrir `B-05` para implementar `api-rest` com tenancy em cima dos contracts e schemas base ja materializados.
