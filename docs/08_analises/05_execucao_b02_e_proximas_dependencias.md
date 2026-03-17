# Execucao B-02 e Proximas Dependencias

## 1. Objetivo

Registrar a conclusao de `B-02`, provar que a decisao de auth, tenancy e slug foi publicada e refletida em `packages/contracts`, e apontar com clareza qual e a nova sequencia de trabalho aberta no projeto.

## 2. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `docs/01_conceito_e_briefing/05_briefing_arquitetural_estruturado_mae.md`
- `docs/05_jornadas/00_jornadas_core.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/00_governanca/03_relatorio_de_risco_estrutural.md`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/identity.ts`
- validacao local de `pnpm build`
- validacao local de `pnpm lint`

## 3. Evidencia concreta de conclusao do B-02

Artefatos publicados nesta rodada:

- `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md`
- `packages/contracts/src/identity.ts`
- `packages/contracts/src/index.ts`

Provas de aderencia ao criterio de pronto de `B-02`:

| Criterio do backlog | Evidencia local |
| --- | --- |
| `ADR aprovada` | `docs/02_fundacoes/02_adr_auth_tenancy_e_slug.md` |
| `refletida em contracts` | `packages/contracts/src/identity.ts` exporta papeis admin, claims de sessao, fontes de tenant context e regra de slug |
| `ADR publicada` | arquivo oficial dentro de `docs/02_fundacoes/` |

Validacoes executadas com sucesso:

```text
pnpm build
pnpm lint
```

## 4. O que ficou decidido de forma canonica

Decisoes agora congeladas:

- `tenantId` e a chave canonica de isolamento;
- a slug publica nao substitui identidade administrativa;
- rotas `/app` dependem de sessao admin;
- rotas `/:slug` dependem de resolucao server-side de `slug -> tenantId`;
- cliente externo nao escolhe `tenantId` como fonte de autorizacao;
- no MVP, cada `AdminUser` pertence a um unico tenant;
- papeis iniciais do MVP: `owner`, `manager`, `staff`;
- a slug do MVP e unica globalmente e segue regex canonica.

## 5. O que esta destravado apos B-02

`B-02` destrava diretamente:

- `B-04`, porque os contracts base agora ja sabem como tenant, sessao admin e slug precisam se comportar;
- `B-05`, porque a API agora ja tem uma decisao clara de onde o tenant context precisa vir;
- a definicao minima de RBAC do MVP, ainda que a matriz completa continue evolutiva.

## 6. O que ainda nao foi entregue

`B-02` nao substitui:

- schemas versionados completos;
- auth implementada;
- middleware real de tenant context;
- endpoints reais;
- componentes reais de UI;
- fluxo real de booking.

Ou seja: a decisao arquitetural foi fechada, mas a implementacao correspondente ainda nao existe.

## 7. Nova sequencia recomendada

Sequencia mais consistente com o backlog atual:

1. `B-03` materializar tokens e base do design system;
2. `B-04` criar schemas e contracts base de tenant, client, service e booking;
3. `B-05` implementar `api-rest` com tenancy real;
4. `B-06` e `B-07` abrir dominio core e booking publico.

## 8. Leitura final

O projeto nao esta mais travado por falta de decisao sobre auth, tenancy e slug.

O gargalo mudou:

- antes: faltava decisao estrutural;
- agora: faltam artefatos executaveis de interface e contratos.

Portanto, o proximo corte natural do projeto nao e mais uma ADR. E `B-03` e `B-04`.
