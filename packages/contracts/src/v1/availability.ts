import { z } from "zod";

import {
  contractEnvelopeSchema,
  entityIdSchema,
  tenantIdSchema,
  timeOfDaySchema,
  weekdayIndexSchema
} from "./shared";

export const availabilityRangeSchema = z.object({
  startTime: timeOfDaySchema,
  endTime: timeOfDaySchema
});

export const availabilityRuleSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  professionalId: entityIdSchema,
  weekday: weekdayIndexSchema,
  faixa: availabilityRangeSchema
});

export const availabilityRuleInputSchema = z.object({
  weekday: weekdayIndexSchema,
  faixa: availabilityRangeSchema
});

export const setAvailabilityRulesSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  professionalId: entityIdSchema,
  rules: z.array(availabilityRuleInputSchema)
});

export type AvailabilityRange = z.infer<typeof availabilityRangeSchema>;
export type AvailabilityRule = z.infer<typeof availabilityRuleSchema>;
export type AvailabilityRuleInput = z.infer<typeof availabilityRuleInputSchema>;
export type SetAvailabilityRulesCommand = z.infer<typeof setAvailabilityRulesSchema>;
