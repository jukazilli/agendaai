# Execucao UI/UX - Configuracoes em Entity View - 2026-03-20

## 1. Objetivo

Refinar a rota `#configuracoes` do `admin-web` para o padrao de `entity view`, respeitando o papel definido no shell:

- manutencao continua do tenant;
- separacao clara entre publicacao, branding, pagamentos e ambiente;
- sem transformar a tela em deposito de blocos operacionais.

## 2. Regra de precedencia usada

1. inventario oficial do shell administrativo;
2. implementacao real ja existente em `admin-web`;
3. trilha historica dos cortes anteriores de patterns e de validacao contratual.

## 3. Documentacao consultada

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\17_admin_shell_referencia_gemini_contratos_e_plano.md`
- `C:\projetos\agendaai\docs\08_analises\38_validacao_contratos_api_ui_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\39_execucao_uiux_clientes_master_detail_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\40_execucao_uiux_dashboard_document_view_2026-03-20.md`

## 4. Codigo alterado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

## 5. Leitura encontrada antes da mudanca

A rota `#configuracoes` ja possuia os blocos corretos do runtime:

- slug publica;
- branding minimo;
- `payment settings` do Mercado Pago;
- parametros do ambiente administrativo.

O problema estava na composicao:

- menu lateral fake, sem estado real;
- blocos empilhados sem hierarquia de manutencao;
- itens fora do corte competindo visualmente com os fluxos realmente editaveis.

## 6. Refinamento aplicado

### 6.1 Composicao principal

A rota passou a usar `EntityViewLayout`, com:

- `EntityIdentityCard` para resumir negocio, slug, timezone, status de pagamento e URL publica;
- `EntitySection` para:
  - publicacao e slug;
  - branding minimo;
  - pagamentos;
  - ambiente administrativo.

### 6.2 Taxonomia do aside

O antigo menu lateral foi substituido por `EntityAsideSummary`, separando:

- o que esta realmente mantido na area;
- o que continua fora do corte atual.

Isso deixa explicito que:

- assinatura do SaaS ainda nao existe;
- observabilidade avancada de webhook ainda nao existe;
- update amplo de perfil do negocio ainda nao tem contrato completo.

### 6.3 Contratos

Nao houve alteracao em:

- `packages/contracts`;
- `apps/admin-web/src/lib/admin-api.ts`;
- `services/api-rest`.

Os mesmos handlers e rotas continuaram sendo usados para salvar:

- `slug`;
- branding minimo;
- `payment settings`.

## 7. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Resultado:

- `lint`: OK
- `build`: OK

## 8. Resultado

A tela `Configuracoes` agora fica coerente com a linha adotada nas outras rotas refinadas:

- `Dashboard` como `document view`;
- `Clientes` como `master-detail`;
- `Profissionais` como `entity view`;
- `Configuracoes` como `entity view` do tenant.

O corte manteve os formularios reais e apenas reorganizou a leitura e a navegacao interna da pagina.

## 9. Proximo corte recomendado

O proximo passo natural no `admin-web` e revisar `Catalogo`, que ainda funciona bem, mas continua mais proximo de um editor legado do que do mesmo nivel de acabamento agora atingido por:

- `Profissionais`;
- `Clientes`;
- `Dashboard`;
- `Configuracoes`.
