# Execucao B-07 Booking Publico

## 1. Objetivo

Registrar com evidencia local o fechamento de `B-07`, ligando `apps/booking-web` ao `api-rest` real e validando a jornada publica `J-03` em runtime local com persistencia no banco de staging.

## 2. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `docs/08_analises/09_execucao_b06_catalogo_e_disponibilidade.md`
- `docs/08_analises/10_ponto_de_parada_e_plano_2026-03-18.md`
- `.agents/contracts/2026-03-17_b07_booking-publico.md`
- `packages/contracts/src/v1/booking.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/postgres-store.ts`
- `services/api-rest/src/api-rest.test.ts`
- `services/api-rest/scripts/seed-demo.ts`
- `apps/booking-web/app/[slug]/page.tsx`
- `apps/booking-web/app/[slug]/booking-flow.tsx`
- `apps/booking-web/app/api/public/tenants/[slug]/availability/route.ts`
- `apps/booking-web/app/api/public/tenants/[slug]/bookings/route.ts`
- `apps/booking-web/lib/public-api.ts`
- `apps/booking-web/app/globals.css`

## 3. Regra de precedencia aplicada

1. backlog e contrato oficial do corte;
2. jornadas e shells oficiais;
3. implementacao real do runtime;
4. governanca e auditoria locais.

Quando houve detalhe nao congelado nas docs, foi adotado o menor corte seguro que fecha a jornada publica sem fingir `B-08`.

## 4. O que entrou de fato

Backend:

- rota publica `POST /v1/public/tenants/:slug/bookings`;
- persistencia configuravel por `DATABASE_URL`, usando `PostgresApiRestStore`;
- seed demo para staging com tenant, servicos, profissional e disponibilidade;
- contrato publico de booking simplificado para nao depender de `exigeSinal` vindo do cliente;
- regra de bloqueio honesta para servicos com `exigeSinal = true`.

Frontend:

- leitura de tenant e catalogo por `slug`;
- consulta de slots pela API publica real;
- selecao de servico, profissional, data e horario;
- captura de dados minimos do cliente;
- confirmacao visual da reserva;
- resumo fixo mobile-first, com progresso compacto e tratamento explicito para servicos que exigem sinal.

## 5. Evidencia concreta de conclusao

Validacao local aprovada:

- `pnpm --filter @agendaai/api-rest test`
- `pnpm lint`
- `pnpm build`

Smoke HTTP aprovado:

- seed demo executado para o slug `demo-studio-20260317`;
- `GET /v1/public/tenants/demo-studio-20260317/catalog` retornou catalogo real;
- `GET /v1/public/tenants/demo-studio-20260317/availability` retornou slots reais;
- `POST /v1/public/tenants/demo-studio-20260317/bookings` criou booking real sem exigir `exigeSinal` no payload do cliente.

Smoke mobile aprovado:

- viewport `390x844`;
- rota `http://127.0.0.1:3000/demo-studio-20260317`;
- preenchimento de dados e confirmacao concluida;
- tela final exibiu confirmacao do booking com tenant, servico, horario e profissional.

## 6. O que continua fora do corte

- `B-08` pagamento e sinal por provider;
- notificacoes;
- timezone canonico;
- dashboard administrativo real;
- hardening de persistencia alem do snapshot operacional usado para staging/demo.

## 7. Leitura objetiva do estado atual

O projeto saiu de:

- `B-06` fechado, com backend pronto e `booking-web` ainda scaffold.

Para:

- `B-07` fechado no menor corte realista para demonstracao;
- `booking-web` funcional em mobile;
- booking publica persistida no staging;
- proxima fronteira real deslocada para `B-08` e `B-09`.
