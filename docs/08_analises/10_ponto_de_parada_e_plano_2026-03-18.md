# Ponto de Parada e Plano para 18-03-2026

## 1. Objetivo

Registrar com evidencia local onde o `agendaai` parou em `17/03/2026` e qual e o menor corte realista para termos algo demonstravel em `18/03/2026`.

## 2. Fontes consultadas

- `README.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/08_analises/08_execucao_b05_api_rest_com_tenancy.md`
- `docs/08_analises/09_execucao_b06_catalogo_e_disponibilidade.md`
- `package.json`
- `apps/booking-web/app/page.tsx`
- `apps/booking-web/app/[slug]/page.tsx`
- `apps/admin-web/src/App.tsx`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/api-rest.test.ts`
- validacao local de `pnpm --filter @agendaai/api-rest test`
- validacao local de `pnpm lint`
- validacao local de `pnpm build`

## 3. Regra de precedencia aplicada

1. codigo real implementado;
2. documentacao homologada em `docs/`;
3. docs legadas e referencias.

Quando a doc e o runtime divergiram, o codigo real foi tratado como fonte primaria para modulos ja implementados.

## 4. Onde o projeto parou de fato

O ponto de parada real do projeto esta entre `B-06` fechado e `B-07` nao iniciado na interface.

Resumo objetivo:

- `B-01` a `B-06` estao fechados no backlog oficial;
- o runtime transacional do `api-rest` existe e foi validado hoje;
- `booking-web` e `admin-web` ainda estao em estado de scaffold;
- `graphql-bff`, `workers` e `analytics-python` continuam como fundacao buildavel, nao como produto usavel.

## 5. Evidencia local do que ja funciona

Backend realmente implementado:

- onboarding de tenant;
- sessao admin;
- CRUD de `service`, `professional`, `client` e `booking`;
- regras recorrentes de disponibilidade;
- listagem publica de `tenant`, `catalog`, `professionals` e `availability` por `slug`;
- validacao de conflito de horario.

Isso esta materializado em:

- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/api-rest.test.ts`

Validacao executada em `17/03/2026`:

- `pnpm --filter @agendaai/api-rest test`: aprovado;
- `pnpm lint`: aprovado;
- `pnpm build`: aprovado.

## 6. O que ainda nao virou produto demonstravel

`booking-web` ainda e placeholder:

- home fala em "base do agendamento publico por slug";
- rota `/:slug` ainda nao consome a API;
- nao existe escolha de servico, profissional, horario, dados ou confirmacao.

`admin-web` ainda e placeholder:

- a copy interna ainda descreve o shell como fundacao tecnica;
- nao existe auth real, agenda, operacao ou dashboard conectados.

## 7. Divergencias concretas entre docs e codigo

Ha coerencia estrutural entre backlog e runtime, mas ainda existem divergencias ou lacunas relevantes:

| Item | Evidencia documental | Evidencia em codigo | Leitura objetiva |
| --- | --- | --- | --- |
| `B-07` e a proxima frente | backlog e auditoria apontam `B-07` | `booking-web` segue scaffold | coerente; corte ainda aberto |
| `admin-web` como superficie futura | docs falam de shell administrativo real | `apps/admin-web/src/App.tsx` ainda fala em fundacao `B-01` | doc mais madura que a UI |
| Timezone canonico | docs reconhecem a lacuna | `store.ts` opera com strings locais | lacuna real que pressiona `B-07` e `B-09` |
| Pagamento e sinal | backlog separa `B-07` de `B-08` | services com `exigeSinal` ja existem, mas nao ha provider | regra precisa ser tratada sem fingir `B-08` |

## 8. Menor entrega realista para 18-03-2026

Para `18/03/2026`, o menor corte realista e demonstravel e:

1. abrir `/:slug` com dados reais do tenant;
2. listar servicos e profissionais vindos da API publica;
3. permitir escolher data e horario usando os slots publicos;
4. coletar dados minimos do cliente;
5. criar booking para servicos sem sinal obrigatorio;
6. mostrar confirmacao e estados de erro.

Isso fecha um `B-07` util sem fingir:

- pagamento real;
- notificacao;
- dashboard admin;
- persistencia definitiva;
- timezone hardening.

## 9. O que fica explicitamente fora do corte de 18-03-2026

- `B-08` pagamento e sinal por provider;
- `B-09` agenda e dashboard admin;
- `B-13` notificacoes;
- `B-14` calendar;
- `B-15` GraphQL BFF;
- `B-16` analytics Python.

## 10. Riscos que precisam ser aceitos conscientemente

- `api-rest` ainda usa persistencia em memoria;
- servicos com `exigeSinal = true` nao podem fingir fechamento sem tratar a regra;
- timezone continua sem definicao canonica;
- o `api-rest` esta em Fastify direto, nao em NestJS.

## 11. Proximo ponto seguro

O proximo ponto seguro do projeto passa a ser:

- `B-07` fechado de forma parcial ou total, com jornada publica demonstravel e validacao minima registrada.
