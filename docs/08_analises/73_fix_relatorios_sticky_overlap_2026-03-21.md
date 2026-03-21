# 73. Fix UI/UX — Relatorios sem overlap de sticky

Data: 2026-03-21
Escopo: `apps/admin-web`
Rota: `#relatorios`

## Problema

O refinamento anterior do builder de `Relatorios` introduziu uma cadeia de elementos `sticky` dentro do proprio modulo:

- topbar do builder;
- dock tabs do builder;
- painel de montagem.

No runtime real isso gerou dois efeitos colaterais:

- cobertura visual de partes do conteudo ao rolar para cima;
- percepcao de `dock tab` flutuando fora do fluxo da pagina.

## Causa

O shell administrativo ja possui topo proprio com tabs e utilitarios persistentes. Ao adicionar mais camadas `sticky` dentro do modulo, o workspace passou a competir com o chrome do shell.

## Correcao aplicada

A estrategia foi simplificada:

- o shell global continua responsavel pelo topo persistente;
- `Relatorios` deixou de aplicar sticky na `dock tab`;
- `Relatorios` deixou de aplicar sticky no painel de montagem;
- a topbar local do modulo tambem voltou para fluxo normal, priorizando estabilidade e leitura.

## Arquivos alterados

- `apps/admin-web/src/reports-builder-workspace.tsx`
- `apps/admin-web/src/styles.css`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## Validacao

Executado:

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Browser QA:

- preview local em `http://127.0.0.1:4174/#relatorios`
- login administrativo com backend publicado
- validacao com builder aberto
- validacao com `Ocultar builder`
- rolagem para baixo e retorno sem sobreposicao das tabs nem do conteudo

## Resultado

O modulo manteve:

- builder funcional;
- filtros por modal;
- modelos salvos;
- salvar modelo;
- executar;
- `Ocultar builder` sem esconder o resultado.

E perdeu o comportamento problemático de `dock tab` flutuando e cobertura visual do conteudo.
