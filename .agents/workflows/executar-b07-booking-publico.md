---
description: Fechar o corte B-07 do AgendaAI com foco em booking publico demonstravel ate 18-03-2026, sem fingir pagamento, notificacao ou dashboard admin.
---

# Workflow: Executar B-07 Booking Publico

## Leitura obrigatoria

1. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
2. `docs/05_jornadas/00_jornadas_core.md`
3. `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
4. `docs/11_auditoria/00_auditoria_de_fechamento.md`
5. `docs/08_analises/09_execucao_b06_catalogo_e_disponibilidade.md`
6. `docs/08_analises/10_ponto_de_parada_e_plano_2026-03-18.md`
7. `.agents/contracts/2026-03-17_b07_booking-publico.md`

## Escopo minimo aceito

1. carregar `tenant`, `catalog`, `professionals` e `availability` por `slug`;
2. permitir escolher servico, profissional, data e horario;
3. coletar dados do cliente;
4. criar booking para servicos sem sinal obrigatorio;
5. mostrar confirmacao e erros honestos.

## O que nao entra

- provider de pagamento;
- notificacao;
- persistencia definitiva;
- agenda admin;
- regras de timezone alem do corte atual.

## Validacao minima

- `pnpm --filter @agendaai/api-rest test`
- `pnpm lint`
- `pnpm build`

## Regra de ouro

Entregar uma jornada curta real.

Nao montar um stepper falso so para parecer mais completo.
