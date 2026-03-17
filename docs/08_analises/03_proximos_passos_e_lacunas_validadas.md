# Proximos Passos e Lacunas Validadas

## 1. Objetivo

Consolidar, com base no planejamento ja aprovado e no estado real do repositorio em 2026-03-17, quais sao os proximos passos executaveis de `agendaai` e quais lacunas estao confirmadas ou apenas sugeridas por evidencia parcial.

Este documento evita inferencia solta. Tudo o que aparece como lacuna confirmada possui prova documental e/ou prova observavel no filesystem local. Tudo o que aparece como possivel lacuna fica marcado como tal.

## 2. Regra de precedencia aplicada

1. documentos de planejamento e governanca;
2. auditoria e analises oficiais ja existentes;
3. estado real do repositorio local;
4. buscas por artefatos especificos, sempre tratadas como evidencia complementar.

## 3. Fontes consultadas

- `docs/10_backlog/00_backlog_estruturado_por_dependencia.md`
- `docs/09_sprints/00_plano_fundacional.md`
- `docs/11_auditoria/00_auditoria_de_fechamento.md`
- `docs/08_analises/00_inventario_real_do_projeto.md`
- `docs/08_analises/01_raio_x_de_aderencia.md`
- `docs/00_governanca/01_termo_de_prontidao_de_etapa.md`
- `docs/00_governanca/03_relatorio_de_risco_estrutural.md`
- `docs/02_fundacoes/00_fundacao_de_produto_e_stack.md`
- `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md`
- `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md`
- `docs/04_padroes_ui/02_design_system.md`
- `docs/07_integracoes/00_mapa_de_integracoes.md`
- verificacao local das pastas `apps/`, `services/`, `packages/` e `infra/`
- verificacao local da existencia de `.git`, `package.json`, `pnpm-workspace.yaml` e `tsconfig*.json`
- busca local por arquivos dedicados com nomes relacionados a `ADR`, `permissao`, `rbac`, `timezone`, `eventos` e equivalentes

## 4. Evidencia objetiva do estado atual

Snapshot local observado nesta rodada:

```text
git_dir=0
package_json=0
pnpm_workspace=0
tsconfig=0

C:\projetos\agendaai\apps\admin-web => 0 arquivos
C:\projetos\agendaai\apps\booking-web => 0 arquivos
C:\projetos\agendaai\services\api-rest => 0 arquivos
C:\projetos\agendaai\services\graphql-bff => 0 arquivos
C:\projetos\agendaai\services\analytics-python => 0 arquivos
C:\projetos\agendaai\services\workers => 0 arquivos
C:\projetos\agendaai\packages\ui => 0 arquivos
C:\projetos\agendaai\packages\contracts => 0 arquivos
C:\projetos\agendaai\packages\domain => 0 arquivos
C:\projetos\agendaai\packages\config => 0 arquivos
```

Leitura objetiva:

- o repositorio ainda nao foi inicializado em git;
- o monorepo ainda nao foi inicializado de forma funcional;
- a arvore estrutural existe, mas quase todos os modulos tecnicos ainda estao vazios;
- o unico frontend com arquivos reais hoje e `apps/marketing-site/`.

## 5. Proximos passos executaveis confirmados

| Ordem pratica | Item | Prova documental | Prova real | Decisao |
| --- | --- | --- | --- | --- |
| 1 | Iniciar `Sprint 0` e `B-01` | `docs/09_sprints/00_plano_fundacional.md` pede iniciar repositorio git e configurar workspace/monorepo. `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` define `B-01` como `Inicializar monorepo e manifests` e marca `NAO IMPLEMENTADO`. | `.git`, `package.json`, `pnpm-workspace.yaml` e `tsconfig*` nao existem. | Este e o proximo passo tecnico imediato. |
| 2 | Fechar `B-02` antes de codigo transacional | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` define `B-02` como `Definir ADR de auth, tenancy e slug`. `docs/00_governanca/03_relatorio_de_risco_estrutural.md` marca multi-tenancy mal resolvido como risco critico. | Nao foi encontrado arquivo dedicado de ADR no repositorio. | Auth, isolamento de tenant e slug precisam ser congelados antes de API e frontend autenticado. |
| 3 | Executar `B-03` apos `B-01` | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` define `B-03` como `Materializar tokens e base do design system`. `docs/04_padroes_ui/02_design_system.md` ja define a base conceitual. | `packages/ui` existe, mas esta vazio. | A base visual ja pode sair do papel assim que o workspace existir. |
| 4 | Executar `B-04` apos `B-02` | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` define `B-04` como `Criar package de contracts e schemas base`. `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` ja define entidades e invariantes. | `packages/contracts` existe, mas esta vazio. | Os contratos base devem nascer logo depois da decisao de auth, tenancy e slug. |
| 5 | So depois abrir `B-05` em diante | O backlog coloca `api-rest`, catalogo, booking e agenda depois das etapas fundacionais. A auditoria marca `API REST`, `booking publico` e `admin web` como `NAO IMPLEMENTADO`. | `services/api-rest`, `apps/booking-web` e `apps/admin-web` estao vazios. | Nao ha base segura para comecar features de negocio antes da fundacao. |

## 6. Lacunas confirmadas

| Lacuna confirmada | Prova concreta | Impacto pratico | Acao objetiva |
| --- | --- | --- | --- |
| Repositorio git nao iniciado | `docs/09_sprints/00_plano_fundacional.md` manda iniciar repositorio git. No filesystem, `.git` nao existe. | impede historico controlado, branching e rastreabilidade tecnica minima | iniciar git na `Sprint 0` |
| Monorepo funcional ainda inexistente | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` marca `B-01` como `NAO IMPLEMENTADO`. `docs/11_auditoria/00_auditoria_de_fechamento.md` classifica `esqueleto de monorepo` como `PARCIAL` e aponta ausencia de manifests, build e configs. No filesystem nao existem `package.json`, `pnpm-workspace.yaml` nem `tsconfig*`. | bloqueia instalacao, build, lint, testes e publicacao de packages | executar `B-01` |
| Apps e servicos core ainda nao existem em codigo | `docs/11_auditoria/00_auditoria_de_fechamento.md` marca `API REST`, `booking publico` e `admin web` como `NAO IMPLEMENTADO`. No filesystem, `apps/admin-web`, `apps/booking-web`, `services/api-rest`, `services/graphql-bff`, `services/analytics-python` e `services/workers` estao sem arquivos. | impossibilita qualquer entrega funcional do produto | nao abrir feature antes da fundacao |
| Packages core ainda nao existem em codigo | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` depende de `packages/ui` e `packages/contracts`. No filesystem, `packages/ui`, `packages/contracts`, `packages/domain` e `packages/config` estao sem arquivos. | impede compartilhamento de contratos, tokens, dominio e configuracoes | executar `B-03` e `B-04` apos `B-01` e `B-02` |
| ADR de auth, tenancy e slug ainda nao foi publicada | `docs/10_backlog/00_backlog_estruturado_por_dependencia.md` marca `B-02` como `NAO IMPLEMENTADO`. `docs/00_governanca/03_relatorio_de_risco_estrutural.md` trata multi-tenancy mal resolvido como risco critico. Nao foi encontrado arquivo dedicado de ADR. | alto risco de retrabalho e vazamento de dados entre tenants | publicar ADR antes de endpoints e auth real |
| Providers externos seguem indefinidos | `docs/07_integracoes/00_mapa_de_integracoes.md` marca provedor de pagamento e WhatsApp/SMS como `provider ainda pendente`. `docs/08_analises/00_inventario_real_do_projeto.md` registra que nao existe provider decidido para pagamento e mensagens. | bloqueia implementacao de sinal, notificacoes e parte das integracoes do MVP | fechar selecao minima de providers antes de `B-08`, `B-12` e `B-14` |
| Divergencia entre stack planejada e implementacao atual do `marketing-site` | `docs/02_fundacoes/00_fundacao_de_produto_e_stack.md` define `marketing-site: Astro para conteudo e performance`. No repositorio atual, `apps/marketing-site` esta em HTML/CSS/JS estatico e sem manifest. | cria divergencia entre documentacao e base tecnica futura | decidir se a doc sera atualizada ou se o site sera migrado para Astro na fundacao |

## 7. Possiveis lacunas que merecem validacao adicional

Estas lacunas nao foram marcadas como confirmadas porque existe evidencia de necessidade, mas nao existe prova suficiente de que o nivel atual de definicao seja obrigatoriamente insuficiente. Ainda assim, elas merecem validacao antes da codificacao core.

| Possivel lacuna | Evidencia concreta | Por que ainda nao e lacuna confirmada | Validacao recomendada |
| --- | --- | --- | --- |
| Padrao de eventos internos pode estar subespecificado | `docs/07_integracoes/00_mapa_de_integracoes.md` lista eventos internos recomendados como `booking.confirmed`. `docs/00_governanca/03_relatorio_de_risco_estrutural.md` cobra `padrao de emissao de eventos entre servicos`. Nao foi encontrado arquivo dedicado para contratos de evento, topicos, retry ou idempotencia. | a definicao atual pode ser suficiente para a fase fundacional e ser refinada junto da API | decidir no `B-02` ou abrir ADR/nota tecnica de eventos antes de `workers`, notificacoes e financeiro |
| Matriz de permissao pode estar subespecificada | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` define `AdminUser.role`. `docs/03_navegacao_e_shell/00_shells_e_rotas_core.md` diz que `funcoes de equipe podem ter permissao parcial`. Nao foi encontrado documento dedicado de RBAC/permissoes. | a regra pode ser resolvida dentro da ADR de auth sem precisar de documento separado | validar se `B-02` vai incluir a matriz minima de permissoes por rota e modulo |
| Regra de timezone e normalizacao de agenda pode estar subespecificada | `docs/02_fundacoes/01_entidades_centrais_e_contratos_base.md` inclui `timezone` em `Tenant`. O produto depende fortemente de disponibilidade, booking e calendario. Nao foi encontrado documento dedicado para armazenamento, exibicao e calculo de slots em fuso horario. | pode ser suficiente tratar isso dentro dos contratos e services sem um artefato proprio | validar antes de `B-06`, `B-07` e `B-09` como datas e horarios serao persistidos e exibidos |

## 8. Decisao operacional sugerida

No estado atual, `agendaai` esta pronto para sair da fase documental, mas ainda nao esta pronto para codar features de negocio.

Sequencia recomendada sem romper o planejamento:

1. executar `Sprint 0` com foco em git, workspace, manifests, lint e contracts de ambiente;
2. publicar a ADR de auth, tenancy e slug;
3. materializar `packages/ui` e `packages/contracts`;
4. revalidar a aderencia documental;
5. so entao abrir `api-rest`, `admin-web` e `booking-web`.

Leitura final desta rodada:

- o planejamento existente continua coerente;
- os proximos passos ja estavam corretamente definidos no backlog;
- a principal lacuna atual nao e falta de ideia, e sim falta de fundacao tecnica executavel;
- as possiveis lacunas restantes estao concentradas em regras transversais: eventos, permissao e timezone.
