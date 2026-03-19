# Admin Shell - Referencia Gemini, Contratos Reais e Plano

## 1. Objetivo

Avaliar a referencia de telas fornecida pelo usuario para o dashboard/admin shell, separar o que ela propõe de forma aderente do que ela alucina sem lastro no runtime, e transformar isso em plano de implementacao controlado.

## 2. Fontes usadas

Referencia do usuario:

- mock React enviado em `18/03/2026`;
- link de apoio: `https://gemini.google.com/share/85f07e97544b`.

Documentacao oficial:

- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/08_analises/16_raio_x_admin_shell_navegacao_e_inventario_2026-03-18.md`

Implementacao e contratos:

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/lib/admin-api.ts`
- `services/api-rest/src/app.ts`
- `packages/contracts/src/v1/tenant.ts`
- `packages/contracts/src/v1/service.ts`
- `packages/contracts/src/v1/professional.ts`
- `packages/contracts/src/v1/availability.ts`
- `packages/contracts/src/v1/client.ts`
- `packages/contracts/src/v1/booking.ts`
- `packages/contracts/src/v1/payment.ts`

## 3. Regra de leitura

Precedencia aplicada:

1. contratos e endpoints reais para dizer o que pode ser funcional;
2. documentacao oficial para dizer onde cada tela deveria existir;
3. mock do Gemini como referencia de navegacao, composicao e hierarquia, nao como prova de suporte funcional.

## 4. O que existe de verdade hoje

Entidades e contratos reais disponiveis:

- `Tenant`
- `AdminSessionClaimsContract`
- `TenantPaymentSettings`
- `Service`
- `Professional`
- `AvailabilityRule`
- `Client`
- `Booking`
- `PaymentIntent`

Rotas admin reais disponiveis hoje:

- auth e sessao admin;
- leitura de tenant e update de slug;
- `payment-settings`;
- CRUD de `services`;
- CRUD de `professionals`;
- get/put de disponibilidade por profissional;
- CRUD de `clients`;
- CRUD de `bookings`.

Lacunas contratuais explicitas hoje:

- nenhum contrato de `cash-entry` ou receita operacional;
- nenhum contrato de dashboard agregado ou serie temporal;
- nenhum contrato de score de retencao, recorrencia ou risco;
- nenhum contrato de campanha, WhatsApp ou notificacao operacional;
- nenhum contrato de assinatura/billing do proprio `AgendaAI`;
- nenhum read model formal de calendario denso ou relatorios.

## 5. Mapeamento da referencia por tela

### 5.1 Shell global

| Bloco do mock | Encaixe no shell real | Contrato/API | Status |
| --- | --- | --- | --- |
| sidebar com modulos `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes`, `configuracoes` | aderente ao shell oficial | nao depende de contrato; depende de roteamento do `admin-web` | FUNCIONAL |
| header com titulo da rota atual | aderente | sem dependencia de contrato | FUNCIONAL |
| botao `Novo Agendamento` | pode abrir fluxo de booking interno | `POST /v1/admin/bookings` + `clients`, `services`, `professionals` | FUNCIONAL |
| busca global no header `(nao funcional)` | nao ha read model de busca cross-modulo | nao existe endpoint de busca global | NAO FUNCIONAL |
| sino de notificacoes `(nao funcional)` | depende de dominio de notificacoes | nao existe contrato de notificacao | NAO FUNCIONAL |

### 5.2 Dashboard gerencial

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| cards `Receita Total`, `Taxa de Retencao`, `Ticket Medio`, `Taxa de No-Show` | pertencem ao dashboard `/app` | `Booking` permite no-show; receita, retencao e ticket medio nao possuem contrato agregado oficial | PARCIAL |
| grafico `Faturamento vs Agendamentos` `(nao funcional)` | pertence ao dashboard | nao existe contrato de serie temporal agregada | NAO FUNCIONAL |
| funil `Saude da Agenda` `(nao funcional)` | faz sentido no dashboard | existe `AvailabilityRule`, mas nao existe read model de capacidade, ocupacao e recorrencia por periodo | NAO FUNCIONAL |
| dica automatica de reativacao `(nao funcional)` | faz sentido como futuro CRM | nao existe contrato de campanha, score de inatividade ou motor de recomendacao | NAO FUNCIONAL |

Leitura objetiva:

- o mock acerta ao separar um dashboard gerencial do operacional;
- quase todo o conteudo analitico dele ainda nao tem lastro de contrato.

### 5.3 Operacao diaria

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| lista diaria de atendimentos | tela `/app/agenda` ou `/app/operacional` | `Booking` + `Client` + `Service` + `Professional` | FUNCIONAL |
| contadores `Agendados`, `Finalizados`, `No-Shows` | resumo do dia | derivavel de `Booking.status` | FUNCIONAL |
| `Previsao Faturar` | resumo operacional | pode ser derivada de `Booking` + `Service.precoBase`, mas sem contrato financeiro oficial | PARCIAL |
| acao `Confirmar` | operacao do dia | `PATCH /v1/admin/bookings/:bookingId` | FUNCIONAL |
| acao `Concluir` | operacao do dia | `PATCH /v1/admin/bookings/:bookingId` | FUNCIONAL |
| acao `Cancelar` | operacao do dia | `PATCH /v1/admin/bookings/:bookingId` | FUNCIONAL |
| acao `No-Show` | operacao do dia | `Booking.status = faltou` | FUNCIONAL |
| acao `Iniciar` | operacao intermediaria de atendimento | nao existe status dedicado de `em_atendimento`; pode ser mantida como UX local ou removida | PARCIAL |
| acao `Finalizar & Cobrar` | mistura operacao com financeiro | concluir e possivel; cobrar nao tem contrato financeiro | PARCIAL |
| badge `Pago Antecipado` `(nao funcional)` | faria sentido no card de booking | `PaymentIntent` existe, mas nao entra no bootstrap admin nem ha ligacao exposta por card no contrato atual | NAO FUNCIONAL |
| botao `WhatsApp` `(nao funcional)` | faria sentido como CRM operacional | nao existe contrato de mensagem ou template | NAO FUNCIONAL |

Leitura objetiva:

- esta e a tela mais aproveitavel da referencia;
- quase tudo pode ser encaixado com contratos reais, exceto WhatsApp, badge de pagamento antecipado explicita e cobranca financeira.

### 5.4 Agenda / calendario

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| visualizacao de calendario completo | tela `/app/calendario` | `Booking`, `Professional`, `AvailabilityRule` | PARCIAL |
| troca de periodo `mes/semana/dia` | calendario denso | contratos base sustentam os eventos, mas nao existe read model especifico | PARCIAL |
| drag and drop / reagendamento | calendario operacional | `PATCH /v1/admin/bookings/:bookingId` suporta `startAt`, `endAt` e `professionalId` | PARCIAL |
| `Novo Agendamento Interno` | calendario e agenda | `POST /v1/admin/bookings` | FUNCIONAL |

Leitura objetiva:

- a tela faz sentido;
- a referencia esta mais avancada que o runtime, mas nao alucina completamente;
- depende mais de shell/UI do que de novos contratos.

### 5.5 Catalogo

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| tabela de servicos | `/app/catalogo` | `Service` + `GET /services` | FUNCIONAL |
| criar servico | `/app/catalogo` | `POST /services` | FUNCIONAL |
| editar servico | `/app/catalogo` | `PATCH /services/:serviceId` | FUNCIONAL |
| produtos, kits, combos e add-ons `(nao funcional)` | pertencem ao catalogo futuro | nao existem contratos dessas entidades | NAO FUNCIONAL |

Leitura objetiva:

- o mock faz sentido se tratado como catalogo de servicos;
- ele extrapola quando assume catalogo completo de comercio sem contratos correspondentes.

### 5.6 Profissionais

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| grade de profissionais | `/app/profissionais` | `Professional` + `GET /professionals` | FUNCIONAL |
| criar profissional | `/app/profissionais` | `POST /professionals` | FUNCIONAL |
| editar especialidades | `/app/profissionais` | `PATCH /professionals/:professionalId` | FUNCIONAL |
| botao `Horarios` | disponibilidade semanal | `GET/PUT /professionals/:professionalId/availability` | FUNCIONAL |
| botao `Ver Agenda` | abrir agenda filtrada do profissional | `Booking` + `Professional` ja permitem isso | PARCIAL |

### 5.7 Clientes

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| lista basica de clientes | `/app/clientes` | `Client` + `GET /clients` | FUNCIONAL |
| criar cliente | `/app/clientes` | `POST /clients` | FUNCIONAL |
| busca por nome/contato | `/app/clientes` | pode nascer como filtro local sobre `GET /clients` | FUNCIONAL |
| ultima visita | `/app/clientes` | derivavel de `Booking` + `Client` | FUNCIONAL |
| `LTV (Gasto Total)` `(nao funcional)` | pertence a CRM/financeiro | nao existe contrato de receita por cliente | NAO FUNCIONAL |
| status `Frequente`, `Regular`, `Em Risco`, `Ausente` `(nao funcional)` | faz sentido de produto | nao existe contrato de score de cliente nem regra oficial congelada | NAO FUNCIONAL |

### 5.8 Configuracoes e implantacao

| Bloco do mock | Encaixe esperado | Contrato/API | Status |
| --- | --- | --- | --- |
| perfil do negocio | `/app/configuracoes` | `Tenant` + update de slug; update amplo de tenant ainda nao existe | PARCIAL |
| slug publica | `/app/implantacao` ou `/app/configuracoes` | `PATCH /tenant/slug` | FUNCIONAL |
| Mercado Pago conectado | `/app/implantacao` ou `/app/configuracoes` | `TenantPaymentSettings` + `PUT /payment-settings` | FUNCIONAL |
| `Webhooks e API` | configuracao tecnica | `TenantPaymentSettings.notificationUrl` e `backUrls` existem, mas nao ha modulo dedicado de observabilidade de webhook | PARCIAL |
| `Assinatura AgendaAI` `(nao funcional)` | conta/plano do SaaS | nao existe contrato de subscription/billing do produto | NAO FUNCIONAL |

## 6. Veredito sobre a referencia

O Gemini acertou principalmente em:

- separar `dashboard`, `operacional`, `agenda`, `catalogo`, `profissionais`, `clientes` e `configuracoes`;
- usar sidebar persistente e shell claro;
- tratar `operacao diaria` como superficie distinta da visao gerencial;
- reservar `calendario` como tela propria.

O Gemini extrapolou sem lastro em:

- analytics gerenciais prontos;
- grafico temporal de faturamento;
- recomendacao inteligente de reativacao;
- WhatsApp operacional;
- status preditivos da base de clientes;
- assinatura do `AgendaAI`;
- cobranca financeira do atendimento concluido.

## 7. Plano recomendado de implementacao

### Fase 1 - Shell e navegacao

- materializar sidebar, header e rotas reais no `admin-web`;
- quebrar o `single-page shell` atual em views de `dashboard`, `implantacao`, `catalogo`, `profissionais`, `agenda`, `clientes` e `configuracoes`;
- preservar a paleta e tipografia do `agendaai`, usando o mock apenas como referencia de hierarquia e navegacao.

### Fase 2 - Levantar o que ja existe

- mover o que ja esta funcional hoje para as rotas certas:
  - implantacao: slug e Mercado Pago;
  - catalogo: servicos;
  - profissionais: equipe e disponibilidade;
  - agenda: bookings e acoes operacionais;
  - clientes: leitura derivada de bookings.

### Fase 3 - Adotar blocos aderentes do mock

- dashboard com cards basicos e placeholders honestos;
- operacional diaria com resumo do dia e timeline real;
- calendario como tela propria, mesmo que entre primeiro em modo parcial;
- CTA de novo agendamento interno usando contratos ja existentes.

### Fase 4 - Marcar o que nao e funcional

Em qualquer tela onde a referencia pedir algo sem lastro de contrato ou sem runtime correspondente, exibir explicitamente:

- `(nao funcional)` no rotulo da funcionalidade;
- ou placeholder honesto dizendo que o bloco depende de read model ou contrato ainda inexistente.

### Fase 5 - Abrir contratos futuros

Depois do shell estar separado, os proximos contratos estruturais a abrir sao:

- relatorios/read models;
- financeiro operacional e receita;
- notificacoes e WhatsApp;
- score de cliente e campanhas;
- assinatura/billing do `AgendaAI`.

## 8. Conclusao

A referencia e boa como guia de shell, navegacao e taxonomia de telas. Ela nao deve ser adotada como promessa funcional integral. O corte correto e:

1. absorver a navegacao e a separacao de modulos;
2. encaixar somente os blocos sustentados por contratos reais;
3. marcar explicitamente como `(nao funcional)` tudo o que hoje nao tem lastro em contrato, endpoint ou read model.
