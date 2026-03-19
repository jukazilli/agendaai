import { z } from "zod";

import { currencyIdSchema } from "./payment";
import {
  contractEnvelopeSchema,
  dateTimeStringSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema
} from "./shared";

export const cashEntryKindValues = ["recognized_revenue", "online_payment"] as const;
export const cashEntryKindSchema = z.enum(cashEntryKindValues);

export const cashEntryStatusValues = ["open", "reversed"] as const;
export const cashEntryStatusSchema = z.enum(cashEntryStatusValues);

export const cashEntrySourceValues = ["booking_completion", "payment_reconciliation"] as const;
export const cashEntrySourceSchema = z.enum(cashEntrySourceValues);

export const cashEntrySchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  bookingId: entityIdSchema,
  clientId: entityIdSchema,
  serviceId: entityIdSchema,
  professionalId: entityIdSchema,
  paymentIntentId: entityIdSchema.optional(),
  kind: cashEntryKindSchema,
  source: cashEntrySourceSchema,
  status: cashEntryStatusSchema,
  currencyId: currencyIdSchema,
  amount: moneyAmountSchema,
  occurredAt: dateTimeStringSchema,
  description: nonEmptyStringSchema,
  note: optionalTrimmedStringSchema
});

export type CashEntry = z.infer<typeof cashEntrySchema>;
export type CashEntryKind = z.infer<typeof cashEntryKindSchema>;
export type CashEntryStatus = z.infer<typeof cashEntryStatusSchema>;
export type CashEntrySource = z.infer<typeof cashEntrySourceSchema>;
