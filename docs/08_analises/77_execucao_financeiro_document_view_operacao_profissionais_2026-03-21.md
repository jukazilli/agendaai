# 77. Execucao — Financeiro Document View, Operacao e Profissionais

Data: `2026-03-21`

## Escopo

Fechamento do corte de `financeiro operacional` no `admin-web`, com:

- `Financeiro` em `document view` com browse zebrado;
- nova aba `Fechar caixa`;
- `Movimentos bancarios` como trilha de caixa real;
- `Operacao diaria` com acoes de topo para `Receber` e `Estornar`;
- `Profissionais` com `Banco padrao` opcional por consulta.

## O que mudou

### Financeiro

- A rota `#financeiro` passou a expor as abas:
  - `Fluxo de caixa`
  - `Bancos`
  - `Saldos iniciais`
  - `Receitas`
  - `Despesas`
  - `Movimentos bancarios`
  - `Fechar caixa`
- `Bancos`, `Saldos iniciais`, `Receitas` e `Despesas` agora operam com:
  - toolbar no topo;
  - browse zebrado;
  - popup reutilizavel em `incluir`, `visualizar`, `alterar` e acoes de negocio.
- `Receitas` ganhou `Receber`, `Estornar` e `Excluir` por toolbar.
- `Despesas` ganhou `Pagar`, `Estornar` e `Excluir` por toolbar.
- `Movimentos bancarios` deixou de usar lista solta e passou para browse zebrado com:
  - `Incluir`
  - `Visualizar`
  - `Alterar`
  - `Estornar`
- `Fechar caixa` passou a existir como aba propria com filtros por `banco`, `data de`, `data ate` e `situacao`.

### Integracao operacional

- `Receber` e `Pagar` agora carregam contexto do titulo quando a acao nasce de `Receitas` ou `Despesas`.
- O modal financeiro limpa contexto anterior ao fechar, evitando vazamento entre `receber`, `pagar`, `transferir`, `movimento manual` e `fechar caixa`.
- A carga inicial do admin passou a tolerar `404` de `cash-closes` em backends mais antigos, degradando para lista vazia em vez de quebrar a tela.

### Operacao diaria

- A tela ganhou botoes de topo:
  - `Visualizar`
  - `Receber`
  - `Estornar`
  - `Atualizar`
  - `Abrir agenda`
- `Receber` sugere o banco padrao do profissional quando existir.
- `Estornar` usa movimento inverso preservando o historico.
- O card selecionado na rotina diaria passou a ter estado visual proprio.

### Profissionais

- `Banco padrao` saiu do select cru e passou a operar por consulta em popup, reaproveitando o browse zebrado.

## Arquivos principais

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/lib/admin-api.ts`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao

Executado com sucesso:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Validacao visual em browser real:

- navegacao entre tabs de `Financeiro`;
- abertura de popup em `Incluir banco`;
- digitacao continua nos campos do popup sem perda imediata de foco;
- renderizacao das abas `Movimentos bancarios` e `Fechar caixa`;
- `Operacao diaria` com botoes de topo financeiros visiveis;
- remocao do erro visual de `cash-closes` ausente em backend antigo.

## Residual

- o warning de chunk grande do `admin-web` continua no build;
- quando o backend remoto for antigo, `cash-closes` continua indisponivel funcionalmente, mas a UI agora degrada sem quebrar;
- `Catalogo` e a revisao estrutural final de `Profissionais` continuam fora deste corte.
