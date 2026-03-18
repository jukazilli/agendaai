# Catalogo Operacional de Agentes - AgendaAI

## Finalidade

Esta pasta traduz a governanca ativa do `agendaai` em papeis, contratos e workflows operacionais.

Ela existe para acelerar cortes reais sem perder precedencia documental.

## Leitura obrigatoria

Antes de usar qualquer artefato desta pasta, ler:

1. `README.md`
2. `docs/00_governanca/00_documento_mestre_aplicacao_framework.md`
3. `docs/00_governanca/04_modelo_operacional_multiagente.md`
4. `docs/00_governanca/05_contratos_handoff_e_checklists_multiagente.md`
5. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
6. a ultima analise relevante em `docs/08_analises/`

Se houver conflito, `docs/` vence e `.agents/` deve ser corrigida.

## Estrutura

- `roles/`: papeis oficiais por squad
- `templates/`: contrato, handoff e checklist
- `workflows/`: sequencias operacionais reaproveitaveis
- `contracts/`: contratos ativos por corte
- `handoffs/`: entregas registradas por squad

## Regra de uso

- nao delegar sem contrato;
- nao paralelizar ambiguidade;
- respeitar `write set`;
- integrar sob um unico responsavel;
- atualizar docs junto com codigo.
