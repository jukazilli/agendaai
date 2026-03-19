# Backlog Beta AgendaAI - Minimo Operacional

## Linha de corte

Este backlog deriva do backlog estrutural oficial, mas existe para a linha `beta/agendaai-mvp-operacional`.

Ele nao substitui `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`.

## Trilha Beta A - Identidade e implantacao

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto |
| --- | --- | --- | --- | --- | --- |
| 1 | BA-01 | Autenticar admin no `admin-web` com tenant context real | B-05 | FECHADO | login, sessao e logout funcionando |
| 2 | BA-02 | Materializar shell admin inicial com rota de implantacao | BA-01 | FECHADO | shell admin com onboarding real, navegacao modular minima e rota de implantacao separada |
| 3 | BA-03 | Expor configuracao de slug, branding minimo e Mercado Pago na implantacao | BA-02, B-08 | PARCIAL | slug e payment settings editaveis no ambiente publicado; branding minimo ainda pendente |

## Trilha Beta B - Catalogo comercial e cobranca

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto |
| --- | --- | --- | --- | --- | --- |
| 4 | BA-04 | Conectar cadastro de servicos no `admin-web` | BA-01, B-06 | EM FUNDACAO | create/update de servicos operando; delete e refinamento ainda pendentes |
| 5 | BA-05 | Materializar politica de cobranca por servico | BA-04, B-08 | FECHADO | `paymentPolicy` editavel e refletindo em runtime |
| 6 | BA-06 | Criar payment intent real com Mercado Pago | BA-03, BA-05 | FECHADO | checkout pro disparado por servico com sinal no ambiente publicado; `checkout_transparente` segue fora deste corte |

## Trilha Beta C - Jornada publica

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto |
| --- | --- | --- | --- | --- | --- |
| 7 | BA-07 | Manter booking publica sem sinal no corte atual | B-07 | FECHADO | booking por slug funcional |
| 8 | BA-08 | Fechar booking publica com sinal e webhook | BA-06 | FECHADO | servico com sinal cria `payment intent`, redireciona ao Checkout Pro, aprova pagamento em homologacao e retorna com booking confirmada no ambiente publicado |

## Trilha Beta D - Operacao e leitura minima

| Ordem | ID | Item | Dependencia | Status atual | Criterio de pronto |
| --- | --- | --- | --- | --- | --- |
| 9 | BA-09 | Agenda do dia no `admin-web` com acoes basicas | BA-01, BA-07 | PARCIAL | leitura de bookings pronta com filtros, acoes de confirmar/concluir/cancelar, reagendamento por slot e grade semanal com capacidade; calendario mensal/rico e drag-and-drop ainda pendentes |
| 10 | BA-10 | Clientes derivados dos bookings reais | BA-09 | PARCIAL | ultima visita e leitura basica prontas; historico detalhado e segmentacao ainda pendentes |
| 11 | BA-11 | Relatorios essenciais de beta | BA-09, BA-10 | NAO IMPLEMENTADO | agenda/receita/clientes sem retorno por periodo |

## Fora do beta AgendaAI

- estoque;
- producao;
- fiscal;
- pedidos de loja;
- add-ons de produto;
- analytics avancado;
- campanhas e marketing avancados.
