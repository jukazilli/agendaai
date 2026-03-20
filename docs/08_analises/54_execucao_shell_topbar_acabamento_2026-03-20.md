# 54. Execucao shell e topbar acabamento transversal

Data: 20/03/2026

## Objetivo

Fechar o acabamento transversal do chrome do `admin-web`, com foco em:

- transformar controles decorativos da topbar em controles funcionais;
- reduzir ruido global do shell sem mexer no papel das rotas;
- validar encaixe do topo em desktop e mobile.

## Base consultada

Documentacao:

- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

Codigo:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`

Precedencia:

1. inventario oficial do shell;
2. implementacao real do `admin-web`;
3. browser QA local.

## Execucao

### Topbar

- a busca rapida deixou de ser placeholder visual e passou a navegar para `Clientes`;
- o icone de sino deixou de ser decorativo e passou a abrir um `painel rapido` do shell com pendencias, pagamentos pendentes, clientes sem retorno e atalhos reais;
- o painel rapido e o disclosure de `Contexto` foram tratados como overlays mutualmente exclusivos;
- a topbar passou a manter densidade melhor em mobile, sem esconder a busca rapida por breakpoint.

### Shell

- o shell agora fecha overlays globais ao trocar de rota;
- o badge do sino passou a refletir a soma das atencoes operacionais derivadas do runtime atual;
- o inventario oficial passou a registrar explicitamente que controles globais do topo nao podem ser decorativos.

## Validacao

Comandos:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA:

- `http://localhost:5174/#dashboard`
- clique em `Buscar cliente` levando para `#clientes`
- clique no sino abrindo `Painel rapido do shell`
- clique em `Contexto` abrindo o sheet do tenant
- validacao em `390x844` sem overflow horizontal

Resultado:

- `lint` passou;
- `build` passou;
- busca rapida funcional;
- painel rapido funcional;
- topbar responsiva sem overflow horizontal no mobile.

## Residual

- o `build` continua emitindo warning de chunk grande;
- os logs do preview local permanecem em `.runtime/playwright-qa/`.
