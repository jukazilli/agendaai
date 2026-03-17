# Briefing Arquitetural Estruturado

## 1. Identificacao do Produto

- Nome: AgendaAI
- Contexto: greenfield documentado antes da implementacao
- Estagio: base arquitetural pronta para fundacao tecnica

## 2. Definicao do Produto

AgendaAI e uma plataforma SaaS multi-tenant para negocios de servico com hora marcada. Cada negocio cria sua conta, define sua slug publica e opera duas superfices complementares:

- experiencia publica de agendamento;
- backoffice para operacao, clientes, financeiro e retencao.

## 3. Problema que Resolve

O mercado de servicos sofre com a desconexao entre agenda, comparecimento, receita e relacionamento. O resultado e baixa previsibilidade, no-show, perda de clientes e operacao reativa.

## 4. Objetivo Principal

Entregar um produto vendavel que una booking simples para cliente final com operacao forte para o gestor, conectando atendimento concluido a receita e leitura de base de clientes.

## 5. Publico e Perfis de Usuario

- gestor do negocio: configura operacao, acompanha agenda, caixa e clientes;
- profissional/atendente: consulta agenda, confirma atendimento e atualiza status;
- cliente final: agenda servico de forma rapida e confiavel;
- operador interno futuro: conduz customizacoes governadas por pacote de horas.

## 6. Visao do PO

### MVP

- criacao de conta e tenant;
- definicao de slug;
- cadastro de servicos, profissionais, catalogos e horarios;
- booking publico com opcional de sinal;
- agenda e calendario operacional;
- confirmacao manual da execucao;
- caixa operacional basico;
- clientes e historico essencial;
- relatorios essenciais.

### Escopo inicial

- publico vertical inicial para servicos recorrentes;
- interface publica clara e sem friccao;
- dashboard administrativo denso, mas legivel;
- integracoes minimas: calendario, pagamento, mensagens.

### Modulos essenciais

- identidade e tenancy;
- catalogo e equipe;
- disponibilidade e agenda;
- booking publico;
- operacao e calendario;
- clientes e CRM basico;
- financeiro operacional;
- notificacoes;
- relatorios;
- configuracoes.

### Jornadas minimas

- J-01 onboarding do negocio;
- J-02 configuracao operacional;
- J-03 agendamento publico;
- J-04 confirmacao de execucao e receita;
- J-05 acompanhamento de clientes e retorno;
- J-06 consulta gerencial de desempenho.

### Fora do escopo

- app mobile nativo;
- IA generativa no core;
- automacao de marketing completa;
- multiunidade enterprise;
- marketplace.

## 7. Visao do CMO

### Proposta de valor

"Nao vendemos agenda; vendemos retorno do cliente."

### Percepcao de marca

- confiavel;
- clara;
- comercial;
- moderna sem parecer hype;
- robusta sem parecer ERP pesado.

### Tom

- objetivo;
- consultivo;
- orientado a resultado;
- proximo do negocio local.

### Diferenciacao

- conecta agenda com receita;
- trata cliente como carteira e nao como cadastro passivo;
- nasce com camada de retencao no raciocinio do produto;
- usa tecnologia por funcao, nao por habito.

## 8. Visao de Arquitetura

### Arquitetura macro

Monorepo com separacao entre superfices, servicos e pacotes compartilhados:

```text
/apps
  /admin-web
  /booking-web
  /marketing-site
/services
  /api-rest
  /graphql-bff
  /analytics-python
  /workers
/packages
  /ui
  /contracts
  /domain
  /config
/infra
/docs
/assets
```

### Dominios principais

- identidade e tenancy;
- catalogo de servicos;
- equipe e agenda;
- booking;
- pagamentos e sinal;
- clientes e CRM;
- financeiro;
- relatorios e analytics;
- campanhas e notificacoes;
- configuracoes e customizacao.

### Fronteiras

- `api-rest`: comandos, validacoes, regras de negocio, mutacoes transacionais;
- `graphql-bff`: leitura agregada e consultas densas de dashboard;
- `analytics-python`: jobs, ETL, segmentacao e evolucao de recomendacao;
- `workers`: envio assicrono de notificacoes e tarefas agendadas;
- `apps`: apresentacao e orquestracao de interface;
- `packages`: contratos, dominio, design system e convencoes.

### Fundacoes estruturais

- contexto de tenant obrigatorio em todas as camadas;
- identidade de usuario separada do slug publico;
- calendario e disponibilidade modelados como dominio, nao como tabela solta;
- reconhecimento de receita somente apos atendimento concluido;
- eventos assicronos para notificacoes e reflexos operacionais.

## 9. Visao de Engenharia

### Premissas tecnicas

- PostgreSQL para consistencia transacional;
- Redis para filas, locks curtos e cache operacional;
- REST como interface padrao de comandos;
- GraphQL apenas para leitura agregada quando necessario;
- Python fora do caminho critico transacional;
- observabilidade desde a fundacao.

### Escolha de stack por funcao

- `apps/booking-web`: Next.js para rotas por slug, SSR e experiencia publica;
- `apps/admin-web`: React + Vite para dashboard rapido e densidade operacional;
- `apps/marketing-site`: Astro para conteudo e performance;
- `services/api-rest`: NestJS com adapter Fastify para modularidade e throughput;
- `services/graphql-bff`: GraphQL Yoga ou Apollo Server sobre read models;
- `services/analytics-python`: Python para ETL, cohorts e modelos futuros;
- `services/workers`: Node.js para jobs de notificacao e sincronizacao.

### Dados minimos

- tenant;
- usuario administrador;
- cliente;
- profissional;
- servico;
- catalogo;
- agenda;
- disponibilidade;
- agendamento;
- transacao financeira;
- campanha;
- evento de notificacao.

### Integracoes sensiveis

- provedor de pagamento/sinal;
- provedor de WhatsApp/SMS;
- Google Calendar;
- e-mail transacional.

### Dependencias criticas

- modelo de autenticacao e autorizacao;
- politica de isolamento multi-tenant;
- padrao de eventos;
- contratos base de booking e receita.

## 10. Visao de UI/UX

### Conceito de experiencia

Operacao calma com energia comercial. A experiencia publica precisa ser curta e confiante. O backoffice precisa ser denso, mas sempre orientado a acao.

### Navegacao macro

- shell publico por slug;
- shell admin com menu lateral persistente;
- paginas de trabalho com filtros, tabelas, calendario e paines laterais;
- estados claros de vazio, carregamento, erro e sucesso.

### Tipos de tela

- landing publica por tenant;
- fluxo de booking em etapas;
- dashboard operacional;
- calendario;
- listagens filtradas;
- drawer de detalhe;
- telas de configuracao;
- visoes gerenciais com cards e tabelas.

### Componentes base

- button, input, select, combobox, calendar picker;
- data table;
- cards de resumo;
- tabs;
- drawer;
- modal;
- badge/status pill;
- stepper;
- toast e alert.

### Direcao visual

- base clara e calorosa;
- contraste alto em tipografia;
- acentos em teal e ember;
- tipografia com personalidade, sem parecer ludica;
- formas arredondadas, mas firmes;
- grid consistente com densidade controlada.

## 11. Referencias Visuais

As referencias desta rodada vieram de:

- ideia e briefing originais do usuario;
- frameworks locais de UI/UX Research, Style Guide e Design System;
- sinais competitivos citados no briefing original, sem navegacao externa.

## 12. Direcao Visual Adotada

- estilo: SaaS operacional premium acessivel
- cores: ink, canvas, teal e ember
- tipografia: display editorial serif e tipografia de produto neutra
- hierarquia: data e acao primeiro, decoracao por ultimo
- defaults do metodo: aplicados apenas como base, depois refinados

## 13. Jornadas Iniciais

- onboarding do negocio e criacao da slug;
- configuracao de servicos, profissionais e horarios;
- agendamento pelo cliente final;
- confirmacao de execucao e consolidacao de receita;
- consulta de carteira e retorno;
- leitura de indicadores.

## 14. Requisitos Minimos Consolidados

- multi-tenancy com slug unica;
- agenda publica por servico e profissional;
- controle de horarios e disponibilidade;
- opcao de sinal para reservar horario;
- notificacoes de confirmacao;
- calendario operacional;
- caixa basico com entradas e saidas;
- cliente com historico minimo;
- relatorios essenciais de agenda, receita e retorno.

## 15. Lacunas e Decisoes Pendentes

- provedor inicial de mensagens;
- provedor inicial de pagamentos;
- estrategia de dominio customizado;
- profundidade real do modulo de campanhas no v1;
- estrategia de permissao entre dono, gerente e equipe.

## 16. Prontidao para MFEE

O projeto esta pronto para o MFEE consumir porque ja possui:

- conceito e briefing consolidados;
- direcao de UI, marca e sistema de interface;
- arquitetura macro e estrutura de repositorio;
- modulos, jornadas, integracoes e fundacoes mapeados;
- backlog fundacional priorizado;
- analise inicial de aderencia e auditoria da rodada.
