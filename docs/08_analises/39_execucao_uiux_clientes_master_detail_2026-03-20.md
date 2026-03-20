# Execucao UI/UX - Clientes em Master-Detail - 2026-03-20

## 1. Objetivo

Aplicar o padrao ja adotado de `master-detail` e `document view` na rota `#clientes` do `admin-web`, sem alterar contratos de backend e sem misturar a leitura de carteira com CRM avancado ainda fora do corte.

## 2. Regra de precedencia usada

1. inventario oficial do shell administrativo;
2. codigo real da rota `Clientes` no `admin-web`;
3. trilha historica das execucoes de CRM e dos patterns compartilhados.

## 3. Documentacao consultada

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\31_execucao_b10_b11_b12_cash_entry_crm_catalogo_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\37_refinamento_pos_entity_document_master_detail_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\38_validacao_contratos_api_ui_2026-03-20.md`

## 4. Codigo alterado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

## 5. Leitura encontrada antes da mudanca

A rota `#clientes` ja possuia os dados corretos:

- carteira derivada de `bookings`;
- segmento por janela de retorno;
- historico do cliente;
- movimentos financeiros persistidos.

O problema era de composicao:

- lista e detalhe competiam no mesmo canvas;
- o detalhe era uma pilha de cards sem hierarquia documental clara;
- a selecao podia continuar apontando para um cliente fora do filtro ativo.

## 6. Refinamento aplicado

### 6.1 Composicao da tela

A rota `#clientes` passou a usar:

- `MasterDetailLayout` para separar carteira e detalhe;
- `DocumentSummaryCards` no master para leitura rapida da base;
- `DocumentHeader`, `DocumentSummaryCards`, `DocumentTabs`, `DocumentTimeline` e `DocumentImpactPanel` no detalhe do cliente.

### 6.2 Comportamento

Foi ajustada a logica de selecao para manter coerencia com o filtro ativo:

- se o filtro atual nao retorna clientes, o detalhe fica vazio;
- se o cliente selecionado sai do filtro, a selecao migra para o primeiro cliente visivel;
- nao existe mais fallback silencioso para cliente fora do recorte atual.

### 6.3 Densidade visual

Os cards da carteira ganharam:

- hierarquia mais clara entre nome, receita, segmento e historico;
- grade de metadados em vez de varias linhas horizontais soltas;
- estado ativo mais evidente sem exagerar no destaque.

## 7. Contratos e backend

Nao houve alteracao em:

- `packages/contracts`;
- `apps/admin-web/src/lib/admin-api.ts`;
- `services/api-rest`.

Esta rodada ficou restrita a composicao e estilo da interface administrativa, sustentada pela validacao de contratos registrada em:

- `C:\projetos\agendaai\docs\08_analises\38_validacao_contratos_api_ui_2026-03-20.md`

## 8. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Resultado:

- `lint`: OK
- `build`: OK

## 9. Resultado

A rota `Clientes` agora fica consistente com a direcao adotada em `Profissionais`, `Agenda` e `Booking`:

- lista a esquerda como carteira operacional;
- detalhe a direita como leitura documental do cliente;
- lacunas de CRM avancado continuam explicitas, sem fingir funcionalidade que o runtime ainda nao suporta.

## 10. Proximo corte recomendado

Seguir para `Dashboard` ou `Configuracoes`, porque ambos ainda carregam composicoes mais antigas e se beneficiam da mesma limpeza de hierarquia visual que acabou de entrar em `Clientes`.
