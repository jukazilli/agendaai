import {
  contractVersion,
  type ReportBuilderCatalog,
  type ReportCatalogField,
  type ReportDefinition
} from "@agendaai/contracts";

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

export function createFallbackReportBuilderCatalog(tenantId: string): ReportBuilderCatalog {
  return {
    version: contractVersion,
    fields: [...reportFieldCatalog],
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
    filters: [],
    groupBy: [...seed.groupBy],
    orderBy: [{ id: `${seed.code}-sort-1`, field: seed.metric.field, direction: "desc", priority: 1 }],
    authorName: "AgendaAI",
    createdAt: now,
    updatedAt: now,
    locked: true
  }));
}
