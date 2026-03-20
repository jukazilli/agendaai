# Browser QA do Admin e Refinamentos Responsivos - 2026-03-20

## 1. Objetivo

Executar QA real em navegador sobre as rotas refinadas do `admin-web`, validar shell lateral, responsividade e ausencia de regressao visual depois da adocao de `entity view`, `document view` e `master-detail`.

Escopo validado:

- `#dashboard`
- `#catalogo`
- `#profissionais`
- `#clientes`
- `#configuracoes`

## 2. Regra de precedencia usada

1. runtime real do `admin-web` em navegador;
2. inventario oficial do shell administrativo;
3. fundacao compartilhada em `packages/ui`.

## 3. Documentacao consultada

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\17_admin_shell_referencia_gemini_contratos_e_plano.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\37_refinamento_pos_entity_document_master_detail_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\39_execucao_uiux_clientes_master_detail_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\40_execucao_uiux_dashboard_document_view_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\41_execucao_uiux_configuracoes_entity_view_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\42_execucao_uiux_catalogo_entity_view_2026-03-20.md`

## 4. Codigo alterado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`
- `C:\projetos\agendaai\packages\ui\src\foundations.css`

## 5. Bugs reais encontrados

### 5.1 Shell lateral herdando estado no cruzamento de breakpoint

Leitura encontrada:

- o drawer lateral podia herdar estado de uma sessao anterior quando a viewport atravessava o breakpoint entre desktop e compacto;
- isso abria espaco para o menu continuar aberto ao voltar para mobile, cobrindo a tela inteira sem o usuario ter acabado de pedir isso.

Causa:

- o estado do shell nao tinha sincronizacao explicita ao cruzar o breakpoint de `1100px`.

Correcao:

- adicionado sincronismo de modo do shell em `App.tsx`;
- ao entrar no modo compacto, o drawer passa a iniciar fechado e expandido;
- ao cruzar de compacto para desktop, o estado aberto do drawer deixa de vazar.

### 5.2 Overflow horizontal em `#clientes` no mobile

Leitura encontrada:

- em `390px`, a rota `#clientes` ainda gerava `scrollWidth` maior que `clientWidth`;
- o problema nao estava no contrato nem no fetch, e sim na composicao do shell com cards e summaries ainda calculando largura acima do container.

Causa:

- layouts compartilhados e cards do admin ainda deixavam alguns blocos em largura intrinseca;
- no topo do card de cliente, e-mails longos e KPIs competiam horizontalmente no mesmo bloco.

Correcao:

- containers compartilhados passaram a respeitar `width: 100%` e `min-width: 0` em `packages/ui`;
- `admin-topbar`, `admin-stage-content`, `admin-page-hero`, `admin-content`, `records-column`, `record-meta` e `record-card` foram travados ao container;
- no mobile, o topo do card de cliente passou a empilhar e o texto passou a aceitar quebra segura.

## 6. Refinamento aplicado

### 6.1 Shell

- shell compacto agora entra em estado deterministico;
- menu lateral abre/fecha corretamente sem herdar colapso indevido ao atravessar o breakpoint.

### 6.2 Shared UI

- `ag-view-layout`, `ag-view-header`, `ag-view-panel`, `ag-view-shell`, `ag-document-grid` e `ag-master-detail-grid` passaram a respeitar o container;
- `ag-document-summary-grid` passa para uma coluna em telas pequenas.

### 6.3 Clientes mobile

- o header documental continua funcional;
- os cards da lista deixam de vazar horizontalmente;
- o topo do card empilha melhor em largura reduzida.

## 7. Validacao executada

### 7.1 Browser QA real

Servidor local:

- `pnpm --dir C:\projetos\agendaai\apps\admin-web dev -- --host 127.0.0.1 --port 4173`

Fluxos validados com Playwright:

- colapsar e expandir o menu lateral no desktop;
- abrir e fechar drawer lateral no mobile;
- navegar entre `dashboard`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
- validar `#clientes` com filtro ativo;
- validar `#profissionais` com abertura do workspace de horarios;
- repetir matriz de viewport com fresh load.

Viewports validados:

- `1440x960`
- `1024x900`
- `390x844`

Resultado final da matriz:

- sem overflow horizontal em todas as rotas refinadas;
- `sidebarOpen=false` em fresh load para tablet/mobile;
- `sidebarCollapsed=false` em fresh load para tablet/mobile.

### 7.2 Validacao estrutural

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/ui lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/ui build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web build`

Resultado:

- `@agendaai/ui`: OK
- `@agendaai/admin-web`: OK
- `@agendaai/booking-web`: OK

## 8. Observacoes residuais

Notas nao bloqueantes vistas no browser:

- `favicon.ico` ainda responde `404` no servidor local do admin;
- `Configuracoes` ainda emite aviso de `autocomplete` em alguns inputs no console.

Esses pontos nao quebram fluxo, contrato nem responsividade do shell.

## 9. Resultado

O admin refinado agora fecha melhor como produto:

- shell lateral consistente em desktop, tablet e mobile;
- rotas principais sem overflow horizontal;
- `Clientes` estabilizado no mobile;
- shared UI mais resiliente para o restante do monorepo.

## 10. Proximo corte recomendado

Com o admin principal estabilizado visualmente, o proximo passo mais valioso passa a ser um de dois caminhos:

- `Relatorios`, para fechar a ultima area administrativa de leitura mais pesada;
- acabamento de console/UX tecnico, resolvendo `favicon` e `autocomplete warnings`.
