# 50. Hardening da agenda e limpeza de legado

Data: 20/03/2026  
Escopo: `apps/admin-web`  
Rotas impactadas: `#agenda`

## Objetivo

Fechar a segunda passada da rota de agenda apos a implantacao do calendario React, removendo codigo morto e corrigindo uma deriva de navegacao de data que ainda vinha do shell antigo.

## Precedencia usada

1. Rota ativa implementada em `#agenda`
2. Shell oficial em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
3. Build/lint do `@agendaai/admin-web`

## O que foi saneado

- remocao do legado morto da agenda antiga em `apps/admin-web/src/App.tsx`:
  - `renderAgendaView`
  - `renderAgendaWeekView`
  - `renderAgendaMonthView`
  - `renderAgendaDayMasterDetail`
  - `renderAgendaRecords`
  - `handleOpenAgendaWeekBooking`
  - `handleOpenAgendaMonthDate`
  - `BookingFilter`, `bookingFilter`, `agendaBookings`
  - helpers mortos `filterAgendaBookings`, `isAgendaDayMode` e `formatAgendaMonthDayNumber`
- remocao de CSS morto em `apps/admin-web/src/styles.css` relacionado a:
  - grade semanal antiga
  - grade mensal antiga
  - `agenda-master-detail`
- correcao de navegacao de data:
  - o deslocamento `Anterior/Proximo` agora respeita o workspace ativo
  - em `Lista`, a data sempre avanca/retrocede por dia
  - em `Agenda`, o deslocamento continua por dia/semana/mes conforme a subvisao ativa

## Resultado

- a rota `#agenda` passa a ter uma unica implementacao ativa
- a manutencao fica menos ambigua, sem duplicidade de fluxo visual
- a navegacao entre `Lista` e `Agenda` deixa de carregar comportamento residual do calendario antigo

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Ambos passaram em 20/03/2026.

## Residuais

- o bundle do `admin-web` continua emitindo warning de chunk grande no build; nao bloqueia este corte
- nao houve nova rodada de browser QA nesta passada porque a limpeza foi estrutural, sem alterar a superficie funcional ja validada na execucao `49`
