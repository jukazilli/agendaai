# Execucao B-12 - Read Model Financeiro e Recorrencia - 2026-03-19

## Objetivo do corte

Endurecer o modulo de `relatorios` sem abrir infraestrutura pesada fora do MVP, criando um read model autenticado no `api-rest` para agenda, receita e recorrencia basica.

## Regra de precedencia usada

- backlog e auditoria oficiais em `docs/10_backlog` e `docs/11_auditoria`;
- implementacao real em `services/api-rest` e `apps/admin-web`.

Neste corte, a fonte de verdade passou a ser:

1. contrato compartilhado novo em `packages/contracts`;
2. endpoint autenticado do `api-rest`;
3. consumo pelo `admin-web`, com fallback local apenas como degradacao segura.

## O que entrou

- contrato compartilhado para `AdminReportsReadModel`;
- endpoint `GET /v1/admin/read-models/reports`;
- agregacao server-side de:
  - bookings do periodo;
  - receita reconhecida;
  - entrada online aprovada;
  - cancelamentos e no-show;
  - agrupamento por servico;
  - agrupamento por profissional;
  - buckets de retorno;
  - clientes sem retorno;
  - recorrencia media simples entre atendimentos concluidos;
- consumo do read model pelo `admin-web` na rota `relatorios`.

## O que continua fora

- `cash entry` persistido;
- conciliacao contabil;
- cohort preditivo;
- score de risco de churn;
- exportacao;
- read model historico separado por BFF/GraphQL.

## Evidencia tecnica

- `packages/contracts/src/v1/reporting.ts`
- `services/api-rest/src/reporting-read-model.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`
- `apps/admin-web/src/lib/admin-api.ts`
- `apps/admin-web/src/App.tsx`

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/contracts build`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest test`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/api-rest build`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`

## Resultado

O backend agora entrega um read model minimo, autenticado e reutilizavel para o shell administrativo.

O frontend de relatorios deixa de depender apenas da derivacao local em memoria e passa a priorizar a leitura agregada do `api-rest`.

## Impacto no backlog

- `B-10` continua `PARCIAL`, mas agora com camada minima server-side para leitura financeira agregada;
- `B-11` continua `PARCIAL`, mas recorrencia media e buckets simples de retorno entraram no produto;
- `B-12` continua `PARCIAL`, porem deixa de ser apenas tela dedicada e passa a ter read model real.

## Proximo passo recomendado

O proximo endurecimento correto sai de "leitura agregada minima" e vai para "persistencia minima":

1. `cash entry` ou reflexo financeiro persistido por atendimento concluido;
2. fechamento do detalhe de cliente/CRM para reduzir `BA-10`;
3. so depois nova rodada de analytics mais denso.
