# Documento de Style Guide

## 1. Introducao

Este style guide formaliza a identidade inicial de AgendaAI e prepara a traducao para sistema de produto.

## 2. Essencia da marca

- essencia: retorno organizado
- promessa: transformar agenda em receita e recorrencia
- sensacao: controle claro com impulso de crescimento

## 3. Posicionamento

AgendaAI se posiciona como plataforma de agendamento e retencao para negocios de servico, com aparencia confiavel e foco comercial.

## 4. Atributos centrais

- confiavel
- clara
- moderna
- acionavel
- comercial

## 5. Antiatributos

- generica
- fria
- burocratica
- datada
- infantil

## 6. Arquitetura da marca

Estrutura recomendada:

- assinatura principal: simbolo + wordmark
- assinatura secundaria: wordmark isolado
- reducao: simbolo isolado

## 7. Wordmark

### Forma oficial

- grafia: `AgendaAI`
- leitura tipografica: uma palavra continua
- enfase visual: o peso da assinatura vem do simbolo; `AI` nao exige destaque cromatico fixo
- lockup primario: barras em ink + vetor ascendente em teal + wordmark `AgendaAI` em ink
- peso tipografico recomendado: assinatura em sans proprietaria, sem cair em leitura pesada ou agressiva

### Comportamento

- usar preferencialmente sobre fundo claro;
- usar versao monocromatica em contextos restritos;
- evitar condensar ou expandir horizontalmente.
- respeitar clear space equivalente a largura do pilar final do simbolo;
- abaixo de 156px, retirar subtitulo e considerar simbolo isolado.

### Arquivo de referencia

- `assets/brand/agendaai-wordmark.svg`
- `assets/brand/agendaai-wordmark-reverse.svg`
- `assets/brand/agendaai-wordmark-mono.svg`
- `apps/marketing-site/index.html`

## 8. Simbolo

Conceito:

- linhas de agenda;
- barras operacionais;
- vetor ascendente de crescimento;
- pilar final de decisao;
- forma simples o bastante para favicon e avatar.

Arquivo de referencia:

- `assets/brand/agendaai-symbol.svg`

## 9. Tipografia

### Primaria

- display editorial e capas: `Bodoni Moda`

### Secundaria

- interface e texto: `Manrope`

### Apoio tecnico

- numericos e codigo: `IBM Plex Mono`

- o wordmark nao deve ser refeito com a tipografia editorial;
- a serif editorial existe para capas, hero e aberturas de secao;
- `Manrope` segura navegacao, produto e titulos funcionais.

### Hierarquia oficial

- `display.l`: `Bodoni Moda 64/64, 500` para capa, hero e declaracao principal de marca
- `display.m`: `Bodoni Moda 44/48, 500` para abertura de modulo ou chamada principal de campanha
- `title.l`: `Manrope 28/36, 500` para titulo de pagina, secao critica e resumo operacional
- `title.m`: `Manrope 20/28, 500` para cards, drawers, tabelas detalhadas e blocos secundarios
- `body.l`: `Manrope 18/30, 400` para texto corrido, empty state e explicacao de fluxo
- `body.m`: `Manrope 15/24, 400` para filtros, linhas densas, labels e apoio de interface
- `caption`: `Manrope 12/18, 500` para metadado, data, status auxiliar e texto de sistema
- `mono.s`: `IBM Plex Mono 12/16, 500` para horario, ID, codigo, valor tecnico e leitura tabular curta

### Peso recomendado

- preferir `500` como teto para display e titulos funcionais
- preferir `400` no corpo de produto e texto corrido
- reservar `600` para CTAs e casos de enfase curta
- evitar `700` e `800` como peso padrao da marca
- contraste, serif editorial e espacamento devem construir presenca antes do bold

### Regra de prioridade visual

- primeiro nivel: tempo, disponibilidade, receita, CTA e titulo da acao
- segundo nivel: contexto, cliente, agrupamento, origem e status principal
- terceiro nivel: ajuda, metadado, observacao, log e detalhe tecnico
- limitar o viewport a no maximo tres niveis concorrentes de tipografia
- a serif editorial nao entra em corpo de texto nem em leitura de tabela

### Regra

Usar `Bodoni Moda` para presenca editorial calma em capas e aberturas. Usar `Manrope` para leitura de produto, navegacao e densidade operacional.

## 10. Cores

| Papel | Token | Valor |
| --- | --- | --- |
| Fundo principal | `canvas` | `#F3F8F7` |
| Fundo elevado | `surface` | `#FBFEFD` |
| Texto forte | `ink` | `#13252B` |
| Marca primaria | `teal` | `#0B7A75` |
| Marca secundaria | `ember` | `#D86A43` |
| Borda suave | `mist` | `#D9E7E3` |
| Sucesso | `success` | `#2E9F61` |
| Alerta | `warning` | `#DE9A25` |
| Erro | `danger` | `#D35B4A` |

## 11. Linguagem visual

- blocos claros e arejados;
- cards apenas quando agrupamento fizer sentido;
- grandes massas de texto devem respirar mais do que os containers;
- calendario, slots e tempos com alta legibilidade;
- chips de status e segmento;
- uso controlado de sombras;
- bordas suaves, linhas finas e estrutura firme.

## 12. Composicao e proporcao

- grid base de 8px;
- raio padrao entre 12px e 20px;
- espaco interno generoso;
- tipografia editorial para abertura e sans neutra para decisao;
- acento cromatico reservado para acao e sinal de negocio.

## 13. Aplicacoes

- landing por tenant;
- fluxo publico de booking;
- dashboard;
- calendarios;
- cards de relatorio;
- campanhas e mensagens.

## 14. Usos incorretos

- usar roxo como cor estrutural;
- aplicar gradientes chamativos no backoffice;
- misturar fontes sem controle;
- usar `AI` com destaque excessivo;
- reduzir contraste em estados de tempo e status.

## 15. Diretrizes para produto

- booking deve ser leve, com progresso visivel e resumo sempre acessivel; no mobile, preferir wizard guiado com resumo inline na etapa final;
- admin deve priorizar filtros, agenda e drawer de contexto;
- financeiro deve usar cor de acento com moderacao;
- CRM deve destacar frequencia, retorno e risco.
- o wordmark deve funcionar em superficies claras, barras escuras e cabecalhos compactos sem depender de uma moldura lateral fixa.

## 16. Diretrizes para comunicacao

- falar de retorno, organizacao e crescimento;
- evitar promessa abstrata de IA logo na entrada;
- aproximar a marca do negocio local;
- vender robustez sem jargao tecnico;
- manter a calma da pagina por hierarquia, nao por excesso de ornamento.

## 17. Diretrizes para evolucao

- qualquer nova cor precisa entrar primeiro como token;
- qualquer novo padrao visual precisa nascer no design system;
- qualquer derivacao do wordmark deve preservar ritmo e legibilidade.
- o lockup canonico nao depende de usar `ember`; essa cor fica reservada para apoio institucional e editorial.
- benchmark externo de tipografia e hierarquia so pode entrar por referencia homologada.

## 18. Insumos para Design System

- base clara + acento de negocio;
- display `Bodoni Moda`, interface `Manrope`;
- componentes com densidade controlada;
- estados visuais nitidos;
- simbolo e wordmark prontos para sistema.
