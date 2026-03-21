# 73. Execucao API Rest Transacao e Reset de Staging — 21/03/2026

## Objetivo

Endurecer a persistencia do `api-rest` antes de continuar a trilha de `Relatorios`, removendo a janela de inconsistência entre `agendaai_runtime_snapshots` e `report_definitions` e formalizando um fluxo controlado de reset de staging.

## Implementacao

### Persistencia transacional

Arquivo principal:

- `services/api-rest/src/postgres-store.ts`

Mudancas aplicadas:

- `loadSnapshot()` passou a garantir schema antes da carga;
- `report_definitions` passaram a ser carregadas por helper dedicado e mescladas ao snapshot na entrada;
- `persistSnapshot()` passou a gravar `report_definitions` e `agendaai_runtime_snapshots` dentro de uma unica transacao SQL;
- a fila de persistencia passou a se recuperar de falhas anteriores, evitando fila permanentemente rejeitada;
- `PostgresApiRestStore` ganhou `close()` para permitir scripts controlados de operacao.

### Seed reutilizavel

Arquivos:

- `services/api-rest/scripts/seed-demo-lib.ts`
- `services/api-rest/scripts/seed-demo.ts`

Mudancas aplicadas:

- a regra de seed demo foi extraida para helper reutilizavel;
- o script antigo passou a reaproveitar o helper e fechar o store corretamente.

### Reset controlado de staging

Arquivos:

- `services/api-rest/scripts/reset-staging.ts`
- `services/api-rest/package.json`

Mudancas aplicadas:

- novo comando `pnpm --filter @agendaai/api-rest db:reset:staging`;
- o fluxo remove as tabelas do runtime, deixa o `PostgresApiRestStore` recriar schema, reseeda o tenant demo e valida login do owner demo;
- o reset continua condicionado a `DATABASE_URL`.

## Validacao

Executado localmente:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/api-rest test`

## Observacoes

- `DATABASE_URL` nao estava exposta no ambiente desta sessao, entao o reset real de staging nao foi executado aqui;
- o comando oficial ficou pronto para uso assim que a variavel estiver disponivel;
- a fundacao de persistencia continua baseada em `snapshot + report_definitions`, sem migracao ampla nesta rodada.
