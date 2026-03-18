# Plano de Entrega 18-03-2026

## 1. Objetivo do dia

Ter uma jornada publica demonstravel em `18/03/2026`, sustentada por codigo real ja existente no `api-rest`.

## 2. Escopo do corte

Entram:

- leitura de tenant por `slug`;
- leitura de catalogo, profissionais e slots;
- selecao de servico, profissional, data e horario;
- captura de dados minimos do cliente;
- criacao de booking sem pagamento obrigatorio;
- confirmacao visual e estados de erro.

Nao entram:

- pagamento real;
- notificacao;
- dashboard admin;
- endurecimento de persistencia;
- GraphQL e analytics.

## 3. Sequencia de execucao

1. auditar gap exato entre `booking-web` e rotas publicas do `api-rest`;
2. travar contrato do corte em `.agents/contracts/2026-03-17_b07_booking-publico.md`;
3. implementar consumo real da API em `apps/booking-web`;
4. fechar submissao de booking apenas para servicos sem sinal obrigatorio;
5. validar build, testes e smoke;
6. atualizar auditoria e ponto de parada.

## 4. Regra de corte

Se o tempo apertar, priorizar:

1. uma jornada unica em uma unica rota funcional;
2. consumo real da API;
3. confirmacao real da booking;
4. copy honesta sobre o que ficou fora.

E melhor entregar uma jornada curta real do que um stepper falso.

## 5. Criterio de pronto

O corte de `18/03/2026` so pode ser tratado como pronto se:

1. `/:slug` carregar dados reais;
2. existir ao menos um fluxo de reserva completo sem provider externo;
3. `pnpm lint` passar;
4. `pnpm build` passar;
5. `pnpm --filter @agendaai/api-rest test` passar;
6. a doc final refletir exatamente o que entrou.

## 6. Status apos execucao

Status final desta sprint curta: pronto para demonstracao.

Evidencias fechadas nesta rodada:

1. `/:slug` carrega dados reais do tenant e do catalogo;
2. a jornada publica fecha booking sem sinal obrigatorio;
3. `pnpm --filter @agendaai/api-rest test` passou;
4. `pnpm lint` passou;
5. `pnpm build` passou;
6. smoke mobile e smoke HTTP foram executados sobre o slug `demo-studio-20260317`.

Fora do corte por decisao explicita:

1. `B-08` pagamento e sinal por provider;
2. notificacoes;
3. dashboard admin;
4. timezone hardening.
