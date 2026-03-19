# Execucao B-08 - Shell Admin Operacional

## 1. Objetivo

Materializar a primeira versao operacional do `admin-web`, tirando a superficie administrativa do estado de placeholder e ligando onboarding, slug, Mercado Pago, servicos, profissionais, disponibilidade e leitura basica da operacao ao `api-rest` real.

## 2. O que entrou

- `admin-web` autenticado com login e onboarding reais;
- persistencia local de `apiBaseUrl` e sessao admin;
- configuracao de slug publica;
- configuracao tenant-level de Mercado Pago;
- cadastro e edicao de servicos com `paymentPolicy`;
- cadastro e edicao de profissionais com especialidades;
- configuracao semanal de disponibilidade;
- leitura de clientes e bookings gerados pela jornada real;
- `api-rest` com CORS liberado para operacao cross-origin do shell admin.

## 3. Arquivos tocados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/lib/admin-api.ts`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/package.json`
- `services/api-rest/src/app.ts`

## 4. O que ainda nao entrou

- acoes administrativas de confirmar, concluir, cancelar e reagendar booking;
- homologacao externa do Mercado Pago no corte beta;
- suporte publico a `checkout_transparente`;
- branding minimo configuravel no shell.

## 5. Validacao

- `pnpm lint`
- `pnpm build`
- `pnpm --filter @agendaai/api-rest test`

## 6. Leitura objetiva do estado

O `AgendaAI` agora tem duas visoes tecnicamente conectadas:

- visao publica do cliente para escolher e agendar;
- visao administrativa do negocio para implantar e operar a base comercial.

O proximo corte estrutural deixa de ser a fundacao do runtime e passa a ser a homologacao externa do fluxo de sinal, seguida do fechamento das acoes administrativas reais sobre booking.

## 7. Releitura posterior

As acoes administrativas basicas de booking foram materializadas depois em `docs/08_analises/15_execucao_b09_agenda_admin_operacional.md`. Este registro permanece como marco da abertura do shell admin, nao do fechamento da agenda operacional.
