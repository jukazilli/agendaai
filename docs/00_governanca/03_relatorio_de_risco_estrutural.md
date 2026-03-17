# Relatorio de Risco Estrutural

| Risco | Impacto | Probabilidade | Mitigacao | Estado |
| --- | --- | --- | --- | --- |
| Escopo inflar para virar suite completa cedo demais | Alto | Alta | Tratar CRM, financeiro avancado e automacao como camadas progressivas | ABERTO |
| Misturar API transacional com consultas analiticas pesadas | Alto | Media | Separar REST transacional de GraphQL/read models por fase | MITIGADO NO DESIGN |
| Customizacao por pacote de horas corroer o core | Alto | Alta | Criar politica clara de extensao e governanca de feature flags | ABERTO |
| Integracoes de mensagens e pagamentos atrasarem o MVP | Alto | Alta | Adotar adaptadores e fasear por provedor | ABERTO |
| Multi-tenancy mal resolvido gerar vazamento de dados | Critico | Media | Forcar contexto de tenant em auth, dados, cache e observabilidade. ADR de auth, tenancy e slug ja publicada; falta implementacao. | PARCIALMENTE MITIGADO |
| Financeiro sem regra de reconhecimento de receita | Alto | Media | Fixar regra: atendimento concluido confirma receita operacional | MITIGADO NO BRIEFING |
| Design system nao refletir densidade real do backoffice | Medio | Media | Validar templates densos antes de componentes cosmeticos | MITIGADO NO DS |
| IA ser empurrada cedo para o core | Medio | Media | Manter IA fora do MVP e tratar como camada futura de analytics | MITIGADO NO ESCOPO |

## Riscos que bloqueiam codigo

- definicao exata do provedor de pagamento/sinal;
- definicao exata do provedor de mensagens;
- padrao de emissao de eventos entre servicos.
