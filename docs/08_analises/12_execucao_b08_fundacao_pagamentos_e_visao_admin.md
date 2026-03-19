# Execucao B-08 - Fundacao de Pagamentos e Visao Admin

## 1. Objetivo

Registrar a fundacao de `B-08` sem fingir integracao pronta, alinhando:

- duas visoes oficiais do produto;
- configuracao administrativa de implantacao;
- modelos de pagamento para Mercado Pago;
- politica de cobranca por servico.

## 2. Fontes consultadas

- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/07_integracoes/00_mapa_de_integracoes.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `docs/07_integracoes/01_mercado_pago_checkout_modelo_inicial.md`
- `packages/contracts/src/v1/payment.ts`
- `packages/contracts/src/v1/service.ts`
- `services/api-rest/src/store.ts`
- `services/api-rest/src/app.ts`
- `services/api-rest/src/api-rest.test.ts`
- `apps/admin-web/src/App.tsx`

## 3. Regra de precedencia aplicada

1. briefing e jornadas oficiais sobre as duas visoes do produto;
2. backlog oficial para posicionar `B-08`;
3. codigo real implementado;
4. docs oficiais do Mercado Pago para os campos do modelo.

## 4. O que entrou de fato

- contratos versionados de `TenantPaymentSettings`, `ServicePaymentPolicy`, `PaymentIntent` e `PaymentWebhookNotification`;
- persistencia admin de `payment settings` no `api-rest`;
- configuracao de politica de cobranca por servico no runtime;
- placeholder do `admin-web` foi substituido depois por um shell operacional documentado em `docs/08_analises/13_execucao_b08_shell_admin_operacional.md`;
- backlog, jornadas, shell admin, integracoes e auditoria atualizados.

## 5. O que conscientemente ainda nao entrou

- homologacao externa do provider com credenciais validas;
- retorno publico do Checkout Pro no `booking-web`;
- suporte a `checkout_transparente`;
- acoes administrativas de booking no shell admin.

## 6. Leitura objetiva do estado atual

O projeto agora deixa de tratar pagamento como detalhe solto em `service.exigeSinal` e passa a ter:

- configuracao tenant-level do provider;
- politica comercial por servico;
- mapa administrativo de implantacao;
- base contratual para seguir de forma segura para a integracao real.

## 7. Releitura posterior

Uma revisao de codigo executada na mesma data mostrou que o `api-rest` ja possuia runtime de `payment intent`, `sync` e webhook Mercado Pago. O gargalo real desta fase estava no `booking-web`, e esse fechamento ficou registrado em `docs/08_analises/14_execucao_b08_checkout_pro_publico.md`.
