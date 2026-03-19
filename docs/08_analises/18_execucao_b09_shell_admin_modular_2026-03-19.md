# Execucao B-09 - Shell Admin Modular

## 1. Objetivo do corte

Materializar o primeiro shell administrativo realmente navegavel do `agendaai`, saindo do modelo `single-page` e refletindo no runtime a separacao documentada entre:

- leitura executiva;
- operacao do dia;
- catalogo comercial;
- equipe;
- clientes;
- configuracoes e implantacao.

## 2. Referencia adotada

O mock fornecido pelo usuario via referencia Gemini foi usado como guia de:

- navegacao lateral por modulos;
- hierarquia entre `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
- shell com topo contextual e area central por tela.

Ele nao foi copiado cegamente. O corte preserva:

- paleta e tipografia do `AgendaAI`;
- contratos reais ja ligados no `api-rest`;
- principio de marcar explicitamente como `(nao funcional)` o que nao existe nos contratos/read models.

## 3. Implementacao realizada

### Runtime

- `apps/admin-web/src/App.tsx`
  - introduziu navegacao modular por `hash`;
  - separou views reais de `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
  - moveu slug e Mercado Pago para `configuracoes`;
  - manteve agenda operacional como view independente;
  - materializou dashboard honesto, com leitura real e blocos analiticos marcados como `(nao funcional)`.

- `apps/admin-web/src/styles.css`
  - criou shell com sidebar persistente no desktop;
  - criou drawer mobile para navegacao;
  - separou header contextual, stage principal e views;
  - manteve responsividade dos formularios e do layout operacional.

### Validacao local

- `pnpm --filter @agendaai/admin-web lint`
- `pnpm --filter @agendaai/admin-web build`

Ambos passaram em `19/03/2026`.

## 4. O que agora esta realmente coberto no shell

- `Dashboard`
  - resumo do tenant;
  - atalhos para modulos;
  - cards reais baseados no bootstrap atual.

- `Operacional`
  - filtros `Hoje`, `Em aberto` e `Tudo`;
  - acoes de `confirmar`, `concluir` e `cancelar` booking;
  - leitura de status do dia.

- `Agenda`
  - timeline operacional baseada nos bookings reais;
  - estado `PARCIAL` explicito para calendario rico.

- `Catalogo`
  - edicao de servicos e politica comercial.

- `Profissionais`
  - edicao de equipe, especialidades e disponibilidade semanal.

- `Clientes`
  - leitura derivada de bookings reais.

- `Configuracoes`
  - slug publica;
  - configuracao do Mercado Pago;
  - ambiente administrativo do tenant.

## 5. O que segue como lacuna explicita

- grafico de faturamento e agendamentos `(nao funcional)`;
- dica automatica de reativacao `(nao funcional)`;
- calendario rico e reagendamento `(nao funcional/parcial)`;
- WhatsApp operacional `(nao funcional)`;
- LTV, score e segmentacao de clientes `(nao funcional)`;
- assinatura do proprio `AgendaAI` `(nao funcional)`.

## 6. Impacto no backlog

- `BA-02` pode ser tratado como `FECHADO`;
- `B-09` continua `PARCIAL`, mas agora a lacuna deixou de ser shell e passou a ser calendario/reagendamento/read models;
- o proximo corte estrutural volta a ser `B-08` homologacao real do Mercado Pago e, em seguida, o endurecimento funcional de `B-09`.
