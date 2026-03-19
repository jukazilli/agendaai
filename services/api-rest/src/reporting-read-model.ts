import {
  contractVersion,
  type AdminReportsReadModel,
  type Booking,
  type CashEntry,
  type Client,
  type PaymentIntent,
  type Professional,
  type ReportingFilters,
  type ReportingGroupSummary,
  type ReportingMetricSummary,
  type ReportingReturnBucket,
  type Service
} from "@agendaai/contracts";

interface BuildAdminReportsReadModelInput extends ReportingFilters {
  readonly clients: readonly Client[];
  readonly bookings: readonly Booking[];
  readonly services: readonly Service[];
  readonly professionals: readonly Professional[];
  readonly paymentIntents: readonly PaymentIntent[];
  readonly cashEntries: readonly CashEntry[];
}

interface ClientRecurrenceRecord {
  readonly client: Client;
  readonly completedBookings: Booking[];
  readonly recognizedRevenue: number;
  readonly lastCompletedAt?: string;
  readonly daysSinceLastCompleted?: number;
  readonly averageRecurrenceDays: number | null;
}

export function buildAdminReportsReadModel(
  input: BuildAdminReportsReadModelInput
): AdminReportsReadModel {
  const currentBookings = filterBookingsByReportFilters(input.bookings, input, 0);
  const previousBookings =
    input.range === "all" ? [] : filterBookingsByReportFilters(input.bookings, input, 1);

  const current = buildMetricSummary(
    currentBookings,
    input.services,
    input.paymentIntents,
    input.cashEntries
  );
  const previous =
    input.range === "all"
      ? undefined
      : buildMetricSummary(previousBookings, input.services, input.paymentIntents, input.cashEntries);

  const filteredForRecurrence = filterBookingsBySelection(
    input.bookings,
    input.serviceId,
    input.professionalId
  );
  const recurrenceRecords = buildClientRecurrenceRecords(
    input.clients,
    filteredForRecurrence,
    input.services,
    input.cashEntries
  );
  const windowDays = resolveReturnWindowDays(input.returnWindow);
  const inactiveClients = recurrenceRecords
    .filter(
      (entry) =>
        entry.lastCompletedAt !== undefined &&
        (entry.daysSinceLastCompleted ?? 0) > windowDays
    )
    .sort(
      (left, right) =>
        (right.daysSinceLastCompleted ?? 0) - (left.daysSinceLastCompleted ?? 0)
    )
    .slice(0, 8)
    .map((entry) => ({
      clientId: entry.client.id,
      nome: entry.client.nome,
      email: entry.client.email,
      telefone: entry.client.telefone,
      origem: entry.client.origem,
      completedBookings: entry.completedBookings.length,
      recognizedRevenue: entry.recognizedRevenue,
      lastCompletedAt: entry.lastCompletedAt,
      daysSinceLastCompleted: entry.daysSinceLastCompleted,
      averageRecurrenceDays: entry.averageRecurrenceDays
    }));

  const returnBuckets = buildReturnBuckets(recurrenceRecords);
  const recurringClients = recurrenceRecords.filter(
    (entry) => entry.averageRecurrenceDays !== null
  );
  const averageRecurrenceDays =
    recurringClients.length > 0
      ? recurringClients.reduce(
          (total, entry) => total + (entry.averageRecurrenceDays ?? 0),
          0
        ) / recurringClients.length
      : null;

  return {
    version: contractVersion,
    filters: {
      range: input.range,
      serviceId: input.serviceId,
      professionalId: input.professionalId,
      returnWindow: input.returnWindow
    },
    comparisonEnabled: input.range !== "all",
    current,
    previous,
    services: buildGroupedSummaries(
      currentBookings,
      input.services,
      input.paymentIntents,
      input.cashEntries,
      "service"
    ),
    professionals: buildGroupedSummaries(
      currentBookings,
      input.services,
      input.paymentIntents,
      input.cashEntries,
      "professional",
      input.professionals
    ),
    clientRecurrence: {
      window: input.returnWindow,
      returningCount: recurrenceRecords.filter(
        (entry) =>
          entry.lastCompletedAt !== undefined &&
          (entry.daysSinceLastCompleted ?? 0) <= windowDays
      ).length,
      inactiveCount: recurrenceRecords.filter(
        (entry) =>
          entry.lastCompletedAt !== undefined &&
          (entry.daysSinceLastCompleted ?? 0) > windowDays
      ).length,
      neverCompletedCount: recurrenceRecords.filter(
        (entry) => entry.lastCompletedAt === undefined
      ).length,
      clientsWithRecurrence: recurringClients.length,
      averageRecurrenceDays:
        averageRecurrenceDays === null
          ? null
          : Number(averageRecurrenceDays.toFixed(1)),
      returnBuckets,
      inactiveClients
    }
  };
}

function filterBookingsByReportFilters(
  bookings: readonly Booking[],
  filters: Pick<ReportingFilters, "range" | "serviceId" | "professionalId">,
  offsetPeriods: number
): Booking[] {
  return filterBookingsBySelection(
    filterBookingsByRange(bookings, filters.range, offsetPeriods),
    filters.serviceId,
    filters.professionalId
  );
}

function filterBookingsByRange(
  bookings: readonly Booking[],
  range: ReportingFilters["range"],
  offsetPeriods: number
): Booking[] {
  if (range === "all") {
    return [...bookings];
  }

  const days = range === "7d" ? 7 : 30;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1) - days * offsetPeriods);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  return bookings.filter((booking) => {
    const bookingDate = new Date(booking.startAt);
    if (bookingDate < startDate) {
      return false;
    }
    if (offsetPeriods > 0 && bookingDate >= endDate) {
      return false;
    }
    return true;
  });
}

function filterBookingsBySelection(
  bookings: readonly Booking[],
  serviceId?: string,
  professionalId?: string
): Booking[] {
  return bookings.filter((booking) => {
    if (serviceId && booking.serviceId !== serviceId) {
      return false;
    }
    if (professionalId && booking.professionalId !== professionalId) {
      return false;
    }
    return true;
  });
}

function buildMetricSummary(
  bookings: readonly Booking[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportingMetricSummary {
  const completedBookings = bookings.filter((booking) => booking.status === "concluido");
  const recognizedRevenue = completedBookings.reduce((total, booking) => {
    return total + resolveRecognizedRevenueForBooking(booking, services, cashEntries);
  }, 0);
  const approvedOnlineRevenue = completedBookings.reduce((total, booking) => {
    const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
    return total + resolveApprovedOnlineRevenueForBooking(booking, paymentIntent, cashEntries);
  }, 0);

  return {
    bookingsCount: bookings.length,
    completedCount: completedBookings.length,
    cancelledCount: bookings.filter((booking) => booking.status === "cancelado").length,
    noShowCount: bookings.filter((booking) => booking.status === "faltou").length,
    recognizedRevenue,
    approvedOnlineRevenue,
    averageTicket: completedBookings.length > 0 ? recognizedRevenue / completedBookings.length : 0,
    uniqueClients: new Set(bookings.map((booking) => booking.clientId)).size
  };
}

function buildGroupedSummaries(
  bookings: readonly Booking[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[],
  groupBy: "service" | "professional",
  professionals: readonly Professional[] = []
): ReportingGroupSummary[] {
  const grouped = new Map<
    string,
    ReportingGroupSummary & { readonly clientIds: Set<string> }
  >();

  for (const booking of bookings) {
    const groupId = groupBy === "service" ? booking.serviceId : booking.professionalId;
    const service = services.find((item) => item.id === booking.serviceId);
    const professional = professionals.find((item) => item.id === booking.professionalId);
    const existing =
      grouped.get(groupId) ??
      ({
        id: groupId,
        label:
          groupBy === "service"
            ? service?.nome ?? "Servico removido"
            : professional?.nome ?? "Profissional removido",
        bookingsCount: 0,
        completedCount: 0,
        recognizedRevenue: 0,
        approvedOnlineRevenue: 0,
        averageTicket: 0,
        uniqueClients: 0,
        clientIds: new Set<string>()
      } satisfies ReportingGroupSummary & { readonly clientIds: Set<string> });

    existing.clientIds.add(booking.clientId);
    const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
    const nextCompletedCount =
      existing.completedCount + (booking.status === "concluido" ? 1 : 0);
    const nextRecognizedRevenue =
      existing.recognizedRevenue +
      (booking.status === "concluido"
        ? resolveRecognizedRevenueForBooking(booking, services, cashEntries)
        : 0);
    const nextApprovedOnlineRevenue =
      existing.approvedOnlineRevenue +
      (booking.status === "concluido"
        ? resolveApprovedOnlineRevenueForBooking(booking, paymentIntent, cashEntries)
        : 0);

    grouped.set(groupId, {
      ...existing,
      bookingsCount: existing.bookingsCount + 1,
      completedCount: nextCompletedCount,
      recognizedRevenue: nextRecognizedRevenue,
      approvedOnlineRevenue: nextApprovedOnlineRevenue,
      averageTicket:
        nextCompletedCount > 0 ? nextRecognizedRevenue / nextCompletedCount : 0,
      uniqueClients: existing.clientIds.size,
      clientIds: existing.clientIds
    });
  }

  return [...grouped.values()]
    .map(({ clientIds: _clientIds, ...entry }) => entry)
    .sort((left, right) => {
      if (right.recognizedRevenue !== left.recognizedRevenue) {
        return right.recognizedRevenue - left.recognizedRevenue;
      }
      if (right.bookingsCount !== left.bookingsCount) {
        return right.bookingsCount - left.bookingsCount;
      }
      return left.label.localeCompare(right.label);
    });
}

function buildClientRecurrenceRecords(
  clients: readonly Client[],
  bookings: readonly Booking[],
  services: readonly Service[],
  cashEntries: readonly CashEntry[]
): ClientRecurrenceRecord[] {
  return clients
    .map((client) => {
      const completedBookings = bookings
        .filter(
          (booking) => booking.clientId === client.id && booking.status === "concluido"
        )
        .sort((left, right) => left.endAt.localeCompare(right.endAt));
      const lastCompleted = completedBookings.at(-1);
      const recognizedRevenue = completedBookings.reduce((total, booking) => {
        return total + resolveRecognizedRevenueForBooking(booking, services, cashEntries);
      }, 0);

      return {
        client,
        completedBookings,
        recognizedRevenue,
        lastCompletedAt: lastCompleted?.endAt,
        daysSinceLastCompleted: lastCompleted
          ? calculateDaysSinceIso(lastCompleted.endAt)
          : undefined,
        averageRecurrenceDays: calculateAverageRecurrenceDays(completedBookings)
      };
    })
    .sort((left, right) =>
      (right.lastCompletedAt ?? "").localeCompare(left.lastCompletedAt ?? "")
    );
}

function buildReturnBuckets(
  records: readonly ClientRecurrenceRecord[]
): ReportingReturnBucket[] {
  const buckets = [
    { id: "return_0_30", label: "0-30 dias", clientsCount: 0 },
    { id: "return_31_60", label: "31-60 dias", clientsCount: 0 },
    { id: "return_61_90", label: "61-90 dias", clientsCount: 0 },
    { id: "return_91_plus", label: "91+ dias", clientsCount: 0 },
    { id: "never_completed", label: "Nunca concluiu", clientsCount: 0 }
  ];

  for (const entry of records) {
    if (!entry.lastCompletedAt) {
      buckets[4].clientsCount += 1;
      continue;
    }

    const daysSince = entry.daysSinceLastCompleted ?? 0;
    if (daysSince <= 30) {
      buckets[0].clientsCount += 1;
      continue;
    }
    if (daysSince <= 60) {
      buckets[1].clientsCount += 1;
      continue;
    }
    if (daysSince <= 90) {
      buckets[2].clientsCount += 1;
      continue;
    }
    buckets[3].clientsCount += 1;
  }

  return buckets;
}

function resolveRecognizedRevenueForBooking(
  booking: Booking,
  services: readonly Service[],
  cashEntries: readonly CashEntry[]
): number {
  const persistedAmount = resolveOpenCashEntryAmount(cashEntries, booking.id, "recognized_revenue");
  if (persistedAmount > 0) {
    return persistedAmount;
  }

  const service = services.find((item) => item.id === booking.serviceId);
  return service?.precoBase ?? 0;
}

function resolveApprovedOnlineRevenueForBooking(
  booking: Booking,
  paymentIntent: PaymentIntent | undefined,
  cashEntries: readonly CashEntry[]
): number {
  const persistedAmount = resolveOpenCashEntryAmount(cashEntries, booking.id, "online_payment");
  if (persistedAmount > 0) {
    return persistedAmount;
  }

  return isApprovedPaymentIntent(paymentIntent) ? paymentIntent?.amount ?? 0 : 0;
}

function resolveOpenCashEntryAmount(
  cashEntries: readonly CashEntry[],
  bookingId: string,
  kind: CashEntry["kind"]
): number {
  return (
    cashEntries.find(
      (cashEntry) =>
        cashEntry.bookingId === bookingId &&
        cashEntry.kind === kind &&
        cashEntry.status === "open"
    )?.amount ?? 0
  );
}

function calculateAverageRecurrenceDays(bookings: readonly Booking[]): number | null {
  if (bookings.length < 2) {
    return null;
  }

  let totalGapDays = 0;
  let gapsCount = 0;

  for (let index = 1; index < bookings.length; index += 1) {
    const previous = new Date(bookings[index - 1].endAt).getTime();
    const current = new Date(bookings[index].endAt).getTime();
    const gapDays = Math.max(Math.round((current - previous) / 86400000), 0);
    totalGapDays += gapDays;
    gapsCount += 1;
  }

  if (gapsCount === 0) {
    return null;
  }

  return Number((totalGapDays / gapsCount).toFixed(1));
}

function resolveReturnWindowDays(window: ReportingFilters["returnWindow"]): number {
  if (window === "30d") {
    return 30;
  }
  if (window === "60d") {
    return 60;
  }
  return 90;
}

function calculateDaysSinceIso(value: string): number {
  const now = new Date();
  const date = new Date(value);
  return Math.max(Math.floor((now.getTime() - date.getTime()) / 86400000), 0);
}

function isApprovedPaymentIntent(paymentIntent?: PaymentIntent): boolean {
  return paymentIntent?.status === "approved" || paymentIntent?.status === "authorized";
}
