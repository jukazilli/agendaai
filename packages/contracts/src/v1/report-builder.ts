import { z } from "zod";

import {
  contractEnvelopeSchema,
  dateTimeStringSchema,
  entityIdSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema
} from "./shared";

export const reportDefinitionSourceValues = ["system", "saved"] as const;
export const reportDefinitionSourceSchema = z.enum(reportDefinitionSourceValues);

export const reportBuilderBaseValues = [
  "bookings",
  "clients",
  "services",
  "professionals",
  "availability",
  "payments"
] as const;
export const reportBuilderBaseSchema = z.enum(reportBuilderBaseValues);

export const reportVisualizationValues = ["kpi", "kpi_table", "time_series", "ranking"] as const;
export const reportVisualizationSchema = z.enum(reportVisualizationValues);

export const reportMetricOperationValues = [
  "sum",
  "count",
  "count_distinct",
  "avg",
  "max",
  "min"
] as const;
export const reportMetricOperationSchema = z.enum(reportMetricOperationValues);

export const reportFieldTypeValues = ["text", "number", "date", "lookup", "enum"] as const;
export const reportFieldTypeSchema = z.enum(reportFieldTypeValues);

export const reportOperatorValues = [
  "equals",
  "not_equals",
  "gt",
  "gte",
  "lt",
  "lte",
  "between",
  "in",
  "not_in",
  "contains",
  "starts_with"
] as const;
export const reportOperatorSchema = z.enum(reportOperatorValues);

export const reportLogicalConnectiveValues = ["AND", "OR"] as const;
export const reportLogicalConnectiveSchema = z.enum(reportLogicalConnectiveValues);

export const reportValueModeValues = ["value", "parameter"] as const;
export const reportValueModeSchema = z.enum(reportValueModeValues);

export const reportSortDirectionValues = [
  "asc",
  "desc",
  "az",
  "za",
  "oldest_first",
  "newest_first",
  "smallest_first",
  "largest_first"
] as const;
export const reportSortDirectionSchema = z.enum(reportSortDirectionValues);

export const reportLookupKindValues = ["service", "professional", "client", "status"] as const;
export const reportLookupKindSchema = z.enum(reportLookupKindValues);

const reportFilterValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.union([z.string(), z.number(), z.boolean()]))
]);

export const reportMetricDefinitionSchema = z.object({
  name: nonEmptyStringSchema,
  operation: reportMetricOperationSchema,
  field: nonEmptyStringSchema
});

export const reportFilterConditionNodeSchema = z.object({
  id: entityIdSchema,
  kind: z.literal("condition"),
  connective: reportLogicalConnectiveSchema.nullable(),
  level: z.number().int().nonnegative(),
  field: nonEmptyStringSchema,
  operator: reportOperatorSchema,
  valueMode: reportValueModeSchema,
  value: reportFilterValueSchema,
  parameterName: optionalTrimmedStringSchema
});

export const reportFilterGroupStartNodeSchema = z.object({
  id: entityIdSchema,
  kind: z.literal("group_start"),
  connective: reportLogicalConnectiveSchema.nullable(),
  level: z.number().int().nonnegative(),
  collapsed: z.boolean().optional()
});

export const reportFilterGroupEndNodeSchema = z.object({
  id: entityIdSchema,
  kind: z.literal("group_end"),
  connective: reportLogicalConnectiveSchema.nullable(),
  level: z.number().int().nonnegative()
});

export const reportFilterNodeSchema = z.discriminatedUnion("kind", [
  reportFilterConditionNodeSchema,
  reportFilterGroupStartNodeSchema,
  reportFilterGroupEndNodeSchema
]);

export const reportSortDefinitionSchema = z.object({
  id: entityIdSchema,
  field: nonEmptyStringSchema,
  direction: reportSortDirectionSchema,
  priority: z.number().int().positive()
});

export const reportDefinitionSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  source: reportDefinitionSourceSchema,
  code: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  description: optionalTrimmedStringSchema,
  base: reportBuilderBaseSchema,
  visualization: reportVisualizationSchema,
  metric: reportMetricDefinitionSchema,
  filters: z.array(reportFilterNodeSchema),
  groupBy: z.array(nonEmptyStringSchema),
  orderBy: z.array(reportSortDefinitionSchema),
  authorName: optionalTrimmedStringSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema,
  locked: z.boolean().default(false)
});

export const reportDefinitionSummarySchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  source: reportDefinitionSourceSchema,
  code: nonEmptyStringSchema,
  name: nonEmptyStringSchema,
  description: optionalTrimmedStringSchema,
  base: reportBuilderBaseSchema,
  visualization: reportVisualizationSchema,
  authorName: optionalTrimmedStringSchema,
  updatedAt: dateTimeStringSchema,
  locked: z.boolean().default(false)
});

export const reportCatalogFieldSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  type: reportFieldTypeSchema,
  bases: z.array(reportBuilderBaseSchema),
  filterable: z.boolean(),
  groupable: z.boolean(),
  sortable: z.boolean(),
  operators: z.array(reportOperatorSchema),
  aggregations: z.array(reportMetricOperationSchema),
  lookupKind: reportLookupKindSchema.optional()
});

export const reportBuilderBaseOptionSchema = z.object({
  id: reportBuilderBaseSchema,
  label: nonEmptyStringSchema,
  description: optionalTrimmedStringSchema
});

export const reportBuilderCatalogSchema = contractEnvelopeSchema.extend({
  baseOptions: z.array(reportBuilderBaseOptionSchema),
  fields: z.array(reportCatalogFieldSchema),
  groupByOptions: z.array(
    z.object({
      id: nonEmptyStringSchema,
      label: nonEmptyStringSchema,
      bases: z.array(reportBuilderBaseSchema)
    })
  ),
  systemDefinitions: z.array(reportDefinitionSchema)
});

export const reportExecutionRequestSchema = contractEnvelopeSchema.extend({
  definition: reportDefinitionSchema
});

export const reportExecutionChipSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  value: nonEmptyStringSchema
});

export const reportExecutionKpiSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  value: z.union([z.string(), z.number()]),
  helper: optionalTrimmedStringSchema
});

export const reportExecutionTableSchema = z.object({
  columns: z.array(
    z.object({
      id: nonEmptyStringSchema,
      label: nonEmptyStringSchema
    })
  ),
  rows: z.array(
    z.object({
      id: nonEmptyStringSchema,
      cells: z.array(z.union([z.string(), z.number()]))
    })
  ),
  emptyMessage: optionalTrimmedStringSchema
});

export const reportExecutionResponseSchema = contractEnvelopeSchema.extend({
  definition: reportDefinitionSchema,
  previewExpression: nonEmptyStringSchema,
  appliedFilters: z.array(reportExecutionChipSchema),
  kpis: z.array(reportExecutionKpiSchema),
  table: reportExecutionTableSchema.optional(),
  generatedAt: dateTimeStringSchema
});

export type ReportDefinitionSource = z.infer<typeof reportDefinitionSourceSchema>;
export type ReportBuilderBase = z.infer<typeof reportBuilderBaseSchema>;
export type ReportBuilderBaseOption = z.infer<typeof reportBuilderBaseOptionSchema>;
export type ReportVisualization = z.infer<typeof reportVisualizationSchema>;
export type ReportMetricOperation = z.infer<typeof reportMetricOperationSchema>;
export type ReportFieldType = z.infer<typeof reportFieldTypeSchema>;
export type ReportOperator = z.infer<typeof reportOperatorSchema>;
export type ReportLogicalConnective = z.infer<typeof reportLogicalConnectiveSchema>;
export type ReportValueMode = z.infer<typeof reportValueModeSchema>;
export type ReportSortDirection = z.infer<typeof reportSortDirectionSchema>;
export type ReportLookupKind = z.infer<typeof reportLookupKindSchema>;
export type ReportMetricDefinition = z.infer<typeof reportMetricDefinitionSchema>;
export type ReportFilterConditionNode = z.infer<typeof reportFilterConditionNodeSchema>;
export type ReportFilterGroupStartNode = z.infer<typeof reportFilterGroupStartNodeSchema>;
export type ReportFilterGroupEndNode = z.infer<typeof reportFilterGroupEndNodeSchema>;
export type ReportFilterNode = z.infer<typeof reportFilterNodeSchema>;
export type ReportSortDefinition = z.infer<typeof reportSortDefinitionSchema>;
export type ReportDefinition = z.infer<typeof reportDefinitionSchema>;
export type ReportDefinitionSummary = z.infer<typeof reportDefinitionSummarySchema>;
export type ReportCatalogField = z.infer<typeof reportCatalogFieldSchema>;
export type ReportBuilderCatalog = z.infer<typeof reportBuilderCatalogSchema>;
export type ReportExecutionRequest = z.infer<typeof reportExecutionRequestSchema>;
export type ReportExecutionChip = z.infer<typeof reportExecutionChipSchema>;
export type ReportExecutionKpi = z.infer<typeof reportExecutionKpiSchema>;
export type ReportExecutionTable = z.infer<typeof reportExecutionTableSchema>;
export type ReportExecutionResponse = z.infer<typeof reportExecutionResponseSchema>;
