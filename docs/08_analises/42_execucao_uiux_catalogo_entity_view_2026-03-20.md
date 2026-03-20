# Execucao UI/UX - Catalogo em Entity View - 2026-03-20

## 1. Objetivo

Refinar a rota `#catalogo` do `admin-web` para o padrao de `entity view`, preservando o fluxo real de cadastro e edicao de servicos sem misturar agenda, equipe ou operacao diaria.

## 2. Regra de precedencia usada

1. inventario oficial do shell administrativo;
2. leitura funcional ja existente no `admin-web`;
3. trilha historica do modulo de catalogo e dos patterns compartilhados.

## 3. Documentacao consultada

- `C:\projetos\agendaai\docs\03_navegacao_e_shell\01_admin_shell_e_inventario_de_telas.md`
- `C:\projetos\agendaai\docs\08_analises\09_execucao_b06_catalogo_e_disponibilidade.md`
- `C:\projetos\agendaai\docs\08_analises\38_validacao_contratos_api_ui_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\40_execucao_uiux_dashboard_document_view_2026-03-20.md`
- `C:\projetos\agendaai\docs\08_analises\41_execucao_uiux_configuracoes_entity_view_2026-03-20.md`

## 4. Codigo alterado

- `C:\projetos\agendaai\apps\admin-web\src\App.tsx`
- `C:\projetos\agendaai\apps\admin-web\src\styles.css`

## 5. Leitura encontrada antes da mudanca

O `Catalogo` ja estava funcional:

- listagem de servicos;
- criacao e edicao;
- exclusao;
- politica comercial e de cobranca.

O problema era de acabamento:

- a rota ainda parecia um editor legado com painel lateral simples;
- faltava uma leitura clara da identidade do servico selecionado;
- o escopo da rota e as lacunas do catalogo ainda ficavam pouco explicitos.

## 6. Refinamento aplicado

### 6.1 Composicao principal

A rota `#catalogo` passou a usar `EntityViewLayout`, com:

- `EntityIdentityCard` para nome, status, duracao, preco, cobranca e meios aceitos;
- `EntitySection` para lista + editor real de servicos;
- `EntitySection` adicional para leitura rapida do mix atual do catalogo.

### 6.2 Aside

O aside agora explicita:

- o que ja e funcional no runtime;
- o que continua fora do corte atual, como produtos, kits, combos, add-ons e workflow editorial de publicacao.

### 6.3 Contratos

Nao houve alteracao em:

- `packages/contracts`;
- `apps/admin-web/src/lib/admin-api.ts`;
- `services/api-rest`.

O corte ficou restrito a composicao visual e hierarquia da rota.

## 7. Validacao executada

- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web lint`
- `pnpm --dir C:\projetos\agendaai --filter @agendaai/admin-web build`

Resultado:

- `lint`: OK
- `build`: OK

## 8. Resultado

O `Catalogo` agora se alinha ao mesmo nivel de acabamento adotado nas outras rotas refinadas do admin:

- `Profissionais`;
- `Clientes`;
- `Dashboard`;
- `Configuracoes`.

O editor permaneceu funcional e o valor novo desta passada ficou na organizacao semantica da tela, nao em mudanca de regra de negocio.

## 9. Proximo corte recomendado

Depois desta sequencia, o proximo passo mais valioso deixa de ser apenas tela isolada e passa a ser:

- browser QA real do conjunto do admin;
- ajuste fino de densidade e responsividade nas rotas refinadas;
- eventual fechamento da rota `Relatorios`, caso ela precise entrar no mesmo nivel de acabamento visual do novo shell.
