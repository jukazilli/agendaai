import { z } from "zod";

import {
  contractEnvelopeSchema,
  emailSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema
} from "./shared";

export const paymentProviderValues = ["mercado_pago"] as const;
export const paymentProviderSchema = z.enum(paymentProviderValues);

export const paymentCheckoutModeValues = ["checkout_pro", "checkout_transparente"] as const;
export const paymentCheckoutModeSchema = z.enum(paymentCheckoutModeValues);

export const paymentCollectionModeValues = ["none", "deposit", "full"] as const;
export const paymentCollectionModeSchema = z.enum(paymentCollectionModeValues);

export const paymentChargeTypeValues = ["fixed", "percentage"] as const;
export const paymentChargeTypeSchema = z.enum(paymentChargeTypeValues);

export const paymentMethodValues = [
  "pix",
  "credit_card",
  "debit_card",
  "account_money",
  "ticket"
] as const;
export const paymentMethodSchema = z.enum(paymentMethodValues);

export const paymentProviderStatusValues = ["draft", "active", "disabled"] as const;
export const paymentProviderStatusSchema = z.enum(paymentProviderStatusValues);

export const paymentIntentStatusValues = [
  "draft",
  "pending",
  "authorized",
  "approved",
  "in_process",
  "in_mediation",
  "rejected",
  "cancelled",
  "refunded",
  "charged_back",
  "expired"
] as const;
export const paymentIntentStatusSchema = z.enum(paymentIntentStatusValues);

export const currencyIdValues = ["BRL"] as const;
export const currencyIdSchema = z.enum(currencyIdValues);

const percentageSchema = z.number().gt(0).lte(100);
const installmentsSchema = z.number().int().min(1).max(24);
const expirationMinutesSchema = z.number().int().positive().max(1440);
const urlSchema = z.string().trim().url();

export const servicePaymentPolicySchema = z
  .object({
    collectionMode: paymentCollectionModeSchema,
    provider: paymentProviderSchema.optional(),
    checkoutMode: paymentCheckoutModeSchema.optional(),
    chargeType: paymentChargeTypeSchema.optional(),
    fixedAmount: moneyAmountSchema.optional(),
    percentage: percentageSchema.optional(),
    currencyId: currencyIdSchema,
    acceptedMethods: z.array(paymentMethodSchema),
    maxInstallments: installmentsSchema.optional(),
    capture: z.boolean(),
    expirationMinutes: expirationMinutesSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.chargeType === "fixed" && value.fixedAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fixedAmount is required when chargeType is fixed.",
        path: ["fixedAmount"]
      });
    }

    if (value.chargeType === "percentage" && value.percentage === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "percentage is required when chargeType is percentage.",
        path: ["percentage"]
      });
    }
  });

export const defaultServicePaymentPolicy: ServicePaymentPolicy = {
  collectionMode: "none",
  currencyId: "BRL",
  acceptedMethods: ["pix", "credit_card"],
  capture: true
};

export const mercadoPagoBackUrlsSchema = z.object({
  success: urlSchema,
  pending: urlSchema,
  failure: urlSchema
});

export const tenantPaymentSettingsSchema = contractEnvelopeSchema
  .extend({
    tenantId: tenantIdSchema,
    provider: z.literal("mercado_pago"),
    status: paymentProviderStatusSchema,
    checkoutMode: paymentCheckoutModeSchema,
    publicKey: optionalTrimmedStringSchema,
    accessToken: optionalTrimmedStringSchema,
    webhookSecret: optionalTrimmedStringSchema,
    collectorId: optionalTrimmedStringSchema,
    sponsorId: optionalTrimmedStringSchema,
    statementDescriptor: optionalTrimmedStringSchema,
    notificationUrl: urlSchema.optional(),
    backUrls: mercadoPagoBackUrlsSchema.optional(),
    autoReturn: z.enum(["approved", "all"]).optional(),
    binaryMode: z.boolean(),
    defaultInstallments: installmentsSchema.optional(),
    expirationMinutes: expirationMinutesSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.status !== "active") {
      return;
    }

    if (!value.publicKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "publicKey is required when Mercado Pago settings are active.",
        path: ["publicKey"]
      });
    }

    if (!value.accessToken) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "accessToken is required when Mercado Pago settings are active.",
        path: ["accessToken"]
      });
    }

    if (!value.notificationUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "notificationUrl is required when Mercado Pago settings are active.",
        path: ["notificationUrl"]
      });
    }

    if (!value.backUrls) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "backUrls are required when Mercado Pago settings are active.",
        path: ["backUrls"]
      });
    }

    if (value.notificationUrl && !isHttpsUrl(value.notificationUrl)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "notificationUrl must use HTTPS when Mercado Pago settings are active.",
        path: ["notificationUrl"]
      });
    }

    if (value.backUrls) {
      for (const [key, url] of Object.entries(value.backUrls)) {
        if (!isHttpsUrl(url)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `backUrls.${key} must use HTTPS when Mercado Pago settings are active.`,
            path: ["backUrls", key]
          });
        }
      }
    }
  });

export const createPaymentIntentCommandSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  bookingId: entityIdSchema,
  provider: paymentProviderSchema,
  checkoutMode: paymentCheckoutModeSchema,
  amount: moneyAmountSchema,
  currencyId: currencyIdSchema,
  externalReference: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  capture: z.boolean(),
  notificationUrl: urlSchema.optional(),
  installments: installmentsSchema.optional(),
  payer: z.object({
    email: emailSchema,
    firstName: optionalTrimmedStringSchema,
    lastName: optionalTrimmedStringSchema,
    identificationType: optionalTrimmedStringSchema,
    identificationNumber: optionalTrimmedStringSchema
  }),
  metadata: z.record(z.string(), z.string()).optional()
});

export const paymentIntentSchema = createPaymentIntentCommandSchema.extend({
  id: entityIdSchema,
  status: paymentIntentStatusSchema,
  statusDetail: optionalTrimmedStringSchema,
  paymentId: optionalTrimmedStringSchema,
  preferenceId: optionalTrimmedStringSchema,
  initPoint: optionalTrimmedStringSchema,
  sandboxInitPoint: optionalTrimmedStringSchema
});

export const paymentWebhookNotificationSchema = z.object({
  action: nonEmptyStringSchema,
  apiVersion: optionalTrimmedStringSchema,
  data: z.object({
    id: z.union([z.string(), z.number()]).transform((value) => String(value))
  }),
  dateCreated: optionalTrimmedStringSchema,
  id: z.union([z.string(), z.number()]).transform((value) => String(value)),
  liveMode: z.boolean().optional(),
  type: nonEmptyStringSchema,
  userId: z.union([z.string(), z.number()]).transform((value) => String(value)).optional()
});

export type ServicePaymentPolicy = z.infer<typeof servicePaymentPolicySchema>;
export type TenantPaymentSettings = z.infer<typeof tenantPaymentSettingsSchema>;
export type CreatePaymentIntentCommand = z.infer<typeof createPaymentIntentCommandSchema>;
export type PaymentIntent = z.infer<typeof paymentIntentSchema>;
export type PaymentWebhookNotification = z.infer<typeof paymentWebhookNotificationSchema>;

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
