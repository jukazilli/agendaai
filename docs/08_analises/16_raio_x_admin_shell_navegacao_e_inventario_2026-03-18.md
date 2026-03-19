# Raio-X Admin Shell - Navegacao e Inventario de Telas

## 1. Objetivo

Registrar a leitura objetiva do shell administrativo em `18/03/2026`, depois da critica de UX sobre o `admin-web`, para decidir se a etapa de navegacao do backoffice ja havia sido fechada ou se ainda estava aberta.

## 2. Fontes consultadas

Documentacao:

- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/08_analises/13_execucao_b08_shell_admin_operacional.md`
- `docs/08_analises/15_execucao_b09_agenda_admin_operacional.md`
- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/10_backlog/01_backlog_beta_agendaai_minimo_operacional.md`

Implementacao:

- `apps/admin-web/src/App.tsx`

## 3. Evidencia do runtime atual

O runtime administrativo atual renderiza, na mesma pagina autenticada:

- hero e estatisticas do tenant;
- implantacao de slug;
- configuracao de pagamentos;
- catalogo;
- equipe e disponibilidade;
- agenda operacional;
- clientes.

Essa composicao aparece empilhada na mesma `workspace-grid` de `apps/admin-web/src/App.tsx`, sem menu lateral persistente, sem rota por modulo e sem separacao real de dashboard, implantacao, operacao e configuracoes.

## 4. O que ja estava documentado antes

A etapa de navegacao macro do admin nao estava totalmente ausente. Ja existiam:

- shell administrativo com menu lateral persistente e area central por modulo em `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`;
- rotas sugeridas como `/app`, `/app/implantacao`, `/app/catalogo`, `/app/agenda`, `/app/clientes` e `/app/configuracoes`;
- briefing arquitetural com tipos de tela como dashboard operacional, calendario, listagens filtradas e telas de configuracao;
- jornadas que tratam implantacao, agenda do dia, clientes e leitura gerencial como entradas diferentes.

## 5. O que nao estava congelado

Antes desta rodada, ainda nao existia um artefato canonicamente dedicado a:

- inventario de telas do admin shell;
- user stories minimas por tela administrativa;
- fronteira entre `dashboard`, `implantacao`, `catalogo`, `agenda`, `clientes` e `configuracoes`;
- criterio de pronto especifico para considerar o shell admin realmente separado.

## 6. Diagnostico

A leitura consistente e:

- a navegacao macro do admin ja havia sido definida em nivel conceitual;
- o inventario de telas e a especificacao minima por rota ainda nao estavam formalizados;
- o runtime atual nao cumpre a navegacao macro documentada;
- portanto, a etapa de shell admin com navegacao clara nao pode ser considerada fechada.

## 7. Correcao de status

Com base no codigo real e nos docs oficiais:

- `BA-02` nao deve permanecer como `FECHADO`; ele precisa voltar para `PARCIAL`;
- `B-09` e `BA-09` continuam `PARCIAL`, mas agora com uma lacuna explicita: a agenda existe dentro de um shell ainda misturado;
- `admin-web` continua `PARCIAL` tambem por falta de navegacao modular, inventario de telas refletido em runtime e definicao clara entre dashboard, implantacao e operacao.

## 8. Decisao estrutural

Antes de expandir mais o backoffice, o proximo corte estrutural do `admin-web` passa a ser:

1. materializar o shell com navegacao lateral e rota ativa por modulo;
2. separar `dashboard`, `implantacao`, `catalogo`, `profissionais`, `agenda`, `clientes` e `configuracoes`;
3. usar `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md` como referencia oficial de specs minimas por tela.

## 9. Conclusao objetiva

Nos ja tinhamos passado pela etapa de definir a navegacao macro do painel administrativo, mas ainda nao haviamos fechado a etapa de:

- transformar essa navegacao em runtime real;
- congelar o inventario de telas em artefato proprio;
- explicitar user stories minimas por tela.

O problema apontado na UX nao e apenas visual. Ele revela uma lacuna estrutural real de shell, navegacao e taxonomia de telas do `admin-web`.
