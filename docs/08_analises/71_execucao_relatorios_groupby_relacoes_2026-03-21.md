# 71. Execucao - Relatorios com relacoes declaradas, filtros contextuais e agrupamento por objeto

Data: 2026-03-21

## Objetivo

Fechar a camada funcional do `builder workspace` de `Relatorios` para que o modulo opere de forma consistente em todas as bases ja abertas, sem sumir filtros ao trocar o objeto de negocio e sem depender de linguagem tecnica para explicar `group by` e relacoes.

## Precedencia adotada

1. codigo real do `admin-web` e do `api-rest`;
2. contratos versionados do builder;
3. shell oficial em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`;
4. docs anteriores de arquitetura do builder.

## Mudancas executadas

### Builder e UX

- `apps/admin-web/src/reports-builder-workspace.tsx`
  - troca de `base` passou a normalizar a definicao inteira:
    - campo do indicador;
    - filtros;
    - agrupamento;
    - ordenacao;
    - relacao declarada;
  - `Base` virou `Objeto de negocio` com lookup por lupa;
  - filtros passaram a ser renderizados conforme o tipo do campo:
    - texto;
    - numero;
    - data;
    - enum;
    - lookup;
  - o agrupamento ficou exposto em linguagem literal como `Agrupar / quebrar por`;
  - `Modelos salvos` foi separado em:
    - `Modelos do sistema`;
    - `Modelos salvos por voce e equipe`.

### Contratos e backend

- `packages/contracts/src/v1/report-builder.ts`
  - o catalogo passou a suportar:
    - `relationOptions`;
    - `relation` na definicao do relatorio;
    - `options` em campos enum/controlados;
  - os modos de relacao passaram a ser controlados por contrato:
    - `inner`;
    - `left`;
    - `right`;
- `services/api-rest/src/report-builder.ts`
  - catalogo semantico ficou alinhado com o fallback do frontend;
  - foram materializadas relacoes declaradas para:
    - `Atendimentos x Clientes`;
    - `Atendimentos x Servicos`;
    - `Atendimentos x Profissionais`;
    - `Servicos x Profissionais`;
    - `Profissionais x Servicos`;
    - `Pagamentos x Atendimentos`;
    - `Agenda x Profissionais`;
  - o resultado da execucao passou a conseguir trocar a tabela base por tabela relacional quando a definicao pedir essa leitura.

### Agrupamento por objeto de negocio

O builder agora opera com a regra explicita de que `group by` nao e livre; ele depende do objeto de negocio:

- `Atendimentos`: cliente, servico, profissional, status, dia e mes;
- `Clientes`: sem agrupamento livre na v1;
- `Cadastro de servicos`: situacao do cadastro e forma de cobranca;
- `Cadastro de profissionais`: situacao do cadastro;
- `Agenda e capacidade`: profissional, dia e mes;
- `Pagamentos`: situacao do pagamento, cliente, servico, profissional, dia e mes da cobranca.

## Validacao executada

- `@agendaai/contracts build`: ok
- `@agendaai/admin-web build`: ok

## Residual aberto

- `@agendaai/api-rest build` falhou no `dts build`, mas o erro atual esta em `services/api-rest/src/store.ts` e nao foi aberto por esta rodada do builder;
- ainda nao entrou nesta passada a refatoracao estrutural de `Catalogo` e `Profissionais`;
- browser QA completo desta rodada nao foi refeito depois do fechamento documental.
