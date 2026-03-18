# Modelo Operacional Multiagente

## 1. Finalidade

Este documento define como o `agendaai` usa squads e subagentes sem perder:

- precedencia entre codigo e documentacao;
- corte pequeno e integravel;
- ownership por `write set`;
- rastreabilidade do que entrou;
- criterio de pronto verificavel.

O objetivo nao e ter mais agentes.

O objetivo e fechar cortes reais com menos ambiguidade.

## 2. Regra de verdade

No `agendaai`, a ordem de verdade passa a ser:

1. codigo real ja implementado no repositorio;
2. documentacao homologada em `docs/`;
3. contratos, handoffs e workflows em `.agents/`;
4. legado em `docs/12_legado/`;
5. referencias externas homologadas.

Leitura pratica:

- se um modulo ja existe em codigo, o runtime vence e a doc precisa refletir isso;
- se o modulo ainda nao existe, a doc oficial governa o corte;
- `.agents/` nunca substitui `docs/`; ela apenas operacionaliza a execucao.

## 3. Principio central

No `agendaai`, multiagente so entra quando houver:

- backlog claro;
- jornada definida;
- `write set` separado;
- criterio de pronto verificavel;
- risco real de throughput se o trabalho ficar centralizado.

E proibido paralelizar uma duvida arquitetural.

## 4. Quando usar

Use operacao multiagente quando:

- o corte tocar backend, frontend, docs e verificacao na mesma janela;
- houver duas superficies independentes, como `booking-web` e `admin-web`;
- existir uma lacuna de pesquisa controlada em paralelo a implementacao;
- o corte puder ser descrito por contrato.

Nao use quando:

- o corte couber em um arquivo ou modulo pequeno;
- dois squads precisarem editar a mesma area critica;
- a decisao de produto ainda estiver em aberto;
- a validacao final depender de improviso.

## 5. Squads oficiais

### 5.1 Supervisor / Arquiteto

Responsavel por:

- escolher o corte;
- travar escopo, restricoes e `write set`;
- decidir quando paralelizar e quando nao;
- recusar fatia mal definida.

### 5.2 Research Squad

Responsavel por:

- fechar lacunas conceituais;
- comparar referencias maduras com o contexto do `agendaai`;
- devolver `fit`, `adapt` ou `reject`;
- nunca expandir escopo sozinho.

### 5.3 Backend Core Squad

Responsavel por:

- `services/*`;
- `packages/contracts/*`;
- `packages/domain/*`;
- endpoints, contratos, regras de dominio e validacao transacional.

### 5.4 Frontend Booking Squad

Responsavel por:

- `apps/booking-web/*`;
- shell publico;
- estados de carregamento, vazio, erro e confirmacao;
- integracao com a API publica e fechamento da jornada `J-03`.

### 5.5 Frontend Admin Squad

Responsavel por:

- `apps/admin-web/*`;
- shell administrativo;
- fluxos operacionais de agenda, catalogo, equipe e dashboards;
- consumo de rotas admin reais.

### 5.6 Docs / Audit Squad

Responsavel por:

- `docs/*`;
- `.agents/*`;
- backlog, auditoria, checkpoint e divergencias;
- refletir o que realmente entrou no codigo.

### 5.7 Integrador

Responsavel por:

- consolidar entregas;
- detectar colisao entre contratos;
- checar convergencia entre API, UI e docs;
- recusar handoff sem evidencia.

### 5.8 QA / Verification Squad

Responsavel por:

- `pnpm lint`;
- `pnpm build`;
- `pnpm --filter @agendaai/api-rest test`;
- smoke da jornada afetada;
- classificacao final do corte como `FECHADO`, `PARCIAL` ou `BLOQUEADO`.

## 6. Regra de `write set`

Cada squad deve ter ownership explicito.

Padrao recomendado:

- `Research`: somente docs de referencia, sem runtime.
- `Backend Core`: `services/*`, `packages/contracts/*`, `packages/domain/*`.
- `Frontend Booking`: `apps/booking-web/*` e, se o contrato permitir, `packages/ui/*`.
- `Frontend Admin`: `apps/admin-web/*` e, se o contrato permitir, `packages/ui/*`.
- `Docs / Audit`: `docs/*`, `.agents/*`, `README.md`.
- `QA / Verification`: sem editar runtime, salvo harness ou fixture explicitamente autorizados.

Se dois squads precisarem tocar o mesmo subconjunto critico, o corte precisa ser redesenhado.

## 7. Ordem oficial de um corte

1. ancorar o corte nos documentos oficiais;
2. preencher um contrato em `.agents/contracts/`;
3. travar `Definition of Done` e `write set`;
4. rodar `Research` antes de paralelizar, se houver lacuna;
5. delegar backend, frontend e docs apenas depois do contrato ficar estavel;
6. integrar;
7. validar build, testes e jornada;
8. atualizar auditoria e registrar o proximo ponto seguro.

## 8. Regra para 18/03/2026

Para a janela de entrega de `18/03/2026`, o primeiro corte oficial do modelo e:

- `B-07`, com foco em booking publico demonstravel.

Esse corte nao deve reabrir:

- pagamento real;
- notificacoes;
- dashboard admin real;
- endurecimento de infra;
- GraphQL BFF;
- analytics Python.

## 9. Regra final

No `agendaai`, operacao multiagente so e valida quando:

- o corte estiver ancorado em backlog e jornada reais;
- cada squad tiver ownership explicito;
- a integracao final acontecer sob um unico responsavel;
- docs e codigo terminarem a rodada convergentes.
