# Preparacao de Publicacao - Vercel / Render

## 1. Objetivo

Preparar a publicacao web do `AgendaAI` para:

- `booking-web`
- `admin-web`
- `api-rest`

sem usar Blueprint pago no Render e sem expor secrets de runtime de forma insegura.

## 2. Leitura objetiva do estado

- o repositorio ja possui `origin` publico em GitHub;
- nao ha `VERCEL_TOKEN`, `RENDER_API_KEY`, `FIREBASE_TOKEN` nem `GOOGLE_APPLICATION_CREDENTIALS` no ambiente local;
- nao existe MCP conectado de `Vercel` ou `Render` nesta sessao;
- o fallback anonimo de preview do skill de `Vercel` serve para frontend simples, mas nao e caminho seguro para publicar o backend com `DATABASE_URL` e outros segredos.

## 3. Ajuste aplicado no codigo

- `apps/admin-web/src/App.tsx`
  - o shell admin agora respeita `VITE_API_BASE_URL` como base default de API em deploy.

## 4. Matriz de deploy preparada

### `booking-web`

Provider preferido:

- `Vercel`

Env necessario:

- `NEXT_PUBLIC_API_BASE_URL`

Root directory sugerido:

- `apps/booking-web`

### `admin-web`

Provider preferido:

- `Vercel`

Env necessario:

- `VITE_API_BASE_URL`
- `VITE_BOOKING_BASE_URL`

Root directory sugerido:

- `apps/admin-web`

### `api-rest`

Provider preferido:

- `Vercel` ou `Render` em web service simples

Env necessario:

- `DATABASE_URL`

Observacao:

- `AGENDAAI_INSECURE_MP_TLS` e apenas workaround local para esta maquina e nao deve subir para ambiente hospedado.

Root directory sugerido:

- `services/api-rest`

## 5. Bloqueio real desta rodada

A publicacao nao foi iniciada nesta sessao porque falta autenticacao do provedor de deploy para criar projeto e injetar env vars com seguranca.

Sem isso, eu ate consigo empacotar preview anonimo para frontend, mas nao consigo subir o backend de forma responsavel.

## 6. Proximo passo operacional

Escolher um dos caminhos:

- `Vercel`: fornecer `VERCEL_TOKEN` ou autenticar o CLI;
- `Render`: fornecer `RENDER_API_KEY` para criar web service sem Blueprint;
- `Firebase`: fornecer autenticacao Google/Firebase se a decisao for realmente testar essa trilha.

Depois disso, a publicacao dos tres servicos vira execucao operacional.
