# Desvio Beta AgendaAI - 18-03-2026

## 1. Objetivo

Registrar o desvio estrategico de `beta teste` sem misturar o escopo do `AgendaAI` com o `Vello Foods`, preservando a linha `development` e abrindo uma linha operacional minima para producao.

## 2. Fonte que motivou o desvio

- `c:\\projetos\\foco`

## 3. Classificacao objetiva do desvio

Itens do texto-base que pertencem claramente ao `Vello Foods` e nao ao `AgendaAI`:

- criar loja;
- criar produtos;
- criar add-ons;
- receber pedidos;
- preparar pedidos;
- finalizar pedidos;
- cliente acompanhar status do pedido;
- marketing e relatorios de compra ligados a carrinho e pedido.

Itens do texto-base que pertencem ao `AgendaAI`:

- criar negocio e slug;
- configurar catalogo de servicos;
- configurar cobranca e sinal;
- publicar pagina publica;
- receber bookings;
- operar agenda;
- concluir atendimento;
- relatorios essenciais de agenda, receita e clientes sem retorno.

## 4. Decisao de produto travada

O `AgendaAI` nao absorve neste repo a jornada de e-commerce de pedido do `Vello Foods`.

O beta do `AgendaAI` passa a ser:

1. onboarding administrativo do negocio;
2. slug publica;
3. configuracao de servicos, profissionais, disponibilidade e cobranca;
4. booking publica com ou sem sinal;
5. agenda operacional minima;
6. clientes gerados pela jornada real;
7. relatorios essenciais de agenda e receita.

## 5. Estrategia de branch

Linha `development`:

- backlog estrutural oficial;
- modulos futuros alem do corte beta;
- evolucoes de hardening, dashboard denso, analytics e integracoes posteriores.

Linha `beta`:

- corte minimo operacional para producao;
- tudo que destrava a jornada ponta a ponta do negocio no `AgendaAI`.

Nome recomendado para a branch beta:

- `beta/agendaai-mvp-operacional`

Nome recomendado para a branch de continuidade:

- `development`

Observacao:

- como o worktree atual ainda possui mudancas locais nao commitadas, a separacao de baseline por commit continua pendente;
- ainda assim, a estrategia e os nomes de branch ficam oficialmente travados nesta rodada.

## 6. Definition of Done do beta AgendaAI

O beta so pode ser tratado como pronto quando existir:

1. login admin e contexto de tenant;
2. implantacao minima do negocio;
3. configuracao de servicos e politica de cobranca;
4. booking publica funcional por slug;
5. pagamento de sinal funcional quando exigido;
6. agenda/admin para operar bookings;
7. relatorios essenciais;
8. deploy e smoke de producao.
