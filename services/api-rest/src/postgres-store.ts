import { Pool, type PoolClient } from "pg";

import type {
  AvailabilityRuleInput,
  CreateBankBalanceCommand,
  CreateBankCommand,
  CreateBankPaymentCommand,
  CreateBankReceiptCommand,
  CreateBankTransferCommand,
  ClientContactInput,
  ConfigureTenantBrandingCommand,
  ConfigureTenantSlugCommand,
  CreateBookingCommand,
  CreateExpenseScheduleCommand,
  ReportDefinition,
  TenantPaymentSettings,
  CreateProfessionalCommand,
  CreateRevenueScheduleCommand,
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
  type BankBalancePatchInput,
  type BankPatchInput,
  type ClientPatchInput,
  type ExpensePatchInput,
  type PaymentIntentPatchInput,
  type ProfessionalPatchInput,
  type PublicAvailabilitySlot,
  type PublicBookingResult,
  type PublicCatalogSnapshot,
  type PublicTenantProfile,
  type RevenuePatchInput,
  type ServicePatchInput,
  type TenantOnboardingResult
} from "./store";

interface PostgresSnapshotRow {
  payload: ApiRestStoreSnapshot;
}

interface PostgresReportDefinitionRow {
  definition: ReportDefinition;
}

interface PostgresBankRow {
  bank: import("@agendaai/contracts").Bank;
}

interface PostgresBankBalanceRow {
  balance: import("@agendaai/contracts").BankBalance;
}

interface PostgresRevenueRow {
  revenue: import("@agendaai/contracts").RevenueSchedule;
}

interface PostgresExpenseRow {
  expense: import("@agendaai/contracts").ExpenseSchedule;
}

interface PostgresBankMovementRow {
  movement: import("@agendaai/contracts").BankMovement;
}

interface PostgresApiRestStoreOptions {
  readonly connectionString: string;
}

type PostgresQueryable = Pool | PoolClient;

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

  async close(): Promise<void> {
    await this.ensureReady().catch(() => undefined);
    await this.pool.end();
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

  async updateTenantBranding(command: ConfigureTenantBrandingCommand) {
    await this.ensureReady();
    const tenant = this.store.updateTenantBranding(command);
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

  async listBanks(tenantId: string) {
    await this.ensureReady();
    return this.store.listBanks(tenantId);
  }

  async getBank(tenantId: string, bankId: string) {
    await this.ensureReady();
    return this.store.getBank(tenantId, bankId);
  }

  async createBank(command: CreateBankCommand) {
    await this.ensureReady();
    const bank = this.store.createBank(command);
    await this.persistSnapshot();
    return bank;
  }

  async updateBank(tenantId: string, bankId: string, patch: BankPatchInput) {
    await this.ensureReady();
    const bank = this.store.updateBank(tenantId, bankId, patch);
    await this.persistSnapshot();
    return bank;
  }

  async listBankBalances(tenantId: string) {
    await this.ensureReady();
    return this.store.listBankBalances(tenantId);
  }

  async getBankBalance(tenantId: string, balanceId: string) {
    await this.ensureReady();
    return this.store.getBankBalance(tenantId, balanceId);
  }

  async getBankBalanceByBankId(tenantId: string, bankId: string) {
    await this.ensureReady();
    return this.store.getBankBalanceByBankId(tenantId, bankId);
  }

  async createBankBalance(command: CreateBankBalanceCommand) {
    await this.ensureReady();
    const balance = this.store.createBankBalance(command);
    await this.persistSnapshot();
    return balance;
  }

  async updateBankBalance(tenantId: string, balanceId: string, patch: BankBalancePatchInput) {
    await this.ensureReady();
    const balance = this.store.updateBankBalance(tenantId, balanceId, patch);
    await this.persistSnapshot();
    return balance;
  }

  async listRevenueSchedules(tenantId: string) {
    await this.ensureReady();
    return this.store.listRevenueSchedules(tenantId);
  }

  async getRevenueSchedule(tenantId: string, revenueId: string) {
    await this.ensureReady();
    return this.store.getRevenueSchedule(tenantId, revenueId);
  }

  async saveRevenueSchedule(entry: import("@agendaai/contracts").RevenueSchedule) {
    await this.ensureReady();
    const revenue = this.store.saveRevenueSchedule(entry);
    await this.persistSnapshot();
    return revenue;
  }

  async createRevenueSchedule(command: CreateRevenueScheduleCommand) {
    await this.ensureReady();
    const items = this.store.createRevenueSchedule(command);
    await this.persistSnapshot();
    return items;
  }

  async updateRevenueSchedule(tenantId: string, revenueId: string, patch: RevenuePatchInput) {
    await this.ensureReady();
    const revenue = this.store.updateRevenueSchedule(tenantId, revenueId, patch);
    await this.persistSnapshot();
    return revenue;
  }

  async listExpenseSchedules(tenantId: string) {
    await this.ensureReady();
    return this.store.listExpenseSchedules(tenantId);
  }

  async getExpenseSchedule(tenantId: string, expenseId: string) {
    await this.ensureReady();
    return this.store.getExpenseSchedule(tenantId, expenseId);
  }

  async saveExpenseSchedule(entry: import("@agendaai/contracts").ExpenseSchedule) {
    await this.ensureReady();
    const expense = this.store.saveExpenseSchedule(entry);
    await this.persistSnapshot();
    return expense;
  }

  async createExpenseSchedule(command: CreateExpenseScheduleCommand) {
    await this.ensureReady();
    const items = this.store.createExpenseSchedule(command);
    await this.persistSnapshot();
    return items;
  }

  async updateExpenseSchedule(tenantId: string, expenseId: string, patch: ExpensePatchInput) {
    await this.ensureReady();
    const expense = this.store.updateExpenseSchedule(tenantId, expenseId, patch);
    await this.persistSnapshot();
    return expense;
  }

  async listBankMovements(tenantId: string) {
    await this.ensureReady();
    return this.store.listBankMovements(tenantId);
  }

  async getBankMovement(tenantId: string, movementId: string) {
    await this.ensureReady();
    return this.store.getBankMovement(tenantId, movementId);
  }

  async saveBankMovement(entry: import("@agendaai/contracts").BankMovement) {
    await this.ensureReady();
    const movement = this.store.saveBankMovement(entry);
    await this.persistSnapshot();
    return movement;
  }

  async receiveRevenue(command: CreateBankReceiptCommand) {
    await this.ensureReady();
    const movement = this.store.receiveRevenue(command);
    await this.persistSnapshot();
    return movement;
  }

  async payExpense(command: CreateBankPaymentCommand) {
    await this.ensureReady();
    const movement = this.store.payExpense(command);
    await this.persistSnapshot();
    return movement;
  }

  async transferBetweenBanks(command: CreateBankTransferCommand) {
    await this.ensureReady();
    const movement = this.store.transferBetweenBanks(command);
    await this.persistSnapshot();
    return movement;
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

  async listPaymentIntents(tenantId: string) {
    await this.ensureReady();
    return this.store.listPaymentIntents(tenantId);
  }

  async listCashEntries(tenantId: string) {
    await this.ensureReady();
    return this.store.listCashEntries(tenantId);
  }

  async getCashEntry(tenantId: string, cashEntryId: string) {
    await this.ensureReady();
    return this.store.getCashEntry(tenantId, cashEntryId);
  }

  async getCashEntryByBookingAndKind(
    tenantId: string,
    bookingId: string,
    kind: import("@agendaai/contracts").CashEntryKind
  ) {
    await this.ensureReady();
    return this.store.getCashEntryByBookingAndKind(tenantId, bookingId, kind);
  }

  async saveCashEntry(entry: import("@agendaai/contracts").CashEntry) {
    await this.ensureReady();
    const cashEntry = this.store.saveCashEntry(entry);
    await this.persistSnapshot();
    return cashEntry;
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

  async listReportDefinitions(tenantId: string) {
    await this.ensureReady();
    return this.store.listReportDefinitions(tenantId);
  }

  async getReportDefinition(tenantId: string, reportDefinitionId: string) {
    await this.ensureReady();
    return this.store.getReportDefinition(tenantId, reportDefinitionId);
  }

  async saveReportDefinition(definition: ReportDefinition) {
    await this.ensureReady();
    const saved = this.store.saveReportDefinition(definition);
    await this.persistSnapshot();
    return saved;
  }

  async deleteReportDefinition(tenantId: string, reportDefinitionId: string) {
    await this.ensureReady();
    const deleted = this.store.deleteReportDefinition(tenantId, reportDefinitionId);
    await this.persistSnapshot();
    return deleted;
  }

  private async ensureReady(): Promise<void> {
    await this.readyPromise;
  }

  private async loadSnapshot(): Promise<void> {
    await this.ensureSchema();

    const result = await this.pool.query<PostgresSnapshotRow>(
      "select payload from agendaai_runtime_snapshots where store_key = $1",
      [SNAPSHOT_KEY]
    );

    const [reportDefinitions, banks, balances, revenues, expenses, movements] = await Promise.all([
      this.loadPersistedReportDefinitions(),
      this.loadPersistedBanks(),
      this.loadPersistedBankBalances(),
      this.loadPersistedRevenueSchedules(),
      this.loadPersistedExpenseSchedules(),
      this.loadPersistedBankMovements()
    ]);
    const mergedSnapshot = mergeSnapshotWithPersistedData(
      result.rows[0]?.payload,
      reportDefinitions,
      banks,
      balances,
      revenues,
      expenses,
      movements
    );

    this.store.restoreSnapshot(mergedSnapshot);
  }

  private async ensureSchema(queryable: PostgresQueryable = this.pool): Promise<void> {
    await queryable.query(`
      create table if not exists agendaai_runtime_snapshots (
        store_key text primary key,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists report_definitions (
        id text primary key,
        tenant_id text not null,
        definition jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists finance_banks (
        id text primary key,
        tenant_id text not null,
        bank jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists finance_bank_balances (
        id text primary key,
        tenant_id text not null,
        balance jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists finance_revenue_schedules (
        id text primary key,
        tenant_id text not null,
        revenue jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists finance_expense_schedules (
        id text primary key,
        tenant_id text not null,
        expense jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create table if not exists finance_bank_movements (
        id text primary key,
        tenant_id text not null,
        movement jsonb not null,
        updated_at timestamptz not null default now()
      )
    `);
    await queryable.query(`
      create index if not exists report_definitions_tenant_idx
        on report_definitions (tenant_id)
    `);
    await queryable.query(`
      create index if not exists finance_banks_tenant_idx
        on finance_banks (tenant_id)
    `);
    await queryable.query(`
      create index if not exists finance_bank_balances_tenant_idx
        on finance_bank_balances (tenant_id)
    `);
    await queryable.query(`
      create index if not exists finance_revenue_schedules_tenant_idx
        on finance_revenue_schedules (tenant_id)
    `);
    await queryable.query(`
      create index if not exists finance_expense_schedules_tenant_idx
        on finance_expense_schedules (tenant_id)
    `);
    await queryable.query(`
      create index if not exists finance_bank_movements_tenant_idx
        on finance_bank_movements (tenant_id)
    `);
  }

  private async loadPersistedReportDefinitions(
    queryable: PostgresQueryable = this.pool
  ): Promise<ReportDefinition[]> {
    const result = await queryable.query<PostgresReportDefinitionRow>(
      "select definition from report_definitions order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.definition);
  }

  private async loadPersistedBanks(queryable: PostgresQueryable = this.pool) {
    const result = await queryable.query<PostgresBankRow>(
      "select bank from finance_banks order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.bank);
  }

  private async loadPersistedBankBalances(queryable: PostgresQueryable = this.pool) {
    const result = await queryable.query<PostgresBankBalanceRow>(
      "select balance from finance_bank_balances order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.balance);
  }

  private async loadPersistedRevenueSchedules(queryable: PostgresQueryable = this.pool) {
    const result = await queryable.query<PostgresRevenueRow>(
      "select revenue from finance_revenue_schedules order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.revenue);
  }

  private async loadPersistedExpenseSchedules(queryable: PostgresQueryable = this.pool) {
    const result = await queryable.query<PostgresExpenseRow>(
      "select expense from finance_expense_schedules order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.expense);
  }

  private async loadPersistedBankMovements(queryable: PostgresQueryable = this.pool) {
    const result = await queryable.query<PostgresBankMovementRow>(
      "select movement from finance_bank_movements order by updated_at asc, id asc"
    );
    return result.rows.map((row) => row.movement);
  }

  private async persistSnapshot(): Promise<void> {
    const snapshot = this.store.exportSnapshot();
    const nextPersist = this.persistQueue.catch(() => undefined).then(async () => {
      const client = await this.pool.connect();
      try {
        await client.query("begin");
        await this.ensureSchema(client);

        const definitions = snapshot.reportDefinitions ?? [];
        const banks = snapshot.banks ?? [];
        const balances = snapshot.bankBalances ?? [];
        const revenues = snapshot.revenueSchedules ?? [];
        const expenses = snapshot.expenseSchedules ?? [];
        const movements = snapshot.bankMovements ?? [];
        for (const definition of definitions) {
          await client.query(
            `
              insert into report_definitions (id, tenant_id, definition, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    definition = excluded.definition,
                    updated_at = excluded.updated_at
            `,
            [definition.id, definition.tenantId, JSON.stringify(definition)]
          );
        }
        for (const bank of banks) {
          await client.query(
            `
              insert into finance_banks (id, tenant_id, bank, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    bank = excluded.bank,
                    updated_at = excluded.updated_at
            `,
            [bank.id, bank.tenantId, JSON.stringify(bank)]
          );
        }
        for (const balance of balances) {
          await client.query(
            `
              insert into finance_bank_balances (id, tenant_id, balance, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    balance = excluded.balance,
                    updated_at = excluded.updated_at
            `,
            [balance.id, balance.tenantId, JSON.stringify(balance)]
          );
        }
        for (const revenue of revenues) {
          await client.query(
            `
              insert into finance_revenue_schedules (id, tenant_id, revenue, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    revenue = excluded.revenue,
                    updated_at = excluded.updated_at
            `,
            [revenue.id, revenue.tenantId, JSON.stringify(revenue)]
          );
        }
        for (const expense of expenses) {
          await client.query(
            `
              insert into finance_expense_schedules (id, tenant_id, expense, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    expense = excluded.expense,
                    updated_at = excluded.updated_at
            `,
            [expense.id, expense.tenantId, JSON.stringify(expense)]
          );
        }
        for (const movement of movements) {
          await client.query(
            `
              insert into finance_bank_movements (id, tenant_id, movement, updated_at)
              values ($1, $2, $3::jsonb, now())
              on conflict (id)
              do update
                set tenant_id = excluded.tenant_id,
                    movement = excluded.movement,
                    updated_at = excluded.updated_at
            `,
            [movement.id, movement.tenantId, JSON.stringify(movement)]
          );
        }

        if (definitions.length === 0) {
          await client.query("delete from report_definitions");
        } else {
          await client.query("delete from report_definitions where not (id = any($1::text[]))", [
            definitions.map((definition) => definition.id)
          ]);
        }
        await deleteMissingRows(client, "finance_banks", banks.map((entry) => entry.id));
        await deleteMissingRows(client, "finance_bank_balances", balances.map((entry) => entry.id));
        await deleteMissingRows(client, "finance_revenue_schedules", revenues.map((entry) => entry.id));
        await deleteMissingRows(client, "finance_expense_schedules", expenses.map((entry) => entry.id));
        await deleteMissingRows(client, "finance_bank_movements", movements.map((entry) => entry.id));

        await client.query(
          `
            insert into agendaai_runtime_snapshots (store_key, payload, updated_at)
            values ($1, $2::jsonb, now())
            on conflict (store_key)
            do update set payload = excluded.payload, updated_at = excluded.updated_at
          `,
          [SNAPSHOT_KEY, JSON.stringify(snapshot)]
        );
        await client.query("commit");
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    });

    this.persistQueue = nextPersist;
    await nextPersist;
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
    cashEntries: [],
    clients: [],
    professionals: [],
    availabilityRules: [],
    bookings: [],
    reportDefinitions: [],
    banks: [],
    bankBalances: [],
    revenueSchedules: [],
    expenseSchedules: [],
    bankMovements: [],
    sessions: []
  };
}

function mergeSnapshotWithPersistedData(
  snapshot: ApiRestStoreSnapshot | undefined,
  reportDefinitions: ReportDefinition[],
  banks: import("@agendaai/contracts").Bank[],
  balances: import("@agendaai/contracts").BankBalance[],
  revenues: import("@agendaai/contracts").RevenueSchedule[],
  expenses: import("@agendaai/contracts").ExpenseSchedule[],
  movements: import("@agendaai/contracts").BankMovement[]
): ApiRestStoreSnapshot {
  const baseSnapshot = snapshot
    ? {
        ...snapshot,
        reportDefinitions: [...(snapshot.reportDefinitions ?? [])],
        banks: [...(snapshot.banks ?? [])],
        bankBalances: [...(snapshot.bankBalances ?? [])],
        revenueSchedules: [...(snapshot.revenueSchedules ?? [])],
        expenseSchedules: [...(snapshot.expenseSchedules ?? [])],
        bankMovements: [...(snapshot.bankMovements ?? [])]
      }
    : emptySnapshot();

  return {
    ...baseSnapshot,
    reportDefinitions:
      reportDefinitions.length > 0 ? reportDefinitions : (baseSnapshot.reportDefinitions ?? []),
    banks: banks.length > 0 ? banks : (baseSnapshot.banks ?? []),
    bankBalances: balances.length > 0 ? balances : (baseSnapshot.bankBalances ?? []),
    revenueSchedules: revenues.length > 0 ? revenues : (baseSnapshot.revenueSchedules ?? []),
    expenseSchedules: expenses.length > 0 ? expenses : (baseSnapshot.expenseSchedules ?? []),
    bankMovements: movements.length > 0 ? movements : (baseSnapshot.bankMovements ?? [])
  };
}

async function deleteMissingRows(
  queryable: PostgresQueryable,
  tableName: string,
  ids: readonly string[]
): Promise<void> {
  if (ids.length === 0) {
    await queryable.query(`delete from ${tableName}`);
    return;
  }

  await queryable.query(`delete from ${tableName} where not (id = any($1::text[]))`, [ids]);
}
