# Base de Referencias Controladas

## Objetivo

Homologar as fontes que sustentam a rodada atual sem abrir benchmark livre fora do controle documental do projeto.

## Regras de precedencia

1. Documentacao homologada em `docs/`
2. Insumos originais do usuario
3. Framework oficial MAE/MFEE local
4. Referencia externa citada pelo proprio briefing
5. Referencia externa homologada explicitamente na rodada atual

## Escopo autorizado de consulta nesta rodada

- posicionamento do produto;
- definicao de fluxo publico e administrativo;
- direcao de UX, identidade e design system;
- arquitetura macro e backlog fundacional.

## Fontes homologadas

| ID | Tipo | Nome | Link/Arquivo | Escopo de uso | Pode responder | Restricoes | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | anexo_usuario | Ideia original | `C:\projetos\agendaai\ideia` | conceito e dor | o que e o produto e o que resolve | nao tratar como documento final | ativo |
| F02 | anexo_usuario | Briefing original | `C:\projetos\agendaai\briefing-inicial` | posicionamento e escopo | pilares e diretriz tecnologica | precisa refinamento | ativo |
| F03 | doc_interna | Framework UI/UX Research | `C:\projetos\.codex\frame - mfee-mae\framework ux ui research` | metodo de pesquisa | estrutura de saida | nao define requisito sozinho | ativo |
| F04 | doc_interna | Framework Style Guide | `C:\projetos\.codex\frame - mfee-mae\framework style guide` | metodo de identidade | estrutura de saida | nao define requisito sozinho | ativo |
| F05 | doc_interna | Framework Design System | `C:\projetos\.codex\frame - mfee-mae\framework design system` | metodo de sistema de interface | estrutura de saida | nao define requisito sozinho | ativo |
| F06 | doc_interna | MAE | `C:\projetos\.codex\frame - mfee-mae\mae_metodo_de_arquitetura_estrutural.md` | briefing arquitetural | estrutura e obrigatorios | nao substitui evidencias futuras | ativo |
| F07 | doc_interna | MFEE | `C:\projetos\.codex\frame - mfee-mae\mfee_kit_consolidado.md` | inventario, raio-x e auditoria | estrutura e taxonomia | nao substituir codigo real futuro | ativo |
| F08 | produto_referencia | Simples Agenda, Fresha, Square, Mindbody, Vagaro | citados em `briefing-inicial` | leitura competitiva sintetica | sinais de categoria | nao revalidado nesta rodada | pendente de homologacao externa |
| F09 | referencia_externa_homologada | Resend Homepage | `https://resend.com/home` e `docs/12_legado/referencias_visuais/01_resend_home_2026-03-16.md` | tipografia, hierarquia e ritmo editorial | contraste de display, navegacao discreta, espacamento e chrome contido | nao copiar copy, semantica do produto ou paleta como regra universal | ativo |
| F10 | referencia_externa_homologada | TOTVS Smart View - Filtros e Parametros | `https://centraldeatendimento.totvs.com/hc/pt-br/articles/36728851068055-Cross-Segmentos-Backoffice-RM-BI-Como-utilizar-o-recurso-de-Filtro-no-Smart-View` e `https://centraldeatendimento.totvs.com/hc/pt-br/articles/33793189784727-Cross-Segmentos-Backoffice-RM-BI-Smart-View-Passagem-de-par%C3%A2metros-em-relat%C3%B3rios` | arquitetura interna do builder de expressoes, logica de filtros, parametros e comportamento de lookup | inspiracao de estrutura para filtros `E/OU`, parametros em tempo de execucao e janela de consulta | uso exclusivamente interno; nao citar TOTVS em material publico, copy do produto, ajuda ao usuario final ou comunicacao externa do `AgendaAI`; nao copiar naming, textos ou semantica comercial | ativo |

## Regra adicional desta rodada

Houve homologacao externa controlada apenas para direcao de tipografia e hierarquia visual. Benchmark externo continua proibido como fonte de requisito funcional.

Para o modulo de `Relatorios`, a referencia `F10` pode orientar a arquitetura interna do builder de expressoes e dos filtros, mas essa origem deve permanecer confidencial dentro da governanca do projeto.
