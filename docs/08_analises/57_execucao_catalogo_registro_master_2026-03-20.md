# 57. Execucao: catalogo em registro master

Data: 2026-03-20
Escopo: `apps/admin-web`, rota `#catalogo`

## Objetivo

Corrigir a semantica do `entity workspace` no `Catalogo`, tirando a tela do falso `master-detail` e recolocando a entidade simples no formato de `registro master`, com lista principal e acoes explicitas de `novo`, `visualizar` e `editar`.

## Fontes consultadas

### AgendaAI

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

### Vello Food

- `docs/v2/03_padroes_ui/03_especificacao_das_libs_e_componentes_oficiais_v2.md`
- `docs/v2/03_padroes_ui/04_manual_operacional_de_uso_da_fundacao_visual_v2.md`

## Regra de precedencia aplicada

1. papel funcional das rotas do `AgendaAI`;
2. implementacao real do `admin-web`;
3. Vello Food como referencia conceitual de browse vs entity view.

O Vello foi usado para confirmar a semantica: browse de cadastro simples precisa nascer como lista principal com acoes explicitas, enquanto `entity view` e `master-detail` devem entrar apenas quando a natureza da entidade justificar.

## Ajustes executados

- a rota `#catalogo` deixou de autoabrir o primeiro servico como se a tela inteira fosse um detalhe;
- o topo da rota virou `Catalogo de servicos`, sem trocar o titulo da pagina a cada registro;
- a lista principal passou a usar linhas zebrada e selecao explicita de registro;
- as acoes `Novo`, `Visualizar` e `Editar` passaram a comandar o workspace;
- `visualizar` e `editar` agora aparecem abaixo da lista, no mesmo contrato da rota, sem painel lateral permanente;
- o form continua real e ligado aos contratos ja existentes de create/update/delete.

## Governanca documental atualizada

O inventario oficial do shell agora explicita que:

- `catalogo` deve operar como `registro master`;
- `master-detail` fica reservado para vinculos mais densos, como `profissionais` com `servicos` e `horarios`.

## Risco residual

- `Profissionais` ainda nao foi migrado para um `master-detail` relacional; isso fica como proxima passada coerente.
- o build continua com warning de chunk grande, sem relacao com este corte.
