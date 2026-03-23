import { z } from "zod";

import {
  contractEnvelopeSchema,
  dateStringSchema,
  dateTimeStringSchema,
  entityIdSchema,
  moneyAmountSchema,
  nonEmptyStringSchema,
  optionalTrimmedStringSchema,
  tenantIdSchema,
  weekdayIndexSchema
} from "./shared";

export const bankSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  bacenCode: z.string().trim().regex(/^\d{3}$/),
  nomeBanco: nonEmptyStringSchema,
  agencia: nonEmptyStringSchema,
  conta: nonEmptyStringSchema,
  ativo: z.boolean(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const createBankSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  bacenCode: z.string().trim().regex(/^\d{3}$/),
  nomeBanco: nonEmptyStringSchema,
  agencia: nonEmptyStringSchema,
  conta: nonEmptyStringSchema,
  ativo: z.boolean().optional()
});

export const bankBalanceSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  bankId: entityIdSchema,
  saldoInicial: moneyAmountSchema,
  saldoAtual: z.number().finite(),
  dataSaldoInicial: dateStringSchema,
  observacao: optionalTrimmedStringSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const createBankBalanceSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  bankId: entityIdSchema,
  saldoInicial: moneyAmountSchema,
  dataSaldoInicial: dateStringSchema,
  observacao: optionalTrimmedStringSchema
});

export const financialScheduleTypeValues = ["unica", "recorrente"] as const;
export const financialScheduleTypeSchema = z.enum(financialScheduleTypeValues);

export const financialRecurrencePatternValues = ["semanal", "mensal"] as const;
export const financialRecurrencePatternSchema = z.enum(financialRecurrencePatternValues);

export const automaticSettlementValues = ["sim", "nao"] as const;
export const automaticSettlementSchema = z.enum(automaticSettlementValues);

export const installmentCounterSchema = z.object({
  current: z.number().int().positive(),
  total: z.number().int().positive()
});

export const revenueScheduleOriginValues = ["manual", "booking", "pagamento", "fechamento_caixa"] as const;
export const revenueScheduleOriginSchema = z.enum(revenueScheduleOriginValues);

export const revenueScheduleStatusValues = ["aberta", "recebida", "cancelada", "estornada"] as const;
export const revenueScheduleStatusSchema = z.enum(revenueScheduleStatusValues);

export const revenueScheduleSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataVencimento: dateStringSchema,
  tipo: financialScheduleTypeSchema,
  recorrencia: financialRecurrencePatternSchema.optional(),
  quantidadeOcorrencias: z.number().int().positive().optional(),
  diaSemanaVencimento: weekdayIndexSchema.optional(),
  status: revenueScheduleStatusSchema,
  origem: revenueScheduleOriginSchema,
  bankId: entityIdSchema.optional(),
  baixaAutomatica: automaticSettlementSchema,
  bookingId: entityIdSchema.optional(),
  clientId: entityIdSchema.optional(),
  serviceId: entityIdSchema.optional(),
  professionalId: entityIdSchema.optional(),
  cashEntryId: entityIdSchema.optional(),
  grupoRecorrenciaId: entityIdSchema.optional(),
  ocorrenciaIndice: z.number().int().positive().optional(),
  ocorrenciaTotal: z.number().int().positive().optional(),
  plannedMovementId: entityIdSchema.optional(),
  baixaMovementId: entityIdSchema.optional(),
  estornoMovementId: entityIdSchema.optional(),
  settledAt: dateTimeStringSchema.optional(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const createRevenueScheduleSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataVencimento: dateStringSchema,
  tipo: financialScheduleTypeSchema,
  recorrencia: financialRecurrencePatternSchema.optional(),
  quantidadeOcorrencias: z.number().int().positive().optional(),
  diaSemanaVencimento: weekdayIndexSchema.optional(),
  bankId: entityIdSchema.optional(),
  baixaAutomatica: automaticSettlementSchema,
  bookingId: entityIdSchema.optional(),
  clientId: entityIdSchema.optional(),
  serviceId: entityIdSchema.optional(),
  professionalId: entityIdSchema.optional()
});

export const expenseScheduleOriginValues = ["manual", "fechamento_caixa"] as const;
export const expenseScheduleOriginSchema = z.enum(expenseScheduleOriginValues);

export const expenseScheduleStatusValues = ["aberta", "paga", "cancelada", "estornada"] as const;
export const expenseScheduleStatusSchema = z.enum(expenseScheduleStatusValues);

export const expenseScheduleSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataVencimento: dateStringSchema,
  tipo: financialScheduleTypeSchema,
  recorrencia: financialRecurrencePatternSchema.optional(),
  quantidadeOcorrencias: z.number().int().positive().optional(),
  diaSemanaVencimento: weekdayIndexSchema.optional(),
  status: expenseScheduleStatusSchema,
  origem: expenseScheduleOriginSchema,
  beneficiarioNome: optionalTrimmedStringSchema,
  bankId: entityIdSchema.optional(),
  baixaAutomatica: automaticSettlementSchema,
  grupoRecorrenciaId: entityIdSchema.optional(),
  ocorrenciaIndice: z.number().int().positive().optional(),
  ocorrenciaTotal: z.number().int().positive().optional(),
  plannedMovementId: entityIdSchema.optional(),
  baixaMovementId: entityIdSchema.optional(),
  estornoMovementId: entityIdSchema.optional(),
  settledAt: dateTimeStringSchema.optional(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const createExpenseScheduleSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  codigo: optionalTrimmedStringSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataVencimento: dateStringSchema,
  tipo: financialScheduleTypeSchema,
  recorrencia: financialRecurrencePatternSchema.optional(),
  quantidadeOcorrencias: z.number().int().positive().optional(),
  diaSemanaVencimento: weekdayIndexSchema.optional(),
  beneficiarioNome: optionalTrimmedStringSchema,
  bankId: entityIdSchema.optional(),
  baixaAutomatica: automaticSettlementSchema
});

export const bankMovementTypeValues = ["entrada", "saida", "transferencia", "ajuste", "taxa", "estorno"] as const;
export const bankMovementTypeSchema = z.enum(bankMovementTypeValues);

export const bankMovementStatusValues = ["previsto", "lancado", "estornado", "cancelado"] as const;
export const bankMovementStatusSchema = z.enum(bankMovementStatusValues);

export const bankMovementSourceTypeValues = [
  "manual_receipt",
  "manual_payment",
  "manual_adjustment",
  "fee",
  "transfer",
  "revenue_schedule",
  "expense_schedule",
  "cash_entry",
  "booking",
  "cash_close",
  "reversal"
] as const;
export const bankMovementSourceTypeSchema = z.enum(bankMovementSourceTypeValues);

export const bankMovementSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  tipo: bankMovementTypeSchema,
  bankIdOrigem: entityIdSchema.optional(),
  bankIdDestino: entityIdSchema.optional(),
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  beneficiarioNome: optionalTrimmedStringSchema,
  dataMovimento: dateTimeStringSchema,
  status: bankMovementStatusSchema,
  sourceType: bankMovementSourceTypeSchema,
  sourceId: entityIdSchema.optional(),
  reversedMovementId: entityIdSchema.optional(),
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const createBankReceiptSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  bankIdDestino: entityIdSchema,
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  dataMovimento: dateTimeStringSchema.optional(),
  revenueId: entityIdSchema.optional(),
  cashEntryId: entityIdSchema.optional(),
  bookingId: entityIdSchema.optional()
});

export const createBankPaymentSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  bankIdOrigem: entityIdSchema,
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  dataMovimento: dateTimeStringSchema.optional(),
  beneficiarioNome: optionalTrimmedStringSchema,
  expenseId: entityIdSchema.optional()
});

export const createBankTransferSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  bankIdOrigem: entityIdSchema,
  bankIdDestino: entityIdSchema,
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  dataMovimento: dateTimeStringSchema.optional()
});

export const createBankMovementSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  tipo: bankMovementTypeSchema,
  bankIdOrigem: entityIdSchema.optional(),
  bankIdDestino: entityIdSchema.optional(),
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  beneficiarioNome: optionalTrimmedStringSchema,
  dataMovimento: dateTimeStringSchema.optional(),
  sourceType: bankMovementSourceTypeSchema.optional()
});

export const reverseBankMovementSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  movementId: entityIdSchema,
  historico: optionalTrimmedStringSchema,
  dataMovimento: dateTimeStringSchema.optional()
});

export const cashCloseStatusValues = ["fechado", "estornado"] as const;
export const cashCloseStatusSchema = z.enum(cashCloseStatusValues);

export const cashCloseSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  codigo: nonEmptyStringSchema,
  bankId: entityIdSchema,
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  totalEntradas: moneyAmountSchema,
  totalSaidas: moneyAmountSchema,
  saldoFechado: moneyAmountSchema,
  status: cashCloseStatusSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const cashCloseItemDirectionValues = ["entrada", "saida"] as const;
export const cashCloseItemDirectionSchema = z.enum(cashCloseItemDirectionValues);

export const cashCloseItemSourceValues = ["revenue_schedule", "expense_schedule", "cash_entry", "booking"] as const;
export const cashCloseItemSourceSchema = z.enum(cashCloseItemSourceValues);

export const cashCloseItemSchema = contractEnvelopeSchema.extend({
  id: entityIdSchema,
  tenantId: tenantIdSchema,
  cashCloseId: entityIdSchema,
  sourceType: cashCloseItemSourceSchema,
  sourceId: entityIdSchema,
  tipo: cashCloseItemDirectionSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  movementId: entityIdSchema,
  createdAt: dateTimeStringSchema,
  updatedAt: dateTimeStringSchema
});

export const cashCloseSelectionItemSchema = z.object({
  sourceType: cashCloseItemSourceSchema,
  sourceId: entityIdSchema
});

export const createCashCloseSchema = contractEnvelopeSchema.extend({
  tenantId: tenantIdSchema,
  bankId: entityIdSchema,
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  items: z.array(cashCloseSelectionItemSchema).optional()
});

export const financialRangeValues = ["7d", "30d", "all"] as const;
export const financialRangeSchema = z.enum(financialRangeValues);

export const financialSituationValues = ["all", "aberto", "baixado"] as const;
export const financialSituationSchema = z.enum(financialSituationValues);

export const financialFiltersSchema = z.object({
  range: financialRangeSchema,
  bankId: entityIdSchema.optional(),
  situation: financialSituationSchema
});

export const financialSummaryMetricSchema = z.object({
  id: nonEmptyStringSchema,
  label: nonEmptyStringSchema,
  value: z.union([z.string(), z.number()]),
  helper: optionalTrimmedStringSchema
});

export const bankBalanceSnapshotSchema = z.object({
  bankId: entityIdSchema,
  codigo: nonEmptyStringSchema,
  bacenCode: z.string().trim().regex(/^\d{3}$/),
  nomeBanco: nonEmptyStringSchema,
  agencia: nonEmptyStringSchema,
  conta: nonEmptyStringSchema,
  saldoInicial: moneyAmountSchema,
  saldoAtual: z.number().finite(),
  ativo: z.boolean()
});

export const schedulePreviewSchema = z.object({
  id: entityIdSchema,
  codigo: nonEmptyStringSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataVencimento: dateStringSchema,
  status: nonEmptyStringSchema,
  origem: nonEmptyStringSchema,
  pessoa: optionalTrimmedStringSchema,
  bankId: entityIdSchema.optional(),
  bankLabel: optionalTrimmedStringSchema,
  parcela: installmentCounterSchema.optional()
});

export const bankMovementPreviewSchema = z.object({
  id: entityIdSchema,
  codigo: nonEmptyStringSchema,
  tipo: bankMovementTypeSchema,
  valor: moneyAmountSchema,
  historico: nonEmptyStringSchema,
  dataMovimento: dateTimeStringSchema,
  contaOrigem: optionalTrimmedStringSchema,
  contaDestino: optionalTrimmedStringSchema,
  status: bankMovementStatusSchema,
  origem: nonEmptyStringSchema.optional()
});

export const cashCloseSummaryPreviewSchema = z.object({
  id: entityIdSchema,
  codigo: nonEmptyStringSchema,
  bankId: entityIdSchema,
  bankLabel: nonEmptyStringSchema,
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  totalEntradas: moneyAmountSchema,
  totalSaidas: moneyAmountSchema,
  saldoFechado: moneyAmountSchema,
  status: cashCloseStatusSchema
});

export const cashClosePreviewItemStatusValues = ["pendente", "baixado"] as const;
export const cashClosePreviewItemStatusSchema = z.enum(cashClosePreviewItemStatusValues);

export const cashClosePreviewItemSchema = z.object({
  sourceType: cashCloseItemSourceSchema,
  sourceId: entityIdSchema,
  tipo: cashCloseItemDirectionSchema,
  descricao: nonEmptyStringSchema,
  valor: moneyAmountSchema,
  dataReferencia: dateStringSchema,
  plannedMovementId: entityIdSchema.optional(),
  movementId: entityIdSchema.optional(),
  bankId: entityIdSchema.optional(),
  bankLabel: optionalTrimmedStringSchema,
  status: cashClosePreviewItemStatusSchema
});

export const cashCloseWorkspacePreviewSchema = z.object({
  bankId: entityIdSchema,
  dateFrom: dateStringSchema,
  dateTo: dateStringSchema,
  pending: z.array(cashClosePreviewItemSchema),
  settled: z.array(cashClosePreviewItemSchema)
});

export const adminFinancialReadModelSchema = contractEnvelopeSchema.extend({
  filters: financialFiltersSchema,
  summary: z.array(financialSummaryMetricSchema),
  bankAccounts: z.array(bankBalanceSnapshotSchema),
  receivables: z.array(schedulePreviewSchema),
  payables: z.array(schedulePreviewSchema),
  recentMovements: z.array(bankMovementPreviewSchema),
  recentClosings: z.array(cashCloseSummaryPreviewSchema).optional()
});

export type Bank = z.infer<typeof bankSchema>;
export type CreateBankCommand = z.infer<typeof createBankSchema>;
export type BankBalance = z.infer<typeof bankBalanceSchema>;
export type CreateBankBalanceCommand = z.infer<typeof createBankBalanceSchema>;
export type FinancialScheduleType = z.infer<typeof financialScheduleTypeSchema>;
export type FinancialRecurrencePattern = z.infer<typeof financialRecurrencePatternSchema>;
export type AutomaticSettlement = z.infer<typeof automaticSettlementSchema>;
export type RevenueSchedule = z.infer<typeof revenueScheduleSchema>;
export type CreateRevenueScheduleCommand = z.infer<typeof createRevenueScheduleSchema>;
export type RevenueScheduleOrigin = z.infer<typeof revenueScheduleOriginSchema>;
export type RevenueScheduleStatus = z.infer<typeof revenueScheduleStatusSchema>;
export type ExpenseSchedule = z.infer<typeof expenseScheduleSchema>;
export type CreateExpenseScheduleCommand = z.infer<typeof createExpenseScheduleSchema>;
export type ExpenseScheduleOrigin = z.infer<typeof expenseScheduleOriginSchema>;
export type ExpenseScheduleStatus = z.infer<typeof expenseScheduleStatusSchema>;
export type BankMovement = z.infer<typeof bankMovementSchema>;
export type BankMovementType = z.infer<typeof bankMovementTypeSchema>;
export type BankMovementStatus = z.infer<typeof bankMovementStatusSchema>;
export type BankMovementSourceType = z.infer<typeof bankMovementSourceTypeSchema>;
export type CreateBankReceiptCommand = z.infer<typeof createBankReceiptSchema>;
export type CreateBankPaymentCommand = z.infer<typeof createBankPaymentSchema>;
export type CreateBankTransferCommand = z.infer<typeof createBankTransferSchema>;
export type CreateBankMovementCommand = z.infer<typeof createBankMovementSchema>;
export type ReverseBankMovementCommand = z.infer<typeof reverseBankMovementSchema>;
export type CashClose = z.infer<typeof cashCloseSchema>;
export type CashCloseItem = z.infer<typeof cashCloseItemSchema>;
export type CashCloseSelectionItem = z.infer<typeof cashCloseSelectionItemSchema>;
export type CreateCashCloseCommand = z.infer<typeof createCashCloseSchema>;
export type CashCloseStatus = z.infer<typeof cashCloseStatusSchema>;
export type CashClosePreviewItemStatus = z.infer<typeof cashClosePreviewItemStatusSchema>;
export type FinancialRange = z.infer<typeof financialRangeSchema>;
export type FinancialSituation = z.infer<typeof financialSituationSchema>;
export type FinancialFilters = z.infer<typeof financialFiltersSchema>;
export type FinancialSummaryMetric = z.infer<typeof financialSummaryMetricSchema>;
export type BankBalanceSnapshot = z.infer<typeof bankBalanceSnapshotSchema>;
export type SchedulePreview = z.infer<typeof schedulePreviewSchema>;
export type BankMovementPreview = z.infer<typeof bankMovementPreviewSchema>;
export type CashCloseSummaryPreview = z.infer<typeof cashCloseSummaryPreviewSchema>;
export type CashClosePreviewItem = z.infer<typeof cashClosePreviewItemSchema>;
export type CashClosePreview = z.infer<typeof cashCloseWorkspacePreviewSchema>;
export type AdminFinancialReadModel = z.infer<typeof adminFinancialReadModelSchema>;
