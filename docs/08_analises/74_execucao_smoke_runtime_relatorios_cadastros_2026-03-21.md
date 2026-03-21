# 74. Execucao Smoke Runtime Relatorios e Cadastros — 21/03/2026

## Objetivo

Fechar a prova real de `Relatorios`, `Catalogo` e `Profissionais` sobre um runtime limpo, sem depender de uma instancia antiga do `api-rest` nem de staging com `DATABASE_URL`.

## Implementacao

Arquivos principais:

- `services/api-rest/scripts/smoke-admin-runtime.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/package.json`

Mudancas aplicadas:

- foi criado um smoke deterministico com `app.inject()` em cima do `ApiRestStore` em memoria;
- o smoke faz onboarding de tenant isolado, cria servicos, profissional, disponibilidade e booking publica;
- o smoke executa todas as definicoes de sistema do builder:
  - `Atendimentos`
  - `Clientes`
  - `Cadastro de servicos`
  - `Cadastro de profissionais`
  - `Agenda e capacidade`
  - `Pagamentos`
- o smoke salva modelo a partir de definicao de sistema, salva clone e valida que o total de modelos cresce;
- o smoke valida que `service.status` e `professional.status` rejeitam texto livre fora do enum.

## Bug real encontrado

Durante a execucao, a rota `POST /v1/admin/report-definitions` ainda aceitava `id` vindo do cliente. Isso permitia sobrescrever uma definicao salva existente quando a UI ou um cliente mal comportado enviasse um `id` antigo junto com o `salvar como`.

Correcao aplicada em:

- `services/api-rest/src/app.ts`

Mudanca:

- `POST /v1/admin/report-definitions` agora sempre gera `id` novo com `randomUUID()`, ignorando qualquer `id` vindo no corpo.

## Validacao

Executado localmente:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest smoke:admin:runtime`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`

Resultado relevante do smoke:

- todas as bases do builder foram executadas;
- `serviceCodes`, `professionalCodes` e `clientCodes` vieram preenchidos;
- `savedCount` passou para `2` ao salvar o clone, confirmando que a definicao anterior nao foi sobrescrita;
- patches invalidos de status em servico e profissional continuaram rejeitados.

## Observacoes

- a instancia antiga do `api-rest` em `:3333` ainda estava rodando codigo anterior e por isso devolvia `500` em `system-1/execute`; o smoke em `app.inject()` foi usado como prova limpa e reproduzivel do codigo atual;
- a execucao real de reset em staging continua pendente apenas da disponibilizacao de `DATABASE_URL` na sessao.
