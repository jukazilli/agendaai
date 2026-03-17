# Jornadas Core

## J-01 Onboarding do negocio

- Entrada: landing institucional ou convite
- Passos: criar conta -> validar email -> criar tenant -> definir nome e slug
- Validacoes: slug unica, senha forte, termos aceitos
- Reflexos: tenant criada, admin vinculado, contexto inicial habilitado
- Criterio de conclusao: negocio entra no dashboard pela primeira vez

## J-02 Configuracao operacional

- Entrada: dashboard inicial
- Passos: cadastrar servicos -> cadastrar profissionais -> definir horarios -> publicar slug
- Validacoes: servico com duracao, profissional com disponibilidade, agenda sem conflito
- Reflexos: tenant apto para receber booking
- Criterio de conclusao: pagina publica operacional

## J-03 Agendamento publico

- Entrada: `/:slug`
- Passos: escolher profissional -> servico -> horario -> informar dados -> pagar sinal quando exigido -> confirmar
- Validacoes: horario disponivel, dados minimos do cliente, regra de sinal
- Reflexos: booking criada, notificacao disparada, agenda atualizada
- Criterio de conclusao: cliente recebe confirmacao do agendamento

## J-04 Execucao do atendimento e receita

- Entrada: agenda do dia
- Passos: localizar booking -> confirmar comparecimento -> concluir atendimento -> registrar reflexo financeiro
- Validacoes: status anterior compativel, valor e origem da receita, profissional e servico associados
- Reflexos: receita operacional consolidada, historico do cliente atualizado
- Criterio de conclusao: atendimento concluido e caixa refletido

## J-05 Relacao e retorno

- Entrada: modulo de clientes ou dashboard
- Passos: consultar carteira -> filtrar inativos ou recorrentes -> acionar mensagem/campanha -> acompanhar resposta
- Validacoes: segmento valido, canal disponivel, consentimento quando necessario
- Reflexos: campanha registrada, historico de contato atualizado
- Criterio de conclusao: acao de retorno disparada com rastreio

## J-06 Leitura gerencial

- Entrada: dashboard e relatorios
- Passos: escolher periodo -> filtrar profissional/servico -> ler agenda, receita e retorno
- Validacoes: fonte de dados consistente e tenant correta
- Reflexos: nenhuma escrita obrigatoria
- Criterio de conclusao: gestor consegue tomar decisao sobre agenda, caixa e retencao
