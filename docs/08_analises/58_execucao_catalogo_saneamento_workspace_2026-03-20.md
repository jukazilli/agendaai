# 58. Execucao UI/UX - saneamento do workspace de catalogo

Data: 2026-03-20  
Escopo: `apps/admin-web`  
Rota: `#catalogo`

## Objetivo

Remover do `catalogo` os blocos narrativos e resumos redundantes que estavam poluindo o `registro master`.

## Ajuste aplicado

- remocao do `identity card` do `catalogo`;
- remocao dos blocos `Politica comercial atual`, `O que voce controla aqui` e `Em evolucao`;
- remocao da microcopy redundante do topo e das secoes do workspace;
- preservacao apenas da lista zebrada de registros e das acoes explicitas `Novo`, `Visualizar` e `Editar`;
- preservacao do detalhe do registro apenas quando o usuario entra em `visualizar`, `editar` ou `novo`.

## Regra consolidada

Para entidades simples de cadastro, o `workspace` deve nascer como `registro master` enxuto.  
Explicacoes, frentes futuras e resumos laterais nao devem competir com a lista principal nem com o formulario do registro.

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

## Residual

- O corte foi focado no `catalogo`.
- A mesma regra deve ser usada ao revisar outras entidades simples do admin.
