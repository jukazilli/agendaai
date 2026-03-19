import { randomUUID } from "node:crypto";

import { defaultServicePaymentPolicy } from "@agendaai/contracts";
import type {
  AdminSessionClaimsContract,
  AdminUser,
  AvailabilityRule,
  AvailabilityRuleInput,
  Booking,
  CashEntry,
  CashEntryKind,
  Client,
  ClientContactInput,
  ConfigureTenantBrandingCommand,
  ConfigureTenantSlugCommand,
  CreateBookingCommand,
  PublicCreateBookingInput,
  CreateProfessionalCommand,
  PaymentIntent,
  ServicePaymentPolicy,
  TenantPaymentSettings,
  CreateServiceCommand,
  CreateTenantCommand,
  Professional,
  Service,
  Tenant,
  TenantBranding
} from "@agendaai/contracts";

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
  nome?: string;
  duracaoMin?: number;
  precoBase?: number;
  exigeSinal?: boolean;
  paymentPolicy?: ServicePaymentPolicy;
  status?: string;
}

export interface ClientPatchInput {
  nome?: string;
  telefone?: string;
  email?: string;
  origem?: string;
}

export interface ProfessionalPatchInput {
  nome?: string;
  status?: string;
  especialidades?: string[];
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
  readonly paymentSettings?: TenantPaymentSettings[];
  readonly paymentIntents?: PaymentIntent[];
  readonly cashEntries?: CashEntry[];
  readonly clients: Client[];
  readonly professionals: Professional[];
  readonly availabilityRules: AvailabilityRule[];
  readonly bookings: Booking[];
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
}

export class ApiRestStore implements ApiRestStorePort {
  private readonly tenants = new Map<string, Tenant>();
  private readonly tenantIdsBySlug = new Map<string, string>();
  private readonly adminUsers = new Map<string, StoredAdminUser>();
  private readonly adminUserIdsByEmail = new Map<string, string>();
  private readonly services = new Map<string, Service>();
  private readonly paymentSettings = new Map<string, TenantPaymentSettings>();
  private readonly paymentIntents = new Map<string, PaymentIntent>();
  private readonly cashEntries = new Map<string, CashEntry>();
  private readonly clients = new Map<string, Client>();
  private readonly professionals = new Map<string, Professional>();
  private readonly availabilityRules = new Map<string, AvailabilityRule>();
  private readonly bookings = new Map<string, Booking>();
  private readonly sessions = new Map<string, AdminSessionRecord>();

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

    const professional: Professional = {
      version: "v1",
      id: randomUUID(),
      tenantId: command.tenantId,
      nome: command.nome,
      status: "active",
      especialidades: [...command.especialidades]
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

    const nextProfessional: Professional = {
      ...professional,
      ...patch,
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
    bookingToIgnoreId?: string
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
        const candidate: PublicAvailabilitySlot = {
          date,
          startTime: fromMinutes(cursor),
          endTime: fromMinutes(cursor + service.duracaoMin),
          startAt: `${date}T${fromMinutes(cursor)}:00`,
          endAt: `${date}T${fromMinutes(cursor + service.duracaoMin)}:00`
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
    this.assertWindowAvailable(
      command.tenantId,
      command.serviceId,
      command.professionalId,
      command.startAt,
      command.endAt
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
    this.assertWindowAvailable(
      tenantId,
      nextBooking.serviceId,
      nextBooking.professionalId,
      nextBooking.startAt,
      nextBooking.endAt,
      booking.id
    );

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

  private assertWindowAvailable(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    startAt: string,
    endAt: string,
    bookingToIgnoreId?: string
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
      bookingToIgnoreId
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
      paymentSettings: [...this.paymentSettings.values()],
      paymentIntents: [...this.paymentIntents.values()],
      cashEntries: [...this.cashEntries.values()],
      clients: [...this.clients.values()],
      professionals: [...this.professionals.values()],
      availabilityRules: [...this.availabilityRules.values()],
      bookings: [...this.bookings.values()],
      sessions: [...this.sessions.values()]
    };
  }

  restoreSnapshot(snapshot: ApiRestStoreSnapshot): void {
    this.tenants.clear();
    this.tenantIdsBySlug.clear();
    this.adminUsers.clear();
    this.adminUserIdsByEmail.clear();
    this.services.clear();
    this.paymentSettings.clear();
    this.paymentIntents.clear();
    this.cashEntries.clear();
    this.clients.clear();
    this.professionals.clear();
    this.availabilityRules.clear();
    this.bookings.clear();
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
      this.services.set(service.id, hydrateService(service));
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

    for (const client of snapshot.clients) {
      this.clients.set(client.id, client);
    }

    for (const professional of snapshot.professionals) {
      this.professionals.set(professional.id, professional);
    }

    for (const availabilityRule of snapshot.availabilityRules) {
      this.availabilityRules.set(availabilityRule.id, availabilityRule);
    }

    for (const booking of snapshot.bookings) {
      this.bookings.set(booking.id, booking);
    }

    for (const session of snapshot.sessions) {
      this.sessions.set(session.token, session);
    }
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

function hydrateService(service: Service): Service {
  return {
    ...service,
    paymentPolicy: normalizeServicePaymentPolicy(
      service.paymentPolicy,
      service.exigeSinal
    )
  };
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
