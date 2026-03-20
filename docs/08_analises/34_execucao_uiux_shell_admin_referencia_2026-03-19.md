# Execucao UI/UX - Shell Admin por Referencia - 2026-03-19

## Objetivo

Iniciar a rodada pesada de UI/UX do `agendaai` pelo `admin-web`, adotando a referencia visual validada pelo usuario sem romper contratos reais de backend, mutacoes administrativas e navegacao canonica.

## Skills e precedencia usadas

- `front-side-by-side-adoption`
- `consistencia-documental`

Precedencia aplicada:

1. `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
2. `docs/04_padroes_ui/02_design_system.md`
3. runtime real em `apps/admin-web/src/App.tsx`, `apps/admin-web/src/lib/admin-api.ts` e `packages/contracts`
4. referencia visual fornecida pelo usuario como guia de layout, nao como fonte de verdade funcional

## Regra do corte

Este corte:

- preserva rotas, fetches, mutacoes e contratos do `api-rest`;
- transplanta shell, sidebar, topbar, hero contextual, dashboard e operacao diaria para a linguagem da referencia;
- reusa dados reais do runtime onde a referencia usava mocks;
- mantem marcacao explicita de `(nao funcional)` onde a referencia sugere inteligencia ou integracoes nao existentes.

## Codigo alterado

- `apps/admin-web/package.json`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `pnpm-lock.yaml`

## Entrega executada

- adicao de `lucide-react` ao `admin-web`;
- shell administrativo novo com:
  - sidebar escura colapsavel;
  - topbar clara com busca, notificacao e CTA;
  - hero contextual por rota;
  - composicao visual inspirada diretamente na referencia aprovada;
- dashboard transplantado para a nova hierarquia visual, agora usando:
  - metricas reais;
  - grafico SVG derivado do runtime;
  - atalhos operacionais;
  - bloco de capacidade semanal;
- operacao diaria transplantada para lista/timeline mais densa, com:
  - status visuais melhores;
  - acoes reais de booking preservadas;
  - CTA de reagendamento e sync de pagamento intactos;
- configuracoes reorganizadas em shell lateral interno, mantendo:
  - slug;
  - branding minimo;
  - Mercado Pago;
  - ambiente administrativo;
- alinhamento visual base das demais rotas sem trocar contratos nem handlers.

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai install --filter @agendaai/admin-web...`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`
- preview local do `admin-web` em `http://127.0.0.1:4176`
- inspecao por browser automation contra `https://agendaai-eu7w.onrender.com` como API base

## Resultado

O `admin-web` deixa de estar apenas funcional com shell modular e passa a entrar na fase de adocao pesada de UI/UX. O corte atual reestiliza com fidelidade maior:

- shell;
- dashboard;
- operacao diaria;
- configuracoes.

As demais rotas (`catalogo`, `profissionais`, `clientes`, `relatorios`) continuam funcionais e coerentes com a nova casca, mas ainda pedem uma segunda leva de refinamento visual para absorver integralmente os padroes de tabela, cards e vazios da referencia.

## Impacto no status

Percentual permanece:

- backlog estrutural: `72%`
- backlog beta/MVP: `100%`

Justificativa:

- este corte muda camada de experiencia, nao escopo funcional do backlog.

## Momento de UI/UX pesada

O gatilho combinado foi alcançado e confirmado:

- backlog beta fechado;
- shell admin canonico materializado;
- fase pesada de UI/UX iniciada oficialmente neste corte.

## Proximo passo recomendado

Continuar a adocao visual da referencia nas telas restantes do `admin-web`, nesta ordem:

1. `catalogo`
2. `profissionais`
3. `clientes`
4. `relatorios`
5. revisar depois a experiencia publica do `booking-web`
