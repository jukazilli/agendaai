# Documento Mestre de Aplicacao do Framework

## 1. Contexto

AgendaAI esta sendo estruturado como projeto greenfield com duas superfices principais:

- experiencia publica de agendamento por slug;
- painel administrativo para operacao, clientes, financeiro e retencao.

O projeto adota o Framework MAE + MFEE como esteira oficial de descoberta, estruturacao e fechamento.

## 2. Sequencia oficial desta rodada

1. Ideia
2. Briefing inicial
3. UI/UX Research
4. Style Guide com wordmark
5. Design System
6. MAE
7. MFEE
8. Revalidacao MAE/MFEE

## 3. Tipo de adocao

- modo: greenfield
- nivel: adocao ampliada
- foco: base documental, arquitetura, backlog e fundacao de implementacao

## 4. Regra de precedencia

1. Codigo real implementado no repositorio
2. Documentacao homologada dentro de `docs/`
3. Insumos brutos preservados em `docs/12_legado/`
4. Referencias controladas homologadas
5. Benchmark nao homologado

Durante a rodada puramente documental, a documentacao homologada foi a fonte oficial do projeto.

Atualizacao em `17/03/2026`:

- o repositorio ja possui codigo real implementado em `packages/` e `services/`;
- portanto, modulos ja materializados passam a obedecer a precedencia declarada acima, com codigo vencendo docs quando houver conflito;
- backlog, jornadas e governanca continuam mandando nos modulos ainda nao implementados.

## 5. Definition of Done estrutural

Um item so fecha quando existir aderencia comprovada entre:

- documentacao oficial;
- arquitetura e fronteiras do modulo;
- contratos e dados minimos;
- navegacao e shell;
- padroes de UI;
- jornada ponta a ponta;
- integracoes e reflexos;
- evidencia objetiva.

## 6. Politica de lacunas

- lacuna descoberta vira documento antes de virar implementacao;
- hipotese deve ser sinalizada como hipotese;
- decisao critica deve entrar em governanca ou no briefing arquitetural;
- benchmark nao pode criar requisito sozinho.

## 7. Politica de ciclo continuo

Este projeto considera MAE e MFEE como ciclo continuo de refinamento:

- toda grande mudanca de escopo reabre o MAE;
- toda mudanca estrutural relevante reabre o MFEE;
- cada nova rodada deve revalidar consistencia entre docs, arquitetura e estrutura real.

## 8. Resultado desta rodada

- conceito consolidado;
- identidade de produto definida;
- direcao de UX e UI definida;
- stack e estrutura de monorepo propostas;
- modulos, jornadas e integracoes mapeados;
- backlog fundacional priorizado;
- auditoria inicial registrada.
