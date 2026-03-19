# Shells e Rotas Core

## 1. Shell publico

Padrao:

- topo simples com marca do tenant;
- stepper de booking;
- barra de progresso da jornada;
- resumo do agendamento sempre visivel, podendo ser inline na etapa final no mobile para evitar sobreposicao.

Rotas sugeridas:

| Rota | Objetivo |
| --- | --- |
| `/:slug` | pagina inicial do tenant |
| `/:slug/agendar` | entrada do booking |
| `/:slug/agendar/profissional` | escolha de profissional |
| `/:slug/agendar/servico` | escolha de servico |
| `/:slug/agendar/horario` | escolha de data e horario |
| `/:slug/agendar/dados` | dados do cliente |
| `/:slug/agendar/pagamento` | sinal quando aplicavel |
| `/:slug/agendar/confirmacao` | fechamento da reserva |

## 2. Shell administrativo

Detalhamento oficial por tela em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`.

Padrao:

- menu lateral persistente;
- topo com contexto de tenant;
- area central por modulo;
- filtros e acoes rapidas na faixa superior;
- drawers para detalhe e edicao rapida.

Rotas sugeridas:

| Rota | Objetivo |
| --- | --- |
| `/app` | dashboard inicial e handoff da implantacao |
| `/app/implantacao` | onboarding administrativo, slug, branding e integracoes como Mercado Pago |
| `/app/catalogo` | produtos, servicos, kits, combos e politica de cobranca |
| `/app/agenda` | agenda do dia e semana |
| `/app/calendario` | calendario denso |
| `/app/clientes` | carteira de clientes |
| `/app/servicos` | detalhe operacional dos servicos agendaveis |
| `/app/profissionais` | equipe e agenda |
| `/app/financeiro` | caixa e movimentacoes |
| `/app/relatorios` | visoes gerenciais |
| `/app/campanhas` | comunicacoes e win-back |
| `/app/configuracoes` | tenant, slug, branding e integracoes |

## 3. Regras de acesso

- cliente final nunca acessa rotas `/app`;
- admin precisa de contexto de tenant para qualquer modulo;
- funcoes de equipe podem ter permissao parcial;
- a implantacao administrativa governa catalogo, pagamento e publicacao da slug;
- slug publica nao deve expor estado administrativo.
