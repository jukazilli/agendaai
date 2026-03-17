# ADR Auth, Tenancy e Slug

## 1. Status

APROVADA

## 2. Objetivo

Congelar a decisao arquitetural de autenticacao, isolamento de tenant e uso da slug publica para destravar `B-02`, preparar `B-04` e reduzir o risco de vazamento entre tenants.

## 3. Fontes que sustentam esta ADR

- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/06_modulos/00_mapa_de_modulos.md`
- `docs/00_governanca/03_relatorio_de_risco_estrutural.md`

## 4. Contexto consolidado

As documentacoes oficiais ja prometem cinco coisas que precisam ser coerentes entre si:

1. `AgendaAI` e multi-tenant desde o MVP.
2. cada negocio cria sua conta, cria seu tenant e define sua slug publica.
3. a experiencia publica entra por `/:slug`.
4. o shell administrativo entra por `/app`.
5. todo modulo precisa respeitar `tenant context`.

Tambem ja existe um risco critico documentado:

- multi-tenancy mal resolvido pode gerar vazamento de dados.

Logo, a ADR precisa responder duas perguntas de forma objetiva:

1. de onde vem o contexto de tenant em cada tipo de fluxo;
2. o que a slug faz e o que ela nao faz.

## 5. Decisoes adotadas

### D-01. Tenant e identificado internamente por `tenantId`, nunca pela slug

- `tenantId` e a chave canonica de isolamento.
- a slug existe como identificador publico de entrada e descoberta.
- a slug nunca substitui `tenantId` em dados transacionais, auth, eventos, cache ou observabilidade.

Justificativa:

- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` ja define `Tenant` com `id` e `slug`;
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` tambem exige `tenantId` em todo dado transacional;
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` separa claramente o shell publico por slug do shell admin.

### D-02. Auth administrativa e separada da slug publica

- rotas `/app` e APIs administrativas exigem sessao autenticada de `AdminUser`;
- rotas `/:slug` e `/:slug/agendar/*` nao exigem auth administrativa;
- a slug publica nao pode conceder permissao administrativa nem carregar estado admin.

Justificativa:

- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` estabelece `identidade de usuario separada do slug publico`;
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` determina que cliente final nunca acessa `/app` e que a slug publica nao deve expor estado administrativo.

### D-03. No MVP, cada `AdminUser` pertence a exatamente um tenant

- a sessao administrativa carrega um unico `tenantId`;
- nao existira troca de tenant dentro da mesma sessao no MVP;
- operador interno multi-tenant fica fora do escopo desta ADR e do MVP.

Justificativa:

- `docs/05_jornadas/00_jornadas_core.md` descreve onboarding simples: criar conta -> criar tenant -> vincular admin;
- nao existe documento oficial prometendo usuario compartilhado entre multiplos tenants;
- a decisao simplifica isolamento, reduz risco e atende o MVP prometido.

### D-04. O contexto de tenant e resolvido no servidor e nunca confiado diretamente ao cliente externo

Fluxo administrativo:

- o cliente autentica como `AdminUser`;
- a sessao carrega `tenantId` e `role`;
- APIs administrativas resolvem o contexto de tenant a partir da sessao.

Fluxo publico:

- a entrada chega por `/:slug`;
- o servidor resolve `slug -> tenantId`;
- comandos publicos de booking operam a partir do `tenantId` resolvido no servidor.

Regra:

- `tenantId` enviado em body, query ou header por cliente externo nao e fonte canonica de autorizacao.

Justificativa:

- o risco principal documentado e vazamento por multi-tenancy mal resolvido;
- a documentacao ja exige contexto de tenant em todas as camadas.

### D-05. A sessao administrativa minima do MVP carrega `sub`, `tenantId` e `role`

- `sub`: identificador do `AdminUser`;
- `tenantId`: tenant ativo e unico da sessao;
- `role`: papel de autorizacao inicial.

Papeis aceitos no MVP:

- `owner`
- `manager`
- `staff`

Justificativa:

- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` ja define `AdminUser.role`;
- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md` cita a necessidade de estrategia de permissao entre dono, gerente e equipe;
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` diz que funcoes de equipe podem ter permissao parcial.

### D-06. A slug publica tem namespace global unico no MVP

Regras adotadas:

- uma tenant possui exatamente uma slug ativa;
- a slug precisa ser unica globalmente;
- o formato base da slug sera:
  - lowercase ASCII;
  - numeros permitidos;
  - hifen permitido entre caracteres;
  - sem espacos;
  - sem acentos;
  - tamanho entre 3 e 40 caracteres.

Formato de referencia:

`^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$`

Justificativa:

- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` ja exige que a slug seja unica;
- `docs/05_jornadas/00_jornadas_core.md` coloca validacao de slug unica no onboarding;
- o formato restrito reduz ambiguidade de URL, conflito de path e custo de suporte no MVP.

### D-07. Mudanca de slug nao tera historico nem redirect automatico no MVP

- a tenant pode alterar a slug em configuracoes futuramente;
- apenas uma slug ativa sera reconhecida;
- slug antiga nao tera redirecionamento garantido na primeira versao.

Justificativa:

- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` ja reserva `/app/configuracoes` para tenant, slug e branding;
- a documentacao nao promete historico de slug nem dominio customizado no MVP;
- manter uma unica slug ativa simplifica operacao, cache e indexacao enquanto o produto ainda esta na fundacao.

## 6. Regras transversais obrigatorias

- nenhum registro transacional existe sem `tenantId`;
- nenhum evento interno existe sem `tenantId`;
- nenhum cache key multi-tenant existe sem `tenantId`;
- logs, traces e metricas devem carregar `tenantId` quando houver contexto de negocio;
- rotas publicas usam slug para descoberta;
- rotas administrativas usam sessao para autorizacao;
- slug nunca e usada como substituta de `role` ou identidade admin.

## 7. Consequencias para implementacao

### Impacto em `api-rest`

- endpoints administrativos precisam resolver `tenantId` pela sessao;
- endpoints publicos precisam resolver `tenantId` pela slug antes de tocar dominio;
- o service transacional nao deve aceitar troca arbitraria de tenant por payload externo.

### Impacto em `booking-web`

- `/:slug` continua como entrada canonica da jornada publica;
- a app publica nao carrega estado administrativo;
- qualquer leitura ou mutacao publica primeiro resolve a tenant pela slug.

### Impacto em `admin-web`

- o shell admin continua em `/app`;
- tenant ativa vem da sessao, nao da URL;
- mudanca de tenant por selector fica fora do MVP.

### Impacto em `packages/contracts`

- contratos minimos precisam refletir:
  - papeis administrativos;
  - claims de sessao;
  - contexto de tenant;
  - regex e limites de slug.

### Impacto em `B-04`

`B-04` deve transformar esta ADR em schemas versionados para:

- tenant;
- admin user;
- slug;
- metadados de contexto multi-tenant;
- comandos publicos e administrativos que dependem desse contexto.

## 8. Fora de escopo desta ADR

- provedor exato de auth;
- UX final de login;
- MFA;
- suporte interno multi-tenant;
- dominios customizados;
- redirects historicos de slug;
- schemas completos de todos os agregados.

## 9. Resultado esperado apos esta ADR

Esta decisao destrava:

- `B-04` para contracts e schemas base;
- `B-05` para `api-rest` com tenancy real;
- a definicao inicial de RBAC do MVP;
- a separacao correta entre shell publico e shell administrativo.
