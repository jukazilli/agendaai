# 70. Execucao - Relatorios com bases cadastrais, lookup de base e endurecimento de enums

Data: 2026-03-21

## Objetivo

Fechar a proxima camada do `builder semantico` de `Relatorios`, ampliando o modulo para:

- bases reais adicionais de `cadastro de servicos`, `cadastro de profissionais` e `pagamentos`;
- consulta padrao com lupa para escolha de `base`, em vez de codigo digitado;
- modelos do sistema visiveis junto de `modelos salvos`;
- endurecimento dos campos de `status` em `servicos` e `profissionais`, evitando texto livre no frontend e no backend.

## Precedencia adotada

1. contratos reais e store do backend;
2. shell oficial do admin;
3. builder ja implantado na rodada anterior;
4. mock visual apenas como referencia de UX, nunca como verdade funcional.

## Mudancas executadas

### Contratos

- `packages/contracts/src/v1/report-builder.ts`
  - bases do builder expandidas para:
    - `bookings`
    - `clients`
    - `services`
    - `professionals`
    - `availability`
    - `payments`
  - catalogo agora carrega `baseOptions`;
- `packages/contracts/src/v1/service.ts`
  - `status` passou a usar enum real `active|inactive`;
- `packages/contracts/src/v1/professional.ts`
  - `status` passou a usar enum real `active|inactive`.

### Backend

- `services/api-rest/src/report-builder.ts`
  - catalogo semantico expandido com campos, agrupamentos e definicoes do sistema para:
    - `Cadastro de servicos`
    - `Cadastro de profissionais`
    - `Pagamentos e cobranca`
  - motor de execucao passou a tratar:
    - `services`
    - `professionals`
    - `payments`
  - novas tabelas e KPIs de execucao foram materializadas para essas bases;
  - a `previewExpression` ficou mais literal e menos tecnica;
- `services/api-rest/src/app.ts`
  - `parseServicePatch` e `parseProfessionalPatch` agora validam `status` via enum;
- `services/api-rest/src/store.ts`
  - `ServicePatchInput` e `ProfessionalPatchInput` passaram a refletir os enums reais.

### Frontend

- `apps/admin-web/src/reports-builder-workspace.tsx`
  - `base` do relatorio passou a abrir consulta padrao com lupa;
  - a UI ganhou fallback local de nomes de base, para tolerar catalogos antigos sem `baseOptions`;
  - o modal `Modelos salvos` passou a listar:
    - definicoes de sistema;
    - modelos salvos do tenant;
  - copy do builder foi simplificada:
    - `Builder de relatorios` -> `Relatorios personalizados`
    - `Estrutura base` -> `Definicao`
    - `Campo base` -> `Campo calculado`
    - `Payload tecnico` -> `Definicao do modelo`
  - chave dos itens do modal foi blindada contra colisao entre modelos de sistema e modelos salvos;
- `apps/admin-web/src/lib/report-builder-fallback.ts`
  - fallback alinhado com as novas bases e definicoes;
- `apps/admin-web/src/App.tsx`
  - flyout lateral de `Relatorios` ganhou:
    - `Cadastro de servicos`
    - `Cadastro de profissionais`
    - `Pagamentos e cobranca`
  - `status` de `servicos` e `profissionais` deixou de ser input livre e passou a ser `select` enum no admin.

## Validacao executada

### Build / lint

- `@agendaai/contracts build`: ok
- `@agendaai/api-rest lint`: ok
- `@agendaai/api-rest build`: ok
- `@agendaai/api-rest test`: ok (`12/12`)
- `@agendaai/admin-web lint`: ok
- `@agendaai/admin-web build`: ok

### Browser QA

Validacao manual assistida em `http://127.0.0.1:5173/#relatorios`, apontando o admin para `api-rest` local atualizado:

- hover em `Relatorios` abriu o flyout lateral com as novas visoes:
  - `Cadastro de servicos`
  - `Cadastro de profissionais`
  - `Pagamentos e cobranca`
- o campo `Base` passou a abrir popup com lupa e lista padrao;
- o modal `Modelos salvos` passou a listar tambem as definicoes do sistema;
- `Cadastro de servicos` abriu em dock tab propria e carregou campos/agrupamentos da base `services`;
- `Pagamentos e cobranca` abriu em dock tab propria e carregou campos/agrupamentos da base `payments`.

## Limites e proxima onda

Esta rodada **nao** fechou ainda:

- `joins` explicitos do tipo `inner`, `left` e `right` no builder visual;
- refatoracao completa de `Catalogo` e `Profissionais` para o padrao final de popup, `document view` e `master-detail` relacional;
- refinamento do modal `Modelos salvos` para exibir `Sistema` na copy do autor em vez de `AgendaAI`.

Esses pontos ficam como proxima passada do builder/cadastros.

