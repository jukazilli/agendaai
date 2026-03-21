import {
  contractVersion,
  type AvailabilityRule,
  type Booking,
  type CashEntry,
  type Client,
  type PaymentIntent,
  type Professional,
  type ReportBuilderCatalog,
  type ReportCatalogField,
  type ReportDefinition,
  type ReportDefinitionSummary,
  type ReportExecutionChip,
  type ReportExecutionKpi,
  type ReportExecutionResponse,
  type ReportExecutionTable,
  type ReportFilterConditionNode,
  type ReportFilterNode,
  type ReportMetricOperation,
  type ReportRelationMode,
  type Service
} from "@agendaai/contracts";

interface CreateReportBuilderCatalogInput {
  readonly tenantId: string;
}

interface ExecuteReportDefinitionInput {
  readonly definition: ReportDefinition;
  readonly clients: readonly Client[];
  readonly bookings: readonly Booking[];
  readonly services: readonly Service[];
  readonly professionals: readonly Professional[];
  readonly availabilityRules: readonly AvailabilityRule[];
  readonly paymentIntents: readonly PaymentIntent[];
  readonly cashEntries: readonly CashEntry[];
}

interface BookingAnalyticsRecord {
  readonly booking: Booking;
  readonly client?: Client;
  readonly service?: Service;
  readonly professional?: Professional;
  readonly paymentIntent?: PaymentIntent;
  readonly recognizedRevenue: number;
  readonly approvedOnlineRevenue: number;
  readonly durationMinutes: number;
  readonly bookingDate: string;
  readonly monthKey: string;
}

interface ClientAnalyticsRecord {
  readonly client: Client;
  readonly recognizedRevenue: number;
  readonly completedBookings: number;
  readonly lastCompletedAt?: string;
  readonly daysSinceLastCompleted?: number;
  readonly averageRecurrenceDays: number | null;
}

interface AvailabilityAnalyticsRecord {
  readonly date: string;
  readonly professionalId: string;
  readonly professionalName: string;
  readonly capacityMinutes: number;
  readonly bookedMinutes: number;
  readonly freeMinutes: number;
  readonly bookingsCount: number;
  readonly openBookings: number;
  readonly monthKey: string;
}

interface ServiceAnalyticsRecord {
  readonly service: Service;
  readonly linkedProfessionals: readonly Professional[];
  readonly bookingsCount: number;
  readonly completedCount: number;
  readonly recognizedRevenue: number;
}

interface ProfessionalAnalyticsRecord {
  readonly professional: Professional;
  readonly linkedServices: readonly Service[];
  readonly bookingsCount: number;
  readonly completedCount: number;
  readonly recognizedRevenue: number;
  readonly weeklyCapacityMinutes: number;
}

interface PaymentAnalyticsRecord {
  readonly paymentIntent: PaymentIntent;
  readonly booking?: Booking;
  readonly client?: Client;
  readonly service?: Service;
  readonly professional?: Professional;
  readonly bookingDate: string;
  readonly monthKey: string;
}

const reportBaseOptions = [
  { id: "bookings", label: "Atendimentos", description: "Agenda, status, cliente, servico e faturamento derivado." },
  { id: "clients", label: "Clientes", description: "Base de relacionamento, retorno e recorrencia." },
  { id: "services", label: "Cadastro de servicos", description: "Catalogo comercial, precos, duracao e cobranca." },
  { id: "professionals", label: "Cadastro de profissionais", description: "Equipe, status, servicos vinculados e carga entregue." },
  { id: "availability", label: "Agenda e capacidade", description: "Disponibilidade publicada, ocupacao e horas livres." },
  { id: "payments", label: "Pagamentos", description: "Payment intents e cobranca ligada aos atendimentos." }
] as const;

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

const reportRelationOptions = [
  {
    id: "booking_clients",
    base: "bookings",
    targetBase: "clients",
    label: "Cliente do atendimento",
    description: "Anexa o cadastro do cliente a cada atendimento do recorte.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "booking_services",
    base: "bookings",
    targetBase: "services",
    label: "Servico do atendimento",
    description: "Anexa o servico comercial ligado a cada atendimento.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "booking_professionals",
    base: "bookings",
    targetBase: "professionals",
    label: "Profissional do atendimento",
    description: "Anexa a equipe responsavel por cada atendimento.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "service_professionals",
    base: "services",
    targetBase: "professionals",
    label: "Equipe que atende o servico",
    description: "Cruza o cadastro comercial com a equipe vinculada.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "professional_services",
    base: "professionals",
    targetBase: "services",
    label: "Servicos atendidos pela equipe",
    description: "Mostra os servicos que cada profissional pode atender.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "payment_booking",
    base: "payments",
    targetBase: "bookings",
    label: "Atendimento que originou o pagamento",
    description: "Relaciona cobranca, booking, cliente e agenda.",
    modes: ["inner", "left", "right"]
  },
  {
    id: "availability_professionals",
    base: "availability",
    targetBase: "professionals",
    label: "Equipe da agenda",
    description: "Liga capacidade publicada e equipe ativa.",
    modes: ["inner", "left", "right"]
  }
] as const;

const reportFieldCatalog: readonly ReportCatalogField[] = [
  { id: "recognized_revenue", label: "Receita reconhecida", type: "number", bases: ["bookings", "clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "approved_online_revenue", label: "Entrada online aprovada", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_value", label: "Valor do servico", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "duration_minutes", label: "Duracao", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "booking_id", label: "Booking", type: "text", bases: ["bookings"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "in"], aggregations: ["count", "count_distinct"] },
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
  { id: "service_bookings_count", label: "Bookings do servico", type: "number", bases: ["services"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "professional_lookup_id", label: "Profissional", type: "lookup", bases: ["professionals"], filterable: true, groupable: false, sortable: false, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "professional" },
  { id: "professional_code", label: "Codigo do profissional", type: "text", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "professional_name", label: "Nome do profissional", type: "text", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "between"], aggregations: ["count"] },
  { id: "professional_status", label: "Situacao do cadastro", type: "enum", bases: ["professionals"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], options: [...professionalStatusOptions] },
  { id: "linked_services_count", label: "Servicos vinculados", type: "number", bases: ["professionals"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "professional_bookings_count", label: "Bookings do profissional", type: "number", bases: ["professionals"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
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

const systemDefinitionsSeed = [
  { code: "RPT-EXECUTIVE", name: "Visao executiva", description: "Resumo do negocio no recorte ativo.", base: "bookings", visualization: "kpi_table", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: [] },
  { code: "RPT-REVENUE", name: "Receita e servicos", description: "Faturamento, ticket e mix de servicos.", base: "bookings", visualization: "ranking", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["service_id"] },
  { code: "RPT-TEAM", name: "Equipe e produtividade", description: "Leitura por profissional e capacidade entregue.", base: "bookings", visualization: "ranking", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["professional_id"] },
  { code: "RPT-OPERATIONS", name: "Pendencias operacionais", description: "Fila que ainda pede tratamento operacional.", base: "bookings", visualization: "kpi_table", metric: { name: "bookings_abertas", operation: "count", field: "booking_id" }, groupBy: [] },
  { code: "RPT-RETENTION", name: "Retorno e retencao", description: "Clientes com retorno, sem retorno e recorrencia.", base: "clients", visualization: "kpi_table", metric: { name: "clientes", operation: "count_distinct", field: "client_id" }, groupBy: [] },
  { code: "RPT-WEEK", name: "Radar semanal", description: "Capacidade, ocupacao e carga por dia e profissional.", base: "availability", visualization: "time_series", metric: { name: "capacidade", operation: "sum", field: "capacity_minutes" }, groupBy: ["booking_date"] },
  { code: "RPT-MONTH", name: "Visao mensal", description: "Carga agregada do mes por dia.", base: "availability", visualization: "time_series", metric: { name: "carga_mensal", operation: "sum", field: "booked_minutes" }, groupBy: ["booking_date"] },
  { code: "RPT-SERVICE-CATALOG", name: "Cadastro de servicos", description: "Lista comercial do catalogo com preco, duracao e forma de cobranca.", base: "services", visualization: "kpi_table", metric: { name: "servicos", operation: "count", field: "service_code" }, groupBy: [] },
  { code: "RPT-PROFESSIONAL-REGISTRY", name: "Cadastro de profissionais", description: "Equipe cadastrada, situacao e servicos vinculados.", base: "professionals", visualization: "kpi_table", metric: { name: "profissionais", operation: "count", field: "professional_code" }, groupBy: [] },
  { code: "RPT-PAYMENTS", name: "Pagamentos e cobranca", description: "Cobrancas online e situacao de pagamento por atendimento.", base: "payments", visualization: "kpi_table", metric: { name: "pagamentos", operation: "sum", field: "payment_amount" }, groupBy: [] }
] as const;

export function createReportBuilderCatalog(input: CreateReportBuilderCatalogInput): ReportBuilderCatalog {
  return {
    version: contractVersion,
    baseOptions: reportBaseOptions.map((entry) => ({ ...entry })),
    fields: [...reportFieldCatalog],
    relationOptions: reportRelationOptions.map((entry) => ({
      ...entry,
      modes: [...entry.modes]
    })),
    groupByOptions: reportGroupByOptions.map((entry) => ({ ...entry, bases: [...entry.bases] })),
    systemDefinitions: buildSystemReportDefinitions(input.tenantId)
  };
}

export function buildSystemReportDefinitions(tenantId: string): ReportDefinition[] {
  const now = new Date().toISOString();
  return systemDefinitionsSeed.map((seed, index) => ({
    version: contractVersion,
    id: `system-${index + 1}`,
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

export function summarizeReportDefinitions(definitions: readonly ReportDefinition[]): ReportDefinitionSummary[] {
  return definitions.map((definition) => ({
    version: definition.version,
    id: definition.id,
    tenantId: definition.tenantId,
    source: definition.source,
    code: definition.code,
    name: definition.name,
    description: definition.description,
    base: definition.base,
    visualization: definition.visualization,
    authorName: definition.authorName,
    updatedAt: definition.updatedAt,
    locked: definition.locked
  }));
}

export function executeReportDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  if (input.definition.base === "services") {
    return executeServiceDefinition(input);
  }
  if (input.definition.base === "professionals") {
    return executeProfessionalDefinition(input);
  }
  if (input.definition.base === "payments") {
    return executePaymentDefinition(input);
  }
  if (input.definition.code === "RPT-RETENTION" || input.definition.base === "clients") {
    return executeClientDefinition(input);
  }
  if (input.definition.code === "RPT-WEEK") {
    return executeAvailabilityDefinition(input, "week");
  }
  if (input.definition.code === "RPT-MONTH" || input.definition.base === "availability") {
    return executeAvailabilityDefinition(input, "month");
  }
  return executeBookingDefinition(input);
}

function executeBookingDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  const records = applyBookingFilters(buildBookingRecords(input), input.definition.filters, input);
  const summary = summarizeBookingRecords(records);
  const relationTable = buildRelationTableIfNeeded(input, records);
  const grouped = input.definition.groupBy[0]
    ? groupBookingRecords(records, input.definition.groupBy[0], input)
    : [];

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("metric", input.definition.metric.name, formatMetricValue(aggregateBookingMetric(records, input.definition.metric.operation, input.definition.metric.field)), "Metrica principal executada."),
      kpi("recognized", "Receita reconhecida", formatCurrency(summary.recognizedRevenue), "Leitura financeira consolidada."),
      kpi("bookings", "Bookings", summary.bookingsCount, "Registros considerados no recorte."),
      kpi("clients", "Clientes unicos", summary.uniqueClients, "Base distinta atendida."),
      kpi("completed", "Concluidos", summary.completedCount, "Atendimentos finalizados."),
      kpi("open", "Em aberto", summary.openBookings, "Pendencias operacionais ainda vivas.")
    ],
    table: grouped.length > 0 ? buildGroupedBookingTable(grouped, input.definition.groupBy[0]) : relationTable ?? buildOperationalTable(records)
  });
}

function executeClientDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  const records = applyClientFilters(buildClientRecords(input), input.definition.filters);
  const returningCount = records.filter((record) => record.daysSinceLastCompleted !== undefined && record.daysSinceLastCompleted <= 30).length;
  const inactiveCount = records.filter((record) => record.daysSinceLastCompleted !== undefined && record.daysSinceLastCompleted > 30).length;
  const neverCompletedCount = records.filter((record) => record.lastCompletedAt === undefined).length;
  const recurrenceValues = records.map((record) => record.averageRecurrenceDays).filter(isFiniteNumber);

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("metric", input.definition.metric.name, formatMetricValue(aggregateClientMetric(records, input.definition.metric.operation, input.definition.metric.field)), "Metrica principal executada."),
      kpi("returning", "Com retorno", returningCount, "Clientes com retorno recente."),
      kpi("inactive", "Sem retorno", inactiveCount, "Clientes fora da janela curta."),
      kpi("never", "Nunca concluiu", neverCompletedCount, "Base sem atendimento concluido."),
      kpi("recurrence", "Recorrencia media", recurrenceValues.length > 0 ? `${Math.round(average(recurrenceValues) ?? 0)} dias` : "n/d", "Media dos clientes recorrentes.")
    ],
    table: {
      columns: [
        { id: "code", label: "Codigo" },
        { id: "name", label: "Nome" },
        { id: "phone", label: "Telefone" },
        { id: "days", label: "Dias sem retorno" },
        { id: "revenue", label: "Receita" }
      ],
      rows: records.map((record) => ({
        id: record.client.id,
        cells: [record.client.codigo, record.client.nome, record.client.telefone, record.daysSinceLastCompleted ?? "Nunca", formatCurrency(record.recognizedRevenue)]
      })),
      emptyMessage: "Nenhum cliente encontrado neste recorte."
    }
  });
}

function executeAvailabilityDefinition(
  input: ExecuteReportDefinitionInput,
  scope: "week" | "month"
): ReportExecutionResponse {
  const records = buildAvailabilityRecords(input, scope);
  const summary = summarizeAvailabilityRecords(records);
  const relationTable = buildRelationTableIfNeeded(input, records);
  const table = relationTable ?? (scope === "week" ? buildWeeklyCapacityTable(records) : buildMonthlyCapacityTable(records));

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("capacity", "Capacidade total", formatMinutesAsHours(summary.capacityMinutes), "Disponibilidade derivada da agenda publicada."),
      kpi("booked", "Horas ocupadas", formatMinutesAsHours(summary.bookedMinutes), "Carga reservada no recorte."),
      kpi("free", "Horas livres", formatMinutesAsHours(summary.freeMinutes), "Capacidade ainda aberta."),
      kpi("bookings", "Bookings", summary.bookingsCount, "Total de bookings no recorte."),
      kpi("open", "Em aberto", summary.openBookings, "Pendencias ainda abertas.")
    ],
    table
  });
}

function executeServiceDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  const records = applyServiceFilters(buildServiceRecords(input), input.definition.filters);
  const activeCount = records.filter((record) => record.service.status === "active").length;
  const signalCount = records.filter((record) => record.service.exigeSinal).length;
  const averagePrice = average(records.map((record) => record.service.precoBase)) ?? 0;
  const grouped = input.definition.groupBy[0]
    ? groupServiceRecords(records, input.definition.groupBy[0], input.definition.metric)
    : [];
  const relationTable = buildRelationTableIfNeeded(input, records);

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("metric", input.definition.metric.name, formatMetricValue(aggregateServiceMetric(records, input.definition.metric.operation, input.definition.metric.field)), "Leitura principal do cadastro de servicos."),
      kpi("total", "Servicos cadastrados", records.length, "Itens que entraram no recorte atual."),
      kpi("active", "Servicos ativos", activeCount, "Servicos prontos para publicar e vender."),
      kpi("signal", "Com sinal", signalCount, "Servicos que exigem cobranca antecipada."),
      kpi("average_price", "Preco medio", formatCurrency(averagePrice), "Preco medio do catalogo filtrado.")
    ],
    table: grouped.length > 0 ? buildGroupedServiceTable(grouped, input.definition.groupBy[0]) : relationTable ?? buildServiceTable(records)
  });
}

function executeProfessionalDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  const records = applyProfessionalFilters(buildProfessionalRecords(input), input.definition.filters);
  const activeCount = records.filter((record) => record.professional.status === "active").length;
  const totalLinkedServices = records.reduce((total, record) => total + record.linkedServices.length, 0);
  const totalCapacity = records.reduce((total, record) => total + record.weeklyCapacityMinutes, 0);
  const grouped = input.definition.groupBy[0]
    ? groupProfessionalRecords(records, input.definition.groupBy[0], input.definition.metric)
    : [];
  const relationTable = buildRelationTableIfNeeded(input, records);

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("metric", input.definition.metric.name, formatMetricValue(aggregateProfessionalMetric(records, input.definition.metric.operation, input.definition.metric.field)), "Leitura principal do cadastro de profissionais."),
      kpi("total", "Profissionais cadastrados", records.length, "Equipe no recorte atual."),
      kpi("active", "Profissionais ativos", activeCount, "Profissionais disponiveis para agenda e booking."),
      kpi("services", "Servicos vinculados", totalLinkedServices, "Vinculos comerciais e operacionais ativos."),
      kpi("capacity", "Capacidade semanal", formatMinutesAsHours(totalCapacity), "Soma da disponibilidade semanal publicada.")
    ],
    table: grouped.length > 0 ? buildGroupedProfessionalTable(grouped, input.definition.groupBy[0]) : relationTable ?? buildProfessionalTable(records)
  });
}

function executePaymentDefinition(input: ExecuteReportDefinitionInput): ReportExecutionResponse {
  const records = applyPaymentFilters(buildPaymentRecords(input), input.definition.filters);
  const approvedCount = records.filter((record) => isApprovedPaymentIntent(record.paymentIntent.status)).length;
  const pendingCount = records.filter((record) => ["draft", "pending", "in_process", "authorized"].includes(record.paymentIntent.status)).length;
  const rejectedCount = records.filter((record) => ["rejected", "cancelled", "expired", "charged_back", "refunded"].includes(record.paymentIntent.status)).length;
  const grouped = input.definition.groupBy[0]
    ? groupPaymentRecords(records, input.definition.groupBy[0], input.definition.metric)
    : [];
  const relationTable = buildRelationTableIfNeeded(input, records);

  return buildExecutionResponse(input.definition, {
    chips: describeAppliedFilters(input.definition.filters),
    kpis: [
      kpi("metric", input.definition.metric.name, formatMetricValue(aggregatePaymentMetric(records, input.definition.metric.operation, input.definition.metric.field)), "Leitura principal da cobranca ligada aos atendimentos."),
      kpi("total", "Pagamentos encontrados", records.length, "Payment intents presentes no recorte."),
      kpi("approved", "Aprovados", approvedCount, "Pagamentos aprovados ou autorizados."),
      kpi("pending", "Pendentes", pendingCount, "Cobrancas ainda sem conciliacao final."),
      kpi("rejected", "Nao aprovados", rejectedCount, "Pagamentos rejeitados, cancelados ou expirados.")
    ],
    table: grouped.length > 0 ? buildGroupedPaymentTable(grouped, input.definition.groupBy[0]) : relationTable ?? buildPaymentTable(records)
  });
}

function buildExecutionResponse(
  definition: ReportDefinition,
  payload: {
    readonly chips: ReportExecutionChip[];
    readonly kpis: ReportExecutionKpi[];
    readonly table?: ReportExecutionTable;
  }
): ReportExecutionResponse {
  return {
    version: contractVersion,
    definition,
    previewExpression: buildPreviewExpression(definition),
    appliedFilters: payload.chips,
    kpis: payload.kpis,
    table: payload.table,
    generatedAt: new Date().toISOString()
  };
}

function buildRelationTableIfNeeded(
  input: ExecuteReportDefinitionInput,
  records:
    | readonly BookingAnalyticsRecord[]
    | readonly ServiceAnalyticsRecord[]
    | readonly ProfessionalAnalyticsRecord[]
    | readonly PaymentAnalyticsRecord[]
    | readonly AvailabilityAnalyticsRecord[]
): ReportExecutionTable | undefined {
  const relation = input.definition.relation;
  if (!relation) {
    return undefined;
  }

  if (input.definition.base === "bookings" && relation.relationId === "booking_clients") {
    return buildBookingClientsRelationTable(
      records as readonly BookingAnalyticsRecord[],
      input.clients,
      relation.mode
    );
  }

  if (input.definition.base === "bookings" && relation.relationId === "booking_services") {
    return buildBookingServicesRelationTable(
      records as readonly BookingAnalyticsRecord[],
      input.services,
      relation.mode
    );
  }

  if (input.definition.base === "bookings" && relation.relationId === "booking_professionals") {
    return buildBookingProfessionalsRelationTable(
      records as readonly BookingAnalyticsRecord[],
      input.professionals,
      relation.mode
    );
  }

  if (input.definition.base === "services" && relation.relationId === "service_professionals") {
    return buildServiceProfessionalsRelationTable(
      records as readonly ServiceAnalyticsRecord[],
      input.professionals,
      relation.mode
    );
  }

  if (input.definition.base === "professionals" && relation.relationId === "professional_services") {
    return buildProfessionalServicesRelationTable(
      records as readonly ProfessionalAnalyticsRecord[],
      input.services,
      relation.mode
    );
  }

  if (input.definition.base === "payments" && relation.relationId === "payment_booking") {
    return buildPaymentBookingsRelationTable(
      records as readonly PaymentAnalyticsRecord[],
      input.bookings,
      input.clients,
      input.services,
      input.professionals,
      relation.mode
    );
  }

  if (input.definition.base === "availability" && relation.relationId === "availability_professionals") {
    return buildAvailabilityProfessionalsRelationTable(
      records as readonly AvailabilityAnalyticsRecord[],
      input.professionals,
      relation.mode
    );
  }

  return undefined;
}

function buildBookingClientsRelationTable(
  records: readonly BookingAnalyticsRecord[],
  clients: readonly Client[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedClientIds = new Set<string>();

  for (const record of records) {
    if (record.client) {
      linkedClientIds.add(record.client.id);
    }

    if (!record.client && mode === "inner") {
      continue;
    }

    rows.push({
      id: `${record.booking.id}:${record.client?.id ?? "none"}`,
      cells: [
        record.booking.id.slice(0, 8).toUpperCase(),
        formatAgendaDayLabel(record.bookingDate),
        record.client?.codigo ?? "-",
        record.client?.nome ?? "Sem cliente",
        record.client?.telefone ?? "-",
        record.client ? "Vinculado" : "Atendimento sem cliente"
      ]
    });
  }

  if (mode === "right") {
    for (const client of clients) {
      if (linkedClientIds.has(client.id)) {
        continue;
      }

      rows.push({
        id: `client-only:${client.id}`,
        cells: ["-", "-", client.codigo, client.nome, client.telefone, "Cliente sem atendimento no recorte"]
      });
    }
  }

  return {
    columns: [
      { id: "booking", label: "Booking" },
      { id: "date", label: "Data" },
      { id: "client_code", label: "Cod. cliente" },
      { id: "client_name", label: "Nome do cliente" },
      { id: "client_phone", label: "Telefone" },
      { id: "relation", label: "Situacao do vinculo" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre atendimentos e clientes foi encontrado."
  };
}

function buildBookingServicesRelationTable(
  records: readonly BookingAnalyticsRecord[],
  services: readonly Service[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedServiceIds = new Set<string>();

  for (const record of records) {
    if (record.service) {
      linkedServiceIds.add(record.service.id);
    }

    if (!record.service && mode === "inner") {
      continue;
    }

    rows.push({
      id: `${record.booking.id}:${record.service?.id ?? "none"}`,
      cells: [
        record.booking.id.slice(0, 8).toUpperCase(),
        formatAgendaDayLabel(record.bookingDate),
        record.service?.codigo ?? "-",
        record.service?.nome ?? "Sem servico",
        record.service ? formatCurrency(record.service.precoBase) : formatCurrency(0),
        record.service ? "Vinculado" : "Atendimento sem servico"
      ]
    });
  }

  if (mode === "right") {
    for (const service of services) {
      if (linkedServiceIds.has(service.id)) {
        continue;
      }

      rows.push({
        id: `service-only:${service.id}`,
        cells: ["-", "-", service.codigo, service.nome, formatCurrency(service.precoBase), "Servico sem atendimento no recorte"]
      });
    }
  }

  return {
    columns: [
      { id: "booking", label: "Booking" },
      { id: "date", label: "Data" },
      { id: "service_code", label: "Cod. servico" },
      { id: "service_name", label: "Descricao do servico" },
      { id: "service_price", label: "Preco base" },
      { id: "relation", label: "Situacao do vinculo" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre atendimentos e servicos foi encontrado."
  };
}

function buildBookingProfessionalsRelationTable(
  records: readonly BookingAnalyticsRecord[],
  professionals: readonly Professional[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedProfessionalIds = new Set<string>();

  for (const record of records) {
    if (record.professional) {
      linkedProfessionalIds.add(record.professional.id);
    }

    if (!record.professional && mode === "inner") {
      continue;
    }

    rows.push({
      id: `${record.booking.id}:${record.professional?.id ?? "none"}`,
      cells: [
        record.booking.id.slice(0, 8).toUpperCase(),
        formatAgendaDayLabel(record.bookingDate),
        record.professional?.codigo ?? "-",
        record.professional?.nome ?? "Sem profissional",
        record.booking.status,
        record.professional ? "Vinculado" : "Atendimento sem profissional"
      ]
    });
  }

  if (mode === "right") {
    for (const professional of professionals) {
      if (linkedProfessionalIds.has(professional.id)) {
        continue;
      }

      rows.push({
        id: `professional-only:${professional.id}`,
        cells: ["-", "-", professional.codigo, professional.nome, "-", "Profissional sem atendimento no recorte"]
      });
    }
  }

  return {
    columns: [
      { id: "booking", label: "Booking" },
      { id: "date", label: "Data" },
      { id: "professional_code", label: "Cod. profissional" },
      { id: "professional_name", label: "Nome do profissional" },
      { id: "status", label: "Status do atendimento" },
      { id: "relation", label: "Situacao do vinculo" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre atendimentos e profissionais foi encontrado."
  };
}

function buildBookingRecords(input: ExecuteReportDefinitionInput): BookingAnalyticsRecord[] {
  return input.bookings.map((booking) => {
    const service = input.services.find((entry) => entry.id === booking.serviceId);
    const professional = input.professionals.find((entry) => entry.id === booking.professionalId);
    const client = input.clients.find((entry) => entry.id === booking.clientId);
    const paymentIntent = input.paymentIntents.find((entry) => entry.bookingId === booking.id);

    return {
      booking,
      client,
      service,
      professional,
      paymentIntent,
      recognizedRevenue: resolveRecognizedRevenueAmount(booking, input.services, input.cashEntries),
      approvedOnlineRevenue: resolveApprovedOnlineAmount(booking, paymentIntent, input.cashEntries),
      durationMinutes: calculateBookingDurationMinutes(booking),
      bookingDate: extractDatePart(booking.startAt),
      monthKey: extractDatePart(booking.startAt).slice(0, 7)
    };
  });
}

function buildClientRecords(input: ExecuteReportDefinitionInput): ClientAnalyticsRecord[] {
  return input.clients.map((client) => {
    const completedBookings = input.bookings
      .filter((booking) => booking.clientId === client.id && booking.status === "concluido")
      .sort((left, right) => left.endAt.localeCompare(right.endAt));
    const lastCompleted = completedBookings.at(-1);
    return {
      client,
      recognizedRevenue: completedBookings.reduce((total, booking) => total + resolveRecognizedRevenueAmount(booking, input.services, input.cashEntries), 0),
      completedBookings: completedBookings.length,
      lastCompletedAt: lastCompleted?.endAt,
      daysSinceLastCompleted: lastCompleted ? calculateDaysSinceIso(lastCompleted.endAt) : undefined,
      averageRecurrenceDays: calculateAverageRecurrenceDays(completedBookings)
    };
  });
}

function buildServiceRecords(input: ExecuteReportDefinitionInput): ServiceAnalyticsRecord[] {
  return input.services.map((service) => {
    const linkedProfessionals = input.professionals.filter((professional) =>
      professional.especialidades.includes(service.id)
    );
    const relatedBookings = input.bookings.filter((booking) => booking.serviceId === service.id);
    const completedBookings = relatedBookings.filter((booking) => booking.status === "concluido");
    return {
      service,
      linkedProfessionals,
      bookingsCount: relatedBookings.length,
      completedCount: completedBookings.length,
      recognizedRevenue: completedBookings.reduce(
        (total, booking) => total + resolveRecognizedRevenueAmount(booking, input.services, input.cashEntries),
        0
      )
    };
  });
}

function buildProfessionalRecords(input: ExecuteReportDefinitionInput): ProfessionalAnalyticsRecord[] {
  return input.professionals.map((professional) => {
    const linkedServices = input.services.filter((service) => professional.especialidades.includes(service.id));
    const relatedBookings = input.bookings.filter((booking) => booking.professionalId === professional.id);
    const completedBookings = relatedBookings.filter((booking) => booking.status === "concluido");
    const weeklyCapacityMinutes = input.availabilityRules
      .filter((rule) => rule.professionalId === professional.id)
      .reduce((total, rule) => total + calculateRuleDurationMinutes(rule), 0);

    return {
      professional,
      linkedServices,
      bookingsCount: relatedBookings.length,
      completedCount: completedBookings.length,
      recognizedRevenue: completedBookings.reduce(
        (total, booking) => total + resolveRecognizedRevenueAmount(booking, input.services, input.cashEntries),
        0
      ),
      weeklyCapacityMinutes
    };
  });
}

function buildPaymentRecords(input: ExecuteReportDefinitionInput): PaymentAnalyticsRecord[] {
  return input.paymentIntents.map((paymentIntent) => {
    const booking = input.bookings.find((entry) => entry.id === paymentIntent.bookingId);
    const client = booking ? input.clients.find((entry) => entry.id === booking.clientId) : undefined;
    const service = booking ? input.services.find((entry) => entry.id === booking.serviceId) : undefined;
    const professional = booking ? input.professionals.find((entry) => entry.id === booking.professionalId) : undefined;
    const paymentCashEntry = input.cashEntries.find(
      (entry) =>
        entry.paymentIntentId === paymentIntent.id &&
        entry.kind === "online_payment" &&
        entry.status === "open"
    );
    const referenceDate = paymentCashEntry?.occurredAt ?? booking?.startAt ?? new Date().toISOString();

    return {
      paymentIntent,
      booking,
      client,
      service,
      professional,
      bookingDate: extractDatePart(referenceDate),
      monthKey: extractDatePart(referenceDate).slice(0, 7)
    };
  });
}

function buildAvailabilityRecords(
  input: ExecuteReportDefinitionInput,
  scope: "week" | "month"
): AvailabilityAnalyticsRecord[] {
  const dates = scope === "week" ? buildWeekDates(new Date()) : buildMonthDates(new Date());
  const activeProfessionals = input.professionals.filter((professional) => professional.status === "active");
  const filteredDates = filterDatesByDefinition(dates, input.definition.filters);

  return activeProfessionals.flatMap((professional) =>
    filteredDates.map((date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      const rule = input.availabilityRules.find(
        (entry) => entry.professionalId === professional.id && entry.weekday === weekday
      );
      const dayBookings = input.bookings.filter(
        (booking) =>
          booking.professionalId === professional.id &&
          extractDatePart(booking.startAt) === date &&
          booking.status !== "cancelado"
      );
      const capacityMinutes = calculateRuleDurationMinutes(rule);
      const bookedMinutes = dayBookings.reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0);

      return {
        date,
        professionalId: professional.id,
        professionalName: professional.nome,
        capacityMinutes,
        bookedMinutes,
        freeMinutes: Math.max(capacityMinutes - bookedMinutes, 0),
        bookingsCount: dayBookings.length,
        openBookings: dayBookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
        monthKey: date.slice(0, 7)
      };
    })
  ).filter((record) => evaluateAvailabilityFilters(record, input.definition.filters));
}

function applyBookingFilters(records: readonly BookingAnalyticsRecord[], filters: readonly ReportFilterNode[], input: ExecuteReportDefinitionInput): BookingAnalyticsRecord[] {
  if (filters.length === 0) {
    return [...records];
  }
  return records.filter((record) => evaluateFilterTree(filters, (fieldId) => resolveBookingFieldValue(record, fieldId), input));
}

function applyClientFilters(records: readonly ClientAnalyticsRecord[], filters: readonly ReportFilterNode[]): ClientAnalyticsRecord[] {
  if (filters.length === 0) {
    return [...records];
  }
  return records.filter((record) => evaluateFilterTree(filters, (fieldId) => resolveClientFieldValue(record, fieldId)));
}

function applyServiceFilters(records: readonly ServiceAnalyticsRecord[], filters: readonly ReportFilterNode[]): ServiceAnalyticsRecord[] {
  if (filters.length === 0) {
    return [...records];
  }
  return records.filter((record) => evaluateFilterTree(filters, (fieldId) => resolveServiceFieldValue(record, fieldId)));
}

function applyProfessionalFilters(records: readonly ProfessionalAnalyticsRecord[], filters: readonly ReportFilterNode[]): ProfessionalAnalyticsRecord[] {
  if (filters.length === 0) {
    return [...records];
  }
  return records.filter((record) => evaluateFilterTree(filters, (fieldId) => resolveProfessionalFieldValue(record, fieldId)));
}

function applyPaymentFilters(records: readonly PaymentAnalyticsRecord[], filters: readonly ReportFilterNode[]): PaymentAnalyticsRecord[] {
  if (filters.length === 0) {
    return [...records];
  }
  return records.filter((record) => evaluateFilterTree(filters, (fieldId) => resolvePaymentFieldValue(record, fieldId)));
}

function evaluateAvailabilityFilters(record: AvailabilityAnalyticsRecord, filters: readonly ReportFilterNode[]): boolean {
  if (filters.length === 0) {
    return true;
  }
  return evaluateFilterTree(filters, (fieldId) => resolveAvailabilityFieldValue(record, fieldId));
}

function evaluateFilterTree(
  filters: readonly ReportFilterNode[],
  resolver: (fieldId: string) => string | number | boolean,
  _input?: ExecuteReportDefinitionInput
): boolean {
  const conditions = filters.filter((node): node is ReportFilterConditionNode => node.kind === "condition");
  if (conditions.length === 0) {
    return true;
  }

  let result = true;
  for (const node of conditions) {
    const current = evaluateConditionNode(node, resolver);
    result = node.connective === "OR" ? result || current : result && current;
  }
  return result;
}

function evaluateConditionNode(
  node: ReportFilterConditionNode,
  resolver: (fieldId: string) => string | number | boolean
): boolean {
  const left = resolver(node.field);
  const rawValue = node.value;

  switch (node.operator) {
    case "equals":
      return String(left) === String(rawValue);
    case "not_equals":
      return String(left) !== String(rawValue);
    case "gt":
      return Number(left) > Number(rawValue);
    case "gte":
      return Number(left) >= Number(rawValue);
    case "lt":
      return Number(left) < Number(rawValue);
    case "lte":
      return Number(left) <= Number(rawValue);
    case "between": {
      const values = Array.isArray(rawValue) ? rawValue : [rawValue, rawValue];
      if (typeof left === "number") {
        return Number(left) >= Number(values[0]) && Number(left) <= Number(values[1]);
      }
      return String(left) >= String(values[0]) && String(left) <= String(values[1]);
    }
    case "in":
      return (Array.isArray(rawValue) ? rawValue : String(rawValue).split(",")).map(String).includes(String(left));
    case "not_in":
      return !(Array.isArray(rawValue) ? rawValue : String(rawValue).split(",")).map(String).includes(String(left));
    case "contains":
      return String(left).toLowerCase().includes(String(rawValue).toLowerCase());
    case "starts_with":
      return String(left).toLowerCase().startsWith(String(rawValue).toLowerCase());
    default:
      return true;
  }
}

function groupBookingRecords(records: readonly BookingAnalyticsRecord[], groupField: string, input: ExecuteReportDefinitionInput) {
  const grouped = new Map<string, { code: string; label: string; bookingsCount: number; completedCount: number; recognizedRevenue: number; uniqueClients: Set<string>; metricAccumulator: number[] }>();

  for (const record of records) {
    const grouping = resolveGroupingForBooking(record, groupField);
    const current = grouped.get(grouping.key) ?? { code: grouping.code, label: grouping.label, bookingsCount: 0, completedCount: 0, recognizedRevenue: 0, uniqueClients: new Set<string>(), metricAccumulator: [] };
    current.bookingsCount += 1;
    if (record.booking.status === "concluido") {
      current.completedCount += 1;
      current.recognizedRevenue += record.recognizedRevenue;
    }
    current.uniqueClients.add(record.booking.clientId);
    current.metricAccumulator.push(resolveNumericBookingField(record, input.definition.metric.field));
    grouped.set(grouping.key, current);
  }

  return [...grouped.entries()].map(([key, value]) => ({
    key,
    code: value.code,
    label: value.label,
    bookingsCount: value.bookingsCount,
    completedCount: value.completedCount,
    recognizedRevenue: value.recognizedRevenue,
    averageTicket: value.completedCount > 0 ? value.recognizedRevenue / value.completedCount : 0,
    uniqueClients: value.uniqueClients.size,
    metricValue: aggregateNumbers(value.metricAccumulator, input.definition.metric.operation)
  })).sort((left, right) => right.metricValue - left.metricValue || left.label.localeCompare(right.label));
}

function groupServiceRecords(
  records: readonly ServiceAnalyticsRecord[],
  groupField: string,
  metric: ReportDefinition["metric"]
) {
  const grouped = new Map<string, { label: string; recordsCount: number; linkedCount: number; bookingsCount: number; metricAccumulator: number[] }>();

  for (const record of records) {
    const key = String(resolveServiceFieldValue(record, groupField));
    const label = resolveServiceGroupLabel(record, groupField);
    const current = grouped.get(key) ?? { label, recordsCount: 0, linkedCount: 0, bookingsCount: 0, metricAccumulator: [] };
    current.recordsCount += 1;
    current.linkedCount += record.linkedProfessionals.length;
    current.bookingsCount += record.bookingsCount;
    current.metricAccumulator.push(resolveNumericServiceField(record, metric.field));
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      recordsCount: value.recordsCount,
      linkedCount: value.linkedCount,
      bookingsCount: value.bookingsCount,
      metricValue: aggregateNumbers(value.metricAccumulator, metric.operation)
    }))
    .sort((left, right) => right.metricValue - left.metricValue || left.label.localeCompare(right.label));
}

function groupProfessionalRecords(
  records: readonly ProfessionalAnalyticsRecord[],
  groupField: string,
  metric: ReportDefinition["metric"]
) {
  const grouped = new Map<string, { label: string; recordsCount: number; linkedCount: number; bookingsCount: number; metricAccumulator: number[] }>();

  for (const record of records) {
    const key = String(resolveProfessionalFieldValue(record, groupField));
    const label = resolveProfessionalGroupLabel(record, groupField);
    const current = grouped.get(key) ?? { label, recordsCount: 0, linkedCount: 0, bookingsCount: 0, metricAccumulator: [] };
    current.recordsCount += 1;
    current.linkedCount += record.linkedServices.length;
    current.bookingsCount += record.bookingsCount;
    current.metricAccumulator.push(resolveNumericProfessionalField(record, metric.field));
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      recordsCount: value.recordsCount,
      linkedCount: value.linkedCount,
      bookingsCount: value.bookingsCount,
      metricValue: aggregateNumbers(value.metricAccumulator, metric.operation)
    }))
    .sort((left, right) => right.metricValue - left.metricValue || left.label.localeCompare(right.label));
}

function groupPaymentRecords(
  records: readonly PaymentAnalyticsRecord[],
  groupField: string,
  metric: ReportDefinition["metric"]
) {
  const grouped = new Map<string, { label: string; recordsCount: number; amount: number; metricAccumulator: number[] }>();

  for (const record of records) {
    const key = String(resolvePaymentFieldValue(record, groupField));
    const label = resolvePaymentGroupLabel(record, groupField);
    const current = grouped.get(key) ?? { label, recordsCount: 0, amount: 0, metricAccumulator: [] };
    current.recordsCount += 1;
    current.amount += record.paymentIntent.amount;
    current.metricAccumulator.push(resolveNumericPaymentField(record, metric.field));
    grouped.set(key, current);
  }

  return [...grouped.entries()]
    .map(([key, value]) => ({
      key,
      label: value.label,
      recordsCount: value.recordsCount,
      amount: value.amount,
      metricValue: aggregateNumbers(value.metricAccumulator, metric.operation)
    }))
    .sort((left, right) => right.metricValue - left.metricValue || left.label.localeCompare(right.label));
}

function buildGroupedBookingTable(grouped: ReturnType<typeof groupBookingRecords>, groupField: string): ReportExecutionTable {
  const labelColumn =
    groupField === "service_id"
      ? "Descricao"
      : groupField === "professional_id" || groupField === "client_id"
        ? "Nome"
        : resolveGroupFieldLabel(groupField);
  const showCode = groupField === "service_id" || groupField === "professional_id" || groupField === "client_id";
  return {
    columns: [
      ...(showCode ? [{ id: "code", label: "Codigo" }] : []),
      { id: "group", label: labelColumn },
      { id: "bookings", label: "Bookings" },
      { id: "completed", label: "Concluidos" },
      { id: "recognized", label: "Receita" },
      { id: "metric", label: "Metrica" }
    ],
    rows: grouped.map((row) => ({
      id: row.key,
      cells: [...(showCode ? [row.code] : []), row.label, row.bookingsCount, row.completedCount, formatCurrency(row.recognizedRevenue), formatMetricValue(row.metricValue)]
    })),
    emptyMessage: "Nenhum grupo encontrado no recorte atual."
  };
}

function buildOperationalTable(records: readonly BookingAnalyticsRecord[]): ReportExecutionTable {
  return {
    columns: [
      { id: "booking", label: "Booking" },
      { id: "client", label: "Cliente" },
      { id: "service", label: "Servico" },
      { id: "professional", label: "Profissional" },
      { id: "status", label: "Status" }
    ],
    rows: records.slice(0, 20).map((record) => ({
      id: record.booking.id,
      cells: [
        record.booking.id.slice(0, 8).toUpperCase(),
        record.client?.nome ?? "Cliente removido",
        record.service?.nome ?? "Servico removido",
        record.professional?.nome ?? "Profissional removido",
        record.booking.status
      ]
    })),
    emptyMessage: "Nenhum registro encontrado."
  };
}

function buildWeeklyCapacityTable(records: readonly AvailabilityAnalyticsRecord[]): ReportExecutionTable {
  return {
    columns: [
      { id: "day", label: "Dia" },
      { id: "professional", label: "Profissional" },
      { id: "capacity", label: "Capacidade" },
      { id: "booked", label: "Ocupado" },
      { id: "free", label: "Livre" },
      { id: "open", label: "Em aberto" }
    ],
    rows: records.map((record) => ({
      id: `${record.date}:${record.professionalId}`,
      cells: [formatAgendaDayLabel(record.date), record.professionalName, formatMinutesAsHours(record.capacityMinutes), formatMinutesAsHours(record.bookedMinutes), formatMinutesAsHours(record.freeMinutes), record.openBookings]
    })),
    emptyMessage: "Nenhuma capacidade semanal encontrada."
  };
}

function buildMonthlyCapacityTable(records: readonly AvailabilityAnalyticsRecord[]): ReportExecutionTable {
  const grouped = new Map<string, { bookings: number; capacity: number; booked: number; free: number }>();
  for (const record of records) {
    const current = grouped.get(record.date) ?? { bookings: 0, capacity: 0, booked: 0, free: 0 };
    current.bookings += record.bookingsCount;
    current.capacity += record.capacityMinutes;
    current.booked += record.bookedMinutes;
    current.free += record.freeMinutes;
    grouped.set(record.date, current);
  }

  return {
    columns: [
      { id: "day", label: "Dia" },
      { id: "bookings", label: "Bookings" },
      { id: "capacity", label: "Capacidade" },
      { id: "booked", label: "Ocupado" },
      { id: "free", label: "Livre" }
    ],
    rows: [...grouped.entries()].sort((left, right) => left[0].localeCompare(right[0])).map(([date, value]) => ({
      id: date,
      cells: [formatAgendaDayLabel(date), value.bookings, formatMinutesAsHours(value.capacity), formatMinutesAsHours(value.booked), formatMinutesAsHours(value.free)]
    })),
    emptyMessage: "Nenhuma leitura mensal encontrada."
  };
}

function buildServiceProfessionalsRelationTable(
  records: readonly ServiceAnalyticsRecord[],
  professionals: readonly Professional[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedProfessionalIds = new Set<string>();

  for (const record of records) {
    if (record.linkedProfessionals.length > 0) {
      for (const professional of record.linkedProfessionals) {
        linkedProfessionalIds.add(professional.id);
        rows.push({
          id: `${record.service.id}:${professional.id}`,
          cells: [
            record.service.codigo,
            record.service.nome,
            professional.codigo,
            professional.nome,
            "Vinculado"
          ]
        });
      }
      continue;
    }

    if (mode !== "inner") {
      rows.push({
        id: `${record.service.id}:none`,
        cells: [record.service.codigo, record.service.nome, "-", "Sem profissional", "Servico sem vinculo"]
      });
    }
  }

  if (mode === "right") {
    for (const professional of professionals) {
      if (linkedProfessionalIds.has(professional.id)) {
        continue;
      }

      rows.push({
        id: `none:${professional.id}`,
        cells: ["-", "Sem servico", professional.codigo, professional.nome, "Profissional sem vinculo"]
      });
    }
  }

  return {
    columns: [
      { id: "service_code", label: "Cod. servico" },
      { id: "service_name", label: "Descricao do servico" },
      { id: "professional_code", label: "Cod. profissional" },
      { id: "professional_name", label: "Nome do profissional" },
      { id: "relation", label: "Relacao" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre servicos e profissionais foi encontrado."
  };
}

function buildProfessionalServicesRelationTable(
  records: readonly ProfessionalAnalyticsRecord[],
  services: readonly Service[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedServiceIds = new Set<string>();

  for (const record of records) {
    if (record.linkedServices.length > 0) {
      for (const service of record.linkedServices) {
        linkedServiceIds.add(service.id);
        rows.push({
          id: `${record.professional.id}:${service.id}`,
          cells: [
            record.professional.codigo,
            record.professional.nome,
            service.codigo,
            service.nome,
            "Vinculado"
          ]
        });
      }
      continue;
    }

    if (mode !== "inner") {
      rows.push({
        id: `${record.professional.id}:none`,
        cells: [record.professional.codigo, record.professional.nome, "-", "Sem servico", "Profissional sem vinculo"]
      });
    }
  }

  if (mode === "right") {
    for (const service of services) {
      if (linkedServiceIds.has(service.id)) {
        continue;
      }

      rows.push({
        id: `none:${service.id}`,
        cells: ["-", "Sem profissional", service.codigo, service.nome, "Servico sem vinculo"]
      });
    }
  }

  return {
    columns: [
      { id: "professional_code", label: "Cod. profissional" },
      { id: "professional_name", label: "Nome do profissional" },
      { id: "service_code", label: "Cod. servico" },
      { id: "service_name", label: "Descricao do servico" },
      { id: "relation", label: "Relacao" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre profissionais e servicos foi encontrado."
  };
}

function buildPaymentBookingsRelationTable(
  records: readonly PaymentAnalyticsRecord[],
  bookings: readonly Booking[],
  clients: readonly Client[],
  services: readonly Service[],
  professionals: readonly Professional[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedBookingIds = new Set<string>();

  for (const record of records) {
    if (record.booking) {
      linkedBookingIds.add(record.booking.id);
    }

    if (!record.booking && mode === "inner") {
      continue;
    }

    rows.push({
      id: record.paymentIntent.id,
      cells: [
        record.paymentIntent.externalReference,
        resolvePaymentStatusLabel(record.paymentIntent.status),
        formatCurrency(record.paymentIntent.amount),
        record.booking?.id ?? "-",
        record.client?.nome ?? "Sem cliente",
        record.service?.nome ?? "Sem servico",
        record.professional?.nome ?? "Sem profissional"
      ]
    });
  }

  if (mode === "right") {
    for (const booking of bookings) {
      if (linkedBookingIds.has(booking.id)) {
        continue;
      }

      const client = clients.find((item) => item.id === booking.clientId);
      const service = services.find((item) => item.id === booking.serviceId);
      const professional = professionals.find((item) => item.id === booking.professionalId);

      rows.push({
        id: `booking-only:${booking.id}`,
        cells: [
          "-",
          "Sem pagamento",
          formatCurrency(0),
          booking.id,
          client?.nome ?? "Sem cliente",
          service?.nome ?? "Sem servico",
          professional?.nome ?? "Sem profissional"
        ]
      });
    }
  }

  return {
    columns: [
      { id: "payment_code", label: "Cod. pagamento" },
      { id: "payment_status", label: "Situacao do pagamento" },
      { id: "payment_amount", label: "Valor" },
      { id: "booking", label: "Booking" },
      { id: "client", label: "Cliente" },
      { id: "service", label: "Servico" },
      { id: "professional", label: "Profissional" }
    ],
    rows,
    emptyMessage: "Nenhum vinculo entre pagamentos e atendimentos foi encontrado."
  };
}

function buildAvailabilityProfessionalsRelationTable(
  records: readonly AvailabilityAnalyticsRecord[],
  professionals: readonly Professional[],
  mode: ReportRelationMode
): ReportExecutionTable {
  const rows: ReportExecutionTable["rows"] = [];
  const linkedProfessionalIds = new Set<string>();

  for (const record of records) {
    linkedProfessionalIds.add(record.professionalId);
    rows.push({
      id: `${record.professionalId}:${record.date}`,
      cells: [
        record.date,
        professionals.find((item) => item.id === record.professionalId)?.codigo ?? "PRO-????",
        record.professionalName,
        formatMinutesAsHours(record.capacityMinutes),
        formatMinutesAsHours(record.bookedMinutes),
        formatMinutesAsHours(record.freeMinutes)
      ]
    });
  }

  if (mode === "right") {
    for (const professional of professionals) {
      if (linkedProfessionalIds.has(professional.id)) {
        continue;
      }

      rows.push({
        id: `availability:none:${professional.id}`,
        cells: ["-", professional.codigo, professional.nome, formatMinutesAsHours(0), formatMinutesAsHours(0), formatMinutesAsHours(0)]
      });
    }
  }

  return {
    columns: [
      { id: "date", label: "Data" },
      { id: "professional_code", label: "Cod. profissional" },
      { id: "professional_name", label: "Nome do profissional" },
      { id: "capacity", label: "Capacidade" },
      { id: "booked", label: "Ocupado" },
      { id: "free", label: "Livre" }
    ],
    rows: mode === "inner" ? rows.filter((row) => row.cells[0] !== "-") : rows,
    emptyMessage: "Nenhuma leitura de agenda relacionada foi encontrada."
  };
}

function buildServiceTable(records: readonly ServiceAnalyticsRecord[]): ReportExecutionTable {
  return {
    columns: [
      { id: "code", label: "Codigo" },
      { id: "description", label: "Descricao" },
      { id: "status", label: "Situacao" },
      { id: "price", label: "Preco base" },
      { id: "duration", label: "Duracao" },
      { id: "professionals", label: "Profissionais" }
    ],
    rows: records.map((record) => ({
      id: record.service.id,
      cells: [
        record.service.codigo,
        record.service.nome,
        record.service.status === "active" ? "Ativo" : "Inativo",
        formatCurrency(record.service.precoBase),
        `${record.service.duracaoMin} min`,
        record.linkedProfessionals.length
      ]
    })),
    emptyMessage: "Nenhum servico encontrado no recorte."
  };
}

function buildProfessionalTable(records: readonly ProfessionalAnalyticsRecord[]): ReportExecutionTable {
  return {
    columns: [
      { id: "code", label: "Codigo" },
      { id: "name", label: "Nome" },
      { id: "status", label: "Situacao" },
      { id: "services", label: "Servicos" },
      { id: "capacity", label: "Capacidade semanal" },
      { id: "bookings", label: "Bookings" }
    ],
    rows: records.map((record) => ({
      id: record.professional.id,
      cells: [
        record.professional.codigo,
        record.professional.nome,
        record.professional.status === "active" ? "Ativo" : "Inativo",
        record.linkedServices.length,
        formatMinutesAsHours(record.weeklyCapacityMinutes),
        record.bookingsCount
      ]
    })),
    emptyMessage: "Nenhum profissional encontrado no recorte."
  };
}

function buildPaymentTable(records: readonly PaymentAnalyticsRecord[]): ReportExecutionTable {
  return {
    columns: [
      { id: "code", label: "Codigo" },
      { id: "status", label: "Situacao" },
      { id: "amount", label: "Valor" },
      { id: "service", label: "Servico" },
      { id: "professional", label: "Profissional" },
      { id: "date", label: "Data" }
    ],
    rows: records.map((record) => ({
      id: record.paymentIntent.id,
      cells: [
        record.paymentIntent.externalReference,
        resolvePaymentStatusLabel(record.paymentIntent.status),
        formatCurrency(record.paymentIntent.amount),
        record.service?.nome ?? "Sem servico",
        record.professional?.nome ?? "Sem profissional",
        formatAgendaDayLabel(record.bookingDate)
      ]
    })),
    emptyMessage: "Nenhum pagamento encontrado no recorte."
  };
}

function buildGroupedServiceTable(
  grouped: ReturnType<typeof groupServiceRecords>,
  groupField: string
): ReportExecutionTable {
  return {
    columns: [
      { id: "group", label: resolveGroupFieldLabel(groupField) },
      { id: "records", label: "Servicos" },
      { id: "linked", label: "Profissionais" },
      { id: "bookings", label: "Bookings" },
      { id: "metric", label: "Metrica" }
    ],
    rows: grouped.map((row) => ({
      id: row.key,
      cells: [row.label, row.recordsCount, row.linkedCount, row.bookingsCount, formatMetricValue(row.metricValue)]
    })),
    emptyMessage: "Nenhum grupo encontrado no recorte atual."
  };
}

function buildGroupedProfessionalTable(
  grouped: ReturnType<typeof groupProfessionalRecords>,
  groupField: string
): ReportExecutionTable {
  return {
    columns: [
      { id: "group", label: resolveGroupFieldLabel(groupField) },
      { id: "records", label: "Profissionais" },
      { id: "services", label: "Servicos" },
      { id: "bookings", label: "Bookings" },
      { id: "metric", label: "Metrica" }
    ],
    rows: grouped.map((row) => ({
      id: row.key,
      cells: [row.label, row.recordsCount, row.linkedCount, row.bookingsCount, formatMetricValue(row.metricValue)]
    })),
    emptyMessage: "Nenhum grupo encontrado no recorte atual."
  };
}

function buildGroupedPaymentTable(
  grouped: ReturnType<typeof groupPaymentRecords>,
  groupField: string
): ReportExecutionTable {
  return {
    columns: [
      { id: "group", label: resolveGroupFieldLabel(groupField) },
      { id: "payments", label: "Pagamentos" },
      { id: "amount", label: "Valor total" },
      { id: "metric", label: "Metrica" }
    ],
    rows: grouped.map((row) => ({
      id: row.key,
      cells: [row.label, row.recordsCount, formatCurrency(row.amount), formatMetricValue(row.metricValue)]
    })),
    emptyMessage: "Nenhum grupo encontrado no recorte atual."
  };
}

function describeAppliedFilters(filters: readonly ReportFilterNode[]): ReportExecutionChip[] {
  return filters.filter((node): node is ReportFilterConditionNode => node.kind === "condition").map((node) => ({
    id: node.id,
    label: resolveFieldLabel(node.field),
    value: Array.isArray(node.value) ? node.value.join(" ate ") : String(node.value)
  }));
}

function buildPreviewExpression(definition: ReportDefinition): string {
  const parts = [`Mostrar ${definition.metric.name} usando ${resolveFieldLabel(definition.metric.field)}`];
  if (definition.relation) {
    parts.push(
      `com a relacao ${resolveRelationLabel(definition.relation.relationId)} em ${resolveRelationModeLabel(definition.relation.mode)}`
    );
  }
  const conditions = definition.filters.filter((node): node is ReportFilterConditionNode => node.kind === "condition");
  if (conditions.length > 0) {
    parts.push(`com filtros ${conditions.map((node) => `${node.connective ? `${resolveConnectiveLabel(node.connective)} ` : ""}${resolveFieldLabel(node.field)} ${resolveOperatorLabel(node.operator)} ${Array.isArray(node.value) ? node.value.join(" e ") : node.value}`).join(" ")}`);
  }
  if (definition.groupBy.length > 0) {
    parts.push(`agrupado por ${definition.groupBy.map(resolveGroupFieldLabel).join(", ")}`);
  }
  if (definition.orderBy.length > 0) {
    parts.push(`ordenado por ${definition.orderBy.sort((left, right) => left.priority - right.priority).map((item) => `${resolveFieldLabel(item.field)} ${resolveSortDirectionLabel(item.direction)}`).join(", ")}`);
  }
  return parts.join(" ");
}

function aggregateBookingMetric(records: readonly BookingAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct") {
    return new Set(records.map((record) => String(resolveBookingFieldValue(record, fieldId)))).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericBookingField(record, fieldId)), operation);
}

function aggregateClientMetric(records: readonly ClientAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct") {
    return new Set(records.map((record) => String(resolveClientFieldValue(record, fieldId)))).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericClientField(record, fieldId)), operation);
}

function aggregateServiceMetric(records: readonly ServiceAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct") {
    return new Set(records.map((record) => String(resolveServiceFieldValue(record, fieldId)))).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericServiceField(record, fieldId)), operation);
}

function aggregateProfessionalMetric(records: readonly ProfessionalAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct") {
    return new Set(records.map((record) => String(resolveProfessionalFieldValue(record, fieldId)))).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericProfessionalField(record, fieldId)), operation);
}

function aggregatePaymentMetric(records: readonly PaymentAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct") {
    return new Set(records.map((record) => String(resolvePaymentFieldValue(record, fieldId)))).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericPaymentField(record, fieldId)), operation);
}

function resolveGroupingForBooking(record: BookingAnalyticsRecord, groupField: string): { key: string; code: string; label: string } {
  if (groupField === "client_id") {
    return { key: record.booking.clientId, code: record.client?.codigo ?? "CLI-????", label: record.client?.nome ?? "Cliente removido" };
  }
  if (groupField === "service_id") {
    return { key: record.booking.serviceId, code: record.service?.codigo ?? "SRV-????", label: record.service?.nome ?? "Servico removido" };
  }
  if (groupField === "professional_id") {
    return { key: record.booking.professionalId, code: record.professional?.codigo ?? "PRO-????", label: record.professional?.nome ?? "Profissional removido" };
  }
  if (groupField === "booking_date") {
    return { key: record.bookingDate, code: record.bookingDate, label: formatAgendaDayLabel(record.bookingDate) };
  }
  if (groupField === "month") {
    return { key: record.monthKey, code: record.monthKey, label: formatAgendaMonthLabel(`${record.monthKey}-01`) };
  }
  return { key: record.booking.status, code: record.booking.status, label: record.booking.status };
}

function summarizeBookingRecords(records: readonly BookingAnalyticsRecord[]) {
  const completed = records.filter((record) => record.booking.status === "concluido");
  const recognizedRevenue = completed.reduce((total, record) => total + record.recognizedRevenue, 0);
  return {
    bookingsCount: records.length,
    completedCount: completed.length,
    openBookings: records.filter((record) => isOpenBookingStatus(record.booking.status)).length,
    noShowCount: records.filter((record) => record.booking.status === "faltou").length,
    uniqueClients: new Set(records.map((record) => record.booking.clientId)).size,
    recognizedRevenue
  };
}

function summarizeAvailabilityRecords(records: readonly AvailabilityAnalyticsRecord[]) {
  return records.reduce((summary, record) => ({
    capacityMinutes: summary.capacityMinutes + record.capacityMinutes,
    bookedMinutes: summary.bookedMinutes + record.bookedMinutes,
    freeMinutes: summary.freeMinutes + record.freeMinutes,
    bookingsCount: summary.bookingsCount + record.bookingsCount,
    openBookings: summary.openBookings + record.openBookings
  }), { capacityMinutes: 0, bookedMinutes: 0, freeMinutes: 0, bookingsCount: 0, openBookings: 0 });
}

function resolveBookingFieldValue(record: BookingAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "recognized_revenue") return record.recognizedRevenue;
  if (fieldId === "approved_online_revenue") return record.approvedOnlineRevenue;
  if (fieldId === "service_value") return record.service?.precoBase ?? 0;
  if (fieldId === "duration_minutes") return record.durationMinutes;
  if (fieldId === "booking_id") return record.booking.id;
  if (fieldId === "client_id") return record.booking.clientId;
  if (fieldId === "service_id") return record.booking.serviceId;
  if (fieldId === "professional_id") return record.booking.professionalId;
  if (fieldId === "status") return record.booking.status;
  if (fieldId === "booking_date") return record.bookingDate;
  if (fieldId === "month") return record.monthKey;
  return "";
}

function resolveClientFieldValue(record: ClientAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "client_id") return record.client.id;
  if (fieldId === "client_code") return record.client.codigo;
  if (fieldId === "client_name") return record.client.nome;
  if (fieldId === "client_phone") return record.client.telefone;
  if (fieldId === "recognized_revenue") return record.recognizedRevenue;
  if (fieldId === "completed_bookings") return record.completedBookings;
  if (fieldId === "days_since_last_completed") return record.daysSinceLastCompleted ?? -1;
  if (fieldId === "average_recurrence_days") return record.averageRecurrenceDays ?? -1;
  return "";
}

function resolveAvailabilityFieldValue(record: AvailabilityAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "professional_id") return record.professionalId;
  if (fieldId === "booking_date") return record.date;
  if (fieldId === "month") return record.monthKey;
  if (fieldId === "capacity_minutes") return record.capacityMinutes;
  if (fieldId === "booked_minutes") return record.bookedMinutes;
  if (fieldId === "free_minutes") return record.freeMinutes;
  if (fieldId === "open_bookings") return record.openBookings;
  return "";
}

function resolveServiceFieldValue(record: ServiceAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "service_lookup_id") return record.service.id;
  if (fieldId === "service_code") return record.service.codigo;
  if (fieldId === "service_name") return record.service.nome;
  if (fieldId === "service_status") return record.service.status;
  if (fieldId === "service_price") return record.service.precoBase;
  if (fieldId === "service_duration") return record.service.duracaoMin;
  if (fieldId === "service_collection_mode") return record.service.paymentPolicy.collectionMode;
  if (fieldId === "service_requires_signal") return record.service.exigeSinal ? "Sim" : "Nao";
  if (fieldId === "linked_professionals_count") return record.linkedProfessionals.length;
  if (fieldId === "service_bookings_count") return record.bookingsCount;
  return "";
}

function resolveProfessionalFieldValue(record: ProfessionalAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "professional_lookup_id") return record.professional.id;
  if (fieldId === "professional_code") return record.professional.codigo;
  if (fieldId === "professional_name") return record.professional.nome;
  if (fieldId === "professional_status") return record.professional.status;
  if (fieldId === "linked_services_count") return record.linkedServices.length;
  if (fieldId === "professional_bookings_count") return record.bookingsCount;
  if (fieldId === "weekly_capacity_minutes") return record.weeklyCapacityMinutes;
  return "";
}

function resolvePaymentFieldValue(record: PaymentAnalyticsRecord, fieldId: string): string | number | boolean {
  if (fieldId === "payment_reference") return record.paymentIntent.externalReference;
  if (fieldId === "payment_status") return record.paymentIntent.status;
  if (fieldId === "payment_amount") return record.paymentIntent.amount;
  if (fieldId === "payment_date") return record.bookingDate;
  if (fieldId === "payment_month") return record.monthKey;
  if (fieldId === "payment_service_id") return record.service?.id ?? "";
  if (fieldId === "payment_professional_id") return record.professional?.id ?? "";
  if (fieldId === "payment_client_id") return record.client?.id ?? "";
  return "";
}

function resolveNumericBookingField(record: BookingAnalyticsRecord, fieldId: string): number {
  return Number(resolveBookingFieldValue(record, fieldId) || 0);
}

function resolveNumericClientField(record: ClientAnalyticsRecord, fieldId: string): number {
  return Number(resolveClientFieldValue(record, fieldId) || 0);
}

function resolveNumericServiceField(record: ServiceAnalyticsRecord, fieldId: string): number {
  return Number(resolveServiceFieldValue(record, fieldId) || 0);
}

function resolveNumericProfessionalField(record: ProfessionalAnalyticsRecord, fieldId: string): number {
  return Number(resolveProfessionalFieldValue(record, fieldId) || 0);
}

function resolveNumericPaymentField(record: PaymentAnalyticsRecord, fieldId: string): number {
  return Number(resolvePaymentFieldValue(record, fieldId) || 0);
}

function defaultSystemFilters(code: string): ReportFilterNode[] {
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

function resolveFieldLabel(fieldId: string): string {
  return reportFieldCatalog.find((field) => field.id === fieldId)?.label ?? fieldId;
}

function resolveGroupFieldLabel(fieldId: string): string {
  return reportGroupByOptions.find((entry) => entry.id === fieldId)?.label ?? fieldId;
}

function resolveConnectiveLabel(connective: "AND" | "OR"): string {
  return connective === "AND" ? "e" : "ou";
}

function resolveOperatorLabel(operator: ReportFilterConditionNode["operator"]): string {
  if (operator === "equals") return "igual a";
  if (operator === "not_equals") return "diferente de";
  if (operator === "gt") return "maior que";
  if (operator === "gte") return "maior ou igual a";
  if (operator === "lt") return "menor que";
  if (operator === "lte") return "menor ou igual a";
  if (operator === "between") return "entre";
  if (operator === "in") return "em";
  if (operator === "not_in") return "fora de";
  if (operator === "contains") return "contendo";
  if (operator === "starts_with") return "comecando por";
  return operator;
}

function resolveSortDirectionLabel(direction: string): string {
  if (direction === "desc" || direction === "largest_first" || direction === "newest_first" || direction === "za") {
    return "decrescente";
  }
  return "crescente";
}

function resolveRelationModeLabel(mode: ReportRelationMode): string {
  if (mode === "inner") {
    return "somente quando houver vinculo";
  }
  if (mode === "left") {
    return "manter o item principal mesmo sem vinculo";
  }
  return "trazer tambem itens do outro lado sem vinculo";
}

function resolveRelationLabel(relationId: string): string {
  return reportRelationOptions.find((entry) => entry.id === relationId)?.label ?? relationId;
}

function resolveServiceGroupLabel(record: ServiceAnalyticsRecord, fieldId: string): string {
  if (fieldId === "service_status") {
    return record.service.status === "active" ? "Ativo" : "Inativo";
  }
  if (fieldId === "service_collection_mode") {
    return resolveCollectionModeLabel(record.service.paymentPolicy.collectionMode);
  }
  return String(resolveServiceFieldValue(record, fieldId) || "Sem valor");
}

function resolveProfessionalGroupLabel(record: ProfessionalAnalyticsRecord, fieldId: string): string {
  if (fieldId === "professional_status") {
    return record.professional.status === "active" ? "Ativo" : "Inativo";
  }
  return String(resolveProfessionalFieldValue(record, fieldId) || "Sem valor");
}

function resolvePaymentGroupLabel(record: PaymentAnalyticsRecord, fieldId: string): string {
  if (fieldId === "payment_status") {
    return resolvePaymentStatusLabel(record.paymentIntent.status);
  }
  if (fieldId === "payment_client_id") {
    return record.client?.nome ?? "Sem cliente";
  }
  if (fieldId === "payment_service_id") {
    return record.service?.nome ?? "Sem servico";
  }
  if (fieldId === "payment_professional_id") {
    return record.professional?.nome ?? "Sem profissional";
  }
  if (fieldId === "payment_date") {
    return formatAgendaDayLabel(record.bookingDate);
  }
  if (fieldId === "payment_month") {
    return formatAgendaMonthLabel(`${record.monthKey}-01`);
  }
  return String(resolvePaymentFieldValue(record, fieldId) || "Sem valor");
}

function aggregateNumbers(values: readonly number[], operation: ReportMetricOperation): number {
  if (values.length === 0) return 0;
  if (operation === "sum" || operation === "count" || operation === "count_distinct") return values.reduce((total, value) => total + value, 0);
  if (operation === "avg") return values.reduce((total, value) => total + value, 0) / values.length;
  if (operation === "max") return Math.max(...values);
  if (operation === "min") return Math.min(...values);
  return 0;
}

function buildWeekDates(baseDate: Date): string[] {
  const anchor = new Date(baseDate);
  anchor.setHours(12, 0, 0, 0);
  const start = new Date(anchor);
  start.setDate(anchor.getDate() - anchor.getDay());
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return formatDateInputValue(date);
  });
}

function buildMonthDates(baseDate: Date): string[] {
  const dates: string[] = [];
  const cursor = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 12, 0, 0);
  const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 12, 0, 0);
  for (; cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    dates.push(formatDateInputValue(cursor));
  }
  return dates;
}

function filterDatesByDefinition(dates: readonly string[], filters: readonly ReportFilterNode[]): string[] {
  const between = filters.find((node): node is ReportFilterConditionNode => node.kind === "condition" && node.field === "booking_date" && node.operator === "between");
  if (!between || !Array.isArray(between.value)) {
    return [...dates];
  }
  const [from, to] = between.value;
  return dates.filter((date) => date >= String(from) && date <= String(to));
}

function resolveRecognizedRevenueAmount(booking: Booking, services: readonly Service[], cashEntries: readonly CashEntry[]): number {
  return findOpenCashEntry(cashEntries, booking.id, "recognized_revenue")?.amount ?? services.find((entry) => entry.id === booking.serviceId)?.precoBase ?? 0;
}

function resolveApprovedOnlineAmount(booking: Booking, paymentIntent: PaymentIntent | undefined, cashEntries: readonly CashEntry[]): number {
  const cashEntryAmount = findOpenCashEntry(cashEntries, booking.id, "online_payment")?.amount;
  if (cashEntryAmount !== undefined) {
    return cashEntryAmount;
  }
  return paymentIntent && isApprovedPaymentIntent(paymentIntent.status) ? paymentIntent.amount : 0;
}

function findOpenCashEntry(cashEntries: readonly CashEntry[], bookingId: string, kind: CashEntry["kind"]): CashEntry | undefined {
  return cashEntries.find((entry) => entry.bookingId === bookingId && entry.kind === kind && entry.status === "open");
}

function isApprovedPaymentIntent(status: PaymentIntent["status"]): boolean {
  return status === "approved" || status === "authorized";
}

function calculateAverageRecurrenceDays(bookings: readonly Booking[]): number | null {
  if (bookings.length < 2) return null;
  const deltas: number[] = [];
  for (let index = 1; index < bookings.length; index += 1) {
    const current = new Date(bookings[index].endAt).getTime();
    const previous = new Date(bookings[index - 1].endAt).getTime();
    deltas.push(Math.max(Math.round((current - previous) / 86400000), 0));
  }
  return deltas.reduce((total, value) => total + value, 0) / deltas.length;
}

function calculateDaysSinceIso(value: string): number {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const target = new Date(value);
  target.setHours(12, 0, 0, 0);
  return Math.max(Math.round((today.getTime() - target.getTime()) / 86400000), 0);
}

function isOpenBookingStatus(status: Booking["status"]): boolean {
  return status === "pendente" || status === "aguardando pagamento" || status === "confirmado";
}

function calculateRuleDurationMinutes(rule?: AvailabilityRule): number {
  if (!rule) return 0;
  const [startHour, startMinute] = rule.faixa.startTime.split(":").map(Number);
  const [endHour, endMinute] = rule.faixa.endTime.split(":").map(Number);
  return Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0);
}

function calculateBookingDurationMinutes(booking: Booking): number {
  return Math.max(Math.round((new Date(booking.endAt).getTime() - new Date(booking.startAt).getTime()) / 60000), 0);
}

function extractDatePart(value: string): string {
  return value.slice(0, 10);
}

function formatDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAgendaDayLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date(`${value}T12:00:00`));
}

function formatAgendaMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function formatMinutesAsHours(value: number): string {
  if (value <= 0) return "0h";
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes > 0 ? `${hours}h${String(minutes).padStart(2, "0")}` : `${hours}h`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 }).format(value);
}

function formatMetricValue(value: number): string | number {
  return Number.isInteger(value) ? value : Number(value.toFixed(2));
}

function resolveCollectionModeLabel(value: Service["paymentPolicy"]["collectionMode"]): string {
  if (value === "none") return "Reserva imediata";
  if (value === "deposit") return "Sinal antecipado";
  return "Pagamento integral";
}

function resolvePaymentStatusLabel(value: PaymentIntent["status"]): string {
  if (value === "approved") return "Aprovado";
  if (value === "authorized") return "Autorizado";
  if (value === "pending") return "Pendente";
  if (value === "in_process") return "Em analise";
  if (value === "rejected") return "Rejeitado";
  if (value === "cancelled") return "Cancelado";
  if (value === "expired") return "Expirado";
  if (value === "charged_back") return "Chargeback";
  if (value === "refunded") return "Estornado";
  if (value === "in_mediation") return "Em mediacao";
  return "Rascunho";
}

function average(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function isFiniteNumber(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

function kpi(id: string, label: string, value: string | number, helper: string): ReportExecutionKpi {
  return { id, label, value, helper };
}
