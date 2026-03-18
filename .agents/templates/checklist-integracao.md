# Template - Checklist de Integracao

## Antes de integrar

1. o contrato do corte esta estavel;
2. cada squad respeitou seu `write set`;
3. frontend e backend falam o mesmo contrato;
4. docs refletem o que entrou;
5. as decisoes adiadas foram registradas.

## Antes de fechar

1. `pnpm lint` executado;
2. `pnpm build` executado;
3. `pnpm --filter @agendaai/api-rest test` executado;
4. smoke da jornada executado;
5. proximo ponto seguro registrado.
