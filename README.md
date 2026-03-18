# AgendaAI

AgendaAI e um SaaS multi-tenant de agendamentos para negocios de servico com foco em operacao, retencao, recorrencia e receita.

Este repositorio foi estruturado a partir do ciclo:

`Ideia > Briefing > UI/UX Research > Style Guide > Design System > MAE > MFEE > Revalidacao`

## Estado atual

- base documental oficial criada;
- arquitetura macro definida;
- workspace monorepo inicial materializado com `pnpm`;
- backlog fundacional organizado por dependencia;
- build, lint e testes do `api-rest` foram revalidados localmente em `17/03/2026`;
- `admin-web` e `booking-web` existem, mas ainda sao superficies parciais;
- `B-01` concluido;
- ADR de auth, tenancy e slug publicada;
- `B-03` concluido com tokens e foundations em `packages/ui`;
- `B-04` concluido com schemas versionados em `packages/contracts`;
- `B-05` concluido com runtime multi-tenant em `services/api-rest`;
- `B-06` concluido com profissionais, disponibilidade e slots em `services/api-rest`;
- `B-07` agora e a proxima frente estrutural.

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
6. `docs/00_governanca/04_modelo_operacional_multiagente.md`
7. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`

## Proximo passo recomendado

Abrir `B-07` para implementar o booking publico em cima do catalogo, equipe e slots ja materializados, usando a camada `.agents/` e o contrato ativo do corte.
