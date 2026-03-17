# Mapa de Modulos

| Modulo | Papel | Entidades principais | Telas principais | Dependencias | Status |
| --- | --- | --- | --- | --- | --- |
| Identidade e Tenancy | cria e isola o negocio | Tenant, AdminUser | onboarding, configuracoes | auth, slug | DOCUMENTADO |
| Catalogo e Equipe | modela servicos e profissionais | Service, Catalog, Professional | servicos, profissionais | tenancy | DOCUMENTADO |
| Disponibilidade e Agenda | define horarios e conflitos | AvailabilityRule, Booking | agenda, calendario | catalogo, equipe | DOCUMENTADO |
| Booking Publico | reserva horario pelo cliente | Booking, Client | fluxo publico | disponibilidade, pagamento | DOCUMENTADO |
| Pagamentos e Sinal | garante reserva quando aplicavel | PaymentIntent | pagamento, detalhes do booking | provider externo | DOCUMENTADO |
| Operacao do Dia | acompanha e fecha atendimentos | Booking, CashEntry | dashboard, agenda do dia | booking, financeiro | DOCUMENTADO |
| Clientes e CRM | registra historico e leitura da base | Client, Booking | clientes, detalhe do cliente | booking | DOCUMENTADO |
| Financeiro Operacional | conecta agenda a caixa | CashEntry | caixa, movimentacoes | operacao, pagamento | DOCUMENTADO |
| Relatorios | apresenta dados de agenda e receita | read models | relatorios | graphql/read models | DOCUMENTADO |
| Campanhas e Retencao | ativa retorno basico | Campaign, NotificationEvent | campanhas, segmentos | CRM, notificacoes | DOCUMENTADO |
| Configuracoes e Customizacao | governa tenant e evolucoes | Tenant, feature flags | configuracoes | tenancy | DOCUMENTADO |

## Regras transversais

- todo modulo respeita tenant context;
- modulos de leitura nao violam fronteiras transacionais;
- jornadas devem apontar modulos tocados;
- customizacao nunca altera o core sem governanca.
