# Documento de Design System

## 1. Introducao

Este design system traduz a identidade de AgendaAI em infraestrutura de interface para produto e marketing.

## 2. Objetivo do sistema

Garantir consistencia entre experiencia publica, dashboard operacional e futuros modulos sem reinventar interface a cada tela.

## 3. Principios

- clareza antes de ornamentacao
- repeticao antes de improviso
- densidade com legibilidade
- acao antes de decoracao
- dados com hierarquia
- consistencia entre publico e admin

## 4. Foundations

- grid base: 8px
- espacamentos: 4, 8, 12, 16, 24, 32, 48, 64
- raios: 8, 12, 16, 20, 28
- elevacao: none, low, mid, high
- motion: 160ms, 240ms, 320ms
- breakpoints: 480, 768, 1024, 1280, 1536

## 5. Tokens

### Tokens primitivos

- cores base
- escala tipografica
- espacos
- raios
- sombras

### Tokens semanticos

- `color.bg.default`
- `color.bg.surface`
- `color.text.primary`
- `color.text.muted`
- `color.border.subtle`
- `color.brand.primary`
- `color.brand.secondary`
- `color.status.success`
- `color.status.warning`
- `color.status.danger`

## 6. Tipografia de produto

- `display.l`: Bodoni Moda 64/64, 500
- `display.m`: Bodoni Moda 44/48, 500
- `title.l`: Manrope 28/36, 500
- `title.m`: Manrope 20/28, 500
- `body.l`: Manrope 18/30, 400
- `body.m`: Manrope 15/24, 400
- `caption`: Manrope 12/18, 500
- `mono.s`: IBM Plex Mono 12/16, 500

Regra:

- `display` e usado em capas, hero e aberturas institucionais
- `title` e `body` continuam como base do produto e do admin
- serif editorial nao entra em leitura tabular, formulario ou agenda operacional

## 7. Cores de interface

- fundos: canvas, surface, muted-surface
- textos: ink, muted, inverse
- acoes: teal, ember
- status: success, warning, danger, info
- dados: escala neutra para calendario e densidade

## 8. Grid e layout

- layout publico: coluna unica com stepper guiado e resumo fixo ou inline conforme a densidade do viewport
- layout admin: sidebar + top actions + area de trabalho
- calendario: vista responsiva com foco em dia, semana e profissional
- listagens: filtros persistentes, tabela com colunas principais e drawer lateral

## 9. Elevacao, bordas e motion

- usar sombra baixa em superfices elevadas;
- usar borda suave para separar blocos densos;
- usar motion curto em drawers, toasts e troca de passos;
- evitar microanimacao ornamental.

## 10. Componentes base

- button
- icon button
- input
- masked input
- select
- combobox
- date picker
- time slot
- card
- badge
- tabs
- drawer
- modal
- toast
- table
- empty state

## 11. Componentes de dominio

- booking stepper
- professional picker
- service card
- availability slot matrix
- agenda timeline
- booking status badge
- client health card
- revenue summary card
- cash movement row
- campaign audience chip

## 12. Padroes compostos

- fluxo publico de booking
- dashboard do dia
- calendario semanal por profissional
- workspace de cliente
- tela de configuracao com secoes
- relatorio com cards, filtros e tabela

## 13. Templates

- pagina inicial do tenant
- jornada de agendamento
- dashboard geral
- modulo listagem + drawer
- modulo calendario
- pagina de relatorio

## 14. Estados e feedback

- loading: skeleton alinhado a estrutura final
- vazio: orientar acao e nao apenas informar ausencia
- erro: mensagem clara + tentativa de recuperacao
- sucesso: feedback curto e contextual
- status de booking: pendente, aguardando pagamento, confirmado, concluido, cancelado, faltou, reagendado

## 15. Acessibilidade

- contraste AA como minimo;
- foco visivel em todos os controles;
- teclado obrigatorio no admin;
- aria labels para icon-only buttons;
- slots e horarios com feedback textual alem de cor.

## 16. Convencoes de documentacao

- cada componente deve registrar objetivo, variacoes, estados e restricoes;
- componentes de dominio nao substituem contratos funcionais;
- novos padroes compostos devem apontar jornadas e modulos impactados.

## 17. Convencoes de implementacao

- tokens em `packages/ui`;
- contratos em `packages/contracts`;
- estilos compartilhados por variables/tokens, nao por copia de CSS;
- componentes publicos e admin devem herdar os mesmos fundamentos.

## 18. Governanca

- qualquer nova variacao precisa justificar caso de uso;
- qualquer quebra visual precisa revisar style guide;
- componentes base mudam com revisao central;
- componentes de dominio mudam com modulo e jornada relacionados.

## 19. Prioridades do MVP

1. tokens, tipografia e cores
2. componentes base
3. booking stepper e availability slot
4. dashboard, calendario e data table
5. cards de cliente e financeiro

## 20. Ponte para MAE

O design system confirma:

- tipos de tela existentes;
- densidade esperada de cada superficie;
- componentes criticos por modulo;
- fundacoes de navegacao e feedback.

## 21. Ponte para MFEE

O MFEE deve auditar:

- se cada modulo respeita os componentes base;
- se jornadas usam os estados e feedbacks previstos;
- se o design system permanece coerente apos a implementacao.
