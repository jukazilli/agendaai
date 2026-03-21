# 60. Execucao UI/UX - Relatorios por workspace local

Data: 2026-03-20  
Projeto: `agendaai`  
Superficie: `apps/admin-web`  
Rota: `#relatorios`

## Objetivo

Reconstruir o modulo de `Relatorios` com base no mock enviado pelo usuario, mantendo o backend existente como fonte principal de verdade e sem inventar metricas, filtros ou regras de negocio fora dos contratos reais.

## Fontes de verdade usadas

Precedencia aplicada:

1. mock local enviado no chat:
   - `C:\Users\juliano.pedroso\Downloads\agenda-relatorios-mock-react-ts\agenda-relatorios-mock\src\App.tsx`
   - `C:\Users\juliano.pedroso\Downloads\agenda-relatorios-mock-react-ts\agenda-relatorios-mock\src\styles.css`
2. contratos e backend reais:
   - `packages/contracts/src/v1/reporting.ts`
   - `services/api-rest/src/reporting-read-model.ts`
   - `services/api-rest/src/app.ts`
   - `apps/admin-web/src/lib/admin-api.ts`
3. regra canonica do shell:
   - `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## O que foi implementado

- rota `Relatorios` reconstruida como `workspace local` com:
  - topbar propria da rota;
  - filtros reais de recorte, servico, profissional e janela de retorno;
  - menu de visoes;
  - abas abertas com fechamento;
  - contexto recolhivel;
  - janela unica de conteudo.
- visoes separadas e funcionais:
  - `Visao executiva`
  - `Receita e servicos`
  - `Equipe e produtividade`
  - `Retorno e retencao`
  - `Radar semanal`
  - `Visao mensal`
  - `Pendencias operacionais`
- o frontend permaneceu adaptado aos dados reais:
  - `read model` de relatorios vindo de `GET /v1/admin/read-models/reports`;
  - filtros reais reaproveitados do admin existente;
  - `radar semanal` e `visao mensal` continuam derivados da agenda e disponibilidade reais do shell, sem inventar endpoint novo.

## Decisoes de aderencia

- `backend manda na verdade`: nenhuma metrica nova foi criada fora do que ja existe no runtime.
- `agenda semanal` e `agenda mensal` continuam como leitura gerencial, e nao como operacao.
- `pendencias operacionais` foi mantida em `Relatorios` apenas como leitura da fila aberta, com handoff para `Operacao diaria` e `Agenda`.

## Arquivos alterados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/reports-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao

Executado em `2026-03-20`:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA local:

- login com backend publicado em `https://agendaai-eu7w.onrender.com`
- rota `http://localhost:5173/#relatorios`
- validado:
  - abertura do modulo;
  - abertura do menu de visoes;
  - abertura da aba `Receita e servicos`;
  - carregamento de dados reais;
  - responsividade em `390x844`;
  - ausencia de overflow horizontal em desktop e mobile.

Residual observado:

- `favicon.ico` continua respondendo `404` no preview local; residual antigo e fora deste corte.
- ainda existe legado morto dentro de `renderReportsViewV2` no `App.tsx`; nao interfere na execucao atual, mas merece cleanup dedicado.
