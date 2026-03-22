# 78. Execucao — Agenda Unificada e Saneamento Financeiro Operacional

Data: 2026-03-22

## Escopo

- unificacao de `Agenda / calendario` e `Operacao diaria` em uma unica superficie de agenda;
- saneamento operacional do `Financeiro`, com preview de `Fechar caixa`, browse com rolagem e modal estavel;
- endurecimento das regras de agendamento para passado e conflito de horario.

## Entregas

### Agenda

- `Agenda` passou a ser a entrada principal do shell para calendario e fila operacional;
- `Operacao diaria` permanece apenas como alias de navegacao para a mesma tela;
- o calendario agora aceita clique em slot vazio para abrir `Novo agendamento` com prefill de data, horario e profissional;
- clique em evento continua abrindo o detalhe da booking;
- a fila lateral passou a compartilhar a mesma selecao da agenda;
- textos explicativos redundantes da agenda foram removidos.

### Booking e disponibilidade

- backend passou a bloquear criacao e reagendamento em horario passado para estados operacionais;
- conflitos continuam validados pelo backend;
- quando o horario informado fica indisponivel, o frontend passa a preparar sugestao da proxima janela disponivel;
- bookings historicos `concluido` continuam validos para leitura gerencial e testes, sem reabrir agendamento retroativo para estados operacionais.

### Financeiro

- `WorkspaceRecordModal` foi estabilizado fora do escopo dinamico do `App`, eliminando a perda de foco ao digitar nos modais;
- campos financeiros passaram a usar entrada monetaria controlada em formato `pt-BR`;
- browse financeiro passou a separar cabecalho e corpo, com rolagem interna real;
- `Fechar caixa` passou a usar preview em tela dividida:
  - esquerda: pendentes selecionaveis;
  - direita: itens ja baixados no periodo;
- o fechamento agora baixa apenas os itens explicitamente selecionados;
- a rota `GET /v1/admin/cash-closes/preview` foi adicionada para alimentar esse preview.

## Validacao

- `@agendaai/contracts build`
- `@agendaai/api-rest test`
- `@agendaai/api-rest lint`
- `@agendaai/api-rest build`
- `@agendaai/admin-web lint`
- `@agendaai/admin-web build`

## Observacoes

- o unico warning residual do admin continua sendo o tamanho do chunk no build;
- o `favicon.ico` 404 local segue sem impacto funcional.
