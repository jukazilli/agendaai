# Refinamento Estrategico

## 1. Decisoes tomadas nesta rodada

- posicionamento oficial: plataforma de agendamento com foco em recorrencia e receita;
- publico inicial: negocios de servico com operacao recorrente e hora marcada;
- IA: adiada para camada futura de analytics;
- modelo de arquitetura: monorepo com apps, services, packages e infra;
- separacao de cargas: REST transacional separado de camada GraphQL/read model;
- identidade: marca confiavel, clara e comercial, sem cara de ERP pesado.

## 2. Ambiguidades reduzidas

| Tema | Estado inicial | Decisao desta rodada |
| --- | --- | --- |
| Escopo do MVP | muito amplo | priorizado em fundacao operacional e recorrencia basica |
| Stack | intencao generica de usar a tecnologia certa | stack definida por fronteira funcional |
| IA no core | citada como desejo | movida para fase futura |
| Customizacao | conceito amplo | tratada como trilha governada apos core |
| Publico | horizontal generico | vertical inicial orientada a servicos recorrentes |

## 3. Hipoteses explicitas

- clientes valorizarao um produto que una agenda e retorno mais do que um app simples;
- a visao de caixa operacional sera diferencial comercial relevante;
- a separacao entre servico transacional e camada analitica reduz retrabalho futuro.

## 4. Decisoes pendentes

- provedor inicial de pagamentos/sinal;
- provedor inicial de WhatsApp/SMS;
- estrategia de autenticao do admin;
- modelo de dominio customizado por tenant;
- priorizacao exata entre CRM e financeiro para a primeira release comercial.

## 5. Regras de escopo

Dentro do escopo fundacional:

- tenancy;
- catalogo;
- disponibilidade;
- booking publico;
- agenda operacional;
- confirmacao de execucao;
- caixa essencial;
- carteira de clientes basica;
- relatorios essenciais.

Fora do escopo fundacional:

- automacoes avancadas;
- recomendacao inteligente;
- engine completa de campanhas;
- multiunidade enterprise.
