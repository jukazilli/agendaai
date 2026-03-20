# 47. Dashboard sanitizado + modal de balcao

Data: 2026-03-20  
Projeto: `agendaai`  
Escopo: `apps/admin-web`, `docs/03_navegacao_e_shell`

## 1. Precedencia usada

1. `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`
2. implementacao real do `admin-web`
3. referencia estrutural do shell do `vello_food`

Referencia visual foi usada apenas para disciplina de organizacao.  
Contratos, runtime e responsabilidade de tela continuaram vindo do `agendaai`.

## 2. Problema encontrado

O `Dashboard` do `admin-web` estava acumulando:

- repeticao de contexto do shell e da propria tela;
- metadados estruturais do tenant no corpo principal;
- analise executiva, radar semanal e atalhos no mesmo viewport;
- acoes operacionais misturadas com leitura;
- CTA `Novo Agendamento` sem funcionalidade real.

Na pratica, a tela estava legivel como inventario tecnico, mas ruim como produto.

## 3. Reavaliacao de papel por superficie

### Shell

Serve para:

- navegacao global;
- acoes globais;
- disclosure de contexto estrutural do tenant.

Nao serve para:

- competir com analise do dashboard;
- repetir titulo e descricao do modulo em varios niveis.

### Dashboard

Serve para:

- leitura executiva;
- distribuicao de fluxo;
- handoff para operacao, agenda, clientes e relatorios.

Nao serve para:

- exibir configuracao estrutural do tenant em estado sempre aberto;
- misturar atalhos com grafico e radar na mesma coluna lateral;
- funcionar como deposito de observacoes de implementacao.

### Radar da semana

Serve para:

- ler capacidade;
- horas ocupadas e livres;
- carga por dia;
- carga por profissional.

Nao serve para:

- dividir espaco com grafico executivo ou feed financeiro.

### Acessos rapidos

Serve para:

- navegacao util pos-leitura;
- distribuicao operacional.

Nao serve para:

- ficar empilhado junto do KPI principal como se fosse insight analitico.

### Novo Agendamento

Serve para:

- marcar cliente no balcao com o mesmo raciocinio do booking publico;
- respeitar slot real, conflito e disponibilidade;
- nascer como fluxo proprio de acao, nao como redirecionamento cego para `agenda`.

## 4. Decisoes aplicadas

### 4.1 Dashboard por tab bar

O dashboard passou a operar com visoes dedicadas:

- `Resumo executivo`
- `Agenda da semana`
- `Radar da semana`
- `Clientes e retorno`
- `Acessos rapidos`

Com isso, `Radar da semana` e `Acessos rapidos` deixaram de disputar a mesma lateral do KPI executivo.

### 4.2 Contexto estrutural escondido no shell

Os campos abaixo sairam do corpo principal e foram para um disclosure no shell ao lado do CTA principal:

- tenant
- slug publica
- agenda hoje
- timezone
- janela ativa

### 4.3 CTA funcional de balcao

`Novo Agendamento` virou modal proprio, responsivo, com jornada em 4 etapas:

1. servico
2. profissional
3. horario
4. cliente

Decisao de contrato:

- a jornada visual reaproveita o raciocinio do `booking-web`;
- a persistencia usa contratos administrativos reais do `admin`;
- foram usados `POST /v1/admin/clients` e `POST /v1/admin/bookings`;
- nao foi embutido checkout publico no admin.

Motivo:

- encaixa melhor no caso de balcao;
- preserva regras de negocio do projeto;
- evita duplicar API ou trazer dependencia indevida do fluxo publico com pagamento.

## 5. Arquivos alterados

- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/styles.css`
- `apps/admin-web/src/lib/admin-api.ts`
- `docs/03_navegacao_e_shell/01_admin_shell_e_inventario_de_telas.md`

## 6. Validacao

### Build e lint

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Ambos passaram em `20/03/2026`.

### Browser QA real

Ambiente:

- `vite preview` do `@agendaai/admin-web`
- `http://127.0.0.1:4173`

Checks realizados:

- dashboard abriu sem repeticao tripla de `Dashboard`;
- disclosure `Contexto` abriu e exibiu os metadados do tenant fora do corpo principal;
- tab bar dedicada funcionou para as visoes do dashboard;
- `Novo Agendamento` abriu modal proprio;
- fluxo de balcao criou booking real;
- o total de `Agenda hoje` subiu de `7` para `8` apos o submit;
- `Abrir agenda` levou para `#agenda` com a booking selecionada no detalhe documental;
- sem overflow horizontal em `390x844`.

## 7. Regra consolidada

Para o `admin-web` daqui em diante:

- dashboard e shell nao podem repetir o mesmo contexto em cascata;
- metadados estruturais do tenant ficam em disclosure do shell;
- cada conjunto analitico concorre por tab dedicada antes de virar card lateral;
- CTA operacional importante nao pode apenas navegar, precisa executar a tarefa em superficie propria.
