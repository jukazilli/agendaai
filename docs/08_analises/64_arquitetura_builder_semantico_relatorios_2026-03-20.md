# 64. Arquitetura Builder Semantico de Relatorios

Data: `2026-03-20`  
Projeto: `agendaai`  
Modulo: `Relatorios`

Status posterior:

- `2026-03-21`: `B-17` e `B-18` materializados no codigo real;
- o modulo passou a operar com `builder workspace`, `report_definitions` persistidas, `dock tabs`, `modelos salvos` e execucao validada sobre o backend atual;
- este documento continua valendo como base arquitetural, mas a evidencia de execucao ficou registrada em `66_execucao_builder_relatorios_semantico_2026-03-21.md`.

## 1. Objetivo

Documentar uma mudanca de estrategia para `Relatorios`:

- sair de uma tela fechada de cards e visoes fixas;
- evoluir para uma `pagina em branco` com `builder de relatorios`;
- manter o backend atual como fonte de verdade;
- nao inventar metricas, campos, codigos ou joins que o sistema ainda nao modelou.

Este documento responde a pergunta:

> "Se eu quisesse construir relatorios inteligentes atraves de expressoes literais, como eu faria?"

## 2. Fonte de verdade e precedencia

Precedencia aplicada nesta analise:

1. contratos reais em `packages/contracts`;
2. comportamento real do `api-rest` em `services/api-rest`;
3. storage real atual em `services/api-rest/src/store.ts` e `services/api-rest/src/postgres-store.ts`;
4. shell oficial e trilha documental ja existente;
5. ideia de builder semantico discutida no chat como proposta de evolucao.

Arquivos consultados:

- `packages/contracts/src/v1/shared.ts`
- `packages/contracts/src/v1/tenant.ts`
- `packages/contracts/src/v1/service.ts`
- `packages/contracts/src/v1/professional.ts`
- `packages/contracts/src/v1/client.ts`
- `packages/contracts/src/v1/booking.ts`
- `packages/contracts/src/v1/availability.ts`
- `packages/contracts/src/v1/payment.ts`
- `packages/contracts/src/v1/cash-entry.ts`
- `packages/contracts/src/v1/reporting.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/postgres-store.ts`
- `services/api-rest/src/reporting-read-model.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`

Referencias externas controladas desta analise:

- TOTVS Smart View - Filtros:
  - `https://centraldeatendimento.totvs.com/hc/pt-br/articles/36728851068055-Cross-Segmentos-Backoffice-RM-BI-Como-utilizar-o-recurso-de-Filtro-no-Smart-View`
- TOTVS Smart View - Parametros:
  - `https://centraldeatendimento.totvs.com/hc/pt-br/articles/33793189784727-Cross-Segmentos-Backoffice-RM-BI-Smart-View-Passagem-de-par%C3%A2metros-em-relat%C3%B3rios`

## 2.1 Regra de confidencialidade desta referencia

As referencias da TOTVS foram usadas apenas como `benchmark tecnico controlado` para:

- estrutura de filtros logicos;
- separacao entre valor fixo e parametro informado em tempo de execucao;
- comportamento de lookup e janela de consulta;
- composicao de builder de expressoes.

Restricao obrigatoria:

- essa referencia deve permanecer apenas em documentacao interna de arquitetura/governanca;
- ela nao deve aparecer em copy de produto, material comercial, ajuda ao usuario final, changelog publico ou comunicacao externa do `AgendaAI`;
- o produto deve ser descrito como construcao propria ancorada no dominio e nos contratos do `AgendaAI`, nunca como adaptacao declarada de TOTVS.

## 3. Veredito curto

Sim, e possivel construir um `builder de relatorios inteligentes` no `AgendaAI`.

Mas o jeito correto nao e deixar a IA ou o usuario escrever consulta livre em cima do banco.  
O jeito correto e construir:

1. um `catalogo semantico` de campos, dimensoes e metricas;
2. uma `DSL validada` ou `AST de expressao`;
3. um `query planner` que traduz essa AST para consulta segura;
4. um `builder visual` que monta a estrutura sem expor SQL;
5. uma camada posterior, opcional, de traducao `linguagem natural -> DSL`.

## 4. Descoberta critica sobre o storage atual

O `AgendaAI` ainda nao usa um schema relacional normalizado para analytics.

Hoje, quando `DATABASE_URL` existe, o `PostgresApiRestStore` persiste um unico snapshot:

```sql
create table if not exists agendaai_runtime_snapshots (
  store_key text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
)
```

Ou seja:

- o schema fisico atual do Postgres nao e uma malha de tabelas analiticas;
- o dominio vive dentro de `payload jsonb`;
- o `api-rest` carrega esse snapshot e opera em memoria;
- o `read model` de relatorios e derivado das colecoes dentro do snapshot.

Isso muda a arquitetura recomendada do builder:

- curto prazo: builder em cima do dominio em memoria e dos contratos atuais;
- medio prazo: mover o motor para `read models` dedicados ou para uma camada semantica persistida;
- longo prazo: introduzir base analitica ou BFF/read models especializados.

## 5. Schema logico real do dominio hoje

Mesmo sem schema SQL normalizado, o sistema ja possui um schema logico claro nos contratos.

### 5.1 Tenant

Campos principais:

- `id`
- `slug`
- `nome`
- `status`
- `timezone`
- `branding.tagline`
- `branding.accentColor`

Uso analitico:

- escopo multi-tenant;
- contexto de timezone;
- segmentacao por tenant no futuro.

### 5.2 Service

Campos principais:

- `id`
- `tenantId`
- `nome`
- `duracaoMin`
- `precoBase`
- `exigeSinal`
- `paymentPolicy.collectionMode`
- `paymentPolicy.provider`
- `paymentPolicy.checkoutMode`
- `paymentPolicy.chargeType`
- `paymentPolicy.fixedAmount`
- `paymentPolicy.percentage`
- `paymentPolicy.currencyId`
- `paymentPolicy.acceptedMethods`
- `paymentPolicy.maxInstallments`
- `paymentPolicy.capture`
- `paymentPolicy.expirationMinutes`
- `status`

Uso analitico:

- faturamento base por servico;
- duracao esperada;
- leitura comercial;
- filtro por servico;
- agrupamento por servico.

### 5.3 Professional

Campos principais:

- `id`
- `tenantId`
- `nome`
- `status`
- `especialidades[]`

Uso analitico:

- produtividade por profissional;
- ocupacao;
- filtro e agrupamento por profissional.

### 5.4 Client

Campos principais:

- `id`
- `tenantId`
- `nome`
- `telefone`
- `email`
- `origem`

Uso analitico:

- clientes unicos;
- retencao;
- reativacao;
- lookup por nome e telefone;
- futura leitura por origem, desde que a qualidade do preenchimento seja confiavel.

### 5.5 AvailabilityRule

Campos principais:

- `id`
- `tenantId`
- `professionalId`
- `weekday`
- `faixa.startTime`
- `faixa.endTime`

Uso analitico:

- capacidade disponivel;
- horas livres;
- ocupacao semanal e mensal;
- comparativo entre agenda publicada e agenda ocupada.

### 5.6 Booking

Campos principais:

- `id`
- `tenantId`
- `clientId`
- `serviceId`
- `professionalId`
- `status`
- `startAt`
- `endAt`

Enums reais de status:

- `pendente`
- `aguardando pagamento`
- `confirmado`
- `concluido`
- `cancelado`
- `faltou`
- `reagendado`

Uso analitico:

- volume operacional;
- concluido x aberto x cancelado x no-show;
- base temporal;
- uniao principal entre cliente, servico e profissional.

### 5.7 PaymentIntent

Campos principais:

- `id`
- `tenantId`
- `bookingId`
- `provider`
- `checkoutMode`
- `amount`
- `currencyId`
- `externalReference`
- `description`
- `capture`
- `notificationUrl`
- `installments`
- `payer.email`
- `payer.firstName`
- `payer.lastName`
- `payer.identificationType`
- `payer.identificationNumber`
- `metadata`
- `status`
- `statusDetail`
- `paymentId`
- `preferenceId`
- `initPoint`
- `sandboxInitPoint`

Enums reais de status:

- `draft`
- `pending`
- `authorized`
- `approved`
- `in_process`
- `in_mediation`
- `rejected`
- `cancelled`
- `refunded`
- `charged_back`
- `expired`

Uso analitico:

- leitura de cobranca online;
- receita aprovada online;
- volume com sinal;
- status de conciliacao do checkout.

Restricao real:

- o contrato atual nao guarda o metodo efetivamente usado no pagamento;
- ele guarda politica aceita e status do intent, mas nao uma dimensao pronta de "pagou por PIX" ou "pagou no cartao".

### 5.8 CashEntry

Campos principais:

- `id`
- `tenantId`
- `bookingId`
- `clientId`
- `serviceId`
- `professionalId`
- `paymentIntentId`
- `kind`
- `source`
- `status`
- `currencyId`
- `amount`
- `occurredAt`
- `description`
- `note`

Enums reais:

`kind`

- `recognized_revenue`
- `online_payment`

`status`

- `open`
- `reversed`

`source`

- `booking_completion`
- `payment_reconciliation`

Uso analitico:

- verdade financeira minima do sistema;
- receita reconhecida por atendimento concluido;
- entrada online aprovada;
- reversao em cancelamento.

## 6. Contrato real de relatorios hoje

O endpoint atual e:

`GET /v1/admin/read-models/reports`

Filtros realmente aceitos hoje:

- `range`: `7d | 30d | all`
- `serviceId?`
- `professionalId?`
- `returnWindow`: `30d | 60d | 90d`

O read model responde:

- `current`
- `previous`
- `services[]`
- `professionals[]`
- `clientRecurrence`

Metricas realmente prontas hoje:

- `bookingsCount`
- `completedCount`
- `cancelledCount`
- `noShowCount`
- `recognizedRevenue`
- `approvedOnlineRevenue`
- `averageTicket`
- `uniqueClients`

Agrupamentos realmente prontos hoje:

- por servico
- por profissional

Retencao realmente pronta hoje:

- `returningCount`
- `inactiveCount`
- `neverCompletedCount`
- `clientsWithRecurrence`
- `averageRecurrenceDays`
- `returnBuckets`
- `inactiveClients`

## 7. O que os testes garantem hoje

Os testes do `api-rest` ja cobrem:

- comparativo de receita do periodo atual vs anterior;
- agrupamento por servico;
- agrupamento por profissional;
- buckets de retorno;
- clientes com retorno;
- clientes inativos;
- clientes que nunca concluiram;
- persistencia de `cash entries` para receita reconhecida;
- persistencia de `cash entries` para entrada online.

Entao existe base real para um builder, mas ainda nao existe motor generico.

## 8. Como o builder deve ser pensado

O builder nao deve nascer como texto livre.

Ele deve nascer como uma estrutura validada com 5 camadas.

### 8.1 Catalogo semantico

Registro central de tudo que o sistema conhece:

- bases;
- campos;
- dimensoes;
- metricas;
- operadores permitidos;
- joins permitidos;
- renderizadores permitidos;
- restricoes de uso.

### 8.2 AST ou DSL validada

Cada relatorio salvo precisa virar uma estrutura como:

```json
{
  "base": "bookings",
  "metric": {
    "name": "faturamento",
    "operator": "sum",
    "field": "recognized_revenue"
  },
  "filters": [
    {
      "field": "booking.startAt",
      "operator": "between",
      "value": ["2026-03-01", "2026-03-31"]
    },
    {
      "field": "booking.serviceId",
      "operator": "in",
      "value": ["svc_1", "svc_2", "svc_3"]
    }
  ],
  "groupBy": ["service.nome"],
  "sort": [
    {
      "field": "faturamento",
      "direction": "desc"
    }
  ],
  "renderAs": "table"
}
```

### 8.3 Query planner

Camada que traduz a AST para execucao segura:

- no curto prazo: leitura em memoria sobre as colecoes reais do snapshot;
- no medio prazo: leitura sobre `read models` ou BFF;
- no longo prazo: traducao para base analitica especializada.

### 8.4 Renderer

A saida precisa ser desacoplada da consulta:

- KPI
- tabela
- serie temporal
- ranking
- bucket
- lista operacional

### 8.5 Report definitions

O usuario nao salva "uma tela".  
Ele salva uma `definicao de relatorio`:

- nome;
- base;
- metricas;
- filtros padrao;
- agrupamentos;
- ordenacao;
- visualizacao;
- layout;
- escopo tenant;
- versao.

### 8.6 Modelos salvos em vez de modelos rapidos

No corte atual, `modelos rapidos` nao devem existir.

O conceito correto e:

- o usuario monta um relatorio;
- da um nome para esse relatorio;
- salva esse modelo para reutilizar depois;
- reabre o modelo salvo quando quiser;
- os dados continuam sendo recalculados a cada execucao.

Logo:

- o produto salva o `modelo reutilizavel`;
- o produto nao salva o `resultado encontrado` como parte do builder.

### 8.7 Persistencia recomendada para modelos salvos

Se a decisao for materializar isso no backend, a recomendacao e criar uma estrutura dedicada para `report_definitions`.

Exemplo conceitual:

```sql
create table report_definitions (
  id text primary key,
  tenant_id text not null,
  nome text not null,
  slug text not null,
  base text not null,
  status text not null default 'active',
  definition jsonb not null,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index report_definitions_tenant_idx
  on report_definitions (tenant_id);

create index report_definitions_definition_gin_idx
  on report_definitions
  using gin (definition);
```

Essa tabela deve guardar:

- identificacao do modelo;
- tenant dono;
- nome amigavel;
- slug tecnico;
- base principal;
- definicao JSON do builder;
- autor;
- datas;
- status.

Essa tabela nao deve guardar:

- linhas retornadas pelo relatorio;
- snapshot do resultado;
- cache duradouro da execucao analitica.

## 9. Regra de persistencia de dados do relatorio

O relatorio salvo nao e um snapshot dos dados encontrados.

Ele e apenas um `modelo reutilizavel`.

Regra recomendada:

- `report_definitions`: guarda a definicao do relatorio;
- `report_runs`: opcional no futuro, guarda historico de execucoes apenas se isso virar requisito;
- `report_exports`: opcional no futuro, guarda artefatos gerados para PDF, Excel ou CSV.

Persistencia de resultado so faz sentido em dois casos:

1. exportacao do relatorio;
2. trilha de auditoria de execucao, se isso virar requisito de produto.

Fora disso, o sistema deve sempre recalcular em cima da verdade atual do backend.

## 10. Como fica a ideia de expressoes literais

O conceito descrito no chat faz sentido, desde que a expressao literal seja apenas uma interface de entrada.

Exemplo conceitual:

```text
faturamento = soma(valor_servico)
```

ou

```text
faturamento_total_dia = soma(valor_servico) onde data entre :dataDe e :dataAte
```

ou

```text
faturamento_por_servico = soma(valor_servico) onde servico em :servicos agrupado por servico
```

Mas internamente isso deve virar AST, nao texto solto.

## 11. Tipos de variaveis recomendados

### 10.1 Variaveis de medida

Representam calculos:

- `faturamento`
- `bookings`
- `clientes_unicos`
- `ticket_medio`
- `horas_ocupadas`

### 10.2 Variaveis de filtro

Representam entrada do usuario:

- `data_de`
- `data_ate`
- `profissional_de`
- `profissional_ate`
- `servico_de`
- `servico_ate`
- `cliente`
- `janela_retorno`

### 10.3 Variaveis de conjunto

Representam listas:

- `servicos`
- `profissionais`
- `status_validos`

### 10.4 Variaveis derivadas

Sao calculadas em cima de outras:

- `ticket_medio = faturamento / concluidos`
- `ocupacao = horas_ocupadas / horas_disponiveis`

## 12. Operadores minimos do builder

### 11.1 Agregacao

- `sum`
- `count`
- `count_distinct`
- `avg`
- `min`
- `max`

### 11.2 Comparacao

- `=`
- `!=`
- `>`
- `>=`
- `<`
- `<=`
- `between`
- `in`
- `contains`

### 11.3 Logica

- `and`
- `or`
- `not`

### 11.4 Agrupamento

- `day`
- `week`
- `month`
- `service`
- `professional`
- `client`

### 11.5 Ordenacao

- `asc`
- `desc`

## 13. Catalogo semantico minimo possivel hoje

O ponto certo e começar pequeno.

### 12.1 Bases

Bases recomendadas para o motor:

1. `bookings`
2. `clients`
3. `services`
4. `professionals`
5. `cash_entries`
6. `payment_intents`
7. `availability`

### 12.2 Campos e capacidade

| Campo semantico | Origem real | Pode filtrar | Pode agrupar | Pode agregar |
| --- | --- | --- | --- | --- |
| `booking.startAt` | `Booking.startAt` | sim | dia/semana/mes | nao |
| `booking.endAt` | `Booking.endAt` | sim | nao | nao |
| `booking.status` | `Booking.status` | sim | sim | count |
| `booking.serviceId` | `Booking.serviceId` | sim | sim | count |
| `booking.professionalId` | `Booking.professionalId` | sim | sim | count |
| `booking.clientId` | `Booking.clientId` | sim | sim | count_distinct |
| `service.nome` | `Service.nome` | sim | sim | nao |
| `service.precoBase` | `Service.precoBase` | sim | nao | sum/avg/min/max |
| `service.duracaoMin` | `Service.duracaoMin` | sim | nao | sum/avg |
| `service.status` | `Service.status` | sim | sim | count |
| `service.exigeSinal` | `Service.exigeSinal` | sim | sim | count |
| `service.paymentPolicy.collectionMode` | `Service.paymentPolicy.collectionMode` | sim | sim | count |
| `professional.nome` | `Professional.nome` | sim | sim | nao |
| `professional.status` | `Professional.status` | sim | sim | count |
| `client.nome` | `Client.nome` | sim | sim | nao |
| `client.telefone` | `Client.telefone` | sim | nao | nao |
| `client.email` | `Client.email` | sim | nao | nao |
| `client.origem` | `Client.origem` | sim | sim | count |
| `payment_intent.status` | `PaymentIntent.status` | sim | sim | count |
| `payment_intent.amount` | `PaymentIntent.amount` | sim | nao | sum/avg |
| `cash_entry.kind` | `CashEntry.kind` | sim | sim | count |
| `cash_entry.status` | `CashEntry.status` | sim | sim | count |
| `cash_entry.amount` | `CashEntry.amount` | sim | nao | sum/avg |
| `cash_entry.occurredAt` | `CashEntry.occurredAt` | sim | dia/semana/mes | nao |
| `availability.weekday` | `AvailabilityRule.weekday` | sim | sim | count |
| `availability.faixa` | `AvailabilityRule.faixa` | sim | nao | calculado |

## 14. Metricas canonicas recomendadas

Estas metricas devem ter definicao unica no catalogo.

### 13.1 Ja aderentes ao backend atual

- `bookings = count(booking.id)`
- `concluidos = count(booking.id where booking.status = "concluido")`
- `cancelados = count(booking.id where booking.status = "cancelado")`
- `no_show = count(booking.id where booking.status = "faltou")`
- `clientes_unicos = count_distinct(booking.clientId)`
- `receita_reconhecida = sum(cash_entry.amount where cash_entry.kind = "recognized_revenue" and cash_entry.status = "open")`
- `entrada_online_aprovada = sum(cash_entry.amount where cash_entry.kind = "online_payment" and cash_entry.status = "open")`
- `ticket_medio = receita_reconhecida / concluidos`

### 13.2 Derivaveis com extensao leve

- `horas_ocupadas = sum(service.duracaoMin de bookings selecionadas)`
- `horas_disponiveis = soma de blocos de availability no periodo`
- `ocupacao = horas_ocupadas / horas_disponiveis`
- `clientes_com_retorno = count_distinct(clientId com novo concluido dentro da janela)`
- `clientes_sem_retorno = count_distinct(clientId com ultimo concluido fora da janela)`
- `ltv_cliente = sum(receita_reconhecida por clientId)`
- `receita_por_origem = sum(receita_reconhecida agrupada por client.origem)`

### 13.3 Nao confiaveis ainda sem evolucao estrutural

- `metodo_pagamento_real`
- `lead_time entre criacao da booking e atendimento`
- `motivo_cancelamento`
- `cohort por campanha`
- `meta comercial`
- `margem`

## 15. Matriz de cenarios possiveis

O objetivo nao e mapear "todas as telas".  
O objetivo e mapear "todos os tipos de pergunta".

### 14.1 Resultado

Perguntas:

- quanto faturou?
- quantas bookings?
- qual ticket medio?
- quantos clientes unicos?

Status:

- suportado hoje.

### 14.2 Composicao

Perguntas:

- faturamento por servico
- faturamento por profissional
- bookings por status
- receita por origem

Status:

- servico e profissional: suportado hoje;
- status: suportado com extensao leve;
- origem: suportado com extensao leve.

### 14.3 Eficiencia operacional

Perguntas:

- taxa de no-show
- pendencias no periodo
- horas ocupadas
- ocupacao da semana

Status:

- no-show: suportado hoje;
- pendencias: suportado com extensao leve;
- ocupacao: suportado com extensao leve via `availability`.

### 14.4 Retencao

Perguntas:

- quantos clientes voltaram?
- quantos sumiram?
- qual a recorrencia media?
- quem nunca concluiu?

Status:

- suportado hoje.

### 14.5 Capacidade

Perguntas:

- quantas horas disponiveis?
- quantas livres?
- qual profissional esta mais carregado?

Status:

- suportado com extensao leve;
- depende de institucionalizar a regra de capacidade hoje dispersa entre agenda e relatorios.

### 14.6 Comparacao

Perguntas:

- vs periodo anterior
- vs mesma janela anterior
- vs semana passada

Status:

- periodo anterior: suportado hoje apenas para `7d` e `30d`;
- comparacoes mais ricas exigem evolucao do planner.

## 16. O que ainda nao da para prometer

Com o modelo atual, estes cenarios ainda nao devem ser vendidos como prontos:

- relatorios livres em SQL;
- metricas por metodo de pagamento efetivamente capturado;
- criacao de qualquer calculo arbitrario sem catalogo;
- filtros entre codigos persistidos, porque `codigo` ainda nao existe como campo oficial nas entidades;
- cohort real de aquisicao;
- analise de cancelamento por motivo;
- funil entre criacao, confirmacao, conclusao e pagamento usando timestamps de lifecycle que o contrato ainda nao modela;
- comparativo multi-tenant.

## 17. Como a UI do builder deve nascer

Se a estrategia for mesmo "pagina em branco com builder", a UI recomendada e:

1. `area em branco` como canvas principal;
2. `catalogo de metricas` a esquerda;
3. `filtros e dimensoes` em painel lateral;
4. `preview do resultado` no centro;
5. `dock tabs` para relatorios salvos ou abertos;
6. `botao filtrar` local por relatorio;
7. `lookups` com consulta padrao para cliente, servico e profissional.

Regras adicionais para a UX:

- `modelos salvos` devem aparecer em uma area propria de acesso rapido;
- abrir um modelo salvo deve abrir uma nova dock tab;
- salvar nao congela o resultado, apenas a definicao;
- duplicar modelo deve ser permitido para criar variantes sem refazer tudo.

Fluxo sugerido:

1. escolher `base`;
2. escolher `metrica`;
3. adicionar filtros;
4. adicionar agrupamento;
5. escolher visualizacao;
6. salvar definicao;
7. abrir em nova dock tab.

## 18. Como a IA entra depois

A IA nao deve consultar o banco diretamente.

Ela deve apenas traduzir intencao para estrutura validada.

Exemplo:

```text
me mostre o faturamento por servico dos ultimos 30 dias
```

vira algo como:

```json
{
  "base": "bookings",
  "metric": "receita_reconhecida",
  "filters": [
    { "field": "booking.startAt", "operator": "relative_range", "value": "30d" }
  ],
  "groupBy": ["service.nome"],
  "renderAs": "ranking"
}
```

A IA ajuda a montar.  
Quem executa continua sendo o motor validado.

## 19. Melhor momento para executar essa trilha

O melhor momento e `agora` para a fase de arquitetura e catalogacao, mas `nao ainda` para a fase completa de entrega visual e de execucao final.

Motivo:

- `B-12 Relatorios essenciais` ja esta fechado;
- a estrategia de builder muda a fundacao do modulo, nao apenas a UI;
- se continuarmos refinando relatorios fixos, podemos jogar trabalho fora;
- por outro lado, ainda nao existe camada semantica persistida nem motor generico de execucao.

Recomendacao de corte:

### Fase 1 - agora

- fechar catalogo semantico oficial;
- fechar lista de metricas canonicas;
- fechar DSL/AST;
- fechar matriz de cenarios suportados;
- fechar regra de precedencia entre `cash entries`, `bookings`, `payment intents` e `availability`.

### Fase 2 - proximo corte tecnico

- criar `report definitions` no backend;
- criar executor em cima do store atual;
- liberar apenas algumas metricas homologadas;
- manter a pagina de builder ainda sob feature flag.

### Fase 3 - depois

- pagina em branco do builder no `admin-web`;
- dock tabs para relatorios salvos;
- filtros e lookups tipados;
- preview de KPI, tabela, ranking e serie temporal.

### Fase 4 - depois

- tradutor IA -> builder;
- exportacao e persistencia de artefatos exportados;
- eventualmente BFF/read models dedicados.

## 20. Recomendacao final

Se a decisao for realmente pivotar `Relatorios` para um builder:

- pare de investir em novos layouts fixos do modulo;
- trate o builder como nova fundacao do modulo;
- comece pelo `catalogo semantico`, nao pela UI;
- use o backend atual como motor inicial;
- foque em `modelos salvos`, nao em `modelos rapidos`;
- salve apenas a definicao do relatorio, nao o snapshot dos dados;
- nao introduza `codigo` inventado, campos inventados ou metricas sem definicao canonica.

## 21. Conclusao

O `AgendaAI` ja tem dados suficientes para um primeiro `builder semantico de relatorios`.

Mas esse builder precisa nascer em cima de:

- contratos reais;
- definicoes canonicas de metrica;
- execucao validada;
- limites claros do modelo atual.

O sistema de hoje ja suporta um primeiro ciclo de builder para:

- resultado;
- composicao por servico e profissional;
- retencao;
- pendencias;
- capacidade basica.

O que ainda nao existe deve ser tratado como evolucao de dominio, e nao como improviso de frontend.
