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
- controles globais do topo sempre funcionais, nunca decorativos;
- separacao clara entre leitura executiva, configuracao e operacao.

No chrome global do shell:

- no desktop, a navegacao lateral pode operar como `icon rail` compacta, sem card de perfil redundante nem controle de colapso permanente;
- no mobile, o mesmo shell pode abrir em drawer expandido com rotulos e contexto do usuario;
- a topbar deve priorizar tabs de workspace e utilitarios icon-first, evitando CTA grande ou texto duplicado quando uma acao rapida resolve;
- busca rapida deve abrir uma rota real ligada a clientes ou carteira;
- alertas, contexto e atalhos globais podem viver em disclosure ou sheet, sem competir com o conteudo principal da rota;
- o topo nao deve repetir desnecessariamente o mesmo contexto que ja aparece no corpo da tela.
- rotas autenticadas que ja usam `entity view`, `document view` ou `master-detail` nao devem receber um segundo hero legado do shell acima do conteudo.
- estados vazios, blocos de contexto e frentes em evolucao devem usar linguagem de produto e apoio secundario, nunca competir com o detalhe principal da entidade.

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
| `/app/relatorios` | Relatorios | acompanhar agenda, receita e retorno | filtros por periodo, cards, tabelas e comparativos | beta materializada em modo parcial |
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
- leituras concorrentes devem ser separadas por visoes dedicadas, preferencialmente via tab bar, em vez de cards e textos empilhados no mesmo viewport;
- dentro de cada visao, graficos, radar e atalhos devem usar superficies independentes e grids dedicadas para evitar uma coluna unica excessivamente longa;
- metadados estruturais do tenant, como slug publica, timezone e link do booking, pertencem ao shell em modo de disclosure e nao ao corpo principal do dashboard;
- atalhos, radar semanal e base real do tenant nao devem competir visualmente com KPI executivo e grafico principal na mesma coluna lateral.

### Implantacao

- concentra o que coloca o tenant em producao;
- pode ter checklist explicito de prontidao;
- nao deve carregar a agenda operacional completa.

### Catalogo e Profissionais

- podem compartilhar linguagem visual de editor;
- nao devem ocupar a mesma rota da agenda;
- entidades simples de cadastro, como `catalogo`, devem nascer em `registro master` com lista principal e acoes explicitas de `novo`, `visualizar` e `editar`;
- quando a entidade for simples, o workspace nao deve carregar blocos narrativos como `o que voce controla aqui`, `em evolucao`, resumos laterais ou politicas duplicadas fora do proprio registro;
- `master-detail` deve ficar reservado para superficies com vinculos ou leitura relacional mais densa, como `profissionais` com `servicos` e `horarios`;
- disponibilidade detalhada pode nascer em `profissionais` ou migrar depois para `calendario`.

### Agenda

- deve priorizar filtros, navegacao de data e acoes operacionais;
- deve separar `lista` e `agenda` em visoes dedicadas, preferencialmente via tab bar responsiva;
- o clique em um agendamento precisa abrir o detalhe completo da booking sem sair da rota, preferencialmente em modal operacional;
- capacidade agregada semanal e mensal pertence a `relatorios`, nao ao corpo principal desta tela.

### Relatorios

- deve concentrar apenas leitura gerencial, comparativos e recortes analiticos;
- deve operar em workspace local proprio, com `filtros no topo`, `menu de visoes` e `abas abertas` sem misturar a navegacao do shell com os contextos internos do modulo;
- agrupamentos por `servicos`, `equipe`, `retorno` e `agenda` devem nascer em visoes dedicadas, preferencialmente via tab bar;
- o workspace pode abrir visoes como `visao executiva`, `receita e servicos`, `equipe e produtividade`, `retorno e retencao`, `radar semanal`, `visao mensal` e `pendencias operacionais`;
- quando a leitura de `agenda` crescer, `radar semanal` e `leitura mensal` devem abrir em sub-visoes dedicadas, e nao empilhadas na mesma area;
- contexto tecnico do recorte, fonte e comparativo nao deve competir com KPI e listas principais no mesmo viewport;
- acoes operacionais continuam em `operacao diaria`, `agenda` e `clientes`.

### Clientes

- deve nascer como leitura derivada do booking real;
- detalhe denso pode evoluir depois sem bloquear a listagem inicial.
- o detalhe deve priorizar historico, receita e relacionamento, deixando evolucoes do CRM em paineis secundarios e sem microcopy tecnicista.

### Configuracoes

- guarda manutencao continua do tenant;
- nao deve virar deposito de blocos operacionais sem taxonomia.

## 7. Status atual da fundacao

Em `19/03/2026`, o `admin-web` passou a refletir a primeira materializacao real deste inventario:

- shell com navegacao lateral persistente no desktop e drawer no mobile;
- modulos separados de `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
- dashboard com leitura real do bootstrap, filtro de periodo para agenda/receita, bloco de clientes sem retorno por janela e lacunas marcadas como `(nao funcional)` quando o mock sugeria blocos sem contrato;
- configuracoes separadas da operacao, concentrando slug, branding minimo, Mercado Pago e ambiente administrativo;
- agenda com filtros operacionais por data e profissional, `lista` do dia, calendario React em `dia/semana/mes`, selecao de booking e reagendamento por slot real na mesma rota.
- clientes com recorte de retorno por janela, ultimo atendimento concluido, receita persistida minima, selecao de cliente e detalhe operacional com historico e movimentos financeiros.
- relatorios dedicados com filtros por periodo, servico e profissional, comparativo contra periodo anterior, read model minimo de receita/recorrencia vindo do `api-rest` e `insights da agenda` para capacidade agregada semanal/mensal.

Este documento continua sendo a referencia oficial para:

- corte de shell admin;
- definicao de rotas reais no `admin-web`;
- backlog de separacao do shell;
- validacao de user stories e specs por tela.

As lacunas remanescentes deste shell agora deixaram de ser estruturais e passaram a ser funcionais:

- drag-and-drop;
- analytics agregados de faturamento, ocupacao historica e retencao;
- clientes sem retorno por cohort e expectativa;
- financeiro operacional completo com conciliacao, estorno e caixa presencial.
