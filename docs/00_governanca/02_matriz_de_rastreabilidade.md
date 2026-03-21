# Matriz de Rastreabilidade

| ID | Intencao ou requisito | Origem | Documento oficial | Modulo impactado | Jornada ligada | Backlog ligado | Status atual |
| --- | --- | --- | --- | --- | --- | --- | --- |
| RT-01 | Multi-tenant com slug propria | Ideia | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` | Identidade e tenancy | J-01 | B-01, B-02 | DOCUMENTADO |
| RT-02 | Fluxo publico simples de agendamento | Ideia | `docs/05_jornadas/00_jornadas_core.md` | Booking publico | J-03 | B-05, B-06 | DOCUMENTADO |
| RT-03 | Validacao opcional de pre-pagamento | Ideia | `docs/07_integracoes/00_mapa_de_integracoes.md` | Pagamentos | J-03 | B-08 | IMPLEMENTADO |
| RT-04 | Dashboard operacional de agenda | Briefing | `docs/06_modulos/00_mapa_de_modulos.md` | Operacao | J-04 | B-09 | IMPLEMENTADO |
| RT-05 | Fluxo de caixa ligado a atendimento concluido | Ideia | `docs/06_modulos/00_mapa_de_modulos.md` | Financeiro | J-04 | B-10 | EM FUNDACAO |
| RT-06 | Carteira de clientes e retencao | Briefing | `docs/06_modulos/00_mapa_de_modulos.md` | CRM e Retencao | J-05 | B-10, B-11 | EM FUNDACAO |
| RT-07 | Pesquisa e identidade com wordmark | Pedido do usuario | `docs/04_padroes_ui/01_style_guide.md` | Marca e UX | J-00 | B-03 | DOCUMENTADO |
| RT-08 | Design system antes da arquitetura | Pedido do usuario | `docs/04_padroes_ui/02_design_system.md` | Plataforma inteira | J-00 | B-04 | DOCUMENTADO |
| RT-09 | Stack escolhida por adequacao funcional | Ideia round 3 | `docs/02_fundacoes/00_fundacao_de_produto_e_stack.md` | Plataforma inteira | J-00 | B-01 | DOCUMENTADO |
| RT-10 | Revalidacao continua MAE/MFEE | Pedido do usuario | `docs/08_analises/02_validacao_continua_mae_mfee.md` | Governanca | J-00 | B-12 | DOCUMENTADO |
| RT-11 | Produto com duas visoes complementares: publica e administrativa | Briefing | `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` | Plataforma inteira | J-01, J-03, J-04 | B-07, B-08, B-09 | DOCUMENTADO |
| RT-12 | Relatorios essenciais por periodo no shell admin | Briefing | `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md` | Analytics operacional | J-04, J-05 | B-12 | EM FUNDACAO |
| RT-13 | Builder semantico de relatorios com definicoes versionadas e filtros tipados | Pedido do usuario | `docs/08_analises/64_arquitetura_builder_semantico_relatorios_2026-03-20.md` | Relatorios | J-04, J-05 | B-17, B-18 | DOCUMENTADO |

Legenda de status usada nesta matriz:

- `DOCUMENTADO`: regra existe em documento oficial
- `EM FUNDACAO`: estrutura real iniciada
- `IMPLEMENTADO`: regra existe em codigo e evidencia
