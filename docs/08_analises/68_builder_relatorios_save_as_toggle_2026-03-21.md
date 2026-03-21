# 68. Builder Relatorios Save As e Toggle de Workspace

Data: `2026-03-21`  
Projeto: `agendaai`  
Modulo: `Relatorios`

## 1. Objetivo

Corrigir dois pontos de UX/comportamento no builder:

- manter o controle de `Ocultar builder` e `Mostrar builder` sempre acessivel;
- impedir que `Salvar modelo` sobrescreva um modelo salvo ja existente.

## 2. Ajustes aplicados

### 2.1 Toggle do builder

O botao de recolher o builder saiu do header interno do painel lateral e foi movido para a topbar de acoes do modulo.

Motivo:

- quando o painel era ocultado, o proprio botao desaparecia junto com ele;
- isso impedia reabrir o builder sem recarregar ou depender de outro fluxo.

Resultado:

- `Ocultar builder` e `Mostrar builder` agora ficam sempre visiveis na topbar do modulo.

### 2.2 Salvar modelo como nova definicao

A acao `Salvar modelo` foi reinterpretada como `salvar como`.

Regra nova:

- abrir um modelo salvo;
- alterar nome, filtros ou estrutura;
- clicar em `Salvar modelo`;
- cria uma nova `report_definition`;
- o modelo anterior continua preservado.

O builder nao sobrescreve mais o ultimo modelo salvo por padrao.

## 3. Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- browser QA em `http://127.0.0.1:4173/#relatorios`

Evidencia funcional:

- o toggle mudou entre `Mostrar builder` e `Ocultar builder` sem sumir da tela;
- o modelo salvo `RPT-0001` permaneceu intacto;
- um novo save a partir dele gerou `RPT-0002`;
- o modal `Modelos salvos` passou a listar os dois.
