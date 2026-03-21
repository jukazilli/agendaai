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

const reportFieldCatalog: readonly ReportCatalogField[] = [
  { id: "recognized_revenue", label: "Receita reconhecida", type: "number", bases: ["bookings", "clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "approved_online_revenue", label: "Entrada online aprovada", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "service_value", label: "Valor do servico", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "duration_minutes", label: "Duracao", type: "number", bases: ["bookings"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "booking_id", label: "Booking", type: "text", bases: ["bookings"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "contains", "starts_with", "in"], aggregations: ["count", "count_distinct"] },
  { id: "client_id", label: "Cliente", type: "lookup", bases: ["bookings", "clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "client" },
  { id: "service_id", label: "Servico", type: "lookup", bases: ["bookings"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "service" },
  { id: "professional_id", label: "Profissional", type: "lookup", bases: ["bookings", "availability"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in", "contains"], aggregations: ["count", "count_distinct"], lookupKind: "professional" },
  { id: "status", label: "Status", type: "enum", bases: ["bookings"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "in", "not_in"], aggregations: ["count"], lookupKind: "status" },
  { id: "booking_date", label: "Data do atendimento", type: "date", bases: ["bookings", "availability"], filterable: true, groupable: true, sortable: true, operators: ["equals", "not_equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "month", label: "Mes", type: "date", bases: ["bookings", "availability"], filterable: false, groupable: true, sortable: true, operators: ["equals", "gte", "lte", "between"], aggregations: ["count"] },
  { id: "completed_bookings", label: "Concluidos", type: "number", bases: ["clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "days_since_last_completed", label: "Dias sem retorno", type: "number", bases: ["clients"], filterable: true, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["avg", "max", "min"] },
  { id: "average_recurrence_days", label: "Recorrencia media", type: "number", bases: ["clients"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["avg", "max", "min"] },
  { id: "capacity_minutes", label: "Capacidade", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "booked_minutes", label: "Horas ocupadas", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "free_minutes", label: "Horas livres", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] },
  { id: "open_bookings", label: "Em aberto", type: "number", bases: ["availability"], filterable: false, groupable: false, sortable: true, operators: ["equals", "gt", "gte", "lt", "lte", "between"], aggregations: ["sum", "avg", "max", "min"] }
] as const;

const reportGroupByOptions = [
  { id: "service_id", label: "Servico", bases: ["bookings"] },
  { id: "professional_id", label: "Profissional", bases: ["bookings", "availability"] },
  { id: "booking_date", label: "Dia", bases: ["bookings", "availability"] },
  { id: "month", label: "Mes", bases: ["bookings", "availability"] },
  { id: "status", label: "Status", bases: ["bookings"] }
] as const;

const systemDefinitionsSeed = [
  { code: "RPT-EXECUTIVE", name: "Visao executiva", description: "Resumo do negocio no recorte ativo.", base: "bookings", visualization: "kpi_table", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: [] },
  { code: "RPT-REVENUE", name: "Receita e servicos", description: "Faturamento, ticket e mix de servicos.", base: "bookings", visualization: "ranking", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["service_id"] },
  { code: "RPT-TEAM", name: "Equipe e produtividade", description: "Leitura por profissional e capacidade entregue.", base: "bookings", visualization: "ranking", metric: { name: "faturamento", operation: "sum", field: "recognized_revenue" }, groupBy: ["professional_id"] },
  { code: "RPT-OPERATIONS", name: "Pendencias operacionais", description: "Fila que ainda pede tratamento operacional.", base: "bookings", visualization: "kpi_table", metric: { name: "bookings_abertas", operation: "count", field: "booking_id" }, groupBy: [] },
  { code: "RPT-RETENTION", name: "Retorno e retencao", description: "Clientes com retorno, sem retorno e recorrencia.", base: "clients", visualization: "kpi_table", metric: { name: "clientes", operation: "count_distinct", field: "client_id" }, groupBy: [] },
  { code: "RPT-WEEK", name: "Radar semanal", description: "Capacidade, ocupacao e carga por dia e profissional.", base: "availability", visualization: "time_series", metric: { name: "capacidade", operation: "sum", field: "capacity_minutes" }, groupBy: ["booking_date"] },
  { code: "RPT-MONTH", name: "Visao mensal", description: "Carga agregada do mes por dia.", base: "availability", visualization: "time_series", metric: { name: "carga_mensal", operation: "sum", field: "booked_minutes" }, groupBy: ["booking_date"] }
] as const;

export function createReportBuilderCatalog(input: CreateReportBuilderCatalogInput): ReportBuilderCatalog {
  return {
    version: contractVersion,
    fields: [...reportFieldCatalog],
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
    table: grouped.length > 0 ? buildGroupedBookingTable(grouped, input.definition.groupBy[0]) : buildOperationalTable(records)
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
  const table = scope === "week" ? buildWeeklyCapacityTable(records) : buildMonthlyCapacityTable(records);

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

function buildGroupedBookingTable(grouped: ReturnType<typeof groupBookingRecords>, groupField: string): ReportExecutionTable {
  const labelColumn = groupField === "service_id" ? "Descricao" : groupField === "professional_id" ? "Nome" : resolveGroupFieldLabel(groupField);
  const showCode = groupField === "service_id" || groupField === "professional_id";
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

function describeAppliedFilters(filters: readonly ReportFilterNode[]): ReportExecutionChip[] {
  return filters.filter((node): node is ReportFilterConditionNode => node.kind === "condition").map((node) => ({
    id: node.id,
    label: resolveFieldLabel(node.field),
    value: Array.isArray(node.value) ? node.value.join(" ate ") : String(node.value)
  }));
}

function buildPreviewExpression(definition: ReportDefinition): string {
  const parts = [`${definition.metric.name} = ${definition.metric.operation}(${resolveFieldLabel(definition.metric.field)})`];
  const conditions = definition.filters.filter((node): node is ReportFilterConditionNode => node.kind === "condition");
  if (conditions.length > 0) {
    parts.push(`onde ${conditions.map((node) => `${node.connective ? `${node.connective} ` : ""}${resolveFieldLabel(node.field)} ${node.operator} ${Array.isArray(node.value) ? node.value.join(" e ") : node.value}`).join(" ")}`);
  }
  if (definition.groupBy.length > 0) {
    parts.push(`agrupado por ${definition.groupBy.map(resolveGroupFieldLabel).join(", ")}`);
  }
  if (definition.orderBy.length > 0) {
    parts.push(`order by ${definition.orderBy.sort((left, right) => left.priority - right.priority).map((item) => `${resolveFieldLabel(item.field)} ${item.direction}`).join(", ")}`);
  }
  return parts.join(" ");
}

function aggregateBookingMetric(records: readonly BookingAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct" && fieldId === "client_id") {
    return new Set(records.map((record) => record.booking.clientId)).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericBookingField(record, fieldId)), operation);
}

function aggregateClientMetric(records: readonly ClientAnalyticsRecord[], operation: ReportMetricOperation, fieldId: string): number {
  if (operation === "count") {
    return records.length;
  }
  if (operation === "count_distinct" && fieldId === "client_id") {
    return new Set(records.map((record) => record.client.id)).size;
  }
  return aggregateNumbers(records.map((record) => resolveNumericClientField(record, fieldId)), operation);
}

function resolveGroupingForBooking(record: BookingAnalyticsRecord, groupField: string): { key: string; code: string; label: string } {
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

function resolveNumericBookingField(record: BookingAnalyticsRecord, fieldId: string): number {
  return Number(resolveBookingFieldValue(record, fieldId) || 0);
}

function resolveNumericClientField(record: ClientAnalyticsRecord, fieldId: string): number {
  return Number(resolveClientFieldValue(record, fieldId) || 0);
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
