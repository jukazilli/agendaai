import { z } from "zod";

import { clientContactInputSchema } from "./client";
import {
  bookingStatusSchema,
  contractEnvelopeSchema,
  dateTimeStringSchema,
  entityIdSchema,
  tenantIdSchema,
  tenantSlugSchema
} from "./shared";

export const bookingSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  clientId: entityIdSchema,
  serviceId: entityIdSchema,
  professionalId: entityIdSchema,
  status: bookingStatusSchema,
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema
});

export const createBookingCommandSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  clientId: entityIdSchema,
  serviceId: entityIdSchema,
  professionalId: entityIdSchema,
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema,
  status: bookingStatusSchema
});

export const publicCreateBookingInputSchema = contractEnvelopeSchema.extend({
  slug: tenantSlugSchema,
  serviceId: entityIdSchema,
  professionalId: entityIdSchema,
  startAt: dateTimeStringSchema,
  endAt: dateTimeStringSchema,
  client: clientContactInputSchema,
  exigeSinal: z.boolean()
});

export type Booking = z.infer<typeof bookingSchema>;
export type CreateBookingCommand = z.infer<typeof createBookingCommandSchema>;
export type PublicCreateBookingInput = z.infer<typeof publicCreateBookingInputSchema>;
