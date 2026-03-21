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
| `/app/relatorios` | Relatorios | montar, executar e salvar leituras gerenciais reutilizaveis | builder semantico, dock tabs, filtros por modal, lookup e modelos salvos | beta obrigatoria |
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
- `catalogo` deve abrir `visualizar`, `editar`, `novo` e `excluir` em popup, sem empilhar o formulario inteiro abaixo da lista principal;
- quando a entidade for simples, o workspace nao deve carregar blocos narrativos como `o que voce controla aqui`, `em evolucao`, resumos laterais ou politicas duplicadas fora do proprio registro;
- `master-detail` deve ficar reservado para superficies com vinculos ou leitura relacional mais densa, como `profissionais` com `servicos` e `horarios`;
- `profissionais` deve usar lista master simples no lado esquerdo e detalhe relacional no lado direito, com abas locais para `cadastro e servicos` e `horarios`;
- disponibilidade detalhada pode nascer em `profissionais` ou migrar depois para `calendario`.

### Agenda

- deve priorizar filtros, navegacao de data e acoes operacionais;
- deve separar `lista` e `agenda` em visoes dedicadas, preferencialmente via tab bar responsiva;
- o clique em um agendamento precisa abrir o detalhe completo da booking sem sair da rota, preferencialmente em modal operacional;
- capacidade agregada semanal e mensal pertence a `relatorios`, nao ao corpo principal desta tela.

### Relatorios

- deve concentrar apenas leitura gerencial, comparativos e recortes analiticos;
- deve operar como `builder workspace` em pagina em branco, sem menu redundante de visoes dentro do corpo principal;
- cada relatorio deve abrir em `dock tab` dedicada, preservando edicao, preview e execucao no mesmo stage;
- no desktop, a abertura das visoes deve preferir hover ou flyout no proprio item lateral `relatorios`, evitando um segundo menu redundante dentro da tela;
- em viewport compacto, a rota pode manter um disclosure proprio como fallback para quem nao possui hover;
- o builder precisa priorizar a largura do resultado; definicao, filtros e ordenacao devem operar em faixas horizontais no topo, e nao como coluna lateral que espreme a leitura;
- `ocultar builder` deve esconder apenas a area de montagem do relatorio, nunca as dock tabs, o contexto da tela ou o resultado executado;
- o modulo pode manter acoes locais visiveis durante a rolagem, mas nunca ao custo de sobrepor dock tabs, esconder conteudo ou criar a sensacao de painel flutuando fora do fluxo;
- filtros devem ser locais a cada visao e abrir em modal proprio via botao `filtrar`, nunca como faixa fixa ocupando o topo inteiro do modulo;
- o modulo deve trabalhar com `modelos salvos`, nunca com `snapshots` persistidos dos resultados executados;
- o botao `modelos salvos` deve listar tanto modelos do usuario quanto definicoes predefinidas do sistema, abrindo sempre em `dock tab` dedicada;
- filtros de lookup devem privilegiar busca por `codigo`, `nome`, `descricao` e `telefone` conforme o tipo do cadastro e o contrato real do backend;
- campos de lookup devem exibir acao explicita de consulta, como icone de lupa, e abrir popup tabular com colunas aderentes ao tipo do registro:
  - `codigo` + `descricao` para itens e servicos;
  - `codigo` + `nome` para pessoas;
  - colunas complementares como `telefone` podem aparecer quando o contrato real ja fornecer esse dado.
- a escolha da `base` do relatorio tambem deve operar por consulta padrao com lupa, evitando codigo digitado manualmente;
- o shell deve listar as visoes de sistema no proprio flyout lateral de `relatorios`, como `visao executiva`, `receita e servicos`, `equipe e produtividade`, `pendencias operacionais`, `retorno e retencao`, `radar semanal` e `visao mensal`;
- o builder v1 tambem deve expor bases cadastrais e financeiras reais quando o backend suportar, incluindo `cadastro de servicos`, `cadastro de profissionais` e `pagamentos`;
- o builder precisa operar com `catalogo efetivo`, mesclando fallback local e catalogo remoto para nao desaparecer campo, filtro, agrupamento ou rotulo quando o backend expuser uma versao parcial ou antiga;
- `group by` deve existir como capacidade formal do builder, mas sempre materializado em linguagem literal como `agrupar / quebrar por`;
- cada `objeto de negocio` precisa expor apenas os agrupamentos semanticamente validos para sua base real:
  - `atendimentos`: cliente, servico, profissional, status, dia e mes;
  - `clientes`: sem agrupamento livre na v1, priorizando leitura direta e filtros;
  - `cadastro de servicos`: situacao do cadastro e forma de cobranca;
  - `cadastro de profissionais`: situacao do cadastro;
  - `agenda e capacidade`: profissional, dia e mes;
  - `pagamentos`: situacao do pagamento, cliente, servico, profissional, dia e mes da cobranca;
- `atendimentos` tambem precisa aceitar relacoes controladas com `clientes`, `servicos` e `profissionais`, sempre com modos literais de combinacao e sem expor SQL cru;
- agrupamentos por `servicos`, `equipe`, `retorno` e `agenda` devem nascer em definicoes dedicadas, sem empilhar todas as leituras na mesma pagina;
- quando a leitura de `agenda` crescer, `radar semanal` e `leitura mensal` devem abrir em sub-visoes dedicadas, e nao empilhadas na mesma area;
- contexto tecnico do recorte, fonte e comparativo nao deve competir com KPI e listas principais no mesmo viewport;
- o resultado executado deve ser derivado do backend real no momento da execucao; apenas a definicao reutilizavel pode ser persistida;
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

Em `21/03/2026`, `Relatorios` deixou de ser uma tela fixa de cards e visoes internas e passou a operar como `builder workspace` materializado:

- flyout lateral de `relatorios` abre por hover no desktop e lista as definicoes gerenciais do sistema;
- clique em uma visao abre uma `dock tab` dedicada no workspace;
- a rota trabalha com `builder`, `preview de expressao`, `payload tecnico`, `resultado real` e `modelos salvos`;
- filtros passaram a abrir em modal por relatorio, com lookup por lupa e popup tabular;
- `services`, `professionals` e `clients` agora expõem `codigo` persistido para lookup e indexacao operacional;
- `report_definitions` foram persistidas no store local e em Postgres quando `DATABASE_URL` existe;
- a persistencia em Postgres passou a gravar `snapshot + report_definitions` em transacao unica;
- o reset controlado de staging agora faz parte do runtime via `pnpm --filter @agendaai/api-rest db:reset:staging`, recriando tabelas e reseedando o tenant demo;
- o modulo salva apenas a definicao reutilizavel do relatorio, nunca snapshot do resultado encontrado.
- o workspace de `relatorios` passou a mesclar catalogo local e catalogo remoto, evitando que backends antigos eliminem filtros ou rotulos nas bases novas;
- `atendimentos` passou a suportar relacoes controladas com `clientes`, `servicos` e `profissionais`, alem das relacoes ja abertas em `servicos`, `profissionais`, `agenda` e `pagamentos`.

Ainda em `21/03/2026`, os cadastros operacionais foram realinhados ao shell oficial:

- `catalogo` permaneceu como `registro master`, mas passou a abrir `novo`, `visualizar`, `editar` e `excluir` em popup;
- `profissionais` saiu do grid de cards como superficie principal e passou a operar em `master-detail`;
- o detalhe de `profissionais` agora separa `cadastro e servicos` de `horarios`, preservando a relacao operacional com agenda e servicos sem misturar tudo na mesma tela.

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
