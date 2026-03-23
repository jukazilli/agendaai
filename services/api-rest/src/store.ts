import { randomUUID } from "node:crypto";

import { defaultServicePaymentPolicy } from "@agendaai/contracts";
import type {
  AdminSessionClaimsContract,
  AdminUser,
  AutomaticSettlement,
  AvailabilityRule,
  AvailabilityRuleInput,
  Bank,
  BankBalance,
  BankMovement,
  BankMovementSourceType,
  BankMovementStatus,
  BankMovementType,
  Booking,
  CashClose,
  CashCloseItem,
  CashClosePreview,
  CashClosePreviewItem,
  CashCloseSelectionItem,
  CashEntry,
  CashEntryKind,
  Client,
  ClientContactInput,
  ConfigureTenantBrandingCommand,
  ConfigureTenantSlugCommand,
  CreateBankBalanceCommand,
  CreateBankCommand,
  CreateBankMovementCommand,
  CreateBankPaymentCommand,
  CreateBankReceiptCommand,
  CreateBankTransferCommand,
  CreateBookingCommand,
  CreateCashCloseCommand,
  CreateExpenseScheduleCommand,
  CreateProfessionalCommand,
  CreateRevenueScheduleCommand,
  ExpenseSchedule,
  ExpenseScheduleOrigin,
  ExpenseScheduleStatus,
  PaymentIntent,
  PublicCreateBookingInput,
  ReportDefinition,
  RevenueSchedule,
  RevenueScheduleOrigin,
  RevenueScheduleStatus,
  ReverseBankMovementCommand,
  ServicePaymentPolicy,
  TenantPaymentSettings,
  CreateServiceCommand,
  CreateTenantCommand,
  ProfessionalStatus,
  Professional,
  Service,
  ServiceStatus,
  Tenant,
  TenantBranding
} from "@agendaai/contracts";

type RevenueScheduleWithPlan = RevenueSchedule & { plannedMovementId?: string };
type ExpenseScheduleWithPlan = ExpenseSchedule & { plannedMovementId?: string };

export interface AdminSessionRecord {
  readonly token: string;
  readonly claims: AdminSessionClaimsContract;
}

export interface PublicTenantProfile {
  readonly slug: string;
  readonly nome: string;
  readonly timezone: string;
  readonly branding: TenantBranding;
}

export interface PublicAvailabilitySlot {
  readonly date: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly startAt: string;
  readonly endAt: string;
}

export interface PublicCatalogSnapshot {
  readonly tenant: PublicTenantProfile;
  readonly services: Service[];
  readonly professionals: Professional[];
}

export interface PublicBookingResult {
  readonly tenant: PublicTenantProfile;
  readonly client: Client;
  readonly service: Service;
  readonly professional: Professional;
  readonly booking: Booking;
}

export interface PublicPaymentIntentResult extends PublicBookingResult {
  readonly paymentIntent: PaymentIntent;
}

export type MaybePromise<T> = T | Promise<T>;

export interface ServicePatchInput {
  codigo?: string;
  nome?: string;
  duracaoMin?: number;
  precoBase?: number;
  exigeSinal?: boolean;
  paymentPolicy?: ServicePaymentPolicy;
  status?: ServiceStatus;
}

export interface ClientPatchInput {
  codigo?: string;
  nome?: string;
  telefone?: string;
  email?: string;
  origem?: string;
}

export interface ProfessionalPatchInput {
  codigo?: string;
  nome?: string;
  status?: ProfessionalStatus;
  especialidades?: string[];
  bankId?: string | undefined;
}

export interface BookingPatchInput {
  clientId?: string;
  serviceId?: string;
  professionalId?: string;
  status?: Booking["status"];
  startAt?: string;
  endAt?: string;
}

export interface PaymentIntentPatchInput {
  status?: PaymentIntent["status"];
  statusDetail?: string;
  paymentId?: string;
  preferenceId?: string;
  initPoint?: string;
  sandboxInitPoint?: string;
}

export interface BankPatchInput {
  codigo?: string;
  bacenCode?: string;
  nomeBanco?: string;
  agencia?: string;
  conta?: string;
  ativo?: boolean;
}

export interface BankBalancePatchInput {
  codigo?: string;
  saldoInicial?: number;
  dataSaldoInicial?: string;
  observacao?: string;
}

export interface RevenuePatchInput {
  codigo?: string;
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  tipo?: RevenueSchedule["tipo"];
  recorrencia?: RevenueSchedule["recorrencia"];
  quantidadeOcorrencias?: number | undefined;
  diaSemanaVencimento?: number | undefined;
  status?: RevenueScheduleStatus;
  bankId?: string | undefined;
  baixaAutomatica?: AutomaticSettlement;
  clientId?: string | undefined;
  serviceId?: string | undefined;
  professionalId?: string | undefined;
  bookingId?: string | undefined;
}

export interface ExpensePatchInput {
  codigo?: string;
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  tipo?: ExpenseSchedule["tipo"];
  recorrencia?: ExpenseSchedule["recorrencia"];
  quantidadeOcorrencias?: number | undefined;
  diaSemanaVencimento?: number | undefined;
  status?: ExpenseScheduleStatus;
  beneficiarioNome?: string;
  bankId?: string | undefined;
  baixaAutomatica?: AutomaticSettlement;
}

export interface StoredAdminUser extends AdminUser {
  readonly password: string;
}

interface TimeWindow {
  readonly date: string;
  readonly startMinutes: number;
  readonly endMinutes: number;
}

export interface TenantOnboardingResult {
  readonly tenant: Tenant;
  readonly adminUser: AdminUser;
  readonly session: AdminSessionRecord;
}

export interface ApiRestStoreSnapshot {
  readonly tenants: Tenant[];
  readonly adminUsers: StoredAdminUser[];
  readonly services: Service[];
  readonly banks?: Bank[];
  readonly bankBalances?: BankBalance[];
  readonly cashCloses?: CashClose[];
  readonly cashCloseItems?: CashCloseItem[];
  readonly paymentSettings?: TenantPaymentSettings[];
  readonly paymentIntents?: PaymentIntent[];
  readonly cashEntries?: CashEntry[];
  readonly revenueSchedules?: RevenueSchedule[];
  readonly expenseSchedules?: ExpenseSchedule[];
  readonly bankMovements?: BankMovement[];
  readonly clients: Client[];
  readonly professionals: Professional[];
  readonly availabilityRules: AvailabilityRule[];
  readonly bookings: Booking[];
  readonly reportDefinitions?: ReportDefinition[];
  readonly sessions: AdminSessionRecord[];
}

export interface ApiRestStorePort {
  createTenant(command: CreateTenantCommand): MaybePromise<TenantOnboardingResult>;
  login(email: string, password: string): MaybePromise<AdminSessionRecord | undefined>;
  getSession(token: string): MaybePromise<AdminSessionRecord | undefined>;
  getTenantById(tenantId: string): MaybePromise<Tenant | undefined>;
  getTenantBySlug(slug: string): MaybePromise<Tenant | undefined>;
  getPublicTenantProfile(slug: string): MaybePromise<PublicTenantProfile | undefined>;
  getPublicCatalog(slug: string): MaybePromise<PublicCatalogSnapshot | undefined>;
  updateTenantSlug(command: ConfigureTenantSlugCommand): MaybePromise<Tenant>;
  updateTenantBranding(command: ConfigureTenantBrandingCommand): MaybePromise<Tenant>;
  listServices(tenantId: string): MaybePromise<Service[]>;
  getService(tenantId: string, serviceId: string): MaybePromise<Service | undefined>;
  createService(command: CreateServiceCommand): MaybePromise<Service>;
  updateService(
    tenantId: string,
    serviceId: string,
    patch: ServicePatchInput
  ): MaybePromise<Service | undefined>;
  deleteService(tenantId: string, serviceId: string): MaybePromise<boolean>;
  listBanks(tenantId: string): MaybePromise<Bank[]>;
  getBank(tenantId: string, bankId: string): MaybePromise<Bank | undefined>;
  createBank(command: CreateBankCommand): MaybePromise<Bank>;
  updateBank(tenantId: string, bankId: string, patch: BankPatchInput): MaybePromise<Bank | undefined>;
  deleteBank(tenantId: string, bankId: string): MaybePromise<boolean>;
  listBankBalances(tenantId: string): MaybePromise<BankBalance[]>;
  getBankBalance(tenantId: string, balanceId: string): MaybePromise<BankBalance | undefined>;
  getBankBalanceByBankId(tenantId: string, bankId: string): MaybePromise<BankBalance | undefined>;
  createBankBalance(command: CreateBankBalanceCommand): MaybePromise<BankBalance>;
  updateBankBalance(
    tenantId: string,
    balanceId: string,
    patch: BankBalancePatchInput
  ): MaybePromise<BankBalance | undefined>;
  deleteBankBalance(tenantId: string, balanceId: string): MaybePromise<boolean>;
  listRevenueSchedules(tenantId: string): MaybePromise<RevenueSchedule[]>;
  getRevenueSchedule(
    tenantId: string,
    revenueId: string
  ): MaybePromise<RevenueSchedule | undefined>;
  saveRevenueSchedule(entry: RevenueSchedule): MaybePromise<RevenueSchedule>;
  createRevenueSchedule(command: CreateRevenueScheduleCommand): MaybePromise<RevenueSchedule[]>;
  updateRevenueSchedule(
    tenantId: string,
    revenueId: string,
    patch: RevenuePatchInput
  ): MaybePromise<RevenueSchedule | undefined>;
  deleteRevenueSchedule(tenantId: string, revenueId: string): MaybePromise<boolean>;
  listExpenseSchedules(tenantId: string): MaybePromise<ExpenseSchedule[]>;
  getExpenseSchedule(
    tenantId: string,
    expenseId: string
  ): MaybePromise<ExpenseSchedule | undefined>;
  saveExpenseSchedule(entry: ExpenseSchedule): MaybePromise<ExpenseSchedule>;
  createExpenseSchedule(command: CreateExpenseScheduleCommand): MaybePromise<ExpenseSchedule[]>;
  updateExpenseSchedule(
    tenantId: string,
    expenseId: string,
    patch: ExpensePatchInput
  ): MaybePromise<ExpenseSchedule | undefined>;
  deleteExpenseSchedule(tenantId: string, expenseId: string): MaybePromise<boolean>;
  listBankMovements(tenantId: string): MaybePromise<BankMovement[]>;
  getBankMovement(
    tenantId: string,
    movementId: string
  ): MaybePromise<BankMovement | undefined>;
  saveBankMovement(entry: BankMovement): MaybePromise<BankMovement>;
  createBankMovement(command: CreateBankMovementCommand): MaybePromise<BankMovement>;
  updateBankMovement(
    tenantId: string,
    movementId: string,
    patch: Partial<
      Pick<
        BankMovement,
        | "tipo"
        | "bankIdOrigem"
        | "bankIdDestino"
        | "valor"
        | "historico"
        | "beneficiarioNome"
        | "dataMovimento"
      >
    >
  ): MaybePromise<BankMovement | undefined>;
  receiveRevenue(command: CreateBankReceiptCommand): MaybePromise<BankMovement>;
  payExpense(command: CreateBankPaymentCommand): MaybePromise<BankMovement>;
  transferBetweenBanks(command: CreateBankTransferCommand): MaybePromise<BankMovement>;
  reverseBankMovement(command: ReverseBankMovementCommand): MaybePromise<BankMovement>;
  listCashCloses(tenantId: string): MaybePromise<CashClose[]>;
  listCashCloseItems(tenantId: string, cashCloseId: string): MaybePromise<CashCloseItem[]>;
  previewCashClose(
    tenantId: string,
    bankId: string,
    dateFrom: string,
    dateTo: string
  ): MaybePromise<CashClosePreview>;
  createCashClose(command: CreateCashCloseCommand): MaybePromise<{
    cashClose: CashClose;
    items: CashCloseItem[];
    movements: BankMovement[];
  }>;
  getPaymentSettings(tenantId: string): MaybePromise<TenantPaymentSettings | undefined>;
  upsertPaymentSettings(command: TenantPaymentSettings): MaybePromise<TenantPaymentSettings>;
  recordPaymentIntent(intent: PaymentIntent): MaybePromise<PaymentIntent>;
  getPaymentIntent(tenantId: string, paymentIntentId: string): MaybePromise<PaymentIntent | undefined>;
  getPaymentIntentByExternalReference(
    tenantId: string,
    externalReference: string
  ): MaybePromise<PaymentIntent | undefined>;
  listPaymentIntents(tenantId: string): MaybePromise<PaymentIntent[]>;
  listCashEntries(tenantId: string): MaybePromise<CashEntry[]>;
  getCashEntry(tenantId: string, cashEntryId: string): MaybePromise<CashEntry | undefined>;
  getCashEntryByBookingAndKind(
    tenantId: string,
    bookingId: string,
    kind: CashEntryKind
  ): MaybePromise<CashEntry | undefined>;
  saveCashEntry(entry: CashEntry): MaybePromise<CashEntry>;
  updatePaymentIntent(
    tenantId: string,
    paymentIntentId: string,
    patch: PaymentIntentPatchInput
  ): MaybePromise<PaymentIntent | undefined>;
  listClients(tenantId: string): MaybePromise<Client[]>;
  getClient(tenantId: string, clientId: string): MaybePromise<Client | undefined>;
  createClient(tenantId: string, input: ClientContactInput): MaybePromise<Client>;
  updateClient(
    tenantId: string,
    clientId: string,
    patch: ClientPatchInput
  ): MaybePromise<Client | undefined>;
  deleteClient(tenantId: string, clientId: string): MaybePromise<boolean>;
  listProfessionals(tenantId: string): MaybePromise<Professional[]>;
  listProfessionalsForService(
    tenantId: string,
    serviceId?: string
  ): MaybePromise<Professional[]>;
  getProfessional(
    tenantId: string,
    professionalId: string
  ): MaybePromise<Professional | undefined>;
  createProfessional(command: CreateProfessionalCommand): MaybePromise<Professional>;
  updateProfessional(
    tenantId: string,
    professionalId: string,
    patch: ProfessionalPatchInput
  ): MaybePromise<Professional | undefined>;
  deleteProfessional(tenantId: string, professionalId: string): MaybePromise<boolean>;
  replaceAvailabilityRules(
    tenantId: string,
    professionalId: string,
    rules: AvailabilityRuleInput[]
  ): MaybePromise<AvailabilityRule[]>;
  listAvailabilityRules(
    tenantId: string,
    professionalId: string
  ): MaybePromise<AvailabilityRule[]>;
  listAvailableSlots(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    date: string,
    bookingToIgnoreId?: string
  ): MaybePromise<PublicAvailabilitySlot[]>;
  listBookings(tenantId: string): MaybePromise<Booking[]>;
  getBooking(tenantId: string, bookingId: string): MaybePromise<Booking | undefined>;
  createBooking(command: CreateBookingCommand): MaybePromise<Booking>;
  updateBooking(
    tenantId: string,
    bookingId: string,
    patch: BookingPatchInput
  ): MaybePromise<Booking | undefined>;
  deleteBooking(tenantId: string, bookingId: string): MaybePromise<boolean>;
  createPublicBooking(input: PublicCreateBookingInput): MaybePromise<PublicBookingResult>;
  createPublicPaymentBooking(input: PublicCreateBookingInput): MaybePromise<PublicBookingResult>;
  listReportDefinitions(tenantId: string): MaybePromise<ReportDefinition[]>;
  getReportDefinition(
    tenantId: string,
    reportDefinitionId: string
  ): MaybePromise<ReportDefinition | undefined>;
  saveReportDefinition(definition: ReportDefinition): MaybePromise<ReportDefinition>;
  deleteReportDefinition(tenantId: string, reportDefinitionId: string): MaybePromise<boolean>;
}

export class ApiRestStore implements ApiRestStorePort {
  private readonly tenants = new Map<string, Tenant>();
  private readonly tenantIdsBySlug = new Map<string, string>();
  private readonly adminUsers = new Map<string, StoredAdminUser>();
  private readonly adminUserIdsByEmail = new Map<string, string>();
  private readonly services = new Map<string, Service>();
  private readonly banks = new Map<string, Bank>();
  private readonly bankBalances = new Map<string, BankBalance>();
  private readonly cashCloses = new Map<string, CashClose>();
  private readonly cashCloseItems = new Map<string, CashCloseItem>();
  private readonly paymentSettings = new Map<string, TenantPaymentSettings>();
  private readonly paymentIntents = new Map<string, PaymentIntent>();
  private readonly cashEntries = new Map<string, CashEntry>();
  private readonly revenueSchedules = new Map<string, RevenueSchedule>();
  private readonly expenseSchedules = new Map<string, ExpenseSchedule>();
  private readonly bankMovements = new Map<string, BankMovement>();
  private readonly clients = new Map<string, Client>();
  private readonly professionals = new Map<string, Professional>();
  private readonly availabilityRules = new Map<string, AvailabilityRule>();
  private readonly bookings = new Map<string, Booking>();
  private readonly reportDefinitions = new Map<string, ReportDefinition>();
  private readonly sessions = new Map<string, AdminSessionRecord>();
  private isApplyingAutomaticSettlements = false;

  constructor(snapshot?: ApiRestStoreSnapshot) {
    if (snapshot) {
      this.restoreSnapshot(snapshot);
    }
  }

  createTenant(command: CreateTenantCommand): TenantOnboardingResult {
    this.assertSlugAvailable(command.slug);

    const adminEmail = command.admin.email.trim().toLowerCase();
    if (this.adminUserIdsByEmail.has(adminEmail)) {
      throw new Error("admin_email_already_exists");
    }

    const tenant: Tenant = {
      version: "v1",
      id: randomUUID(),
      slug: command.slug,
      nome: command.nome,
      status: "active",
      timezone: command.timezone,
      branding: createDefaultTenantBranding()
    };

    const adminUser: StoredAdminUser = {
      version: "v1",
      id: randomUUID(),
      tenantId: tenant.id,
      nome: command.admin.nome,
      email: adminEmail,
      role: "owner",
      status: "active",
      password: command.admin.senha
    };

    this.tenants.set(tenant.id, tenant);
    this.tenantIdsBySlug.set(tenant.slug, tenant.id);
    this.adminUsers.set(adminUser.id, adminUser);
    this.adminUserIdsByEmail.set(adminUser.email, adminUser.id);

    this.ensureFinancialDefaults();
    const session = this.issueSession(adminUser);

    return {
      tenant,
      adminUser: this.withoutPassword(adminUser),
      session
    };
  }

  login(email: string, password: string): AdminSessionRecord | undefined {
    const adminId = this.adminUserIdsByEmail.get(email.trim().toLowerCase());
    if (!adminId) {
      return undefined;
    }

    const adminUser = this.adminUsers.get(adminId);
    if (!adminUser || adminUser.password !== password) {
      return undefined;
    }

    return this.issueSession(adminUser);
  }

  getSession(token: string): AdminSessionRecord | undefined {
    return this.sessions.get(token);
  }

  getTenantById(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId);
  }

  getTenantBySlug(slug: string): Tenant | undefined {
    const tenantId = this.tenantIdsBySlug.get(slug);
    return tenantId ? this.tenants.get(tenantId) : undefined;
  }

  getPublicTenantProfile(slug: string): PublicTenantProfile | undefined {
    const tenant = this.getTenantBySlug(slug);
    if (!tenant) {
      return undefined;
    }

    return this.toPublicTenantProfile(tenant);
  }

  getPublicCatalog(slug: string): PublicCatalogSnapshot | undefined {
    const tenant = this.getPublicTenantProfile(slug);
    if (!tenant) {
      return undefined;
    }

    const tenantId = this.tenantIdsBySlug.get(slug);
    if (!tenantId) {
      return undefined;
    }

    return {
      tenant,
      services: this.listServices(tenantId).filter((service) => service.status === "active"),
      professionals: this.listProfessionals(tenantId).filter(
        (professional) => professional.status === "active"
      )
    };
  }

  updateTenantSlug(command: ConfigureTenantSlugCommand): Tenant {
    const tenant = this.tenants.get(command.tenantId);
    if (!tenant) {
      throw new Error("tenant_not_found");
    }

    const currentOwner = this.tenantIdsBySlug.get(command.slug);
    if (currentOwner && currentOwner !== tenant.id) {
      throw new Error("slug_already_exists");
    }

    this.tenantIdsBySlug.delete(tenant.slug);

    const updatedTenant: Tenant = {
      ...tenant,
      slug: command.slug
    };

    this.tenants.set(updatedTenant.id, updatedTenant);
    this.tenantIdsBySlug.set(updatedTenant.slug, updatedTenant.id);

    return updatedTenant;
  }

  updateTenantBranding(command: ConfigureTenantBrandingCommand): Tenant {
    const tenant = this.tenants.get(command.tenantId);
    if (!tenant) {
      throw new Error("tenant_not_found");
    }

    const updatedTenant: Tenant = {
      ...tenant,
      branding: normalizeTenantBranding(command.branding)
    };

    this.tenants.set(updatedTenant.id, updatedTenant);
    return updatedTenant;
  }

  listServices(tenantId: string): Service[] {
    return [...this.services.values()].filter((service) => service.tenantId === tenantId);
  }

  getService(tenantId: string, serviceId: string): Service | undefined {
    const service = this.services.get(serviceId);
    return service && service.tenantId === tenantId ? service : undefined;
  }

  createService(command: CreateServiceCommand): Service {
    const paymentPolicy = normalizeServicePaymentPolicy(command.paymentPolicy, command.exigeSinal);
    const service: Service = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: normalizeExplicitCode(command.codigo) ?? this.nextEntityCode(command.tenantId, "service"),
      nome: command.nome,
      duracaoMin: command.duracaoMin,
      precoBase: command.precoBase,
      exigeSinal: paymentPolicy.collectionMode !== "none" ? true : command.exigeSinal,
      paymentPolicy,
      status: "active"
    };

    this.services.set(service.id, service);
    return service;
  }

  updateService(tenantId: string, serviceId: string, patch: ServicePatchInput): Service | undefined {
    const service = this.getService(tenantId, serviceId);
    if (!service) {
      return undefined;
    }

    const paymentPolicy =
      patch.paymentPolicy ?
        normalizeServicePaymentPolicy(
          patch.paymentPolicy,
          patch.exigeSinal ?? service.exigeSinal
        )
      : service.paymentPolicy;

    const nextService: Service = {
      ...service,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? service.codigo,
      exigeSinal:
        patch.paymentPolicy ?
          paymentPolicy.collectionMode !== "none"
        : patch.exigeSinal ?? service.exigeSinal,
      paymentPolicy
    };

    this.services.set(nextService.id, nextService);
    return nextService;
  }

  deleteService(tenantId: string, serviceId: string): boolean {
    const service = this.getService(tenantId, serviceId);
    if (!service) {
      return false;
    }

    this.services.delete(service.id);

    for (const [professionalId, professional] of this.professionals.entries()) {
      if (professional.tenantId !== tenantId) {
        continue;
      }

      if (professional.especialidades.includes(service.id)) {
        this.professionals.set(professionalId, {
          ...professional,
          especialidades: professional.especialidades.filter((item: string) => item !== service.id)
        });
      }
    }

    return true;
  }

  listBanks(tenantId: string): Bank[] {
    return [...this.banks.values()]
      .filter((bank) => bank.tenantId === tenantId)
      .sort((left, right) => left.codigo.localeCompare(right.codigo));
  }

  getBank(tenantId: string, bankId: string): Bank | undefined {
    const bank = this.banks.get(bankId);
    return bank && bank.tenantId === tenantId ? bank : undefined;
  }

  createBank(command: CreateBankCommand): Bank {
    this.assertBankAccountUnique(command.tenantId, command.bacenCode, command.agencia, command.conta);
    const now = new Date().toISOString();
    const bank: Bank = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: normalizeExplicitCode(command.codigo) ?? this.nextEntityCode(command.tenantId, "bank"),
      bacenCode: command.bacenCode,
      nomeBanco: command.nomeBanco,
      agencia: command.agencia,
      conta: command.conta,
      ativo: command.ativo ?? true,
      createdAt: now,
      updatedAt: now
    };

    this.banks.set(bank.id, bank);
    return bank;
  }

  updateBank(tenantId: string, bankId: string, patch: BankPatchInput): Bank | undefined {
    const bank = this.getBank(tenantId, bankId);
    if (!bank) {
      return undefined;
    }

    const nextBacenCode = patch.bacenCode ?? bank.bacenCode;
    const nextAgencia = patch.agencia ?? bank.agencia;
    const nextConta = patch.conta ?? bank.conta;
    this.assertBankAccountUnique(tenantId, nextBacenCode, nextAgencia, nextConta, bank.id);

    const nextBank: Bank = {
      ...bank,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? bank.codigo,
      updatedAt: new Date().toISOString()
    };
    this.banks.set(nextBank.id, nextBank);
    return nextBank;
  }

  deleteBank(tenantId: string, bankId: string): boolean {
    const bank = this.getBank(tenantId, bankId);
    if (!bank) {
      return false;
    }
    if (
      this.listBankBalances(tenantId).some((entry) => entry.bankId === bank.id) ||
      this.listBankMovements(tenantId).some(
        (entry) => entry.bankIdOrigem === bank.id || entry.bankIdDestino === bank.id
      ) ||
      this.listRevenueSchedules(tenantId).some((entry) => entry.bankId === bank.id) ||
      this.listExpenseSchedules(tenantId).some((entry) => entry.bankId === bank.id) ||
      this.listProfessionals(tenantId).some((entry) => entry.bankId === bank.id)
    ) {
      throw new Error("bank_in_use");
    }

    this.banks.delete(bank.id);
    return true;
  }

  listBankBalances(tenantId: string): BankBalance[] {
    return [...this.bankBalances.values()]
      .filter((balance) => balance.tenantId === tenantId)
      .sort((left, right) => left.codigo.localeCompare(right.codigo));
  }

  getBankBalance(tenantId: string, balanceId: string): BankBalance | undefined {
    const balance = this.bankBalances.get(balanceId);
    return balance && balance.tenantId === tenantId ? balance : undefined;
  }

  getBankBalanceByBankId(tenantId: string, bankId: string): BankBalance | undefined {
    return this.listBankBalances(tenantId).find((balance) => balance.bankId === bankId);
  }

  createBankBalance(command: CreateBankBalanceCommand): BankBalance {
    this.assertBankBelongsToTenant(command.tenantId, command.bankId);
    if (this.getBankBalanceByBankId(command.tenantId, command.bankId)) {
      throw new Error("bank_balance_already_exists");
    }

    const now = new Date().toISOString();
    const balance: BankBalance = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: normalizeExplicitCode(command.codigo) ?? this.nextEntityCode(command.tenantId, "bank_balance"),
      bankId: command.bankId,
      saldoInicial: command.saldoInicial,
      saldoAtual: command.saldoInicial,
      dataSaldoInicial: command.dataSaldoInicial,
      observacao: command.observacao,
      createdAt: now,
      updatedAt: now
    };

    this.bankBalances.set(balance.id, balance);
    return balance;
  }

  updateBankBalance(
    tenantId: string,
    balanceId: string,
    patch: BankBalancePatchInput
  ): BankBalance | undefined {
    const balance = this.getBankBalance(tenantId, balanceId);
    if (!balance) {
      return undefined;
    }

    const nextInitialBalance = patch.saldoInicial ?? balance.saldoInicial;
    const nextBalance: BankBalance = {
      ...balance,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? balance.codigo,
      saldoInicial: nextInitialBalance,
      saldoAtual: computeCurrentBalance(nextInitialBalance, this.listBankMovements(tenantId), balance.bankId),
      updatedAt: new Date().toISOString()
    };

    this.bankBalances.set(nextBalance.id, nextBalance);
    return nextBalance;
  }

  deleteBankBalance(tenantId: string, balanceId: string): boolean {
    const balance = this.getBankBalance(tenantId, balanceId);
    if (!balance) {
      return false;
    }
    if (
      this.listBankMovements(tenantId).some(
        (entry) => entry.bankIdOrigem === balance.bankId || entry.bankIdDestino === balance.bankId
      )
    ) {
      throw new Error("bank_balance_in_use");
    }
    this.bankBalances.delete(balance.id);
    return true;
  }

  listRevenueSchedules(tenantId: string): RevenueSchedule[] {
    this.applyDueAutomaticSettlements(tenantId);
    return [...this.revenueSchedules.values()]
      .filter((entry) => entry.tenantId === tenantId)
      .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento) || left.codigo.localeCompare(right.codigo));
  }

  getRevenueSchedule(tenantId: string, revenueId: string): RevenueSchedule | undefined {
    const revenue = this.revenueSchedules.get(revenueId);
    return revenue && revenue.tenantId === tenantId ? revenue : undefined;
  }

  saveRevenueSchedule(entry: RevenueSchedule): RevenueSchedule {
    this.assertRevenueReferences(entry.tenantId, entry);
    this.revenueSchedules.set(entry.id, entry);
    return entry;
  }

  createRevenueSchedule(command: CreateRevenueScheduleCommand): RevenueSchedule[] {
    return this.expandRevenueScheduleCommand(command).map((entry) => {
      this.saveRevenueSchedule(entry);
      return this.syncRevenuePlannedMovement(entry);
    });
  }

  updateRevenueSchedule(
    tenantId: string,
    revenueId: string,
    patch: RevenuePatchInput
  ): RevenueSchedule | undefined {
    const revenue = this.getRevenueSchedule(tenantId, revenueId);
    if (!revenue) {
      return undefined;
    }

    const nextRevenue: RevenueSchedule = {
      ...revenue,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? revenue.codigo,
      updatedAt: new Date().toISOString()
    };
    this.saveRevenueSchedule(nextRevenue);
    return this.syncRevenuePlannedMovement(nextRevenue);
  }

  deleteRevenueSchedule(tenantId: string, revenueId: string): boolean {
    const revenue = this.getRevenueSchedule(tenantId, revenueId) as RevenueScheduleWithPlan | undefined;
    if (!revenue) {
      return false;
    }
    if (revenue.baixaMovementId) {
      throw new Error("schedule_in_use");
    }
    if (revenue.plannedMovementId) {
      this.bankMovements.delete(revenue.plannedMovementId);
    }
    this.revenueSchedules.delete(revenue.id);
    this.refreshBankBalances(tenantId);
    return true;
  }

  listExpenseSchedules(tenantId: string): ExpenseSchedule[] {
    this.applyDueAutomaticSettlements(tenantId);
    return [...this.expenseSchedules.values()]
      .filter((entry) => entry.tenantId === tenantId)
      .sort((left, right) => left.dataVencimento.localeCompare(right.dataVencimento) || left.codigo.localeCompare(right.codigo));
  }

  getExpenseSchedule(tenantId: string, expenseId: string): ExpenseSchedule | undefined {
    const expense = this.expenseSchedules.get(expenseId);
    return expense && expense.tenantId === tenantId ? expense : undefined;
  }

  saveExpenseSchedule(entry: ExpenseSchedule): ExpenseSchedule {
    if (entry.bankId) {
      this.assertBankBelongsToTenant(entry.tenantId, entry.bankId);
    }
    this.expenseSchedules.set(entry.id, entry);
    return entry;
  }

  createExpenseSchedule(command: CreateExpenseScheduleCommand): ExpenseSchedule[] {
    return this.expandExpenseScheduleCommand(command).map((entry) => {
      this.saveExpenseSchedule(entry);
      return this.syncExpensePlannedMovement(entry);
    });
  }

  updateExpenseSchedule(
    tenantId: string,
    expenseId: string,
    patch: ExpensePatchInput
  ): ExpenseSchedule | undefined {
    const expense = this.getExpenseSchedule(tenantId, expenseId);
    if (!expense) {
      return undefined;
    }

    const nextExpense: ExpenseSchedule = {
      ...expense,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? expense.codigo,
      updatedAt: new Date().toISOString()
    };
    this.saveExpenseSchedule(nextExpense);
    return this.syncExpensePlannedMovement(nextExpense);
  }

  deleteExpenseSchedule(tenantId: string, expenseId: string): boolean {
    const expense = this.getExpenseSchedule(tenantId, expenseId) as ExpenseScheduleWithPlan | undefined;
    if (!expense) {
      return false;
    }
    if (expense.baixaMovementId) {
      throw new Error("schedule_in_use");
    }
    if (expense.plannedMovementId) {
      this.bankMovements.delete(expense.plannedMovementId);
    }
    this.expenseSchedules.delete(expense.id);
    this.refreshBankBalances(tenantId);
    return true;
  }

  listBankMovements(tenantId: string): BankMovement[] {
    this.applyDueAutomaticSettlements(tenantId);
    return [...this.bankMovements.values()]
      .filter((movement) => movement.tenantId === tenantId)
      .sort((left, right) => right.dataMovimento.localeCompare(left.dataMovimento));
  }

  getBankMovement(tenantId: string, movementId: string): BankMovement | undefined {
    const movement = this.bankMovements.get(movementId);
    return movement && movement.tenantId === tenantId ? movement : undefined;
  }

  saveBankMovement(entry: BankMovement): BankMovement {
    this.assertBankMovementReferences(entry.tenantId, entry);
    this.bankMovements.set(entry.id, entry);
    this.refreshBankBalances(entry.tenantId);
    return entry;
  }

  createBankMovement(command: CreateBankMovementCommand): BankMovement {
    const now = command.dataMovimento ?? new Date().toISOString();
    const movement: BankMovement = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: this.nextEntityCode(command.tenantId, "bank_movement"),
      tipo: command.tipo,
      bankIdOrigem: command.bankIdOrigem,
      bankIdDestino: command.bankIdDestino,
      valor: command.valor,
      historico: command.historico,
      beneficiarioNome: command.beneficiarioNome,
      dataMovimento: now,
      status: resolveMovementStatus(now),
      sourceType: command.sourceType ?? resolveManualMovementSourceType(command.tipo),
      createdAt: now,
      updatedAt: now
    };

    return this.saveBankMovement(movement);
  }

  updateBankMovement(
    tenantId: string,
    movementId: string,
    patch: Partial<
      Pick<
        BankMovement,
        "tipo" | "bankIdOrigem" | "bankIdDestino" | "valor" | "historico" | "beneficiarioNome" | "dataMovimento"
      >
    >
  ): BankMovement | undefined {
    const movement = this.getBankMovement(tenantId, movementId);
    if (!movement) {
      return undefined;
    }
    if (movement.status === "estornado") {
      throw new Error("bank_movement_already_reversed");
    }

    const nextMovement: BankMovement = {
      ...movement,
      ...patch,
      status: resolveMovementStatus(patch.dataMovimento ?? movement.dataMovimento),
      updatedAt: new Date().toISOString()
    };

    return this.saveBankMovement(nextMovement);
  }

  receiveRevenue(command: CreateBankReceiptCommand): BankMovement {
    this.assertBankBelongsToTenant(command.tenantId, command.bankIdDestino);
    const revenue = command.revenueId ? this.getRevenueSchedule(command.tenantId, command.revenueId) as RevenueScheduleWithPlan | undefined : undefined;
    if (command.revenueId && !revenue) {
      throw new Error("revenue_not_found");
    }
    const cashEntry = command.cashEntryId ? this.getCashEntry(command.tenantId, command.cashEntryId) : undefined;
    if (command.cashEntryId && !cashEntry) {
      throw new Error("cash_entry_not_found");
    }

    const now = command.dataMovimento ?? new Date().toISOString();
    const movement = this.settleBankMovement({
      tenantId: command.tenantId,
      sourceType: revenue ? "revenue_schedule" : cashEntry ? "cash_entry" : "manual_receipt",
      sourceId: revenue?.id ?? cashEntry?.id,
      plannedMovementId: revenue?.plannedMovementId,
      tipo: "entrada",
      bankIdDestino: command.bankIdDestino,
      valor: command.valor,
      historico: command.historico,
      dataMovimento: now
    });
    if (revenue) {
      const nextRevenue: RevenueScheduleWithPlan = {
        ...revenue,
        status: "recebida",
        plannedMovementId: movement.id,
        baixaMovementId: movement.id,
        settledAt: now,
        updatedAt: now
      };
      this.saveRevenueSchedule(nextRevenue);
    }
    return movement;
  }

  payExpense(command: CreateBankPaymentCommand): BankMovement {
    this.assertBankBelongsToTenant(command.tenantId, command.bankIdOrigem);
    const expense = command.expenseId ? this.getExpenseSchedule(command.tenantId, command.expenseId) as ExpenseScheduleWithPlan | undefined : undefined;
    if (command.expenseId && !expense) {
      throw new Error("expense_not_found");
    }

    const now = command.dataMovimento ?? new Date().toISOString();
    const movement = this.settleBankMovement({
      tenantId: command.tenantId,
      sourceType: expense ? "expense_schedule" : "manual_payment",
      sourceId: expense?.id,
      plannedMovementId: expense?.plannedMovementId,
      tipo: "saida",
      bankIdOrigem: command.bankIdOrigem,
      valor: command.valor,
      historico: command.historico,
      beneficiarioNome: command.beneficiarioNome,
      dataMovimento: now
    });
    if (expense) {
      const nextExpense: ExpenseScheduleWithPlan = {
        ...expense,
        status: "paga",
        plannedMovementId: movement.id,
        baixaMovementId: movement.id,
        settledAt: now,
        updatedAt: now
      };
      this.saveExpenseSchedule(nextExpense);
    }
    return movement;
  }

  transferBetweenBanks(command: CreateBankTransferCommand): BankMovement {
    this.assertBankBelongsToTenant(command.tenantId, command.bankIdOrigem);
    this.assertBankBelongsToTenant(command.tenantId, command.bankIdDestino);
    if (command.bankIdOrigem === command.bankIdDestino) {
      throw new Error("bank_transfer_same_account");
    }

    const now = command.dataMovimento ?? new Date().toISOString();
    const movement: BankMovement = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: this.nextEntityCode(command.tenantId, "bank_movement"),
      tipo: "transferencia",
      bankIdOrigem: command.bankIdOrigem,
      bankIdDestino: command.bankIdDestino,
      valor: command.valor,
      historico: command.historico,
      dataMovimento: now,
      status: resolveMovementStatus(now),
      sourceType: "transfer",
      createdAt: now,
      updatedAt: now
    };

    return this.saveBankMovement(movement);
  }

  reverseBankMovement(command: ReverseBankMovementCommand): BankMovement {
    const original = this.getBankMovement(command.tenantId, command.movementId);
    if (!original) {
      throw new Error("bank_movement_not_found");
    }
    if (original.status === "estornado") {
      throw new Error("bank_movement_already_reversed");
    }

    const now = command.dataMovimento ?? new Date().toISOString();
    const reverseType =
      original.tipo === "entrada"
        ? "saida"
        : original.tipo === "saida"
          ? "entrada"
          : original.tipo === "transferencia"
            ? "transferencia"
            : "estorno";
    const reverseMovement: BankMovement = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: this.nextEntityCode(command.tenantId, "bank_movement"),
      tipo: reverseType,
      bankIdOrigem:
        original.tipo === "entrada"
          ? original.bankIdDestino
          : original.tipo === "saida"
            ? undefined
            : original.tipo === "transferencia"
              ? original.bankIdDestino
              : original.bankIdDestino,
      bankIdDestino:
        original.tipo === "saida"
          ? original.bankIdOrigem
          : original.tipo === "entrada"
            ? undefined
            : original.tipo === "transferencia"
              ? original.bankIdOrigem
              : original.bankIdOrigem,
      valor: original.valor,
      historico: command.historico?.trim() || `Estorno ${original.historico}`,
      beneficiarioNome: original.beneficiarioNome,
      dataMovimento: now,
      status: "lancado",
      sourceType: "reversal",
      sourceId: original.id,
      reversedMovementId: original.id,
      createdAt: now,
      updatedAt: now
    };

    this.saveBankMovement({
      ...original,
      status: "estornado",
      reversedMovementId: reverseMovement.id,
      updatedAt: now
    });
    this.saveBankMovement(reverseMovement);
    this.reopenScheduleFromMovement(original, reverseMovement.id, now);
    return reverseMovement;
  }

  listCashCloses(tenantId: string): CashClose[] {
    return [...this.cashCloses.values()]
      .filter((entry) => entry.tenantId === tenantId)
      .sort((left, right) => right.dateTo.localeCompare(left.dateTo));
  }

  listCashCloseItems(tenantId: string, cashCloseId: string): CashCloseItem[] {
    return [...this.cashCloseItems.values()]
      .filter((entry) => entry.tenantId === tenantId && entry.cashCloseId === cashCloseId);
  }

  previewCashClose(
    tenantId: string,
    bankId: string,
    dateFrom: string,
    dateTo: string
  ): CashClosePreview {
    this.assertBankBelongsToTenant(tenantId, bankId);
    this.applyDueAutomaticSettlements(tenantId);

    const tenant = this.tenants.get(tenantId);
    const timeZone = tenant?.timezone ?? "America/Sao_Paulo";
    const banks = this.listBanks(tenantId);
    const relevantMovements = this.listBankMovements(tenantId).filter(
      (movement) =>
        ["revenue_schedule", "expense_schedule", "cash_entry"].includes(movement.sourceType) &&
        !movement.reversedMovementId &&
        movement.status !== "cancelado"
    );
    const pendingItems = relevantMovements
      .filter((movement) => isEligibleCashClosePendingMovement(movement, bankId, dateFrom, dateTo, timeZone))
      .flatMap((movement) => this.buildCashClosePreviewItem(tenantId, banks, movement, "pendente", timeZone));
    const settledItems = relevantMovements
      .filter((movement) => isEligibleCashCloseSettledMovement(movement, bankId, dateFrom, dateTo, timeZone))
      .flatMap((movement) => this.buildCashClosePreviewItem(tenantId, banks, movement, "baixado", timeZone));

    return {
      bankId,
      dateFrom,
      dateTo,
      pending: pendingItems.sort((left, right) =>
        left.dataReferencia.localeCompare(right.dataReferencia)
      ),
      settled: settledItems.sort((left, right) =>
        right.dataReferencia.localeCompare(left.dataReferencia)
      )
    };
  }

  createCashClose(command: CreateCashCloseCommand): {
    cashClose: CashClose;
    items: CashCloseItem[];
    movements: BankMovement[];
  } {
    const now = new Date().toISOString();
    const preview = this.previewCashClose(command.tenantId, command.bankId, command.dateFrom, command.dateTo);
    const selection = command.items?.length
      ? command.items
      : preview.pending.map((entry) => ({
          sourceType: entry.sourceType,
          sourceId: entry.sourceId
        }));
    const pendingMap = new Map(
      preview.pending.map((entry) => [buildCashCloseSelectionKey(entry.sourceType, entry.sourceId), entry] as const)
    );
    const selectedItems = selection.map((entry) => {
      const item = pendingMap.get(buildCashCloseSelectionKey(entry.sourceType, entry.sourceId));
      if (!item) {
        throw new Error("cash_close_item_not_available");
      }
      return item;
    });

    const movements: BankMovement[] = [
      ...selectedItems.map((entry) => {
        if (entry.sourceType === "revenue_schedule") {
          const revenue = this.getRevenueSchedule(command.tenantId, entry.sourceId);
          if (!revenue) {
            throw new Error("revenue_not_found");
          }
          return this.receiveRevenue({
            version: "v1",
            tenantId: command.tenantId,
            bankIdDestino: command.bankId,
            valor: revenue.valor,
            historico: revenue.descricao,
            dataMovimento: buildMovementReferenceDate(entry.dataReferencia),
            revenueId: revenue.id
          });
        }

        if (entry.sourceType === "expense_schedule") {
          const expense = this.getExpenseSchedule(command.tenantId, entry.sourceId);
          if (!expense) {
            throw new Error("expense_not_found");
          }
          return this.payExpense({
            version: "v1",
            tenantId: command.tenantId,
            bankIdOrigem: command.bankId,
            valor: expense.valor,
            historico: expense.descricao,
            dataMovimento: buildMovementReferenceDate(entry.dataReferencia),
            beneficiarioNome: expense.beneficiarioNome,
            expenseId: expense.id
          });
        }

        const cashEntry = this.getCashEntry(command.tenantId, entry.sourceId);
        if (!cashEntry) {
          throw new Error("cash_entry_not_found");
        }

        return this.receiveRevenue({
          version: "v1",
          tenantId: command.tenantId,
          bankIdDestino: command.bankId,
          valor: cashEntry.amount,
          historico: cashEntry.description,
          dataMovimento: buildMovementReferenceDate(entry.dataReferencia),
          cashEntryId: cashEntry.id
        });
      })
    ];

    const cashClose: CashClose = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: this.nextEntityCode(command.tenantId, "cash_close"),
      bankId: command.bankId,
      dateFrom: command.dateFrom,
      dateTo: command.dateTo,
      totalEntradas: roundMoney(
        movements
          .filter((entry) => entry.tipo === "entrada")
          .reduce((total, entry) => total + entry.valor, 0)
      ),
      totalSaidas: roundMoney(
        movements
          .filter((entry) => entry.tipo === "saida")
          .reduce((total, entry) => total + entry.valor, 0)
      ),
      saldoFechado: roundMoney(
        movements.reduce(
          (total, entry) => total + (entry.tipo === "entrada" ? entry.valor : entry.tipo === "saida" ? -entry.valor : 0),
          0
        )
      ),
      status: "fechado",
      createdAt: now,
      updatedAt: now
    };
    this.cashCloses.set(cashClose.id, cashClose);

    const items: CashCloseItem[] = selectedItems.map((entry) => {
      const movement = movements.find(
        (item) => item.sourceId === entry.sourceId && item.sourceType === entry.sourceType
      );
      return {
        version: "v1" as const,
        id: randomUUID(),
        tenantId: command.tenantId,
        cashCloseId: cashClose.id,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        tipo: entry.tipo,
        descricao: entry.descricao,
        valor: entry.valor,
        movementId: movement?.id ?? "",
        createdAt: now,
        updatedAt: now
      };
    });
    items.forEach((item) => this.cashCloseItems.set(item.id, item));

    return {
      cashClose,
      items,
      movements
    };
  }

  getPaymentSettings(tenantId: string): TenantPaymentSettings | undefined {
    return this.paymentSettings.get(tenantId);
  }

  upsertPaymentSettings(command: TenantPaymentSettings): TenantPaymentSettings {
    const nextSettings: TenantPaymentSettings = {
      ...command
    };

    this.paymentSettings.set(command.tenantId, nextSettings);
    return nextSettings;
  }

  recordPaymentIntent(intent: PaymentIntent): PaymentIntent {
    this.paymentIntents.set(intent.id, intent);
    return intent;
  }

  getPaymentIntent(tenantId: string, paymentIntentId: string): PaymentIntent | undefined {
    const paymentIntent = this.paymentIntents.get(paymentIntentId);
    return paymentIntent && paymentIntent.tenantId === tenantId ? paymentIntent : undefined;
  }

  getPaymentIntentByExternalReference(
    tenantId: string,
    externalReference: string
  ): PaymentIntent | undefined {
    return [...this.paymentIntents.values()].find(
      (paymentIntent) =>
        paymentIntent.tenantId === tenantId &&
        paymentIntent.externalReference === externalReference
    );
  }

  listPaymentIntents(tenantId: string): PaymentIntent[] {
    return [...this.paymentIntents.values()].filter(
      (paymentIntent) => paymentIntent.tenantId === tenantId
    );
  }

  listCashEntries(tenantId: string): CashEntry[] {
    return [...this.cashEntries.values()]
      .filter((cashEntry) => cashEntry.tenantId === tenantId)
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  }

  getCashEntry(tenantId: string, cashEntryId: string): CashEntry | undefined {
    const cashEntry = this.cashEntries.get(cashEntryId);
    return cashEntry && cashEntry.tenantId === tenantId ? cashEntry : undefined;
  }

  getCashEntryByBookingAndKind(
    tenantId: string,
    bookingId: string,
    kind: CashEntryKind
  ): CashEntry | undefined {
    return this.listCashEntries(tenantId).find(
      (cashEntry) => cashEntry.bookingId === bookingId && cashEntry.kind === kind
    );
  }

  saveCashEntry(entry: CashEntry): CashEntry {
    this.assertClientBelongsToTenant(entry.tenantId, entry.clientId);
    this.assertServiceBelongsToTenant(entry.tenantId, entry.serviceId);
    this.assertProfessionalBelongsToTenant(entry.tenantId, entry.professionalId);

    const booking = this.getBooking(entry.tenantId, entry.bookingId);
    if (!booking) {
      throw new Error("booking_not_found");
    }

    this.cashEntries.set(entry.id, entry);
    this.syncCashEntryPlannedMovement(entry);
    return entry;
  }

  updatePaymentIntent(
    tenantId: string,
    paymentIntentId: string,
    patch: PaymentIntentPatchInput
  ): PaymentIntent | undefined {
    const paymentIntent = this.getPaymentIntent(tenantId, paymentIntentId);
    if (!paymentIntent) {
      return undefined;
    }

    const nextPaymentIntent: PaymentIntent = {
      ...paymentIntent,
      ...patch
    };

    this.paymentIntents.set(nextPaymentIntent.id, nextPaymentIntent);
    return nextPaymentIntent;
  }

  listClients(tenantId: string): Client[] {
    return [...this.clients.values()].filter((client) => client.tenantId === tenantId);
  }

  getClient(tenantId: string, clientId: string): Client | undefined {
    const client = this.clients.get(clientId);
    return client && client.tenantId === tenantId ? client : undefined;
  }

  createClient(tenantId: string, input: ClientContactInput): Client {
    const client: Client = {
      version: "v1",
      id: randomUUID(),
      tenantId,
      codigo: normalizeExplicitCode(input.codigo) ?? this.nextEntityCode(tenantId, "client"),
      nome: input.nome,
      telefone: input.telefone,
      email: input.email.trim().toLowerCase(),
      origem: input.origem
    };

    this.clients.set(client.id, client);
    return client;
  }

  updateClient(tenantId: string, clientId: string, patch: ClientPatchInput): Client | undefined {
    const client = this.getClient(tenantId, clientId);
    if (!client) {
      return undefined;
    }

    const nextClient: Client = {
      ...client,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? client.codigo,
      email: patch.email ? patch.email.trim().toLowerCase() : client.email
    };

    this.clients.set(nextClient.id, nextClient);
    return nextClient;
  }

  deleteClient(tenantId: string, clientId: string): boolean {
    const client = this.getClient(tenantId, clientId);
    if (!client) {
      return false;
    }

    this.clients.delete(client.id);
    return true;
  }

  listProfessionals(tenantId: string): Professional[] {
    return [...this.professionals.values()].filter(
      (professional) => professional.tenantId === tenantId
    );
  }

  listProfessionalsForService(tenantId: string, serviceId?: string): Professional[] {
    return this.listProfessionals(tenantId).filter((professional) => {
      if (professional.status !== "active") {
        return false;
      }

      return serviceId ? professional.especialidades.includes(serviceId) : true;
    });
  }

  getProfessional(tenantId: string, professionalId: string): Professional | undefined {
    const professional = this.professionals.get(professionalId);
    return professional && professional.tenantId === tenantId ? professional : undefined;
  }

  createProfessional(command: CreateProfessionalCommand): Professional {
    for (const serviceId of command.especialidades) {
      this.assertServiceBelongsToTenant(command.tenantId, serviceId);
    }
    if (command.bankId) {
      this.assertBankBelongsToTenant(command.tenantId, command.bankId);
    }

    const professional: Professional = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo:
        normalizeExplicitCode(command.codigo) ?? this.nextEntityCode(command.tenantId, "professional"),
      nome: command.nome,
      status: "active",
      especialidades: [...command.especialidades],
      bankId: command.bankId
    };

    this.professionals.set(professional.id, professional);
    return professional;
  }

  updateProfessional(
    tenantId: string,
    professionalId: string,
    patch: ProfessionalPatchInput
  ): Professional | undefined {
    const professional = this.getProfessional(tenantId, professionalId);
    if (!professional) {
      return undefined;
    }

    if (patch.especialidades) {
      for (const serviceId of patch.especialidades) {
        this.assertServiceBelongsToTenant(tenantId, serviceId);
      }
    }
    if (patch.bankId) {
      this.assertBankBelongsToTenant(tenantId, patch.bankId);
    }

    const nextProfessional: Professional = {
      ...professional,
      ...patch,
      codigo: normalizeExplicitCode(patch.codigo) ?? professional.codigo,
      especialidades: patch.especialidades ? [...patch.especialidades] : professional.especialidades
    };

    this.professionals.set(nextProfessional.id, nextProfessional);
    return nextProfessional;
  }

  deleteProfessional(tenantId: string, professionalId: string): boolean {
    const professional = this.getProfessional(tenantId, professionalId);
    if (!professional) {
      return false;
    }

    this.professionals.delete(professional.id);

    for (const [ruleId, rule] of this.availabilityRules.entries()) {
      if (rule.tenantId === tenantId && rule.professionalId === professional.id) {
        this.availabilityRules.delete(ruleId);
      }
    }

    return true;
  }

  replaceAvailabilityRules(
    tenantId: string,
    professionalId: string,
    rules: AvailabilityRuleInput[]
  ): AvailabilityRule[] {
    const professional = this.getProfessional(tenantId, professionalId);
    if (!professional) {
      throw new Error("professional_not_found");
    }

    for (const rule of rules) {
      if (toMinutes(rule.faixa.endTime) <= toMinutes(rule.faixa.startTime)) {
        throw new Error("availability_rule_invalid");
      }
    }

    for (const [ruleId, rule] of this.availabilityRules.entries()) {
      if (rule.tenantId === tenantId && rule.professionalId === professionalId) {
        this.availabilityRules.delete(ruleId);
      }
    }

    const createdRules = rules.map<AvailabilityRule>((rule) => {
      const availabilityRule: AvailabilityRule = {
        version: "v1",
        id: randomUUID(),
        tenantId,
        professionalId,
        weekday: rule.weekday,
        faixa: {
          startTime: rule.faixa.startTime,
          endTime: rule.faixa.endTime
        }
      };

      this.availabilityRules.set(availabilityRule.id, availabilityRule);
      return availabilityRule;
    });

    return createdRules;
  }

  listAvailabilityRules(tenantId: string, professionalId: string): AvailabilityRule[] {
    return [...this.availabilityRules.values()].filter(
      (rule) => rule.tenantId === tenantId && rule.professionalId === professionalId
    );
  }

  listAvailableSlots(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    date: string,
    bookingToIgnoreId?: string,
    options?: {
      readonly includePast?: boolean;
    }
  ): PublicAvailabilitySlot[] {
    const service = this.getService(tenantId, serviceId);
    if (!service) {
      throw new Error("service_not_found");
    }

    const professional = this.getProfessional(tenantId, professionalId);
    if (!professional) {
      throw new Error("professional_not_found");
    }

    if (professional.status !== "active") {
      throw new Error("professional_inactive");
    }

    if (!professional.especialidades.includes(service.id)) {
      throw new Error("service_not_available_for_professional");
    }

    const weekday = weekdayFromDate(date);
    const rules = this.listAvailabilityRules(tenantId, professionalId)
      .filter((rule) => rule.weekday === weekday)
      .sort((left, right) => toMinutes(left.faixa.startTime) - toMinutes(right.faixa.startTime));

    const blockingBookings = this.listBookings(tenantId).filter((booking) => {
      if (booking.id === bookingToIgnoreId) {
        return false;
      }
      if (booking.professionalId !== professionalId) {
        return false;
      }

      if (!blocksAvailability(booking.status)) {
        return false;
      }

      const window = parseTimeWindow(booking.startAt, booking.endAt);
      return window.date === date;
    });

    const slots: PublicAvailabilitySlot[] = [];

    for (const rule of rules) {
      let cursor = toMinutes(rule.faixa.startTime);
      const boundary = toMinutes(rule.faixa.endTime);

      while (cursor + service.duracaoMin <= boundary) {
        const candidateStartAt = `${date}T${fromMinutes(cursor)}:00`;
        const candidateEndAt = `${date}T${fromMinutes(cursor + service.duracaoMin)}:00`;
        if (!options?.includePast && isDateTimeInPast(candidateEndAt)) {
          cursor += service.duracaoMin;
          continue;
        }

        const candidate: PublicAvailabilitySlot = {
          date,
          startTime: fromMinutes(cursor),
          endTime: fromMinutes(cursor + service.duracaoMin),
          startAt: candidateStartAt,
          endAt: candidateEndAt
        };

        const overlapsBlockingBooking = blockingBookings.some((booking) => {
          const window = parseTimeWindow(booking.startAt, booking.endAt);
          return intervalsOverlap(cursor, cursor + service.duracaoMin, window.startMinutes, window.endMinutes);
        });

        if (!overlapsBlockingBooking) {
          slots.push(candidate);
        }

        cursor += service.duracaoMin;
      }
    }

    return slots;
  }

  listBookings(tenantId: string): Booking[] {
    return [...this.bookings.values()].filter((booking) => booking.tenantId === tenantId);
  }

  getBooking(tenantId: string, bookingId: string): Booking | undefined {
    const booking = this.bookings.get(bookingId);
    return booking && booking.tenantId === tenantId ? booking : undefined;
  }

  createBooking(command: CreateBookingCommand): Booking {
    this.assertClientBelongsToTenant(command.tenantId, command.clientId);
    this.assertServiceBelongsToTenant(command.tenantId, command.serviceId);
    this.assertProfessionalSupportsService(
      command.tenantId,
      command.professionalId,
      command.serviceId
    );
    this.assertBookingWindowNotInPast(command.startAt, command.endAt, command.status);
    const allowHistoricalSlotValidation =
      command.status === "concluido" && isDateTimeInPast(command.endAt);
    this.assertWindowAvailable(
      command.tenantId,
      command.serviceId,
      command.professionalId,
      command.startAt,
      command.endAt,
      undefined,
      {
        includePast: allowHistoricalSlotValidation
      }
    );

    const booking: Booking = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      clientId: command.clientId,
      serviceId: command.serviceId,
      professionalId: command.professionalId,
      status: command.status,
      startAt: command.startAt,
      endAt: command.endAt
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  updateBooking(tenantId: string, bookingId: string, patch: BookingPatchInput): Booking | undefined {
    const booking = this.getBooking(tenantId, bookingId);
    if (!booking) {
      return undefined;
    }

    const nextBooking: Booking = {
      ...booking,
      ...patch
    };

    this.assertClientBelongsToTenant(tenantId, nextBooking.clientId);
    this.assertServiceBelongsToTenant(tenantId, nextBooking.serviceId);
    this.assertProfessionalSupportsService(
      tenantId,
      nextBooking.professionalId,
      nextBooking.serviceId
    );
    if (
      patch.startAt !== undefined ||
      patch.endAt !== undefined ||
      patch.professionalId !== undefined ||
      patch.serviceId !== undefined
    ) {
      this.assertBookingWindowNotInPast(nextBooking.startAt, nextBooking.endAt, nextBooking.status);
      const allowHistoricalSlotValidation =
        nextBooking.status === "concluido" && isDateTimeInPast(nextBooking.endAt);
      this.assertWindowAvailable(
        tenantId,
        nextBooking.serviceId,
        nextBooking.professionalId,
        nextBooking.startAt,
        nextBooking.endAt,
        booking.id,
        {
          includePast: allowHistoricalSlotValidation
        }
      );
    }

    this.bookings.set(nextBooking.id, nextBooking);
    return nextBooking;
  }

  deleteBooking(tenantId: string, bookingId: string): boolean {
    const booking = this.getBooking(tenantId, bookingId);
    if (!booking) {
      return false;
    }

    this.bookings.delete(booking.id);
    return true;
  }

  createPublicBooking(input: PublicCreateBookingInput): PublicBookingResult {
    const context = this.resolvePublicBookingContext(input);
    const { tenant, service, professional, client } = context;

    if (service.exigeSinal || service.paymentPolicy.collectionMode !== "none") {
      throw new Error("payment_required");
    }

    const booking = this.createBooking({
      version: "v1",
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      professionalId: professional.id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "confirmado"
    });

    return {
      tenant: this.toPublicTenantProfile(tenant),
      client,
      service,
      professional,
      booking
    };
  }

  createPublicPaymentBooking(input: PublicCreateBookingInput): PublicBookingResult {
    const context = this.resolvePublicBookingContext(input);
    const { tenant, service, professional, client } = context;

    if (service.paymentPolicy.collectionMode === "none" && !service.exigeSinal) {
      throw new Error("payment_not_required");
    }

    const booking = this.createBooking({
      version: "v1",
      tenantId: tenant.id,
      clientId: client.id,
      serviceId: service.id,
      professionalId: professional.id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "aguardando pagamento"
    });

    return {
      tenant: this.toPublicTenantProfile(tenant),
      client,
      service,
      professional,
      booking
    };
  }

  listReportDefinitions(tenantId: string): ReportDefinition[] {
    return [...this.reportDefinitions.values()]
      .filter((definition) => definition.tenantId === tenantId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  getReportDefinition(tenantId: string, reportDefinitionId: string): ReportDefinition | undefined {
    const definition = this.reportDefinitions.get(reportDefinitionId);
    return definition && definition.tenantId === tenantId ? definition : undefined;
  }

  saveReportDefinition(definition: ReportDefinition): ReportDefinition {
    this.reportDefinitions.set(definition.id, definition);
    return definition;
  }

  deleteReportDefinition(tenantId: string, reportDefinitionId: string): boolean {
    const definition = this.getReportDefinition(tenantId, reportDefinitionId);
    if (!definition) {
      return false;
    }

    this.reportDefinitions.delete(reportDefinitionId);
    return true;
  }

  private issueSession(adminUser: StoredAdminUser): AdminSessionRecord {
    const session: AdminSessionRecord = {
      token: randomUUID(),
      claims: {
        actor: "admin_user",
        sub: adminUser.id,
        tenantId: adminUser.tenantId,
        role: adminUser.role
      }
    };

    this.sessions.set(session.token, session);
    return session;
  }

  private assertSlugAvailable(slug: string): void {
    if (this.tenantIdsBySlug.has(slug)) {
      throw new Error("slug_already_exists");
    }
  }

  private assertClientBelongsToTenant(tenantId: string, clientId: string): void {
    if (!this.getClient(tenantId, clientId)) {
      throw new Error("client_not_found");
    }
  }

  private resolvePublicBookingContext(input: PublicCreateBookingInput): {
    tenant: Tenant;
    service: Service;
    professional: Professional;
    client: Client;
  } {
    const tenant = this.getTenantBySlug(input.slug);
    if (!tenant) {
      throw new Error("tenant_not_found");
    }

    const service = this.getService(tenant.id, input.serviceId);
    if (!service) {
      throw new Error("service_not_found");
    }

    const professional = this.getProfessional(tenant.id, input.professionalId);
    if (!professional) {
      throw new Error("professional_not_found");
    }

    const normalizedEmail = input.client.email.trim().toLowerCase();
    const normalizedPhone = input.client.telefone.trim();

    const existingClient = this.listClients(tenant.id).find(
      (client) => client.email === normalizedEmail || client.telefone === normalizedPhone
    );

    const client =
      existingClient ??
      this.createClient(tenant.id, {
        ...input.client,
        email: normalizedEmail,
        telefone: normalizedPhone
      });

    return {
      tenant,
      service,
      professional,
      client
    };
  }

  private assertServiceBelongsToTenant(tenantId: string, serviceId: string): void {
    if (!this.getService(tenantId, serviceId)) {
      throw new Error("service_not_found");
    }
  }

  private assertBankBelongsToTenant(tenantId: string, bankId: string): void {
    if (!this.getBank(tenantId, bankId)) {
      throw new Error("bank_not_found");
    }
  }

  private assertBankAccountUnique(
    tenantId: string,
    bacenCode: string,
    agencia: string,
    conta: string,
    bankToIgnoreId?: string
  ): void {
    const duplicate = this.listBanks(tenantId).find(
      (bank) =>
        bank.id !== bankToIgnoreId &&
        bank.bacenCode === bacenCode &&
        bank.agencia === agencia &&
        bank.conta === conta
    );
    if (duplicate) {
      throw new Error("bank_account_already_exists");
    }
  }

  private assertProfessionalBelongsToTenant(tenantId: string, professionalId: string): void {
    if (!this.getProfessional(tenantId, professionalId)) {
      throw new Error("professional_not_found");
    }
  }

  private assertProfessionalSupportsService(
    tenantId: string,
    professionalId: string,
    serviceId: string
  ): void {
    const professional = this.getProfessional(tenantId, professionalId);
    if (!professional) {
      throw new Error("professional_not_found");
    }

    if (professional.status !== "active") {
      throw new Error("professional_inactive");
    }

    if (!professional.especialidades.includes(serviceId)) {
      throw new Error("service_not_available_for_professional");
    }
  }

  private assertBookingWindowNotInPast(
    startAt: string,
    endAt: string,
    status: Booking["status"]
  ): void {
    if (status !== "concluido" && isDateTimeInPast(endAt)) {
      throw new Error("booking_time_in_past");
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      throw new Error("booking_time_invalid");
    }
  }

  private assertWindowAvailable(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    startAt: string,
    endAt: string,
    bookingToIgnoreId?: string,
    options?: {
      readonly includePast?: boolean;
    }
  ): void {
    const requestedWindow = parseTimeWindow(startAt, endAt);
    if (requestedWindow.endMinutes <= requestedWindow.startMinutes) {
      throw new Error("booking_time_invalid");
    }

    const slots = this.listAvailableSlots(
      tenantId,
      serviceId,
      professionalId,
      requestedWindow.date,
      bookingToIgnoreId,
      options
    );
    const matchingSlot = slots.find(
      (slot) => slot.startTime === fromMinutes(requestedWindow.startMinutes) &&
        slot.endTime === fromMinutes(requestedWindow.endMinutes)
    );

    if (!matchingSlot) {
      throw new Error("slot_unavailable");
    }

    const conflictingBooking = this.listBookings(tenantId).find((booking) => {
      if (booking.id === bookingToIgnoreId) {
        return false;
      }
      if (booking.professionalId !== professionalId) {
        return false;
      }
      if (!blocksAvailability(booking.status)) {
        return false;
      }

      const existingWindow = parseTimeWindow(booking.startAt, booking.endAt);
      if (existingWindow.date !== requestedWindow.date) {
        return false;
      }

      return intervalsOverlap(
        requestedWindow.startMinutes,
        requestedWindow.endMinutes,
        existingWindow.startMinutes,
        existingWindow.endMinutes
      );
    });

    if (conflictingBooking) {
      throw new Error("booking_conflict");
    }
  }

  private withoutPassword(adminUser: StoredAdminUser): AdminUser {
    return {
      version: adminUser.version,
      id: adminUser.id,
      tenantId: adminUser.tenantId,
      nome: adminUser.nome,
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.status
    };
  }

  private nextEntityCode(
    tenantId: string,
    entity:
      | "service"
      | "professional"
      | "client"
      | "bank"
      | "bank_balance"
      | "revenue"
      | "expense"
      | "cash_close"
      | "bank_movement"
  ): string {
    const prefix =
      entity === "service" ? "SRV"
      : entity === "professional" ? "PRO"
      : entity === "client" ? "CLI"
      : entity === "bank" ? "BNK"
      : entity === "bank_balance" ? "SAL"
      : entity === "revenue" ? "REC"
      : entity === "expense" ? "DES"
      : entity === "cash_close" ? "FCX"
      : "MOV";
    const values =
      entity === "service"
        ? this.listServices(tenantId).map((item) => item.codigo)
        : entity === "professional"
          ? this.listProfessionals(tenantId).map((item) => item.codigo)
          : entity === "client"
            ? this.listClients(tenantId).map((item) => item.codigo)
            : entity === "bank"
              ? this.listBanks(tenantId).map((item) => item.codigo)
              : entity === "bank_balance"
                ? this.listBankBalances(tenantId).map((item) => item.codigo)
                : entity === "revenue"
                  ? this.listRevenueSchedules(tenantId).map((item) => item.codigo)
                  : entity === "expense"
                    ? this.listExpenseSchedules(tenantId).map((item) => item.codigo)
                    : entity === "cash_close"
                    ? this.listCashCloses(tenantId).map((item) => item.codigo)
                    : [...this.bankMovements.values()]
                        .filter((item) => item.tenantId === tenantId)
                        .map((item) => item.codigo);
    return nextSequentialCode(prefix, values);
  }

  private refreshBankBalances(tenantId: string): void {
    const movements = this.listBankMovements(tenantId);
    for (const balance of this.listBankBalances(tenantId)) {
      this.bankBalances.set(balance.id, {
        ...balance,
        saldoAtual: computeCurrentBalance(balance.saldoInicial, movements, balance.bankId),
        updatedAt: new Date().toISOString()
      });
    }
  }

  private refreshAllBankBalances(): void {
    for (const tenant of this.tenants.values()) {
      this.refreshBankBalances(tenant.id);
    }
  }

  private findActiveMovementBySource(
    tenantId: string,
    sourceType: BankMovementSourceType,
    sourceId: string
  ): BankMovement | undefined {
    return [...this.bankMovements.values()]
      .filter((movement) => movement.tenantId === tenantId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .find(
      (movement) =>
        movement.sourceType === sourceType &&
        movement.sourceId === sourceId &&
        movement.status !== "cancelado" &&
        !movement.reversedMovementId
    );
  }

  private ensurePlannedBankMovement(input: {
    tenantId: string;
    sourceType: Extract<BankMovementSourceType, "revenue_schedule" | "expense_schedule" | "cash_entry">;
    sourceId: string;
    plannedMovementId?: string;
    tipo: Extract<BankMovement["tipo"], "entrada" | "saida">;
    bankId?: string;
    valor: number;
    historico: string;
    beneficiarioNome?: string;
    dataMovimento: string;
  }): BankMovement {
    const existingMovement =
      (input.plannedMovementId ? this.getBankMovement(input.tenantId, input.plannedMovementId) : undefined) ??
      this.findActiveMovementBySource(input.tenantId, input.sourceType, input.sourceId);

    if (existingMovement && existingMovement.status === "lancado") {
      return existingMovement;
    }

    const now = new Date().toISOString();
    const nextMovement: BankMovement = existingMovement
      ? {
          ...existingMovement,
          tipo: input.tipo,
          bankIdOrigem: input.tipo === "saida" ? input.bankId : undefined,
          bankIdDestino: input.tipo === "entrada" ? input.bankId : undefined,
          valor: input.valor,
          historico: input.historico,
          beneficiarioNome: input.beneficiarioNome,
          dataMovimento: input.dataMovimento,
          status: "previsto",
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          updatedAt: now
        }
      : {
          version: "v1",
          id: randomUUID(),
          tenantId: input.tenantId,
          codigo: this.nextEntityCode(input.tenantId, "bank_movement"),
          tipo: input.tipo,
          bankIdOrigem: input.tipo === "saida" ? input.bankId : undefined,
          bankIdDestino: input.tipo === "entrada" ? input.bankId : undefined,
          valor: input.valor,
          historico: input.historico,
          beneficiarioNome: input.beneficiarioNome,
          dataMovimento: input.dataMovimento,
          status: "previsto",
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          createdAt: now,
          updatedAt: now
        };

    return this.saveBankMovement(nextMovement);
  }

  private settleBankMovement(input: {
    tenantId: string;
    sourceType: BankMovementSourceType;
    sourceId?: string;
    plannedMovementId?: string;
    tipo: Extract<BankMovement["tipo"], "entrada" | "saida">;
    bankIdOrigem?: string;
    bankIdDestino?: string;
    valor: number;
    historico: string;
    beneficiarioNome?: string;
    dataMovimento: string;
  }): BankMovement {
    const existingMovement =
      (input.plannedMovementId ? this.getBankMovement(input.tenantId, input.plannedMovementId) : undefined) ??
      (input.sourceId ? this.findActiveMovementBySource(input.tenantId, input.sourceType, input.sourceId) : undefined);
    if (existingMovement && existingMovement.status === "lancado") {
      return existingMovement;
    }

    const now = new Date().toISOString();
    const nextMovement: BankMovement = existingMovement
      ? {
          ...existingMovement,
          tipo: input.tipo,
          bankIdOrigem: input.bankIdOrigem,
          bankIdDestino: input.bankIdDestino,
          valor: input.valor,
          historico: input.historico,
          beneficiarioNome: input.beneficiarioNome,
          dataMovimento: input.dataMovimento,
          status: "lancado",
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          updatedAt: now
        }
      : {
          version: "v1",
          id: randomUUID(),
          tenantId: input.tenantId,
          codigo: this.nextEntityCode(input.tenantId, "bank_movement"),
          tipo: input.tipo,
          bankIdOrigem: input.bankIdOrigem,
          bankIdDestino: input.bankIdDestino,
          valor: input.valor,
          historico: input.historico,
          beneficiarioNome: input.beneficiarioNome,
          dataMovimento: input.dataMovimento,
          status: "lancado",
          sourceType: input.sourceType,
          sourceId: input.sourceId,
          createdAt: now,
          updatedAt: now
        };

    return this.saveBankMovement(nextMovement);
  }

  private syncRevenuePlannedMovement(entry: RevenueScheduleWithPlan): RevenueScheduleWithPlan {
    if (entry.status !== "aberta") {
      if (entry.plannedMovementId && entry.plannedMovementId !== entry.baixaMovementId) {
        const movement = this.getBankMovement(entry.tenantId, entry.plannedMovementId);
        if (movement && movement.status === "previsto") {
          this.saveBankMovement({
            ...movement,
            status: "cancelado",
            updatedAt: new Date().toISOString()
          });
        }
      }
      return entry;
    }

    const plannedMovement = this.ensurePlannedBankMovement({
      tenantId: entry.tenantId,
      sourceType: "revenue_schedule",
      sourceId: entry.id,
      plannedMovementId: entry.plannedMovementId,
      tipo: "entrada",
      bankId: entry.bankId,
      valor: entry.valor,
      historico: entry.descricao,
      dataMovimento: buildMovementReferenceDate(entry.dataVencimento)
    });

    if (entry.plannedMovementId === plannedMovement.id) {
      return entry;
    }

    const nextEntry = {
      ...entry,
      plannedMovementId: plannedMovement.id,
      updatedAt: new Date().toISOString()
    };
    this.saveRevenueSchedule(nextEntry);
    return nextEntry;
  }

  private syncExpensePlannedMovement(entry: ExpenseScheduleWithPlan): ExpenseScheduleWithPlan {
    if (entry.status !== "aberta") {
      if (entry.plannedMovementId && entry.plannedMovementId !== entry.baixaMovementId) {
        const movement = this.getBankMovement(entry.tenantId, entry.plannedMovementId);
        if (movement && movement.status === "previsto") {
          this.saveBankMovement({
            ...movement,
            status: "cancelado",
            updatedAt: new Date().toISOString()
          });
        }
      }
      return entry;
    }

    const plannedMovement = this.ensurePlannedBankMovement({
      tenantId: entry.tenantId,
      sourceType: "expense_schedule",
      sourceId: entry.id,
      plannedMovementId: entry.plannedMovementId,
      tipo: "saida",
      bankId: entry.bankId,
      valor: entry.valor,
      historico: entry.descricao,
      beneficiarioNome: entry.beneficiarioNome,
      dataMovimento: buildMovementReferenceDate(entry.dataVencimento)
    });

    if (entry.plannedMovementId === plannedMovement.id) {
      return entry;
    }

    const nextEntry = {
      ...entry,
      plannedMovementId: plannedMovement.id,
      updatedAt: new Date().toISOString()
    };
    this.saveExpenseSchedule(nextEntry);
    return nextEntry;
  }

  private syncCashEntryPlannedMovement(entry: CashEntry): void {
    const existingMovement = this.findActiveMovementBySource(entry.tenantId, "cash_entry", entry.id);
    if (entry.status !== "open") {
      if (existingMovement && existingMovement.status === "previsto") {
        this.saveBankMovement({
          ...existingMovement,
          status: "cancelado",
          updatedAt: new Date().toISOString()
        });
      }
      return;
    }

    this.ensurePlannedBankMovement({
      tenantId: entry.tenantId,
      sourceType: "cash_entry",
      sourceId: entry.id,
      plannedMovementId: existingMovement?.id,
      tipo: "entrada",
      valor: entry.amount,
      historico: entry.description,
      dataMovimento: entry.occurredAt
    });
  }

  private buildCashClosePreviewItem(
    tenantId: string,
    banks: readonly Bank[],
    movement: BankMovement,
    status: CashClosePreviewItem["status"],
    timeZone: string
  ): CashClosePreviewItem[] {
    if (!movement.sourceId) {
      return [];
    }

    if (movement.sourceType === "revenue_schedule") {
      const revenue = this.getRevenueSchedule(tenantId, movement.sourceId) as RevenueScheduleWithPlan | undefined;
      if (!revenue) {
        return [];
      }
      return [{
        sourceType: "revenue_schedule",
        sourceId: revenue.id,
        tipo: "entrada",
        descricao: revenue.descricao,
        valor: revenue.valor,
        dataReferencia: resolveBusinessDate(movement.dataMovimento, timeZone),
        movementId: status === "baixado" ? movement.id : undefined,
        bankId: movement.bankIdDestino,
        bankLabel: resolveBankAccountLabel(banks.find((bank) => bank.id === movement.bankIdDestino)),
        status
      }];
    }

    if (movement.sourceType === "expense_schedule") {
      const expense = this.getExpenseSchedule(tenantId, movement.sourceId) as ExpenseScheduleWithPlan | undefined;
      if (!expense) {
        return [];
      }
      return [{
        sourceType: "expense_schedule",
        sourceId: expense.id,
        tipo: "saida",
        descricao: expense.descricao,
        valor: expense.valor,
        dataReferencia: resolveBusinessDate(movement.dataMovimento, timeZone),
        movementId: status === "baixado" ? movement.id : undefined,
        bankId: movement.bankIdOrigem,
        bankLabel: resolveBankAccountLabel(banks.find((bank) => bank.id === movement.bankIdOrigem)),
        status
      }];
    }

    if (movement.sourceType === "cash_entry") {
      const cashEntry = this.getCashEntry(tenantId, movement.sourceId);
      if (!cashEntry) {
        return [];
      }
      return [{
        sourceType: "cash_entry",
        sourceId: cashEntry.id,
        tipo: "entrada",
        descricao: cashEntry.description,
        valor: cashEntry.amount,
        dataReferencia: resolveBusinessDate(movement.dataMovimento, timeZone),
        movementId: status === "baixado" ? movement.id : undefined,
        bankId: movement.bankIdDestino,
        bankLabel: resolveBankAccountLabel(banks.find((bank) => bank.id === movement.bankIdDestino)),
        status
      }];
    }

    return [];
  }

  private ensureFinancialDefaults(): void {
    for (const tenant of this.tenants.values()) {
      if (this.listBanks(tenant.id).length > 0) {
        continue;
      }

      const now = new Date().toISOString();
      const bank: Bank = {
        version: "v1",
        id: randomUUID(),
        tenantId: tenant.id,
        codigo: this.nextEntityCode(tenant.id, "bank"),
        bacenCode: "001",
        nomeBanco: "Banco do Brasil",
        agencia: "0001",
        conta: "12345-6",
        ativo: true,
        createdAt: now,
        updatedAt: now
      };
      this.banks.set(bank.id, bank);

      const balance: BankBalance = {
        version: "v1",
        id: randomUUID(),
        tenantId: tenant.id,
        codigo: this.nextEntityCode(tenant.id, "bank_balance"),
        bankId: bank.id,
        saldoInicial: 0,
        saldoAtual: 0,
        dataSaldoInicial: now.slice(0, 10),
        createdAt: now,
        updatedAt: now
      };
      this.bankBalances.set(balance.id, balance);
    }
  }

  private applyDueAutomaticSettlements(tenantId: string): void {
    if (this.isApplyingAutomaticSettlements) {
      return;
    }
    this.isApplyingAutomaticSettlements = true;
    try {
    const today = new Date().toISOString().slice(0, 10);
    const dueRevenues = [...this.revenueSchedules.values()].filter(
      (entry) =>
        entry.tenantId === tenantId &&
        entry.status === "aberta" &&
        entry.baixaAutomatica === "sim" &&
        Boolean(entry.bankId) &&
        entry.dataVencimento <= today &&
        !entry.baixaMovementId
    );
    for (const revenue of dueRevenues) {
      this.receiveRevenue({
        version: "v1",
        tenantId,
        bankIdDestino: revenue.bankId as string,
        valor: revenue.valor,
        historico: revenue.descricao,
        dataMovimento: `${revenue.dataVencimento}T12:00:00`,
        revenueId: revenue.id
      });
    }

    const dueExpenses = [...this.expenseSchedules.values()].filter(
      (entry) =>
        entry.tenantId === tenantId &&
        entry.status === "aberta" &&
        entry.baixaAutomatica === "sim" &&
        Boolean(entry.bankId) &&
        entry.dataVencimento <= today &&
        !entry.baixaMovementId
    );
    for (const expense of dueExpenses) {
      this.payExpense({
        version: "v1",
        tenantId,
        bankIdOrigem: expense.bankId as string,
        valor: expense.valor,
        historico: expense.descricao,
        dataMovimento: `${expense.dataVencimento}T12:00:00`,
        beneficiarioNome: expense.beneficiarioNome,
        expenseId: expense.id
      });
    }
    } finally {
      this.isApplyingAutomaticSettlements = false;
    }
  }

  private reopenScheduleFromMovement(original: BankMovement, estornoMovementId: string, now: string): void {
    if (original.sourceType === "revenue_schedule" && original.sourceId) {
      const revenue = this.getRevenueSchedule(original.tenantId, original.sourceId) as RevenueScheduleWithPlan | undefined;
      if (revenue) {
        const reopenedRevenue: RevenueScheduleWithPlan = {
          ...revenue,
          status: "aberta",
          plannedMovementId: undefined,
          baixaMovementId: undefined,
          estornoMovementId,
          settledAt: undefined,
          updatedAt: now
        };
        this.saveRevenueSchedule(reopenedRevenue);
        this.syncRevenuePlannedMovement(reopenedRevenue);
      }
    }

    if (original.sourceType === "expense_schedule" && original.sourceId) {
      const expense = this.getExpenseSchedule(original.tenantId, original.sourceId) as ExpenseScheduleWithPlan | undefined;
      if (expense) {
        const reopenedExpense: ExpenseScheduleWithPlan = {
          ...expense,
          status: "aberta",
          plannedMovementId: undefined,
          baixaMovementId: undefined,
          estornoMovementId,
          settledAt: undefined,
          updatedAt: now
        };
        this.saveExpenseSchedule(reopenedExpense);
        this.syncExpensePlannedMovement(reopenedExpense);
      }
    }

    if (original.sourceType === "cash_entry" && original.sourceId) {
      const cashEntry = this.getCashEntry(original.tenantId, original.sourceId);
      if (cashEntry) {
        this.syncCashEntryPlannedMovement(cashEntry);
      }
    }
  }

  private assertRevenueReferences(tenantId: string, entry: RevenueSchedule): void {
    if (entry.bankId) {
      this.assertBankBelongsToTenant(tenantId, entry.bankId);
    }
    if (entry.clientId) {
      this.assertClientBelongsToTenant(tenantId, entry.clientId);
    }
    if (entry.serviceId) {
      this.assertServiceBelongsToTenant(tenantId, entry.serviceId);
    }
    if (entry.professionalId) {
      this.assertProfessionalBelongsToTenant(tenantId, entry.professionalId);
    }
    if (entry.bookingId && !this.getBooking(tenantId, entry.bookingId)) {
      throw new Error("booking_not_found");
    }
    if (entry.cashEntryId && !this.getCashEntry(tenantId, entry.cashEntryId)) {
      throw new Error("cash_entry_not_found");
    }
  }

  private assertBankMovementReferences(tenantId: string, entry: BankMovement): void {
    if (entry.bankIdOrigem) {
      this.assertBankBelongsToTenant(tenantId, entry.bankIdOrigem);
    }
    if (entry.bankIdDestino) {
      this.assertBankBelongsToTenant(tenantId, entry.bankIdDestino);
    }
    if (
      entry.tipo === "entrada" &&
      !["previsto", "cancelado"].includes(entry.status) &&
      !entry.bankIdDestino
    ) {
      throw new Error("bank_destination_required");
    }
    if (
      entry.tipo === "saida" &&
      !["previsto", "cancelado"].includes(entry.status) &&
      !entry.bankIdOrigem
    ) {
      throw new Error("bank_origin_required");
    }
    if (entry.tipo === "estorno" && !entry.bankIdOrigem && !entry.bankIdDestino) {
      throw new Error("bank_reversal_invalid");
    }
    if (
      entry.tipo === "transferencia" &&
      (!entry.bankIdOrigem || !entry.bankIdDestino || entry.bankIdOrigem === entry.bankIdDestino)
    ) {
      throw new Error("bank_transfer_invalid");
    }
  }

  private expandRevenueScheduleCommand(command: CreateRevenueScheduleCommand): RevenueSchedule[] {
    return buildRevenueOccurrences(command, () => this.nextEntityCode(command.tenantId, "revenue"), command.codigo);
  }

  private expandExpenseScheduleCommand(command: CreateExpenseScheduleCommand): ExpenseSchedule[] {
    return buildExpenseOccurrences(command, () => this.nextEntityCode(command.tenantId, "expense"), command.codigo);
  }

  private toPublicTenantProfile(tenant: Tenant): PublicTenantProfile {
    return {
      slug: tenant.slug,
      nome: tenant.nome,
      timezone: tenant.timezone,
      branding: normalizeTenantBranding(tenant.branding)
    };
  }

  exportSnapshot(): ApiRestStoreSnapshot {
    return {
      tenants: [...this.tenants.values()],
      adminUsers: [...this.adminUsers.values()],
      services: [...this.services.values()],
      banks: [...this.banks.values()],
      bankBalances: [...this.bankBalances.values()],
      cashCloses: [...this.cashCloses.values()],
      cashCloseItems: [...this.cashCloseItems.values()],
      paymentSettings: [...this.paymentSettings.values()],
      paymentIntents: [...this.paymentIntents.values()],
      cashEntries: [...this.cashEntries.values()],
      revenueSchedules: [...this.revenueSchedules.values()],
      expenseSchedules: [...this.expenseSchedules.values()],
      bankMovements: [...this.bankMovements.values()],
      clients: [...this.clients.values()],
      professionals: [...this.professionals.values()],
      availabilityRules: [...this.availabilityRules.values()],
      bookings: [...this.bookings.values()],
      reportDefinitions: [...this.reportDefinitions.values()],
      sessions: [...this.sessions.values()]
    };
  }

  restoreSnapshot(snapshot: ApiRestStoreSnapshot): void {
    this.tenants.clear();
    this.tenantIdsBySlug.clear();
    this.adminUsers.clear();
    this.adminUserIdsByEmail.clear();
    this.services.clear();
    this.banks.clear();
    this.bankBalances.clear();
    this.cashCloses.clear();
    this.cashCloseItems.clear();
    this.paymentSettings.clear();
    this.paymentIntents.clear();
    this.cashEntries.clear();
    this.revenueSchedules.clear();
    this.expenseSchedules.clear();
    this.bankMovements.clear();
    this.clients.clear();
    this.professionals.clear();
    this.availabilityRules.clear();
    this.bookings.clear();
    this.reportDefinitions.clear();
    this.sessions.clear();

    for (const tenant of snapshot.tenants) {
      const hydratedTenant = normalizeTenant(tenant);
      this.tenants.set(hydratedTenant.id, hydratedTenant);
      this.tenantIdsBySlug.set(hydratedTenant.slug, hydratedTenant.id);
    }

    for (const adminUser of snapshot.adminUsers) {
      this.adminUsers.set(adminUser.id, adminUser);
      this.adminUserIdsByEmail.set(adminUser.email, adminUser.id);
    }

    for (const service of snapshot.services) {
      const hydratedService = hydrateService(service, this.nextEntityCode(service.tenantId, "service"));
      this.services.set(hydratedService.id, hydratedService);
    }

    for (const bank of snapshot.banks ?? []) {
      this.banks.set(bank.id, hydrateBank(bank, this.nextEntityCode(bank.tenantId, "bank")));
    }

    for (const balance of snapshot.bankBalances ?? []) {
      this.bankBalances.set(
        balance.id,
        hydrateBankBalance(balance, this.nextEntityCode(balance.tenantId, "bank_balance"))
      );
    }

    for (const cashClose of snapshot.cashCloses ?? []) {
      this.cashCloses.set(
        cashClose.id,
        hydrateCashClose(cashClose, this.nextEntityCode(cashClose.tenantId, "cash_close"))
      );
    }

    for (const cashCloseItem of snapshot.cashCloseItems ?? []) {
      this.cashCloseItems.set(cashCloseItem.id, cashCloseItem);
    }

    for (const paymentSettings of snapshot.paymentSettings ?? []) {
      this.paymentSettings.set(paymentSettings.tenantId, paymentSettings);
    }

    for (const paymentIntent of snapshot.paymentIntents ?? []) {
      this.paymentIntents.set(paymentIntent.id, paymentIntent);
    }

    for (const cashEntry of snapshot.cashEntries ?? []) {
      this.cashEntries.set(cashEntry.id, cashEntry);
    }

    for (const revenue of snapshot.revenueSchedules ?? []) {
      this.revenueSchedules.set(
        revenue.id,
        hydrateRevenueSchedule(revenue, this.nextEntityCode(revenue.tenantId, "revenue"))
      );
    }

    for (const expense of snapshot.expenseSchedules ?? []) {
      this.expenseSchedules.set(
        expense.id,
        hydrateExpenseSchedule(expense, this.nextEntityCode(expense.tenantId, "expense"))
      );
    }

    for (const movement of snapshot.bankMovements ?? []) {
      this.bankMovements.set(
        movement.id,
        hydrateBankMovement(movement, this.nextEntityCode(movement.tenantId, "bank_movement"))
      );
    }

    for (const client of snapshot.clients) {
      const hydratedClient = hydrateClient(client, this.nextEntityCode(client.tenantId, "client"));
      this.clients.set(hydratedClient.id, hydratedClient);
    }

    for (const professional of snapshot.professionals) {
      const hydratedProfessional = hydrateProfessional(
        professional,
        this.nextEntityCode(professional.tenantId, "professional")
      );
      this.professionals.set(hydratedProfessional.id, hydratedProfessional);
    }

    for (const availabilityRule of snapshot.availabilityRules) {
      this.availabilityRules.set(availabilityRule.id, availabilityRule);
    }

    for (const booking of snapshot.bookings) {
      this.bookings.set(booking.id, booking);
    }

    for (const definition of snapshot.reportDefinitions ?? []) {
      this.reportDefinitions.set(definition.id, definition);
    }

    for (const session of snapshot.sessions) {
      this.sessions.set(session.token, session);
    }

    this.ensureFinancialDefaults();
    this.refreshAllBankBalances();
  }
}

function normalizeServicePaymentPolicy(
  policy?: ServicePaymentPolicy,
  exigeSinal = false
): ServicePaymentPolicy {
  if (!policy) {
    return exigeSinal ?
        {
          ...defaultServicePaymentPolicy,
          collectionMode: "deposit"
        }
      : {
          ...defaultServicePaymentPolicy
        };
  }

  return {
    ...defaultServicePaymentPolicy,
    ...policy,
    acceptedMethods: policy.acceptedMethods ?? defaultServicePaymentPolicy.acceptedMethods
  };
}

function hydrateService(service: Service, fallbackCode: string): Service {
  return {
    ...service,
    codigo: normalizeExplicitCode(service.codigo) ?? fallbackCode,
    paymentPolicy: normalizeServicePaymentPolicy(
      service.paymentPolicy,
      service.exigeSinal
    )
  };
}

function hydrateProfessional(professional: Professional, fallbackCode: string): Professional {
  return {
    ...professional,
    codigo: normalizeExplicitCode(professional.codigo) ?? fallbackCode,
    bankId: professional.bankId
  };
}

function hydrateClient(client: Client, fallbackCode: string): Client {
  return {
    ...client,
    codigo: normalizeExplicitCode(client.codigo) ?? fallbackCode
  };
}

function hydrateBank(bank: Bank, fallbackCode: string): Bank {
  return {
    ...bank,
    codigo: normalizeExplicitCode(bank.codigo) ?? fallbackCode,
    ativo: bank.ativo ?? true
  };
}

function hydrateBankBalance(balance: BankBalance, fallbackCode: string): BankBalance {
  return {
    ...balance,
    codigo: normalizeExplicitCode(balance.codigo) ?? fallbackCode
  };
}

function hydrateRevenueSchedule(revenue: RevenueSchedule, fallbackCode: string): RevenueSchedule {
  return {
    ...revenue,
    codigo: normalizeExplicitCode(revenue.codigo) ?? fallbackCode,
    baixaAutomatica: revenue.baixaAutomatica ?? "nao"
  };
}

function hydrateExpenseSchedule(expense: ExpenseSchedule, fallbackCode: string): ExpenseSchedule {
  return {
    ...expense,
    codigo: normalizeExplicitCode(expense.codigo) ?? fallbackCode,
    baixaAutomatica: expense.baixaAutomatica ?? "nao"
  };
}

function hydrateBankMovement(movement: BankMovement, fallbackCode: string): BankMovement {
  return {
    ...movement,
    codigo: normalizeExplicitCode(movement.codigo) ?? fallbackCode,
    status: movement.status ?? resolveMovementStatus(movement.dataMovimento)
  };
}

function hydrateCashClose(cashClose: CashClose, fallbackCode: string): CashClose {
  return {
    ...cashClose,
    codigo: normalizeExplicitCode(cashClose.codigo) ?? fallbackCode
  };
}

function buildRevenueOccurrences(
  command: CreateRevenueScheduleCommand,
  nextCode: () => string,
  explicitCode?: string
): RevenueSchedule[] {
  const now = new Date().toISOString();
  const occurrenceTotal =
    command.tipo === "recorrente" ? command.quantidadeOcorrencias ?? 1 : 1;
  const recurrenceGroupId = occurrenceTotal > 1 ? randomUUID() : undefined;
  return Array.from({ length: occurrenceTotal }, (_, index) => {
    const dueDate = resolveOccurrenceDate(
      command.dataVencimento,
      command.tipo,
      command.recorrencia,
      command.diaSemanaVencimento,
      index
    );
    return {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: index === 0 && explicitCode ? normalizeExplicitCode(explicitCode) ?? nextCode() : nextCode(),
      descricao: command.descricao,
      valor: command.valor,
      dataVencimento: dueDate,
      tipo: command.tipo,
      recorrencia: command.tipo === "recorrente" ? command.recorrencia : undefined,
      quantidadeOcorrencias: command.tipo === "recorrente" ? occurrenceTotal : undefined,
      diaSemanaVencimento: command.tipo === "recorrente" ? command.diaSemanaVencimento : undefined,
      status: "aberta",
      origem: command.bookingId || command.clientId || command.serviceId || command.professionalId ? "booking" : "manual",
      bankId: command.bankId,
      baixaAutomatica: command.baixaAutomatica,
      bookingId: command.bookingId,
      clientId: command.clientId,
      serviceId: command.serviceId,
      professionalId: command.professionalId,
      grupoRecorrenciaId: recurrenceGroupId,
      ocorrenciaIndice: occurrenceTotal > 1 ? index + 1 : undefined,
      ocorrenciaTotal: occurrenceTotal > 1 ? occurrenceTotal : undefined,
      createdAt: now,
      updatedAt: now
    };
  });
}

function buildExpenseOccurrences(
  command: CreateExpenseScheduleCommand,
  nextCode: () => string,
  explicitCode?: string
): ExpenseSchedule[] {
  const now = new Date().toISOString();
  const occurrenceTotal =
    command.tipo === "recorrente" ? command.quantidadeOcorrencias ?? 1 : 1;
  const recurrenceGroupId = occurrenceTotal > 1 ? randomUUID() : undefined;
  return Array.from({ length: occurrenceTotal }, (_, index) => {
    const dueDate = resolveOccurrenceDate(
      command.dataVencimento,
      command.tipo,
      command.recorrencia,
      command.diaSemanaVencimento,
      index
    );
    return {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      codigo: index === 0 && explicitCode ? normalizeExplicitCode(explicitCode) ?? nextCode() : nextCode(),
      descricao: command.descricao,
      valor: command.valor,
      dataVencimento: dueDate,
      tipo: command.tipo,
      recorrencia: command.tipo === "recorrente" ? command.recorrencia : undefined,
      quantidadeOcorrencias: command.tipo === "recorrente" ? occurrenceTotal : undefined,
      diaSemanaVencimento: command.tipo === "recorrente" ? command.diaSemanaVencimento : undefined,
      status: "aberta",
      origem: "manual",
      beneficiarioNome: command.beneficiarioNome,
      bankId: command.bankId,
      baixaAutomatica: command.baixaAutomatica,
      grupoRecorrenciaId: recurrenceGroupId,
      ocorrenciaIndice: occurrenceTotal > 1 ? index + 1 : undefined,
      ocorrenciaTotal: occurrenceTotal > 1 ? occurrenceTotal : undefined,
      createdAt: now,
      updatedAt: now
    };
  });
}

function resolveOccurrenceDate(
  baseDate: string,
  tipo: "unica" | "recorrente",
  recurrence: "semanal" | "mensal" | undefined,
  weekday: number | undefined,
  index: number
): string {
  if (tipo !== "recorrente" || index === 0) {
    return baseDate;
  }

  const date = new Date(`${baseDate}T00:00:00`);
  if (recurrence === "semanal") {
    date.setDate(date.getDate() + index * 7);
    if (weekday !== undefined) {
      while (date.getDay() !== weekday) {
        date.setDate(date.getDate() + 1);
      }
    }
  } else {
    date.setMonth(date.getMonth() + index);
  }
  return date.toISOString().slice(0, 10);
}

function computeCurrentBalance(
  saldoInicial: number,
  movements: readonly BankMovement[],
  bankId: string
): number {
  const delta = movements.reduce((total, movement) => {
    if (movement.status !== "lancado") {
      return total;
    }
    if ((movement.tipo === "entrada" || movement.tipo === "ajuste") && movement.bankIdDestino === bankId) {
      return total + movement.valor;
    }
    if ((movement.tipo === "saida" || movement.tipo === "taxa" || movement.tipo === "estorno") && movement.bankIdOrigem === bankId) {
      return total - movement.valor;
    }
    if (movement.tipo === "transferencia") {
      if (movement.bankIdOrigem === bankId) {
        return total - movement.valor;
      }
      if (movement.bankIdDestino === bankId) {
        return total + movement.valor;
      }
    }
    return total;
  }, 0);
  return roundMoney(saldoInicial + delta);
}

function createDefaultTenantBranding(): TenantBranding {
  return {
    tagline: undefined,
    accentColor: undefined
  };
}

function normalizeTenantBranding(branding?: Partial<TenantBranding> | undefined): TenantBranding {
  return {
    tagline: branding?.tagline?.trim() || undefined,
    accentColor: branding?.accentColor?.trim() || undefined
  };
}

function normalizeTenant(tenant: Tenant): Tenant {
  return {
    ...tenant,
    branding: normalizeTenantBranding(tenant.branding)
  };
}

function normalizeExplicitCode(value?: string): string | undefined {
  const normalized = value?.trim().toUpperCase();
  return normalized ? normalized : undefined;
}

function nextSequentialCode(prefix: string, existingCodes: readonly string[]): string {
  const maxNumber = existingCodes.reduce((currentMax, code) => {
    const match = code.match(/(\d+)$/);
    if (!match) {
      return currentMax;
    }
    return Math.max(currentMax, Number(match[1]));
  }, 0);

  return `${prefix}-${String(maxNumber + 1).padStart(4, "0")}`;
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function resolveMovementStatus(dataMovimento: string): BankMovementStatus {
  return new Date(dataMovimento) > new Date() ? "previsto" : "lancado";
}

function resolveManualMovementSourceType(tipo: BankMovementType): BankMovementSourceType {
  if (tipo === "entrada") {
    return "manual_receipt";
  }
  if (tipo === "saida") {
    return "manual_payment";
  }
  if (tipo === "transferencia") {
    return "transfer";
  }
  if (tipo === "taxa") {
    return "fee";
  }
  return "manual_adjustment";
}

function buildMovementReferenceDate(dateValue: string): string {
  return dateValue.length > 10 ? dateValue : `${dateValue}T12:00:00`;
}

function resolveBusinessDate(dateValue: string, timeZone: string): string {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return dateValue.slice(0, 10);
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function buildCashCloseSelectionKey(sourceType: CashCloseSelectionItem["sourceType"], sourceId: string): string {
  return `${sourceType}:${sourceId}`;
}

function resolveBankAccountLabel(bank: Bank | undefined): string | undefined {
  if (!bank) {
    return undefined;
  }

  return `${bank.codigo} | ${bank.nomeBanco} ${bank.agencia}/${bank.conta}`;
}

function isEligibleCashCloseSettledMovement(
  movement: BankMovement,
  bankId: string,
  dateFrom: string,
  dateTo: string,
  timeZone: string
): boolean {
  if (movement.status !== "lancado") {
    return false;
  }
  if (Boolean(movement.reversedMovementId)) {
    return false;
  }

  const businessDate = resolveBusinessDate(movement.dataMovimento, timeZone);
  if (businessDate < dateFrom || businessDate > dateTo) {
    return false;
  }

  return movement.bankIdDestino === bankId || movement.bankIdOrigem === bankId;
}

function isEligibleCashClosePendingMovement(
  movement: BankMovement,
  bankId: string,
  dateFrom: string,
  dateTo: string,
  timeZone: string
): boolean {
  if (movement.status !== "previsto") {
    return false;
  }
  const businessDate = resolveBusinessDate(movement.dataMovimento, timeZone);
  if (businessDate < dateFrom || businessDate > dateTo) {
    return false;
  }
  if (!movement.bankIdDestino && !movement.bankIdOrigem) {
    return true;
  }
  return movement.bankIdDestino === bankId || movement.bankIdOrigem === bankId;
}

function isDateTimeInPast(value: string): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("booking_time_invalid");
  }

  return date.getTime() < Date.now();
}

function parseTimeWindow(startAt: string, endAt: string): TimeWindow {
  const startParts = readLocalDateTimeParts(startAt);
  const endParts = readLocalDateTimeParts(endAt);

  if (startParts.date !== endParts.date) {
    throw new Error("booking_time_invalid");
  }

  return {
    date: startParts.date,
    startMinutes: toMinutes(startParts.time),
    endMinutes: toMinutes(endParts.time)
  };
}

function readLocalDateTimeParts(value: string): { date: string; time: string } {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) {
    throw new Error("booking_time_invalid");
  }

  return {
    date: match[1],
    time: match[2]
  };
}

function weekdayFromDate(date: string): number {
  const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("booking_time_invalid");
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);

  return new Date(Date.UTC(year, month, day)).getUTCDay();
}

function toMinutes(time: string): number {
  const match = time.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    throw new Error("availability_rule_invalid");
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function fromMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function intervalsOverlap(
  leftStart: number,
  leftEnd: number,
  rightStart: number,
  rightEnd: number
): boolean {
  return leftStart < rightEnd && rightStart < leftEnd;
}

function blocksAvailability(status: Booking["status"]): boolean {
  return status !== "cancelado" && status !== "reagendado" && status !== "faltou";
}
