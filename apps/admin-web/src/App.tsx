import { Fragment, useEffect, useState, type CSSProperties, type FormEvent, type JSX } from "react";
import { format as formatDateFns, getDay, parse as parseDateFns, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Link as LinkIcon,
  ListTodo,
  Menu,
  Plus,
  Rocket,
  Search,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  X,
  XCircle,
  type LucideIcon
} from "lucide-react";
import {
  Calendar as BigCalendar,
  dateFnsLocalizer,
  type View as BigCalendarView
} from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";

import {
  defaultServicePaymentPolicy,
  paymentChargeTypeValues,
  paymentCheckoutModeValues,
  paymentCollectionModeValues,
  paymentMethodValues,
  paymentProviderStatusValues,
  type AdminReportsReadModel,
  type AvailabilityRule,
  type Booking,
  type CashEntry,
  type Client,
  type CreateTenantCommand,
  type PaymentIntent,
  type Professional,
  type ReportingGroupSummary,
  type ReportingMetricSummary,
  type Service,
  type TenantPaymentSettings
} from "@agendaai/contracts";

import {
  type AvailabilitySlot,
  AdminApiError,
  DEFAULT_ADMIN_API_BASE_URL,
  type AdminBootstrapPayload,
  createBooking,
  createClient,
  createProfessional,
  createService,
  createTenantOnboarding,
  deleteService,
  fetchAdminReportsReadModel,
  fetchAvailabilitySlots,
  fetchAdminBootstrap,
  fetchProfessionalAvailability,
  loginAdmin,
  resolveAdminApiBaseUrl,
  savePaymentSettings,
  saveProfessionalAvailability,
  syncPaymentIntent,
  updateBooking,
  updateProfessional,
  updateService,
  updateTenantBranding,
  updateTenantSlug
} from "./lib/admin-api";
import {
  ReportsWorkspace,
  type ReportsWorkspaceFilterField,
  type ReportsWorkspaceLookupOption,
  type ReportsWorkspacePane
} from "./reports-workspace";
import {
  DocumentHeader,
  DocumentImpactPanel,
  DocumentSummaryCards,
  DocumentTabs,
  DocumentTimeline,
  DocumentViewLayout,
  EntityAsideSummary,
  EntityIdentityCard,
  EntitySection,
  EntityViewLayout,
  MasterDetailLayout,
  ViewBadge
} from "@agendaai/ui";

type AuthMode = "login" | "onboarding";
type AdminRoute =
  | "dashboard"
  | "relatorios"
  | "operacional"
  | "agenda"
  | "catalogo"
  | "profissionais"
  | "clientes"
  | "configuracoes";
type AgendaViewMode = "day" | "week" | "month";
type AgendaWorkspaceTab = "list" | "calendar";
type DashboardRange = "7d" | "30d" | "all";
type DashboardWorkspaceTab = "executive" | "agenda" | "radar" | "clients" | "shortcuts";
type OperationalWorkspaceTab = "overview" | "pending" | "confirmed" | "completed" | "noshow";
type ServiceWorkspaceMode = "browse" | "view" | "edit" | "new";
type ProfessionalWorkspaceMode = "overview" | "profile" | "availability";
type ClientReturnWindow = "30d" | "60d" | "90d";
type ClientSegmentFilter = "all" | "returning" | "inactive" | "never_completed";
type CounterBookingStep = "service" | "professional" | "slot" | "client";
type ReportsWorkspaceTab =
  | "overview"
  | "services"
  | "team"
  | "retention"
  | "agenda"
  | "week"
  | "month"
  | "operations";
type ReportsAgendaWorkspaceTab = "week" | "month";
type PaymentCollectionMode = (typeof paymentCollectionModeValues)[number];
type PaymentCheckoutMode = (typeof paymentCheckoutModeValues)[number];
type PaymentChargeType = (typeof paymentChargeTypeValues)[number];
type PaymentMethod = (typeof paymentMethodValues)[number];
type PaymentProviderStatus = (typeof paymentProviderStatusValues)[number];

interface FeedbackState {
  readonly tone: "success" | "error" | "info";
  readonly message: string;
}

interface PaymentFormState {
  readonly status: PaymentProviderStatus;
  readonly checkoutMode: PaymentCheckoutMode;
  readonly publicKey: string;
  readonly accessToken: string;
  readonly collectorId: string;
  readonly statementDescriptor: string;
  readonly notificationUrl: string;
  readonly backSuccess: string;
  readonly backPending: string;
  readonly backFailure: string;
  readonly defaultInstallments: string;
  readonly expirationMinutes: string;
  readonly binaryMode: boolean;
}

interface BrandingFormState {
  readonly tagline: string;
  readonly accentColor: string;
}

interface ServiceFormState {
  readonly nome: string;
  readonly duracaoMin: string;
  readonly precoBase: string;
  readonly status: string;
  readonly collectionMode: PaymentCollectionMode;
  readonly checkoutMode: PaymentCheckoutMode;
  readonly chargeType: PaymentChargeType;
  readonly fixedAmount: string;
  readonly percentage: string;
  readonly acceptedMethods: PaymentMethod[];
}

interface ProfessionalFormState {
  readonly nome: string;
  readonly status: string;
  readonly especialidades: string[];
}

interface AvailabilityDayState {
  readonly weekday: number;
  readonly enabled: boolean;
  readonly startTime: string;
  readonly endTime: string;
}

interface CounterBookingFormState {
  readonly nome: string;
  readonly telefone: string;
  readonly email: string;
  readonly origem: string;
  readonly status: Extract<Booking["status"], "pendente" | "confirmado">;
}

interface CounterBookingReceipt {
  readonly booking: Booking;
  readonly client: Client;
  readonly service: Service;
  readonly professional: Professional;
}

interface ReportsWorkspaceItem {
  readonly key: ReportsWorkspaceTab;
  readonly label: string;
  readonly group: string;
  readonly description: string;
  readonly badge?: string;
}

interface ReportsPaneFilters {
  readonly dateFrom: string;
  readonly dateTo: string;
  readonly serviceFrom: string;
  readonly serviceTo: string;
  readonly professionalFrom: string;
  readonly professionalTo: string;
  readonly clientQuery: string;
  readonly returnWindow: ClientReturnWindow;
}

const reportsWorkspaceItems: readonly ReportsWorkspaceItem[] = [
  {
    key: "overview",
    label: "Visao executiva",
    group: "Visao gerencial",
    description: "Resumo do periodo para receita, volume, ticket e fila em aberto.",
    badge: "Core"
  },
  {
    key: "services",
    label: "Receita e servicos",
    group: "Comercial",
    description: "Mix de servicos, receita reconhecida, ticket e clientes unicos."
  },
  {
    key: "team",
    label: "Equipe e produtividade",
    group: "Operacao",
    description: "Leitura do resultado por profissional, sem misturar agenda diaria."
  },
  {
    key: "retention",
    label: "Retorno e retencao",
    group: "Clientes",
    description: "Base com retorno, sem retorno, recorrencia e clientes em risco."
  },
  {
    key: "week",
    label: "Radar semanal",
    group: "Capacidade",
    description: "Carga da semana para remanejamento e leitura de ocupacao."
  },
  {
    key: "month",
    label: "Visao mensal",
    group: "Capacidade",
    description: "Concentrado do mes para capacidade e sazonalidade."
  },
  {
    key: "operations",
    label: "Pendencias operacionais",
    group: "Operacao",
    description: "Fila de bookings abertos e itens que ainda pedem acao.",
    badge: "Acao"
  }
] as const;

interface BookingSummary {
  readonly today: number;
  readonly open: number;
  readonly confirmed: number;
  readonly completed: number;
}

interface BookingAction {
  readonly label: string;
  readonly nextStatus: Booking["status"];
  readonly tone: "primary" | "secondary" | "danger";
}

interface ClientInsight {
  readonly client: Client;
  readonly totalBookings: number;
  readonly openBookings: number;
  readonly completedBookings: number;
  readonly lastBooking?: Booking;
  readonly lastCompletedBooking?: Booking;
  readonly recognizedRevenue: number;
  readonly cashEntriesCount: number;
  readonly lastCashEntry?: CashEntry;
}

interface DayBookingSummary {
  readonly total: number;
  readonly open: number;
  readonly confirmed: number;
}

interface WeekCapacitySummary {
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
  readonly freeMinutes: number;
  readonly bookingsCount: number;
  readonly openBookings: number;
}

interface WeekDayCapacitySummary {
  readonly date: string;
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
  readonly bookingsCount: number;
  readonly openBookings: number;
}

interface MonthCalendarCell {
  readonly date: string;
  readonly inCurrentMonth: boolean;
  readonly bookings: Booking[];
  readonly bookingsCount: number;
  readonly openBookings: number;
  readonly completedBookings: number;
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
}

interface RevenueEntry {
  readonly booking: Booking;
  readonly service?: Service;
  readonly professional?: Professional;
  readonly client?: Client;
  readonly paymentIntent?: PaymentIntent;
  readonly recognizedCashEntry?: CashEntry;
  readonly onlinePaymentCashEntry?: CashEntry;
  readonly recognizedAmount: number;
  readonly approvedOnlineAmount: number;
}

interface DashboardRevenueSummary {
  readonly recognizedRevenue: number;
  readonly approvedOnlineRevenue: number;
  readonly completedCount: number;
  readonly averageTicket: number;
  readonly uniqueClients: number;
  readonly noShowRate: number;
  readonly cancelledCount: number;
}

interface DashboardChartPoint {
  readonly label: string;
  readonly recognizedRevenue: number;
  readonly bookingsCount: number;
}

interface AgendaCalendarEvent {
  readonly id: string;
  readonly title: string;
  readonly start: Date;
  readonly end: Date;
  readonly resource: Booking;
}

interface ClientPortfolioSummary {
  readonly activeCount: number;
  readonly inactiveCount: number;
  readonly neverCompletedCount: number;
  readonly returningCount: number;
}

type ReportGroupSummary = ReportingGroupSummary;
type ReportMetricSummary = ReportingMetricSummary;

interface AdminRouteDefinition {
  readonly label: string;
  readonly shortLabel: string;
  readonly section: "Gestao do negocio" | "Dia a dia" | "Administracao";
  readonly icon: LucideIcon;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly stage: "funcional" | "parcial";
}

const API_BASE_STORAGE_KEY = "agendaai.admin.apiBaseUrl";
const SESSION_STORAGE_KEY = "agendaai.admin.sessionToken";
const ADMIN_PROFILE_NAME_STORAGE_KEY = "agendaai.admin.profileName";
const ADMIN_PROFILE_EMAIL_STORAGE_KEY = "agendaai.admin.profileEmail";
const DEPLOY_ADMIN_API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  DEFAULT_ADMIN_API_BASE_URL;
const BOOKING_BASE_URL =
  (import.meta.env.VITE_BOOKING_BASE_URL as string | undefined)?.trim() || "http://127.0.0.1:3000";
const ADMIN_SHELL_COMPACT_BREAKPOINT = 1100;
const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;
const agendaCalendarMessages = {
  next: "Proximo",
  previous: "Anterior",
  today: "Hoje",
  month: "Mes",
  week: "Semana",
  work_week: "Semana util",
  day: "Dia",
  agenda: "Agenda",
  date: "Data",
  time: "Horario",
  event: "Booking",
  noEventsInRange: "Nenhuma booking neste recorte.",
  showMore: (total: number) => `+${total} mais`
} satisfies Record<string, string | ((total: number) => string)>;
const agendaCalendarLocalizer = dateFnsLocalizer({
  format: formatDateFns,
  parse: parseDateFns,
  startOfWeek: (value: Date) => startOfWeek(value, { locale: ptBR }),
  getDay,
  locales: {
    "pt-BR": ptBR
  }
});
const professionalAvatarVariants = [
  "is-cobalt",
  "is-violet",
  "is-slate",
  "is-teal"
] as const;
const defaultAdminRoute: AdminRoute = "operacional";
const adminRouteDefinitions: Record<AdminRoute, AdminRouteDefinition> = {
  dashboard: {
    label: "Dashboard",
    shortLabel: "DG",
    section: "Gestao do negocio",
    icon: LayoutDashboard,
    eyebrow: "Gestao do negocio",
    title: "Dashboard",
    description: "Visao executiva, agenda da semana e atalhos do negocio.",
    stage: "parcial"
  },
  relatorios: {
    label: "Relatorios",
    shortLabel: "RL",
    section: "Gestao do negocio",
    icon: TrendingUp,
    eyebrow: "Gestao do negocio",
    title: "Relatorios essenciais do tenant",
    description: "Comparativos por periodo, retorno e insights de capacidade sem disputar a operacao da agenda.",
    stage: "parcial"
  },
  operacional: {
    label: "Operacao diaria",
    shortLabel: "OP",
    section: "Dia a dia",
    icon: ListTodo,
    eyebrow: "Dia a dia",
    title: "Fila operacional do dia",
    description:
      "Agenda administrativa para confirmar, concluir ou cancelar atendimentos sem misturar implantacao e configuracao.",
    stage: "funcional"
  },
  agenda: {
    label: "Agenda / calendario",
    shortLabel: "AG",
    section: "Dia a dia",
    icon: CalendarDays,
    eyebrow: "Planejamento",
    title: "Agenda operacional",
    description:
      "Lista do dia e calendario interativo com detalhe completo da booking; capacidade agregada fica em Relatorios.",
    stage: "parcial"
  },
  catalogo: {
    label: "Catalogo",
    shortLabel: "CT",
    section: "Administracao",
    icon: BookOpen,
    eyebrow: "Administracao",
    title: "Servicos e politica comercial",
    description:
      "Cadastro real de servicos e cobranca. Produtos, kits, combos e add-ons continuam fora dos contratos atuais.",
    stage: "funcional"
  },
  profissionais: {
    label: "Profissionais",
    shortLabel: "PF",
    section: "Administracao",
    icon: Users,
    eyebrow: "Administracao",
    title: "Equipe e disponibilidade semanal",
    description:
      "Cadastro da equipe, especialidades e agenda operacional semanal por profissional.",
    stage: "funcional"
  },
  clientes: {
    label: "Clientes",
    shortLabel: "CL",
    section: "Administracao",
    icon: UserCircle,
    eyebrow: "Administracao",
    title: "Base derivada da jornada real",
    description:
      "Clientes capturados pelo fluxo publico com leitura de historico, retorno por janela e receita derivada. CRM avancado, WhatsApp e cohort seguem sem contrato dedicado.",
    stage: "parcial"
  },
  configuracoes: {
    label: "Configuracoes",
    shortLabel: "CF",
    section: "Administracao",
    icon: Settings,
    eyebrow: "Implantacao",
    title: "Perfil do negocio e cobranca",
    description:
      "Slug publica, Mercado Pago, ambiente administrativo e parametros do tenant em uma area separada da operacao.",
    stage: "funcional"
  }
};
const adminNavigationSections: ReadonlyArray<{
  readonly label: AdminRouteDefinition["section"];
  readonly routes: readonly AdminRoute[];
}> = [
  {
    label: "Gestao do negocio",
    routes: ["dashboard", "relatorios"]
  },
  {
    label: "Dia a dia",
    routes: ["operacional", "agenda"]
  },
  {
    label: "Administracao",
    routes: ["catalogo", "profissionais", "clientes", "configuracoes"]
  }
];

const defaultPaymentForm: PaymentFormState = {
  status: "draft",
  checkoutMode: "checkout_pro",
  publicKey: "",
  accessToken: "",
  collectorId: "",
  statementDescriptor: "",
  notificationUrl: "",
  backSuccess: "",
  backPending: "",
  backFailure: "",
  defaultInstallments: "1",
  expirationMinutes: "30",
  binaryMode: true
};

const defaultBrandingForm: BrandingFormState = {
  tagline: "",
  accentColor: ""
};

const defaultCounterBookingForm: CounterBookingFormState = {
  nome: "",
  telefone: "",
  email: "",
  origem: "balcao",
  status: "confirmado"
};

const defaultServiceForm: ServiceFormState = {
  nome: "",
  duracaoMin: "45",
  precoBase: "90",
  status: "active",
  collectionMode: "none",
  checkoutMode: "checkout_pro",
  chargeType: "percentage",
  fixedAmount: "",
  percentage: "30",
  acceptedMethods: [...defaultServicePaymentPolicy.acceptedMethods]
};

function groupReportsWorkspaceItems(
  items: readonly ReportsWorkspaceItem[]
): Array<[string, ReportsWorkspaceItem[]]> {
  const grouped = new Map<string, ReportsWorkspaceItem[]>();

  items.forEach((item) => {
    const current = grouped.get(item.group) ?? [];
    current.push(item);
    grouped.set(item.group, current);
  });

  return Array.from(grouped.entries());
}

function createDefaultReportsPaneFilters(window: ClientReturnWindow): ReportsPaneFilters {
  return {
    dateFrom: "",
    dateTo: "",
    serviceFrom: "",
    serviceTo: "",
    professionalFrom: "",
    professionalTo: "",
    clientQuery: "",
    returnWindow: window
  };
}

function describeLookupRange(from: string, to: string, emptyLabel: string): string {
  if (from && to) {
    return from === to ? from : `${from} ate ${to}`;
  }
  if (from) {
    return `De ${from}`;
  }
  if (to) {
    return `Ate ${to}`;
  }
  return emptyLabel;
}

function describeDateWindow(from: string, to: string, fallbackLabel: string): string {
  if (from && to) {
    return `${formatDateShort(from)} ate ${formatDateShort(to)}`;
  }
  if (from) {
    return `Desde ${formatDateShort(from)}`;
  }
  if (to) {
    return `Ate ${formatDateShort(to)}`;
  }
  return fallbackLabel;
}

function mapLookupOptions(
  options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
  }>
): ReportsWorkspaceLookupOption[] {
  return options.map((option) => ({
    value: option.label,
    label: option.value
  }));
}

function formatLookupCode(value: string): string {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return compact.slice(-6) || value.toUpperCase();
}

function buildLookupDisplay(label: string, value: string): string {
  return `${label} | ${formatLookupCode(value)}`;
}

function normalizeLookupValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function resolveLookupIndex(
  options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly searchTerms: readonly string[];
  }>,
  query: string
): number | null {
  const normalizedQuery = normalizeLookupValue(query);
  if (!normalizedQuery) {
    return null;
  }

  const exactIndex = options.findIndex((option) =>
    option.searchTerms.some((term) => normalizeLookupValue(term) === normalizedQuery)
  );
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const fuzzyIndex = options.findIndex((option) =>
    option.searchTerms.some((term) => normalizeLookupValue(term).includes(normalizedQuery))
  );
  return fuzzyIndex >= 0 ? fuzzyIndex : null;
}

function isWithinLookupRange(
  value: string,
  options: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly searchTerms: readonly string[];
  }>,
  fromQuery: string,
  toQuery: string
): boolean {
  const valueIndex = options.findIndex((option) => option.value === value);
  if (valueIndex < 0) {
    return true;
  }

  const fromIndex = resolveLookupIndex(options, fromQuery);
  const toIndex = resolveLookupIndex(options, toQuery);
  const start = fromIndex ?? 0;
  const end = toIndex ?? options.length - 1;
  return valueIndex >= Math.min(start, end) && valueIndex <= Math.max(start, end);
}

function filterBookingsByDetailedReportsFilters(
  bookings: readonly Booking[],
  filters: ReportsPaneFilters,
  services: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly searchTerms: readonly string[];
  }>,
  professionals: ReadonlyArray<{
    readonly value: string;
    readonly label: string;
    readonly searchTerms: readonly string[];
  }>,
  clients: readonly Client[],
  fallbackRange: DashboardRange
): Booking[] {
  const dateScopedBookings =
    filters.dateFrom || filters.dateTo
      ? bookings.filter((booking) => {
          const bookingDate = extractDatePart(booking.startAt);
          if (filters.dateFrom && bookingDate < filters.dateFrom) {
            return false;
          }
          if (filters.dateTo && bookingDate > filters.dateTo) {
            return false;
          }
          return true;
        })
      : filterBookingsByRange(bookings, fallbackRange);

  const normalizedClientQuery = normalizeLookupValue(filters.clientQuery);

  return dateScopedBookings
    .filter((booking) =>
      isWithinLookupRange(booking.serviceId, services, filters.serviceFrom, filters.serviceTo)
    )
    .filter((booking) =>
      isWithinLookupRange(
        booking.professionalId,
        professionals,
        filters.professionalFrom,
        filters.professionalTo
      )
    )
    .filter((booking) => {
      if (!normalizedClientQuery) {
        return true;
      }

      const client = clients.find((item) => item.id === booking.clientId);
      if (!client) {
        return false;
      }

      return [client.nome, client.telefone, client.id, `${client.nome} | ${client.telefone}`].some((term) =>
        normalizeLookupValue(term).includes(normalizedClientQuery)
      );
    })
    .sort((left, right) => right.startAt.localeCompare(left.startAt));
}

function DashboardChart({
  data
}: {
  readonly data: readonly DashboardChartPoint[];
}): JSX.Element {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data.length) {
    return (
      <div className="dashboard-chart-empty">
        <AlertCircle className="dashboard-chart-empty-icon" />
        <p>Sem volume suficiente para compor a serie visual desta semana.</p>
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((item) => item.recognizedRevenue), 1) * 1.2;
  const maxBookings = Math.max(...data.map((item) => item.bookingsCount), 1) * 1.2;
  const width = 820;
  const height = 280;
  const paddingX = 42;
  const paddingY = 22;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2 - 20;

  const getX = (index: number) =>
    paddingX + index * (chartWidth / Math.max(data.length - 1, 1));
  const getRevenueY = (value: number) => paddingY + chartHeight - (value / maxRevenue) * chartHeight;
  const getBookingsY = (value: number) => paddingY + chartHeight - (value / maxBookings) * chartHeight;

  const revenuePath = data
    .map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getRevenueY(item.recognizedRevenue)}`)
    .join(" ");
  const revenueArea = `${revenuePath} L ${getX(data.length - 1)} ${paddingY + chartHeight} L ${getX(0)} ${paddingY + chartHeight} Z`;
  const bookingsPath = data
    .map((item, index) => `${index === 0 ? "M" : "L"} ${getX(index)} ${getBookingsY(item.bookingsCount)}`)
    .join(" ");

  return (
    <div className="dashboard-chart">
      <div className="dashboard-chart-legends">
        <div className="dashboard-chart-legend">
          <span className="dashboard-chart-dot is-revenue" />
          <span>Receita reconhecida</span>
        </div>
        <div className="dashboard-chart-legend">
          <span className="dashboard-chart-dot is-bookings" />
          <span>Agendamentos</span>
        </div>
      </div>

      <div className="dashboard-chart-svg-shell">
        <svg viewBox={`0 0 ${width} ${height}`} className="dashboard-chart-svg" role="img">
          <defs>
            <linearGradient id="agendaaiRevenueArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(11, 122, 117, 0.28)" />
              <stop offset="100%" stopColor="rgba(11, 122, 117, 0)" />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + chartHeight * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="rgba(148, 163, 184, 0.22)"
                  strokeWidth="1.5"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="dashboard-chart-axis-text"
                >
                  {ratio === 1 ? "0" : Math.round(maxRevenue * (1 - ratio))}
                </text>
              </g>
            );
          })}

          <path d={revenueArea} fill="url(#agendaaiRevenueArea)" />
          <path
            d={revenuePath}
            fill="none"
            stroke="var(--ag-color-brand-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={bookingsPath}
            fill="none"
            stroke="var(--ag-color-status-info)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {data.map((item, index) => {
            const x = getX(index);
            return (
              <g key={item.label}>
                <text
                  x={x}
                  y={paddingY + chartHeight + 20}
                  textAnchor="middle"
                  className="dashboard-chart-axis-text"
                >
                  {item.label}
                </text>

                <rect
                  x={x - chartWidth / Math.max(data.length - 1, 1) / 2}
                  y={paddingY}
                  width={chartWidth / Math.max(data.length - 1, 1)}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {hoveredIndex === index ? (
                  <g className="dashboard-chart-hover">
                    <line
                      x1={x}
                      y1={paddingY}
                      x2={x}
                      y2={paddingY + chartHeight}
                      stroke="rgba(100, 116, 139, 0.44)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <circle
                      cx={x}
                      cy={getRevenueY(item.recognizedRevenue)}
                      r="5"
                      fill="var(--ag-color-brand-primary)"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <circle
                      cx={x}
                      cy={getBookingsY(item.bookingsCount)}
                      r="5"
                      fill="var(--ag-color-status-info)"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <g transform={`translate(${x > width / 2 ? x - 146 : x + 14}, ${paddingY + 8})`}>
                      <rect
                        width="132"
                        height="72"
                        rx="12"
                        fill="rgba(15, 23, 42, 0.96)"
                      />
                      <text x="12" y="24" className="dashboard-chart-tooltip-title">
                        {item.label}
                      </text>
                      <text x="12" y="44" className="dashboard-chart-tooltip-revenue">
                        {formatCurrency(item.recognizedRevenue)}
                      </text>
                      <text x="12" y="61" className="dashboard-chart-tooltip-bookings">
                        {item.bookingsCount} agendamento(s)
                      </text>
                    </g>
                  </g>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function isAdminRoute(value: string): value is AdminRoute {
  return Object.prototype.hasOwnProperty.call(adminRouteDefinitions, value);
}

function readAdminRouteFromHash(): AdminRoute {
  if (typeof window === "undefined") {
    return defaultAdminRoute;
  }

  const hash = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return isAdminRoute(hash) ? hash : defaultAdminRoute;
}

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(readAdminRouteFromHash);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    loadStoredValue(API_BASE_STORAGE_KEY, DEPLOY_ADMIN_API_BASE_URL)
  );
  const [sessionToken, setSessionToken] = useState(() => loadStoredValue(SESSION_STORAGE_KEY, ""));
  const [adminProfile, setAdminProfile] = useState(() => ({
    name: loadStoredValue(ADMIN_PROFILE_NAME_STORAGE_KEY, ""),
    email: loadStoredValue(ADMIN_PROFILE_EMAIL_STORAGE_KEY, "")
  }));
  const [bootstrap, setBootstrap] = useState<AdminBootstrapPayload | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>("30d");
  const [dashboardWorkspaceTab, setDashboardWorkspaceTab] = useState<DashboardWorkspaceTab>("executive");
  const [operationalWorkspaceTab, setOperationalWorkspaceTab] =
    useState<OperationalWorkspaceTab>("overview");
  const [isShellContextOpen, setIsShellContextOpen] = useState(false);
  const [isShellPulseOpen, setIsShellPulseOpen] = useState(false);
  const [isCounterBookingModalOpen, setIsCounterBookingModalOpen] = useState(false);
  const [isAgendaBookingModalOpen, setIsAgendaBookingModalOpen] = useState(false);
  const [counterBookingStep, setCounterBookingStep] = useState<CounterBookingStep>("service");
  const [counterBookingServiceId, setCounterBookingServiceId] = useState("");
  const [counterBookingProfessionalId, setCounterBookingProfessionalId] = useState("");
  const [counterBookingDate, setCounterBookingDate] = useState(() => formatDateInputValue(new Date()));
  const [counterBookingSlots, setCounterBookingSlots] = useState<AvailabilitySlot[]>([]);
  const [counterBookingSlotStartAt, setCounterBookingSlotStartAt] = useState("");
  const [isLoadingCounterBookingSlots, setIsLoadingCounterBookingSlots] = useState(false);
  const [counterBookingForm, setCounterBookingForm] = useState<CounterBookingFormState>(
    defaultCounterBookingForm
  );
  const [counterBookingError, setCounterBookingError] = useState<string | null>(null);
  const [isSubmittingCounterBooking, setIsSubmittingCounterBooking] = useState(false);
  const [counterBookingReceipt, setCounterBookingReceipt] = useState<CounterBookingReceipt | null>(null);
  const [reportsRange, setReportsRange] = useState<DashboardRange>("30d");
  const [reportsServiceFilter, setReportsServiceFilter] = useState("all");
  const [reportsProfessionalFilter, setReportsProfessionalFilter] = useState("all");
  const [reportsReadModel, setReportsReadModel] = useState<AdminReportsReadModel | null>(null);
  const [reportsReadModelError, setReportsReadModelError] = useState<string | null>(null);
  const [isLoadingReportsReadModel, setIsLoadingReportsReadModel] = useState(false);
  const [clientReturnWindow, setClientReturnWindow] = useState<ClientReturnWindow>("30d");
  const [clientSegmentFilter, setClientSegmentFilter] = useState<ClientSegmentFilter>("all");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "owner@agendaai.demo",
    password: "agendaai-demo"
  });
  const [openRouteTabs, setOpenRouteTabs] = useState<AdminRoute[]>([defaultAdminRoute]);
  const [onboardingForm, setOnboardingForm] = useState({
    nome: "",
    slug: "",
    timezone: "America/Sao_Paulo",
    adminNome: "",
    adminEmail: "",
    adminTelefone: "",
    senha: ""
  });
  const [slug, setSlug] = useState("");
  const [brandingForm, setBrandingForm] = useState<BrandingFormState>(defaultBrandingForm);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>(defaultPaymentForm);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceWorkspaceMode, setServiceWorkspaceMode] = useState<ServiceWorkspaceMode>("browse");
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(defaultServiceForm);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [isCreatingProfessional, setIsCreatingProfessional] = useState(false);
  const [professionalWorkspaceMode, setProfessionalWorkspaceMode] =
    useState<ProfessionalWorkspaceMode>("overview");
  const [professionalForm, setProfessionalForm] = useState<ProfessionalFormState>({
    nome: "",
    status: "active",
    especialidades: []
  });
  const [availabilityDays, setAvailabilityDays] = useState<AvailabilityDayState[]>(
    createDefaultAvailabilityDays()
  );
  const [agendaWorkspaceTab, setAgendaWorkspaceTab] = useState<AgendaWorkspaceTab>("list");
  const [agendaViewMode, setAgendaViewMode] = useState<AgendaViewMode>("day");
  const [agendaDate, setAgendaDate] = useState(() => formatDateInputValue(new Date()));
  const [agendaProfessionalFilter, setAgendaProfessionalFilter] = useState("all");
  const [selectedAgendaBookingId, setSelectedAgendaBookingId] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(() => formatDateInputValue(new Date()));
  const [agendaSlots, setAgendaSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedAgendaSlotStartAt, setSelectedAgendaSlotStartAt] = useState("");
  const [isLoadingAgendaSlots, setIsLoadingAgendaSlots] = useState(false);
  const [weeklyAvailabilityByProfessional, setWeeklyAvailabilityByProfessional] = useState<
    Record<string, AvailabilityRule[]>
  >({});
  const [isLoadingWeeklyAvailability, setIsLoadingWeeklyAvailability] = useState(false);
  const [reportsWorkspaceTab, setReportsWorkspaceTab] = useState<ReportsWorkspaceTab>("overview");
  const [reportsOpenTabs, setReportsOpenTabs] = useState<ReportsWorkspaceTab[]>(["overview"]);
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);
  const [isReportsContextVisible, setIsReportsContextVisible] = useState(false);
  const [reportsAgendaWorkspaceTab, setReportsAgendaWorkspaceTab] =
    useState<ReportsAgendaWorkspaceTab>("week");
  const [reportsFiltersByTab, setReportsFiltersByTab] = useState<
    Partial<Record<ReportsWorkspaceTab, ReportsPaneFilters>>
  >({});
  const [reportsFilterDraft, setReportsFilterDraft] = useState<ReportsPaneFilters | null>(null);
  const [isReportsFilterModalOpen, setIsReportsFilterModalOpen] = useState(false);
  const [reportsLookupFieldId, setReportsLookupFieldId] = useState<string | null>(null);
  const [reportsLookupQuery, setReportsLookupQuery] = useState("");
  const [isCompactShell, setIsCompactShell] = useState(false);

  useEffect(() => {
    storeValue(API_BASE_STORAGE_KEY, apiBaseUrl);
  }, [apiBaseUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncRouteFromHash = () => {
      setCurrentRoute(readAdminRouteFromHash());
    };

    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => {
      window.removeEventListener("hashchange", syncRouteFromHash);
    };
  }, []);

  useEffect(() => {
    setOpenRouteTabs((current) => (current.includes(currentRoute) ? current : [...current, currentRoute]));
  }, [currentRoute]);

  useEffect(() => {
    setReportsOpenTabs((current) =>
      current.includes(reportsWorkspaceTab) ? current : [...current, reportsWorkspaceTab]
    );
  }, [reportsWorkspaceTab]);

  useEffect(() => {
    setIsReportsFilterModalOpen(false);
    setReportsFilterDraft(null);
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }, [reportsWorkspaceTab]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let isCompactShell = window.innerWidth <= ADMIN_SHELL_COMPACT_BREAKPOINT;
    setIsCompactShell(isCompactShell);
    if (isCompactShell) {
      setIsSidebarOpen(false);
    }

    const syncShellMode = () => {
      const nextCompactShell = window.innerWidth <= ADMIN_SHELL_COMPACT_BREAKPOINT;
      if (nextCompactShell === isCompactShell) {
        return;
      }

      isCompactShell = nextCompactShell;
      setIsCompactShell(nextCompactShell);
      setIsSidebarOpen(false);
    };

    window.addEventListener("resize", syncShellMode);
    return () => {
      window.removeEventListener("resize", syncShellMode);
    };
  }, []);

  useEffect(() => {
    storeValue(SESSION_STORAGE_KEY, sessionToken);
  }, [sessionToken]);

  useEffect(() => {
    storeValue(ADMIN_PROFILE_NAME_STORAGE_KEY, adminProfile.name);
    storeValue(ADMIN_PROFILE_EMAIL_STORAGE_KEY, adminProfile.email);
  }, [adminProfile]);

  useEffect(() => {
    if (!feedback || feedback.tone === "error") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setFeedback((current) => (current?.message === feedback.message ? null : current));
    }, 3600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  useEffect(() => {
    if (!sessionToken) {
      setBootstrap(null);
      setBootError(null);
      return;
    }

    let ignore = false;

    async function loadState() {
      try {
        const nextState = await fetchAdminBootstrap(apiBaseUrl, sessionToken);
        if (!ignore) {
          setBootstrap(nextState);
          setBootError(null);
        }
      } catch (error) {
        if (ignore) {
          return;
        }
        if (error instanceof AdminApiError && error.status === 401) {
          setSessionToken("");
        }
        setBootstrap(null);
        setBootError(toErrorMessage(error));
      }
    }

    void loadState();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, sessionToken]);

  useEffect(() => {
    if (!sessionToken) {
      setReportsReadModel(null);
      setReportsReadModelError(null);
      setIsLoadingReportsReadModel(false);
      return;
    }

    let ignore = false;
    setIsLoadingReportsReadModel(true);

    async function loadReportsReadModel() {
      try {
        const nextReadModel = await fetchAdminReportsReadModel(apiBaseUrl, sessionToken, {
          range: reportsRange,
          serviceId: reportsServiceFilter !== "all" ? reportsServiceFilter : undefined,
          professionalId:
            reportsProfessionalFilter !== "all" ? reportsProfessionalFilter : undefined,
          returnWindow: clientReturnWindow
        });

        if (!ignore) {
          setReportsReadModel(nextReadModel);
          setReportsReadModelError(null);
        }
      } catch (error) {
        if (ignore) {
          return;
        }
        if (error instanceof AdminApiError && error.status === 401) {
          setSessionToken("");
        }
        setReportsReadModel(null);
        setReportsReadModelError(toErrorMessage(error));
      } finally {
        if (!ignore) {
          setIsLoadingReportsReadModel(false);
        }
      }
    }

    void loadReportsReadModel();
    return () => {
      ignore = true;
    };
  }, [
    apiBaseUrl,
    clientReturnWindow,
    reportsProfessionalFilter,
    reportsRange,
    reportsServiceFilter,
    sessionToken
  ]);

  useEffect(() => {
    if (!bootstrap) {
      setSlug("");
      setBrandingForm(defaultBrandingForm);
      setPaymentForm(defaultPaymentForm);
      setServiceWorkspaceMode("browse");
      setServiceForm(defaultServiceForm);
      return;
    }

    setSlug(bootstrap.session.tenant.slug);
    setBrandingForm(toBrandingForm(bootstrap.session.tenant.branding));
    setPaymentForm(toPaymentForm(bootstrap.paymentSettings));

    const service = selectedServiceId ?
        bootstrap.services.find((item) => item.id === selectedServiceId)
      : undefined;
    if (service) {
      setServiceForm(toServiceForm(service));
    } else if (serviceWorkspaceMode === "new") {
      setServiceForm(defaultServiceForm);
    } else {
      if (selectedServiceId) {
        setSelectedServiceId("");
      }
      if (serviceWorkspaceMode !== "browse") {
        setServiceWorkspaceMode("browse");
      }
      setServiceForm(defaultServiceForm);
    }

    const professional = selectedProfessionalId ?
        bootstrap.professionals.find((item) => item.id === selectedProfessionalId)
      : undefined;
    if (professional) {
      setProfessionalForm({
        nome: professional.nome,
        status: professional.status,
        especialidades: [...professional.especialidades]
      });
    } else if (!isCreatingProfessional) {
      setProfessionalForm({
        nome: "",
        status: "active",
        especialidades: []
      });
    }
  }, [
    bootstrap,
    isCreatingProfessional,
    selectedProfessionalId,
    selectedServiceId,
    serviceWorkspaceMode
  ]);

  useEffect(() => {
    if (!sessionToken || !selectedProfessionalId) {
      setAvailabilityDays(createDefaultAvailabilityDays());
      return;
    }

    let ignore = false;

    async function loadAvailability() {
      try {
        const rules = await fetchProfessionalAvailability(apiBaseUrl, sessionToken, selectedProfessionalId);
        if (!ignore) {
          setAvailabilityDays(toAvailabilityDays(rules));
        }
      } catch (error) {
        if (!ignore) {
          setFeedback({
            tone: "error",
            message: toErrorMessage(error)
          });
        }
      }
    }

    void loadAvailability();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, selectedProfessionalId, sessionToken]);

  useEffect(() => {
    const nextProfessionals = bootstrap?.professionals ?? [];
    if (!sessionToken || nextProfessionals.length === 0) {
      setWeeklyAvailabilityByProfessional({});
      setIsLoadingWeeklyAvailability(false);
      return;
    }

    let ignore = false;
    setIsLoadingWeeklyAvailability(true);

    async function loadWeeklyAvailability() {
      try {
        const entries = await Promise.all(
          nextProfessionals.map(async (professional) => [
            professional.id,
            await fetchProfessionalAvailability(apiBaseUrl, sessionToken, professional.id)
          ] as const)
        );

        if (!ignore) {
          setWeeklyAvailabilityByProfessional(Object.fromEntries(entries));
        }
      } catch (error) {
        if (!ignore) {
          setFeedback({
            tone: "error",
            message: toErrorMessage(error)
          });
        }
      } finally {
        if (!ignore) {
          setIsLoadingWeeklyAvailability(false);
        }
      }
    }

    void loadWeeklyAvailability();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, bootstrap?.professionals, sessionToken]);

  const tenant = bootstrap?.session.tenant;
  const publicBookingUrl = tenant ? `${BOOKING_BASE_URL.replace(/\/+$/, "")}/${tenant.slug}` : "";
  const sidebarProfileName = adminProfile.name || tenant?.nome || "Admin";
  const sidebarProfileEmail = adminProfile.email || "";
  const services = bootstrap?.services ?? [];
  const professionals = bootstrap?.professionals ?? [];
  const clients = bootstrap?.clients ?? [];
  const bookings = bootstrap?.bookings ?? [];
  const paymentIntents = bootstrap?.paymentIntents ?? [];
  const cashEntries = bootstrap?.cashEntries ?? [];
  const bookableServices = services.filter((service) => service.status === "active");
  const activeProfessionals = professionals.filter((professional) => {
    const normalizedStatus = professional.status.trim().toLowerCase();
    return normalizedStatus === "active" || normalizedStatus === "ativo";
  });
  const counterBookingProfessionals = getSupportedProfessionalsForService(
    activeProfessionals,
    counterBookingServiceId
  );
  const counterBookingSelectedService = bookableServices.find(
    (service) => service.id === counterBookingServiceId
  );
  const counterBookingSelectedProfessional = counterBookingProfessionals.find(
    (professional) => professional.id === counterBookingProfessionalId
  );
  const counterBookingSelectedSlot = counterBookingSlots.find(
    (slot) => slot.startAt === counterBookingSlotStartAt
  );
  const counterBookingClientMatch = findMatchingClient(clients, counterBookingForm);
  const dashboardBookings = filterBookingsByRange(bookings, dashboardRange);
  const revenueEntries = buildRevenueEntries(
    dashboardBookings,
    services,
    professionals,
    clients,
    paymentIntents,
    cashEntries
  );
  const dashboardRevenueSummary = summarizeRevenueEntries(revenueEntries, dashboardBookings);
  const previousDashboardBookings =
    dashboardRange === "all" ? [] : filterBookingsByRange(bookings, dashboardRange, 1);
  const previousDashboardRevenueSummary = summarizeRevenueEntries(
    buildRevenueEntries(previousDashboardBookings, services, professionals, clients, paymentIntents, cashEntries),
    previousDashboardBookings
  );
  const dashboardChartData = buildDashboardChartData(bookings, services, cashEntries);
  const reportBookings = filterBookingsByReportSelection(
    filterBookingsByRange(bookings, reportsRange),
    reportsServiceFilter,
    reportsProfessionalFilter
  );
  const previousReportBookings =
    reportsRange === "all"
      ? []
      : filterBookingsByReportSelection(
          filterBookingsByRange(bookings, reportsRange, 1),
          reportsServiceFilter,
          reportsProfessionalFilter
        );
  const reportRevenueEntries = buildRevenueEntries(
    reportBookings,
    services,
    professionals,
    clients,
    paymentIntents,
    cashEntries
  );
  const reportRevenueSummary = summarizeRevenueEntries(reportRevenueEntries, reportBookings);
  const previousReportRevenueSummary = summarizeRevenueEntries(
    buildRevenueEntries(previousReportBookings, services, professionals, clients, paymentIntents, cashEntries),
    previousReportBookings
  );
  const reportServiceSummaries = buildServiceReportSummaries(
    reportBookings,
    services,
    paymentIntents,
    cashEntries
  );
  const reportProfessionalSummaries = buildProfessionalReportSummaries(
    reportBookings,
    professionals,
    services,
    paymentIntents,
    cashEntries
  );
  const bookingSummary = summarizeBookings(bookings);
  const todayBookings = bookings.filter((booking) => isSameCalendarDay(booking.startAt, new Date()));
  const todayPendingCount = todayBookings.filter(
    (booking) => booking.status === "pendente" || booking.status === "aguardando pagamento"
  ).length;
  const todayConfirmedCount = todayBookings.filter((booking) => booking.status === "confirmado").length;
  const dayAgendaBookings = filterBookingsByDate(bookings, agendaDate);
  const filteredDayAgendaBookings =
    agendaProfessionalFilter === "all"
      ? dayAgendaBookings
      : dayAgendaBookings.filter((booking) => booking.professionalId === agendaProfessionalFilter);
  const clientInsights = buildClientInsights(clients, bookings, services, cashEntries);
  const filteredClientInsights = filterClientInsights(
    clientInsights,
    clientSegmentFilter,
    clientReturnWindow
  );
  const clientPortfolioSummary = summarizeClientPortfolio(clientInsights, clientReturnWindow);
  const inactiveClientInsights = filterClientInsights(clientInsights, "inactive", clientReturnWindow);
  const fallbackReportCurrent = buildReportMetricSummary(reportBookings, services, paymentIntents, cashEntries);
  const fallbackReportPrevious =
    reportsRange === "all"
      ? undefined
      : buildReportMetricSummary(previousReportBookings, services, paymentIntents, cashEntries);
  const activeReportCurrent = reportsReadModel?.current ?? fallbackReportCurrent;
  const activeReportPrevious = reportsReadModel?.previous ?? fallbackReportPrevious;
  const activeReportServiceSummaries = reportsReadModel?.services ?? reportServiceSummaries;
  const activeReportProfessionalSummaries =
    reportsReadModel?.professionals ?? reportProfessionalSummaries;
  const activeClientRecurrence =
    reportsReadModel?.clientRecurrence ??
    ({
      window: clientReturnWindow,
      returningCount: clientPortfolioSummary.returningCount,
      inactiveCount: clientPortfolioSummary.inactiveCount,
      neverCompletedCount: clientPortfolioSummary.neverCompletedCount,
      clientsWithRecurrence: 0,
      averageRecurrenceDays: null,
      returnBuckets: [],
      inactiveClients: inactiveClientInsights.slice(0, 8).map((entry) => ({
        clientId: entry.client.id,
        nome: entry.client.nome,
        email: entry.client.email,
        telefone: entry.client.telefone,
        origem: entry.client.origem,
        completedBookings: entry.completedBookings,
        recognizedRevenue: entry.recognizedRevenue,
        lastCompletedAt: entry.lastCompletedBooking?.endAt,
        daysSinceLastCompleted: entry.lastCompletedBooking
          ? calculateDaysSinceIso(entry.lastCompletedBooking.endAt)
          : undefined,
        averageRecurrenceDays: null
      }))
    } satisfies NonNullable<AdminReportsReadModel["clientRecurrence"]>);
  const pendingPaymentCount = paymentIntents.filter((intent) =>
    ["pending", "in_process", "authorized", "draft"].includes(intent.status)
  ).length;
  const shellAttentionCount = todayPendingCount + pendingPaymentCount + clientPortfolioSummary.inactiveCount;
  const selectedAgendaBooking =
    filteredDayAgendaBookings.find((booking) => booking.id === selectedAgendaBookingId) ??
    bookings.find((booking) => booking.id === selectedAgendaBookingId);
  const selectedAgendaPaymentIntent =
    paymentIntents.find((intent) => intent.bookingId === selectedAgendaBooking?.id);
  const selectedClientInsight =
    filteredClientInsights.find((entry) => entry.client.id === selectedClientId) ??
    filteredClientInsights[0];
  const selectedClientBookings = selectedClientInsight ?
      bookings
        .filter((booking) => booking.clientId === selectedClientInsight.client.id)
        .sort((left, right) => right.startAt.localeCompare(left.startAt))
    : [];
  const selectedClientCashEntries = selectedClientInsight ?
      cashEntries
        .filter((entry) => entry.clientId === selectedClientInsight.client.id)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    : [];
  const agendaDaySummary = summarizeDayBookings(filteredDayAgendaBookings);
  const agendaWeekDates = buildAgendaWeekDates(agendaDate);
  const weekAgendaBookings = filterBookingsByDates(bookings, agendaWeekDates);
  const filteredWeekProfessionals =
    agendaProfessionalFilter === "all"
      ? professionals
      : professionals.filter((professional) => professional.id === agendaProfessionalFilter);
  const filteredWeekBookings =
    agendaProfessionalFilter === "all"
      ? weekAgendaBookings
      : weekAgendaBookings.filter((booking) => booking.professionalId === agendaProfessionalFilter);
  const weekCapacitySummary = summarizeWeekCapacity(
    filteredWeekBookings,
    agendaWeekDates,
    filteredWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
  const weekDaySummaries = buildWeekDaySummaries(
    filteredWeekBookings,
    agendaWeekDates,
    filteredWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
  const weekProfessionalSummaries = buildWeekProfessionalSummaries(
    filteredWeekBookings,
    agendaWeekDates,
    filteredWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
  const agendaMonthCells = buildAgendaMonthCells(
    agendaDate,
    bookings,
    agendaProfessionalFilter === "all"
      ? professionals
      : professionals.filter((professional) => professional.id === agendaProfessionalFilter),
    weeklyAvailabilityByProfessional,
    agendaProfessionalFilter
  );
  const currentMonthCells = agendaMonthCells.filter((cell) => cell.inCurrentMonth);
  const monthCapacitySummary = summarizeMonthCapacity(currentMonthCells);
  const selectedMonthCell =
    agendaMonthCells.find((cell) => cell.date === agendaDate) ?? currentMonthCells[0];
  const filteredAgendaCalendarBookings =
    agendaProfessionalFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.professionalId === agendaProfessionalFilter);
  const agendaCalendarEvents: AgendaCalendarEvent[] = filteredAgendaCalendarBookings.map((booking) => ({
    id: booking.id,
    title: `${resolveClientName(booking.clientId, clients)} - ${resolveServiceName(booking.serviceId, services)}`,
    start: new Date(booking.startAt),
    end: new Date(booking.endAt),
    resource: booking
  }));
  const selectedAgendaCalendarEvent =
    agendaCalendarEvents.find((event) => event.resource.id === selectedAgendaBooking?.id) ?? null;
  const reportsInsightAnchorDate = formatDateInputValue(new Date());
  const reportsInsightProfessionals =
    reportsProfessionalFilter === "all"
      ? professionals
      : professionals.filter((professional) => professional.id === reportsProfessionalFilter);
  const reportsInsightBookings =
    reportsProfessionalFilter === "all"
      ? bookings
      : bookings.filter((booking) => booking.professionalId === reportsProfessionalFilter);
  const reportsInsightWeekDates = buildAgendaWeekDates(reportsInsightAnchorDate);
  const reportsInsightWeekBookings = filterBookingsByDates(reportsInsightBookings, reportsInsightWeekDates);
  const reportsInsightWeekCapacitySummary = summarizeWeekCapacity(
    reportsInsightWeekBookings,
    reportsInsightWeekDates,
    reportsInsightProfessionals,
    weeklyAvailabilityByProfessional
  );
  const reportsInsightWeekDaySummaries = buildWeekDaySummaries(
    reportsInsightWeekBookings,
    reportsInsightWeekDates,
    reportsInsightProfessionals,
    weeklyAvailabilityByProfessional
  );
  const reportsInsightWeekProfessionalSummaries = buildWeekProfessionalSummaries(
    reportsInsightWeekBookings,
    reportsInsightWeekDates,
    reportsInsightProfessionals,
    weeklyAvailabilityByProfessional
  );
  const reportsInsightMonthCells = buildAgendaMonthCells(
    reportsInsightAnchorDate,
    bookings,
    reportsInsightProfessionals,
    weeklyAvailabilityByProfessional,
    reportsProfessionalFilter
  );
  const reportsInsightCurrentMonthCells = reportsInsightMonthCells.filter((cell) => cell.inCurrentMonth);
  const reportsInsightMonthCapacitySummary = summarizeMonthCapacity(reportsInsightCurrentMonthCells);

  useEffect(() => {
    const nextClientId = filteredClientInsights[0]?.client.id ?? "";

    if (!filteredClientInsights.length) {
      if (selectedClientId) {
        setSelectedClientId("");
      }
      return;
    }

    if (!selectedClientId && nextClientId) {
      setSelectedClientId(nextClientId);
      return;
    }

    if (
      selectedClientId &&
      !filteredClientInsights.some((entry) => entry.client.id === selectedClientId)
    ) {
      setSelectedClientId(nextClientId);
    }
  }, [filteredClientInsights, selectedClientId]);

  useEffect(() => {
    if (agendaProfessionalFilter === "all") {
      return;
    }

    if (!professionals.some((professional) => professional.id === agendaProfessionalFilter)) {
      setAgendaProfessionalFilter("all");
    }
  }, [agendaProfessionalFilter, professionals]);

  useEffect(() => {
    if (!filteredDayAgendaBookings.length) {
      if (selectedAgendaBookingId) {
        setSelectedAgendaBookingId("");
      }
      return;
    }

    if (!filteredDayAgendaBookings.some((booking) => booking.id === selectedAgendaBookingId)) {
      const nextBooking = filteredDayAgendaBookings[0];
      setSelectedAgendaBookingId(nextBooking.id);
      setRescheduleDate(extractDatePart(nextBooking.startAt));
    }
  }, [filteredDayAgendaBookings, selectedAgendaBookingId]);

  useEffect(() => {
    if (!selectedAgendaBooking && isAgendaBookingModalOpen) {
      setIsAgendaBookingModalOpen(false);
    }
  }, [isAgendaBookingModalOpen, selectedAgendaBooking]);

  useEffect(() => {
    if (!selectedAgendaBooking || !sessionToken) {
      setAgendaSlots([]);
      setSelectedAgendaSlotStartAt("");
      setIsLoadingAgendaSlots(false);
      return;
    }

    const booking = selectedAgendaBooking;
    let ignore = false;
    setIsLoadingAgendaSlots(true);

    async function loadAgendaSlots() {
      try {
        const slots = await fetchAvailabilitySlots(apiBaseUrl, sessionToken, {
          serviceId: booking.serviceId,
          professionalId: booking.professionalId,
          date: rescheduleDate
        });

        if (ignore) {
          return;
        }

        setAgendaSlots(slots);
        setSelectedAgendaSlotStartAt((current) => {
          if (current && slots.some((slot) => slot.startAt === current)) {
            return current;
          }

          const currentBookingSlot = slots.find((slot) => slot.startAt === booking.startAt);
          return currentBookingSlot?.startAt ?? "";
        });
      } catch (error) {
        if (!ignore) {
          setFeedback({
            tone: "error",
            message: toErrorMessage(error)
          });
          setAgendaSlots([]);
          setSelectedAgendaSlotStartAt("");
        }
      } finally {
        if (!ignore) {
          setIsLoadingAgendaSlots(false);
        }
      }
    }

    void loadAgendaSlots();
    return () => {
      ignore = true;
    };
  }, [
    apiBaseUrl,
    rescheduleDate,
    selectedAgendaBooking?.id,
    selectedAgendaBooking?.professionalId,
    selectedAgendaBooking?.serviceId,
    selectedAgendaBooking?.startAt,
    sessionToken
  ]);

  useEffect(() => {
    setIsShellContextOpen(false);
  }, [currentRoute]);

  useEffect(() => {
    if (!isCounterBookingModalOpen) {
      return;
    }

    if (!bookableServices.length) {
      if (counterBookingServiceId) {
        setCounterBookingServiceId("");
      }
      return;
    }

    if (!bookableServices.some((service) => service.id === counterBookingServiceId)) {
      setCounterBookingServiceId(bookableServices[0].id);
    }
  }, [bookableServices, counterBookingServiceId, isCounterBookingModalOpen]);

  useEffect(() => {
    if (!isCounterBookingModalOpen) {
      return;
    }

    if (!counterBookingProfessionals.length) {
      if (counterBookingProfessionalId) {
        setCounterBookingProfessionalId("");
      }
      return;
    }

    if (!counterBookingProfessionals.some((professional) => professional.id === counterBookingProfessionalId)) {
      setCounterBookingProfessionalId(counterBookingProfessionals[0].id);
    }
  }, [counterBookingProfessionalId, counterBookingProfessionals, isCounterBookingModalOpen]);

  useEffect(() => {
    if (
      !isCounterBookingModalOpen ||
      !sessionToken ||
      !counterBookingServiceId ||
      !counterBookingProfessionalId ||
      !counterBookingDate
    ) {
      setCounterBookingSlots([]);
      setCounterBookingSlotStartAt("");
      setIsLoadingCounterBookingSlots(false);
      return;
    }

    let ignore = false;
    setIsLoadingCounterBookingSlots(true);

    async function loadCounterBookingSlots() {
      try {
        const slots = await fetchAvailabilitySlots(apiBaseUrl, sessionToken, {
          serviceId: counterBookingServiceId,
          professionalId: counterBookingProfessionalId,
          date: counterBookingDate
        });

        if (ignore) {
          return;
        }

        setCounterBookingSlots(slots);
        setCounterBookingSlotStartAt((current) => {
          if (current && slots.some((slot) => slot.startAt === current)) {
            return current;
          }

          return slots[0]?.startAt ?? "";
        });
      } catch (error) {
        if (!ignore) {
          setCounterBookingError(toErrorMessage(error));
          setCounterBookingSlots([]);
          setCounterBookingSlotStartAt("");
        }
      } finally {
        if (!ignore) {
          setIsLoadingCounterBookingSlots(false);
        }
      }
    }

    void loadCounterBookingSlots();
    return () => {
      ignore = true;
    };
  }, [
    apiBaseUrl,
    counterBookingDate,
    counterBookingProfessionalId,
    counterBookingServiceId,
    isCounterBookingModalOpen,
    sessionToken
  ]);

  async function refreshAdminState(): Promise<void> {
    if (!sessionToken) {
      return;
    }
    setBootstrap(await fetchAdminBootstrap(apiBaseUrl, sessionToken));
  }

  async function runAction(task: () => Promise<void>): Promise<void> {
    setIsBusy(true);
    try {
      await task();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: toErrorMessage(error)
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const session = await loginAdmin(apiBaseUrl, loginForm.email, loginForm.password);
      setSessionToken(session.token);
      setAdminProfile({
        name: resolveAdminDisplayName(loginForm.email),
        email: loginForm.email.trim().toLowerCase()
      });
      setFeedback({ tone: "success", message: "Sessao administrativa aberta." });
    });
  }

  async function handleOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const payload: Omit<CreateTenantCommand, "version"> = {
        nome: onboardingForm.nome,
        slug: onboardingForm.slug,
        timezone: onboardingForm.timezone,
        admin: {
          nome: onboardingForm.adminNome,
          email: onboardingForm.adminEmail,
          telefone: emptyToUndefined(onboardingForm.adminTelefone),
          senha: onboardingForm.senha,
          aceitarTermos: true
        }
      };

      const onboarding = await createTenantOnboarding(apiBaseUrl, payload);
      setSessionToken(onboarding.session.token);
      setAdminProfile({
        name: onboardingForm.adminNome.trim(),
        email: onboardingForm.adminEmail.trim().toLowerCase()
      });
      setFeedback({ tone: "success", message: `Negocio ${onboarding.tenant.nome} criado e autenticado.` });
    });
  }

  async function handleSaveSlug(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await updateTenantSlug(apiBaseUrl, sessionToken, slug);
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Slug publica atualizada." });
    });
  }

  async function handleSaveBranding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await updateTenantBranding(apiBaseUrl, sessionToken, buildBrandingPayload(brandingForm));
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Branding minimo atualizado." });
    });
  }

  async function handleSavePayments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await savePaymentSettings(apiBaseUrl, sessionToken, buildPaymentPayload(paymentForm));
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Configuracao do Mercado Pago salva." });
    });
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const payload = buildServicePayload(serviceForm);
      const service =
        selectedServiceId ?
          await updateService(apiBaseUrl, sessionToken, selectedServiceId, payload)
        : await createService(apiBaseUrl, sessionToken, payload);
      setSelectedServiceId(service.id);
      setServiceWorkspaceMode("view");
      await refreshAdminState();
      setFeedback({ tone: "success", message: selectedServiceId ? "Servico atualizado." : "Servico criado." });
    });
  }

  async function handleDeleteSelectedService(): Promise<void> {
    if (!selectedServiceId) {
      return;
    }

    await runAction(async () => {
      await deleteService(apiBaseUrl, sessionToken, selectedServiceId);
      setSelectedServiceId("");
      setServiceWorkspaceMode("browse");
      setServiceForm(defaultServiceForm);
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: "Servico removido do catalogo."
      });
    });
  }

  async function handleSaveProfessional(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const isEditingProfessional = Boolean(selectedProfessionalId);
      const professional =
        isEditingProfessional ?
          await updateProfessional(apiBaseUrl, sessionToken, selectedProfessionalId, {
            nome: professionalForm.nome.trim(),
            status: professionalForm.status.trim(),
            especialidades: [...professionalForm.especialidades]
          })
        : await createProfessional(apiBaseUrl, sessionToken, {
            nome: professionalForm.nome.trim(),
            especialidades: [...professionalForm.especialidades]
          });
      setIsCreatingProfessional(false);
      setSelectedProfessionalId(professional.id);
      setProfessionalWorkspaceMode("profile");
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: isEditingProfessional ? "Profissional atualizado." : "Profissional criado."
      });
    });
  }

  async function handleSaveAvailability(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const rules = availabilityDays
        .filter((day) => day.enabled)
        .map((day) => ({
          weekday: day.weekday,
          faixa: { startTime: day.startTime, endTime: day.endTime }
        }));
      if (rules.length === 0) {
        throw new Error("Defina ao menos um dia com horario valido para publicar a agenda.");
      }
      await saveProfessionalAvailability(apiBaseUrl, sessionToken, selectedProfessionalId, rules);
      setFeedback({ tone: "success", message: "Disponibilidade semanal salva." });
    });
  }

  async function handleBookingStatusAction(
    bookingId: string,
    status: Booking["status"]
  ): Promise<void> {
    await runAction(async () => {
      await updateBooking(apiBaseUrl, sessionToken, bookingId, { status });
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: resolveBookingActionFeedback(status)
      });
    });
  }

  async function handlePaymentSync(paymentIntent: PaymentIntent): Promise<void> {
    await runAction(async () => {
      await syncPaymentIntent(apiBaseUrl, sessionToken, paymentIntent.id, {
        paymentId: paymentIntent.paymentId
      });
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: "Status de pagamento sincronizado."
      });
    });
  }

  async function handleRescheduleBooking(): Promise<void> {
    if (!selectedAgendaBooking) {
      setFeedback({
        tone: "error",
        message: "Selecione uma booking para reagendar."
      });
      return;
    }

    const nextSlot = agendaSlots.find((slot) => slot.startAt === selectedAgendaSlotStartAt);
    if (!nextSlot) {
      setFeedback({
        tone: "error",
        message: "Escolha um novo horario disponivel antes de salvar o reagendamento."
      });
      return;
    }

    await runAction(async () => {
      await updateBooking(apiBaseUrl, sessionToken, selectedAgendaBooking.id, {
        startAt: nextSlot.startAt,
        endAt: nextSlot.endAt
      });
      await refreshAdminState();
      setAgendaDate(nextSlot.date);
      setSelectedAgendaBookingId(selectedAgendaBooking.id);
      setFeedback({
        tone: "success",
        message: `Booking reagendada para ${formatDateTime(nextSlot.startAt)}.`
      });
    });
  }

  function openCounterBookingModal(): void {
    setCounterBookingStep("service");
    setCounterBookingServiceId(bookableServices[0]?.id ?? "");
    setCounterBookingProfessionalId("");
    setCounterBookingDate(formatDateInputValue(new Date()));
    setCounterBookingSlots([]);
    setCounterBookingSlotStartAt("");
    setCounterBookingForm(defaultCounterBookingForm);
    setCounterBookingError(null);
    setCounterBookingReceipt(null);
    setIsShellContextOpen(false);
    setIsCounterBookingModalOpen(true);
  }

  function closeCounterBookingModal(): void {
    setIsCounterBookingModalOpen(false);
    setCounterBookingError(null);
  }

  function handleCounterBookingGoToStep(step: CounterBookingStep): void {
    if (!isCounterBookingStepAvailable(step, counterBookingSelectedService, counterBookingSelectedProfessional, counterBookingSelectedSlot)) {
      return;
    }

    setCounterBookingError(null);
    setCounterBookingStep(step);
  }

  function handleCounterBookingNextStep(): void {
    const nextStep = resolveNextCounterBookingStep(counterBookingStep);
    if (!nextStep) {
      return;
    }

    if (
      !isCounterBookingStepComplete(
        counterBookingStep,
        counterBookingSelectedService,
        counterBookingSelectedProfessional,
        counterBookingSelectedSlot,
        counterBookingForm
      )
    ) {
      setCounterBookingError(resolveCounterBookingStepValidationMessage(counterBookingStep));
      return;
    }

    setCounterBookingError(null);
    setCounterBookingStep(nextStep);
  }

  function handleCounterBookingPreviousStep(): void {
    const previousStep = resolvePreviousCounterBookingStep(counterBookingStep);
    if (!previousStep) {
      return;
    }

    setCounterBookingError(null);
    setCounterBookingStep(previousStep);
  }

  async function handleSubmitCounterBooking(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (!counterBookingSelectedService || !counterBookingSelectedProfessional || !counterBookingSelectedSlot) {
      setCounterBookingError("Selecione servico, profissional e horario antes de salvar.");
      return;
    }

    if (!isCounterBookingStepComplete("client", counterBookingSelectedService, counterBookingSelectedProfessional, counterBookingSelectedSlot, counterBookingForm)) {
      setCounterBookingError(resolveCounterBookingStepValidationMessage("client"));
      return;
    }

    setIsSubmittingCounterBooking(true);
    setCounterBookingError(null);

    try {
      const matchedClient = findMatchingClient(clients, counterBookingForm);
      const client =
        matchedClient ??
        (await createClient(apiBaseUrl, sessionToken, {
          nome: counterBookingForm.nome.trim(),
          telefone: counterBookingForm.telefone.trim(),
          email: counterBookingForm.email.trim().toLowerCase(),
          origem: counterBookingForm.origem.trim().toLowerCase()
        }));

      const booking = await createBooking(apiBaseUrl, sessionToken, {
        clientId: client.id,
        serviceId: counterBookingSelectedService.id,
        professionalId: counterBookingSelectedProfessional.id,
        status: counterBookingForm.status,
        startAt: counterBookingSelectedSlot.startAt,
        endAt: counterBookingSelectedSlot.endAt
      });

      await refreshAdminState();
      setCounterBookingReceipt({
        booking,
        client,
        service: counterBookingSelectedService,
        professional: counterBookingSelectedProfessional
      });
      setFeedback({
        tone: "success",
        message: `Agendamento criado para ${client.nome} em ${formatDateTime(counterBookingSelectedSlot.startAt)}.`
      });
    } catch (error) {
      setCounterBookingError(toErrorMessage(error));
    } finally {
      setIsSubmittingCounterBooking(false);
    }
  }

  function handleOpenCounterBookingInAgenda(): void {
    if (!counterBookingReceipt) {
      return;
    }

    setAgendaViewMode("day");
    setAgendaDate(extractDatePart(counterBookingReceipt.booking.startAt));
    setRescheduleDate(extractDatePart(counterBookingReceipt.booking.startAt));
    setSelectedAgendaBookingId(counterBookingReceipt.booking.id);
    setSelectedAgendaSlotStartAt(counterBookingReceipt.booking.startAt);
    setIsCounterBookingModalOpen(false);
    navigateTo("agenda");
  }

  function toggleShellContextPanel(): void {
    setIsShellContextOpen((current) => {
      const next = !current;
      if (next) {
        setIsShellPulseOpen(false);
      }
      return next;
    });
  }

  function toggleShellPulsePanel(): void {
    setIsShellPulseOpen((current) => {
      const next = !current;
      if (next) {
        setIsShellContextOpen(false);
      }
      return next;
    });
  }

  function openClientsDirectoryFromShell(): void {
    setClientSegmentFilter("all");
    navigateTo("clientes");
  }

  function navigateTo(route: AdminRoute): void {
    const nextHash = `#${route}`;
    if (typeof window !== "undefined" && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setCurrentRoute(route);
    setIsShellContextOpen(false);
    setIsShellPulseOpen(false);
    setIsReportsMenuOpen(false);
    setIsAgendaBookingModalOpen(false);
    setIsSidebarOpen(false);
  }

  function closeWorkspaceTab(route: AdminRoute): void {
    setOpenRouteTabs((current) => {
      if (current.length <= 1) {
        return current;
      }

      const nextTabs = current.filter((item) => item !== route);
      if (route === currentRoute) {
        const fallbackRoute = nextTabs[nextTabs.length - 1] ?? defaultAdminRoute;
        window.setTimeout(() => navigateTo(fallbackRoute), 0);
      }

      return nextTabs;
    });
  }

  function openReportsWorkspaceTab(tab: ReportsWorkspaceTab): void {
    setReportsWorkspaceTab(tab);
    setReportsOpenTabs((current) => (current.includes(tab) ? current : [...current, tab]));
    setIsReportsMenuOpen(false);
    navigateTo("relatorios");
  }

  function closeReportsWorkspaceTab(tab: ReportsWorkspaceTab): void {
    setReportsOpenTabs((current) => {
      if (current.length <= 1) {
        return current;
      }

      const nextTabs = current.filter((item) => item !== tab);
      if (tab === reportsWorkspaceTab) {
        const fallbackTab = nextTabs[nextTabs.length - 1] ?? "overview";
        window.setTimeout(() => setReportsWorkspaceTab(fallbackTab), 0);
      }

      return nextTabs;
    });
  }

  function resolveReportsPaneFilters(tab: ReportsWorkspaceTab = reportsWorkspaceTab): ReportsPaneFilters {
    return reportsFiltersByTab[tab] ?? createDefaultReportsPaneFilters(clientReturnWindow);
  }

  function openReportsFilterModal(): void {
    setReportsFilterDraft(resolveReportsPaneFilters());
    setIsReportsFilterModalOpen(true);
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }

  function closeReportsFilterModal(): void {
    setIsReportsFilterModalOpen(false);
    setReportsFilterDraft(null);
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }

  function updateReportsFilterDraft(fieldId: string, value: string): void {
    setReportsFilterDraft((current) =>
      current
        ? ({
            ...current,
            [fieldId]: value
          } as ReportsPaneFilters)
        : current
    );
  }

  function applyReportsFilterDraft(): void {
    if (!reportsFilterDraft) {
      return;
    }

    setReportsFiltersByTab((current) => ({
      ...current,
      [reportsWorkspaceTab]: reportsFilterDraft
    }));
    setIsReportsFilterModalOpen(false);
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }

  function clearReportsFilters(): void {
    const cleared = createDefaultReportsPaneFilters(clientReturnWindow);
    setReportsFilterDraft(cleared);
    setReportsFiltersByTab((current) => ({
      ...current,
      [reportsWorkspaceTab]: cleared
    }));
    setIsReportsFilterModalOpen(false);
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }

  function openReportsLookup(fieldId: string): void {
    setReportsLookupFieldId(fieldId);
    setReportsLookupQuery("");
  }

  function closeReportsLookup(): void {
    setReportsLookupFieldId(null);
    setReportsLookupQuery("");
  }

  function selectReportsLookupValue(value: string): void {
    if (!reportsLookupFieldId) {
      return;
    }

    updateReportsFilterDraft(reportsLookupFieldId, value);
    closeReportsLookup();
  }

  function scrollProfessionalsWorkspaceIntoView(): void {
    if (typeof window === "undefined") {
      return;
    }

    window.setTimeout(() => {
      document
        .getElementById("professionals-workspace")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 40);
  }

  function openProfessionalProfileWorkspace(professionalId?: string): void {
    setIsCreatingProfessional(!professionalId);
    setSelectedProfessionalId(professionalId ?? "");
    setProfessionalWorkspaceMode("profile");

    if (!professionalId) {
      setProfessionalForm({
        nome: "",
        status: "active",
        especialidades: []
      });
      setAvailabilityDays(createDefaultAvailabilityDays());
    }

    scrollProfessionalsWorkspaceIntoView();
  }

  function selectServiceRecord(serviceId: string): void {
    setSelectedServiceId(serviceId);
    if (serviceWorkspaceMode === "new") {
      setServiceWorkspaceMode("browse");
    }
  }

  function openServiceWorkspace(mode: Exclude<ServiceWorkspaceMode, "browse">, serviceId?: string): void {
    if (mode === "new") {
      setSelectedServiceId("");
      setServiceForm(defaultServiceForm);
      setServiceWorkspaceMode("new");
      return;
    }

    const targetServiceId = serviceId ?? selectedServiceId;
    if (!targetServiceId) {
      return;
    }

    setSelectedServiceId(targetServiceId);
    setServiceWorkspaceMode(mode);
  }

  function closeServiceWorkspace(): void {
    setServiceWorkspaceMode("browse");
  }

  function openProfessionalAvailabilityWorkspace(professionalId: string): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(professionalId);
    setProfessionalWorkspaceMode("availability");
    scrollProfessionalsWorkspaceIntoView();
  }

  function openProfessionalAgenda(professionalId: string): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(professionalId);
    setAgendaWorkspaceTab("list");
    setAgendaViewMode("day");
    setAgendaProfessionalFilter(professionalId);
    navigateTo("agenda");
  }

  function handleRefreshClick(): void {
    void runAction(async () => {
      await refreshAdminState();
      setFeedback({ tone: "info", message: "Painel administrativo atualizado." });
    });
  }

  function handleAgendaDateShift(step: number): void {
    setAgendaDate((current) => {
      if (agendaWorkspaceTab === "calendar" && agendaViewMode === "week") {
        return addDaysToDateValue(current, step * 7);
      }

      if (agendaWorkspaceTab === "calendar" && agendaViewMode === "month") {
        return addMonthsToDateValue(current, step);
      }

      return addDaysToDateValue(current, step);
    });
  }

  function handleAgendaBookingSelection(booking: Booking): void {
    setSelectedAgendaBookingId(booking.id);
    setAgendaDate(extractDatePart(booking.startAt));
    setRescheduleDate(extractDatePart(booking.startAt));
    setSelectedAgendaSlotStartAt(booking.startAt);
  }

  function openAgendaBookingModal(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setIsAgendaBookingModalOpen(true);
  }

  function closeAgendaBookingModal(): void {
    setIsAgendaBookingModalOpen(false);
  }

  function handleOpenAgendaBooking(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setAgendaWorkspaceTab("list");
    setAgendaViewMode("day");
    navigateTo("agenda");
  }

  function renderClientRecords(entries: readonly ClientInsight[]): JSX.Element {
    if (!entries.length) {
      return <p className="empty-state">Nenhum cliente cadastrado ainda.</p>;
    }

    return (
      <>
        {entries.map((entry) => {
          const segment = resolveClientSegment(entry, clientReturnWindow);
          const isSelected = entry.client.id === selectedClientInsight?.client.id;
          return (
          <button
            className={`record-card client-record-button${isSelected ? " is-active" : ""}`}
            key={entry.client.id}
            onClick={() => setSelectedClientId(entry.client.id)}
            type="button"
          >
            <div className="client-record-topline">
              <div className="record-stack">
                <strong>{entry.client.nome}</strong>
                <span>{entry.client.email}</span>
              </div>
              <div className="client-record-kpi">
                <span>Receita derivada</span>
                <strong>{formatCurrency(entry.recognizedRevenue)}</strong>
              </div>
            </div>

            <div className="record-meta">
              <span className={`status-pill is-${resolveClientSegmentTone(segment)}`}>
                {formatClientSegment(segment, clientReturnWindow)}
              </span>
              <span className="status-pill is-neutral">{entry.totalBookings} booking(s)</span>
              <span className="status-pill is-info">Em aberto {entry.openBookings}</span>
              <span className="status-pill is-success">
                Concluidos {entry.completedBookings}
              </span>
            </div>

            <div className="client-record-meta-grid">
              <div className="client-record-meta-item">
                <span>Contato</span>
                <strong>{entry.client.telefone || "Sem telefone"}</strong>
              </div>
              <div className="client-record-meta-item">
                <span>Origem</span>
                <strong>{entry.client.origem}</strong>
              </div>
              <div className="client-record-meta-item">
                <span>Ultimo movimento</span>
                <strong>
                  {entry.lastBooking ? formatDateTime(entry.lastBooking.startAt) : "Sem booking"}
                </strong>
              </div>
              <div className="client-record-meta-item">
                <span>Retorno</span>
                <strong>
                  {entry.lastCompletedBooking
                    ? `Sem retorno ha ${formatDaysSince(entry.lastCompletedBooking.endAt)}`
                    : "Nunca concluiu"}
                </strong>
              </div>
              <div className="client-record-meta-item">
                <span>Ultimo concluido</span>
                <strong>
                  {entry.lastCompletedBooking
                    ? formatDateTime(entry.lastCompletedBooking.endAt)
                    : "Nao houve"}
                </strong>
              </div>
              <div className="client-record-meta-item">
                <span>Movimentos</span>
                <strong>{entry.cashEntriesCount}</strong>
              </div>
            </div>

            <div className="record-meta client-record-emphasis">
              <span>Base formada pela agenda</span>
              {entry.lastCashEntry ? (
                <span>
                  Ultimo movimento financeiro {formatDateTime(entry.lastCashEntry.occurredAt)}
                </span>
              ) : (
                <span>Nenhum movimento financeiro visivel</span>
              )}
            </div>
          </button>
        )})}
      </>
    );
  }

  function renderSlugPanel(): JSX.Element {
    return (
      <EntitySection
        title="Publicacao e slug"
        description="Manutencao do perfil publico do negocio e da URL que aponta para o booking real."
        actions={<ViewBadge tone="success">Funcional</ViewBadge>}
      >
        <form className="stack-form" onSubmit={handleSaveSlug}>
          <div className="form-grid">
            <label className="field">
              <span>Nome</span>
              <input disabled type="text" value={tenant?.nome ?? ""} />
            </label>
            <label className="field">
              <span>Status</span>
              <input disabled type="text" value={tenant?.status ?? ""} />
            </label>
            <label className="field">
              <span>Timezone</span>
              <input disabled type="text" value={tenant?.timezone ?? ""} />
            </label>
            <label className="field">
              <span>Slug</span>
              <input
                required
                type="text"
                value={slug}
                onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
              />
            </label>
            <label className="field field-wide">
              <span>URL publica</span>
              <input disabled type="text" value={publicBookingUrl} />
            </label>
          </div>

          <div className="button-row">
            <button className="primary-button" disabled={isBusy} type="submit">
              Salvar slug
            </button>
            {publicBookingUrl ? (
              <a className="secondary-button button-link" href={publicBookingUrl} rel="noreferrer" target="_blank">
                Abrir booking publico
              </a>
            ) : (
              <span className="helper-chip">Sem slug publicada</span>
            )}
          </div>
        </form>
      </EntitySection>
    );
  }

  function renderBrandingPanel(): JSX.Element {
    const accentColor = normalizeAccentColor(brandingForm.accentColor);
    const previewStyle = buildBrandingPreviewStyle(accentColor);
    const previewTagline =
      brandingForm.tagline.trim() || "Agendamentos rapidos, claros e prontos para o celular.";

    return (
      <EntitySection
        title="Branding minimo"
        description="Ajustes leves de identidade visual do tenant sem reabrir um fluxo grande de implantacao."
        actions={<ViewBadge tone="warning">Parcial</ViewBadge>}
      >
        <form className="stack-form" onSubmit={handleSaveBranding}>
          <div className="form-grid">
            <label className="field field-wide">
              <span>Mensagem curta da marca</span>
              <input
                maxLength={90}
                onChange={(event) =>
                  setBrandingForm({
                    ...brandingForm,
                    tagline: event.target.value
                  })
                }
                placeholder="Ex.: Cortes e cuidados com horario marcado."
                type="text"
                value={brandingForm.tagline}
              />
            </label>
            <label className="field">
              <span>Cor de destaque</span>
              <input
                onChange={(event) =>
                  setBrandingForm({
                    ...brandingForm,
                    accentColor: event.target.value.toUpperCase()
                  })
                }
                placeholder="#0B7A75"
                type="text"
                value={brandingForm.accentColor}
              />
            </label>
          </div>

          <div className="branding-preview" style={previewStyle}>
            <div
              className="branding-preview-badge"
              style={accentColor ? { background: accentColor } : undefined}
            >
              {(tenant?.nome ?? "AG").slice(0, 2).toUpperCase()}
            </div>
            <div className="branding-preview-copy">
              <strong>{tenant?.nome ?? "Seu negocio"}</strong>
              <p>{previewTagline}</p>
              <span>{publicBookingUrl || "Publique uma slug para visualizar o link."}</span>
            </div>
          </div>

          <div className="button-row">
            <button className="primary-button" disabled={isBusy} type="submit">
              Salvar branding
            </button>
          </div>
        </form>
      </EntitySection>
    );
  }

  function renderPaymentsPanel(): JSX.Element {
    return (
      <EntitySection
        title="Pagamentos e Checkout Pro"
        description="Configuracao do Mercado Pago por tenant, com credenciais, callbacks e comportamento de checkout."
        actions={<ViewBadge tone="info">Checkout Pro recomendado</ViewBadge>}
      >
        <form className="stack-form" onSubmit={handleSavePayments}>
          <div className="form-grid">
            <label className="field">
              <span>Status</span>
              <select
                value={paymentForm.status}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    status: event.target.value as PaymentProviderStatus
                  })
                }
              >
                {paymentProviderStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Checkout</span>
              <select
                value={paymentForm.checkoutMode}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    checkoutMode: event.target.value as PaymentCheckoutMode
                  })
                }
              >
                {paymentCheckoutModeValues.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Public key</span>
              <input
                type="text"
                value={paymentForm.publicKey}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, publicKey: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Access token</span>
              <input
                type="password"
                value={paymentForm.accessToken}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, accessToken: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Collector ID</span>
              <input
                type="text"
                value={paymentForm.collectorId}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, collectorId: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Statement descriptor</span>
              <input
                type="text"
                value={paymentForm.statementDescriptor}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    statementDescriptor: event.target.value
                  })
                }
              />
            </label>
            <label className="field field-wide">
              <span>Notification URL</span>
              <input
                type="url"
                value={paymentForm.notificationUrl}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    notificationUrl: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Back success</span>
              <input
                type="url"
                value={paymentForm.backSuccess}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, backSuccess: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Back pending</span>
              <input
                type="url"
                value={paymentForm.backPending}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, backPending: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Back failure</span>
              <input
                type="url"
                value={paymentForm.backFailure}
                onChange={(event) =>
                  setPaymentForm({ ...paymentForm, backFailure: event.target.value })
                }
              />
            </label>
            <label className="field">
              <span>Parcelas</span>
              <input
                min="1"
                type="number"
                value={paymentForm.defaultInstallments}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    defaultInstallments: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Expiracao</span>
              <input
                min="1"
                type="number"
                value={paymentForm.expirationMinutes}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    expirationMinutes: event.target.value
                  })
                }
              />
            </label>
          </div>

          <label className="toggle-field">
            <input
              checked={paymentForm.binaryMode}
              type="checkbox"
              onChange={(event) =>
                setPaymentForm({ ...paymentForm, binaryMode: event.target.checked })
              }
            />
            <span>Ativar `binary_mode`</span>
          </label>

          <button className="primary-button" disabled={isBusy} type="submit">
            Salvar provider
          </button>
        </form>
      </EntitySection>
    );
  }

  function renderCatalogPanel(): JSX.Element {
    const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
    const isViewingService = serviceWorkspaceMode === "view" && Boolean(selectedService);
    const isEditingService = serviceWorkspaceMode === "edit" && Boolean(selectedService);
    const isCreatingService = serviceWorkspaceMode === "new";
    const canOpenSelectedService = Boolean(selectedService);

    return (
      <>
        <EntitySection
          title="Servicos"
          actions={
            <div className="entity-record-actions">
              <button
                className="secondary-button"
                onClick={() => openServiceWorkspace("new")}
                type="button"
              >
                Novo
              </button>
              <button
                className="secondary-button"
                disabled={!canOpenSelectedService}
                onClick={() => openServiceWorkspace("view")}
                type="button"
              >
                Visualizar
              </button>
              <button
                className="primary-button"
                disabled={!canOpenSelectedService}
                onClick={() => openServiceWorkspace("edit")}
                type="button"
              >
                Editar
              </button>
            </div>
          }
        >
          {services.length ? (
            <div className="entity-record-list" role="list">
              {services.map((service, index) => {
                const collectionLabel =
                  service.paymentPolicy.collectionMode === "none" ? "Reserva imediata" : service.paymentPolicy.collectionMode;

                return (
                  <button
                    aria-pressed={service.id === selectedServiceId}
                    className={service.id === selectedServiceId ? "entity-record-row is-selected" : "entity-record-row"}
                    key={service.id}
                    onClick={() => selectServiceRecord(service.id)}
                    type="button"
                  >
                    <span className="entity-record-row-index">{String(index + 1).padStart(2, "0")}</span>
                    <div className="entity-record-row-main">
                      <strong>{service.nome}</strong>
                      <span>{service.duracaoMin} min</span>
                    </div>
                    <div className="entity-record-row-meta">
                      <span>{formatCurrency(service.precoBase)}</span>
                      <span>{collectionLabel}</span>
                      <span className={`status-pill is-${service.status === "active" ? "success" : "warning"}`}>
                        {service.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">Nenhum servico cadastrado ainda.</p>
          )}
        </EntitySection>

        {isViewingService && selectedService ? (
          <EntitySection
            title={`Visualizar ${selectedService.nome}`}
            actions={
              <div className="button-row">
                <button className="secondary-button" onClick={() => closeServiceWorkspace()} type="button">
                  Fechar
                </button>
                <button className="primary-button" onClick={() => openServiceWorkspace("edit")} type="button">
                  Editar
                </button>
              </div>
            }
          >
            <div className="catalog-record-preview-grid">
              <div className="dashboard-mini-card">
                <strong>Status</strong>
                <span>{selectedService.status}</span>
              </div>
              <div className="dashboard-mini-card">
                <strong>Duracao</strong>
                <span>{formatMinutesAsHours(selectedService.duracaoMin)}</span>
              </div>
              <div className="dashboard-mini-card">
                <strong>Preco base</strong>
                <span>{formatCurrency(selectedService.precoBase)}</span>
              </div>
              <div className="dashboard-mini-card">
                <strong>Cobranca</strong>
                <span>
                  {selectedService.paymentPolicy.collectionMode === "none"
                    ? "Reserva imediata"
                    : selectedService.paymentPolicy.collectionMode}
                </span>
              </div>
              <div className="dashboard-mini-card">
                <strong>Checkout</strong>
                <span>{selectedService.paymentPolicy.checkoutMode}</span>
              </div>
              <div className="dashboard-mini-card">
                <strong>Meios aceitos</strong>
                <span>{selectedService.paymentPolicy.acceptedMethods.join(" | ") || "Nao definidos"}</span>
              </div>
            </div>
          </EntitySection>
        ) : null}

        {(isEditingService || isCreatingService) ? (
          <EntitySection
            title={isCreatingService ? "Novo servico" : `Editar ${selectedService?.nome ?? "servico"}`}
            actions={
              <div className="button-row">
                {!isCreatingService && selectedService ? (
                  <button
                    className="secondary-button"
                    onClick={() => openServiceWorkspace("view")}
                    type="button"
                  >
                    Visualizar
                  </button>
                ) : null}
                <button className="secondary-button" onClick={() => closeServiceWorkspace()} type="button">
                  Voltar para a lista
                </button>
              </div>
            }
          >
            <form className="stack-form" onSubmit={handleSaveService}>
              <div className="form-grid">
                <label className="field">
                  <span>Nome</span>
                  <input
                    required
                    type="text"
                    value={serviceForm.nome}
                    onChange={(event) => setServiceForm({ ...serviceForm, nome: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Duracao</span>
                  <input
                    required
                    min="1"
                    type="number"
                    value={serviceForm.duracaoMin}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, duracaoMin: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Preco</span>
                  <input
                    required
                    min="0"
                    step="0.01"
                    type="number"
                    value={serviceForm.precoBase}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, precoBase: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <input
                    required
                    type="text"
                    value={serviceForm.status}
                    onChange={(event) =>
                      setServiceForm({ ...serviceForm, status: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Cobranca</span>
                  <select
                    value={serviceForm.collectionMode}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        collectionMode: event.target.value as PaymentCollectionMode
                      })
                    }
                  >
                    {paymentCollectionModeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Checkout</span>
                  <select
                    disabled={serviceForm.collectionMode === "none"}
                    value={serviceForm.checkoutMode}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        checkoutMode: event.target.value as PaymentCheckoutMode
                      })
                    }
                  >
                    {paymentCheckoutModeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select
                    disabled={serviceForm.collectionMode === "none"}
                    value={serviceForm.chargeType}
                    onChange={(event) =>
                      setServiceForm({
                        ...serviceForm,
                        chargeType: event.target.value as PaymentChargeType
                      })
                    }
                  >
                    {paymentChargeTypeValues.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </label>
                {serviceForm.chargeType === "fixed" ? (
                  <label className="field">
                    <span>Valor</span>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={serviceForm.fixedAmount}
                      onChange={(event) =>
                        setServiceForm({ ...serviceForm, fixedAmount: event.target.value })
                      }
                    />
                  </label>
                ) : (
                  <label className="field">
                    <span>Percentual</span>
                    <input
                      max="100"
                      min="1"
                      type="number"
                      value={serviceForm.percentage}
                      onChange={(event) =>
                        setServiceForm({ ...serviceForm, percentage: event.target.value })
                      }
                    />
                  </label>
                )}
              </div>

              <fieldset className="checkbox-group">
                <legend>Meios aceitos</legend>
                {paymentMethodValues.map((method) => (
                  <label className="check-item" key={method}>
                    <input
                      checked={serviceForm.acceptedMethods.includes(method)}
                      type="checkbox"
                      onChange={() =>
                        setServiceForm({
                          ...serviceForm,
                          acceptedMethods: toggleArrayValue(serviceForm.acceptedMethods, method)
                        })
                      }
                    />
                    <span>{method}</span>
                  </label>
                ))}
              </fieldset>

              <div className="catalog-form-footer">
                <div className="button-row">
                  <button className="primary-button" disabled={isBusy} type="submit">
                    {selectedServiceId ? "Salvar servico" : "Criar servico"}
                  </button>
                  {selectedServiceId ? (
                    <button
                      className="secondary-button is-danger"
                      disabled={isBusy}
                      onClick={() => void handleDeleteSelectedService()}
                      type="button"
                    >
                      Excluir servico
                    </button>
                  ) : null}
                </div>
              </div>
            </form>
          </EntitySection>
        ) : null}
      </>
    );
  }

  function renderProfessionalProfileWorkspace(): JSX.Element {
    const selectedProfessional = professionals.find((professional) => professional.id === selectedProfessionalId);
    const linkedServiceNames = selectedProfessional ?
        resolveProfessionalServiceNames(selectedProfessional, services)
      : professionalForm.especialidades
          .map((serviceId) => services.find((service) => service.id === serviceId)?.nome)
          .filter((value): value is string => Boolean(value));
    const availabilitySummary = selectedProfessionalId ?
      resolveAvailabilitySummary(weeklyAvailabilityByProfessional[selectedProfessionalId] ?? [])
    : "Sem horarios configurados";
    const formId = "professional-profile-form";
    const linkedServicesLabel = linkedServiceNames.length ?
      linkedServiceNames.join(" | ")
    : "Sem especialidades vinculadas ainda.";
    const linkedServicesPreview = linkedServiceNames.length ?
      linkedServiceNames.slice(0, 2).join(" | ")
    : "Sem especialidades ainda";

    return (
      <EntityViewLayout
        className="professional-entity-view"
        eyebrow="Equipe"
        title={isCreatingProfessional ? "Novo profissional" : selectedProfessional?.nome ?? "Editar profissional"}
        subtitle={
          isCreatingProfessional ?
            "Cadastre o profissional e vincule os servicos que ele pode atender."
          : "Entity view do profissional com identidade, servicos vinculados e atalhos para agenda e disponibilidade."
        }
        statusBadge={
          selectedProfessional && !isCreatingProfessional ? (
            <ViewBadge tone={resolveProfessionalStatusTone(selectedProfessional.status) as "success" | "warning" | "neutral"}>
              {formatProfessionalStatus(selectedProfessional.status)}
            </ViewBadge>
          ) : (
            <ViewBadge tone="info">Novo cadastro</ViewBadge>
          )
        }
        pageActions={
          !isCreatingProfessional && selectedProfessionalId ? (
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                type="button"
              >
                Ver agenda
              </button>
              <button
                className="secondary-button"
                onClick={() => openProfessionalAvailabilityWorkspace(selectedProfessionalId)}
                type="button"
              >
                Horarios
              </button>
            </div>
          ) : undefined
        }
        identityCard={
          <EntityIdentityCard
            title="Identidade operacional"
            description="Bloco base da entidade profissional conectado aos contratos reais do admin."
            fields={[
              {
                id: "professional-name",
                label: "Nome",
                value: professionalForm.nome || selectedProfessional?.nome || "Novo profissional"
              },
              {
                id: "professional-status",
                label: "Status",
                value: selectedProfessional && !isCreatingProfessional ?
                    formatProfessionalStatus(selectedProfessional.status)
                  : "Ativo ao criar"
              },
              {
                id: "professional-services",
                label: "Servicos",
                value: `${linkedServiceNames.length} vinculado(s)`
              },
              {
                id: "professional-availability",
                label: "Disponibilidade",
                value: availabilitySummary
              }
            ]}
          />
        }
        sections={
          <form className="professional-editor-form" id={formId} onSubmit={handleSaveProfessional}>
            <EntitySection
              title="Cadastro base"
              description="Nome e status da entidade sem sair da tela de equipe."
            >
              <div className="professional-editor-grid">
                <label className="field">
                  <span>Nome</span>
                  <input
                    required
                    type="text"
                    value={professionalForm.nome}
                    onChange={(event) =>
                      setProfessionalForm({ ...professionalForm, nome: event.target.value })
                    }
                  />
                </label>

                {isCreatingProfessional ? (
                  <div className="professional-editor-note">
                    <strong>Status inicial</strong>
                    <p>Novos profissionais entram como ativos e podem ter o status ajustado depois.</p>
                  </div>
                ) : (
                  <label className="field">
                    <span>Status</span>
                    <input
                      required
                      type="text"
                      value={professionalForm.status}
                      onChange={(event) =>
                        setProfessionalForm({ ...professionalForm, status: event.target.value })
                      }
                    />
                  </label>
                )}
              </div>
            </EntitySection>

            <EntitySection
              title="Servicos vinculados"
              description="Vincule apenas os servicos que este profissional realmente pode atender."
            >
              <fieldset className="professional-services-fieldset">
                <legend>Servicos vinculados</legend>
                {services.length ? (
                  <div className="professional-services-grid">
                    {services.map((service) => (
                      <label className="professional-service-option" key={service.id}>
                        <input
                          checked={professionalForm.especialidades.includes(service.id)}
                          type="checkbox"
                          onChange={() =>
                            setProfessionalForm({
                              ...professionalForm,
                              especialidades: toggleArrayValue(
                                professionalForm.especialidades,
                                service.id
                              )
                            })
                          }
                        />
                        <div>
                          <strong>{service.nome}</strong>
                          <span>
                            {formatMinutesAsHours(service.duracaoMin)} | {formatCurrency(service.precoBase)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="helper">Cadastre servicos no catalogo antes de montar a equipe.</p>
                )}
              </fieldset>
            </EntitySection>
          </form>
        }
        aside={
          <EntityAsideSummary
            title="Resumo lateral"
            description="Atalhos e leitura lateral do profissional dentro da equipe."
            items={[
              {
                id: "professional-aside-services",
                label: "Especialidades ativas",
                value: `${linkedServiceNames.length}`,
                description: linkedServicesLabel,
                active: true
              },
              {
                id: "professional-aside-availability",
                label: "Disponibilidade semanal",
                value: availabilitySummary,
                description: "A janela semanal alimenta slots publicos e agenda interna.",
                action: !isCreatingProfessional && selectedProfessionalId ? (
                  <button
                    className="secondary-button"
                    onClick={() => openProfessionalAvailabilityWorkspace(selectedProfessionalId)}
                    type="button"
                  >
                    Editar horarios
                  </button>
                ) : undefined
              },
              {
                id: "professional-aside-agenda",
                label: "Agenda filtrada",
                description: "Abre a agenda administrativa ja filtrada para este profissional.",
                action: !isCreatingProfessional && selectedProfessionalId ? (
                  <button
                    className="secondary-button"
                    onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                    type="button"
                  >
                    Ver agenda
                  </button>
                ) : undefined
              }
            ]}
          />
        }
        footerActions={
          <div className="professional-editor-footer">
            <div className="professional-editor-summary">
              <span>{linkedServiceNames.length} servico(s) vinculado(s)</span>
              <span>{linkedServicesPreview}</span>
            </div>
            <div className="button-row">
              {!isCreatingProfessional && selectedProfessionalId ? (
                <button
                  className="secondary-button"
                  onClick={() => openProfessionalAvailabilityWorkspace(selectedProfessionalId)}
                  type="button"
                >
                  Horarios
                </button>
              ) : null}
              <button className="primary-button" disabled={isBusy} form={formId} type="submit">
                {isCreatingProfessional ? "Criar profissional" : "Salvar profissional"}
              </button>
            </div>
          </div>
        }
      />
    );

  }

  function renderProfessionalAvailabilityWorkspace(): JSX.Element {
    const selectedProfessional = professionals.find((professional) => professional.id === selectedProfessionalId);
    const availabilitySummary = resolveAvailabilitySummary(weeklyAvailabilityByProfessional[selectedProfessionalId] ?? []);
    const linkedServiceNames = selectedProfessional ?
      resolveProfessionalServiceNames(selectedProfessional, services)
    : [];
    const formId = "professional-availability-form";
    const linkedServicesLabel = linkedServiceNames.length ?
      linkedServiceNames.join(" | ")
    : "Sem servicos vinculados";

    return (
      <EntityViewLayout
        className="professional-entity-view"
        eyebrow="Disponibilidade"
        title={selectedProfessional ? `Horarios de ${selectedProfessional.nome}` : "Agenda semanal"}
        subtitle="Configure a janela semanal que alimenta slots, booking publico e agenda interna."
        statusBadge={<ViewBadge tone="info">{availabilitySummary}</ViewBadge>}
        pageActions={
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => setProfessionalWorkspaceMode("profile")}
              type="button"
            >
              Voltar ao cadastro
            </button>
            {selectedProfessionalId ? (
              <button
                className="secondary-button"
                onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                type="button"
              >
                Ver agenda
              </button>
            ) : null}
          </div>
        }
        identityCard={
          <EntityIdentityCard
            title="Identidade da disponibilidade"
            description="Leitura base da entidade antes de editar a disponibilidade semanal."
            fields={[
              {
                id: "availability-professional-name",
                label: "Profissional",
                value: selectedProfessional?.nome ?? "Nao selecionado"
              },
              {
                id: "availability-professional-status",
                label: "Status",
                value: selectedProfessional ? formatProfessionalStatus(selectedProfessional.status) : "Nao definido"
              },
              {
                id: "availability-services",
                label: "Servicos",
                value: linkedServicesLabel
              },
              {
                id: "availability-summary",
                label: "Janela atual",
                value: availabilitySummary
              }
            ]}
          />
        }
        sections={
          <form className="professional-availability-form" id={formId} onSubmit={handleSaveAvailability}>
            <EntitySection
              title="Janela semanal"
              description="Cada linha altera a disponibilidade semanal persistida para o profissional selecionado."
            >
              <div className="professional-availability-grid">
                {availabilityDays.map((day) => (
                  <div className="professional-availability-row" key={day.weekday}>
                    <label className="professional-availability-day">
                      <input
                        checked={day.enabled}
                        type="checkbox"
                        onChange={(event) =>
                          setAvailabilityDays((current) =>
                            current.map((item) =>
                              item.weekday === day.weekday
                                ? { ...item, enabled: event.target.checked }
                                : item
                            )
                          )
                        }
                      />
                      <span>{weekdayLabels[day.weekday]}</span>
                    </label>

                    <input
                      disabled={!day.enabled}
                      type="time"
                      value={day.startTime}
                      onChange={(event) =>
                        setAvailabilityDays((current) =>
                          current.map((item) =>
                            item.weekday === day.weekday
                              ? { ...item, startTime: event.target.value }
                              : item
                          )
                        )
                      }
                    />

                    <input
                      disabled={!day.enabled}
                      type="time"
                      value={day.endTime}
                      onChange={(event) =>
                        setAvailabilityDays((current) =>
                          current.map((item) =>
                            item.weekday === day.weekday
                              ? { ...item, endTime: event.target.value }
                              : item
                          )
                        )
                      }
                    />
                  </div>
                ))}
              </div>
            </EntitySection>
          </form>
        }
        aside={
          <EntityAsideSummary
            title="Resumo lateral"
            description="Contexto rapido da agenda derivada desta janela semanal."
            items={[
              {
                id: "availability-aside-summary",
                label: "Resumo semanal",
                value: availabilitySummary,
                description: "Esse resumo e recalculado a partir das regras reais persistidas.",
                active: true
              },
              {
                id: "availability-aside-limitations",
                label: "Limites do corte",
                description: "Calendario de excecoes por data e bloqueios pontuais continuam fora desta fase."
              },
              {
                id: "availability-aside-agenda",
                label: "Agenda do profissional",
                description: "Use a agenda filtrada para validar o impacto operacional das regras atuais.",
                action: selectedProfessionalId ? (
                  <button
                    className="secondary-button"
                    onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                    type="button"
                  >
                    Abrir agenda
                  </button>
                ) : undefined
              }
            ]}
          />
        }
        footerActions={
          <div className="professional-editor-footer">
            <div className="professional-editor-summary">
              <span>Base semanal real do profissional selecionado</span>
              <span>Sem calendario de excecoes por data neste corte.</span>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setProfessionalWorkspaceMode("profile")}
                type="button"
              >
                Voltar ao cadastro
              </button>
              <button
                className="primary-button"
                disabled={isBusy || !selectedProfessionalId}
                form={formId}
                type="submit"
              >
                Salvar horarios
              </button>
            </div>
          </div>
        }
      />
    );

  }

  function renderProfessionalsPanel(): JSX.Element {
    const selectedCardProfessionalId =
      professionalWorkspaceMode === "overview" || isCreatingProfessional ? "" : selectedProfessionalId;

    return (
      <section className="professionals-view">
        <div className="professionals-header">
          <div>
            <h2>Equipe de Profissionais</h2>
          </div>
          <button
            className="admin-primary-action"
            onClick={() => openProfessionalProfileWorkspace()}
            type="button"
          >
            <Plus className="w-4 h-4" />
            Novo Profissional
          </button>
        </div>

        {professionals.length ? (
          <div className="professionals-card-grid">
            {professionals.map((professional, index) => {
              const linkedServiceNames = resolveProfessionalServiceNames(professional, services);
              const professionalStatusTone = resolveProfessionalStatusTone(professional.status);
              const professionalStatusLabel = formatProfessionalStatus(professional.status).toUpperCase();
              const avatarVariant = professionalAvatarVariants[index % professionalAvatarVariants.length];
              const isActiveCard = professional.id === selectedCardProfessionalId;

              return (
                <article
                  className={isActiveCard ? "professional-card is-active" : "professional-card"}
                  key={professional.id}
                >
                  <div className="professional-card-status">
                    <span className={`professional-status-chip is-${professionalStatusTone}`}>
                      {professionalStatusLabel}
                    </span>
                  </div>

                  <button
                    className="professional-card-main"
                    onClick={() => openProfessionalProfileWorkspace(professional.id)}
                    type="button"
                  >
                    <div className={`professional-avatar ${avatarVariant}`}>
                      {resolveProfessionalInitials(professional.nome)}
                    </div>
                    <div className="professional-card-copy">
                      <h3>{professional.nome}</h3>
                      <p>{resolveProfessionalSummaryLine(linkedServiceNames)}</p>
                    </div>
                  </button>

                  <div className="professional-card-actions">
                    <button
                      className="professional-card-action"
                      onClick={() => openProfessionalAgenda(professional.id)}
                      type="button"
                    >
                      <CalendarIcon className="w-5 h-5" />
                      <span>Ver Agenda</span>
                    </button>
                    <button
                      className="professional-card-action"
                      onClick={() => openProfessionalAvailabilityWorkspace(professional.id)}
                      type="button"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Horarios</span>
                    </button>
                    <button
                      className="professional-card-action"
                      onClick={() => openProfessionalProfileWorkspace(professional.id)}
                      type="button"
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>Servicos</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <article className="professional-empty-state">
            <div>
              <h3>Nenhum profissional cadastrado</h3>
              <p>Crie o primeiro perfil da equipe para liberar agenda, horarios e vinculo com servicos.</p>
            </div>
            <button className="admin-primary-action" onClick={() => openProfessionalProfileWorkspace()} type="button">
              <Plus className="w-4 h-4" />
              Criar primeiro profissional
            </button>
          </article>
        )}

        {professionalWorkspaceMode === "profile" ? renderProfessionalProfileWorkspace() : null}
        {professionalWorkspaceMode === "availability" && selectedProfessionalId ?
          renderProfessionalAvailabilityWorkspace()
        : null}
      </section>
    );
  }

  function renderOperationalView(): JSX.Element {
    const isTodayView = agendaDate === formatDateInputValue(new Date());
    const pendingDayBookings = filteredDayAgendaBookings.filter((booking) => isPendingBookingStatus(booking.status));
    const confirmedDayBookings = filteredDayAgendaBookings.filter((booking) => booking.status === "confirmado");
    const completedDayBookings = filteredDayAgendaBookings.filter((booking) => booking.status === "concluido");
    const noShowDayBookings = filteredDayAgendaBookings.filter((booking) => booking.status === "faltou");
    const openDayBookings = filteredDayAgendaBookings.filter((booking) => isOpenBookingStatus(booking.status));
    const dayProjectedRevenue = filteredDayAgendaBookings.reduce(
      (total, booking) => total + (services.find((service) => service.id === booking.serviceId)?.precoBase ?? 0),
      0
    );
    const dayRecognizedRevenue = completedDayBookings.reduce(
      (total, booking) => total + resolveRecognizedRevenueAmount(booking, services, cashEntries),
      0
    );
    const dayApprovedOnlineRevenue = completedDayBookings.reduce((total, booking) => {
      const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
      return total + resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries);
    }, 0);
    const nextOperationalBooking = openDayBookings[0] ?? filteredDayAgendaBookings[0];
    const operationalFilterLabel =
      agendaProfessionalFilter === "all"
        ? "Equipe inteira"
        : resolveProfessionalName(agendaProfessionalFilter, professionals);
    const operationalTabs: ReadonlyArray<{
      readonly id: OperationalWorkspaceTab;
      readonly label: string;
      readonly icon: LucideIcon;
      readonly count: number;
    }> = [
      { id: "overview", label: "Resumo do dia", icon: ListTodo, count: filteredDayAgendaBookings.length },
      { id: "pending", label: "Pendencias", icon: AlertCircle, count: pendingDayBookings.length },
      { id: "confirmed", label: "Confirmados", icon: CheckCircle, count: confirmedDayBookings.length },
      { id: "completed", label: "Concluidos", icon: Check, count: completedDayBookings.length },
      { id: "noshow", label: "No-show", icon: XCircle, count: noShowDayBookings.length }
    ];

    const renderOperationalStatusBadge = (booking: Booking): JSX.Element => {
      if (booking.status === "concluido") {
        return (
          <span className="status-pill is-success">
            <Check className="w-3 h-3" />
            Concluido
          </span>
        );
      }
      if (booking.status === "faltou") {
        return (
          <span className="status-pill is-danger">
            <XCircle className="w-3 h-3" />
            No-show
          </span>
        );
      }
      if (booking.status === "confirmado") {
        return (
          <span className="status-pill is-info">
            <CheckCircle className="w-3 h-3" />
            Confirmado
          </span>
        );
      }
      return (
        <span className="status-pill is-warning">
          <Clock className="w-3 h-3" />
          {formatBookingStatus(booking.status)}
        </span>
      );
    };

    const renderOperationalRecords = (
      bookingsForTab: readonly Booking[],
      emptyMessage: string
    ): JSX.Element => {
      if (!bookingsForTab.length) {
        return <p className="empty-state">{emptyMessage}</p>;
      }

      return (
        <div className="records-column operational-records">
          {bookingsForTab.map((booking) => {
            const service = services.find((item) => item.id === booking.serviceId);
            const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
            const actions = resolveBookingActions(booking);
            const canSyncPayment = paymentIntent !== undefined && paymentIntent.status !== "approved";
            const projectedAmount = service?.precoBase ?? 0;
            const recognizedAmount =
              booking.status === "concluido"
                ? resolveRecognizedRevenueAmount(booking, services, cashEntries)
                : 0;
            const paymentStatusLabel = paymentIntent
              ? `Pagamento ${formatPaymentIntentStatus(paymentIntent.status)}`
              : "Sem payment intent";

            return (
              <article
                className={[
                  "record-card",
                  "operational-record-card",
                  booking.status === "concluido" ? "is-muted" : "",
                  booking.status === "faltou" ? "is-danger" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={booking.id}
              >
                <div className="record-card-header operational-record-heading">
                  <div className="record-stack operational-record-copy">
                    <strong>{resolveClientName(booking.clientId, clients)}</strong>
                    <span>
                      {resolveServiceName(booking.serviceId, services)}  |  Prof.{" "}
                      {resolveProfessionalName(booking.professionalId, professionals)}
                    </span>
                  </div>
                  <div className="operational-record-badges">
                    <span className="status-pill is-neutral">{formatTimeRange(booking.startAt, booking.endAt)}</span>
                    {renderOperationalStatusBadge(booking)}
                    {paymentIntent && isApprovedPaymentIntent(paymentIntent.status) ? (
                      <span className="status-pill is-success">
                        <CreditCard className="w-3 h-3" />
                        Pago antecipado
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="record-meta operational-record-meta">
                  <span>{resolveClientPhone(booking.clientId, clients)}</span>
                  <span>{paymentStatusLabel}</span>
                  <span>
                    {booking.status === "concluido"
                      ? `Receita ${formatCurrency(recognizedAmount || projectedAmount)}`
                      : `Previsto ${formatCurrency(projectedAmount)}`}
                  </span>
                </div>

                <div className="button-row operational-record-actions">
                  {actions.map((action) => (
                    <button
                      className={resolveActionButtonClassName(action.tone)}
                      disabled={isBusy}
                      key={action.label}
                      onClick={() => void handleBookingStatusAction(booking.id, action.nextStatus)}
                      type="button"
                    >
                      {action.nextStatus === "concluido" ? <Check className="w-4 h-4" /> : null}
                      {action.nextStatus === "confirmado" ? <CheckCircle className="w-4 h-4" /> : null}
                      {action.nextStatus === "faltou" ? <XCircle className="w-4 h-4" /> : null}
                      {action.label}
                    </button>
                  ))}
                  {canRescheduleBooking(booking) ? (
                    <button className="secondary-button" onClick={() => handleOpenAgendaBooking(booking)} type="button">
                      <CalendarIcon className="w-4 h-4" />
                      Reagendar
                    </button>
                  ) : null}
                  {paymentIntent && canSyncPayment ? (
                    <button className="secondary-button" onClick={() => void handlePaymentSync(paymentIntent)} type="button">
                      <CreditCard className="w-4 h-4" />
                      Atualizar pagamento
                    </button>
                  ) : null}
                  <button className="secondary-button" onClick={() => handleOpenAgendaBooking(booking)} type="button">
                    <CalendarDays className="w-4 h-4" />
                    Abrir agenda
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      );
    };

    return (
      <DocumentViewLayout
        className="operational-document-view"
        eyebrow="Rotina do dia"
        title={isTodayView ? "Operacao de hoje" : formatAgendaDayLabel(agendaDate)}
        subtitle="Pendencias, confirmacoes e encerramentos do dia organizados por visao, sem misturar toda a fila em uma unica superficie."
        statusBadge={<ViewBadge tone={isTodayView ? "success" : "info"}>{operationalFilterLabel}</ViewBadge>}
        pageActions={
          <div className="operational-document-actions">
            <div className="operational-day-switch">
              <button className="secondary-button" onClick={() => handleAgendaDateShift(-1)} type="button">
                Ontem
              </button>
              <button
                className={isTodayView ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
                type="button"
              >
                Hoje
              </button>
              <button className="secondary-button" onClick={() => handleAgendaDateShift(1)} type="button">
                Amanha
              </button>
            </div>

            <label className="dashboard-select">
              <span>Profissional</span>
              <select
                onChange={(event) => setAgendaProfessionalFilter(event.target.value)}
                value={agendaProfessionalFilter}
              >
                <option value="all">Equipe inteira</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
            </label>

            <button className="secondary-button" disabled={isBusy} onClick={handleRefreshClick} type="button">
              Atualizar
            </button>
            <button className="secondary-button" onClick={() => navigateTo("agenda")} type="button">
              Abrir agenda
            </button>
          </div>
        }
        header={
          <DocumentHeader
            fields={[
              {
                id: "date",
                label: "Data",
                value: formatAgendaDayLabel(agendaDate)
              },
              {
                id: "team",
                label: "Equipe",
                value: operationalFilterLabel
              },
              {
                id: "next-action",
                label: "Proxima acao",
                value:
                  nextOperationalBooking
                    ? `${formatTimeRange(nextOperationalBooking.startAt, nextOperationalBooking.endAt)} · ${resolveClientName(nextOperationalBooking.clientId, clients)}`
                    : "Sem fila em aberto"
              },
              {
                id: "open",
                label: "Em aberto",
                value: `${agendaDaySummary.open} booking(s)`
              }
            ]}
          />
        }
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "total",
                label: "Agendados",
                value: filteredDayAgendaBookings.length,
                helper: "Total do recorte diario selecionado."
              },
              {
                id: "pending",
                label: "Pendencias",
                value: pendingDayBookings.length,
                helper: "Aguardando confirmacao ou cobranca.",
                tone: "warning"
              },
              {
                id: "confirmed",
                label: "Confirmados",
                value: confirmedDayBookings.length,
                helper: "Prontos para atendimento no dia.",
                tone: "info"
              },
              {
                id: "completed",
                label: "Concluidos",
                value: completedDayBookings.length,
                helper: `Receita reconhecida ${formatCurrency(dayRecognizedRevenue)}.`,
                tone: "success"
              }
            ]}
          />
        }
        tabs={
          <div aria-label="Visoes da operacao diaria" className="operational-tabbar" role="tablist">
            {operationalTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  aria-selected={operationalWorkspaceTab === tab.id}
                  className={
                    operationalWorkspaceTab === tab.id
                      ? "operational-tab-button is-active"
                      : "operational-tab-button"
                  }
                  key={tab.id}
                  onClick={() => setOperationalWorkspaceTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  <small>{tab.count}</small>
                </button>
              );
            })}
          </div>
        }
        items={
          operationalWorkspaceTab === "pending" ? (
            <EntitySection
              title="Pendencias da fila"
              description="Confirmacoes e cobranca pendentes para destravar o dia sem abrir a agenda completa."
              actions={<ViewBadge tone="warning">{pendingDayBookings.length} na fila</ViewBadge>}
            >
              {renderOperationalRecords(
                pendingDayBookings,
                `Nenhuma pendencia encontrada para ${formatAgendaDayLabel(agendaDate)}.`
              )}
            </EntitySection>
          ) : operationalWorkspaceTab === "confirmed" ? (
            <EntitySection
              title="Confirmados em preparo"
              description="Atendimentos confirmados prontos para execucao, reagendamento ou encerramento."
              actions={<ViewBadge tone="info">{confirmedDayBookings.length} confirmados</ViewBadge>}
            >
              {renderOperationalRecords(
                confirmedDayBookings,
                `Nenhuma booking confirmada encontrada para ${formatAgendaDayLabel(agendaDate)}.`
              )}
            </EntitySection>
          ) : operationalWorkspaceTab === "completed" ? (
            <EntitySection
              title="Concluidos do dia"
              description="Fechamento operacional com leitura de receita reconhecida sem competir com relatorios."
              actions={<ViewBadge tone="success">{completedDayBookings.length} concluidos</ViewBadge>}
            >
              {renderOperationalRecords(
                completedDayBookings,
                `Nenhum atendimento concluido encontrado para ${formatAgendaDayLabel(agendaDate)}.`
              )}
            </EntitySection>
          ) : operationalWorkspaceTab === "noshow" ? (
            <EntitySection
              title="Ausencias registradas"
              description="No-shows do dia em uma visao propria para follow-up e contexto da equipe."
              actions={<ViewBadge tone="danger">{noShowDayBookings.length} no-show</ViewBadge>}
            >
              {renderOperationalRecords(
                noShowDayBookings,
                `Nenhum no-show identificado para ${formatAgendaDayLabel(agendaDate)}.`
              )}
            </EntitySection>
          ) : (
            <div className="operational-section-stack">
              <EntitySection
                title="Fila prioritaria"
                description="Pendencias e confirmados mais proximos do dia, com acao direta e sem ruído de estados encerrados."
                actions={<ViewBadge tone="info">{openDayBookings.length} em aberto</ViewBadge>}
              >
                {renderOperationalRecords(
                  openDayBookings,
                  `Nenhuma booking em aberto encontrada para ${formatAgendaDayLabel(agendaDate)}.`
                )}
              </EntitySection>

              <EntitySection
                title="Fechamento e receita"
                description="Leitura curta do que o dia ja gerou e do que ainda esta previsto, sem abrir relatorios."
              >
                <DocumentSummaryCards
                  metrics={[
                    {
                      id: "projected-revenue",
                      label: "Previsao bruta",
                      value: formatCurrency(dayProjectedRevenue),
                      helper: "Valor bruto das bookings do dia."
                    },
                    {
                      id: "recognized-revenue",
                      label: "Receita reconhecida",
                      value: formatCurrency(dayRecognizedRevenue),
                      helper: "Somente atendimentos concluidos.",
                      tone: "success"
                    },
                    {
                      id: "approved-online",
                      label: "Entrada online aprovada",
                      value: formatCurrency(dayApprovedOnlineRevenue),
                      helper: "Conciliacao minima ligada a bookings concluidas.",
                      tone: "info"
                    },
                    {
                      id: "noshow-count",
                      label: "No-show",
                      value: noShowDayBookings.length,
                      helper: "Clientes ausentes no recorte selecionado.",
                      tone: noShowDayBookings.length > 0 ? "danger" : undefined
                    }
                  ]}
                />
              </EntitySection>
            </div>
          )
        }
        aside={null}
      />
    );
  }

  function renderDashboardView(): JSX.Element {
    const retentionRate =
      clientPortfolioSummary.activeCount > 0
        ? clientPortfolioSummary.returningCount / clientPortfolioSummary.activeCount
        : 0;
    const dashboardTabs: ReadonlyArray<{
      readonly id: DashboardWorkspaceTab;
      readonly label: string;
      readonly icon: LucideIcon;
    }> = [
      { id: "executive", label: "Resumo executivo", icon: LayoutDashboard },
      { id: "agenda", label: "Agenda da semana", icon: CalendarDays },
      { id: "radar", label: "Radar da semana", icon: Activity },
      { id: "clients", label: "Clientes e retorno", icon: Users },
      { id: "shortcuts", label: "Acessos rapidos", icon: Rocket }
    ];

    return (
      <DocumentViewLayout
        className="dashboard-document-view"
        eyebrow="Visao executiva"
        title={tenant?.nome ?? "Tenant nao carregado"}
        subtitle="Leitura gerencial do tenant para distribuir operacao, agenda, clientes e relatorios sem misturar configuracao no corpo da tela."
        pageActions={
          <div className="dashboard-document-actions">
            <label className="dashboard-select">
              <span>Periodo</span>
              <select
                onChange={(event) => setDashboardRange(event.target.value as DashboardRange)}
                value={dashboardRange}
              >
                <option value="7d">Ultimos 7 dias</option>
                <option value="30d">Ultimos 30 dias</option>
                <option value="all">Todo o historico</option>
              </select>
            </label>
            <button className="secondary-button" disabled={isBusy} onClick={handleRefreshClick} type="button">
              Atualizar
            </button>
            <button className="secondary-button" onClick={() => navigateTo("relatorios")} type="button">
              Abrir relatorios
            </button>
          </div>
        }
        header={null}
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "recognized-revenue",
                label: "Receita reconhecida",
                value: formatCurrency(dashboardRevenueSummary.recognizedRevenue),
                helper: resolveReportComparisonLabel(
                  dashboardRevenueSummary.recognizedRevenue,
                  previousDashboardRevenueSummary.recognizedRevenue,
                  "currency",
                  dashboardRange !== "all"
                ),
                tone: "success"
              },
              {
                id: "retention",
                label: "Clientes com retorno",
                value: formatPercentage(retentionRate),
                helper: `${clientPortfolioSummary.returningCount} cliente(s) com retorno recente.`,
                tone: "success"
              },
              {
                id: "average-ticket",
                label: "Ticket medio",
                value: formatCurrency(dashboardRevenueSummary.averageTicket),
                helper: `${dashboardRevenueSummary.completedCount} atendimento(s) concluidos no recorte.`,
                tone: "info"
              },
              {
                id: "today",
                label: "Agenda hoje",
                value: bookingSummary.today,
                helper: `${todayPendingCount} pendencia(s) e ${todayConfirmedCount} confirmado(s).`,
                tone: "info"
              }
            ]}
          />
        }
        tabs={
          <div aria-label="Visoes do dashboard" className="dashboard-tabbar" role="tablist">
            {dashboardTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  aria-selected={dashboardWorkspaceTab === tab.id}
                  className={
                    dashboardWorkspaceTab === tab.id
                      ? "dashboard-tab-button is-active"
                      : "dashboard-tab-button"
                  }
                  key={tab.id}
                  onClick={() => setDashboardWorkspaceTab(tab.id)}
                  role="tab"
                  type="button"
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        }
        items={
          dashboardWorkspaceTab === "agenda" ? (
            <EntitySection
              title="Saude da agenda da semana"
              description="Capacidade, ocupacao e fila do dia em um unico contexto operacional."
            >
              <div className="dashboard-progress-stack">
                <div className="dashboard-progress-block">
                  <div className="dashboard-progress-copy">
                    <span>Capacidade total</span>
                    <strong>{formatMinutesAsHours(weekCapacitySummary.totalMinutes)}</strong>
                  </div>
                  <div className="dashboard-progress-bar">
                    <span style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="dashboard-progress-block">
                  <div className="dashboard-progress-copy">
                    <span>Horas ocupadas</span>
                    <strong>
                      {formatMinutesAsHours(weekCapacitySummary.bookedMinutes)} ({formatUtilization(weekCapacitySummary.bookedMinutes, weekCapacitySummary.totalMinutes)})
                    </strong>
                  </div>
                  <div className="dashboard-progress-bar">
                    <span
                      className="is-info"
                      style={{
                        width: `${Math.min(
                          weekCapacitySummary.totalMinutes > 0
                            ? (weekCapacitySummary.bookedMinutes / weekCapacitySummary.totalMinutes) * 100
                            : 0,
                          100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <strong>{todayBookings.length}</strong>
                  <span>Booking(s) previstas para hoje.</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{todayPendingCount}</strong>
                  <span>Pendencia(s) ou aguardando pagamento.</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{todayConfirmedCount}</strong>
                  <span>Confirmada(s) no dia.</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{weekCapacitySummary.openBookings}</strong>
                  <span>Booking(s) em aberto na semana.</span>
                </div>
              </div>
            </EntitySection>
          ) : dashboardWorkspaceTab === "radar" ? (
            <>
              <EntitySection
                title="Radar da semana"
                description="Leitura concentrada de capacidade, horas livres e presenca de pendencias em um painel proprio."
              >
                <DocumentSummaryCards
                  metrics={[
                    {
                      id: "radar-capacity",
                      label: "Capacidade total",
                      value: formatMinutesAsHours(weekCapacitySummary.totalMinutes),
                      helper: "Disponibilidade derivada da equipe publicada."
                    },
                    {
                      id: "radar-booked",
                      label: "Horas ocupadas",
                      value: formatMinutesAsHours(weekCapacitySummary.bookedMinutes),
                      helper: `${weekCapacitySummary.bookingsCount} booking(s) distribuidas.`,
                      tone: "info"
                    },
                    {
                      id: "radar-free",
                      label: "Horas livres",
                      value: formatMinutesAsHours(weekCapacitySummary.freeMinutes),
                      helper:
                        weekCapacitySummary.totalMinutes > 0
                          ? `${formatUtilization(weekCapacitySummary.bookedMinutes, weekCapacitySummary.totalMinutes)} de ocupacao`
                          : "Sem disponibilidade publicada."
                    },
                    {
                      id: "radar-open",
                      label: "Em aberto",
                      value: weekCapacitySummary.openBookings,
                      helper: "Pendencias operacionais vivas nesta semana.",
                      tone: "warning"
                    }
                  ]}
                />
              </EntitySection>

              <div className="dashboard-secondary-grid">
                <EntitySection
                  title="Capacidade por dia"
                  description="Cada dia da semana em leitura curta, sem competir com atalhos ou base do tenant."
                >
                  <div className="dashboard-kpi-list">
                    {weekDaySummaries.map((summary) => (
                      <article className="dashboard-kpi-item" key={summary.date}>
                        <div className="dashboard-kpi-main">
                          <strong>{formatAgendaDayLabel(summary.date)}</strong>
                          <span>{summary.bookingsCount} booking(s), {summary.openBookings} em aberto.</span>
                        </div>
                        <div className="dashboard-kpi-side">
                          <span>{formatMinutesAsHours(summary.bookedMinutes)} / {formatMinutesAsHours(summary.totalMinutes)}</span>
                          <small>
                            {summary.totalMinutes > 0
                              ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                              : "Sem capacidade"}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                </EntitySection>

                <EntitySection
                  title="Carga por profissional"
                  description="Ajuda a localizar gargalos e ociosidade da equipe sem abrir a grade completa."
                >
                  <div className="dashboard-kpi-list">
                    {weekProfessionalSummaries.map((summary) => (
                      <article className="dashboard-kpi-item" key={summary.professionalId}>
                        <div className="dashboard-kpi-main">
                          <strong>{resolveProfessionalName(summary.professionalId, professionals)}</strong>
                          <span>{formatMinutesAsHours(summary.bookedMinutes)} ocupadas na semana.</span>
                        </div>
                        <div className="dashboard-kpi-side">
                          <span>{formatMinutesAsHours(summary.totalMinutes)}</span>
                          <small>
                            {summary.totalMinutes > 0
                              ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                              : "Sem escala publicada"}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                </EntitySection>
              </div>
            </>
          ) : dashboardWorkspaceTab === "clients" ? (
            <EntitySection
              title="Clientes e retorno"
              description={`Leitura da carteira na janela de ${resolveClientReturnWindowLabel(activeClientRecurrence.window)}.`}
              actions={
                <button className="secondary-button" onClick={() => navigateTo("clientes")} type="button">
                  Abrir clientes
                </button>
              }
            >
              <div className="dashboard-retention-preview">
                <DocumentSummaryCards
                  metrics={[
                    {
                      id: "returning-count",
                      label: "Com retorno",
                      value: activeClientRecurrence.returningCount,
                      helper: "Clientes com retorno dentro da janela ativa.",
                      tone: "success"
                    },
                    {
                      id: "inactive-count",
                      label: "Sem retorno",
                      value: activeClientRecurrence.inactiveCount,
                      helper: "Clientes fora da janela ativa.",
                      tone: "warning"
                    },
                    {
                      id: "never-completed-count",
                      label: "Nunca concluiu",
                      value: activeClientRecurrence.neverCompletedCount,
                      helper: "Entraram na base, mas sem atendimento concluido."
                    },
                    {
                      id: "average-recurrence",
                      label: "Recorrencia media",
                      value:
                        activeClientRecurrence.averageRecurrenceDays === null
                          ? "n/d"
                          : `${Math.round(activeClientRecurrence.averageRecurrenceDays)} dias`,
                      helper: "Media simples entre atendimentos concluidos."
                    }
                  ]}
                />

                <div className="records-column">
                  {activeClientRecurrence.inactiveClients.length ? (
                    activeClientRecurrence.inactiveClients.slice(0, 4).map((entry) => (
                      <article className="record-card" key={entry.clientId}>
                        <div className="record-card-header">
                          <div className="record-stack">
                            <strong>{entry.nome}</strong>
                            <span>{entry.email || "Sem e-mail cadastrado"}</span>
                          </div>
                          <span className="status-pill is-warning">
                            {formatClientSegment("inactive", activeClientRecurrence.window)}
                          </span>
                        </div>
                        <div className="record-meta">
                          <span>
                            Ultimo atendimento {entry.lastCompletedAt ? formatDateTime(entry.lastCompletedAt) : "nunca"}
                          </span>
                          <span>Receita derivada {formatCurrency(entry.recognizedRevenue)}</span>
                          <span>
                            Recorrencia media{" "}
                            {entry.averageRecurrenceDays === null
                              ? "n/d"
                              : `${Math.round(entry.averageRecurrenceDays)} dias`}
                          </span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">
                      Nenhum cliente sem retorno identificado na janela de{" "}
                      {resolveClientReturnWindowLabel(activeClientRecurrence.window)}.
                    </p>
                  )}
                </div>
              </div>
            </EntitySection>
          ) : dashboardWorkspaceTab === "shortcuts" ? (
            <div className="dashboard-secondary-grid">
              <EntitySection
                title="Base real do tenant"
                description="Volume publicado e carteira formada no runtime atual, separado da leitura executiva."
              >
                <div className="dashboard-mini-grid">
                  <div className="dashboard-mini-card">
                    <strong>{services.length}</strong>
                    <span>Servico(s) ativos no catalogo.</span>
                  </div>
                  <div className="dashboard-mini-card">
                    <strong>{professionals.length}</strong>
                    <span>Profissional(is) publicados na agenda.</span>
                  </div>
                  <div className="dashboard-mini-card">
                    <strong>{bookingSummary.today}</strong>
                    <span>Agendamento(s) previstas para hoje.</span>
                  </div>
                  <div className="dashboard-mini-card">
                    <strong>{clients.length}</strong>
                    <span>Cliente(s) capturados pela jornada publica.</span>
                  </div>
                </div>
              </EntitySection>

              <EntitySection
                title="Acessos rapidos"
                description="Atalhos separados da analise para nao competir com KPI, grafico e leitura semanal."
              >
                <div className="dashboard-action-grid">
                  <button className="dashboard-action-card" onClick={() => navigateTo("operacional")} type="button">
                    <div>
                      <strong>Operacao diaria</strong>
                      <span>Confirmar, concluir e reagendar atendimentos.</span>
                    </div>
                  </button>
                  <button className="dashboard-action-card" onClick={() => navigateTo("agenda")} type="button">
                    <div>
                      <strong>Agenda</strong>
                      <span>Lista, grade e detalhe operacional por dia, semana e mes.</span>
                    </div>
                  </button>
                  <button className="dashboard-action-card" onClick={() => navigateTo("clientes")} type="button">
                    <div>
                      <strong>Clientes</strong>
                      <span>Retorno e historico operacional por cliente.</span>
                    </div>
                  </button>
                  {publicBookingUrl ? (
                    <a className="dashboard-action-card" href={publicBookingUrl} rel="noreferrer" target="_blank">
                      <div>
                        <strong>Booking publico</strong>
                        <span>{publicBookingUrl}</span>
                      </div>
                    </a>
                  ) : (
                    <div className="dashboard-action-card is-muted">
                      <div>
                        <strong>Booking publico</strong>
                        <span>Publique a slug do tenant para abrir o link.</span>
                      </div>
                    </div>
                  )}
                </div>
              </EntitySection>
            </div>
          ) : (
            <div className="dashboard-main-grid">
              <EntitySection
                title="Evolucao de faturamento vs agendamentos"
                description="Visao executiva do periodo para comparar volume e receita."
                actions={<ViewBadge tone="info">{resolveDashboardRangeLabel(dashboardRange)}</ViewBadge>}
              >
                <DashboardChart data={dashboardChartData} />
              </EntitySection>

              <EntitySection
                title="Movimentos recentes de receita"
                description="Ultimos atendimentos concluidos com reflexo financeiro reconhecido."
                actions={
                  <button className="secondary-button" onClick={() => navigateTo("relatorios")} type="button">
                    Ver relatorios
                  </button>
                }
              >
                <div className="dashboard-feed">
                  {revenueEntries.length ? (
                    revenueEntries.slice(0, 6).map((entry) => (
                      <article className="dashboard-feed-item" key={entry.booking.id}>
                        <div className="dashboard-feed-main">
                          <strong>{entry.service?.nome ?? "Servico nao encontrado"}</strong>
                          <span>{entry.client?.nome ?? "Cliente"} | {entry.professional?.nome ?? "Profissional"}</span>
                        </div>
                        <div className="dashboard-feed-meta">
                          <span>{formatCurrency(entry.recognizedAmount)}</span>
                          <small>{formatDateTime(entry.booking.endAt)}</small>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">
                      Nenhuma booking concluida encontrada em {resolveDashboardRangeLabel(dashboardRange)}.
                    </p>
                  )}
                </div>
              </EntitySection>
            </div>
          )
        }
        aside={null}
      />
    );
  }

  function renderShellContextPanel(): JSX.Element | null {
    if (!isShellContextOpen) {
      return null;
    }

    return (
      <>
        <button
          aria-label="Fechar contexto do tenant"
          className="shell-context-overlay"
          onClick={() => setIsShellContextOpen(false)}
          type="button"
        />
        <aside className="shell-context-sheet" role="dialog" aria-label="Contexto do tenant">
          <div className="shell-context-sheet-header">
            <div>
              <p className="eyebrow">Contexto do tenant</p>
              <h2>{tenant?.nome ?? "Tenant nao carregado"}</h2>
            </div>
            <button
              aria-label="Fechar contexto"
              className="admin-icon-button shell-context-close"
              onClick={() => setIsShellContextOpen(false)}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="dashboard-kpi-list">
            <article className="dashboard-kpi-item">
              <div className="dashboard-kpi-main">
                <strong>Slug publica</strong>
                <span>{tenant?.slug ? `/${tenant.slug}` : "Nao publicada"}</span>
              </div>
              <div className="dashboard-kpi-side">
                <span>Booking publico</span>
                <small>{publicBookingUrl || "Sem link publicado"}</small>
              </div>
            </article>
            <article className="dashboard-kpi-item">
              <div className="dashboard-kpi-main">
                <strong>Agenda hoje</strong>
                <span>{bookingSummary.today} booking(s)</span>
              </div>
              <div className="dashboard-kpi-side">
                <span>Janela ativa</span>
                <small>{resolveDashboardRangeLabel(dashboardRange)}</small>
              </div>
            </article>
            <article className="dashboard-kpi-item">
              <div className="dashboard-kpi-main">
                <strong>Timezone</strong>
                <span>{tenant?.timezone ?? "-"}</span>
              </div>
              <div className="dashboard-kpi-side">
                <span>Tenant</span>
                <small>{tenant?.nome ?? "Nao carregado"}</small>
              </div>
            </article>
          </div>

          <div className="shell-context-sheet-actions">
            {publicBookingUrl ? (
              <a className="secondary-button button-link" href={publicBookingUrl} rel="noreferrer" target="_blank">
                Abrir booking
              </a>
            ) : null}
            <button className="secondary-button" onClick={() => navigateTo("configuracoes")} type="button">
              Abrir configuracoes
            </button>
            <button className="secondary-button" disabled={isBusy} onClick={handleRefreshClick} type="button">
              Atualizar painel
            </button>
            <button className="secondary-button" onClick={() => setSessionToken("")} type="button">
              Sair
            </button>
          </div>
        </aside>
      </>
    );
  }

  function renderShellPulsePanel(): JSX.Element | null {
    if (!isShellPulseOpen) {
      return null;
    }

    return (
      <>
        <button
          aria-label="Fechar painel rapido"
          className="shell-context-overlay"
          onClick={() => setIsShellPulseOpen(false)}
          type="button"
        />
        <aside className="shell-context-sheet shell-pulse-sheet" role="dialog" aria-label="Painel rapido do shell">
          <div className="shell-context-sheet-header">
            <div>
              <p className="eyebrow">Painel rapido</p>
              <h2>Atenções e atalhos</h2>
              <p className="description">
                Leitura curta do que pede ação agora, sem abrir outra tela só para descobrir prioridade.
              </p>
            </div>
            <button
              aria-label="Fechar painel rapido"
              className="admin-icon-button shell-context-close"
              onClick={() => setIsShellPulseOpen(false)}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <DocumentSummaryCards
            metrics={[
              {
                id: "shell-pending-day",
                label: "Pendencias hoje",
                value: todayPendingCount,
                helper: "Confirmar, cobrar ou reagendar.",
                tone: todayPendingCount > 0 ? "warning" : undefined
              },
              {
                id: "shell-pending-payments",
                label: "Pagamentos pendentes",
                value: pendingPaymentCount,
                helper: "Payment intents ainda vivos no runtime.",
                tone: pendingPaymentCount > 0 ? "warning" : undefined
              },
              {
                id: "shell-inactive-clients",
                label: "Clientes sem retorno",
                value: clientPortfolioSummary.inactiveCount,
                helper: `Janela atual: ${resolveClientReturnWindowLabel(clientReturnWindow)}.`,
                tone: clientPortfolioSummary.inactiveCount > 0 ? "warning" : undefined
              },
              {
                id: "shell-open-bookings",
                label: "Bookings em aberto",
                value: bookingSummary.open,
                helper: `${todayConfirmedCount} confirmado(s) hoje.`,
                tone: bookingSummary.open > 0 ? "info" : undefined
              }
            ]}
          />

          <div className="dashboard-kpi-list shell-pulse-list">
            <article className="dashboard-kpi-item">
              <div className="dashboard-kpi-main">
                <strong>Fila operacional</strong>
                <span>
                  {todayPendingCount > 0
                    ? `${todayPendingCount} item(ns) pedem atenção ainda hoje.`
                    : "Nenhuma pendência operacional aberta para hoje."}
                </span>
              </div>
              <div className="dashboard-kpi-side">
                <span>{bookingSummary.today} booking(s)</span>
                <small>Agenda do dia</small>
              </div>
            </article>
            <article className="dashboard-kpi-item">
              <div className="dashboard-kpi-main">
                <strong>Carteira</strong>
                <span>
                  {clientPortfolioSummary.inactiveCount > 0
                    ? `${clientPortfolioSummary.inactiveCount} cliente(s) fora da janela de retorno.`
                    : "Sem alerta de retorno no recorte ativo."}
                </span>
              </div>
              <div className="dashboard-kpi-side">
                <span>{clientPortfolioSummary.returningCount} com retorno</span>
                <small>{resolveClientReturnWindowLabel(clientReturnWindow)}</small>
              </div>
            </article>
          </div>

          <div className="shell-context-sheet-actions shell-pulse-actions">
            <button className="secondary-button" onClick={() => navigateTo("operacional")} type="button">
              Abrir operacao
            </button>
            <button className="secondary-button" onClick={() => navigateTo("agenda")} type="button">
              Abrir agenda
            </button>
            <button className="secondary-button" onClick={openClientsDirectoryFromShell} type="button">
              Abrir clientes
            </button>
            <button className="secondary-button" onClick={() => navigateTo("relatorios")} type="button">
              Abrir relatorios
            </button>
          </div>
        </aside>
      </>
    );
  }

  function renderCounterBookingModal(): JSX.Element | null {
    if (!isCounterBookingModalOpen) {
      return null;
    }

    const progressSteps = [
      {
        id: "service" as CounterBookingStep,
        step: "01",
        label: "Servico",
        complete: Boolean(counterBookingSelectedService),
        available: true
      },
      {
        id: "professional" as CounterBookingStep,
        step: "02",
        label: "Profissional",
        complete: Boolean(counterBookingSelectedProfessional),
        available: Boolean(counterBookingSelectedService)
      },
      {
        id: "slot" as CounterBookingStep,
        step: "03",
        label: "Horario",
        complete: Boolean(counterBookingSelectedSlot),
        available: Boolean(counterBookingSelectedService && counterBookingSelectedProfessional)
      },
      {
        id: "client" as CounterBookingStep,
        step: "04",
        label: "Cliente",
        complete:
          Boolean(counterBookingForm.nome && counterBookingForm.telefone && counterBookingForm.email),
        available: Boolean(counterBookingSelectedService && counterBookingSelectedProfessional && counterBookingSelectedSlot)
      }
    ];

    if (counterBookingReceipt) {
      return (
        <>
          <button
            aria-label="Fechar modal de novo agendamento"
            className="counter-booking-overlay"
            onClick={closeCounterBookingModal}
            type="button"
          />
          <section className="counter-booking-modal" role="dialog" aria-label="Novo agendamento">
            <div className="counter-booking-modal-header">
              <div>
                <p className="eyebrow">Novo agendamento</p>
                <h2>Reserva criada no balcão</h2>
              </div>
              <button className="admin-icon-button" onClick={closeCounterBookingModal} type="button">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="counter-booking-success">
              <DocumentSummaryCards
                metrics={[
                  {
                    id: "receipt-service",
                    label: "Servico",
                    value: counterBookingReceipt.service.nome,
                    helper: `${counterBookingReceipt.service.duracaoMin} min`
                  },
                  {
                    id: "receipt-professional",
                    label: "Profissional",
                    value: counterBookingReceipt.professional.nome,
                    helper: formatBookingStatus(counterBookingReceipt.booking.status),
                    tone: "success"
                  },
                  {
                    id: "receipt-schedule",
                    label: "Horario",
                    value: formatDateTime(counterBookingReceipt.booking.startAt),
                    helper: formatTimeRange(
                      counterBookingReceipt.booking.startAt,
                      counterBookingReceipt.booking.endAt
                    )
                  },
                  {
                    id: "receipt-client",
                    label: "Cliente",
                    value: counterBookingReceipt.client.nome,
                    helper: counterBookingReceipt.client.telefone
                  }
                ]}
              />
              <div className="counter-booking-footer">
                <button className="secondary-button" onClick={openCounterBookingModal} type="button">
                  Novo agendamento
                </button>
                <button className="admin-primary-action" onClick={handleOpenCounterBookingInAgenda} type="button">
                  Abrir agenda
                </button>
              </div>
            </div>
          </section>
        </>
      );
    }

    return (
      <>
        <button
          aria-label="Fechar modal de novo agendamento"
          className="counter-booking-overlay"
          onClick={closeCounterBookingModal}
          type="button"
        />
        <section className="counter-booking-modal" role="dialog" aria-label="Novo agendamento">
          <div className="counter-booking-modal-header">
            <div>
              <p className="eyebrow">Novo agendamento</p>
              <h2>Agendar cliente no balcão</h2>
              <p className="description">
                Mesma jornada do booking publico, mas persistida pelo admin com contrato interno.
              </p>
            </div>
            <button className="admin-icon-button" onClick={closeCounterBookingModal} type="button">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form className="counter-booking-form" onSubmit={(event) => void handleSubmitCounterBooking(event)}>
            <div className="counter-booking-progress" aria-label="Etapas do agendamento">
              {progressSteps.map((step) => (
                <button
                  aria-current={counterBookingStep === step.id ? "step" : undefined}
                  className={
                    counterBookingStep === step.id
                      ? "counter-booking-progress-pill is-active"
                      : step.complete
                        ? "counter-booking-progress-pill is-complete"
                        : "counter-booking-progress-pill"
                  }
                  disabled={!step.available}
                  key={step.id}
                  onClick={() => handleCounterBookingGoToStep(step.id)}
                  type="button"
                >
                  <strong>{step.step}</strong>
                  <span>{step.label}</span>
                </button>
              ))}
            </div>

            <div className="counter-booking-layout">
              <div className="counter-booking-main">
                {counterBookingStep === "service" ? (
                  <section className="counter-booking-step-card">
                    <div className="counter-booking-step-heading">
                      <span>01</span>
                      <div>
                        <h3>Escolha o serviço</h3>
                        <p>Comece pelo atendimento que será marcado no balcão.</p>
                      </div>
                    </div>

                    <div className="counter-booking-choice-grid">
                      {bookableServices.length ? (
                        bookableServices.map((service) => (
                          <button
                            className={
                              service.id === counterBookingServiceId
                                ? "counter-booking-choice-card is-active"
                                : "counter-booking-choice-card"
                            }
                            key={service.id}
                            onClick={() => setCounterBookingServiceId(service.id)}
                            type="button"
                          >
                            <strong>{service.nome}</strong>
                            <span>{service.duracaoMin} min</span>
                            <small>{formatCurrency(service.precoBase)}</small>
                          </button>
                        ))
                      ) : (
                        <p className="empty-state">Publique ao menos um servico ativo no catalogo.</p>
                      )}
                    </div>
                  </section>
                ) : null}

                {counterBookingStep === "professional" ? (
                  <section className="counter-booking-step-card">
                    <div className="counter-booking-step-heading">
                      <span>02</span>
                      <div>
                        <h3>Escolha o profissional</h3>
                        <p>Mostramos apenas a equipe compativel com o servico selecionado.</p>
                      </div>
                    </div>

                    <div className="counter-booking-choice-grid">
                      {counterBookingProfessionals.length ? (
                        counterBookingProfessionals.map((professional) => (
                          <button
                            className={
                              professional.id === counterBookingProfessionalId
                                ? "counter-booking-choice-card is-active"
                                : "counter-booking-choice-card"
                            }
                            key={professional.id}
                            onClick={() => setCounterBookingProfessionalId(professional.id)}
                            type="button"
                          >
                            <strong>{professional.nome}</strong>
                            <span>{resolveProfessionalSummaryLine(resolveProfessionalServiceNames(professional, services))}</span>
                            <small>{formatProfessionalStatus(professional.status)}</small>
                          </button>
                        ))
                      ) : (
                        <p className="empty-state">Nenhum profissional ativo atende esse servico.</p>
                      )}
                    </div>
                  </section>
                ) : null}

                {counterBookingStep === "slot" ? (
                  <section className="counter-booking-step-card">
                    <div className="counter-booking-step-heading">
                      <span>03</span>
                      <div>
                        <h3>Escolha o horario</h3>
                        <p>Os slots saem da disponibilidade real do profissional no admin.</p>
                      </div>
                    </div>

                    <label className="field">
                      <span>Data</span>
                      <input
                        type="date"
                        value={counterBookingDate}
                        onChange={(event) => setCounterBookingDate(event.target.value)}
                      />
                    </label>

                    {isLoadingCounterBookingSlots ? (
                      <p className="helper">Carregando horarios disponiveis...</p>
                    ) : counterBookingSlots.length ? (
                      <div className="slot-grid">
                        {counterBookingSlots.map((slot) => (
                          <button
                            className={
                              slot.startAt === counterBookingSlotStartAt
                                ? "secondary-button is-active"
                                : "secondary-button"
                            }
                            key={slot.startAt}
                            onClick={() => setCounterBookingSlotStartAt(slot.startAt)}
                            type="button"
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">Nenhum slot disponivel para esta data.</p>
                    )}
                  </section>
                ) : null}

                {counterBookingStep === "client" ? (
                  <section className="counter-booking-step-card">
                    <div className="counter-booking-step-heading">
                      <span>04</span>
                      <div>
                        <h3>Dados do cliente</h3>
                        <p>Se a base ja tiver esse cliente, o admin reutiliza o cadastro automaticamente.</p>
                      </div>
                    </div>

                    <div className="counter-booking-fields">
                      <label className="field">
                        <span>Nome</span>
                        <input
                          required
                          type="text"
                          value={counterBookingForm.nome}
                          onChange={(event) =>
                            setCounterBookingForm({ ...counterBookingForm, nome: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Telefone</span>
                        <input
                          required
                          type="tel"
                          value={counterBookingForm.telefone}
                          onChange={(event) =>
                            setCounterBookingForm({ ...counterBookingForm, telefone: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>E-mail</span>
                        <input
                          required
                          type="email"
                          value={counterBookingForm.email}
                          onChange={(event) =>
                            setCounterBookingForm({ ...counterBookingForm, email: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Origem</span>
                        <input
                          required
                          type="text"
                          value={counterBookingForm.origem}
                          onChange={(event) =>
                            setCounterBookingForm({ ...counterBookingForm, origem: event.target.value })
                          }
                        />
                      </label>
                      <label className="field">
                        <span>Status inicial</span>
                        <select
                          value={counterBookingForm.status}
                          onChange={(event) =>
                            setCounterBookingForm({
                              ...counterBookingForm,
                              status: event.target.value as CounterBookingFormState["status"]
                            })
                          }
                        >
                          <option value="confirmado">Confirmado</option>
                          <option value="pendente">Pendente</option>
                        </select>
                      </label>
                    </div>

                    {counterBookingClientMatch ? (
                      <div className="counter-booking-match">
                        <ViewBadge tone="info">Cliente ja existe</ViewBadge>
                        <span>
                          O cadastro de {counterBookingClientMatch.nome} sera reutilizado para evitar duplicidade.
                        </span>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {counterBookingError ? <div className="feedback-banner is-error">{counterBookingError}</div> : null}

                <div className="counter-booking-footer">
                  <button className="secondary-button" onClick={closeCounterBookingModal} type="button">
                    Cancelar
                  </button>
                  <div className="counter-booking-footer-actions">
                    {counterBookingStep !== "service" ? (
                      <button className="secondary-button" onClick={handleCounterBookingPreviousStep} type="button">
                        Voltar
                      </button>
                    ) : null}
                    {counterBookingStep !== "client" ? (
                      <button className="admin-primary-action" onClick={handleCounterBookingNextStep} type="button">
                        Continuar
                      </button>
                    ) : (
                      <button className="admin-primary-action" disabled={isSubmittingCounterBooking} type="submit">
                        {isSubmittingCounterBooking ? "Salvando..." : "Salvar agendamento"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <aside className="counter-booking-aside">
                <DocumentSummaryCards
                  metrics={[
                    {
                      id: "summary-service",
                      label: "Servico",
                      value: counterBookingSelectedService?.nome ?? "--",
                      helper: counterBookingSelectedService
                        ? `${counterBookingSelectedService.duracaoMin} min`
                        : "Escolha um servico para iniciar."
                    },
                    {
                      id: "summary-professional",
                      label: "Profissional",
                      value: counterBookingSelectedProfessional?.nome ?? "--",
                      helper: counterBookingSelectedProfessional
                        ? resolveProfessionalSummaryLine(
                            resolveProfessionalServiceNames(counterBookingSelectedProfessional, services)
                          )
                        : "Selecione quem vai atender."
                    },
                    {
                      id: "summary-slot",
                      label: "Horario",
                      value: counterBookingSelectedSlot
                        ? formatDateTime(counterBookingSelectedSlot.startAt)
                        : "--",
                      helper: counterBookingSelectedSlot
                        ? formatTimeRange(counterBookingSelectedSlot.startAt, counterBookingSelectedSlot.endAt)
                        : "Defina data e slot disponivel."
                    },
                    {
                      id: "summary-status",
                      label: "Status inicial",
                      value: formatBookingStatus(counterBookingForm.status),
                      helper: "Pode ser ajustado depois na operacao."
                    }
                  ]}
                />

                <div className="counter-booking-aside-card">
                  <strong>Regras deste fluxo</strong>
                  <p>O agendamento nasce pelo admin sem abrir checkout publico e continua respeitando disponibilidade e conflito de slot.</p>
                </div>
              </aside>
            </div>
          </form>
        </section>
      </>
    );
  }

  function renderAgendaBookingModal(): JSX.Element | null {
    if (!isAgendaBookingModalOpen || !selectedAgendaBooking) {
      return null;
    }

    const selectedService = services.find((item) => item.id === selectedAgendaBooking.serviceId);
    const selectedClient = clients.find((item) => item.id === selectedAgendaBooking.clientId);

    return (
      <>
        <button
          aria-label="Fechar detalhe da booking"
          className="agenda-booking-overlay"
          onClick={closeAgendaBookingModal}
          type="button"
        />
        <section className="agenda-booking-modal" role="dialog" aria-label="Detalhe da booking">
          <div className="agenda-booking-modal-header">
            <div>
              <p className="eyebrow">Detalhe da booking</p>
              <h2>{selectedService?.nome ?? "Booking selecionada"}</h2>
              <p className="description">
                {selectedClient?.nome ?? "Cliente"} em {formatTimeRange(selectedAgendaBooking.startAt, selectedAgendaBooking.endAt)}.
              </p>
            </div>
            <button className="admin-icon-button" onClick={closeAgendaBookingModal} type="button">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="agenda-booking-modal-body">{renderAgendaBookingDocument()}</div>
        </section>
      </>
    );
  }

  function renderAgendaBookingDocument(): JSX.Element | null {
    if (!selectedAgendaBooking) {
      return null;
    }

    const selectedService = services.find((item) => item.id === selectedAgendaBooking.serviceId);
    const selectedProfessional = professionals.find((item) => item.id === selectedAgendaBooking.professionalId);
    const selectedClient = clients.find((item) => item.id === selectedAgendaBooking.clientId);

    return (
      <DocumentViewLayout
        className="agenda-booking-document"
        eyebrow="Booking selecionada"
        title={selectedService?.nome ?? "Servico nao encontrado"}
        subtitle={`${selectedClient?.nome ?? "Cliente"} com ${selectedProfessional?.nome ?? "profissional nao encontrado"}`}
        documentNumber={selectedAgendaBooking.id.slice(-8).toUpperCase()}
        statusBadge={
          <ViewBadge tone={resolveBookingStatusTone(selectedAgendaBooking.status) as "neutral" | "info" | "success" | "warning" | "danger"}>
            {formatBookingStatus(selectedAgendaBooking.status)}
          </ViewBadge>
        }
        header={
          <DocumentHeader
            fields={[
              {
                id: "schedule",
                label: "Horario",
                value: formatTimeRange(selectedAgendaBooking.startAt, selectedAgendaBooking.endAt)
              },
              {
                id: "date",
                label: "Data",
                value: formatAgendaDayLabel(extractDatePart(selectedAgendaBooking.startAt))
              },
              {
                id: "client",
                label: "Cliente",
                value: selectedClient?.nome ?? "Cliente nao encontrado"
              },
              {
                id: "professional",
                label: "Profissional",
                value: selectedProfessional?.nome ?? "Profissional nao encontrado"
              }
            ]}
          />
        }
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "service-value",
                label: "Valor bruto",
                value: selectedService ? formatCurrency(selectedService.precoBase) : "--",
                helper: "Preco base derivado do catalogo ativo.",
                tone: "success"
              },
              {
                id: "service-duration",
                label: "Duracao",
                value: selectedService ? formatMinutesAsHours(selectedService.duracaoMin) : "--",
                helper: "Tempo previsto para a agenda."
              },
              {
                id: "payment-status",
                label: "Pagamento",
                value:
                  selectedAgendaPaymentIntent
                    ? formatPaymentIntentStatus(selectedAgendaPaymentIntent.status)
                    : "Sem payment intent",
                helper:
                  selectedAgendaPaymentIntent?.paymentId
                    ? `MP ${selectedAgendaPaymentIntent.paymentId}`
                    : "Nao existe pagamento vinculado para esta booking.",
                tone:
                  selectedAgendaPaymentIntent
                    ? (resolvePaymentIntentTone(selectedAgendaPaymentIntent.status) as "info" | "success" | "warning" | "danger")
                    : undefined
              },
              {
                id: "client-phone",
                label: "Contato",
                value: selectedClient?.telefone || "Sem telefone",
                helper: selectedClient?.email ?? "Sem e-mail cadastrado"
              }
            ]}
          />
        }
        tabs={
          <DocumentTabs
            tabs={[
              { id: "overview", label: "Resumo", active: true },
              { id: "payment", label: "Pagamento" },
              { id: "reschedule", label: "Reagendamento" }
            ]}
          />
        }
        items={
          <>
            <EntitySection
              title="Contexto atual"
              description="Leitura operacional minima da booking selecionada."
            >
              <div className="record-meta">
                <span className={`status-pill is-${resolveBookingStatusTone(selectedAgendaBooking.status)}`}>
                  {formatBookingStatus(selectedAgendaBooking.status)}
                </span>
                <span className="status-pill is-neutral">
                  {formatTimeRange(selectedAgendaBooking.startAt, selectedAgendaBooking.endAt)}
                </span>
                {selectedAgendaPaymentIntent ? (
                  <span className={`status-pill is-${resolvePaymentIntentTone(selectedAgendaPaymentIntent.status)}`}>
                    Pagamento {formatPaymentIntentStatus(selectedAgendaPaymentIntent.status)}
                  </span>
                ) : null}
              </div>
            </EntitySection>

            <EntitySection
              title="Reagendar"
              description="Escolha uma nova data e selecione um slot real da agenda do profissional."
            >
              <div className="records-column">
                <div className="field">
                  <label htmlFor="reschedule-date">Nova data</label>
                  <input
                    id="reschedule-date"
                    onChange={(event) => setRescheduleDate(event.target.value)}
                    type="date"
                    value={rescheduleDate}
                  />
                </div>

                {isLoadingAgendaSlots ? (
                  <p className="helper">Carregando slots disponiveis...</p>
                ) : agendaSlots.length ? (
                  <div className="slot-grid">
                    {agendaSlots.map((slot) => (
                      <button
                        className={
                          slot.startAt === selectedAgendaSlotStartAt ?
                            "secondary-button is-active"
                          : "secondary-button"
                        }
                        key={slot.startAt}
                        onClick={() => setSelectedAgendaSlotStartAt(slot.startAt)}
                        type="button"
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="helper">Nenhum slot disponivel para esta data.</p>
                )}

                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={
                      isBusy ||
                      isLoadingAgendaSlots ||
                      !selectedAgendaSlotStartAt ||
                      selectedAgendaSlotStartAt === selectedAgendaBooking.startAt
                    }
                    onClick={() => void handleRescheduleBooking()}
                    type="button"
                  >
                    Salvar novo horario
                  </button>
                </div>
              </div>
            </EntitySection>
          </>
        }
        timeline={
          <DocumentTimeline
            title="Linha operacional"
            entries={[
              {
                id: "timeline-booking",
                title: "Horario reservado",
                description: `${formatAgendaDayLabel(extractDatePart(selectedAgendaBooking.startAt))}  |  ${formatTimeRange(selectedAgendaBooking.startAt, selectedAgendaBooking.endAt)}`
              },
              {
                id: "timeline-status",
                title: "Status atual",
                description: formatBookingStatus(selectedAgendaBooking.status)
              },
              {
                id: "timeline-payment",
                title: "Pagamento vinculado",
                description:
                  selectedAgendaPaymentIntent
                    ? formatPaymentIntentStatus(selectedAgendaPaymentIntent.status)
                    : "Sem payment intent nesta booking."
              }
            ]}
          />
        }
      />
    );
  }

  function renderAgendaListWorkspace(): JSX.Element {
    return (
      <article className="ag-surface-card ag-view-panel agenda-workspace-panel agenda-workspace-panel-full">
          <div className="agenda-panel-header">
            <div>
              <p className="eyebrow">Formato lista</p>
              <h3>{formatAgendaDayLabel(agendaDate)}</h3>
              <p className="helper">
                Selecione um atendimento da fila do dia para abrir o detalhe completo e reagendar por slot real.
              </p>
            </div>
            <ViewBadge tone="info">{filteredDayAgendaBookings.length} booking(s)</ViewBadge>
          </div>

          <div className="ag-master-detail-body">
            {filteredDayAgendaBookings.length ? (
              <div className="records-column">
                {filteredDayAgendaBookings.map((booking) => {
                  const service = services.find((item) => item.id === booking.serviceId);
                  const professional = professionals.find((item) => item.id === booking.professionalId);
                  const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);

                  return (
                    <button
                      className={
                        booking.id === selectedAgendaBooking?.id ?
                          "entity-card timeline-card is-active"
                        : "entity-card timeline-card"
                      }
                      key={booking.id}
                      onClick={() => openAgendaBookingModal(booking)}
                      type="button"
                    >
                      <div className="timeline-card-header">
                        <strong className="timeline-card-time">{formatTimeRange(booking.startAt, booking.endAt)}</strong>
                        <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                          {formatBookingStatus(booking.status)}
                        </span>
                      </div>
                      <div className="record-stack">
                        <strong>{resolveClientName(booking.clientId, clients)}</strong>
                        <span>{service?.nome ?? "Servico"}  |  {professional?.nome ?? "Profissional nao encontrado"}</span>
                      </div>
                      <div className="record-meta">
                        <span>{service ? formatCurrency(service.precoBase) : "Preco nao encontrado"}</span>
                        {paymentIntent ? (
                          <span className={`status-pill is-${resolvePaymentIntentTone(paymentIntent.status)}`}>
                            Pagamento {formatPaymentIntentStatus(paymentIntent.status)}
                          </span>
                        ) : (
                          <span className="status-pill is-neutral">Sem payment intent</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="empty-state">
                Nenhum atendimento encontrado para {formatAgendaDayLabel(agendaDate)} neste recorte.
              </p>
            )}
          </div>
      </article>
    );
  }

  function renderAgendaCalendarWorkspace(): JSX.Element {
    const agendaCalendarDate = parseDateFns(agendaDate, "yyyy-MM-dd", new Date());
    const visibleCalendarLabel =
      agendaViewMode === "day" ?
        formatAgendaDayLabel(agendaDate)
      : agendaViewMode === "week" ?
        formatAgendaWeekLabel(agendaWeekDates)
      : formatAgendaMonthLabel(agendaDate);

    return (
      <article className="ag-surface-card ag-view-panel agenda-workspace-panel agenda-calendar-panel agenda-workspace-panel-full">
          <div className="agenda-panel-header">
            <div>
              <p className="eyebrow">Formato agenda</p>
              <h3>{visibleCalendarLabel}</h3>
              <p className="helper">
                Grade interativa em React para navegar por dia, semana e mes sem perder o detalhe da booking.
              </p>
            </div>
            <ViewBadge tone="success">{agendaCalendarEvents.length} evento(s)</ViewBadge>
          </div>

          <div className="agenda-calendar-shell">
            <BigCalendar
              culture="pt-BR"
              date={agendaCalendarDate}
              endAccessor="end"
              eventPropGetter={(event) => ({
                className: `agenda-rbc-event is-${resolveBookingStatusTone(event.resource.status)}`
              })}
              events={agendaCalendarEvents}
              localizer={agendaCalendarLocalizer}
              max={new Date(1970, 0, 1, 22, 0, 0)}
              messages={agendaCalendarMessages}
              min={new Date(1970, 0, 1, 6, 0, 0)}
              onNavigate={(nextDate) => setAgendaDate(formatDateFns(nextDate, "yyyy-MM-dd"))}
              onSelectEvent={(event) => openAgendaBookingModal(event.resource)}
              onView={(view) => {
                if (view === "day" || view === "week" || view === "month") {
                  setAgendaViewMode(view);
                }
              }}
              popup
              selected={selectedAgendaCalendarEvent ?? undefined}
              startAccessor="start"
              toolbar={false}
              view={agendaViewMode as BigCalendarView}
              views={["day", "week", "month"]}
            />
          </div>
      </article>
    );
  }

  function renderAgendaViewV2(): JSX.Element {
    const agendaWorkspaceTabs: ReadonlyArray<{
      readonly id: AgendaWorkspaceTab;
      readonly label: string;
      readonly icon: LucideIcon;
      readonly helper: string;
    }> = [
      { id: "list", label: "Lista", icon: ListTodo, helper: `${filteredDayAgendaBookings.length} do dia` },
      { id: "calendar", label: "Agenda", icon: CalendarDays, helper: `${agendaCalendarEvents.length} carregados` }
    ];
    const agendaViewTabs: ReadonlyArray<{
      readonly id: AgendaViewMode;
      readonly label: string;
    }> = [
      { id: "day", label: "Dia" },
      { id: "week", label: "Semana" },
      { id: "month", label: "Mes" }
    ];
    const activeAgendaBookings =
      agendaWorkspaceTab === "list" || agendaViewMode === "day" ?
        filteredDayAgendaBookings
      : agendaViewMode === "week" ?
        filteredWeekBookings
      : currentMonthCells.flatMap((cell) => cell.bookings);
    const activeAgendaSummary = {
      total: activeAgendaBookings.length,
      open: activeAgendaBookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
      confirmed: activeAgendaBookings.filter((booking) => booking.status === "confirmado").length,
      completed: activeAgendaBookings.filter((booking) => booking.status === "concluido").length
    };
    const activeAgendaLabel =
      agendaWorkspaceTab === "list" || agendaViewMode === "day" ?
        formatAgendaDayLabel(agendaDate)
      : agendaViewMode === "week" ?
        formatAgendaWeekLabel(agendaWeekDates)
      : formatAgendaMonthLabel(agendaDate);
    const agendaViewLabel =
      agendaWorkspaceTab === "list" ?
        "Lista operacional"
      : agendaViewMode === "day" ?
        "Calendario diario"
      : agendaViewMode === "week" ?
        "Calendario semanal"
      : "Calendario mensal";
    const navigationLabels =
      agendaWorkspaceTab === "calendar" && agendaViewMode === "week" ?
        { previous: "Semana anterior", current: "Esta semana", next: "Proxima semana" }
      : agendaWorkspaceTab === "calendar" && agendaViewMode === "month" ?
        { previous: "Mes anterior", current: "Este mes", next: "Proximo mes" }
      : { previous: "Dia anterior", current: "Hoje", next: "Proximo dia" };

    return (
      <DocumentViewLayout
        className="agenda-document-view"
        eyebrow="Agenda / calendario"
        title="Agenda operacional"
        subtitle="Filtros, lista do dia e grade interativa da agenda sem misturar capacidade agregada e leitura gerencial."
        statusBadge={
          <ViewBadge tone={agendaWorkspaceTab === "list" ? "info" : "success"}>
            {agendaViewLabel}
          </ViewBadge>
        }
        pageActions={
          <div className="agenda-page-actions">
            <div className="mode-switch">
              <button className="secondary-button" onClick={() => handleAgendaDateShift(-1)} type="button">
                {navigationLabels.previous}
              </button>
              <button
                className="secondary-button"
                onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
                type="button"
              >
                {navigationLabels.current}
              </button>
              <button className="secondary-button" onClick={() => handleAgendaDateShift(1)} type="button">
                {navigationLabels.next}
              </button>
            </div>

            <label className="dashboard-select" htmlFor="agenda-date">
              <span>Data da agenda</span>
              <input
                id="agenda-date"
                onChange={(event) => setAgendaDate(event.target.value)}
                type="date"
                value={agendaDate}
              />
            </label>

            <label className="dashboard-select" htmlFor="agenda-professional-filter">
              <span>Profissional</span>
              <select
                id="agenda-professional-filter"
                onChange={(event) => setAgendaProfessionalFilter(event.target.value)}
                value={agendaProfessionalFilter}
              >
                <option value="all">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
            </label>

            <button className="secondary-button" disabled={isBusy} onClick={handleRefreshClick} type="button">
              Atualizar
            </button>
          </div>
        }
        header={
          <DocumentHeader
            fields={[
              { id: "period", label: "Recorte ativo", value: activeAgendaLabel },
              {
                id: "professional",
                label: "Profissional",
                value:
                  agendaProfessionalFilter === "all" ?
                    "Todos os profissionais"
                  : resolveProfessionalName(agendaProfessionalFilter, professionals)
              },
              { id: "workspace", label: "Formato", value: agendaViewLabel },
              {
                id: "selected",
                label: "Selecionada",
                value:
                  selectedAgendaBooking
                    ? `${formatTimeRange(selectedAgendaBooking.startAt, selectedAgendaBooking.endAt)}  |  ${resolveClientName(selectedAgendaBooking.clientId, clients)}`
                    : "Nenhuma booking selecionada"
              }
            ]}
          />
        }
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "total",
                label: "No recorte",
                value: activeAgendaSummary.total,
                helper: "Eventos realmente carregados para a visao atual.",
                tone: "info"
              },
              {
                id: "open",
                label: "Em aberto",
                value: activeAgendaSummary.open,
                helper: "Pendentes, confirmados e aguardando pagamento.",
                tone: "warning"
              },
              {
                id: "confirmed",
                label: "Confirmados",
                value: activeAgendaSummary.confirmed,
                helper: "Prontos para execucao operacional.",
                tone: "info"
              },
              {
                id: "completed",
                label: "Concluidos",
                value: activeAgendaSummary.completed,
                helper: "Fechados sem abrir o modulo gerencial.",
                tone: "success"
              }
            ]}
          />
        }
        tabs={
          <div className="agenda-tabs-stack">
            <div aria-label="Formatos da agenda" className="dashboard-tabbar" role="tablist">
              {agendaWorkspaceTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    aria-selected={agendaWorkspaceTab === tab.id}
                    className={agendaWorkspaceTab === tab.id ? "dashboard-tab-button is-active" : "dashboard-tab-button"}
                    key={tab.id}
                    onClick={() => setAgendaWorkspaceTab(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <small>{tab.helper}</small>
                  </button>
                );
              })}
            </div>

            {agendaWorkspaceTab === "calendar" ? (
              <div aria-label="Visoes do calendario" className="dashboard-tabbar agenda-subtabbar" role="tablist">
                {agendaViewTabs.map((tab) => (
                  <button
                    aria-selected={agendaViewMode === tab.id}
                    className={agendaViewMode === tab.id ? "dashboard-tab-button is-active" : "dashboard-tab-button"}
                    key={tab.id}
                    onClick={() => setAgendaViewMode(tab.id)}
                    role="tab"
                    type="button"
                  >
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        }
        items={agendaWorkspaceTab === "list" ? renderAgendaListWorkspace() : renderAgendaCalendarWorkspace()}
      />
    );
  }

  function renderCatalogView(): JSX.Element {
    const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
    const isCreatingService = serviceWorkspaceMode === "new";

    return (
      <EntityViewLayout
        className="catalog-entity-view"
        eyebrow="Catalogo"
        title={isCreatingService ? "Novo servico" : "Catalogo"}
        identityCard={null}
        sections={renderCatalogPanel()}
      />
    );
  }

  function renderReportsViewV2(): JSX.Element {
    const selectedReportService =
      reportsServiceFilter === "all"
        ? null
        : services.find((service) => service.id === reportsServiceFilter) ?? null;
    const selectedReportProfessional =
      reportsProfessionalFilter === "all"
        ? null
        : professionals.find((professional) => professional.id === reportsProfessionalFilter) ?? null;
    const reportsComparisonEnabled = reportsReadModel?.comparisonEnabled ?? reportsRange !== "all";
    const currentNoShowRate =
      activeReportCurrent.bookingsCount > 0
        ? activeReportCurrent.noShowCount / activeReportCurrent.bookingsCount
        : 0;
    const previousNoShowRate =
      activeReportPrevious && activeReportPrevious.bookingsCount > 0
        ? activeReportPrevious.noShowCount / activeReportPrevious.bookingsCount
        : 0;
    const recurrenceAverageLabel =
      activeClientRecurrence.averageRecurrenceDays === null
        ? "n/d"
        : `${Math.round(activeClientRecurrence.averageRecurrenceDays)} dias`;
    const reportOpenBookings = reportBookings.filter((booking) => isOpenBookingStatus(booking.status)).length;
    const reportsSourceLabel = reportsReadModel ? "Read model do backend" : "Fallback local";
    const reportsWorkspaceTabs: ReadonlyArray<{
      readonly id: ReportsWorkspaceTab;
      readonly label: string;
      readonly helper: string;
    }> = [
      {
        id: "overview",
        label: "Visao executiva",
        helper: "KPI principal"
      },
      {
        id: "services",
        label: "Servicos",
        helper: `${activeReportServiceSummaries.length} grupo(s)`
      },
      {
        id: "team",
        label: "Equipe",
        helper: `${activeReportProfessionalSummaries.length} profissional(is)`
      },
      {
        id: "retention",
        label: "Retorno",
        helper: `${activeClientRecurrence.inactiveCount} sem retorno`
      },
      {
        id: "agenda",
        label: "Agenda",
        helper: `${reportsInsightWeekCapacitySummary.openBookings} em aberto`
      }
    ];
    const reportsAgendaTabs: ReadonlyArray<{
      readonly id: ReportsAgendaWorkspaceTab;
      readonly label: string;
      readonly helper: string;
    }> = [
      {
        id: "week",
        label: "Radar da semana",
        helper: `${reportsInsightWeekCapacitySummary.bookingsCount} booking(s)`
      },
      {
        id: "month",
        label: "Leitura do mes",
        helper: `${reportsInsightMonthCapacitySummary.bookingsCount} booking(s)`
      }
    ];
    const reportsInsightMonthHighlights = reportsInsightCurrentMonthCells.filter((cell) => cell.bookingsCount > 0);

    const workspaceMeta = reportsWorkspaceItems.find((item) => item.key === reportsWorkspaceTab) ?? reportsWorkspaceItems[0];
    const workspaceGroups = groupReportsWorkspaceItems(reportsWorkspaceItems);
    const paymentIntentByBookingId = new Map(
      paymentIntents
        .filter((paymentIntent) => paymentIntent.bookingId)
        .map((paymentIntent) => [paymentIntent.bookingId, paymentIntent] as const)
    );
    const activePaneFilters = resolveReportsPaneFilters();
    const serviceLookupItems = [...services]
      .sort((left, right) => left.nome.localeCompare(right.nome))
      .map((service) => ({
        value: service.id,
        label: buildLookupDisplay(service.nome, service.id),
        searchTerms: [service.nome, service.id, buildLookupDisplay(service.nome, service.id)]
      }));
    const professionalLookupItems = [...professionals]
      .sort((left, right) => left.nome.localeCompare(right.nome))
      .map((professional) => ({
        value: professional.id,
        label: buildLookupDisplay(professional.nome, professional.id),
        searchTerms: [professional.nome, professional.id, buildLookupDisplay(professional.nome, professional.id)]
      }));
    const clientLookupItems = [...clients]
      .sort((left, right) => left.nome.localeCompare(right.nome))
      .map((client) => ({
        value: client.id,
        label: `${client.nome} | ${client.telefone}`,
        searchTerms: [client.nome, client.telefone, client.id]
      }));
    const activePaneFilterCount = [
      activePaneFilters.dateFrom,
      activePaneFilters.dateTo,
      activePaneFilters.serviceFrom,
      activePaneFilters.serviceTo,
      activePaneFilters.professionalFrom,
      activePaneFilters.professionalTo,
      activePaneFilters.clientQuery,
      activePaneFilters.returnWindow !== clientReturnWindow ? activePaneFilters.returnWindow : ""
    ].filter(Boolean).length;
    const customReportBookings = filterBookingsByDetailedReportsFilters(
      bookings,
      activePaneFilters,
      serviceLookupItems,
      professionalLookupItems,
      clients,
      reportsRange
    );
    const customRevenueEntries = buildRevenueEntries(
      customReportBookings,
      services,
      professionals,
      clients,
      paymentIntents,
      cashEntries
    );
    const customCurrentMetric = buildReportMetricSummary(
      customReportBookings,
      services,
      paymentIntents,
      cashEntries
    );
    const customRevenueFeed = [...customRevenueEntries]
      .filter((entry) => entry.recognizedAmount > 0 || entry.approvedOnlineAmount > 0)
      .slice(0, 6)
      .map((entry) => ({
        id: entry.booking.id,
        title: entry.service?.nome ?? resolveServiceName(entry.booking.serviceId, services),
        subtitle: `${resolveClientName(entry.booking.clientId, clients)} com ${entry.professional?.nome ?? resolveProfessionalName(entry.booking.professionalId, professionals)}`,
        value: formatCurrency(entry.recognizedAmount || entry.approvedOnlineAmount),
        meta: formatDateTime(entry.booking.startAt)
      }));
    const customOpenBookingCount = customReportBookings.filter((booking) =>
      isOpenBookingStatus(booking.status)
    ).length;
    const operationalQueue = [...customReportBookings]
      .filter((booking) => isOpenBookingStatus(booking.status))
      .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
      .slice(0, 10);
    const pendingCount = customReportBookings.filter((booking) => booking.status === "pendente").length;
    const awaitingPaymentCount = customReportBookings.filter(
      (booking) => booking.status === "aguardando pagamento"
    ).length;
    const confirmedCount = customReportBookings.filter((booking) => booking.status === "confirmado").length;
    const customServiceSummaries = buildServiceReportSummaries(
      customReportBookings,
      services,
      paymentIntents,
      cashEntries
    );
    const customProfessionalSummaries = buildProfessionalReportSummaries(
      customReportBookings,
      professionals,
      services,
      paymentIntents,
      cashEntries
    );
    const customClientInsights = buildClientInsights(clients, customReportBookings, services, cashEntries);
    const customClientPortfolio = summarizeClientPortfolio(customClientInsights, activePaneFilters.returnWindow);
    const customInactiveClientInsights = filterClientInsights(
      customClientInsights,
      "inactive",
      activePaneFilters.returnWindow
    );
    const customRecurrenceLabel =
      activePaneFilterCount === 0 && activeClientRecurrence.averageRecurrenceDays !== null
        ? `${Math.round(activeClientRecurrence.averageRecurrenceDays)} dias`
        : "n/d";
    const customCurrentNoShowRate =
      customCurrentMetric.bookingsCount > 0 ? customCurrentMetric.noShowCount / customCurrentMetric.bookingsCount : 0;
    const comparisonMetric = activePaneFilterCount === 0 ? activeReportPrevious : undefined;
    const comparisonNoShowRate =
      comparisonMetric && comparisonMetric.bookingsCount > 0
        ? comparisonMetric.noShowCount / comparisonMetric.bookingsCount
        : 0;
    const reportMetricCurrent = customCurrentMetric;
    const reportMetricPrevious = comparisonMetric;
    const reportServiceSummaryRows = customServiceSummaries;
    const reportProfessionalSummaryRows = customProfessionalSummaries;
    const reportRecurrenceInactiveRows = customInactiveClientInsights;
    const reportRecurrenceSummary = customClientPortfolio;
    const reportRecurrenceLabel = customRecurrenceLabel;
    const reportRevenueFeed = customRevenueFeed;
    const insightFilters = {
      ...activePaneFilters,
      dateFrom: "",
      dateTo: ""
    };
    const customInsightBookings = filterBookingsByDetailedReportsFilters(
      bookings,
      insightFilters,
      serviceLookupItems,
      professionalLookupItems,
      clients,
      "all"
    );
    const customInsightProfessionals = professionals.filter((professional) =>
      isWithinLookupRange(
        professional.id,
        professionalLookupItems,
        activePaneFilters.professionalFrom,
        activePaneFilters.professionalTo
      )
    );
    const customWeekBookings = filterBookingsByDates(customInsightBookings, reportsInsightWeekDates);
    const customWeekCapacitySummary = summarizeWeekCapacity(
      customWeekBookings,
      reportsInsightWeekDates,
      customInsightProfessionals,
      weeklyAvailabilityByProfessional
    );
    const customWeekDaySummaries = buildWeekDaySummaries(
      customWeekBookings,
      reportsInsightWeekDates,
      customInsightProfessionals,
      weeklyAvailabilityByProfessional
    );
    const customWeekProfessionalSummaries = buildWeekProfessionalSummaries(
      customWeekBookings,
      reportsInsightWeekDates,
      customInsightProfessionals,
      weeklyAvailabilityByProfessional
    );
    const customMonthCells = buildAgendaMonthCells(
      reportsInsightAnchorDate,
      customInsightBookings,
      customInsightProfessionals,
      weeklyAvailabilityByProfessional,
      "all"
    );
    const customCurrentMonthCells = customMonthCells.filter((cell) => cell.inCurrentMonth);
    const customMonthCapacitySummary = summarizeMonthCapacity(customCurrentMonthCells);
    const customMonthHighlights = customCurrentMonthCells.filter((cell) => cell.bookingsCount > 0);
    const weekProfessionalLookup = new Map(
      customWeekProfessionalSummaries.map((summary) => [summary.professionalId, summary] as const)
    );
    const workspaceContextItems = [
      {
        id: "period",
        label: "Periodo",
        value: describeDateWindow(
          activePaneFilters.dateFrom,
          activePaneFilters.dateTo,
          resolveDashboardRangeLabel(reportsRange)
        )
      },
      {
        id: "service",
        label: "Servico",
        value: describeLookupRange(
          activePaneFilters.serviceFrom,
          activePaneFilters.serviceTo,
          "Todos os servicos"
        )
      },
      {
        id: "professional",
        label: "Profissional",
        value: describeLookupRange(
          activePaneFilters.professionalFrom,
          activePaneFilters.professionalTo,
          "Todos os profissionais"
        )
      },
      {
        id: "return-window",
        label: "Janela de retorno",
        value: resolveClientReturnWindowLabel(activePaneFilters.returnWindow)
      },
      ...(activePaneFilters.clientQuery
        ? [
            {
              id: "client",
              label: "Cliente",
              value: activePaneFilters.clientQuery
            }
          ]
        : []),
      {
        id: "source",
        label: "Fonte",
        value: activePaneFilterCount > 0 ? "Runtime filtrado localmente" : reportsSourceLabel
      }
    ];
    const serviceLookupOptions = mapLookupOptions(serviceLookupItems);
    const professionalLookupOptions = mapLookupOptions(professionalLookupItems);
    const clientLookupOptions = mapLookupOptions(clientLookupItems);
    const serviceLookupRows = services
      .map((service) => ({
        id: service.id,
        value: buildLookupDisplay(service.nome, service.id),
        cells: [formatLookupCode(service.id), service.nome],
        searchText: `${formatLookupCode(service.id)} ${service.nome} ${service.id}`
      }))
      .sort((left, right) => left.cells[1].localeCompare(right.cells[1]));
    const professionalLookupRows = professionals
      .map((professional) => ({
        id: professional.id,
        value: buildLookupDisplay(professional.nome, professional.id),
        cells: [formatLookupCode(professional.id), professional.nome],
        searchText: `${formatLookupCode(professional.id)} ${professional.nome} ${professional.id}`
      }))
      .sort((left, right) => left.cells[1].localeCompare(right.cells[1]));
    const clientLookupRows = clients
      .map((client) => ({
        id: client.id,
        value: `${client.nome} | ${client.telefone}`,
        cells: [formatLookupCode(client.id), client.nome, client.telefone],
        searchText: `${formatLookupCode(client.id)} ${client.nome} ${client.telefone} ${client.id}`
      }))
      .sort((left, right) => left.cells[1].localeCompare(right.cells[1]));

    const lookupQuery = normalizeLookupValue(reportsLookupQuery);
    const activeLookupConfig =
      reportsLookupFieldId === "serviceFrom" || reportsLookupFieldId === "serviceTo"
        ? {
            title: "Consulta de servicos",
            description: "Selecione um servico para usar no filtro do relatorio.",
            columns: [
              { id: "code", label: "Codigo" },
              { id: "description", label: "Descricao" }
            ],
            rows: serviceLookupRows
          }
        : reportsLookupFieldId === "professionalFrom" || reportsLookupFieldId === "professionalTo"
          ? {
              title: "Consulta de profissionais",
              description: "Selecione um profissional para usar no filtro do relatorio.",
              columns: [
                { id: "code", label: "Codigo" },
                { id: "name", label: "Nome" }
              ],
              rows: professionalLookupRows
            }
          : reportsLookupFieldId === "clientQuery"
            ? {
                title: "Consulta de clientes",
                description: "Selecione um cliente pelo nome, telefone ou identificador atual.",
                columns: [
                  { id: "code", label: "Codigo" },
                  { id: "name", label: "Nome" },
                  { id: "phone", label: "Telefone" }
                ],
                rows: clientLookupRows
              }
            : null;
    const visibleLookupRows = activeLookupConfig
      ? activeLookupConfig.rows.filter((row) =>
          lookupQuery ? normalizeLookupValue(row.searchText).includes(lookupQuery) : true
        )
      : [];
    let workspacePane: ReportsWorkspacePane = {
      title: "Visao executiva",
      description: "Primeira leitura do periodo para receita, demanda, ticket e fila que ainda pede acao.",
      kpis: [
        {
          id: "recognized",
          label: "Receita reconhecida",
          value: formatCurrency(reportMetricCurrent.recognizedRevenue),
          helper: resolveReportComparisonLabel(
            reportMetricCurrent.recognizedRevenue,
            reportMetricPrevious?.recognizedRevenue ?? 0,
            "currency",
            activePaneFilterCount === 0 && reportsComparisonEnabled
          )
        },
        {
          id: "bookings",
          label: "Bookings no periodo",
          value: reportMetricCurrent.bookingsCount,
          helper: resolveReportComparisonLabel(
            reportMetricCurrent.bookingsCount,
            reportMetricPrevious?.bookingsCount ?? 0,
            "count",
            activePaneFilterCount === 0 && reportsComparisonEnabled
          )
        },
        {
          id: "ticket",
          label: "Ticket medio",
          value: formatCurrency(reportMetricCurrent.averageTicket),
          helper: `${reportMetricCurrent.completedCount} concluido(s) no recorte.`
        },
        {
          id: "clients",
          label: "Clientes unicos",
          value: reportMetricCurrent.uniqueClients,
          helper: "Base distinta atendida no periodo."
        },
        {
          id: "completed",
          label: "Concluidos",
          value: reportMetricCurrent.completedCount,
          helper: "Atendimentos finalizados."
        },
        {
          id: "open",
          label: "Em aberto",
          value: customOpenBookingCount,
          helper: "Pendentes, confirmados e aguardando pagamento."
        },
        {
          id: "noshow",
          label: "Taxa de no-show",
          value: formatPercentage(customCurrentNoShowRate),
          helper: resolveReportComparisonLabel(
            customCurrentNoShowRate,
            comparisonNoShowRate,
            "percentage",
            activePaneFilterCount === 0 && reportsComparisonEnabled
          )
        },
        {
          id: "inactive",
          label: "Sem retorno",
          value: reportRecurrenceSummary.inactiveCount,
          helper: `Janela ${resolveClientReturnWindowLabel(activePaneFilters.returnWindow)}.`
        }
      ],
      panels: [
        {
          id: "comparison",
          title: "Comparativo rapido",
          caption:
            activePaneFilterCount === 0 && reportsComparisonEnabled
              ? "Periodo anterior"
              : "Comparativo pausado por filtro detalhado",
          metricRows: [
            {
              id: "recognized",
              label: "Receita reconhecida",
              current: formatCurrency(reportMetricCurrent.recognizedRevenue),
              previous: activePaneFilterCount === 0 ? formatCurrency(reportMetricPrevious?.recognizedRevenue ?? 0) : "--"
            },
            {
              id: "bookings",
              label: "Bookings",
              current: String(reportMetricCurrent.bookingsCount),
              previous: activePaneFilterCount === 0 ? String(reportMetricPrevious?.bookingsCount ?? 0) : "--"
            },
            {
              id: "ticket",
              label: "Ticket medio",
              current: formatCurrency(reportMetricCurrent.averageTicket),
              previous: activePaneFilterCount === 0 ? formatCurrency(reportMetricPrevious?.averageTicket ?? 0) : "--"
            },
            {
              id: "online",
              label: "Entrada online aprovada",
              current: formatCurrency(reportMetricCurrent.approvedOnlineRevenue),
              previous:
                activePaneFilterCount === 0
                  ? formatCurrency(reportMetricPrevious?.approvedOnlineRevenue ?? 0)
                  : "--"
            }
          ]
        },
        {
          id: "queue",
          title: "Fila operacional",
          caption: `${customOpenBookingCount} em aberto`,
          miniCards: [
            { id: "pending", label: "Pendentes", value: pendingCount },
            { id: "awaiting", label: "Aguardando pagamento", value: awaitingPaymentCount },
            { id: "confirmed", label: "Confirmados", value: confirmedCount },
            { id: "week-open", label: "Abertos na semana", value: customWeekCapacitySummary.openBookings }
          ]
        },
        {
          id: "feed",
          title: "Movimentos recentes",
          actions: [{ label: "Abrir agenda", onClick: () => navigateTo("agenda") }],
          feed: reportRevenueFeed,
          emptyMessage: "Nenhum movimento de receita encontrado para este recorte."
        },
        {
          id: "return",
          title: "Retorno resumido",
          actions: [{ label: "Abrir clientes", onClick: () => navigateTo("clientes") }],
          miniCards: [
            { id: "returning", label: "Com retorno", value: reportRecurrenceSummary.returningCount },
            { id: "inactive", label: "Sem retorno", value: reportRecurrenceSummary.inactiveCount },
            { id: "never", label: "Nunca concluiu", value: reportRecurrenceSummary.neverCompletedCount },
            { id: "recurrence", label: "Recorrencia media", value: reportRecurrenceLabel }
          ]
        }
      ]
    };

    if (reportsWorkspaceTab === "services") {
      workspacePane = {
        title: "Receita e servicos",
        description: "Mix comercial do periodo para entender volume, receita, clientes unicos e ticket por servico.",
        panels: [
          {
            id: "services-kpis",
            title: "Resumo comercial",
            miniCards: [
              { id: "groups", label: "Grupos no recorte", value: reportServiceSummaryRows.length },
              { id: "recognized", label: "Receita reconhecida", value: formatCurrency(reportMetricCurrent.recognizedRevenue) },
              { id: "online", label: "Entrada online", value: formatCurrency(reportMetricCurrent.approvedOnlineRevenue) },
              { id: "clients", label: "Clientes unicos", value: reportMetricCurrent.uniqueClients }
            ]
          }
        ],
        tables: [
          {
            id: "services-table",
            columns: [
              { id: "service", label: "Servico" },
              { id: "bookings", label: "Bookings" },
              { id: "completed", label: "Concluidos" },
              { id: "recognized", label: "Receita" },
              { id: "online", label: "Entrada online" },
              { id: "clients", label: "Clientes" },
              { id: "ticket", label: "Ticket" }
            ],
            rows: reportServiceSummaryRows.map((entry) => ({
              id: entry.id,
              cells: [
                entry.label,
                entry.bookingsCount,
                entry.completedCount,
                formatCurrency(entry.recognizedRevenue),
                formatCurrency(entry.approvedOnlineRevenue),
                entry.uniqueClients,
                formatCurrency(entry.averageTicket)
              ]
            })),
            emptyMessage: "Nenhum servico com dados suficientes neste recorte."
          }
        ]
      };
    }

    if (reportsWorkspaceTab === "team") {
      workspacePane = {
        title: "Equipe e produtividade",
        description: "Leitura do resultado por profissional, separada da agenda operacional do dia.",
        panels: [
          {
            id: "team-kpis",
            title: "Resumo da equipe",
            miniCards: [
              { id: "people", label: "Profissionais no recorte", value: reportProfessionalSummaryRows.length },
              { id: "recognized", label: "Receita reconhecida", value: formatCurrency(reportMetricCurrent.recognizedRevenue) },
              { id: "completed", label: "Concluidos", value: reportMetricCurrent.completedCount },
              { id: "clients", label: "Clientes unicos", value: reportMetricCurrent.uniqueClients }
            ]
          }
        ],
        tables: [
          {
            id: "team-table",
            columns: [
              { id: "professional", label: "Profissional" },
              { id: "bookings", label: "Bookings" },
              { id: "completed", label: "Concluidos" },
              { id: "recognized", label: "Receita" },
              { id: "clients", label: "Clientes" },
              { id: "ticket", label: "Ticket" },
              { id: "week", label: "Radar semanal" }
            ],
            rows: reportProfessionalSummaryRows.map((entry) => ({
              id: entry.id,
              cells: [
                entry.label,
                entry.bookingsCount,
                entry.completedCount,
                formatCurrency(entry.recognizedRevenue),
                entry.uniqueClients,
                formatCurrency(entry.averageTicket),
                weekProfessionalLookup.get(entry.id)?.totalMinutes
                  ? formatUtilization(
                      weekProfessionalLookup.get(entry.id)?.bookedMinutes ?? 0,
                      weekProfessionalLookup.get(entry.id)?.totalMinutes ?? 0
                    )
                  : "n/d"
              ]
            })),
            emptyMessage: "Nenhum profissional com leitura suficiente neste recorte."
          }
        ]
      };
    }

    if (reportsWorkspaceTab === "retention") {
      workspacePane = {
        title: "Retorno e retencao",
        description: `Buckets e clientes sem retorno na janela de ${resolveClientReturnWindowLabel(activePaneFilters.returnWindow)}.`,
        actions: [{ label: "Abrir clientes", onClick: () => navigateTo("clientes") }],
        panels: [
          {
            id: "retention-kpis",
            title: "Resumo da base",
            miniCards: [
              { id: "returning", label: "Com retorno", value: reportRecurrenceSummary.returningCount },
              { id: "inactive", label: "Sem retorno", value: reportRecurrenceSummary.inactiveCount },
              { id: "never", label: "Nunca concluiu", value: reportRecurrenceSummary.neverCompletedCount },
              { id: "recurrence", label: "Recorrencia media", value: reportRecurrenceLabel }
            ]
          }
        ],
        bucketCards:
          activePaneFilterCount === 0
            ? activeClientRecurrence.returnBuckets.map((bucket) => ({
                id: bucket.id,
                label: bucket.label,
                value: bucket.clientsCount
              }))
            : undefined,
        tables: [
          {
            id: "retention-table",
            columns: [
              { id: "client", label: "Cliente" },
              { id: "origin", label: "Origem" },
              { id: "last", label: "Ultimo concluido" },
              { id: "days", label: "Dias sem retorno" },
              { id: "revenue", label: "Receita" },
              { id: "recurrence", label: "Recorrencia" }
            ],
            rows: reportRecurrenceInactiveRows.map((entry) => ({
              id: entry.client.id,
              cells: [
                entry.client.nome,
                entry.client.origem || "n/d",
                entry.lastCompletedBooking ? formatDateTime(entry.lastCompletedBooking.endAt) : "Nunca",
                entry.lastCompletedBooking ? calculateDaysSinceIso(entry.lastCompletedBooking.endAt) : "n/d",
                formatCurrency(entry.recognizedRevenue),
                "n/d"
              ]
            })),
            emptyMessage: `Nenhum cliente sem retorno identificado em ${resolveClientReturnWindowLabel(activePaneFilters.returnWindow)}.`
          }
        ]
      };
    }

    if (reportsWorkspaceTab === "week") {
      workspacePane = {
        title: "Radar semanal",
        description: "Capacidade e ocupacao da semana para redistribuir carga sem abrir a agenda diaria.",
        actions: [
          {
            label: "Abrir agenda",
            onClick: () => {
              setAgendaWorkspaceTab("calendar");
              setAgendaViewMode("week");
              navigateTo("agenda");
            }
          }
        ],
        panels: [
          {
            id: "week-kpis",
            title: "Resumo semanal",
            miniCards: [
              { id: "capacity", label: "Capacidade total", value: formatMinutesAsHours(customWeekCapacitySummary.totalMinutes) },
              { id: "booked", label: "Horas ocupadas", value: formatMinutesAsHours(customWeekCapacitySummary.bookedMinutes) },
              { id: "free", label: "Horas livres", value: formatMinutesAsHours(customWeekCapacitySummary.freeMinutes) },
              { id: "open", label: "Em aberto", value: customWeekCapacitySummary.openBookings }
            ]
          }
        ],
        tables: [
          {
            id: "week-days",
            title: "Dia a dia",
            columns: [
              { id: "day", label: "Dia" },
              { id: "bookings", label: "Bookings" },
              { id: "occupancy", label: "Ocupacao" },
              { id: "occupied", label: "Horas ocupadas" },
              { id: "total", label: "Capacidade" },
              { id: "open", label: "Em aberto" }
            ],
            rows: customWeekDaySummaries.map((summary) => ({
              id: summary.date,
              cells: [
                formatAgendaDayLabel(summary.date),
                summary.bookingsCount,
                summary.totalMinutes > 0 ? formatUtilization(summary.bookedMinutes, summary.totalMinutes) : "Sem capacidade",
                formatMinutesAsHours(summary.bookedMinutes),
                formatMinutesAsHours(summary.totalMinutes),
                summary.openBookings
              ]
            })),
            emptyMessage: "Nenhum dado semanal encontrado."
          },
          {
            id: "week-team",
            title: "Equipe na semana",
            columns: [
              { id: "professional", label: "Profissional" },
              { id: "bookings", label: "Bookings" },
              { id: "occupancy", label: "Ocupacao" },
              { id: "occupied", label: "Horas ocupadas" },
              { id: "total", label: "Capacidade" },
              { id: "open", label: "Em aberto" }
            ],
            rows: customWeekProfessionalSummaries.map((summary) => ({
              id: summary.professionalId,
              cells: [
                summary.professionalName,
                summary.bookingsCount,
                summary.totalMinutes > 0 ? formatUtilization(summary.bookedMinutes, summary.totalMinutes) : "Sem capacidade",
                formatMinutesAsHours(summary.bookedMinutes),
                formatMinutesAsHours(summary.totalMinutes),
                summary.openBookings
              ]
            })),
            emptyMessage: "Nenhum profissional publicado para montar o radar semanal."
          }
        ]
      };
    }

    if (reportsWorkspaceTab === "month") {
      workspacePane = {
        title: "Visao mensal",
        description: "Concentrado do mes para capacidade, sazonalidade e dias que concentraram mais carga.",
        actions: [
          {
            label: "Abrir agenda",
            onClick: () => {
              setAgendaWorkspaceTab("calendar");
              setAgendaViewMode("month");
              navigateTo("agenda");
            }
          }
        ],
        panels: [
          {
            id: "month-kpis",
            title: "Resumo do mes",
            miniCards: [
              { id: "bookings", label: "Bookings no mes", value: customMonthCapacitySummary.bookingsCount },
              { id: "booked", label: "Horas ocupadas", value: formatMinutesAsHours(customMonthCapacitySummary.bookedMinutes) },
              { id: "free", label: "Horas livres", value: formatMinutesAsHours(customMonthCapacitySummary.freeMinutes) },
              { id: "open", label: "Em aberto", value: customMonthCapacitySummary.openBookings }
            ]
          }
        ],
        tables: [
          {
            id: "month-table",
            columns: [
              { id: "day", label: "Dia" },
              { id: "bookings", label: "Bookings" },
              { id: "occupancy", label: "Ocupacao" },
              { id: "open", label: "Em aberto" },
              { id: "completed", label: "Concluidos" },
              { id: "load", label: "Carga" }
            ],
            rows: customMonthHighlights.slice(0, 12).map((cell) => ({
              id: cell.date,
              cells: [
                formatAgendaDayLabel(cell.date),
                cell.bookingsCount,
                cell.totalMinutes > 0 ? formatUtilization(cell.bookedMinutes, cell.totalMinutes) : "Sem capacidade",
                cell.openBookings,
                cell.completedBookings,
                cell.totalMinutes > 0
                  ? `${formatMinutesAsHours(cell.bookedMinutes)} de ${formatMinutesAsHours(cell.totalMinutes)}`
                  : "Sem disponibilidade"
              ]
            })),
            emptyMessage: `Nenhum movimento encontrado em ${formatAgendaMonthLabel(reportsInsightAnchorDate)}.`
          }
        ]
      };
    }

    if (reportsWorkspaceTab === "operations") {
      workspacePane = {
        title: "Pendencias operacionais",
        description: "Fila que ainda exige tratamento, separada da leitura gerencial pura.",
        actions: [
          { label: "Operacao diaria", onClick: () => navigateTo("operacional") },
          { label: "Abrir agenda", onClick: () => navigateTo("agenda") }
        ],
        panels: [
          {
            id: "operations-kpis",
            title: "Fila do periodo",
            miniCards: [
              { id: "pending", label: "Pendentes", value: pendingCount },
              { id: "awaiting", label: "Aguardando pagamento", value: awaitingPaymentCount },
              { id: "confirmed", label: "Confirmados", value: confirmedCount },
              { id: "open", label: "Em aberto", value: customOpenBookingCount }
            ]
          }
        ],
        tables: [
          {
            id: "operations-table",
            columns: [
              { id: "datetime", label: "Horario" },
              { id: "client", label: "Cliente" },
              { id: "service", label: "Servico" },
              { id: "professional", label: "Profissional" },
              { id: "status", label: "Status" },
              { id: "payment", label: "Pagamento" }
            ],
            rows: operationalQueue.map((booking) => ({
              id: booking.id,
              cells: [
                formatDateTime(booking.startAt),
                resolveClientName(booking.clientId, clients),
                resolveServiceName(booking.serviceId, services),
                resolveProfessionalName(booking.professionalId, professionals),
                formatBookingStatus(booking.status),
                paymentIntentByBookingId.get(booking.id)
                  ? formatPaymentIntentStatus(paymentIntentByBookingId.get(booking.id)!.status)
                  : "Sem payment intent"
              ]
            })),
            emptyMessage: "Nenhuma pendencia operacional ativa neste recorte."
          }
        ]
      };
    }

    const activeFilterDraft = reportsFilterDraft ?? activePaneFilters;
    const filterModalFields: ReportsWorkspaceFilterField[] = [];
    const supportsDateRange =
      reportsWorkspaceTab === "overview" ||
      reportsWorkspaceTab === "services" ||
      reportsWorkspaceTab === "team" ||
      reportsWorkspaceTab === "retention" ||
      reportsWorkspaceTab === "operations";

    if (supportsDateRange) {
      filterModalFields.push(
        {
          id: "dateFrom",
          type: "date",
          label: "Data de",
          value: activeFilterDraft.dateFrom
        },
        {
          id: "dateTo",
          type: "date",
          label: "Ate data",
          value: activeFilterDraft.dateTo
        }
      );
    }

    filterModalFields.push(
      {
        id: "serviceFrom",
        type: "lookup",
        label: "Do servico",
        value: activeFilterDraft.serviceFrom,
        placeholder: "Nome ou codigo",
        options: serviceLookupOptions
      },
      {
        id: "serviceTo",
        type: "lookup",
        label: "Ate o servico",
        value: activeFilterDraft.serviceTo,
        placeholder: "Nome ou codigo",
        options: serviceLookupOptions
      },
      {
        id: "professionalFrom",
        type: "lookup",
        label: "Do profissional",
        value: activeFilterDraft.professionalFrom,
        placeholder: "Nome ou codigo",
        options: professionalLookupOptions
      },
      {
        id: "professionalTo",
        type: "lookup",
        label: "Ate o profissional",
        value: activeFilterDraft.professionalTo,
        placeholder: "Nome ou codigo",
        options: professionalLookupOptions
      }
    );

    if (reportsWorkspaceTab === "overview" || reportsWorkspaceTab === "retention") {
      filterModalFields.push({
        id: "returnWindow",
        type: "select",
        label: "Janela de retorno",
        value: activeFilterDraft.returnWindow,
        options: [
          { value: "30d", label: "30 dias" },
          { value: "60d", label: "60 dias" },
          { value: "90d", label: "90 dias" }
        ]
      });
    }

    if (reportsWorkspaceTab === "retention" || reportsWorkspaceTab === "operations") {
      filterModalFields.push({
        id: "clientQuery",
        type: "lookup",
        label: "Cliente",
        value: activeFilterDraft.clientQuery,
        placeholder: "Nome ou telefone",
        options: clientLookupOptions
      });
    }

    const filterModal = {
      appliedCount: activePaneFilterCount,
      fields: filterModalFields,
      isOpen: isReportsFilterModalOpen,
      lookupDialog: {
        columns: activeLookupConfig?.columns ?? [],
        description: activeLookupConfig?.description ?? "Consulta padrao do filtro atual.",
        emptyMessage: "Nenhum registro encontrado para a busca informada.",
        isOpen: Boolean(reportsLookupFieldId && activeLookupConfig),
        onClose: closeReportsLookup,
        onOpen: openReportsLookup,
        onQueryChange: setReportsLookupQuery,
        onSelect: selectReportsLookupValue,
        query: reportsLookupQuery,
        rows: visibleLookupRows,
        title: activeLookupConfig?.title ?? "Consulta"
      },
      onApply: applyReportsFilterDraft,
      onChangeField: updateReportsFilterDraft,
      onClear: clearReportsFilters,
      onClose: closeReportsFilterModal,
      onOpen: openReportsFilterModal,
      title: `Filtros | ${workspaceMeta.label}`
    } as const;

    return (
      <ReportsWorkspace
        activeMeta={workspaceMeta}
        activeTab={reportsWorkspaceTab}
        contextItems={workspaceContextItems}
        error={reportsReadModelError}
        filterModal={filterModal}
        isContextVisible={isReportsContextVisible}
        isLoading={isLoadingReportsReadModel}
        isMenuOpen={isReportsMenuOpen}
        menuGroups={workspaceGroups}
        onActivateTab={setReportsWorkspaceTab}
        onCloseTab={closeReportsWorkspaceTab}
        onCloseMenu={() => setIsReportsMenuOpen(false)}
        onOpenMenu={() => setIsReportsMenuOpen(true)}
        onOpenTab={openReportsWorkspaceTab}
        onToggleContext={() => setIsReportsContextVisible((current) => !current)}
        onToggleMenu={() => setIsReportsMenuOpen((current) => !current)}
        openTabs={reportsOpenTabs.filter((tab) => tab !== "agenda")}
        pane={workspacePane}
        showMenuButton={isCompactShell}
      />
    );

    return (
      <DocumentViewLayout
        className="reports-document-view"
        eyebrow="Relatorios"
        title="Leitura gerencial"
        subtitle="Receita, equipe, retorno e capacidade por recorte."
        statusBadge={
          <ViewBadge tone={reportsComparisonEnabled ? "success" : "neutral"}>
            {reportsComparisonEnabled ? "Comparativo ativo" : "Historico total"}
          </ViewBadge>
        }
        pageActions={
          <div className="dashboard-document-actions">
            <div className="mode-switch">
              <button
                className={reportsRange === "7d" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setReportsRange("7d")}
                type="button"
              >
                7 dias
              </button>
              <button
                className={reportsRange === "30d" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setReportsRange("30d")}
                type="button"
              >
                30 dias
              </button>
              <button
                className={reportsRange === "all" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setReportsRange("all")}
                type="button"
              >
                Tudo
              </button>
            </div>
            <label className="dashboard-select">
              <span>Servico</span>
              <select onChange={(event) => setReportsServiceFilter(event.target.value)} value={reportsServiceFilter}>
                <option value="all">Todos os servicos</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-select">
              <span>Profissional</span>
              <select
                onChange={(event) => setReportsProfessionalFilter(event.target.value)}
                value={reportsProfessionalFilter}
              >
                <option value="all">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-select">
              <span>Janela de retorno</span>
              <select
                onChange={(event) => setClientReturnWindow(event.target.value as ClientReturnWindow)}
                value={clientReturnWindow}
              >
                <option value="30d">30 dias</option>
                <option value="60d">60 dias</option>
                <option value="90d">90 dias</option>
              </select>
            </label>
            <button
              className="secondary-button"
              onClick={() => setIsReportsContextVisible((current) => !current)}
              type="button"
            >
              {isReportsContextVisible ? "Ocultar contexto" : "Contexto"}
            </button>
          </div>
        }
        header={null}
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "recognized",
                label: "Receita reconhecida",
                value: formatCurrency(activeReportCurrent.recognizedRevenue),
                helper: resolveReportComparisonLabel(
                  activeReportCurrent.recognizedRevenue,
                  activeReportPrevious?.recognizedRevenue ?? 0,
                  "currency",
                  reportsComparisonEnabled
                ),
                tone: "success"
              },
              {
                id: "bookings",
                label: "Bookings no periodo",
                value: activeReportCurrent.bookingsCount,
                helper: resolveReportComparisonLabel(
                  activeReportCurrent.bookingsCount,
                  activeReportPrevious?.bookingsCount ?? 0,
                  "count",
                  reportsComparisonEnabled
                ),
                tone: "info"
              },
              {
                id: "ticket",
                label: "Ticket medio",
                value: formatCurrency(activeReportCurrent.averageTicket),
                helper: `${activeReportCurrent.completedCount} atendimento(s) concluidos.`,
                tone: "success"
              },
              {
                id: "clients",
                label: "Clientes unicos",
                value: activeReportCurrent.uniqueClients,
                helper: "Base distinta atendida no recorte.",
                tone: "info"
              }
            ]}
          />
        }
        tabs={
          <div aria-label="Visoes dos relatorios" className="dashboard-tabbar" role="tablist">
            {reportsWorkspaceTabs.map((tab) => (
              <button
                aria-selected={reportsWorkspaceTab === tab.id}
                className={reportsWorkspaceTab === tab.id ? "dashboard-tab-button is-active" : "dashboard-tab-button"}
                key={tab.id}
                onClick={() => setReportsWorkspaceTab(tab.id)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
                <small>{tab.helper}</small>
              </button>
            ))}
          </div>
        }
        items={
          <>
            {isLoadingReportsReadModel ? (
              <div className="feedback-banner is-info">Atualizando read model de relatorios...</div>
            ) : null}
            {reportsReadModelError ? (
              <div className="feedback-banner is-error">{reportsReadModelError}</div>
            ) : null}
            {isReportsContextVisible ? (
              <DocumentHeader
                className="reports-context-header"
                fields={[
                  { id: "range", label: "Periodo", value: resolveDashboardRangeLabel(reportsRange) },
                  { id: "service", label: "Servico", value: selectedReportService?.nome ?? "Todos os servicos" },
                  {
                    id: "professional",
                    label: "Profissional",
                    value: selectedReportProfessional?.nome ?? "Todos os profissionais"
                  },
                  {
                    id: "window",
                    label: "Janela de retorno",
                    value: resolveClientReturnWindowLabel(activeClientRecurrence.window)
                  },
                  {
                    id: "comparison",
                    label: "Comparativo",
                    value: reportsComparisonEnabled ? "Periodo anterior" : "Indisponivel"
                  },
                  { id: "source", label: "Fonte", value: reportsSourceLabel }
                ]}
              />
            ) : null}

            {reportsWorkspaceTab === "overview" ? (
              <div className="reports-workspace-stack">
                <EntitySection
                  title="Saude do periodo"
                  description="Leitura executiva para receita, demanda e risco do recorte."
                >
                  <DocumentSummaryCards
                    metrics={[
                      {
                        id: "completed",
                        label: "Concluidos",
                        value: activeReportCurrent.completedCount,
                        helper: "Atendimentos finalizados no recorte.",
                        tone: "success"
                      },
                      {
                        id: "open",
                        label: "Em aberto",
                        value: reportOpenBookings,
                        helper: "Pendentes, confirmados e aguardando pagamento.",
                        tone: "warning"
                      },
                      {
                        id: "online",
                        label: "Entrada online",
                        value: formatCurrency(activeReportCurrent.approvedOnlineRevenue),
                        helper: resolveReportComparisonLabel(
                          activeReportCurrent.approvedOnlineRevenue,
                          activeReportPrevious?.approvedOnlineRevenue ?? 0,
                          "currency",
                          reportsComparisonEnabled
                        ),
                        tone: "info"
                      },
                      {
                        id: "no-show",
                        label: "Taxa de no-show",
                        value: formatPercentage(currentNoShowRate),
                        helper: resolveReportComparisonLabel(
                          currentNoShowRate,
                          previousNoShowRate,
                          "percentage",
                          reportsComparisonEnabled
                        ),
                        tone: "danger"
                      }
                    ]}
                  />
                </EntitySection>

                <EntitySection
                  title="Retencao no recorte"
                  description="Resumo da base sem abrir a rota de clientes."
                  actions={
                    <button className="secondary-button" onClick={() => navigateTo("clientes")} type="button">
                      Abrir clientes
                    </button>
                  }
                >
                  <DocumentSummaryCards
                    metrics={[
                      {
                        id: "returning",
                        label: "Com retorno",
                        value: activeClientRecurrence.returningCount,
                        helper: "Clientes com ultimo concluido dentro da janela.",
                        tone: "success"
                      },
                      {
                        id: "inactive",
                        label: "Sem retorno",
                        value: activeClientRecurrence.inactiveCount,
                        helper: `Nao voltaram em ${resolveClientReturnWindowLabel(activeClientRecurrence.window)}.`,
                        tone: "warning"
                      },
                      {
                        id: "never",
                        label: "Nunca concluiu",
                        value: activeClientRecurrence.neverCompletedCount,
                        helper: "Entraram na base sem atendimento concluido."
                      },
                      {
                        id: "recurrence",
                        label: "Recorrencia media",
                        value: recurrenceAverageLabel,
                        helper: "Media simples entre atendimentos concluidos.",
                        tone: "info"
                      }
                    ]}
                  />
                </EntitySection>
              </div>
            ) : reportsWorkspaceTab === "services" ? (
              <EntitySection
                title="Servicos no recorte"
                description="Receita, volume, clientes unicos e ticket por servico."
              >
                <div className="records-column">
                  {activeReportServiceSummaries.length ? (
                    activeReportServiceSummaries.map((entry) => (
                      <article className="record-card" key={entry.id}>
                        <div className="record-card-header">
                          <div className="record-stack">
                            <strong>{entry.label}</strong>
                            <span>{entry.bookingsCount} booking(s) no periodo</span>
                          </div>
                          <span className="status-pill is-success">{formatCurrency(entry.recognizedRevenue)}</span>
                        </div>
                        <div className="record-meta">
                          <span>Concluidos {entry.completedCount}</span>
                          <span>Clientes unicos {entry.uniqueClients}</span>
                          <span className="status-pill is-neutral">Ticket {formatCurrency(entry.averageTicket)}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">Nenhum servico com dado suficiente neste recorte.</p>
                  )}
                </div>
              </EntitySection>
            ) : reportsWorkspaceTab === "team" ? (
              <EntitySection
                title="Equipe no recorte"
                description="Performance da equipe com o mesmo filtro aplicado ao modulo."
              >
                <div className="records-column">
                  {activeReportProfessionalSummaries.length ? (
                    activeReportProfessionalSummaries.map((entry) => (
                      <article className="record-card" key={entry.id}>
                        <div className="record-card-header">
                          <div className="record-stack">
                            <strong>{entry.label}</strong>
                            <span>{entry.bookingsCount} booking(s) no periodo</span>
                          </div>
                          <span className="status-pill is-success">{formatCurrency(entry.recognizedRevenue)}</span>
                        </div>
                        <div className="record-meta">
                          <span>Concluidos {entry.completedCount}</span>
                          <span>Clientes unicos {entry.uniqueClients}</span>
                          <span className="status-pill is-neutral">Ticket {formatCurrency(entry.averageTicket)}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="empty-state">Nenhum profissional com dado suficiente neste recorte.</p>
                  )}
                </div>
              </EntitySection>
            ) : reportsWorkspaceTab === "retention" ? (
              <EntitySection
                title="Retorno da base real"
                description={`Buckets e clientes sem retorno na janela de ${resolveClientReturnWindowLabel(activeClientRecurrence.window)}.`}
                actions={
                  <button className="secondary-button" onClick={() => navigateTo("clientes")} type="button">
                    Abrir clientes
                  </button>
                }
              >
                <div className="dashboard-retention-preview">
                  <DocumentSummaryCards
                    metrics={[
                      {
                        id: "returning",
                        label: "Com retorno",
                        value: activeClientRecurrence.returningCount,
                        helper: "Clientes com ultimo concluido dentro da janela.",
                        tone: "success"
                      },
                      {
                        id: "inactive",
                        label: "Sem retorno",
                        value: activeClientRecurrence.inactiveCount,
                        helper: `Nao voltaram em ${resolveClientReturnWindowLabel(activeClientRecurrence.window)}.`,
                        tone: "warning"
                      },
                      {
                        id: "never",
                        label: "Nunca concluiu",
                        value: activeClientRecurrence.neverCompletedCount,
                        helper: "Entraram na base sem atendimento concluido."
                      },
                      {
                        id: "recurrence",
                        label: "Recorrencia media",
                        value: recurrenceAverageLabel,
                        helper: "Media simples entre atendimentos concluidos.",
                        tone: "info"
                      }
                    ]}
                  />

                  {activeClientRecurrence.returnBuckets.length ? (
                    <div className="dashboard-mini-grid">
                      {activeClientRecurrence.returnBuckets.map((bucket) => (
                        <div className="dashboard-mini-card" key={bucket.id}>
                          <strong>{bucket.label}</strong>
                          <span>{bucket.clientsCount} cliente(s) neste bucket.</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-state">Buckets de retorno ainda nao disponiveis neste recorte.</p>
                  )}

                  <div className="records-column">
                    {activeClientRecurrence.inactiveClients.length ? (
                      activeClientRecurrence.inactiveClients.map((entry) => (
                        <article className="record-card" key={entry.clientId}>
                          <div className="record-card-header">
                            <div className="record-stack">
                              <strong>{entry.nome}</strong>
                              <span>{entry.email || "Sem e-mail cadastrado"}</span>
                            </div>
                            <span className="status-pill is-warning">
                              {formatClientSegment("inactive", activeClientRecurrence.window)}
                            </span>
                          </div>
                          <div className="record-meta">
                            <span>
                              Ultimo atendimento {entry.lastCompletedAt ? formatDateTime(entry.lastCompletedAt) : "nunca"}
                            </span>
                            <span>Receita derivada {formatCurrency(entry.recognizedRevenue)}</span>
                            <span>
                              Recorrencia media{" "}
                              {entry.averageRecurrenceDays === null
                                ? "n/d"
                                : `${Math.round(entry.averageRecurrenceDays)} dias`}
                            </span>
                          </div>
                        </article>
                      ))
                    ) : (
                      <p className="empty-state">
                        Nenhum cliente sem retorno identificado na janela de{" "}
                        {resolveClientReturnWindowLabel(activeClientRecurrence.window)}.
                      </p>
                    )}
                  </div>
                </div>
              </EntitySection>
            ) : reportsWorkspaceTab === "agenda" ? (
              <div className="reports-insights-stack">
                <div aria-label="Visoes da agenda em relatorios" className="dashboard-tabbar agenda-subtabbar" role="tablist">
                  {reportsAgendaTabs.map((tab) => (
                    <button
                      aria-selected={reportsAgendaWorkspaceTab === tab.id}
                      className={reportsAgendaWorkspaceTab === tab.id ? "dashboard-tab-button is-active" : "dashboard-tab-button"}
                      key={tab.id}
                      onClick={() => setReportsAgendaWorkspaceTab(tab.id)}
                      role="tab"
                      type="button"
                    >
                      <span>{tab.label}</span>
                      <small>{tab.helper}</small>
                    </button>
                  ))}
                </div>

                {reportsAgendaWorkspaceTab === "week" ? (
                  <EntitySection
                    title="Radar semanal da agenda"
                    description="Leitura gerencial de capacidade e ocupacao, separada da acao operacional do dia."
                    actions={
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setAgendaWorkspaceTab("calendar");
                          setAgendaViewMode("week");
                          navigateTo("agenda");
                        }}
                        type="button"
                      >
                        Abrir agenda
                      </button>
                    }
                  >
                    <div className="reports-insights-stack">
                      {isLoadingWeeklyAvailability ? (
                        <p className="helper">Carregando disponibilidade semanal da equipe...</p>
                      ) : null}

                      <DocumentSummaryCards
                        metrics={[
                          {
                            id: "week-total",
                            label: "Capacidade total",
                            value: formatMinutesAsHours(reportsInsightWeekCapacitySummary.totalMinutes),
                            helper: `${reportsInsightWeekDates.length} dia(s) no radar.`,
                            tone: "info"
                          },
                          {
                            id: "week-booked",
                            label: "Horas ocupadas",
                            value: formatMinutesAsHours(reportsInsightWeekCapacitySummary.bookedMinutes),
                            helper: `${reportsInsightWeekCapacitySummary.bookingsCount} booking(s) na semana.`,
                            tone: "success"
                          },
                          {
                            id: "week-free",
                            label: "Horas livres",
                            value: formatMinutesAsHours(reportsInsightWeekCapacitySummary.freeMinutes),
                            helper:
                              reportsInsightWeekCapacitySummary.totalMinutes > 0
                                ? `${formatUtilization(reportsInsightWeekCapacitySummary.bookedMinutes, reportsInsightWeekCapacitySummary.totalMinutes)} de ocupacao.`
                                : "Sem disponibilidade publicada.",
                            tone: "warning"
                          },
                          {
                            id: "week-open",
                            label: "Em aberto",
                            value: reportsInsightWeekCapacitySummary.openBookings,
                            helper: "Confirmados, pendentes e aguardando pagamento."
                          }
                        ]}
                      />

                      <div className="workspace-grid">
                        <EntitySection
                          title="Dia a dia"
                          description="Carga por data para orientar distribuicao e remanejamento."
                        >
                          <div className="records-column">
                            {reportsInsightWeekDaySummaries.map((summary) => (
                              <article className="record-card" key={summary.date}>
                                <div className="record-card-header">
                                  <div className="record-stack">
                                    <strong>{formatAgendaDayLabel(summary.date)}</strong>
                                    <span>{summary.bookingsCount} booking(s) na data</span>
                                  </div>
                                  <span className={`status-pill is-${resolveUtilizationTone(summary.bookedMinutes, summary.totalMinutes)}`}>
                                    {summary.totalMinutes > 0
                                      ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                                      : "Sem capacidade"}
                                  </span>
                                </div>
                                <div className="record-meta">
                                  <span>{formatMinutesAsHours(summary.bookedMinutes)} ocupadas</span>
                                  <span>{formatMinutesAsHours(summary.totalMinutes)} totais</span>
                                  <span>{summary.openBookings} em aberto</span>
                                </div>
                              </article>
                            ))}
                          </div>
                        </EntitySection>

                        <EntitySection
                          title="Equipe na semana"
                          description="Distribuicao por profissional no mesmo radar."
                        >
                          <div className="records-column">
                            {reportsInsightWeekProfessionalSummaries.length ? (
                              reportsInsightWeekProfessionalSummaries.map((summary) => (
                                <article className="record-card" key={summary.professionalId}>
                                  <div className="record-card-header">
                                    <div className="record-stack">
                                      <strong>{summary.professionalName}</strong>
                                      <span>{summary.bookingsCount} booking(s) na semana</span>
                                    </div>
                                    <span className={`status-pill is-${resolveUtilizationTone(summary.bookedMinutes, summary.totalMinutes)}`}>
                                      {summary.totalMinutes > 0
                                        ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                                        : "Sem capacidade"}
                                    </span>
                                  </div>
                                  <div className="record-meta">
                                    <span>{formatMinutesAsHours(summary.bookedMinutes)} ocupadas</span>
                                    <span>{formatMinutesAsHours(summary.totalMinutes)} totais</span>
                                    <span>{summary.openBookings} em aberto</span>
                                  </div>
                                </article>
                              ))
                            ) : (
                              <p className="empty-state">Nenhum profissional publicado para montar o radar semanal.</p>
                            )}
                          </div>
                        </EntitySection>
                      </div>
                    </div>
                  </EntitySection>
                ) : (
                  <EntitySection
                    title="Visao mensal"
                    description="Concentrado mensal para leitura gerencial, sem competir com a agenda operacional."
                    actions={
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setAgendaWorkspaceTab("calendar");
                          setAgendaViewMode("month");
                          navigateTo("agenda");
                        }}
                        type="button"
                      >
                        Abrir agenda
                      </button>
                    }
                  >
                    <div className="reports-insights-stack">
                      <DocumentSummaryCards
                        metrics={[
                          {
                            id: "month-bookings",
                            label: "Bookings no mes",
                            value: reportsInsightMonthCapacitySummary.bookingsCount,
                            helper: formatAgendaMonthLabel(reportsInsightAnchorDate),
                            tone: "info"
                          },
                          {
                            id: "month-booked",
                            label: "Horas ocupadas",
                            value: formatMinutesAsHours(reportsInsightMonthCapacitySummary.bookedMinutes),
                            helper: `${reportsInsightMonthHighlights.length} dia(s) com movimento.`,
                            tone: "success"
                          },
                          {
                            id: "month-free",
                            label: "Horas livres",
                            value: formatMinutesAsHours(reportsInsightMonthCapacitySummary.freeMinutes),
                            helper:
                              reportsInsightMonthCapacitySummary.totalMinutes > 0
                                ? `${formatUtilization(reportsInsightMonthCapacitySummary.bookedMinutes, reportsInsightMonthCapacitySummary.totalMinutes)} de ocupacao.`
                                : "Sem disponibilidade publicada.",
                            tone: "warning"
                          },
                          {
                            id: "month-open",
                            label: "Em aberto",
                            value: reportsInsightMonthCapacitySummary.openBookings,
                            helper: "Pendencias concentradas no mes atual."
                          }
                        ]}
                      />

                      {reportsInsightMonthHighlights.length ? (
                        <div className="records-column">
                          {reportsInsightMonthHighlights.slice(0, 8).map((cell) => (
                            <article className="record-card" key={cell.date}>
                              <div className="record-card-header">
                                <div className="record-stack">
                                  <strong>{formatAgendaDayLabel(cell.date)}</strong>
                                  <span>{cell.bookingsCount} booking(s) no dia</span>
                                </div>
                                <span className={`status-pill is-${resolveUtilizationTone(cell.bookedMinutes, cell.totalMinutes)}`}>
                                  {cell.totalMinutes > 0
                                    ? `${formatUtilization(cell.bookedMinutes, cell.totalMinutes)} ocupacao`
                                    : "Sem capacidade"}
                                </span>
                              </div>
                              <div className="record-meta">
                                <span>{cell.openBookings} em aberto</span>
                                <span>{cell.completedBookings} concluidos</span>
                                <span>
                                  {cell.totalMinutes > 0
                                    ? `${formatMinutesAsHours(cell.bookedMinutes)} de ${formatMinutesAsHours(cell.totalMinutes)}`
                                    : "Sem disponibilidade"}
                                </span>
                              </div>
                            </article>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-state">Nenhum movimento encontrado no mes corrente para este filtro.</p>
                      )}
                    </div>
                  </EntitySection>
                )}
              </div>
            ) : null}
          </>
        }
      />
    );
  }

  function renderProfessionalsView(): JSX.Element {
    return renderProfessionalsPanel();
  }

  function renderClientsView(): JSX.Element {
    return (
      <MasterDetailLayout
        className="clients-master-detail"
        eyebrow="Clientes e CRM"
        title="Carteira e retorno da base real"
        subtitle="Carteira formada pelos agendamentos, com leitura de retorno, historico e receita para a operacao."
        toolbar={
          <div className="clients-toolbar">
            <label className="dashboard-select">
              <span>Janela</span>
              <select
                onChange={(event) => setClientReturnWindow(event.target.value as ClientReturnWindow)}
                value={clientReturnWindow}
              >
                <option value="30d">30 dias</option>
                <option value="60d">60 dias</option>
                <option value="90d">90 dias</option>
              </select>
            </label>

            <div className="mode-switch">
              <button
                className={clientSegmentFilter === "all" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setClientSegmentFilter("all")}
                type="button"
              >
                Todos
              </button>
              <button
                className={clientSegmentFilter === "returning" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setClientSegmentFilter("returning")}
                type="button"
              >
                Retorno
              </button>
              <button
                className={clientSegmentFilter === "inactive" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setClientSegmentFilter("inactive")}
                type="button"
              >
                Sem retorno
              </button>
              <button
                className={clientSegmentFilter === "never_completed" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setClientSegmentFilter("never_completed")}
                type="button"
              >
                Nunca concluiu
              </button>
            </div>
          </div>
        }
        masterTitle="Carteira no recorte atual"
        masterDescription={`Janela de retorno ${resolveClientReturnWindowLabel(clientReturnWindow)} com ${filteredClientInsights.length} cliente(s) no filtro ativo.`}
        master={
          <>
            <div className="record-meta">
              <span className="helper-chip">Base formada por agendamentos</span>
              <span className="status-pill is-neutral">
                {clientInsights.length} cliente(s) na base total
              </span>
            </div>

            <DocumentSummaryCards
              className="client-summary-metrics"
              metrics={[
                {
                  id: "returning",
                  label: "Retorno recente",
                  value: clientPortfolioSummary.returningCount,
                  helper: "Clientes com ultimo concluido dentro da janela.",
                  tone: "success"
                },
                {
                  id: "inactive",
                  label: "Sem retorno",
                  value: clientPortfolioSummary.inactiveCount,
                  helper: `Nao voltaram em ${resolveClientReturnWindowLabel(clientReturnWindow)}.`,
                  tone: "warning"
                },
                {
                  id: "never-completed",
                  label: "Nunca concluiu",
                  value: clientPortfolioSummary.neverCompletedCount,
                  helper: "Entraram na base sem atendimento concluido."
                },
                {
                  id: "recognized-revenue",
                  label: "Receita derivada",
                  value: formatCurrency(
                    clientInsights.reduce((total, entry) => total + entry.recognizedRevenue, 0)
                  ),
                  helper: "Soma da receita registrada por cliente.",
                  tone: "info"
                }
              ]}
            />

            <div className="records-column clients-record-list">
              {renderClientRecords(filteredClientInsights)}
            </div>
          </>
        }
        detailTitle={selectedClientInsight ? selectedClientInsight.client.nome : "Nenhum cliente selecionado"}
        detailDescription={
          selectedClientInsight ?
            `${formatClientSegment(resolveClientSegment(selectedClientInsight, clientReturnWindow), clientReturnWindow)} com historico recente, receita registrada e contexto de relacionamento para a operacao.`
          : "Selecione um cliente da carteira para abrir o detalhe operacional."
        }
        detail={selectedClientInsight ? renderSelectedClientDetail() : undefined}
        emptyDetail={<p className="empty-state">Selecione um cliente da carteira para abrir o detalhe operacional.</p>}
      />
    );
  }

  function renderSelectedClientDetail(): JSX.Element {
    if (!selectedClientInsight) {
      return <></>;
    }

    const segment = resolveClientSegment(selectedClientInsight, clientReturnWindow);

    return (
      <div className="client-detail-document">
        <div className="record-meta">
          <ViewBadge tone={resolveClientSegmentTone(segment)}>
            {formatClientSegment(segment, clientReturnWindow)}
          </ViewBadge>
          <ViewBadge tone="info">{selectedClientInsight.totalBookings} booking(s)</ViewBadge>
          <span className="status-pill is-neutral">
            Origem {selectedClientInsight.client.origem}
          </span>
        </div>

        <DocumentHeader
          fields={[
            {
              id: "email",
              label: "E-mail",
              value: selectedClientInsight.client.email
            },
            {
              id: "phone",
              label: "Telefone",
              value: selectedClientInsight.client.telefone || "Sem telefone"
            },
            {
              id: "last-booking",
              label: "Ultimo movimento",
              value: selectedClientInsight.lastBooking ?
                formatDateTime(selectedClientInsight.lastBooking.startAt)
              : "Sem booking"
            },
            {
              id: "last-completed",
              label: "Ultimo concluido",
              value: selectedClientInsight.lastCompletedBooking ?
                formatDateTime(selectedClientInsight.lastCompletedBooking.endAt)
              : "Nunca concluiu"
            }
          ]}
        />

        <DocumentSummaryCards
          metrics={[
            {
              id: "segment",
              label: "Segmento",
              value: formatClientSegment(segment, clientReturnWindow),
              helper: `Janela atual ${resolveClientReturnWindowLabel(clientReturnWindow)}.`,
              tone:
                segment === "returning"
                  ? "success"
                  : segment === "inactive"
                    ? "warning"
                    : undefined
            },
            {
              id: "recognized-revenue",
              label: "Receita persistida",
              value: formatCurrency(selectedClientInsight.recognizedRevenue),
              helper: "Valor derivado de cash entry minima.",
              tone: "success"
            },
            {
              id: "bookings",
              label: "Bookings",
              value: selectedClientInsight.totalBookings,
              helper: `${selectedClientInsight.completedBookings} concluidas e ${selectedClientInsight.openBookings} em aberto.`
            },
            {
              id: "cash-entries",
              label: "Movimentos",
              value: selectedClientInsight.cashEntriesCount,
              helper: selectedClientInsight.lastCashEntry ?
                formatDateTime(selectedClientInsight.lastCashEntry.occurredAt)
              : "Nenhum movimento financeiro persistido."
            }
          ]}
        />

        <DocumentTabs
          tabs={[
            { id: "history", label: "Historico", active: true },
            { id: "finance", label: "Financeiro" },
            { id: "gaps", label: "Relacionamento" }
          ]}
        />

        <EntitySection
          title="Ultimas bookings"
          description="Leitura operacional recente para atendimento, retorno e contexto comercial."
        >
          {selectedClientBookings.length ? (
            <div className="records-column detail-list">
              {selectedClientBookings.slice(0, 5).map((booking) => (
                <div className="detail-item" key={booking.id}>
                  <div className="record-card-header">
                    <strong>{resolveBookingTitle(booking, services, professionals)}</strong>
                    <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                      {formatBookingStatus(booking.status)}
                    </span>
                  </div>
                  <div className="record-meta">
                    <span>{formatDateTime(booking.startAt)}</span>
                    <span>{formatTimeRange(booking.startAt, booking.endAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper">Este cliente ainda nao possui agendamentos visiveis neste recorte.</p>
          )}
        </EntitySection>

        <EntitySection
          title="Movimentos financeiros"
          description="Recebimentos e registros financeiros ja associados a este cliente."
        >
          {selectedClientCashEntries.length ? (
            <div className="records-column detail-list">
              {selectedClientCashEntries.slice(0, 5).map((entry) => (
                <div className="detail-item" key={entry.id}>
                  <div className="record-card-header">
                    <strong>{formatCashEntryKind(entry.kind)}</strong>
                    <span className={`status-pill is-${entry.status === "open" ? "success" : "warning"}`}>
                      {formatCashEntryStatus(entry.status)}
                    </span>
                  </div>
                  <div className="record-meta">
                    <span>{formatCurrency(entry.amount)}</span>
                    <span>{formatDateTime(entry.occurredAt)}</span>
                  </div>
                  <p>{entry.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper">Ainda nao ha movimentos financeiros visiveis para este cliente.</p>
          )}
        </EntitySection>

        <DocumentTimeline
          title="Linha do relacionamento"
          entries={[
            {
              id: "timeline-origin",
              title: "Origem do cliente",
              description: `Captado via ${selectedClientInsight.client.origem}.`
            },
            {
              id: "timeline-last-booking",
              title: "Ultimo movimento na agenda",
              description: selectedClientInsight.lastBooking ?
                `${formatDateTime(selectedClientInsight.lastBooking.startAt)} | ${formatBookingStatus(selectedClientInsight.lastBooking.status)}`
              : "Nenhuma booking registrada."
            },
            {
              id: "timeline-last-completed",
              title: "Ultimo atendimento concluido",
              description: selectedClientInsight.lastCompletedBooking ?
                `${formatDateTime(selectedClientInsight.lastCompletedBooking.endAt)} | sem retorno ha ${formatDaysSince(selectedClientInsight.lastCompletedBooking.endAt)}`
              : "Cliente ainda sem atendimento concluido."
            },
            {
              id: "timeline-last-cash-entry",
              title: "Ultimo movimento financeiro",
              description: selectedClientInsight.lastCashEntry ?
                `${formatCashEntryKind(selectedClientInsight.lastCashEntry.kind)} | ${formatCurrency(selectedClientInsight.lastCashEntry.amount)}`
              : "Nenhum movimento financeiro persistido."
            }
          ]}
        />

        <DocumentImpactPanel
          sections={[
            {
              id: "crm-supported",
              title: "Disponivel hoje",
              tone: "success",
              items: [
                "Carteira formada a partir da jornada real de bookings.",
                `Janela ativa de retorno: ${resolveClientReturnWindowLabel(clientReturnWindow)}.`,
                "Historico recente de agenda e receita no mesmo detalhe."
              ]
            },
            {
              id: "crm-gaps",
              title: "Em evolucao",
              tone: "warning",
              items: [
                "Automacoes de reativacao e alertas de risco ainda nao aparecem nesta carteira.",
                "Interacoes por WhatsApp e timeline completa de contato ainda ficam fora desta tela."
              ]
            }
          ]}
        />
      </div>
    );
  }

  function renderSettingsView(): JSX.Element {
    const paymentStatusTone =
      paymentForm.status === "active"
        ? "success"
        : paymentForm.status === "draft"
          ? "warning"
          : "neutral";

    return (
      <EntityViewLayout
        className="settings-entity-view"
        eyebrow="Configuracoes do tenant"
        title={tenant?.nome ?? "Tenant nao carregado"}
        subtitle="Area de manutencao continua do negocio, separando publicacao, branding, pagamentos e ambiente administrativo sem misturar operacao diaria."
        statusBadge={<ViewBadge tone="success">Funcional</ViewBadge>}
        pageActions={
          <div className="settings-page-actions">
            {publicBookingUrl ? (
              <a className="secondary-button button-link" href={publicBookingUrl} rel="noreferrer" target="_blank">
                Abrir booking publico
              </a>
            ) : (
              <span className="helper-chip">Sem slug publicada</span>
            )}
          </div>
        }
        identityCard={
          <EntityIdentityCard
            title="Identidade e publicacao"
            description="Resumo rapido do tenant e do estado atual de publicacao e cobranca."
            fields={[
              {
                id: "tenant-name",
                label: "Negocio",
                value: tenant?.nome ?? "-"
              },
              {
                id: "tenant-status",
                label: "Status",
                value: tenant?.status ?? "-"
              },
              {
                id: "tenant-slug",
                label: "Slug",
                value: tenant?.slug ? `/${tenant.slug}` : "Nao publicada"
              },
              {
                id: "tenant-timezone",
                label: "Timezone",
                value: tenant?.timezone ?? "-"
              },
              {
                id: "payment-status",
                label: "Pagamento",
                value: <ViewBadge tone={paymentStatusTone}>{paymentForm.status}</ViewBadge>,
                helper: paymentForm.checkoutMode
              },
              {
                id: "booking-url",
                label: "Booking publico",
                value: publicBookingUrl || "Sem URL publicada",
                helper: "URL usada pela jornada publica do cliente final."
              }
            ]}
          />
        }
        sections={
          <>
            {renderSlugPanel()}
            {renderBrandingPanel()}
            {renderPaymentsPanel()}

            <EntitySection
              title="Ambiente administrativo"
              description="Dados operacionais e de publicacao disponiveis hoje para o tenant."
              actions={<ViewBadge tone="info">Suporte operacional</ViewBadge>}
            >
              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <strong>API base</strong>
                  <span>{resolveAdminApiBaseUrl(apiBaseUrl)}</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>Tenant slug</strong>
                  <span>/{tenant?.slug ?? "-"}</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>Timezone</strong>
                  <span>{tenant?.timezone ?? "-"}</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>Publicacao</strong>
                  <span>{publicBookingUrl || "Sem slug publicada"}</span>
                </div>
              </div>
            </EntitySection>
          </>
        }
        aside={
          <div className="settings-aside-stack">
            <EntityAsideSummary
              title="Nesta area"
              description="Dados permanentes do tenant e configuracao da operacao publicada."
              items={[
                {
                  id: "settings-profile",
                  label: "Identidade publica",
                  description: "Nome do negocio, slug e URL publica do booking.",
                  active: true
                },
                {
                  id: "settings-branding",
                  label: "Branding minimo",
                  description: "Mensagem curta da marca e cor de destaque do tenant.",
                  active: true
                },
                {
                  id: "settings-payments",
                  label: "Pagamentos",
                  description: "Mercado Pago, callbacks e modo de checkout publicado.",
                  value: paymentForm.status,
                  active: true
                },
                {
                  id: "settings-runtime",
                  label: "Ambiente do tenant",
                  description: "API base, timezone e estado atual de publicacao.",
                  active: true
                }
              ]}
            />

            <EntityAsideSummary
              title="Em evolucao"
              description="Temas administrativos que ainda nao viraram uma area dedicada."
              items={[
                {
                  id: "settings-subscription",
                  label: "Assinatura do SaaS",
                  description: "Cobranca da propria plataforma ainda nao fica disponivel aqui."
                },
                {
                  id: "settings-webhooks",
                  label: "Eventos e observabilidade",
                  description: "URLs e credenciais existem, mas ainda nao ha painel de eventos ou health check."
                },
                {
                  id: "settings-profile-wide",
                  label: "Perfil ampliado do negocio",
                  description: "Campos mais amplos do tenant ainda nao ficam centralizados nesta tela."
                }
              ]}
            />
          </div>
        }
      />
    );
  }

  function renderCurrentView(): JSX.Element {
    switch (currentRoute) {
      case "dashboard":
        return renderDashboardView();
      case "relatorios":
        return renderReportsViewV2();
      case "operacional":
        return renderOperationalView();
      case "agenda":
        return renderAgendaViewV2();
      case "catalogo":
        return renderCatalogView();
      case "profissionais":
        return renderProfessionalsView();
      case "clientes":
        return renderClientsView();
      case "configuracoes":
        return renderSettingsView();
      default:
        return renderOperationalView();
    }
  }

  const currentRouteDefinition = adminRouteDefinitions[currentRoute];
  const showTopbarEyebrow = currentRoute !== "profissionais" && currentRoute !== "dashboard";
  const sidebarReportsMenuGroups = groupReportsWorkspaceItems(reportsWorkspaceItems);

  if (!sessionToken) {
    return (
      <main className="shell auth-shell">
        <section className="hero-block">
          <p className="eyebrow">AgendaAI / admin-web</p>
          <h1>Onboarding, catalogo, equipe e operacao do dia.</h1>
          <p className="description">
            O cliente final agenda pela slug publica. Aqui o owner cria o negocio, configura
            servicos, liga Mercado Pago, monta a equipe e acompanha a agenda operacional.
          </p>
        </section>

        <section className="workspace-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Conexao</p>
                <h2>Acesso administrativo</h2>
              </div>
              <div className="mode-switch">
                <button
                  className={authMode === "login" ? "secondary-button is-active" : "secondary-button"}
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={
                    authMode === "onboarding" ? "secondary-button is-active" : "secondary-button"
                  }
                  onClick={() => setAuthMode("onboarding")}
                  type="button"
                >
                  Criar negocio
                </button>
              </div>
            </div>

            <label className="field">
              <span>API base URL</span>
              <input
                type="url"
                value={apiBaseUrl}
                onChange={(event) => setApiBaseUrl(resolveAdminApiBaseUrl(event.target.value))}
              />
            </label>

            {feedback ? <div className={`feedback-banner is-${feedback.tone}`}>{feedback.message}</div> : null}

            {authMode === "login" ? (
              <form className="stack-form" onSubmit={handleLogin}>
                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) => setLoginForm({ ...loginForm, email: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) => setLoginForm({ ...loginForm, password: event.target.value })}
                  />
                </label>
                <button className="primary-button" disabled={isBusy} type="submit">
                  {isBusy ? "Entrando..." : "Entrar no admin"}
                </button>
              </form>
            ) : (
              <form className="stack-form" onSubmit={handleOnboarding}>
                <div className="form-grid">
                  <label className="field">
                    <span>Nome do negocio</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.nome}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, nome: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Slug</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.slug}
                      onChange={(event) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          slug: sanitizeSlug(event.target.value)
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Timezone</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.timezone}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, timezone: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Nome do owner</span>
                    <input
                      required
                      type="text"
                      value={onboardingForm.adminNome}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminNome: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>E-mail do owner</span>
                    <input
                      required
                      type="email"
                      value={onboardingForm.adminEmail}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminEmail: event.target.value })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input
                      type="tel"
                      value={onboardingForm.adminTelefone}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, adminTelefone: event.target.value })
                      }
                    />
                  </label>
                  <label className="field field-wide">
                    <span>Senha inicial</span>
                    <input
                      required
                      type="password"
                      value={onboardingForm.senha}
                      onChange={(event) =>
                        setOnboardingForm({ ...onboardingForm, senha: event.target.value })
                      }
                    />
                  </label>
                </div>
                <button className="primary-button" disabled={isBusy} type="submit">
                  {isBusy ? "Criando..." : "Criar negocio e entrar"}
                </button>
              </form>
            )}
          </article>

          <aside className="panel aside-panel">
            <div className="list-card">
              <strong>Duas visoes</strong>
              <p>Booking publico para o cliente e shell admin para implantar e operar o negocio.</p>
            </div>
            <div className="list-card">
              <strong>Credenciais demo</strong>
              <p>`owner@agendaai.demo` com `agendaai-demo` depois da seed do `api-rest`.</p>
            </div>
            <div className="list-card">
              <strong>Ponto atual</strong>
              <p>Checkout Pro publico ligado e agenda admin entrando em operacao.</p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <Fragment>
      <main className="shell admin-shell-v2">
      {isSidebarOpen ? (
        <button
          aria-label="Fechar navegacao"
          className="sidebar-overlay"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}

      <aside
        className={`admin-sidebar-v2${isSidebarOpen ? " is-open" : ""}`}
      >
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-main">
            <div className="admin-sidebar-brand-mark">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="admin-sidebar-brand-copy">
              <strong>AgendaAI</strong>
            </div>
          </div>
        </div>

        <nav className="admin-sidebar-nav no-scrollbar">
          {adminNavigationSections.map((section) => (
            <div className="admin-sidebar-group" key={section.label}>
              <p className="admin-sidebar-group-label">{section.label}</p>
              {section.routes.map((route) => {
                const definition = adminRouteDefinitions[route];
                const Icon = definition.icon;
                const sidebarButton = (
                  <button
                    className={currentRoute === route ? "admin-sidebar-link is-active" : "admin-sidebar-link"}
                    key={route}
                    onClick={() => navigateTo(route)}
                    title={definition.label}
                    type="button"
                  >
                    <span className="admin-sidebar-link-icon">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="admin-sidebar-link-copy">
                      <strong>{definition.label}</strong>
                    </span>
                  </button>
                );

                if (route !== "relatorios") {
                  return sidebarButton;
                }

                return (
                  <div className="admin-sidebar-flyout-anchor" key={route}>
                    {sidebarButton}
                    {!isCompactShell ? (
                      <div className="admin-sidebar-flyout admin-sidebar-flyout-reports">
                        <div className="admin-sidebar-flyout-header">
                          <strong>Relatorios</strong>
                          <span>Escolha a visao gerencial que quer abrir no workspace.</span>
                        </div>

                        {sidebarReportsMenuGroups.map(([group, items]) => (
                          <section className="admin-sidebar-flyout-group" key={group}>
                            <span className="admin-sidebar-flyout-group-title">{group}</span>
                            <div className="admin-sidebar-flyout-items">
                              {items.map((item) => (
                                <button
                                  className="admin-sidebar-flyout-item"
                                  key={item.key}
                                  onClick={() => openReportsWorkspaceTab(item.key)}
                                  type="button"
                                >
                                  <div className="admin-sidebar-flyout-item-row">
                                    <strong>{item.label}</strong>
                                    {item.badge ? <span className="reports-menu-badge">{item.badge}</span> : null}
                                  </div>
                                  <span>{item.description}</span>
                                </button>
                              ))}
                            </div>
                          </section>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <article className="admin-sidebar-profile-card">
            <div className="admin-sidebar-profile-avatar">
              {resolveProfessionalInitials(sidebarProfileName)}
            </div>
            <div className="admin-sidebar-profile-copy">
              <strong>{sidebarProfileName}</strong>
              <span>{sidebarProfileEmail || "Sem e-mail cadastrado"}</span>
            </div>
            {publicBookingUrl ? (
              <a
                aria-label="Abrir booking publico"
                className="admin-sidebar-profile-action"
                href={publicBookingUrl}
                rel="noreferrer"
                target="_blank"
                title="Abrir booking publico"
              >
                <LinkIcon className="w-4 h-4" />
              </a>
            ) : null}
          </article>
        </div>
      </aside>

      <div className="admin-stage-v2">
        <header className="admin-topbar">
          <div className="admin-topbar-main">
            <button
              className="admin-topbar-menu"
              onClick={() => setIsSidebarOpen(true)}
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div aria-label="Abas do workspace" className="admin-route-strip" role="tablist">
              {openRouteTabs.map((route) => {
                const definition = adminRouteDefinitions[route];

                return (
                  <div
                    aria-selected={currentRoute === route}
                    className={currentRoute === route ? "admin-route-tab is-active" : "admin-route-tab"}
                    key={route}
                    role="tab"
                  >
                    <button
                      className="admin-route-tab-trigger"
                      onClick={() => navigateTo(route)}
                      type="button"
                    >
                      <span className="admin-route-tab-dot" />
                      <span className="admin-route-tab-label">{definition.label}</span>
                    </button>
                    {openRouteTabs.length > 1 ? (
                      <button
                        aria-label={`Fechar aba ${definition.label}`}
                        className="admin-route-tab-close"
                        onClick={() => closeWorkspaceTab(route)}
                        type="button"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="admin-topbar-actions">
            <button
              aria-label="Abrir clientes para buscar cliente"
              className="admin-icon-button admin-topbar-utility"
              onClick={openClientsDirectoryFromShell}
              title="Buscar cliente"
              type="button"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              aria-label="Abrir painel rapido"
              className={isShellPulseOpen ? "admin-icon-button admin-topbar-utility is-active" : "admin-icon-button admin-topbar-utility"}
              data-count={shellAttentionCount > 0 ? Math.min(shellAttentionCount, 99) : undefined}
              onClick={toggleShellPulsePanel}
              title="Alertas"
              type="button"
            >
              <Bell className="w-5 h-5" />
            </button>
            {tenant ? (
              <button
                aria-label="Abrir contexto"
                className={isShellContextOpen ? "admin-icon-button admin-topbar-utility is-active" : "admin-icon-button admin-topbar-utility"}
                onClick={toggleShellContextPanel}
                title="Contexto"
                type="button"
              >
                <Activity className="w-4 h-4" />
              </button>
            ) : null}
            <button
              aria-label="Novo agendamento"
              className="admin-icon-button admin-topbar-utility admin-shell-plus-action"
              onClick={openCounterBookingModal}
              title="Novo agendamento"
              type="button"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div aria-label={`Perfil ${sidebarProfileName}`} className="admin-topbar-avatar" title={sidebarProfileName}>
              {resolveProfessionalInitials(sidebarProfileName)}
            </div>
          </div>
        </header>

        <section className={currentRoute === "profissionais" ? "admin-stage-content is-professionals-route" : "admin-stage-content"}>
          <section className="admin-content">
          {feedback ? <div className={`feedback-banner is-${feedback.tone}`}>{feedback.message}</div> : null}
          {bootError ? <div className="feedback-banner is-error">{bootError}</div> : null}
          {renderCurrentView()}
          </section>
        </section>
      </div>
      </main>
      {renderShellPulsePanel()}
      {renderShellContextPanel()}
      {renderCounterBookingModal()}
      {renderAgendaBookingModal()}
    </Fragment>
  );
}

function toPaymentForm(settings?: TenantPaymentSettings): PaymentFormState {
  if (!settings) {
    return defaultPaymentForm;
  }
  return {
    status: settings.status,
    checkoutMode: settings.checkoutMode,
    publicKey: settings.publicKey ?? "",
    accessToken: settings.accessToken ?? "",
    collectorId: settings.collectorId ?? "",
    statementDescriptor: settings.statementDescriptor ?? "",
    notificationUrl: settings.notificationUrl ?? "",
    backSuccess: settings.backUrls?.success ?? "",
    backPending: settings.backUrls?.pending ?? "",
    backFailure: settings.backUrls?.failure ?? "",
    defaultInstallments: settings.defaultInstallments ? String(settings.defaultInstallments) : "1",
    expirationMinutes: settings.expirationMinutes ? String(settings.expirationMinutes) : "30",
    binaryMode: settings.binaryMode
  };
}

function toBrandingForm(
  branding?: {
    tagline?: string;
    accentColor?: string;
  }
): BrandingFormState {
  return {
    tagline: branding?.tagline ?? "",
    accentColor: branding?.accentColor ?? ""
  };
}

function toServiceForm(service: Service): ServiceFormState {
  return {
    nome: service.nome,
    duracaoMin: String(service.duracaoMin),
    precoBase: String(service.precoBase),
    status: service.status,
    collectionMode: service.paymentPolicy.collectionMode,
    checkoutMode: service.paymentPolicy.checkoutMode ?? "checkout_pro",
    chargeType: service.paymentPolicy.chargeType ?? "percentage",
    fixedAmount: service.paymentPolicy.fixedAmount ? String(service.paymentPolicy.fixedAmount) : "",
    percentage: service.paymentPolicy.percentage ? String(service.paymentPolicy.percentage) : "30",
    acceptedMethods: service.paymentPolicy.acceptedMethods.length
      ? [...service.paymentPolicy.acceptedMethods]
      : [...defaultServicePaymentPolicy.acceptedMethods]
  };
}

function buildPaymentPayload(
  form: PaymentFormState
): Omit<TenantPaymentSettings, "version" | "tenantId" | "provider"> {
  return {
    status: form.status,
    checkoutMode: form.checkoutMode,
    publicKey: emptyToUndefined(form.publicKey),
    accessToken: emptyToUndefined(form.accessToken),
    collectorId: emptyToUndefined(form.collectorId),
    statementDescriptor: emptyToUndefined(form.statementDescriptor),
    notificationUrl: emptyToUndefined(form.notificationUrl),
    backUrls:
      form.backSuccess && form.backPending && form.backFailure
        ? {
            success: form.backSuccess.trim(),
            pending: form.backPending.trim(),
            failure: form.backFailure.trim()
          }
        : undefined,
    autoReturn: "approved",
    binaryMode: form.binaryMode,
    defaultInstallments: parseOptionalInteger(form.defaultInstallments),
    expirationMinutes: parseOptionalInteger(form.expirationMinutes)
  };
}

function buildBrandingPayload(form: BrandingFormState): {
  tagline?: string;
  accentColor?: string;
} {
  return {
    tagline: emptyToUndefined(form.tagline),
    accentColor: normalizeAccentColor(form.accentColor)
  };
}

function normalizeAccentColor(value: string): string | undefined {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed) {
    return undefined;
  }
  if (!/^#([0-9A-F]{6})$/.test(trimmed)) {
    throw new Error("A cor de destaque deve seguir o formato #RRGGBB.");
  }
  return trimmed;
}

function buildBrandingPreviewStyle(accentColor?: string): CSSProperties {
  if (!accentColor) {
    return {};
  }

  return {
    borderColor: `${accentColor}33`,
    boxShadow: `inset 0 0 0 1px ${accentColor}22`,
    background: `linear-gradient(135deg, ${accentColor}14 0%, rgba(255, 255, 255, 0.92) 72%)`
  };
}

function buildServicePayload(form: ServiceFormState): {
  nome: string;
  duracaoMin: number;
  precoBase: number;
  exigeSinal: boolean;
  paymentPolicy: Service["paymentPolicy"];
  status: string;
} {
  const precoBase = parseRequiredNumber(form.precoBase, "precoBase");
  const percentage =
    form.chargeType === "percentage"
      ? parseOptionalNumber(form.percentage) ?? (form.collectionMode === "full" ? 100 : 30)
      : undefined;
  const fixedAmount =
    form.chargeType === "fixed" ? parseOptionalNumber(form.fixedAmount) ?? precoBase : undefined;

  return {
    nome: form.nome.trim(),
    duracaoMin: parseRequiredInteger(form.duracaoMin, "duracaoMin"),
    precoBase,
    exigeSinal: form.collectionMode !== "none",
    status: form.status.trim(),
    paymentPolicy: {
      ...defaultServicePaymentPolicy,
      collectionMode: form.collectionMode,
      provider: form.collectionMode === "none" ? undefined : "mercado_pago",
      checkoutMode: form.collectionMode === "none" ? undefined : form.checkoutMode,
      chargeType: form.collectionMode === "none" ? undefined : form.chargeType,
      fixedAmount: form.collectionMode === "none" ? undefined : fixedAmount,
      percentage: form.collectionMode === "none" ? undefined : percentage,
      acceptedMethods: form.acceptedMethods.length
        ? [...form.acceptedMethods]
        : [...defaultServicePaymentPolicy.acceptedMethods],
      capture: true
    }
  };
}

function createDefaultAvailabilityDays(): AvailabilityDayState[] {
  return [
    { weekday: 0, enabled: false, startTime: "09:00", endTime: "18:00" },
    { weekday: 1, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 2, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 3, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 4, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 5, enabled: true, startTime: "09:00", endTime: "18:00" },
    { weekday: 6, enabled: true, startTime: "09:00", endTime: "13:00" }
  ];
}

function toAvailabilityDays(rules: AvailabilityRule[]): AvailabilityDayState[] {
  if (rules.length === 0) {
    return createDefaultAvailabilityDays();
  }

  return createDefaultAvailabilityDays().map((day) => {
    const rule = rules.find((item) => item.weekday === day.weekday);
    return rule
      ? {
          weekday: day.weekday,
          enabled: true,
          startTime: rule.faixa.startTime,
          endTime: rule.faixa.endTime
        }
      : { ...day, enabled: false };
  });
}

function summarizeBookings(bookings: readonly Booking[]): BookingSummary {
  return {
    today: bookings.filter((booking) => isSameCalendarDay(booking.startAt, new Date())).length,
    open: bookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
    confirmed: bookings.filter((booking) => booking.status === "confirmado").length,
    completed: bookings.filter((booking) => booking.status === "concluido").length
  };
}

function filterBookingsByRange(
  bookings: readonly Booking[],
  range: DashboardRange,
  offsetPeriods = 0
): Booking[] {
  if (range === "all") {
    return [...bookings].sort((left, right) => right.startAt.localeCompare(left.startAt));
  }

  const days = range === "7d" ? 7 : 30;
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  startDate.setDate(startDate.getDate() - (days - 1) - days * offsetPeriods);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + days);

  return [...bookings]
    .filter((booking) => {
      const bookingDate = new Date(booking.startAt);
      if (bookingDate < startDate) {
        return false;
      }
      if (offsetPeriods > 0 && bookingDate >= endDate) {
        return false;
      }
      return true;
    })
    .sort((left, right) => right.startAt.localeCompare(left.startAt));
}

function filterBookingsByReportSelection(
  bookings: readonly Booking[],
  serviceFilter: string,
  professionalFilter: string
): Booking[] {
  return [...bookings]
    .filter((booking) => {
      if (serviceFilter !== "all" && booking.serviceId !== serviceFilter) {
        return false;
      }
      if (professionalFilter !== "all" && booking.professionalId !== professionalFilter) {
        return false;
      }
      return true;
    })
    .sort((left, right) => right.startAt.localeCompare(left.startAt));
}

function filterBookingsByDate(bookings: readonly Booking[], date: string): Booking[] {
  return [...bookings]
    .filter((booking) => extractDatePart(booking.startAt) === date)
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function summarizeDayBookings(bookings: readonly Booking[]): DayBookingSummary {
  return {
    total: bookings.length,
    open: bookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
    confirmed: bookings.filter((booking) => booking.status === "confirmado").length
  };
}

function filterBookingsByDates(bookings: readonly Booking[], dates: readonly string[]): Booking[] {
  const dateSet = new Set(dates);
  return [...bookings]
    .filter((booking) => dateSet.has(extractDatePart(booking.startAt)))
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function buildAgendaWeekDates(anchorDate: string): string[] {
  const currentDate = new Date(`${anchorDate}T12:00:00`);
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - currentDate.getDay());

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return formatDateInputValue(date);
  });
}

function buildAgendaMonthCells(
  anchorDate: string,
  bookings: readonly Booking[],
  professionals: readonly Professional[],
  availabilityByProfessional: Readonly<Record<string, AvailabilityRule[]>>,
  professionalFilter: string
): MonthCalendarCell[] {
  const anchor = new Date(`${anchorDate}T12:00:00`);
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 12, 0, 0);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 12, 0, 0);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const cells: MonthCalendarCell[] = [];
  for (let cursor = new Date(gridStart); cursor <= gridEnd; cursor.setDate(cursor.getDate() + 1)) {
    const date = formatDateInputValue(cursor);
    const dayBookings = bookings
      .filter((booking) => extractDatePart(booking.startAt) === date)
      .filter((booking) =>
        professionalFilter === "all" ? true : booking.professionalId === professionalFilter
      )
      .sort((left, right) => left.startAt.localeCompare(right.startAt));
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const totalMinutes = professionals.reduce((total, professional) => {
      const rule = availabilityByProfessional[professional.id]?.find((item) => item.weekday === weekday);
      return total + calculateRuleDurationMinutes(rule);
    }, 0);

    cells.push({
      date,
      inCurrentMonth: cursor.getMonth() === anchor.getMonth(),
      bookings: dayBookings,
      bookingsCount: dayBookings.length,
      openBookings: dayBookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
      completedBookings: dayBookings.filter((booking) => booking.status === "concluido").length,
      totalMinutes,
      bookedMinutes: dayBookings.reduce(
        (total, booking) => total + calculateBookingDurationMinutes(booking),
        0
      )
    });
  }

  return cells;
}

function buildWeekGridCell(
  date: string,
  professionalId: string,
  bookings: readonly Booking[],
  availabilityByProfessional: Readonly<Record<string, AvailabilityRule[]>>
): {
  readonly rule?: AvailabilityRule;
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
  readonly bookings: Booking[];
} {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const rule = availabilityByProfessional[professionalId]?.find((item) => item.weekday === weekday);
  const cellBookings = bookings
    .filter(
      (booking) =>
        booking.professionalId === professionalId &&
        extractDatePart(booking.startAt) === date &&
        booking.status !== "cancelado"
    )
    .sort((left, right) => left.startAt.localeCompare(right.startAt));

  return {
    rule,
    totalMinutes: calculateRuleDurationMinutes(rule),
    bookedMinutes: cellBookings.reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0),
    bookings: cellBookings
  };
}

function summarizeWeekCapacity(
  bookings: readonly Booking[],
  dates: readonly string[],
  professionals: readonly Professional[],
  availabilityByProfessional: Readonly<Record<string, AvailabilityRule[]>>
): WeekCapacitySummary {
  const totalMinutes = dates.reduce((total, date) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    return (
      total +
      professionals.reduce(
        (dayTotal, professional) =>
          dayTotal +
          calculateRuleDurationMinutes(
            availabilityByProfessional[professional.id]?.find((rule) => rule.weekday === weekday)
          ),
        0
      )
    );
  }, 0);
  const bookedMinutes = bookings
    .filter((booking) => booking.status !== "cancelado")
    .reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0);

  return {
    totalMinutes,
    bookedMinutes,
    freeMinutes: Math.max(totalMinutes - bookedMinutes, 0),
    bookingsCount: bookings.length,
    openBookings: bookings.filter((booking) => isOpenBookingStatus(booking.status)).length
  };
}

function summarizeMonthCapacity(cells: readonly MonthCalendarCell[]): WeekCapacitySummary {
  return cells.reduce<WeekCapacitySummary>(
    (summary, cell) => ({
      totalMinutes: summary.totalMinutes + cell.totalMinutes,
      bookedMinutes: summary.bookedMinutes + cell.bookedMinutes,
      freeMinutes: summary.freeMinutes + Math.max(cell.totalMinutes - cell.bookedMinutes, 0),
      bookingsCount: summary.bookingsCount + cell.bookingsCount,
      openBookings: summary.openBookings + cell.openBookings
    }),
    {
      totalMinutes: 0,
      bookedMinutes: 0,
      freeMinutes: 0,
      bookingsCount: 0,
      openBookings: 0
    }
  );
}

function buildWeekDaySummaries(
  bookings: readonly Booking[],
  dates: readonly string[],
  professionals: readonly Professional[],
  availabilityByProfessional: Readonly<Record<string, AvailabilityRule[]>>
): WeekDayCapacitySummary[] {
  return dates.map((date) => {
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const dayBookings = bookings.filter(
      (booking) => extractDatePart(booking.startAt) === date && booking.status !== "cancelado"
    );
    const totalMinutes = professionals.reduce((total, professional) => {
      const rule = availabilityByProfessional[professional.id]?.find((item) => item.weekday === weekday);
      return total + calculateRuleDurationMinutes(rule);
    }, 0);

    return {
      date,
      totalMinutes,
      bookedMinutes: dayBookings.reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0),
      bookingsCount: dayBookings.length,
      openBookings: dayBookings.filter((booking) => isOpenBookingStatus(booking.status)).length
    };
  });
}

function buildWeekProfessionalSummaries(
  bookings: readonly Booking[],
  dates: readonly string[],
  professionals: readonly Professional[],
  availabilityByProfessional: Readonly<Record<string, AvailabilityRule[]>>
): Array<{
  readonly professionalId: string;
  readonly professionalName: string;
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
  readonly bookingsCount: number;
  readonly openBookings: number;
}> {
  return professionals.map((professional) => {
    const professionalBookings = bookings.filter((booking) => booking.professionalId === professional.id);
    const totalMinutes = dates.reduce((total, date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      const rule = availabilityByProfessional[professional.id]?.find((item) => item.weekday === weekday);
      return total + calculateRuleDurationMinutes(rule);
    }, 0);
    const bookedMinutes = professionalBookings
      .filter((booking) => booking.status !== "cancelado")
      .reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0);

    return {
      professionalId: professional.id,
      professionalName: professional.nome,
      totalMinutes,
      bookedMinutes,
      bookingsCount: professionalBookings.length,
      openBookings: professionalBookings.filter((booking) => isOpenBookingStatus(booking.status)).length
    };
  });
}

function buildClientInsights(
  clients: readonly Client[],
  bookings: readonly Booking[],
  services: readonly Service[],
  cashEntries: readonly CashEntry[]
): ClientInsight[] {
  return clients
    .map((client) => {
      const clientBookings = bookings
        .filter((booking) => booking.clientId === client.id)
        .sort((left, right) => right.startAt.localeCompare(left.startAt));
      const completedBookings = clientBookings.filter((booking) => booking.status === "concluido");
      const clientCashEntries = cashEntries
        .filter((entry) => entry.clientId === client.id && entry.status === "open")
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
      const recognizedRevenue = completedBookings.reduce(
        (total, booking) => total + resolveRecognizedRevenueAmount(booking, services, cashEntries),
        0
      );

      return {
        client,
        totalBookings: clientBookings.length,
        openBookings: clientBookings.filter((booking) => isOpenBookingStatus(booking.status)).length,
        completedBookings: completedBookings.length,
        lastBooking: clientBookings[0],
        lastCompletedBooking: completedBookings[0],
        recognizedRevenue,
        cashEntriesCount: clientCashEntries.length,
        lastCashEntry: clientCashEntries[0]
      };
    })
    .sort((left, right) => {
      const leftDate = left.lastBooking?.startAt ?? "";
      const rightDate = right.lastBooking?.startAt ?? "";
      return rightDate.localeCompare(leftDate);
    });
}

function filterClientInsights(
  entries: readonly ClientInsight[],
  filter: ClientSegmentFilter,
  window: ClientReturnWindow
): ClientInsight[] {
  return entries.filter((entry) => {
    const segment = resolveClientSegment(entry, window);
    if (filter === "all") {
      return true;
    }
    return segment === filter;
  });
}

function summarizeClientPortfolio(
  entries: readonly ClientInsight[],
  window: ClientReturnWindow
): ClientPortfolioSummary {
  return entries.reduce<ClientPortfolioSummary>(
    (summary, entry) => {
      const segment = resolveClientSegment(entry, window);
      if (segment === "returning") {
        return { ...summary, returningCount: summary.returningCount + 1, activeCount: summary.activeCount + 1 };
      }
      if (segment === "inactive") {
        return { ...summary, inactiveCount: summary.inactiveCount + 1, activeCount: summary.activeCount + 1 };
      }
      return { ...summary, neverCompletedCount: summary.neverCompletedCount + 1 };
    },
    {
      activeCount: 0,
      inactiveCount: 0,
      neverCompletedCount: 0,
      returningCount: 0
    }
  );
}

function resolveClientSegment(
  entry: ClientInsight,
  window: ClientReturnWindow
): Exclude<ClientSegmentFilter, "all"> {
  if (!entry.lastCompletedBooking) {
    return "never_completed";
  }

  const daysSinceLastCompleted = calculateDaysSinceIso(entry.lastCompletedBooking.endAt);
  const threshold = resolveClientReturnWindowDays(window);
  return daysSinceLastCompleted > threshold ? "inactive" : "returning";
}

function buildRevenueEntries(
  bookings: readonly Booking[],
  services: readonly Service[],
  professionals: readonly Professional[],
  clients: readonly Client[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): RevenueEntry[] {
  return bookings
    .filter((booking) => booking.status === "concluido")
    .map((booking) => {
      const service = services.find((item) => item.id === booking.serviceId);
      const professional = professionals.find((item) => item.id === booking.professionalId);
      const client = clients.find((item) => item.id === booking.clientId);
      const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
      const recognizedCashEntry = findOpenCashEntry(cashEntries, booking.id, "recognized_revenue");
      const onlinePaymentCashEntry = findOpenCashEntry(cashEntries, booking.id, "online_payment");

      return {
        booking,
        service,
        professional,
        client,
        paymentIntent,
        recognizedCashEntry,
        onlinePaymentCashEntry,
        recognizedAmount: resolveRecognizedRevenueAmount(booking, services, cashEntries),
        approvedOnlineAmount: resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries)
      };
    })
    .sort((left, right) => right.booking.endAt.localeCompare(left.booking.endAt));
}

function findOpenCashEntry(
  cashEntries: readonly CashEntry[],
  bookingId: string,
  kind: CashEntry["kind"]
): CashEntry | undefined {
  return cashEntries.find(
    (entry) =>
      entry.bookingId === bookingId &&
      entry.kind === kind &&
      entry.status === "open"
  );
}

function resolveRecognizedRevenueAmount(
  booking: Booking,
  services: readonly Service[],
  cashEntries: readonly CashEntry[]
): number {
  return (
    findOpenCashEntry(cashEntries, booking.id, "recognized_revenue")?.amount ??
    services.find((item) => item.id === booking.serviceId)?.precoBase ??
    0
  );
}

function resolveApprovedOnlineAmount(
  booking: Booking,
  paymentIntent: PaymentIntent | undefined,
  cashEntries: readonly CashEntry[]
): number {
  const cashEntryAmount = findOpenCashEntry(cashEntries, booking.id, "online_payment")?.amount;
  if (cashEntryAmount !== undefined) {
    return cashEntryAmount;
  }

  return paymentIntent && isApprovedPaymentIntent(paymentIntent.status) ? paymentIntent.amount : 0;
}

function summarizeRevenueEntries(
  entries: readonly RevenueEntry[],
  bookings: readonly Booking[]
): DashboardRevenueSummary {
  const recognizedRevenue = entries.reduce((total, entry) => total + entry.recognizedAmount, 0);
  const approvedOnlineRevenue = entries.reduce(
    (total, entry) => total + entry.approvedOnlineAmount,
    0
  );
  const completedCount = entries.length;
  const uniqueClients = new Set(entries.map((entry) => entry.booking.clientId)).size;
  const noShowCount = bookings.filter((booking) => booking.status === "faltou").length;
  const cancelledCount = bookings.filter((booking) => booking.status === "cancelado").length;

  return {
    recognizedRevenue,
    approvedOnlineRevenue,
    completedCount,
    averageTicket: completedCount > 0 ? recognizedRevenue / completedCount : 0,
    uniqueClients,
    noShowRate: bookings.length > 0 ? noShowCount / bookings.length : 0,
    cancelledCount
  };
}

function buildReportMetricSummary(
  bookings: readonly Booking[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportMetricSummary {
  const completedBookings = bookings.filter((booking) => booking.status === "concluido");
  const recognizedRevenue = completedBookings.reduce((total, booking) => {
    return total + resolveRecognizedRevenueAmount(booking, services, cashEntries);
  }, 0);
  const approvedOnlineRevenue = completedBookings.reduce((total, booking) => {
    const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
    return total + resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries);
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

function buildServiceReportSummaries(
  bookings: readonly Booking[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportGroupSummary[] {
  const grouped = new Map<string, ReportGroupSummary & { readonly clientIds: Set<string> }>();

  for (const booking of bookings) {
    const service = services.find((item) => item.id === booking.serviceId);
    const existing =
      grouped.get(booking.serviceId) ??
      ({
        id: booking.serviceId,
        label: service?.nome ?? "Servico removido",
        bookingsCount: 0,
        completedCount: 0,
        recognizedRevenue: 0,
        approvedOnlineRevenue: 0,
        averageTicket: 0,
        uniqueClients: 0,
        clientIds: new Set<string>()
      } satisfies ReportGroupSummary & { readonly clientIds: Set<string> });
    const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
    const nextCompletedCount =
      existing.completedCount + (booking.status === "concluido" ? 1 : 0);
    const nextRecognizedRevenue =
      existing.recognizedRevenue +
      (booking.status === "concluido"
        ? resolveRecognizedRevenueAmount(booking, services, cashEntries)
        : 0);
    const nextApprovedOnlineRevenue =
      existing.approvedOnlineRevenue +
      (booking.status === "concluido"
        ? resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries)
        : 0);
    existing.clientIds.add(booking.clientId);

    grouped.set(booking.serviceId, {
      ...existing,
      bookingsCount: existing.bookingsCount + 1,
      completedCount: nextCompletedCount,
      recognizedRevenue: nextRecognizedRevenue,
      approvedOnlineRevenue: nextApprovedOnlineRevenue,
      averageTicket: nextCompletedCount > 0 ? nextRecognizedRevenue / nextCompletedCount : 0,
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

function buildProfessionalReportSummaries(
  bookings: readonly Booking[],
  professionals: readonly Professional[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportGroupSummary[] {
  const grouped = new Map<string, ReportGroupSummary & { readonly clientIds: Set<string> }>();

  for (const booking of bookings) {
    const professional = professionals.find((item) => item.id === booking.professionalId);
    const service = services.find((item) => item.id === booking.serviceId);
    const existing =
      grouped.get(booking.professionalId) ??
      ({
        id: booking.professionalId,
        label: professional?.nome ?? "Profissional removido",
        bookingsCount: 0,
        completedCount: 0,
        recognizedRevenue: 0,
        approvedOnlineRevenue: 0,
        averageTicket: 0,
        uniqueClients: 0,
        clientIds: new Set<string>()
      } satisfies ReportGroupSummary & { readonly clientIds: Set<string> });
    const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
    const nextCompletedCount =
      existing.completedCount + (booking.status === "concluido" ? 1 : 0);
    const nextRecognizedRevenue =
      existing.recognizedRevenue +
      (booking.status === "concluido"
        ? resolveRecognizedRevenueAmount(booking, services, cashEntries)
        : 0);
    const nextApprovedOnlineRevenue =
      existing.approvedOnlineRevenue +
      (booking.status === "concluido"
        ? resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries)
        : 0);
    existing.clientIds.add(booking.clientId);

    grouped.set(booking.professionalId, {
      ...existing,
      bookingsCount: existing.bookingsCount + 1,
      completedCount: nextCompletedCount,
      recognizedRevenue: nextRecognizedRevenue,
      approvedOnlineRevenue: nextApprovedOnlineRevenue,
      averageTicket: nextCompletedCount > 0 ? nextRecognizedRevenue / nextCompletedCount : 0,
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

function buildDashboardChartData(
  bookings: readonly Booking[],
  services: readonly Service[],
  cashEntries: readonly CashEntry[]
): DashboardChartPoint[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const points: DashboardChartPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const anchor = new Date(today);
    anchor.setDate(today.getDate() - offset);
    const dateKey = formatDateInputValue(anchor);
    const dayBookings = bookings.filter((booking) => extractDatePart(booking.startAt) === dateKey);
    const recognizedRevenue = dayBookings.reduce((total, booking) => {
      if (booking.status !== "concluido") {
        return total;
      }
      return total + resolveRecognizedRevenueAmount(booking, services, cashEntries);
    }, 0);

    points.push({
      label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(anchor),
      recognizedRevenue,
      bookingsCount: dayBookings.length
    });
  }

  return points;
}

function isApprovedPaymentIntent(status: PaymentIntent["status"]): boolean {
  return status === "approved" || status === "authorized";
}

function resolveBookingActions(booking: Booking): BookingAction[] {
  switch (booking.status) {
    case "pendente":
      return [
        { label: "Confirmar", nextStatus: "confirmado", tone: "primary" },
        { label: "Cancelar", nextStatus: "cancelado", tone: "danger" }
      ];
    case "aguardando pagamento":
      return [{ label: "Cancelar", nextStatus: "cancelado", tone: "danger" }];
    case "confirmado":
      return [
        { label: "Concluir", nextStatus: "concluido", tone: "primary" },
        { label: "Cancelar", nextStatus: "cancelado", tone: "danger" }
      ];
    default:
      return [];
  }
}

function canRescheduleBooking(booking: Booking): boolean {
  return booking.status === "pendente" || booking.status === "aguardando pagamento" || booking.status === "confirmado";
}

function resolveBookingActionFeedback(status: Booking["status"]): string {
  switch (status) {
    case "confirmado":
      return "Booking confirmada para operacao.";
    case "concluido":
      return "Atendimento marcado como concluido.";
    case "cancelado":
      return "Booking cancelada no shell admin.";
    default:
      return "Booking atualizada.";
  }
}

function resolveBookingTitle(
  booking: Booking,
  services: readonly Service[],
  professionals: readonly Professional[]
): string {
  const service = services.find((item) => item.id === booking.serviceId);
  const professional = professionals.find((item) => item.id === booking.professionalId);
  return `${service?.nome ?? "Servico"} - ${professional?.nome ?? "Profissional"}`;
}

function resolveClientName(clientId: string, clients: readonly Client[]): string {
  return clients.find((client) => client.id === clientId)?.nome ?? "Cliente";
}

function resolveClientPhone(clientId: string, clients: readonly Client[]): string {
  return clients.find((client) => client.id === clientId)?.telefone ?? "Sem telefone";
}

function resolveBookingStatusTone(status: Booking["status"]): string {
  switch (status) {
    case "confirmado":
    case "concluido":
      return "success";
    case "pendente":
    case "aguardando pagamento":
      return "info";
    case "cancelado":
    case "faltou":
      return "danger";
    default:
      return "neutral";
  }
}

function resolvePaymentIntentTone(status: PaymentIntent["status"]): string {
  switch (status) {
    case "approved":
    case "authorized":
      return "success";
    case "rejected":
    case "cancelled":
    case "charged_back":
    case "refunded":
      return "danger";
    case "expired":
      return "warning";
    default:
      return "info";
  }
}

function resolveActionButtonClassName(tone: BookingAction["tone"]): string {
  if (tone === "primary") {
    return "primary-button";
  }
  if (tone === "danger") {
    return "secondary-button is-danger";
  }
  return "secondary-button";
}

function formatBookingStatus(status: Booking["status"]): string {
  if (status.length === 0) {
    return status;
  }
  return `${status.slice(0, 1).toUpperCase()}${status.slice(1)}`;
}

function formatPaymentIntentStatus(status: PaymentIntent["status"]): string {
  const label = status.replace(/_/g, " ");
  return `${label.slice(0, 1).toUpperCase()}${label.slice(1)}`;
}

function formatCashEntryKind(kind: CashEntry["kind"]): string {
  if (kind === "recognized_revenue") {
    return "Receita reconhecida";
  }
  return "Entrada online";
}

function formatCashEntryStatus(status: CashEntry["status"]): string {
  return status === "open" ? "Ativo" : "Revertido";
}

function isOpenBookingStatus(status: Booking["status"]): boolean {
  return status === "pendente" || status === "aguardando pagamento" || status === "confirmado";
}

function isPendingBookingStatus(status: Booking["status"]): boolean {
  return status === "pendente" || status === "aguardando pagamento";
}

function isSameCalendarDay(value: string, baseDate: Date): boolean {
  const date = new Date(value);
  return (
    date.getFullYear() === baseDate.getFullYear() &&
    date.getMonth() === baseDate.getMonth() &&
    date.getDate() === baseDate.getDate()
  );
}

function extractDatePart(value: string): string {
  return value.slice(0, 10);
}

function formatDateInputValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDaysToDateValue(value: string, days: number): string {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInputValue(date);
}

function addMonthsToDateValue(value: string, months: number): string {
  const date = new Date(`${value}T12:00:00`);
  const dayOfMonth = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(dayOfMonth, lastDay));
  return formatDateInputValue(date);
}

function formatAgendaDayLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatAgendaMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatDateShort(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(`${value}T12:00:00`)
  );
}

function formatClockTime(value: string): string {
  const normalizedValue = value.includes("T")
    ? new Date(value)
    : new Date(`2000-01-01T${value.length === 5 ? `${value}:00` : value}`);
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(normalizedValue);
}

function formatTimeRange(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });
  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

function formatAgendaWeekLabel(dates: readonly string[]): string {
  if (dates.length === 0) {
    return "Semana sem datas";
  }

  const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  const startLabel = formatter.format(new Date(`${dates[0]}T12:00:00`));
  const endLabel = formatter.format(new Date(`${dates[dates.length - 1]}T12:00:00`));
  return `${startLabel} - ${endLabel}`;
}

function resolveDashboardRangeLabel(range: DashboardRange): string {
  if (range === "7d") {
    return "ultimos 7 dias";
  }
  if (range === "30d") {
    return "ultimos 30 dias";
  }
  return "todo o historico";
}

function resolveReportComparisonLabel(
  current: number,
  previous: number,
  mode: "count" | "currency" | "percentage",
  enableComparison = true
): string {
  if (!enableComparison) {
    return "Sem comparativo em todo o historico";
  }

  if (current === previous) {
    return "Estavel vs periodo anterior";
  }

  const delta = current - previous;
  const direction = delta > 0 ? "Acima" : "Abaixo";
  const absoluteDelta =
    mode === "currency"
      ? formatCurrency(Math.abs(delta))
      : mode === "percentage"
        ? formatPercentage(Math.abs(delta))
        : String(Math.abs(Math.round(delta)));

  if (previous === 0) {
    return `${direction} ${absoluteDelta} vs periodo anterior sem base`;
  }

  const variation = Math.round((Math.abs(delta) / Math.abs(previous)) * 100);
  return `${direction} ${absoluteDelta} (${variation}%) vs periodo anterior`;
}

function resolveClientReturnWindowDays(window: ClientReturnWindow): number {
  if (window === "30d") {
    return 30;
  }
  if (window === "60d") {
    return 60;
  }
  return 90;
}

function resolveClientReturnWindowLabel(window: ClientReturnWindow): string {
  return `${resolveClientReturnWindowDays(window)} dias`;
}

function isCounterBookingStepAvailable(
  step: CounterBookingStep,
  service?: Service,
  professional?: Professional,
  slot?: AvailabilitySlot
): boolean {
  if (step === "service") {
    return true;
  }
  if (step === "professional") {
    return Boolean(service);
  }
  if (step === "slot") {
    return Boolean(service && professional);
  }
  return Boolean(service && professional && slot);
}

function isCounterBookingStepComplete(
  step: CounterBookingStep,
  service: Service | undefined,
  professional: Professional | undefined,
  slot: AvailabilitySlot | undefined,
  form: CounterBookingFormState
): boolean {
  if (step === "service") {
    return Boolean(service);
  }
  if (step === "professional") {
    return Boolean(professional);
  }
  if (step === "slot") {
    return Boolean(slot);
  }

  return Boolean(form.nome.trim() && form.telefone.trim() && form.email.trim());
}

function resolveCounterBookingStepValidationMessage(step: CounterBookingStep): string {
  if (step === "service") {
    return "Escolha um servico para iniciar o agendamento.";
  }
  if (step === "professional") {
    return "Selecione um profissional compativel com o servico.";
  }
  if (step === "slot") {
    return "Escolha uma data e um slot real antes de continuar.";
  }
  return "Preencha nome, telefone e e-mail do cliente antes de salvar.";
}

function resolveNextCounterBookingStep(step: CounterBookingStep): CounterBookingStep | null {
  if (step === "service") {
    return "professional";
  }
  if (step === "professional") {
    return "slot";
  }
  if (step === "slot") {
    return "client";
  }
  return null;
}

function resolvePreviousCounterBookingStep(step: CounterBookingStep): CounterBookingStep | null {
  if (step === "client") {
    return "slot";
  }
  if (step === "slot") {
    return "professional";
  }
  if (step === "professional") {
    return "service";
  }
  return null;
}

function calculateRuleDurationMinutes(rule?: AvailabilityRule): number {
  if (!rule) {
    return 0;
  }
  return calculateClockDurationMinutes(rule.faixa.startTime, rule.faixa.endTime);
}

function calculateClockDurationMinutes(startTime: string, endTime: string): number {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);
  return Math.max(endHour * 60 + endMinute - (startHour * 60 + startMinute), 0);
}

function calculateBookingDurationMinutes(booking: Booking): number {
  const startAt = new Date(booking.startAt).getTime();
  const endAt = new Date(booking.endAt).getTime();
  return Math.max(Math.round((endAt - startAt) / 60000), 0);
}

function formatMinutesAsHours(value: number): string {
  if (value <= 0) {
    return "0h";
  }

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours}h${String(minutes).padStart(2, "0")}`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${minutes}min`;
}

function formatUtilization(bookedMinutes: number, totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return "0%";
  }

  return `${Math.min(Math.round((bookedMinutes / totalMinutes) * 100), 999)}%`;
}

function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function calculateDaysSinceIso(value: string): number {
  const now = new Date();
  const date = new Date(value);
  return Math.max(Math.floor((now.getTime() - date.getTime()) / 86400000), 0);
}

function formatDaysSince(value: string): string {
  const days = calculateDaysSinceIso(value);
  if (days === 0) {
    return "0 dias";
  }
  if (days === 1) {
    return "1 dia";
  }
  return `${days} dias`;
}

function resolveClientSegmentTone(
  segment: Exclude<ClientSegmentFilter, "all">
): "neutral" | "success" | "warning" {
  if (segment === "returning") {
    return "success";
  }
  if (segment === "inactive") {
    return "warning";
  }
  return "neutral";
}

function formatClientSegment(
  segment: Exclude<ClientSegmentFilter, "all">,
  window: ClientReturnWindow
): string {
  if (segment === "returning") {
    return "Retorno recente";
  }
  if (segment === "inactive") {
    return `Sem retorno ${resolveClientReturnWindowLabel(window)}`;
  }
  return "Nunca concluiu";
}

function resolveUtilizationTone(bookedMinutes: number, totalMinutes: number): string {
  if (totalMinutes <= 0) {
    return "neutral";
  }

  const ratio = bookedMinutes / totalMinutes;
  if (ratio >= 0.8) {
    return "success";
  }
  if (ratio >= 0.45) {
    return "warning";
  }
  return "info";
}

function resolveAdminDisplayName(email: string): string {
  const localPart = email.trim().split("@")[0] ?? "";
  const cleaned = localPart.replace(/[._-]+/g, " ").trim();

  if (!cleaned) {
    return "Admin";
  }

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function resolveProfessionalInitials(value: string): string {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "AG";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function resolveServiceName(serviceId: string, services: readonly Service[]): string {
  return services.find((service) => service.id === serviceId)?.nome ?? "Servico";
}

function resolveProfessionalName(professionalId: string, professionals: readonly Professional[]): string {
  return professionals.find((professional) => professional.id === professionalId)?.nome ?? "Profissional";
}

function getSupportedProfessionalsForService(
  professionals: readonly Professional[],
  serviceId: string
): Professional[] {
  if (!serviceId) {
    return [...professionals];
  }

  return professionals.filter((professional) => professional.especialidades.includes(serviceId));
}

function findMatchingClient(
  clients: readonly Client[],
  form: Pick<CounterBookingFormState, "email" | "telefone" | "nome">
): Client | undefined {
  const normalizedEmail = form.email.trim().toLowerCase();
  const normalizedPhone = normalizePhoneLookup(form.telefone);
  const normalizedName = form.nome.trim().toLowerCase();

  return clients.find((client) => {
    const clientEmail = client.email.trim().toLowerCase();
    const clientPhone = normalizePhoneLookup(client.telefone);
    const clientName = client.nome.trim().toLowerCase();

    if (normalizedEmail && clientEmail && normalizedEmail === clientEmail) {
      return true;
    }

    if (normalizedPhone && clientPhone && normalizedPhone === clientPhone) {
      return true;
    }

    return Boolean(normalizedName) && normalizedName === clientName;
  });
}

function normalizePhoneLookup(value: string): string {
  return value.replace(/\D+/g, "");
}

function resolveProfessionalServiceNames(
  professional: Professional,
  services: readonly Service[]
): string[] {
  return professional.especialidades
    .map((serviceId) => services.find((service) => service.id === serviceId)?.nome)
    .filter((value): value is string => Boolean(value));
}

function resolveProfessionalSummaryLine(serviceNames: readonly string[]): string {
  if (!serviceNames.length) {
    return "Sem servicos vinculados";
  }

  if (serviceNames.length <= 2) {
    return serviceNames.join("  |  ");
  }

  return `${serviceNames.slice(0, 2).join("  |  ")} +${serviceNames.length - 2}`;
}

function resolveProfessionalStatusTone(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active" || normalized === "ativo") {
    return "success";
  }

  if (
    normalized === "inactive" ||
    normalized === "inativo" ||
    normalized.includes("ferias") ||
    normalized.includes("ferias")
  ) {
    return "warning";
  }

  return "neutral";
}

function formatProfessionalStatus(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active") {
    return "Ativo";
  }
  if (normalized === "inactive") {
    return "Inativo";
  }
  if (normalized === "ativo") {
    return "Ativo";
  }
  if (normalized === "inativo") {
    return "Inativo";
  }
  if (normalized.includes("ferias") || normalized.includes("ferias")) {
    return "Ferias";
  }

  if (!status.trim()) {
    return "Sem status";
  }

  return `${status.trim().slice(0, 1).toUpperCase()}${status.trim().slice(1)}`;
}

function resolveAvailabilitySummary(rules: readonly AvailabilityRule[]): string {
  if (!rules.length) {
    return "Sem horarios";
  }

  return `${rules.length} dia(s) ativos`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function toggleArrayValue<T extends string>(items: readonly T[], candidate: T): T[] {
  return items.includes(candidate) ? items.filter((item) => item !== candidate) : [...items, candidate];
}

function parseRequiredInteger(value: string, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Campo ${fieldName} precisa ser um inteiro positivo.`);
  }
  return parsed;
}

function parseRequiredNumber(value: string, fieldName: string): number {
  const parsed = Number(value.replace(",", "."));
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Campo ${fieldName} precisa ser um numero valido.`);
  }
  return parsed;
}

function parseOptionalInteger(value: string): number | undefined {
  return value.trim() ? parseRequiredInteger(value, "numero") : undefined;
}

function parseOptionalNumber(value: string): number | undefined {
  return value.trim() ? parseRequiredNumber(value, "valor") : undefined;
}

function emptyToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function sanitizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Falha inesperada na operacao administrativa.";
}

function loadStoredValue(key: string, fallback: string): string {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storeValue(key: string, value: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (value) {
      window.localStorage.setItem(key, value);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Local persistence is optional.
  }
}
