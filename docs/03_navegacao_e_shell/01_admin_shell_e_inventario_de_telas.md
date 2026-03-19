# Admin Shell e Inventario de Telas

## 1. Objetivo

Congelar a navegacao minima do shell administrativo do `agendaai` e definir, de forma canonica, quais telas existem, para que servem e qual responsabilidade cada uma carrega.

## 2. Regra de precedencia

- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` continua como definicao macro de shell e rotas;
- este documento detalha o inventario minimo de telas do admin;
- implementacao que nao respeitar essa separacao deve ser tratada como `PARCIAL`, nao como shell fechado.

## 3. Principio estrutural

No `admin-web`, dashboard, implantacao, catalogo, operacao e configuracoes nao podem viver como secoes equivalentes de uma pagina unica. O shell administrativo precisa ter:

- menu lateral persistente;
- item ativo por modulo;
- area central por rota;
- topo contextual por tela;
- acoes locais por modulo;
- separacao clara entre leitura executiva, configuracao e operacao.

## 4. Inventario canonico de telas

| Rota | Tela | Serve para | Blocos minimos | Prioridade |
| --- | --- | --- | --- | --- |
| `/app` | Dashboard inicial | mostrar estado do negocio e handoff da implantacao | resumo do tenant, KPI do dia, pendencias criticas, atalhos para implantacao, agenda e clientes | beta obrigatoria |
| `/app/implantacao` | Implantacao | preparar o tenant para entrar em operacao | slug, branding minimo, provider de pagamento, status de publicacao, checklist de prontidao | beta obrigatoria |
| `/app/catalogo` | Catalogo comercial | cadastrar e editar servicos, produtos, kits e combos | lista de itens, formulario, politica comercial, politicas de cobranca | beta obrigatoria |
| `/app/profissionais` | Equipe | cadastrar equipe e especialidades | lista de profissionais, formulario, especialidades, status | beta obrigatoria |
| `/app/agenda` | Agenda operacional | localizar e operar bookings do dia | filtros, cards ou lista de bookings, acoes de confirmar, concluir, cancelar, reagendar quando existir | beta obrigatoria |
| `/app/clientes` | Clientes e CRM | consultar carteira basica e historico essencial | listagem, ultima visita, origem, status de recorrencia, acesso ao detalhe | beta obrigatoria |
| `/app/configuracoes` | Configuracoes do tenant | manter dados permanentes do negocio apos a implantacao | dados do tenant, slug, branding, integracoes e preferencias operacionais | beta obrigatoria |
| `/app/calendario` | Calendario denso | operar visao semanal e diaria por profissional | grade temporal, filtros, conflito, reagendamento | pos-beta planejada |
| `/app/financeiro` | Financeiro operacional | ler caixa e movimentos ligados ao atendimento | resumo financeiro, movimentacoes, conciliacao basica | pos-beta planejada |
| `/app/relatorios` | Relatorios | acompanhar agenda, receita e retorno | filtros por periodo, cards, tabelas e comparativos | pos-beta planejada |
| `/app/campanhas` | Campanhas e retorno | acionar win-back e comunicacoes | segmentos, disparos, historico de contato | pos-beta planejada |

## 5. User stories minimas por tela

- Dashboard: como `owner`, quero ver o que exige acao imediata para decidir se vou concluir implantacao, operar agenda ou revisar clientes.
- Implantacao: como `owner`, quero publicar meu negocio com slug, pagamento e identidade minima sem entrar em telas operacionais.
- Catalogo: como `owner` ou `manager`, quero editar servicos e regra comercial sem misturar isso com agenda do dia.
- Profissionais: como `owner` ou `manager`, quero manter equipe, especialidades e base de disponibilidade.
- Agenda: como `owner`, `manager` ou `staff`, quero localizar bookings e executar a rotina operacional do dia.
- Clientes: como `owner` ou `manager`, quero consultar a carteira real formada pelos agendamentos.
- Configuracoes: como `owner`, quero alterar dados permanentes do tenant sem reabrir o fluxo de implantacao inteiro.
- Calendario: como `owner` ou `manager`, quero visualizar conflito, carga e reagendamento em grade temporal.
- Financeiro: como `owner`, quero entender o reflexo operacional em receita e caixa.
- Relatorios: como `owner`, quero comparar periodo, agenda, receita e clientes sem retorno.

## 6. Especificacao minima de composicao

### Dashboard

- nao deve conter formularios completos de catalogo, pagamento ou equipe;
- deve ser uma tela de leitura e distribuicao de fluxo;
- deve funcionar como ponto de entrada depois do login.

### Implantacao

- concentra o que coloca o tenant em producao;
- pode ter checklist explicito de prontidao;
- nao deve carregar a agenda operacional completa.

### Catalogo e Profissionais

- podem compartilhar linguagem visual de editor;
- nao devem ocupar a mesma rota da agenda;
- disponibilidade detalhada pode nascer em `profissionais` ou migrar depois para `calendario`.

### Agenda

- deve priorizar filtros, status e acoes;
- detalhe denso pode abrir em drawer;
- resumo do dia pertence aqui, nao ao dashboard de implantacao.

### Clientes

- deve nascer como leitura derivada do booking real;
- detalhe denso pode evoluir depois sem bloquear a listagem inicial.

### Configuracoes

- guarda manutencao continua do tenant;
- nao deve virar deposito de blocos operacionais sem taxonomia.

## 7. Status atual da fundacao

Em `19/03/2026`, o `admin-web` passou a refletir a primeira materializacao real deste inventario:

- shell com navegacao lateral persistente no desktop e drawer no mobile;
- modulos separados de `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
- dashboard com leitura real do bootstrap e lacunas marcadas como `(nao funcional)` quando o mock sugeria blocos sem contrato;
- configuracoes separadas da operacao, concentrando slug, Mercado Pago e ambiente administrativo;
- agenda com timeline diaria por data, selecao de booking, reagendamento por slot real e grade semanal de capacidade por profissional dentro da mesma rota.

Este documento continua sendo a referencia oficial para:

- corte de shell admin;
- definicao de rotas reais no `admin-web`;
- backlog de separacao do shell;
- validacao de user stories e specs por tela.

As lacunas remanescentes deste shell agora deixaram de ser estruturais e passaram a ser funcionais:

- calendario mensal e drag-and-drop;
- analytics agregados de faturamento, ocupacao historica e retencao;
- branding minimo da implantacao;
- financeiro operacional e relatorios.
