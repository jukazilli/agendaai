# Refinamento Pos Entity/Document/Master-Detail - 2026-03-20

## 1. Objetivo

Executar a segunda passada de refinamento apos a adocao de `entity view`, `document view` e `master-detail` no `AgendaAI`, com foco em:

- limpar legado morto deixado na transicao do `admin-web`;
- ajustar densidade e largura dos novos patterns;
- garantir consistencia documental entre shell, design system e runtime atual;
- validar que o corte segue restrito a `apps/admin-web`, `apps/booking-web` e `packages/ui`.

## 2. Fontes consultadas

### 2.1 Documentacao

- `C:\projetos\agendaai\README.md`
- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\04_padroes_ui\02_design_system.md`
- `C:\projetos\agendaai\docs\08_analises\34_execucao_uiux_shell_admin_referencia_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\35_execucao_uiux_profissionais_referencia_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`

### 2.2 Codigo verificado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`
- `C:\projetos\agendaai\apps\admin-web\vite.config.ts`
- `C:\projetos\agendaai\apps\booking-web\app\globals.css`
- `C:\projetos\agendaai\packages\ui\src\foundations.css`
- `C:\projetos\agendaai\packages\ui\src\patterns.tsx`

## 3. Regra de precedencia

1. runtime e contratos reais do `AgendaAI`;
2. inventario oficial do shell administrativo;
3. design system/tokens oficiais do `AgendaAI`;
4. execucoes anteriores como trilha historica de decisao.

Nao houve evidencia de documento oficial pedindo para manter o JSX legado morto. Nesse ponto, o codigo real e o inventario do shell convergiam: `profissionais` e `agenda` ja tinham migrado semanticamente para os novos patterns, entao o legado abaixo dos novos `return`s era apenas sobra tecnica.

## 4. Divergencias encontradas

### 4.1 `admin-web`

- `renderProfessionalProfileWorkspace()` ainda carregava um bloco inteiro antigo logo abaixo do novo `EntityViewLayout`;
- `renderProfessionalAvailabilityWorkspace()` repetia o mesmo problema;
- `renderAgendaViewV2()` mantinha um ramo diario antigo morto depois da introducao de `renderAgendaDayMasterDetail()`.

### 4.2 `booking-web`

- o novo `master-detail` estava correto estruturalmente, mas ainda comprimido pela largura antiga de `720px`, o que enfraquecia o ganho visual em desktop.

### 4.3 Empacotamento

- o `admin-web` continuava sujeito a falha de build no Vite para resolver `@agendaai/ui/foundations.css` sem alias explicito de monorepo.

## 5. Refinamento aplicado

### 5.1 Limpeza estrutural no `admin-web`

- remocao dos blocos mortos remanescentes em `profissionais`;
- remocao do ramo diario morto da agenda apos a introducao do `master-detail`;
- simplificacao do header de `semana/mes` para parar de carregar labels de `dia` em trecho inalcançavel;
- normalizacao pontual de separadores para ASCII seguro nos trechos tocados.

### 5.2 Densidade dos patterns compartilhados

Em `packages/ui/src/foundations.css`:

- reducao controlada de gaps gerais do layout;
- reducao de padding dos paineis;
- ajuste da escala do titulo principal;
- reducao visual dos summary cards;
- colunas de `aside` e `master-detail` ligeiramente mais densas.

### 5.3 Booking publico

Em `apps/booking-web/app/globals.css`:

- largura do `booking-shell` e da `progress-strip` ampliada para o novo `master-detail`;
- `booking-document-shell` alinhado com a mesma largura maxima;
- painel lateral do resumo mantido com `sticky` e `align-self: start`.

### 5.4 Build do `admin-web`

Em `apps/admin-web/vite.config.ts`:

- alias explicito para `@agendaai/ui`;
- alias explicito para `@agendaai/ui/foundations.css`.

## 6. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/ui lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/ui build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/booking-web build`

## 7. Browser QA

Tentativas executadas em 20/03/2026:

- preview estatico do `admin-web` via `python -m http.server` sobre `dist/`;
- smoke em `http://127.0.0.1:3000/demo-studio-20260317` para o `booking-web`.

Resultado:

- o terminal desta sessao bloqueou mecanismos de processo em background, o que impediu manter um preview local do `admin-web` vivo pelo fluxo normal de smoke;
- a tentativa de smoke no `booking-web` local encontrou `Internal Server Error` no runtime ja existente na porta `3000`;
- portanto, a validacao visual desta rodada ficou parcial e a evidencia forte desta passada ficou concentrada em diff estrutural + `lint/build`.

## 8. Resultado

O corte agora fica mais consistente com o proprio veredito tecnico da rodada anterior:

- sem JSX legado morto nos pontos criticos da migracao;
- com patterns mais densos e menos "grandalhoes";
- com `booking-web` melhor acomodado ao `master-detail`;
- com `admin-web` voltando a buildar de forma deterministica no monorepo.

O que continua em aberto nao e mais estrutura nem consistencia documental; e apenas a rodada final de smoke visual em runtime local controlado quando a sessao permitir manter os dois frontends vivos ao mesmo tempo.
