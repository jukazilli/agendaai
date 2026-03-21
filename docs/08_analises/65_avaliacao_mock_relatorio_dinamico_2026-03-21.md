# 65. Avaliacao Mock Relatorio Dinamico

Data: `2026-03-21`  
Projeto: `agendaai`  
Modulo: `Relatorios`

## 1. Objetivo

Registrar o mock visual recebido para o builder de relatorios e consolidar:

- o que ele expressa corretamente em UI/UX;
- o que ele acrescenta em relacao ao documento arquitetural do builder;
- o que ainda e apenas simulacao local;
- o que deve migrar para o produto real e o que nao deve migrar sem validacao.

## 2. Fontes usadas

Precedencia aplicada:

1. mock local entregue pelo usuario:
   - `C:\projetos\agendaai\.runtime\mockups\relatorio-dinamico.html`
2. documentacao arquitetural interna ja consolidada:
   - `docs/08_analises/64_arquitetura_builder_semantico_relatorios_2026-03-20.md`
3. contratos e backend reais do `AgendaAI`:
   - `packages/contracts/src/v1/reporting.ts`
   - `services/api-rest/src/reporting-read-model.ts`
   - `services/api-rest/src/store.ts`
   - `services/api-rest/src/postgres-store.ts`
4. sintese conceitual fornecida pelo usuario, atribuida ao ChatGPT, sobre relatorios dinamicos.

## 3. Regra de leitura deste mock

O arquivo `relatorio-dinamico.html` deve ser tratado como:

- `mock de UX e interacao`;
- `prova de conceito de builder`;
- `insumo de composicao visual e estrutural`.

Ele nao deve ser tratado como:

- contrato tecnico do backend;
- definicao final da AST;
- verdade de metricas;
- implementacao pronta para producao.

## 4. O que o mock acerta

O mock aponta para uma direcao correta e coerente com a estrategia nova do modulo.

### 4.1 Pagina em branco com builder

O mock abandona a tela fixa de relatorios fechados e traz exatamente a ideia desejada:

- builder a esquerda;
- resultado a direita;
- preview estrutural do payload;
- dock tabs no topo;
- menu lateral de acesso ao modulo.

Isso reforca a mudanca de estrategia documentada em [64_arquitetura_builder_semantico_relatorios_2026-03-20.md](C:/projetos/agendaai/docs/08_analises/64_arquitetura_builder_semantico_relatorios_2026-03-20.md).

### 4.2 Builder por blocos

O mock separa bem os blocos do construtor:

1. estrutura base;
2. filtros e expressoes;
3. ordenacao;
4. leitura literal;
5. resultado;
6. payload estrutural.

Essa divisao e boa porque reduz ambiguidade entre:

- o que o usuario escolhe;
- o que o sistema calcula;
- o que o backend precisa receber.

### 4.3 Arvore de filtros com E/OU e grupos

Esse e o ganho mais importante do mock.

O arquivo mostra:

- `connective` por condicao;
- `group_start` e `group_end`;
- `level` de indentacao;
- grupos recolhiveis;
- edicao inline dos filtros existentes.

Isso aproxima a UX do que ja foi documentado como caminho correto para AST/DSL.

### 4.4 Lookup modal e filtros tipados

O mock traz:

- campos com tipo `lookup`;
- lookup modal pesquisavel;
- selecao unica ou multipla conforme o operador;
- hint explicita para modo single/multi.

Isso e coerente com a regra interna ja adotada para filtros com lupa e consulta padrao.

### 4.5 Modelos salvos

O mock respeita a direcao que definimos nesta rodada:

- botao `Abrir modelos`;
- botao `Salvar modelo`;
- lista de modelos salvos;
- nome do modelo;
- codigo do modelo;
- reabertura de modelos.

Isso bate com a regra:

- salvar a definicao reutilizavel;
- nao salvar snapshot dos dados do relatorio no fluxo normal.

### 4.6 Payload visivel

O bloco `Payload estrutural` e valioso.

Ele ajuda a:

- explicar o funcionamento para negocio e time tecnico;
- validar a forma da AST;
- depurar o builder antes de ligar no backend;
- manter previsibilidade entre front e engine.

## 5. O que o mock acrescenta ao documento arquitetural

Comparando com o documento 64, o mock acrescenta detalhes praticos de UX que ainda nao estavam fechados:

### 5.1 Builder recolhivel

O mock permite ocultar o builder e deixar a area de resultado dominante.

Isso e util porque:

- o usuario alterna entre construir e ler;
- em telas menores o workspace pode priorizar o resultado;
- a dock tab continua aberta mesmo com o builder recolhido.

### 5.2 Edicao inline

O mock nao exige recriar um filtro ou um `order by` do zero.

Ele mostra:

- carregar item existente no formulario;
- editar;
- cancelar edicao;
- reaplicar.

Essa interacao e melhor do que um builder descartavel e reduz atrito operacional.

### 5.3 Formula literal amigavel

O mock explicita uma `leitura literal` da expressao.

Esse ponto e importante porque cria dois niveis de leitura:

- leitura de negocio;
- leitura estrutural do payload.

Ou seja:

- negocio entende a frase;
- tecnico entende o JSON.

### 5.4 Ordenacao como bloco formal

O mock trata `order by` como estrutura propria, com:

- campo;
- direcao;
- prioridade;
- lista editavel.

Isso e correto e deve permanecer no builder real.

## 6. O que ainda esta apenas simulado

O mock continua sendo um artefato local e tem varias partes que nao podem ir para producao sem adaptacao.

### 6.1 Catalogo de campos local e fake

Hoje o HTML embute um `fieldCatalog` local com campos como:

- `valor_servico`
- `servico`
- `status`
- `profissional`
- `data_atendimento`
- `ticket_medio`

No produto real, esse catalogo nao pode ser estatico no front.  
Ele precisa nascer do `catalogo semantico` oficial e obedecer ao backend real.

### 6.2 Resultados estaticos

O painel de resultado ainda mostra:

- KPIs fixos;
- tabela fixa;
- payload local simulado.

No produto real:

- os dados devem ser sempre recalculados sobre o backend;
- o mock nao deve virar fonte de verdade de metrica.

### 6.3 Model code gerado no cliente

O mock gera codigo local como `MDL-240301`.

No produto real isso deve ser responsabilidade do backend, para garantir:

- unicidade;
- rastreabilidade;
- consistencia multi-tenant;
- historico.

### 6.4 Campo de visualizacao ainda simplificado

O mock trabalha com:

- `kpi_table`
- `kpi`
- `time_series`
- `ranking`

Isso e bom como inicio, mas no produto real a visualizacao deve ser liberada apenas quando a base e a metrica forem compativeis.

### 6.5 Catalogo de lookups local

O mock usa `lookupCatalog` local para:

- servico;
- profissional;
- status.

No produto real, lookup deve vir do backend ou do estado autenticado do tenant, nunca de lista fixa no HTML.

## 7. Divergencias que precisam de decisao

O mock e bom, mas ainda tem pontos que precisam de fechamento arquitetural.

### 7.1 Rail hover + sidebar fixa

Hoje o mock traz duas camadas ao mesmo tempo:

- `rail` com hover menu;
- `sidebar` fixa explicando o builder.

No produto real, precisamos escolher melhor:

- ou o shell lateral continua minimalista e o builder vive no stage;
- ou a barra secundaria vira toolbox fixa do modulo.

As duas juntas podem gerar redundancia.

### 7.2 Nome do modulo

O mock usa `Relatorios inteligentes`.

No produto real, isso precisa ser decidido com cuidado:

- pode ser bom para uma trilha nova;
- mas pode conflitar com a rota atual `Relatorios`.

Minha leitura hoje:

- rota pode continuar `Relatorios`;
- builder pode ser uma visao interna chamada `Builder`.

### 7.3 Base x contexto

O mock fala em campo, metrica e agrupamento, mas ainda nao deixa explicito o conceito de `base`.

No produto real, isso precisa existir formalmente:

- `bookings`
- `clients`
- `services`
- `professionals`
- `cash_entries`
- `payment_intents`
- `availability`

Sem isso, o usuario tende a montar combinacoes sem saber de qual universo de dados esta partindo.

## 8. Regras do mock que devem ser absorvidas

Estas regras devem ser mantidas como boas decisoes de UX:

- builder em pagina em branco;
- modelos salvos;
- formula literal;
- payload visivel;
- filtros em arvore;
- grupos logicos recolhiveis;
- edicao inline;
- lookup modal;
- sort com prioridade;
- dock tabs para relatorios abertos;
- botao de ocultar builder.

## 9. Regras do mock que nao devem ser absorvidas literalmente

Estas partes precisam de adaptacao antes de virar produto:

- textos e microcopy do mock;
- catalogos locais de campo e lookup;
- resultados fixos;
- codigos gerados no cliente;
- qualquer metrica que nao exista na verdade atual do backend;
- qualquer campo sintetico nao homologado no catalogo semantico oficial.

## 10. Leitura da sintese conceitual enviada pelo usuario

A documentacao conceitual atribuida ao ChatGPT reforca uma linha correta para o `AgendaAI`:

- relatorio dinamico como meio-termo entre relatorio fixo e query livre;
- catalogo de campos com metadados;
- AST/DSL em vez de texto puro;
- filtros, parametros, agrupamento e ordenacao como objetos formais;
- modelos salvos;
- validacao forte no backend;
- governanca de campos, metricas e performance.

Essa sintese esta aderente ao que ja foi consolidado no documento 64.

## 11. Recomendacao de integracao no AgendaAI

O caminho mais seguro de implantacao fica assim:

### Fase A - sem mexer na engine ainda

- absorver deste mock apenas a composicao visual;
- transformar o modulo `Relatorios` em `builder workspace`;
- manter tudo sob feature flag;
- ainda sem prometer flexibilidade ilimitada.

### Fase B - ligar ao catalogo semantico

- trocar `fieldCatalog` local por `catalogo semantico` oficial;
- trocar `lookupCatalog` local por consultas reais do tenant;
- trocar payload fake por `report definition` validada.

### Fase C - executar no backend

- criar endpoint para salvar `report_definitions`;
- criar endpoint para executar uma definicao;
- validar compatibilidade de metrica, base, filtros e ordenacao;
- devolver preview real.

### Fase D - exportar

- PDF/Excel/CSV entram depois;
- so nesse momento faz sentido persistir artefatos exportados.

## 12. Conclusao

O mock `relatorio-dinamico.html` e um bom insumo de UX para o `AgendaAI`.

Ele prova que a estrategia de `pagina em branco com builder` faz sentido e mostra, de forma concreta, como organizar:

- formula;
- filtros;
- grupos logicos;
- modelos salvos;
- resultado;
- payload.

O que ele nao resolve sozinho e a parte mais importante:

- catalogo semantico oficial;
- validacao no backend;
- persistencia de `report_definitions`;
- execucao real sobre a verdade do sistema.

Em resumo:

- o mock esta aprovado como direcao visual e estrutural;
- ele nao esta aprovado como implementacao direta;
- ele deve ser absorvido como `blueprint de UX`, nao como codigo final.
