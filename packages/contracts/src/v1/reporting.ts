import { z } from "zod";

import {
  contractEnvelopeSchema,
  dateTimeStringSchema,
  emailSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  phoneSchema
} from "./shared";

export const reportingRangeValues = ["7d", "30d", "all"] as const;
export const reportingRangeSchema = z.enum(reportingRangeValues);

export const reportingReturnWindowValues = ["30d", "60d", "90d"] as const;
export const reportingReturnWindowSchema = z.enum(reportingReturnWindowValues);

const nonNegativeIntegerSchema = z.number().int().nonnegative();
const nonNegativeNumberSchema = z.number().nonnegative();

export const reportingFiltersSchema = z.object({
  range: reportingRangeSchema,
  serviceId: entityIdSchema.optional(),
  professionalId: entityIdSchema.optional(),
  returnWindow: reportingReturnWindowSchema
});

export const reportingMetricSummarySchema = z.object({
  bookingsCount: nonNegativeIntegerSchema,
  completedCount: nonNegativeIntegerSchema,
  cancelledCount: nonNegativeIntegerSchema,
  noShowCount: nonNegativeIntegerSchema,
  recognizedRevenue: moneyAmountSchema,
  approvedOnlineRevenue: moneyAmountSchema,
  averageTicket: moneyAmountSchema,
  uniqueClients: nonNegativeIntegerSchema
});

export const reportingGroupSummarySchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  bookingsCount: nonNegativeIntegerSchema,
  completedCount: nonNegativeIntegerSchema,
  recognizedRevenue: moneyAmountSchema,
  approvedOnlineRevenue: moneyAmountSchema,
  averageTicket: moneyAmountSchema,
  uniqueClients: nonNegativeIntegerSchema
});

export const reportingReturnBucketSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  clientsCount: nonNegativeIntegerSchema
});

export const reportingInactiveClientSnapshotSchema = z.object({
  clientId: entityIdSchema,
  nome: nonEmptyStringSchema,
  email: emailSchema.optional(),
  telefone: phoneSchema.optional(),
  origem: optionalTrimmedStringSchema,
  completedBookings: nonNegativeIntegerSchema,
  recognizedRevenue: moneyAmountSchema,
  lastCompletedAt: dateTimeStringSchema.optional(),
  daysSinceLastCompleted: nonNegativeIntegerSchema.optional(),
  averageRecurrenceDays: nonNegativeNumberSchema.nullable()
});

export const reportingClientRecurrenceSummarySchema = z.object({
  window: reportingReturnWindowSchema,
  returningCount: nonNegativeIntegerSchema,
  inactiveCount: nonNegativeIntegerSchema,
  neverCompletedCount: nonNegativeIntegerSchema,
  clientsWithRecurrence: nonNegativeIntegerSchema,
  averageRecurrenceDays: nonNegativeNumberSchema.nullable(),
  returnBuckets: z.array(reportingReturnBucketSchema),
  inactiveClients: z.array(reportingInactiveClientSnapshotSchema)
});

export const adminReportsReadModelSchema = contractEnvelopeSchema.extend({
  filters: reportingFiltersSchema,
  comparisonEnabled: z.boolean(),
  current: reportingMetricSummarySchema,
  previous: reportingMetricSummarySchema.optional(),
  services: z.array(reportingGroupSummarySchema),
  professionals: z.array(reportingGroupSummarySchema),
  clientRecurrence: reportingClientRecurrenceSummarySchema
});

export type ReportingRange = z.infer<typeof reportingRangeSchema>;
export type ReportingReturnWindow = z.infer<typeof reportingReturnWindowSchema>;
export type ReportingFilters = z.infer<typeof reportingFiltersSchema>;
export type ReportingMetricSummary = z.infer<typeof reportingMetricSummarySchema>;
export type ReportingGroupSummary = z.infer<typeof reportingGroupSummarySchema>;
export type ReportingReturnBucket = z.infer<typeof reportingReturnBucketSchema>;
export type ReportingInactiveClientSnapshot = z.infer<typeof reportingInactiveClientSnapshotSchema>;
export type ReportingClientRecurrenceSummary = z.infer<
  typeof reportingClientRecurrenceSummarySchema
>;
export type AdminReportsReadModel = z.infer<typeof adminReportsReadModelSchema>;
