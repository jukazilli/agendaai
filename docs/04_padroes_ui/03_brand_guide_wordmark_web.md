# Brand Guide Wordmark Web

## 1. Objetivo

Criar uma superficie web local e consultavel para o wordmark de AgendaAI antes da fundacao tecnica do produto.

## 2. Fontes consultadas

- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/12_legado/referencias_visuais/01_resend_home_2026-03-16.md`
- `docs/04_padroes_ui/00_ui_ux_research.md`
- `docs/04_padroes_ui/01_style_guide.md`
- `apps/marketing-site/src/pages/index.astro`
- `apps/marketing-site/src/styles/guide.css`
- `assets/brand/agendaai-wordmark.svg`
- `assets/brand/agendaai-wordmark-reverse.svg`
- `assets/brand/agendaai-wordmark-mono.svg`

## 3. Regra de precedencia aplicada

1. documentacao oficial do `agendaai`
2. page web local criada nesta rodada
3. assets SVG do repositorio

## 4. O que virou oficial

- pagina local em `apps/marketing-site/src/pages/index.astro`
- estilo local em `apps/marketing-site/src/styles/guide.css`
- script de preview em `scripts/serve-brand-guide.ps1`
- assets em `assets/brand/`
- referencia externa homologada em `docs/12_legado/referencias_visuais/`

## 5. URL local de consulta

Depois de subir o servidor local:

`http://127.0.0.1:4173`

## 6. O que a pagina resolve

- materializa o lockup primario, o simbolo e a versao mono;
- explica a nova leitura de barras operacionais com vetor ascendente;
- incorpora a direcao editorial de tipografia e hierarquia homologada nesta rodada;
- explicita regras de respiro, tamanho minimo e aplicacoes;
- cria uma ancora visual para futuras superficies do produto;
- oferece uma referencia que Playwright e MCP podem abrir sem depender de terceiros;
- agora roda em `Astro`, alinhada com a stack documentada do projeto.
- substitui o corte anterior contaminado por outra linguagem visual do workspace.

## 7. Pendencia remanescente

Quando a fundacao tecnica comecar, o wordmark deve virar componente canonico reutilizavel no frontend real.
