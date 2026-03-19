# Execucao B-12 - Relatorios Dedicados - 2026-03-19

## Objetivo do corte

Materializar a primeira rota dedicada de `relatorios` no `admin-web`, sem criar contrato novo no `api-rest` e sem fingir read model que ainda nao existe.

## O que entrou em codigo

- nova rota `relatorios` no shell administrativo;
- filtros de periodo `7 dias`, `30 dias` e `Tudo`;
- filtros de `servico` e `profissional`;
- cards de:
  - bookings no periodo;
  - receita reconhecida;
  - entrada online aprovada;
  - no-show;
- comparativo contra o periodo imediatamente anterior quando o filtro nao esta em `Tudo`;
- agrupamento por servico;
- agrupamento por profissional;
- reaproveitamento do recorte de clientes sem retorno por janela dentro do modulo;
- bloco de lacunas explicitas para cohort, recorrencia e financeiro persistido.

## O que nao entrou

- cohort de retorno;
- ciclo medio de recompra;
- previsao de reativacao;
- `cash entry` persistido;
- conciliacao financeira contabil;
- exportacao;
- relatorios baseados em read model dedicado.

Esses itens continuam fora do corte e permanecem marcados como `(nao funcional)` ou como lacuna remanescente no shell.

## Evidencia tecnica

- rota materializada em `apps/admin-web/src/App.tsx`;
- shell passou a expor `Relatorios` em `Gestao do negocio`;
- filtros e comparativo rodando sem endpoint novo, apenas com derivacao do bootstrap atual.

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`
- smoke browser em `http://127.0.0.1:4176/#relatorios` usando `https://agendaai-eu7w.onrender.com` como `API base URL`

## Resultado do smoke

- login administrativo funcionando;
- sidebar exibindo a nova rota `Relatorios`;
- alternancia entre `7 dias`, `30 dias` e `Tudo` funcionando;
- filtro por servico funcionando com reflexo imediato nas metricas;
- comparativo honesto com mensagem `Sem comparativo em todo o historico` quando o recorte esta em `Tudo`.

## Estado apos o corte

`B-12` deixa de estar apenas em fundacao e passa para `PARCIAL`.

`BA-11` continua `PARCIAL`, agora com tela dedicada de relatorios, mas ainda sem cohort, read model forte e persistencia financeira.

## Proximo passo recomendado

Abrir o proximo endurecimento de `B-12` em cima de duas frentes ligadas:

1. read model financeiro minimo para deixar de derivar tudo em memoria;
2. cohort/recorrencia basica para a carteira de clientes.
