import type {
  AdminFinancialReadModel,
  AdminReportsReadModel,
  Bank,
  BankBalance,
  BankMovement,
  CashClose,
  ReportBuilderCatalog,
  ReportDefinition,
  ReportExecutionResponse,
  AdminSessionClaimsContract,
  AvailabilityRule,
  Booking,
  CashEntry,
  Client,
  ExpenseSchedule,
  TenantBranding,
  CreateTenantCommand,
  PaymentIntent,
  Professional,
  RevenueSchedule,
  Service,
  Tenant,
  TenantPaymentSettings
} from "@agendaai/contracts";

export const DEFAULT_ADMIN_API_BASE_URL = "http://127.0.0.1:3333";

export interface AdminSessionRecord {
  readonly token: string;
  readonly claims: AdminSessionClaimsContract;
}

export interface AdminSessionEnvelope {
  readonly claims: AdminSessionClaimsContract;
  readonly tenant: Tenant;
}

export interface TenantOnboardingResponse {
  readonly tenant: Tenant;
  readonly session: AdminSessionRecord;
}

export interface AdminBootstrapPayload {
  readonly session: AdminSessionEnvelope;
  readonly paymentSettings?: TenantPaymentSettings;
  readonly paymentIntents: PaymentIntent[];
  readonly cashEntries: CashEntry[];
  readonly services: Service[];
  readonly professionals: Professional[];
  readonly clients: Client[];
  readonly bookings: Booking[];
  readonly banks: Bank[];
  readonly bankBalances: BankBalance[];
  readonly revenueSchedules: RevenueSchedule[];
  readonly expenseSchedules: ExpenseSchedule[];
  readonly bankMovements: BankMovement[];
  readonly cashCloses: CashClose[];
  readonly financialReadModel: AdminFinancialReadModel;
}

interface JsonRequestOptions {
  readonly method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  readonly token?: string;
  readonly body?: unknown;
}

export interface BookingPatchPayload {
  readonly clientId?: string;
  readonly serviceId?: string;
  readonly professionalId?: string;
  readonly status?: Booking["status"];
  readonly startAt?: string;
  readonly endAt?: string;
}

export interface AvailabilitySlot {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly startAt: string;
  readonly endAt: string;
}

export interface PaymentIntentSyncPayload {
  readonly paymentId?: string;
}

export interface ReportsReadModelQuery {
  readonly range: "7d" | "30d" | "all";
  readonly returnWindow: "30d" | "60d" | "90d";
  readonly serviceId?: string;
  readonly professionalId?: string;
}

export interface FinancialReadModelQuery {
  readonly range: "7d" | "30d" | "all";
  readonly bankId?: string;
  readonly situation: "all" | "aberto" | "baixado";
}

export interface ExecuteReportDefinitionPayload {
  readonly definition: ReportDefinition;
}

interface ApiErrorPayload {
  readonly error?: string;
  readonly message?: string;
}

export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function resolveAdminApiBaseUrl(value: string): string {
  const trimmed = value.trim();
  const candidate = trimmed.length > 0 ? trimmed : DEFAULT_ADMIN_API_BASE_URL;
  return candidate.replace(/\/+$/, "");
}

export async function loginAdmin(
  apiBaseUrl: string,
  email: string,
  password: string
): Promise<AdminSessionRecord> {
  return await requestJson<AdminSessionRecord>(apiBaseUrl, "/v1/admin/auth/sessions", {
    method: "POST",
    body: {
      email,
      password
    }
  });
}

export async function createTenantOnboarding(
  apiBaseUrl: string,
  payload: Omit<CreateTenantCommand, "version">
): Promise<TenantOnboardingResponse> {
  const response = await requestJson<{
    tenant: Tenant;
    session: AdminSessionRecord;
  }>(apiBaseUrl, "/v1/onboarding/tenants", {
    method: "POST",
    body: payload
  });

  return {
    tenant: response.tenant,
    session: response.session
  };
}

export async function fetchAdminBootstrap(
  apiBaseUrl: string,
  token: string
): Promise<AdminBootstrapPayload> {
  const [
    session,
    paymentSettings,
    paymentIntents,
    cashEntries,
    services,
    professionals,
    clients,
    bookings,
    banks,
    bankBalances,
    revenueSchedules,
    expenseSchedules,
    bankMovements,
    cashCloses,
    financialReadModel
  ] =
    await Promise.all([
    requestJson<AdminSessionEnvelope>(apiBaseUrl, "/v1/admin/auth/session", {
      token
    }),
    requestJson<{ item?: TenantPaymentSettings }>(apiBaseUrl, "/v1/admin/payment-settings", {
      token
    }),
    requestJson<{ items: PaymentIntent[] }>(apiBaseUrl, "/v1/admin/payment-intents", {
      token
    }),
    requestJson<{ items: CashEntry[] }>(apiBaseUrl, "/v1/admin/cash-entries", {
      token
    }).catch((error) => {
      if (error instanceof AdminApiError && error.status === 404) {
        return { items: [] };
      }
      throw error;
    }),
    requestJson<{ items: Service[] }>(apiBaseUrl, "/v1/admin/services", {
      token
    }),
    requestJson<{ items: Professional[] }>(apiBaseUrl, "/v1/admin/professionals", {
      token
    }),
    requestJson<{ items: Client[] }>(apiBaseUrl, "/v1/admin/clients", {
      token
    }),
    requestJson<{ items: Booking[] }>(apiBaseUrl, "/v1/admin/bookings", {
      token
    }),
    requestJson<{ items: Bank[] }>(apiBaseUrl, "/v1/admin/banks", {
      token
    }),
    requestJson<{ items: BankBalance[] }>(apiBaseUrl, "/v1/admin/bank-balances", {
      token
    }),
    requestJson<{ items: RevenueSchedule[] }>(apiBaseUrl, "/v1/admin/revenues", {
      token
    }),
    requestJson<{ items: ExpenseSchedule[] }>(apiBaseUrl, "/v1/admin/expenses", {
      token
    }),
    requestJson<{ items: BankMovement[] }>(apiBaseUrl, "/v1/admin/bank-movements", {
      token
    }),
    requestJson<{ items: CashClose[] }>(apiBaseUrl, "/v1/admin/cash-closes", {
      token
    }).catch((error) => {
      if (error instanceof AdminApiError && error.status === 404) {
        return { items: [] };
      }
      throw error;
    }),
    fetchAdminFinancialReadModel(apiBaseUrl, token, {
      range: "30d",
      situation: "all"
    })
  ]);

  return {
    session,
    paymentSettings: paymentSettings.item,
    paymentIntents: paymentIntents.items,
    cashEntries: cashEntries.items,
    services: services.items,
    professionals: professionals.items,
    clients: clients.items,
    bookings: bookings.items,
    banks: banks.items,
    bankBalances: bankBalances.items,
    revenueSchedules: revenueSchedules.items,
    expenseSchedules: expenseSchedules.items,
    bankMovements: bankMovements.items,
    cashCloses: cashCloses.items,
    financialReadModel
  };
}

export async function fetchAdminReportsReadModel(
  apiBaseUrl: string,
  token: string,
  query: ReportsReadModelQuery
): Promise<AdminReportsReadModel> {
  const url = new URL("/v1/admin/read-models/reports", `${resolveAdminApiBaseUrl(apiBaseUrl)}/`);
  url.searchParams.set("range", query.range);
  url.searchParams.set("returnWindow", query.returnWindow);
  if (query.serviceId) {
    url.searchParams.set("serviceId", query.serviceId);
  }
  if (query.professionalId) {
    url.searchParams.set("professionalId", query.professionalId);
  }

  return await requestJson<AdminReportsReadModel>(apiBaseUrl, url.pathname + url.search, {
    token
  });
}

export async function fetchAdminFinancialReadModel(
  apiBaseUrl: string,
  token: string,
  query: FinancialReadModelQuery
): Promise<AdminFinancialReadModel> {
  const url = new URL("/v1/admin/read-models/financial", `${resolveAdminApiBaseUrl(apiBaseUrl)}/`);
  url.searchParams.set("range", query.range);
  url.searchParams.set("situation", query.situation);
  if (query.bankId) {
    url.searchParams.set("bankId", query.bankId);
  }

  return await requestJson<AdminFinancialReadModel>(apiBaseUrl, url.pathname + url.search, {
    token
  });
}

export async function fetchReportBuilderCatalog(
  apiBaseUrl: string,
  token: string
): Promise<ReportBuilderCatalog> {
  return await requestJson<ReportBuilderCatalog>(apiBaseUrl, "/v1/admin/reporting/catalog", {
    token
  });
}

export async function listReportDefinitions(
  apiBaseUrl: string,
  token: string
): Promise<ReportDefinition[]> {
  const response = await requestJson<{ items: ReportDefinition[] }>(
    apiBaseUrl,
    "/v1/admin/report-definitions",
    {
      token
    }
  );
  return response.items;
}

export async function createReportDefinition(
  apiBaseUrl: string,
  token: string,
  definition: ReportDefinition
): Promise<ReportDefinition> {
  return await requestJson<ReportDefinition>(apiBaseUrl, "/v1/admin/report-definitions", {
    method: "POST",
    token,
    body: definition
  });
}

export async function updateReportDefinition(
  apiBaseUrl: string,
  token: string,
  definitionId: string,
  definition: ReportDefinition
): Promise<ReportDefinition> {
  return await requestJson<ReportDefinition>(apiBaseUrl, `/v1/admin/report-definitions/${definitionId}`, {
    method: "PATCH",
    token,
    body: definition
  });
}

export async function deleteReportDefinition(
  apiBaseUrl: string,
  token: string,
  definitionId: string
): Promise<void> {
  await requestJson<undefined>(apiBaseUrl, `/v1/admin/report-definitions/${definitionId}`, {
    method: "DELETE",
    token
  });
}

export async function executeReportDefinition(
  apiBaseUrl: string,
  token: string,
  payload: ExecuteReportDefinitionPayload
): Promise<ReportExecutionResponse> {
  return await requestJson<ReportExecutionResponse>(apiBaseUrl, "/v1/admin/reporting/execute", {
    method: "POST",
    token,
    body: payload
  });
}

export async function createBank(
  apiBaseUrl: string,
  token: string,
  payload: {
    codigo?: string;
    bacenCode: string;
    nomeBanco: string;
    agencia: string;
    conta: string;
    ativo?: boolean;
  }
): Promise<Bank> {
  return await requestJson<Bank>(apiBaseUrl, "/v1/admin/banks", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateBank(
  apiBaseUrl: string,
  token: string,
  bankId: string,
  payload: Partial<Pick<Bank, "codigo" | "bacenCode" | "nomeBanco" | "agencia" | "conta" | "ativo">>
): Promise<Bank> {
  return await requestJson<Bank>(apiBaseUrl, `/v1/admin/banks/${bankId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteBank(
  apiBaseUrl: string,
  token: string,
  bankId: string
): Promise<void> {
  await requestJson<void>(apiBaseUrl, `/v1/admin/banks/${bankId}`, {
    method: "DELETE",
    token
  });
}

export async function createBankBalance(
  apiBaseUrl: string,
  token: string,
  payload: {
    codigo?: string;
    bankId: string;
    saldoInicial: number;
    dataSaldoInicial: string;
    observacao?: string;
  }
): Promise<BankBalance> {
  return await requestJson<BankBalance>(apiBaseUrl, "/v1/admin/bank-balances", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateBankBalance(
  apiBaseUrl: string,
  token: string,
  balanceId: string,
  payload: Partial<Pick<BankBalance, "codigo" | "saldoInicial" | "dataSaldoInicial" | "observacao">>
): Promise<BankBalance> {
  return await requestJson<BankBalance>(apiBaseUrl, `/v1/admin/bank-balances/${balanceId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteBankBalance(
  apiBaseUrl: string,
  token: string,
  balanceId: string
): Promise<void> {
  await requestJson<void>(apiBaseUrl, `/v1/admin/bank-balances/${balanceId}`, {
    method: "DELETE",
    token
  });
}

export async function createRevenueSchedule(
  apiBaseUrl: string,
  token: string,
  payload: {
    codigo?: string;
    descricao: string;
    valor: number;
    dataVencimento: string;
    tipo: "unica" | "recorrente";
    recorrencia?: "semanal" | "mensal";
    quantidadeOcorrencias?: number;
    diaSemanaVencimento?: number;
    bankId?: string;
    baixaAutomatica: "sim" | "nao";
    bookingId?: string;
    clientId?: string;
    serviceId?: string;
    professionalId?: string;
  }
): Promise<RevenueSchedule[]> {
  const response = await requestJson<{ items: RevenueSchedule[] }>(apiBaseUrl, "/v1/admin/revenues", {
    method: "POST",
    token,
    body: payload
  });
  return response.items;
}

export async function updateRevenueSchedule(
  apiBaseUrl: string,
  token: string,
  revenueId: string,
  payload: Partial<
    Pick<
      RevenueSchedule,
      | "codigo"
      | "descricao"
      | "valor"
      | "dataVencimento"
      | "tipo"
      | "recorrencia"
      | "quantidadeOcorrencias"
      | "diaSemanaVencimento"
      | "status"
      | "bankId"
      | "baixaAutomatica"
      | "bookingId"
      | "clientId"
      | "serviceId"
      | "professionalId"
    >
  >
): Promise<RevenueSchedule> {
  return await requestJson<RevenueSchedule>(apiBaseUrl, `/v1/admin/revenues/${revenueId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteRevenueSchedule(
  apiBaseUrl: string,
  token: string,
  revenueId: string
): Promise<void> {
  await requestJson<void>(apiBaseUrl, `/v1/admin/revenues/${revenueId}`, {
    method: "DELETE",
    token
  });
}

export async function createExpenseSchedule(
  apiBaseUrl: string,
  token: string,
  payload: {
    codigo?: string;
    descricao: string;
    valor: number;
    dataVencimento: string;
    tipo: "unica" | "recorrente";
    recorrencia?: "semanal" | "mensal";
    quantidadeOcorrencias?: number;
    diaSemanaVencimento?: number;
    beneficiarioNome?: string;
    bankId?: string;
    baixaAutomatica: "sim" | "nao";
  }
): Promise<ExpenseSchedule[]> {
  const response = await requestJson<{ items: ExpenseSchedule[] }>(apiBaseUrl, "/v1/admin/expenses", {
    method: "POST",
    token,
    body: payload
  });
  return response.items;
}

export async function updateExpenseSchedule(
  apiBaseUrl: string,
  token: string,
  expenseId: string,
  payload: Partial<
    Pick<
      ExpenseSchedule,
      | "codigo"
      | "descricao"
      | "valor"
      | "dataVencimento"
      | "tipo"
      | "recorrencia"
      | "quantidadeOcorrencias"
      | "diaSemanaVencimento"
      | "status"
      | "beneficiarioNome"
      | "bankId"
      | "baixaAutomatica"
    >
  >
): Promise<ExpenseSchedule> {
  return await requestJson<ExpenseSchedule>(apiBaseUrl, `/v1/admin/expenses/${expenseId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteExpenseSchedule(
  apiBaseUrl: string,
  token: string,
  expenseId: string
): Promise<void> {
  await requestJson<void>(apiBaseUrl, `/v1/admin/expenses/${expenseId}`, {
    method: "DELETE",
    token
  });
}

export async function createBankMovement(
  apiBaseUrl: string,
  token: string,
  payload: {
    tipo: BankMovement["tipo"];
    bankIdOrigem?: string;
    bankIdDestino?: string;
    valor: number;
    historico: string;
    beneficiarioNome?: string;
    dataMovimento?: string;
    sourceType?: BankMovement["sourceType"];
  }
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, "/v1/admin/bank-movements", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateBankMovementRecord(
  apiBaseUrl: string,
  token: string,
  movementId: string,
  payload: Partial<
    Pick<
      BankMovement,
      "tipo" | "bankIdOrigem" | "bankIdDestino" | "valor" | "historico" | "beneficiarioNome" | "dataMovimento"
    >
  >
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, `/v1/admin/bank-movements/${movementId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function receiveBankMovement(
  apiBaseUrl: string,
  token: string,
  payload: {
    bankIdDestino: string;
    valor: number;
    historico: string;
    dataMovimento?: string;
    revenueId?: string;
    cashEntryId?: string;
  }
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, "/v1/admin/bank-movements/receive", {
    method: "POST",
    token,
    body: payload
  });
}

export async function payBankMovement(
  apiBaseUrl: string,
  token: string,
  payload: {
    bankIdOrigem: string;
    valor: number;
    historico: string;
    dataMovimento?: string;
    beneficiarioNome?: string;
    expenseId?: string;
  }
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, "/v1/admin/bank-movements/pay", {
    method: "POST",
    token,
    body: payload
  });
}

export async function transferBankMovement(
  apiBaseUrl: string,
  token: string,
  payload: {
    bankIdOrigem: string;
    bankIdDestino: string;
    valor: number;
    historico: string;
    dataMovimento?: string;
  }
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, "/v1/admin/bank-movements/transfer", {
    method: "POST",
    token,
    body: payload
  });
}

export async function reverseBankMovement(
  apiBaseUrl: string,
  token: string,
  movementId: string,
  payload?: {
    historico?: string;
    dataMovimento?: string;
  }
): Promise<BankMovement> {
  return await requestJson<BankMovement>(apiBaseUrl, `/v1/admin/bank-movements/${movementId}/reverse`, {
    method: "POST",
    token,
    body: payload ?? {}
  });
}

export async function createCashClose(
  apiBaseUrl: string,
  token: string,
  payload: {
    bankId: string;
    dateFrom: string;
    dateTo: string;
  }
): Promise<{
  cashClose: CashClose;
  items: Array<unknown>;
  movements: BankMovement[];
}> {
  return await requestJson(apiBaseUrl, "/v1/admin/cash-closes", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateTenantSlug(
  apiBaseUrl: string,
  token: string,
  slug: string
): Promise<Tenant> {
  return await requestJson<Tenant>(apiBaseUrl, "/v1/admin/tenant/slug", {
    method: "PATCH",
    token,
    body: {
      slug
    }
  });
}

export async function updateTenantBranding(
  apiBaseUrl: string,
  token: string,
  branding: TenantBranding
): Promise<Tenant> {
  return await requestJson<Tenant>(apiBaseUrl, "/v1/admin/tenant/branding", {
    method: "PATCH",
    token,
    body: {
      branding
    }
  });
}

export async function savePaymentSettings(
  apiBaseUrl: string,
  token: string,
  payload: Omit<TenantPaymentSettings, "version" | "tenantId" | "provider">
): Promise<TenantPaymentSettings> {
  return await requestJson<TenantPaymentSettings>(apiBaseUrl, "/v1/admin/payment-settings", {
    method: "PUT",
    token,
    body: payload
  });
}

export async function createService(
  apiBaseUrl: string,
  token: string,
  payload: {
    nome: string;
    duracaoMin: number;
    precoBase: number;
    exigeSinal: boolean;
    paymentPolicy?: Service["paymentPolicy"];
  }
): Promise<Service> {
  return await requestJson<Service>(apiBaseUrl, "/v1/admin/services", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateService(
  apiBaseUrl: string,
  token: string,
  serviceId: string,
  payload: {
    nome: string;
    duracaoMin: number;
    precoBase: number;
    exigeSinal: boolean;
    paymentPolicy: Service["paymentPolicy"];
    status: string;
  }
): Promise<Service> {
  return await requestJson<Service>(apiBaseUrl, `/v1/admin/services/${serviceId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function deleteService(
  apiBaseUrl: string,
  token: string,
  serviceId: string
): Promise<void> {
  await requestJson<void>(apiBaseUrl, `/v1/admin/services/${serviceId}`, {
    method: "DELETE",
    token
  });
}

export async function createProfessional(
  apiBaseUrl: string,
  token: string,
  payload: {
    nome: string;
    especialidades: string[];
    bankId?: string;
  }
): Promise<Professional> {
  return await requestJson<Professional>(apiBaseUrl, "/v1/admin/professionals", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateProfessional(
  apiBaseUrl: string,
  token: string,
  professionalId: string,
  payload: {
    nome: string;
    status: string;
    especialidades: string[];
    bankId?: string;
  }
): Promise<Professional> {
  return await requestJson<Professional>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}`,
    {
      method: "PATCH",
      token,
      body: payload
    }
  );
}

export async function fetchProfessionalAvailability(
  apiBaseUrl: string,
  token: string,
  professionalId: string
): Promise<AvailabilityRule[]> {
  const response = await requestJson<{ items: AvailabilityRule[] }>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}/availability`,
    {
      token
    }
  );

  return response.items;
}

export async function saveProfessionalAvailability(
  apiBaseUrl: string,
  token: string,
  professionalId: string,
  rules: Array<{
    weekday: number;
    faixa: {
      startTime: string;
      endTime: string;
    };
  }>
): Promise<AvailabilityRule[]> {
  const response = await requestJson<{ items: AvailabilityRule[] }>(
    apiBaseUrl,
    `/v1/admin/professionals/${professionalId}/availability`,
    {
      method: "PUT",
      token,
      body: {
        rules
      }
    }
  );

  return response.items;
}

export async function fetchAvailabilitySlots(
  apiBaseUrl: string,
  token: string,
  payload: {
    serviceId: string;
    professionalId: string;
    date: string;
  }
): Promise<AvailabilitySlot[]> {
  const url = new URL("/v1/admin/availability/slots", `${resolveAdminApiBaseUrl(apiBaseUrl)}/`);
  url.searchParams.set("serviceId", payload.serviceId);
  url.searchParams.set("professionalId", payload.professionalId);
  url.searchParams.set("date", payload.date);

  const response = await requestJson<{ items: AvailabilitySlot[] }>(apiBaseUrl, url.pathname + url.search, {
    token
  });

  return response.items;
}

export async function createClient(
  apiBaseUrl: string,
  token: string,
  payload: {
    nome: string;
    telefone: string;
    email: string;
    origem: string;
  }
): Promise<Client> {
  return await requestJson<Client>(apiBaseUrl, "/v1/admin/clients", {
    method: "POST",
    token,
    body: payload
  });
}

export async function createBooking(
  apiBaseUrl: string,
  token: string,
  payload: {
    clientId: string;
    serviceId: string;
    professionalId: string;
    status: Booking["status"];
    startAt: string;
    endAt: string;
  }
): Promise<Booking> {
  return await requestJson<Booking>(apiBaseUrl, "/v1/admin/bookings", {
    method: "POST",
    token,
    body: payload
  });
}

export async function updateBooking(
  apiBaseUrl: string,
  token: string,
  bookingId: string,
  payload: BookingPatchPayload
): Promise<Booking> {
  return await requestJson<Booking>(apiBaseUrl, `/v1/admin/bookings/${bookingId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

export async function syncPaymentIntent(
  apiBaseUrl: string,
  token: string,
  paymentIntentId: string,
  payload?: PaymentIntentSyncPayload
): Promise<{ item: PaymentIntent; booking: Booking }> {
  return await requestJson<{ item: PaymentIntent; booking: Booking }>(
    apiBaseUrl,
    `/v1/admin/payment-intents/${paymentIntentId}/sync`,
    {
      method: "POST",
      token,
      body: payload
    }
  );
}

async function requestJson<T>(
  apiBaseUrl: string,
  pathname: string,
  options: JsonRequestOptions = {}
): Promise<T> {
  const response = await fetch(new URL(pathname, `${resolveAdminApiBaseUrl(apiBaseUrl)}/`).toString(), {
    method: options.method ?? "GET",
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    throw await toAdminApiError(response);
  }

  return (await response.json()) as T;
}

async function toAdminApiError(response: Response): Promise<AdminApiError> {
  let payload: ApiErrorPayload | undefined;

  try {
    payload = (await response.json()) as ApiErrorPayload;
  } catch {
    payload = undefined;
  }

  return new AdminApiError(
    response.status,
    payload?.message ?? `Admin API request failed with status ${response.status}.`,
    payload?.error
  );
}
