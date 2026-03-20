# 59. Execucao UI/UX - refino do shell inspirado no workspace MoveDesk

Data: 2026-03-20  
Escopo: `apps/admin-web`  
Referencia visual: `c:\Users\juliano.pedroso\Downloads\movdesk-protheus-workspace-mock.html`

## Objetivo

Reduzir redundancias do shell administrativo e aproximar o chrome global do modelo `rail + tab strip + utilities` da referencia.

## Ajuste aplicado

- remocao do estado de colapso do menu lateral no desktop;
- reducao da rail lateral para proporcao mais proxima do mock;
- remocao do perfil duplicado do rodape no desktop, mantendo contexto do usuario apenas no topo;
- manutencao do footer expandido apenas no drawer mobile;
- conversao do CTA global `Novo Agendamento` para acao rapida icon-first no topo;
- refinamento das tabs do workspace para medidas e hierarquia visual mais proximas da referencia;
- limpeza de CSS legado do topo antigo e de classes que ja nao participavam do shell atual.

## Decisao estrutural

O shell do `AgendaAI` nao replica o mock literalmente porque precisa manter:

- `Contexto do tenant`;
- `Painel rapido`;
- acao global funcional de novo agendamento;
- drawer mobile com leitura expandida.

Mesmo assim, no desktop o shell agora segue a mesma logica base:

- rail escura compacta;
- topbar branca;
- tabs de workspace;
- utilitarios iconificados;
- palco central sem hero duplicado.

## Validacao

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

## Residual

- o shell ficou mais proximo do mock, mas ainda nao replica o modelo de `left panel + main panel` como moldura global;
- essa composicao continua sendo responsabilidade das rotas que realmente pedem workspace bipartido.
