# 56. Execucao: microcopy e estados vazios nas telas de detalhe

Data: 2026-03-20
Escopo: `apps/admin-web`, com reflexo na governanca documental do shell

## Objetivo

Sanear microcopy e estados vazios em telas de detalhe do `admin-web`, reduzindo linguagem tecnicista de `runtime`, `corte`, `contrato` e `lacuna` quando ela competia com a leitura principal de produto.

## Fontes consultadas

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `apps/admin-web/src/App.tsx`

## Regra de precedencia aplicada

1. `codigo real do admin-web`
2. `inventario canonico do shell`

O inventario foi usado para confirmar o papel de cada rota e materializar a regra de microcopy. O codigo real seguiu como fonte primaria para aplicar a limpeza sem criar divergencia funcional.

## Ajustes executados

### Catalogo

- `Escopo funcional desta rota` passou para `O que voce controla aqui`.
- `Fora do corte atual` passou para `Em evolucao`.
- descricoes do aside foram reescritas em linguagem de operacao comercial, sem destacar `payload`, `contrato` ou `runtime`.

### Clientes

- o detalhe do cliente deixou de falar em `lacunas explicitas do CRM atual`.
- a aba `Lacunas` passou para `Relacionamento`.
- `Leituras suportadas hoje` passou para `Disponivel hoje`.
- `Fora do corte atual` passou para `Em evolucao`.
- a listagem da carteira deixou de repetir `Leitura derivada de booking real` em cada card.
- estados vazios de bookings e movimentos ficaram mais legiveis e orientados ao usuario.
- `Sem e-mail visivel` foi consolidado como `Sem e-mail cadastrado`.

### Configuracoes

- `Taxonomia desta area` passou para `Nesta area`.
- `Fora do corte atual` passou para `Em evolucao`.
- descricoes do aside foram reescritas para falar em identidade publica, ambiente do tenant e temas administrativos em evolucao.

## Governanca documental atualizada

O inventario do shell agora explicita que:

- estados vazios, contexto e frentes em evolucao devem aparecer como apoio secundario;
- o detalhe de `Clientes` deve priorizar historico, receita e relacionamento, evitando microcopy tecnicista.

## Risco residual

- a limpeza desta passada e textual; nao altera fluxos nem contratos.
- ainda existem fallbacks tecnicos pontuais em outros trechos do `admin-web`, mas eles ja nao dominam as telas de detalhe principais.
