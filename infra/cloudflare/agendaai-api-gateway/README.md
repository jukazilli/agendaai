# AgendaAI API Gateway

Cloudflare Worker para expor `api.agendaai.com` como dominio estavel do backend com failover ativo-passivo:

- `Render` como origem primaria de escrita
- `Vercel` como runtime secundario em `READ_ONLY_MODE=true`
- fallback apenas para:
  - `GET`
  - `HEAD`
  - `POST /v1/admin/auth/sessions`

## Variaveis esperadas

- `PRIMARY_API_ORIGIN`
- `SECONDARY_API_ORIGIN`
- `PRIMARY_TIMEOUT_MS`
- `SECONDARY_TIMEOUT_MS`

## Headers de diagnostico

- `x-agendaai-origin`
- `x-agendaai-degraded`
- `x-agendaai-origin-detail`

## Observacao operacional

As rotas de escrita que nao estiverem explicitamente allowlisted retornam:

- `503`
- `error: degraded_mode_write_blocked`

quando o primario estiver indisponivel.
