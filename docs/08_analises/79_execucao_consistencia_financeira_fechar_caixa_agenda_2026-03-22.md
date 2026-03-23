# 79. Execucao — Consistencia financeira, fechar caixa ampliado e agenda enxuta

Data: 2026-03-22

## Precedencia usada

- regra oficial do shell: [01_admin_shell_e_inventario_de_telas.md](C:/projetos/agendaai/docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md)
- corte anterior de agenda/financeiro: [78_execucao_agenda_unificada_financeiro_operacional_2026-03-22.md](C:/projetos/agendaai/docs/08_analises/78_execucao_agenda_unificada_financeiro_operacional_2026-03-22.md)

Quando houve conflito entre leitura antiga da tela e a nova regra, a implementacao atual do modulo foi tratada como fonte de verdade e a documentacao oficial do shell foi atualizada para refletir o comportamento entregue.

## Escopo fechado

- persistencia de `movimento previsto` para `receitas`, `despesas` e recebiveis vindos de `cash entries`;
- baixa por `receber`, `pagar` e `fechar caixa` atualizando o mesmo movimento para `lancado`, sem duplicidade;
- `fechar caixa` em workspace amplo, com preview dividido em `pendentes` e `ja baixados`;
- `fluxo de caixa` com filtro modal forte;
- agenda sem header redundante de `recorte/profissional`, com card `selecionado` reposicionado para a area util superior.

## Arquivos principais alterados

### Contracts

- [finance.ts](C:/projetos/agendaai/packages/contracts/src/v1/finance.ts)

### Backend

- [store.ts](C:/projetos/agendaai/services/api-rest/src/store.ts)
- [financial-read-model.ts](C:/projetos/agendaai/services/api-rest/src/financial-read-model.ts)

### Frontend

- [App.tsx](C:/projetos/agendaai/apps/admin-web/src/App.tsx)
- [admin-api.ts](C:/projetos/agendaai/apps/admin-web/src/lib/admin-api.ts)
- [styles.css](C:/projetos/agendaai/apps/admin-web/src/styles.css)

## Regras materializadas

- `receita` e `despesa` agora criam `BankMovement` com `status = previsto` no momento do cadastro;
- `cash entry` aberta tambem gera movimento previsto;
- `receber`, `pagar` e `fechar caixa` atualizam esse mesmo movimento para `lancado`;
- `estornar` marca o original como `estornado`, cria o movimento inverso e reabre o titulo quando aplicavel;
- `fechar caixa` usa selecao explicita dos pendentes marcados;
- o preview de `fechar caixa` passou a usar a `data de negocio` do tenant, e nao o `slice(0,10)` do ISO UTC, evitando divergencia de dia em recebimentos noturnos;
- `agenda` ganhou filtro modal proprio e manteve inline apenas os controles de navegacao e acao operacional.

## Validacao

- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/contracts build`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\\projetos\\agendaai --filter @agendaai/admin-web build`

## Browser QA

Instancia validada:

- `admin-web`: `http://127.0.0.1:4177`
- `api-rest`: `http://127.0.0.1:3334`

Fluxos validados:

- abertura do filtro modal de `Fluxo de caixa`;
- criacao de `receita` manual com valor monetario;
- aparicao do movimento em `Movimentos bancarios` com status `Previsto`;
- baixa da receita atualizando o mesmo movimento para `Lancado`;
- `Fechar caixa` mostrando layout amplo e itens `Ja baixados no periodo`;
- agenda com card `Selecionado` no topo da gaveta e filtro modal proprio.

## Residual

- o `dashboard` financeiro continua dependendo de refresh/bootstrap para refletir imediatamente mudancas feitas por API externa durante a mesma sessao;
- o `admin-web` ainda emite o warning antigo de chunk grande no build;
- o `favicon.ico` local continua em `404`, sem impacto funcional.
