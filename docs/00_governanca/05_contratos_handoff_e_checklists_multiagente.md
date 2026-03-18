# Contratos, Handoffs e Checklists Multiagente

## 1. Finalidade

Este documento define os artefatos obrigatorios para um corte multiagente do `agendaai`.

Handoff aqui nao e resumo informal.

Handoff e contrato de integracao.

## 2. Artefatos obrigatorios por corte

Todo corte multiagente deve possuir:

1. contrato do corte;
2. `write set` por squad;
3. `Definition of Done`;
4. handoff individual por squad;
5. checklist de integracao;
6. checklist de verificacao;
7. registro de decisoes adiadas;
8. atualizacao documental e auditoria.

## 3. Contrato oficial do corte

O contrato deve conter:

- identificacao do corte;
- backlog e jornada de origem;
- objetivo;
- problema a fechar;
- restricoes;
- squads autorizados;
- `write set` por squad;
- validacao obrigatoria;
- o que fica explicitamente fora.

## 4. Handoff minimo por squad

Cada squad deve receber:

- papel;
- objetivo local;
- arquivos permitidos;
- arquivos proibidos;
- entradas obrigatorias;
- saida esperada;
- validacao local;
- decisao que o squad nao pode reabrir.

## 5. Handoff do Research Squad

Deve conter:

- pergunta a responder;
- fontes oficiais do projeto;
- referencias externas permitidas;
- formato de resposta em `fit`, `adapt` ou `reject`;
- reflexo pratico no corte.

## 6. Handoff do Backend Core Squad

Deve conter:

- endpoints, contratos e agregados afetados;
- limites entre `services/*` e `packages/*`;
- impactos cruzados em booking, agenda ou admin;
- validacao minima: lint, build, teste e smoke quando aplicavel.

## 7. Handoff do Frontend Booking Squad

Deve conter:

- rota ou shell publico afetado;
- contrato de dados;
- estados obrigatorios: `loading`, `empty`, `error`, `success`;
- restricoes de UX do corte;
- nao inventar provider ou regra de pagamento fora do backlog.

## 8. Handoff do Frontend Admin Squad

Deve conter:

- rota admin afetada;
- dependencia de auth, tenant context e contrato de dados;
- estados obrigatorios;
- restricoes de navegacao e permissao.

## 9. Handoff do Docs / Audit Squad

Deve conter:

- documentos de origem;
- backlog afetado;
- auditorias e checkpoints a atualizar;
- divergencias encontradas entre doc e codigo;
- fonte priorizada na decisao.

## 10. Handoff do Integrador

Deve conter:

- handoffs recebidos;
- conflitos encontrados;
- decisoes de consolidacao;
- validacoes integradas exigidas;
- risco residual.

## 11. Handoff do QA / Verification Squad

Deve conter:

- comandos de validacao;
- jornada a exercer;
- evidencia obrigatoria;
- criterio para marcar `FECHADO`, `PARCIAL` ou `BLOQUEADO`.

## 12. Checklist de integracao

Antes de integrar, verificar:

1. o contrato do corte esta fechado;
2. cada squad respeitou seu `write set`;
3. frontend e backend falam o mesmo contrato;
4. docs e auditoria refletem o que entrou;
5. as decisoes adiadas foram registradas;
6. nenhuma nova lacuna ficou silenciosa.

## 13. Checklist de verificacao final

Antes de fechar o corte, verificar:

1. `pnpm lint`;
2. `pnpm build`;
3. `pnpm --filter @agendaai/api-rest test`;
4. smoke da jornada afetada;
5. consistencia entre doc, codigo e UI;
6. proximo ponto seguro documentado.

## 14. Criterios para recusar um handoff

Um handoff deve ser recusado quando:

- mexe fora do `write set`;
- reabre decisao travada no contrato;
- entrega runtime sem refletir docs;
- entrega doc sem verificar o runtime;
- declara pronto sem evidencias;
- deixa lacuna relevante sem classificacao.

## 15. Templates operacionais

Os templates praticos vivem em:

- `.agents/templates/contrato-de-corte.md`
- `.agents/templates/handoff-de-squad.md`
- `.agents/templates/checklist-integracao.md`
