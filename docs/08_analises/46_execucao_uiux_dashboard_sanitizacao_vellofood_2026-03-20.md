# Execucao UI/UX Dashboard Sanitizado com Referencia Vello Food - 2026-03-20

## 1. Objetivo

Refinar a rota `#dashboard` do `admin-web` para sair do estado de leitura excessivamente empilhada e passar a uma composicao mais legivel, com:

- hierarquia visual mais curta;
- menos verborragia sobre lacunas na propria tela;
- separacao por contexto via tab bar;
- distribuicao de fluxo mais proxima da referencia do `Vello Food`;
- preservacao total dos contratos e leituras reais do AgendaAI.

## 2. Regra de precedencia usada

1. pedido atual do usuario para sanitizar a tela e parar de exibir excesso de texto/lacuna na interface;
2. shell e inventario oficiais do AgendaAI;
3. runtime real do `admin-web`;
4. referencia visual e de composicao do `Vello Food`.

## 3. Fontes consultadas

### AgendaAI

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\40_execucao_uiux_dashboard_document_view_2026-03-20.md`
- `C:\projetos\agendaai\README.md`
- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

### Vello Food

- `C:\projetos\vello_food\docs\v2\02_navegacao_shell\01_menu_rotas_e_shell_oficial_v2.md`
- `C:\projetos\vello_food\apps\backoffice-web\src\app\(dashboard)\page.tsx`
- `C:\projetos\vello_food\apps\backoffice-web\src\components\shell\navigation.tsx`

## 4. Decisao aplicada

O dashboard anterior estava correto em dados, mas ruim em composicao. Ele colocava:

- KPI;
- grafico;
- agenda;
- carteira;
- atalhos;
- observacoes de lacuna;
- explicacoes extensas;

tudo na mesma superficie.

O corte novo adota o principio:

- dashboard serve para leitura e distribuicao de fluxo;
- relatorios servem para leitura analitica mais detalhada;
- lacunas continuam documentadas, mas nao precisam poluir a tela principal.

## 5. O que mudou na UI

### 5.1 Hero e shell contextual

- o hero do modulo ficou mais curto;
- o badge textual de `stage` saiu da area principal do shell;
- a descricao da rota foi resumida para linguagem mais operacional.

### 5.2 Dashboard em visoes

O corpo da tela agora foi organizado em tres visoes por tab:

1. `Resumo executivo`
2. `Agenda da semana`
3. `Clientes e retorno`

Isso reduz a mistura de assuntos na mesma dobra e evita a leitura de um dashboard que parece relatorio, CRM e agenda ao mesmo tempo.

### 5.3 Painel de lacunas removido da tela

O bloco de `Impactos e observacoes` saiu do dashboard. A honestidade funcional continua preservada em:

- docs oficiais;
- relatorios dedicados;
- comportamento real da UI;

mas nao aparece mais como bloco poluidor na tela principal.

### 5.4 Aside mais objetivo

O aside agora muda conforme a aba ativa:

- `Resumo executivo`: base real + acessos rapidos;
- `Agenda da semana`: radar da semana + acessos rapidos;
- `Clientes e retorno`: base real + acessos rapidos.

## 6. Contratos preservados

Nenhum endpoint, payload ou regra de negocio foi alterado.

O dashboard continua consumindo:

- bootstrap admin;
- `bookings`;
- `clients`;
- `services`;
- `professionals`;
- `payment intents`;
- `cash entries`;
- `read model` de reports ja existente.

## 7. Arquivos alterados

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

## 8. Validacao executada

### Estrutural

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Resultado:

- `lint`: OK
- `build`: OK

### Browser QA

Base usada:

- `http://127.0.0.1:4173/#dashboard`

Validacoes executadas:

- carregamento com dados reais do tenant `Demo Studio`;
- tabs `Resumo executivo`, `Agenda da semana` e `Clientes e retorno`;
- leitura real de KPI, feed e carteira;
- ausencia de overflow horizontal em `desktop` e `390x844`.

Erro residual observado:

- `favicon.ico` ainda responde `404` no runtime local; nao tem relacao com este corte.

## 9. Conclusao

O dashboard ficou visivelmente mais legivel e mais coerente com o papel dele no shell:

- menos texto explicativo;
- menos mistura de dominios;
- mais navegacao por contexto;
- mais proximidade com a composicao enxuta observada no `Vello Food`.

## 10. Proximo passo recomendado

Continuar a mesma sanitizacao tela a tela, nesta ordem:

1. `Relatorios`
2. `Agenda / calendario`
3. `Clientes`
4. `Configuracoes`

O criterio continua sendo o mesmo: tirar texto estrutural da frente do usuario e deixar cada rota com uma narrativa visual unica, clara e operacional.
