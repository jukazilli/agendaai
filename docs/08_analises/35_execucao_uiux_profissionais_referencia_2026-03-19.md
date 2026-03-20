# Execucao UI/UX - Profissionais por Referencia - 2026-03-19

## Objetivo

Refinar a rota `#profissionais` do `admin-web` para sair do editor lateral grande e aderir ao layout de cards da referencia visual aprovada pelo usuario, preservando contratos, mutacoes e navegacao real do projeto.

## Skills e precedencia usadas

- `consistencia-documental`
- `front-side-by-side-adoption`

Precedencia aplicada:

1. `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
2. `docs/04_padroes_ui/02_design_system.md`
3. `docs/08_analises/34_execucao_uiux_shell_admin_referencia_2026-03-19.md`
4. runtime real em `apps/admin-web/src/App.tsx` e `apps/admin-web/src/lib/admin-api.ts`
5. referencia visual enviada pelo usuario como guia de composicao, nao de contrato

## Problema fechado

A rota de `profissionais` ainda usava o layout antigo de:

- lista lateral simples de profissionais;
- formulario grande aberto por padrao;
- bloco de disponibilidade empilhado junto do cadastro;
- densidade baixa e componentes grandes demais para a area administrativa.

Esse formato contrariava tanto a referencia visual aprovada quanto o principio documental de densidade com legibilidade no shell admin.

## Codigo alterado

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

## Entrega executada

- remocao do hero grande apenas na rota `profissionais`, aproximando a primeira dobra da referencia;
- criacao de grade de cards de profissionais com:
  - avatar por iniciais;
  - badge de status;
  - nome e resumo de especialidades;
  - acoes `Ver Agenda`, `Horarios` e `Servicos`;
- substituicao do editor sempre aberto por workspace contextual abaixo da grade;
- separacao do workspace em dois modos reais:
  - cadastro/servicos;
  - disponibilidade semanal;
- correcao do fluxo `Novo Profissional`, que antes reaproveitava implicitamente o primeiro profissional carregado em vez de abrir um cadastro limpo;
- manutencao das mutacoes reais:
  - `POST /v1/admin/professionals`
  - `PATCH /v1/admin/professionals/:professionalId`
  - `GET /v1/admin/professionals/:professionalId/availability`
  - `PUT /v1/admin/professionals/:professionalId/availability`
- manutencao do handoff para agenda por profissional via rota real `#agenda`.

## Validacao executada

- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir c:\\projetos\\agendaai --filter @agendaai/admin-web build`
- validacao manual em browser local na rota `http://localhost:5174/#profissionais`

## Resultado

A tela de `profissionais` deixa de ser um wireframe editor-centric e passa a operar com hierarquia visual muito mais proxima da referencia aprovada, sem alterar backend, sem criar contratos novos e sem reabrir o shell administrativo.

## Proximo passo recomendado

Seguir a mesma logica de transplante visual nas rotas restantes da segunda onda:

1. `catalogo`
2. `clientes`
3. `relatorios`
