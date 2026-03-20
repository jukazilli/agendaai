# Execucao UI/UX - Dashboard em Document View - 2026-03-20

## 1. Objetivo

Refinar a rota `#dashboard` do `admin-web` para o padrao de `document view`, preservando o papel definido no shell oficial:

- tela de leitura;
- ponto de entrada depois do login;
- distribuicao de fluxo para agenda, clientes, relatorios e booking publico;
- sem reabrir formularios de catalogo, equipe ou configuracoes dentro do dashboard.

## 2. Regra de precedencia usada

1. inventario oficial do shell administrativo;
2. leitura do dashboard ja implementado no runtime;
3. trilha historica dos cortes anteriores de `entity/document/master-detail` e do reflexo financeiro.

## 3. Documentacao consultada

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\17_admin_shell_referencia_gemini_contratos_e_plano.md`
- `C:\projetos\agendaai\docs\08_analises\27_execucao_b10_reflexo_financeiro_dashboard_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\38_validacao_contratos_api_ui_2026-03-20.md`

## 4. Codigo alterado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

## 5. Leitura encontrada antes da mudanca

O dashboard anterior ja possuia as leituras corretas:

- receita reconhecida;
- entrada online aprovada;
- ticket medio;
- no-show;
- preview de capacidade semanal;
- movimentos recentes de receita;
- atalhos para areas operacionais.

O problema estava na hierarquia:

- a tela ainda funcionava como um empilhado de grids antigos;
- o ponto de entrada do tenant nao tinha formato documental claro;
- a distribuicao de fluxo ficava correta funcionalmente, mas visualmente fragmentada.

## 6. Refinamento aplicado

### 6.1 Composicao principal

A rota `#dashboard` passou a usar `DocumentViewLayout`, com:

- `DocumentHeader` para slug, URL publica, timezone e janela ativa;
- `DocumentSummaryCards` para KPIs principais;
- `DocumentTabs` como taxonomia visual da leitura;
- `EntitySection` para chart, saude da agenda, receita recente e preview de retorno;
- `EntityAsideSummary` para base real do tenant, atalhos rapidos e radar da semana;
- `DocumentImpactPanel` para explicitar o que ja e suportado e o que ainda continua parcial.

### 6.2 Aderencia ao inventario

O dashboard continua obedecendo a regra do shell:

- leitura e distribuicao de fluxo;
- sem formularios completos;
- sem misturar implantacao, catalogo ou operacao detalhada na mesma tela.

### 6.3 Contratos

Nao houve mudanca em:

- `packages/contracts`;
- `apps/admin-web/src/lib/admin-api.ts`;
- `services/api-rest`.

Toda a rodada ficou restrita a composicao e estilo do frontend.

## 7. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Resultado:

- `lint`: OK
- `build`: OK

## 8. Resultado

O dashboard agora fica mais alinhado com a fundacao de patterns do projeto:

- entra como documento do tenant;
- resume indicadores sem competir com outras telas;
- direciona o owner para `Relatorios`, `Operacao`, `Agenda`, `Clientes` e `Booking` publico;
- continua expondo com honestidade o que ainda esta parcial no runtime.

## 9. Proximo corte recomendado

Seguir para `Configuracoes`, que ainda concentra blocos herdados do shell anterior e pode ganhar uma taxonomia mais limpa entre:

- identidade do negocio;
- publicacao/slug;
- pagamentos;
- ambiente administrativo.
