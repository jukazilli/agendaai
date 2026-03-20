# 48. Execucao UI/UX - Operacao Diaria sanitizada

Data: 2026-03-20
Projeto: `agendaai`
Superficie: `apps/admin-web`
Rota: `#operacional`

## Objetivo

Sanitizar a tela de `Operacao diaria`, removendo a lista unica com estados misturados e reorganizando a leitura operacional em visoes dedicadas por status, sem alterar contratos nem backend.

## Precedencia aplicada

1. Runtime real do `admin-web`.
2. Regra canonica do shell em `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`.
3. Linguagem visual ja materializada em `dashboard`, `agenda`, `clientes`, `catalogo` e `configuracoes`.

## Diagnostico do corte

Antes desta passada, `Operacao diaria` ainda concentrava:

- titulo local, metricas, legenda e timeline completa na mesma superficie;
- cards de estados concorrentes misturados na mesma lista;
- acoes reais e placeholder nao funcional competindo no mesmo bloco;
- repeticao desnecessaria entre topo do shell, hero da rota e corpo da tela.

## Decisao

Materializar `Operacao diaria` como `document view` operacional, com:

- header documental do dia;
- resumo curto do recorte;
- tab bar interativa por visao;
- `Resumo do dia`, `Pendencias`, `Confirmados`, `Concluidos` e `No-show` em superficies separadas;
- cards operacionais com status, pagamento, valor e acoes reais;
- CTA de `Abrir agenda` para handoff da leitura curta para a agenda densa.

## Arquivos alterados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao

### Build e tipagem

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

### Browser QA

Base: `http://127.0.0.1:4173/?qa=operational-20260320#operacional`

Verificacoes executadas:

- carregamento da nova `document view` sem o hero redundante da rota;
- tab bar alternando entre `Resumo do dia`, `Pendencias` e `Confirmados`;
- cards operacionais com dados reais do tenant `Demo Studio`;
- abertura do modal `Novo Agendamento` preservada;
- viewport mobile `390x844` sem overflow horizontal.

Resultado:

- `Operacao diaria` passou a refletir a estrutura sanitizada;
- tabs e acoes reagiram corretamente;
- `scrollWidth === clientWidth` no mobile;
- unico erro residual observado no console: `404` de `favicon.ico`, ja conhecido e fora deste corte.

## Proximo passo elegivel

Seguir a mesma sanitizacao por leitura dedicada onde ainda houver acumulacao de contexto e acao no `admin-web`, mas a rota `#operacional` deixa de ser gargalo estrutural nesta rodada.
