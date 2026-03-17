# Briefing Inicial Oficial

## 1. Identificacao

- Nome do projeto: AgendaAI
- Categoria: SaaS multi-tenant para agendamentos
- Estagio: estruturacao fundacional
- Origem: consolidado a partir de `ideia` e `briefing-inicial`

## 2. Tese central

AgendaAI nao deve nascer como mais um app de agenda. Deve nascer como plataforma de agendamento, retencao e operacao comercial para negocios com hora marcada.

## 3. Problema principal

Negocios de servico perdem receita porque operam agenda, caixa e relacionamento de forma desconectada.

## 4. Objetivo principal

Entregar um produto vendavel que:

- organize a operacao diaria;
- reduza faltas e cancelamentos;
- conecte atendimento concluido a receita;
- ajude o gestor a reter clientes e vender novamente.

## 5. Publico inicial

- barbearias;
- saloes;
- estetica;
- studios;
- clinicas leves;
- prestadores de servico com agenda recorrente.

## 6. Proposta de valor

- para o cliente final: agendamento rapido, claro e confiavel;
- para o gestor: agenda, caixa, clientes e relacao em um unico sistema;
- para venda: mais que agenda, uma plataforma de retorno do cliente.

## 7. Modulos minimos do core v1

- identidade e tenancy;
- slug publica;
- profissionais;
- servicos;
- catalogos;
- horarios e disponibilidade;
- agenda e calendario;
- clientes;
- notificacoes;
- caixa;
- relatorios basicos;
- configuracoes.

## 8. Fluxo publico essencial

1. cliente acessa a slug
2. escolhe profissional
3. escolhe servico
4. escolhe data e horario
5. informa dados
6. sistema valida necessidade de sinal
7. agenda confirma ou aguarda pagamento
8. cliente recebe confirmacao por mensagem

## 9. Fluxo operacional essencial

1. gestor cria conta
2. define slug
3. cadastra equipe, servicos e horarios
4. acompanha agenda
5. confirma execucao do atendimento
6. receita entra no caixa operacional
7. acompanha clientes, relatorios e retorno

## 10. Diferenciais minimos

- dashboard operacional de agendamentos;
- calendario e visao por profissional;
- integracao com Google Calendar;
- relatorios de vendas e agendamentos;
- fluxo de caixa;
- carteira de clientes;
- retencao e segmentacao inicial.

## 11. Regra de produto

A IA fica fora do MVP transacional. O MVP precisa ser excelente em operacao, experiencia de booking e leitura de cliente.

## 12. Diretriz tecnologica

Escolher tecnologia por funcao:

- REST para comandos e operacao transacional;
- GraphQL para consultas densas e composicao de leitura;
- Python para analytics, segmentacao e evolucao de IA;
- banco relacional para integridade;
- filas para mensagens e jobs.

## 13. Fora do escopo inicial

- app mobile nativo completo;
- IA conversacional ampla;
- marketplace;
- loyalty avancado;
- omnichannel enterprise;
- multiunidade complexa.
