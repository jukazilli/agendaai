# Execucao B-11 - Retorno de Clientes

## 1. Objetivo

Abrir a primeira fatia real de `B-11` sem prometer CRM avancado que o contrato atual ainda nao sustenta.

## 2. Regra de precedencia

- contratos reais de `client`, `booking` e `service`;
- backlog estrutural e beta ja abertos para `B-11` e `BA-11`;
- leitura honesta: retorno por janela simples entra; cohort, propensao e campanha automatica continuam fora.

## 3. O que foi implementado

Na rota `#clientes` do `admin-web`:

- filtros de segmento `Todos`, `Retorno`, `Sem retorno` e `Nunca concluiu`;
- janela configuravel de retorno herdada do shell (`30`, `60` e `90` dias);
- ultimo atendimento concluido por cliente;
- receita derivada por cliente a partir de bookings concluidas e `service.precoBase`;
- classificacao operacional simples:
  - `Retorno recente`
  - `Sem retorno <janela>`
  - `Nunca concluiu`

No `dashboard`:

- bloco dedicado de carteira com clientes sem retorno por janela;
- cards de resumo da carteira;
- explicacao explicita do que ainda continua `(nao funcional)`.

## 4. Como o retorno foi calculado

Sem read model novo no backend, o shell agora usa:

- ultima `booking` concluida por cliente;
- comparacao dessa data com a janela selecionada (`30`, `60` ou `90` dias);
- ausencia de booking concluida para classificar `Nunca concluiu`.

Isso entrega um recorte operacional valido, mas nao substitui cohort, expectativa de retorno ou score preditivo.

## 5. Evidencia validada

Validacao tecnica:

- `pnpm --filter @agendaai/admin-web lint`
- `pnpm --filter @agendaai/admin-web build`

Smoke funcional:

- `admin-web` local aberto em `http://127.0.0.1:4173/#dashboard` e `http://127.0.0.1:4173/#clientes`;
- dashboard exibindo carteira com:
  - `Com retorno recente = 3`
  - `Sem retorno = 0`
  - `Nunca concluiram = 4`
- tela de clientes exibindo filtros de segmento e cards com ultima conclusao e receita derivada;
- filtro `Nunca concluiu` aplicado com sucesso no shell.

## 6. Leitura objetiva do estado

`B-11` deixou de ser `NAO IMPLEMENTADO` e passou a `PARCIAL`.

O produto ja consegue:

- identificar clientes sem retorno por janela simples;
- separar clientes que nunca concluiram atendimento;
- cruzar cliente, ultima conclusao e receita derivada num recorte operacional real.

## 7. O que continua aberto

- cohort de retorno;
- score de risco/reativacao;
- detalhe denso de cliente;
- campanhas e WhatsApp;
- timeline completa de relacionamento;
- relatorio dedicado de CRM separado do dashboard.

## 8. Conclusao

O proximo gargalo logico sai de `B-11` e vai para `B-12`: transformar essas leituras em relatorios mais dedicados, com comparativos por periodo e melhor separacao entre dashboard executivo e leitura analitica.
