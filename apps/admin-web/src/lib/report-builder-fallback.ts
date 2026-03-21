import {
  contractVersion,
  type ReportBuilderCatalog,
  type ReportCatalogField,
  type ReportDefinition
} from "@agendaai/contracts";

const bookingStatusOptions = [
  { value: "pendente", label: "Pendente" },
  { value: "aguardando pagamento", label: "Aguardando pagamento" },
  { value: "confirmado", label: "Confirmado" },
  { value: "concluido", label: "Concluido" },
  { value: "cancelado", label: "Cancelado" },
  { value: "faltou", label: "No-show" }
] as const;

const serviceStatusOptions = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" }
] as const;

const professionalStatusOptions = [
  { value: "active", label: "Ativo" },
  { value: "inactive", label: "Inativo" }
] as const;

const collectionModeOptions = [
  { value: "none", label: "Reserva imediata" },
  { value: "optional", label: "Sinal opcional" },
  { value: "required", label: "Sinal obrigatorio" }
] as const;

const yesNoOptions = [
  { value: "Sim", label: "Sim" },
  { value: "Nao", label: "Nao" }
] as const;

const paymentStatusOptions = [
  { value: "draft", label: "Rascunho" },
  { value: "pending", label: "Pendente" },
  { value: "in_process", label: "Em processamento" },
  { value: "authorized", label: "Autorizado" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Rejeitado" },
  { value: "cancelled", label: "Cancelado" },
  { value: "expired", label: "Expirado" },
  { value: "charged_back", label: "Chargeback" },
  { value: "refunded", label: "Estornado" }
] as const;

const reportFieldCatalog: readonly ReportCatalogField[] = [
  { id: "recognized_revenue", label: "Receita reconhecida", type: "number", bases: ["bookings", "clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "approved_online_revenue", label: "Entrada online aprovada", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_value", label: "Valor do servico", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "duration_minutes", label: "Duracao", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "booking_id", label: "Atendimento", type: "text", bases: ["bookings"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "in"], aggregations: ["count", "count_distinct"] },
  { id: "client_id", label: "Cliente", type: "lookup", bases: ["bookings", "clients"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "client" },
  { id: "service_id", label: "Servico", type: "lookup", bases: ["bookings"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "service" },
  { id: "professional_id", label: "Profissional", type: "lookup", bases: ["bookings", "availability"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "professional" },
  { id: "status", label: "Status", type: "enum", bases: ["bookings"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], lookupKind: "status", options: [...bookingStatusOptions] },
  { id: "booking_date", label: "Data do atendimento", type: "date", bases: ["bookings", "availability"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "month", label: "Mes", type: "date", bases: ["bookings", "availability"], filterable: false, groupable: true, sortable: true, operators: ["equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "client_code", label: "Codigo do cliente", type: "text", bases: ["clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "client_name", label: "Nome do cliente", type: "text", bases: ["clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with"], aggregations: ["count"] },
  { id: "client_phone", label: "Telefone", type: "text", bases: ["clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with"], aggregations: ["count"] },
  { id: "completed_bookings", label: "Concluidos", type: "number", bases: ["clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "days_since_last_completed", label: "Dias sem retorno", type: "number", bases: ["clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["avg", "max", "min"] },
  { id: "average_recurrence_days", label: "Recorrencia media", type: "number", bases: ["clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["avg", "max", "min"] },
  { id: "service_lookup_id", label: "Servico", type: "lookup", bases: ["services"], filterable: true, groupable: false, sortable: false, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "service" },
  { id: "service_code", label: "Codigo do servico", type: "text", bases: ["services"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "service_name", label: "Descricao do servico", type: "text", bases: ["services"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "service_status", label: "Situacao do cadastro", type: "enum", bases: ["services"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], options: [...serviceStatusOptions] },
  { id: "service_price", label: "Preco base", type: "number", bases: ["services"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_duration", label: "Duracao base", type: "number", bases: ["services"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_collection_mode", label: "Forma de cobranca", type: "enum", bases: ["services"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], options: [...collectionModeOptions] },
  { id: "service_requires_signal", label: "Pede sinal", type: "enum", bases: ["services"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals"], aggregations: ["count"], options: [...yesNoOptions] },
  { id: "linked_professionals_count", label: "Profissionais vinculados", type: "number", bases: ["services"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_bookings_count", label: "Atendimentos do servico", type: "number", bases: ["services"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "professional_lookup_id", label: "Profissional", type: "lookup", bases: ["professionals"], filterable: true, groupable: false, sortable: false, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "professional" },
  { id: "professional_code", label: "Codigo do profissional", type: "text", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "professional_name", label: "Nome do profissional", type: "text", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "professional_status", label: "Situacao do cadastro", type: "enum", bases: ["professionals"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], options: [...professionalStatusOptions] },
  { id: "linked_services_count", label: "Servicos vinculados", type: "number", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "professional_bookings_count", label: "Atendimentos do profissional", type: "number", bases: ["professionals"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "weekly_capacity_minutes", label: "Capacidade semanal", type: "number", bases: ["professionals"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "capacity_minutes", label: "Capacidade", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "booked_minutes", label: "Horas ocupadas", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "free_minutes", label: "Horas livres", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "open_bookings", label: "Em aberto", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "payment_reference", label: "Codigo do pagamento", type: "text", bases: ["payments"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "payment_status", label: "Situacao do pagamento", type: "enum", bases: ["payments"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], options: [...paymentStatusOptions] },
  { id: "payment_amount", label: "Valor do pagamento", type: "number", bases: ["payments"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "payment_date", label: "Data da cobranca", type: "date", bases: ["payments"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "payment_month", label: "Mes da cobranca", type: "date", bases: ["payments"], filterable: false, groupable: true, sortable: true, operators: ["equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "payment_service_id", label: "Servico cobrado", type: "lookup", bases: ["payments"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "service" },
  { id: "payment_professional_id", label: "Profissional ligado", type: "lookup", bases: ["payments"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "professional" },
  { id: "payment_client_id", label: "Cliente ligado", type: "lookup", bases: ["payments"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "client" }
] as const;

const reportGroupByOptions = [
  { id: "client_id", label: "Cliente", bases: ["bookings"] },
  { id: "service_id", label: "Servico", bases: ["bookings"] },
  { id: "professional_id", label: "Profissional", bases: ["bookings", "availability"] },
  { id: "booking_date", label: "Dia", bases: ["bookings", "availability"] },
  { id: "month", label: "Mes", bases: ["bookings", "availability"] },
  { id: "status", label: "Status", bases: ["bookings"] },
  { id: "service_status", label: "Situacao do cadastro", bases: ["services"] },
  { id: "service_collection_mode", label: "Forma de cobranca", bases: ["services"] },
  { id: "professional_status", label: "Situacao do cadastro", bases: ["professionals"] },
  { id: "payment_status", label: "Situacao do pagamento", bases: ["payments"] },
  { id: "payment_client_id", label: "Cliente ligado", bases: ["payments"] },
  { id: "payment_service_id", label: "Servico cobrado", bases: ["payments"] },
  { id: "payment_professional_id", label: "Profissional ligado", bases: ["payments"] },
  { id: "payment_date", label: "Dia da cobranca", bases: ["payments"] },
  { id: "payment_month", label: "Mes da cobranca", bases: ["payments"] }
] as const;

const reportBaseOptions = [
  { id: "bookings", label: "Atendimentos", description: "Agenda, status, cliente, servico e faturamento derivado." },
  { id: "clients", label: "Clientes", description: "Base de relacionamento, retorno e recorrencia." },
  { id: "services", label: "Cadastro de servicos", description: "Catalogo comercial, precos, duracao e cobranca." },
  { id: "professionals", label: "Cadastro de profissionais", description: "Equipe, status, servicos vinculados e carga entregue." },
  { id: "availability", label: "Agenda e capacidade", description: "Disponibilidade publicada, ocupacao e horas livres." },
  { id: "payments", label: "Pagamentos", description: "Payment intents e cobranca ligada aos atendimentos." }
] as const;

const reportRelationOptions = [
  {
    id: "booking_clients",
    base: "bookings",
    targetBase: "clients",
    label: "Cliente do atendimento",
    description: "Anexa o cadastro do cliente a cada atendimento do recorte.",
    modes: ["inner", "left"]
  },
  {
    id: "booking_services",
    base: "bookings",
    targetBase: "services",
    label: "Servico do atendimento",
    description: "Anexa o servico comercial ligado a cada atendimento.",
    modes: ["inner", "left"]
  },
  {
    id: "booking_professionals",
    base: "bookings",
    targetBase: "professionals",
    label: "Profissional do atendimento",
    description: "Anexa a equipe responsavel por cada atendimento.",
    modes: ["inner", "left"]
  },
  {
    id: "service_professionals",
    base: "services",
    targetBase: "professionals",
    label: "Equipe que atende o servico",
    description: "Cruza o cadastro comercial com a equipe vinculada.",
    modes: ["inner", "left"]
  },
  {
    id: "professional_services",
    base: "professionals",
    targetBase: "services",
    label: "Servicos atendidos pela equipe",
    description: "Mostra os servicos que cada profissional pode atender.",
    modes: ["inner", "left"]
  },
  {
    id: "payment_booking",
    base: "payments",
    targetBase: "bookings",
    label: "Atendimento que originou o pagamento",
    description: "Relaciona cobranca, booking, cliente e agenda.",
    modes: ["inner", "left"]
  },
  {
    id: "availability_professionals",
    base: "availability",
    targetBase: "professionals",
    label: "Equipe da agenda",
    description: "Liga capacidade publicada e equipe ativa.",
    modes: ["inner", "left"]
  }
] as const;

const systemDefinitionsSeed = [
  { code: "RPT-EXECUTIVE", name: "Visao executiva", description: "Resumo do negocio no recorte ativo.", base: "bookings", visualization: "kpi_table", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: [] },
  { code: "RPT-REVENUE", name: "Receita e servicos", description: "Faturamento, ticket e mix de servicos.", base: "bookings", visualization: "bar", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["service_id"] },
  { code: "RPT-TEAM", name: "Equipe e produtividade", description: "Leitura por profissional e capacidade entregue.", base: "bookings", visualization: "bar", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["professional_id"] },
  { code: "RPT-OPERATIONS", name: "Pendencias operacionais", description: "Fila que ainda pede tratamento operacional.", base: "bookings", visualization: "pie", metric: { name: "bookings_abertas", operation: "count", field: "booking_id" }, groupBy: ["status"] },
  { code: "RPT-RETENTION", name: "Retorno e retencao", description: "Clientes com retorno, sem retorno e recorrencia.", base: "clients", visualization: "kpi_table", metric: { name: "clientes", operation: "count_distinct", field: "client_id" }, groupBy: [] },
  { code: "RPT-WEEK", name: "Radar semanal", description: "Capacidade, ocupacao e carga por dia e profissional.", base: "availability", visualization: "line", metric: { name: "capacidade", operation: "sum", field: "capacity_minutes" }, groupBy: ["booking_date"] },
  { code: "RPT-MONTH", name: "Visao mensal", description: "Carga agregada do mes por dia.", base: "availability", visualization: "line", metric: { name: "carga_mensal", operation: "sum", field: "booked_minutes" }, groupBy: ["booking_date"] },
  { code: "RPT-SERVICE-CATALOG", name: "Cadastro de servicos", description: "Lista comercial do catalogo com preco, duracao e forma de cobranca.", base: "services", visualization: "pie", metric: { name: "servicos", operation: "count", field: "service_code" }, groupBy: ["service_collection_mode"] },
  { code: "RPT-PROFESSIONAL-REGISTRY", name: "Cadastro de profissionais", description: "Equipe cadastrada, situacao e servicos vinculados.", base: "professionals", visualization: "pie", metric: { name: "profissionais", operation: "count", field: "professional_code" }, groupBy: ["professional_status"] },
  { code: "RPT-PAYMENTS", name: "Pagamentos e cobranca", description: "Cobrancas online e situacao de pagamento por atendimento.", base: "payments", visualization: "pie", metric: { name: "pagamentos", operation: "sum", field: "payment_amount" }, groupBy: ["payment_status"] }
] as const;

export function createFallbackReportBuilderCatalog(tenantId: string): ReportBuilderCatalog {
  return {
    version: contractVersion,
    baseOptions: reportBaseOptions.map((entry) => ({ ...entry })),
    fields: [...reportFieldCatalog],
    relationOptions: reportRelationOptions.map((entry) => ({ ...entry, modes: [...entry.modes] })),
    groupByOptions: reportGroupByOptions.map((entry) => ({ ...entry, bases: [...entry.bases] })),
    systemDefinitions: buildFallbackSystemReportDefinitions(tenantId)
  };
}

function buildFallbackSystemReportDefinitions(tenantId: string): ReportDefinition[] {
  const now = new Date().toISOString();
  return systemDefinitionsSeed.map((seed, index) => ({
    version: contractVersion,
    id: `fallback-system-${index + 1}`,
    tenantId,
    source: "system",
    code: seed.code,
    name: seed.name,
    description: seed.description,
    base: seed.base,
    visualization: seed.visualization,
    metric: { ...seed.metric },
    relation: null,
    filters: defaultSystemFilters(seed.code),
    groupBy: [...seed.groupBy],
    orderBy: [{ id: `${seed.code}-sort-1`, field: seed.metric.field, direction: "desc", priority: 1 }],
    authorName: "AgendaAI",
    createdAt: now,
    updatedAt: now,
    locked: true
  }));
}

function defaultSystemFilters(code: string): ReportDefinition["filters"] {
  if (code !== "RPT-OPERATIONS") {
    return [];
  }

  return [{
    id: `${code}-filter-open`,
    kind: "condition",
    connective: null,
    level: 0,
    field: "status",
    operator: "in",
    valueMode: "value",
    value: ["pendente", "aguardando pagamento", "confirmado"],
    parameterName: undefined
  }];
}
