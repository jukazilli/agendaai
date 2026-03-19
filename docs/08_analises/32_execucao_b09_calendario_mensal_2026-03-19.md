# Execucao B-09 / BA-09 - Calendario Mensal Navegavel - 2026-03-19

## Objetivo

Fechar a lacuna restante da agenda administrativa no MVP com uma visao mensal navegavel, sem puxar `drag-and-drop` ou calendario denso de pos-beta para dentro do corte atual.

## Regra de precedencia usada

- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md` para o criterio de `BA-09`;
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md` para distinguir o que e agenda beta do que pertence ao calendario denso pos-beta;
- codigo real do `admin-web` como prova do runtime materializado.

## Documentacao consultada

- `README.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `docs/08_analises/25_execucao_b09_agenda_reagendamento_2026-03-19.md`
- `docs/08_analises/26_execucao_b09_calendario_semanal_capacidade_2026-03-19.md`

## Codigo alterado

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Entrega executada

- modo novo `Mes` na rota `agenda`;
- navegacao por mes anterior, mes atual e proximo mes;
- grade mensal clicavel por dia;
- resumo mensal de capacidade e bookings;
- painel lateral do dia selecionado com resumo operacional e acesso ao detalhe diario;
- manutencao explicita de `drag-and-drop`, bloqueios por excecao e alertas preditivos como lacunas fora do corte.

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`

## Decisao de status

`BA-09` passa para `FECHADO`.

Justificativa:

- o criterio beta falava em agenda do dia com acoes basicas;
- o runtime ja tinha lista do dia, filtros, acoes e reagendamento;
- a visao mensal navegavel fecha a lacuna de leitura de calendario sem trazer o escopo de calendario denso pos-beta;
- `drag-and-drop` deixa de bloquear o beta porque o proprio inventario canonico o posiciona fora do corte.

`B-09` tambem passa para `FECHADO`, pois a agenda e o dashboard operacional do shell admin ja estao materializados no nivel exigido pelo backlog estrutural atual.

## Impacto no percentual

- backlog estrutural: `72%`
- backlog beta/MVP: `95%`

## Proximo passo recomendado

O gargalo do MVP deixa de ser agenda e passa a ser essencialmente de implantacao e escopo:

1. fechar `BA-03` com branding minimo ou retirar branding do MVP formalmente;
2. decidir se `checkout_transparente` fica em `B-08` ou vira trilha propria;
3. so depois abrir rodada pesada de UI/UX.
