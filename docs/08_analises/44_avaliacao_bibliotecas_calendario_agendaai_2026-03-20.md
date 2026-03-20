# Avaliacao de Bibliotecas de Calendario para o AgendaAI - 2026-03-20

## 1. Objetivo

Avaliar, com base no AgendaAI real, as opcoes `react-big-calendar`, `FullCalendar` e `react-calendar`, usando tres parametros praticos:

- permitir regras de negocio do projeto;
- permitir estilizacion consistente com o shell e o design system atuais;
- ser funcional dentro da arquitetura real do monorepo.

Esta avaliacao nao parte de uma comparacao generica. Ela considera:

- contratos atuais de `booking`, `availability`, `professional`, `payment intent` e `reporting`;
- shell administrativo ja materializado;
- separacao canonica entre `agenda` beta e `calendario denso` pos-beta.

## 2. Regra de precedencia usada

1. documentacao oficial do AgendaAI sobre shell, backlog e contratos;
2. codigo real do `admin-web`, `api-rest` e `packages/contracts`;
3. documentacao oficial das bibliotecas avaliadas.

## 3. Documentacao consultada no projeto

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\10_backlog\01_backlog_beta_agendaai_minimo_operacional.md`
- `C:\projetos\agendaai\docs\02_fundacoes\01_entidades_centrais_e_contratos_base.md`
- `C:\projetos\agendaai\docs\08_analises\32_execucao_b09_calendario_mensal_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\36_execucao_entity_document_master_detail_agendaai_2026-03-19.md`
- `C:\projetos\agendaai\docs\08_analises\43_browser_qa_admin_refinamentos_responsivos_2026-03-20.md`

## 4. Codigo verificado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`
- `C:\projetos\agendaai\apps\admin-web\src\lib\admin-api.ts`
- `C:\projetos\agendaai\packages\contracts\src\index.ts`

## 5. Fontes oficiais externas consultadas

- `react-big-calendar` README oficial: https://github.com/jquense/react-big-calendar
- `FullCalendar` React docs: https://fullcalendar.io/docs/react
- `FullCalendar` Timeline docs: https://fullcalendar.io/docs/timeline-view
- `react-calendar` README oficial: https://github.com/wojtekmaj/react-calendar

## 6. O que o AgendaAI realmente precisa

### 6.1 O que ja esta materializado hoje

Em 20/03/2026, o beta do AgendaAI ja possui:

- agenda diaria operacional;
- reagendamento por slot real;
- leitura semanal de capacidade;
- visao mensal navegavel;
- disponibilidade semanal por profissional;
- filtros por profissional;
- contratos reais para `booking`, `availability` e `payment intent`.

O shell oficial tambem explicita que:

- `agenda` beta ja esta fechada;
- `calendario denso` e uma rota pos-beta planejada;
- `drag-and-drop` continua fora do corte beta.

### 6.2 O que ainda justificaria uma biblioteca de calendario

Uma biblioteca externa passa a fazer sentido quando o produto abrir um corte que exija simultaneamente:

- varias linhas por profissional no mesmo viewport;
- calendario realmente denso e navegavel como superficie principal;
- reordenacao visual de horario;
- conflitos por recurso;
- bloqueios por excecao e leitura temporal mais rica;
- menor custo de manutencao do que continuar evoluindo grid propria.

## 7. Parametros de avaliacao

### 7.1 Permitir regras de negocio do projeto

O AgendaAI nao e apenas um calendario visual. A agenda depende de:

- `tenantId` em tudo;
- slots derivados da disponibilidade real do profissional;
- booking com status operacional;
- conflito de horario resolvido no backend;
- pagamento vinculado a booking;
- filtros por profissional e servico;
- futura evolucao de bloqueios, ferias e excecoes.

Entao a biblioteca precisa aceitar o dominio como fonte de verdade, sem empurrar um modelo proprio que passe por cima do backend.

### 7.2 Permitir estilizacion

O admin hoje ja foi padronizado em:

- shell lateral persistente;
- topbar contextual;
- `entity view`, `document view` e `master-detail`;
- CSS proprio e `@agendaai/ui`.

Logo, a biblioteca precisa aceitar customizacao forte e nao pode nos prender a um visual “pronto” que conflite com o shell atual.

### 7.3 Ser funcional dentro do monorepo

Precisamos de compatibilidade pragmatica com:

- `React + TypeScript`;
- `Vite` no `admin-web`;
- contratos vindos de `packages/contracts`;
- API real no `api-rest`;
- evolucao incremental, sem reescrever a agenda beta toda.

## 8. Avaliacao das opcoes

### 8.1 `react-big-calendar`

O que a documentacao oficial confirma:

- e um componente de calendario estilo Google/Outlook;
- suporta localizers como `date-fns`;
- possui addon de drag-and-drop;
- permite customizacao via CSS/SASS.

Leitura aplicada ao AgendaAI:

- encaixa bem em `React + TypeScript + Vite`;
- conversa bem com nosso modelo de `eventos`;
- deixa o backend continuar mandando a verdade dos slots e bookings;
- e mais leve conceitualmente que `FullCalendar`.

Pontos fortes no nosso contexto:

- bom candidato para semana/dia/mes sem custo de licenca;
- aceitavel para agenda por profissional com customizacao propria;
- menor atrito de adocao se quisermos apenas trocar a grade visual.

Limites no nosso contexto:

- a documentacao oficial nao vende uma timeline de recursos tao forte quanto o `FullCalendar`;
- drag-and-drop existe, mas nossa regra de negocio continuaria exigindo validacao pesada no backend;
- estilizar profundamente e manter fidelidade ao shell pode custar mais do que parece;
- para um calendario denso de multiplos profissionais, agrupamentos e leitura mais “scheduler”, ele tende a exigir mais adaptacao.

Conclusao para o AgendaAI:

- melhor opcao gratuita se quisermos subir o nivel visual da agenda sem entrar em licenca premium;
- nao e a melhor opcao para a fase em que o produto passar a exigir timeline densa por recurso.

### 8.2 `FullCalendar`

O que a documentacao oficial confirma:

- o wrapper React aceita JSX e exposicao da API por `ref`;
- a versao premium traz `resource timeline`;
- a timeline premium trabalha com eixo temporal horizontal e recursos em linhas;
- para usar recursos/timeline premium, e necessario pacote proprio e `schedulerLicenseKey`.

Leitura aplicada ao AgendaAI:

- e o candidato mais forte quando o problema deixa de ser “mostrar agenda” e vira “operar scheduler”;
- bate melhor com a rota canonica de `calendario denso` pos-beta;
- nos permite representar profissionais como recursos nativos da view, em vez de improvisar isso visualmente.

Pontos fortes no nosso contexto:

- melhor aderencia a um futuro `/app/calendario` com multiplos profissionais;
- API forte para navegacao, selecao de slot e renderizacao customizada;
- permite continuar tenant-scoped e backend-driven;
- encaixa melhor na futura necessidade de conflito, bloqueio e reorganizacao visual.

Limites no nosso contexto:

- timeline por recurso e premium;
- custo e dependencia de licenca entram na arquitetura do produto;
- bundle e complexidade sobem;
- se adotado cedo demais, podemos pagar custo alto para resolver um problema que o beta atual ainda nao tem.

Conclusao para o AgendaAI:

- melhor opcao tecnica para o futuro calendario denso do produto;
- nao e a melhor decisao para agora, antes de abrir oficialmente esse modulo pos-beta.

### 8.3 `react-calendar`

O que a documentacao oficial confirma:

- e um calendario interativo leve;
- trabalha com selecao de data, range e navegacao por mes/ano;
- e facil de estilizar.

Leitura aplicada ao AgendaAI:

- atende bem date picking;
- nao atende bem agenda operacional;
- nao resolve timeline, recursos, conflito ou scheduler.

Conclusao para o AgendaAI:

- nao deve ser escolhido para substituir a agenda administrativa;
- so faria sentido como date picker auxiliar, nao como base do modulo de agenda/calendario.

## 9. Matriz final contra os parametros do projeto

| Opcao | Regras de negocio do AgendaAI | Estilizacao no nosso shell | Funcionalidade para o projeto | Veredito |
| --- | --- | --- | --- | --- |
| `react-big-calendar` | boa, desde que backend continue mandando slots e conflitos | boa, mas exige trabalho | boa para agenda visual sem timeline premium | melhor opcao gratuita de adocao futura |
| `FullCalendar` | muito boa | boa, com integracao mais pesada | excelente para calendario denso e recursos | melhor opcao tecnica para pos-beta, se houver licenca |
| `react-calendar` | fraca para agenda real | boa | insuficiente para scheduler | descartada para este caso |

## 10. Recomendacao objetiva para o AgendaAI

### 10.1 Melhor resposta arquitetural hoje

Nao adotar nenhuma dessas bibliotecas agora.

Motivo:

- o beta atual ja cobre agenda do dia, semana e mes com contratos reais;
- o ganho de negocio imediato agora esta em `Relatorios`, nao em reabrir a agenda;
- introduzir biblioteca neste ponto geraria retrabalho estrutural antes de o produto precisar de fato do modulo denso.

### 10.2 Biblioteca recomendada quando o momento chegar

Se o produto abrir oficialmente o corte de `calendario denso` pos-beta:

- `FullCalendar` passa a ser a melhor opcao tecnica, desde que a trilha aceite licenca premium para `resource timeline`.

Se o produto nao quiser dependencia premium:

- `react-big-calendar` vira o melhor plano B, com a consciencia de que teremos mais trabalho proprio para chegar no nivel de scheduler por profissional que o produto tende a pedir.

## 11. Melhor momento para realizar essa parte no projeto

### Momento recomendado

Depois de fechar a rodada atual de consolidacao do admin, especialmente:

1. `Relatorios` no padrao novo;
2. eventuais ajustes residuais de shell e documentacao;
3. validacao de que a agenda beta atual realmente saturou o que precisava entregar.

### Gatilho funcional correto

Abrir a substituicao ou adocao de biblioteca somente quando entrar no backlog um corte com estes criterios:

- rota `calendario` promovida de planejada para ativa;
- necessidade explicita de varias linhas por profissional no mesmo viewport;
- operacao com conflito visual e bloqueios por excecao;
- necessidade real de drag-and-drop com reconciliacao de negocio;
- budget e decisao de licenca definidos, se a escolha for `FullCalendar`.

## 12. Decisao recomendada

Em 20/03/2026, a decisao mais coerente com o AgendaAI e:

- manter a agenda atual como esta;
- nao adotar biblioteca de calendario neste corte;
- tratar `FullCalendar` como alvo principal do futuro modulo de calendario denso;
- tratar `react-big-calendar` como fallback sem premium;
- descartar `react-calendar` como base de agenda administrativa.

## 13. Proximo passo apos esta avaliacao

Seguir no `admin-web` para `Relatorios`, que continua sendo o proximo corte de maior valor imediato no produto.
