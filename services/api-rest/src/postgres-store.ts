import { Pool } from "pg";

import type {
  AvailabilityRuleInput,
  ClientContactInput,
  ConfigureTenantSlugCommand,
  CreateBookingCommand,
  TenantPaymentSettings,
  CreateProfessionalCommand,
  CreateServiceCommand,
  CreateTenantCommand,
  PublicCreateBookingInput
} from "@agendaai/contracts";

import {
  ApiRestStore,
  type AdminSessionRecord,
  type ApiRestStorePort,
  type ApiRestStoreSnapshot,
  type BookingPatchInput,
  type ClientPatchInput,
  type PaymentIntentPatchInput,
  type ProfessionalPatchInput,
  type PublicAvailabilitySlot,
  type PublicBookingResult,
  type PublicCatalogSnapshot,
  type PublicTenantProfile,
  type ServicePatchInput,
  type TenantOnboardingResult
} from "./store";

interface PostgresSnapshotRow {
  payload: ApiRestStoreSnapshot;
}

interface PostgresApiRestStoreOptions {
  readonly connectionString: string;
}

const SNAPSHOT_KEY = "agendaai-primary";

export class PostgresApiRestStore implements ApiRestStorePort {
  private readonly store: ApiRestStore;
  private readonly pool: Pool;
  private readonly readyPromise: Promise<void>;
  private persistQueue = Promise.resolve();

  constructor(options: PostgresApiRestStoreOptions) {
    this.store = new ApiRestStore();
    this.pool = new Pool({
      connectionString: options.connectionString,
      max: 3
    });
    this.readyPromise = this.loadSnapshot();
  }

  async reset(): Promise<void> {
    await this.ensureReady();
    this.store.restoreSnapshot(emptySnapshot());
    await this.persistSnapshot();
  }

  async createTenant(command: CreateTenantCommand): Promise<TenantOnboardingResult> {
    await this.ensureReady();
    const result = this.store.createTenant(command);
    await this.persistSnapshot();
    return result;
  }

  async login(email: string, password: string): Promise<AdminSessionRecord | undefined> {
    await this.ensureReady();
    const session = this.store.login(email, password);
    await this.persistSnapshot();
    return session;
  }

  async getSession(token: string): Promise<AdminSessionRecord | undefined> {
    await this.ensureReady();
    return this.store.getSession(token);
  }

  async getTenantById(tenantId: string) {
    await this.ensureReady();
    return this.store.getTenantById(tenantId);
  }

  async getTenantBySlug(slug: string) {
    await this.ensureReady();
    return this.store.getTenantBySlug(slug);
  }

  async getPublicTenantProfile(slug: string): Promise<PublicTenantProfile | undefined> {
    await this.ensureReady();
    return this.store.getPublicTenantProfile(slug);
  }

  async getPublicCatalog(slug: string): Promise<PublicCatalogSnapshot | undefined> {
    await this.ensureReady();
    return this.store.getPublicCatalog(slug);
  }

  async updateTenantSlug(command: ConfigureTenantSlugCommand) {
    await this.ensureReady();
    const tenant = this.store.updateTenantSlug(command);
    await this.persistSnapshot();
    return tenant;
  }

  async listServices(tenantId: string) {
    await this.ensureReady();
    return this.store.listServices(tenantId);
  }

  async getService(tenantId: string, serviceId: string) {
    await this.ensureReady();
    return this.store.getService(tenantId, serviceId);
  }

  async createService(command: CreateServiceCommand) {
    await this.ensureReady();
    const service = this.store.createService(command);
    await this.persistSnapshot();
    return service;
  }

  async updateService(tenantId: string, serviceId: string, patch: ServicePatchInput) {
    await this.ensureReady();
    const service = this.store.updateService(tenantId, serviceId, patch);
    await this.persistSnapshot();
    return service;
  }

  async deleteService(tenantId: string, serviceId: string) {
    await this.ensureReady();
    const deleted = this.store.deleteService(tenantId, serviceId);
    await this.persistSnapshot();
    return deleted;
  }

  async getPaymentSettings(tenantId: string) {
    await this.ensureReady();
    return this.store.getPaymentSettings(tenantId);
  }

  async upsertPaymentSettings(command: TenantPaymentSettings) {
    await this.ensureReady();
    const settings = this.store.upsertPaymentSettings(command);
    await this.persistSnapshot();
    return settings;
  }

  async recordPaymentIntent(intent: import("@agendaai/contracts").PaymentIntent) {
    await this.ensureReady();
    const paymentIntent = this.store.recordPaymentIntent(intent);
    await this.persistSnapshot();
    return paymentIntent;
  }

  async getPaymentIntent(tenantId: string, paymentIntentId: string) {
    await this.ensureReady();
    return this.store.getPaymentIntent(tenantId, paymentIntentId);
  }

  async getPaymentIntentByExternalReference(tenantId: string, externalReference: string) {
    await this.ensureReady();
    return this.store.getPaymentIntentByExternalReference(tenantId, externalReference);
  }

  async updatePaymentIntent(
    tenantId: string,
    paymentIntentId: string,
    patch: PaymentIntentPatchInput
  ) {
    await this.ensureReady();
    const paymentIntent = this.store.updatePaymentIntent(tenantId, paymentIntentId, patch);
    await this.persistSnapshot();
    return paymentIntent;
  }

  async listClients(tenantId: string) {
    await this.ensureReady();
    return this.store.listClients(tenantId);
  }

  async getClient(tenantId: string, clientId: string) {
    await this.ensureReady();
    return this.store.getClient(tenantId, clientId);
  }

  async createClient(tenantId: string, input: ClientContactInput) {
    await this.ensureReady();
    const client = this.store.createClient(tenantId, input);
    await this.persistSnapshot();
    return client;
  }

  async updateClient(tenantId: string, clientId: string, patch: ClientPatchInput) {
    await this.ensureReady();
    const client = this.store.updateClient(tenantId, clientId, patch);
    await this.persistSnapshot();
    return client;
  }

  async deleteClient(tenantId: string, clientId: string) {
    await this.ensureReady();
    const deleted = this.store.deleteClient(tenantId, clientId);
    await this.persistSnapshot();
    return deleted;
  }

  async listProfessionals(tenantId: string) {
    await this.ensureReady();
    return this.store.listProfessionals(tenantId);
  }

  async listProfessionalsForService(tenantId: string, serviceId?: string) {
    await this.ensureReady();
    return this.store.listProfessionalsForService(tenantId, serviceId);
  }

  async getProfessional(tenantId: string, professionalId: string) {
    await this.ensureReady();
    return this.store.getProfessional(tenantId, professionalId);
  }

  async createProfessional(command: CreateProfessionalCommand) {
    await this.ensureReady();
    const professional = this.store.createProfessional(command);
    await this.persistSnapshot();
    return professional;
  }

  async updateProfessional(
    tenantId: string,
    professionalId: string,
    patch: ProfessionalPatchInput
  ) {
    await this.ensureReady();
    const professional = this.store.updateProfessional(tenantId, professionalId, patch);
    await this.persistSnapshot();
    return professional;
  }

  async deleteProfessional(tenantId: string, professionalId: string) {
    await this.ensureReady();
    const deleted = this.store.deleteProfessional(tenantId, professionalId);
    await this.persistSnapshot();
    return deleted;
  }

  async replaceAvailabilityRules(
    tenantId: string,
    professionalId: string,
    rules: AvailabilityRuleInput[]
  ) {
    await this.ensureReady();
    const items = this.store.replaceAvailabilityRules(tenantId, professionalId, rules);
    await this.persistSnapshot();
    return items;
  }

  async listAvailabilityRules(tenantId: string, professionalId: string) {
    await this.ensureReady();
    return this.store.listAvailabilityRules(tenantId, professionalId);
  }

  async listAvailableSlots(
    tenantId: string,
    serviceId: string,
    professionalId: string,
    date: string,
    bookingToIgnoreId?: string
  ): Promise<PublicAvailabilitySlot[]> {
    await this.ensureReady();
    return this.store.listAvailableSlots(tenantId, serviceId, professionalId, date, bookingToIgnoreId);
  }

  async listBookings(tenantId: string) {
    await this.ensureReady();
    return this.store.listBookings(tenantId);
  }

  async getBooking(tenantId: string, bookingId: string) {
    await this.ensureReady();
    return this.store.getBooking(tenantId, bookingId);
  }

  async createBooking(command: CreateBookingCommand) {
    await this.ensureReady();
    const booking = this.store.createBooking(command);
    await this.persistSnapshot();
    return booking;
  }

  async updateBooking(tenantId: string, bookingId: string, patch: BookingPatchInput) {
    await this.ensureReady();
    const booking = this.store.updateBooking(tenantId, bookingId, patch);
    await this.persistSnapshot();
    return booking;
  }

  async deleteBooking(tenantId: string, bookingId: string) {
    await this.ensureReady();
    const deleted = this.store.deleteBooking(tenantId, bookingId);
    await this.persistSnapshot();
    return deleted;
  }

  async createPublicBooking(input: PublicCreateBookingInput): Promise<PublicBookingResult> {
    await this.ensureReady();
    const result = this.store.createPublicBooking(input);
    await this.persistSnapshot();
    return result;
  }

  async createPublicPaymentBooking(input: PublicCreateBookingInput): Promise<PublicBookingResult> {
    await this.ensureReady();
    const result = this.store.createPublicPaymentBooking(input);
    await this.persistSnapshot();
    return result;
  }

  private async ensureReady(): Promise<void> {
    await this.readyPromise;
  }

  private async loadSnapshot(): Promise<void> {
    await this.pool.query(`
      create table if not exists agendaai_runtime_snapshots (
        store_key text primary key,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);

    const result = await this.pool.query<PostgresSnapshotRow>(
      "select payload from agendaai_runtime_snapshots where store_key = $1",
      [SNAPSHOT_KEY]
    );

    const snapshot = result.rows[0]?.payload;
    if (snapshot) {
      this.store.restoreSnapshot(snapshot);
    }
  }

  private async persistSnapshot(): Promise<void> {
    const snapshot = this.store.exportSnapshot();
    this.persistQueue = this.persistQueue.then(async () => {
      await this.pool.query(
        `
          insert into agendaai_runtime_snapshots (store_key, payload, updated_at)
          values ($1, $2::jsonb, now())
          on conflict (store_key)
          do update set payload = excluded.payload, updated_at = excluded.updated_at
        `,
        [SNAPSHOT_KEY, JSON.stringify(snapshot)]
      );
    });

    await this.persistQueue;
  }
}

export function createConfiguredStore(): ApiRestStorePort {
  const connectionString = process.env.DATABASE_URL;
  return connectionString ? new PostgresApiRestStore({ connectionString }) : new ApiRestStore();
}

function emptySnapshot(): ApiRestStoreSnapshot {
  return {
    tenants: [],
    adminUsers: [],
    services: [],
    paymentSettings: [],
    paymentIntents: [],
    clients: [],
    professionals: [],
    availabilityRules: [],
    bookings: [],
    sessions: []
  };
}
