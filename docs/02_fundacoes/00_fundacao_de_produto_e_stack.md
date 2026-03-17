# Fundacao de Produto e Stack

## 1. Estrutura de repositorio adotada

```text
/apps
  /admin-web
  /booking-web
  /marketing-site
/services
  /api-rest
  /graphql-bff
  /analytics-python
  /workers
/packages
  /ui
  /contracts
  /domain
  /config
/infra
  /database
  /docker
  /ci
  /observability
/docs
/assets
/scripts
```

## 2. Racional de stack

### Apps

- `admin-web`: React + Vite para fluxo autenticado, produtividade de dashboard e deploy simples
- `booking-web`: Next.js para paginas por slug, SEO local e renderizacao hibrida
- `marketing-site`: Astro para conteudo e performance

### Services

- `api-rest`: orquestra dominio transacional
- `graphql-bff`: expande consultas de leitura sem contaminar o dominio
- `analytics-python`: trabalha cohorts, score de retorno e modelos futuros
- `workers`: executa notificacoes, lembretes, sincronizacoes e tarefas de agenda

### Packages

- `ui`: tokens e componentes compartilhados
- `contracts`: tipos, schemas e contratos de API
- `domain`: modelos de dominio reutilizaveis
- `config`: lint, tsconfig, env contracts e padroes de tooling

## 3. Fundacoes obrigatorias antes de escalar

- autenticao e autorizacao multi-tenant;
- contrato de tenant e slug;
- relacao entre agenda, disponibilidade e booking;
- reconhecimento de receita por execucao;
- fila e idempotencia para notificacoes;
- observabilidade por tenant e por fluxo.

## 4. Decisoes de implementacao recomendadas

- usar schema validation compartilhada entre frontend e backend;
- evitar GraphQL no primeiro dia para operacoes simples;
- criar read models antes de popular dashboards densos;
- isolar providers externos por adaptadores;
- manter design tokens no `packages/ui`.

## 5. Status

- estrutura de pastas: criada
- stack: documentada
- configuracao real de ferramentas: materializada na fundacao inicial do workspace
