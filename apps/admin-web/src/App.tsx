import { Fragment, useEffect, useState, type CSSProperties, type FormEvent, type JSX } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  Calendar as CalendarIcon,
  CalendarDays,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Link as LinkIcon,
  ListTodo,
  Menu,
  MessageCircle,
  Plus,
  Rocket,
  Search,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  XCircle,
  type LucideIcon
} from "lucide-react";

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
type BookingFilter = "today" | "open" | "all";
type AgendaViewMode = "day" | "week" | "month";
type DashboardRange = "7d" | "30d" | "all";
type DashboardWorkspaceTab = "executive" | "agenda" | "clients";
type ProfessionalWorkspaceMode = "overview" | "profile" | "availability";
type ClientReturnWindow = "30d" | "60d" | "90d";
type ClientSegmentFilter = "all" | "returning" | "inactive" | "never_completed";
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
    description: "Comparativos por periodo de agenda, receita e retorno do tenant.",
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
    title: "Agenda e leitura de capacidade",
    description:
      "Timeline diaria com reagendamento por slot real, leitura semanal de capacidade e visao mensal navegavel; drag-and-drop continua fora do corte.",
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
  const [bookingFilter, setBookingFilter] = useState<BookingFilter>("today");
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>("30d");
  const [dashboardWorkspaceTab, setDashboardWorkspaceTab] = useState<DashboardWorkspaceTab>("executive");
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
    if (typeof window === "undefined") {
      return;
    }

    let isCompactShell = window.innerWidth <= ADMIN_SHELL_COMPACT_BREAKPOINT;
    if (isCompactShell) {
      setIsSidebarOpen(false);
      setIsSidebarCollapsed(false);
    }

    const syncShellMode = () => {
      const nextCompactShell = window.innerWidth <= ADMIN_SHELL_COMPACT_BREAKPOINT;
      if (nextCompactShell === isCompactShell) {
        return;
      }

      isCompactShell = nextCompactShell;
      setIsSidebarOpen(false);
      if (nextCompactShell) {
        setIsSidebarCollapsed(false);
      }
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
      setServiceForm(defaultServiceForm);
      return;
    }

    setSlug(bootstrap.session.tenant.slug);
    setBrandingForm(toBrandingForm(bootstrap.session.tenant.branding));
    setPaymentForm(toPaymentForm(bootstrap.paymentSettings));

    const service =
      bootstrap.services.find((item) => item.id === selectedServiceId) ?? bootstrap.services[0];
    if (service) {
      if (service.id !== selectedServiceId) {
        setSelectedServiceId(service.id);
      }
      setServiceForm(toServiceForm(service));
    } else {
      if (selectedServiceId) {
        setSelectedServiceId("");
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
  }, [bootstrap, isCreatingProfessional, selectedProfessionalId, selectedServiceId]);

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
  const agendaBookings = filterAgendaBookings(bookings, bookingFilter);
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

  function navigateTo(route: AdminRoute): void {
    const nextHash = `#${route}`;
    if (typeof window !== "undefined" && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setCurrentRoute(route);
    setIsSidebarOpen(false);
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

  function openProfessionalAvailabilityWorkspace(professionalId: string): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(professionalId);
    setProfessionalWorkspaceMode("availability");
    scrollProfessionalsWorkspaceIntoView();
  }

  function openProfessionalAgenda(professionalId: string): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(professionalId);
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
      if (agendaViewMode === "week") {
        return addDaysToDateValue(current, step * 7);
      }

      if (agendaViewMode === "month") {
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

  function handleOpenAgendaBooking(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setAgendaViewMode("day");
    navigateTo("agenda");
  }

  function handleOpenAgendaWeekBooking(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setAgendaViewMode("day");
  }

  function handleOpenAgendaMonthDate(date: string, bookingsForDate: readonly Booking[]): void {
    setAgendaDate(date);
    setRescheduleDate(date);
    if (bookingsForDate.length > 0) {
      handleAgendaBookingSelection(bookingsForDate[0]);
      return;
    }

    setSelectedAgendaBookingId("");
    setSelectedAgendaSlotStartAt("");
  }

  function renderAgendaRecords(): JSX.Element {
    if (!agendaBookings.length) {
      return (
        <p className="empty-state">Nenhum booking encontrado para este filtro operacional.</p>
      );
    }

    return (
      <>
        {agendaBookings.map((booking) => {
          const service = services.find((item) => item.id === booking.serviceId);
          const professional = professionals.find((item) => item.id === booking.professionalId);
          const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
          const actions = resolveBookingActions(booking);
          const canSyncPayment = paymentIntent !== undefined && paymentIntent.status !== "approved";

          return (
            <article className="record-card agenda-card" key={booking.id}>
              <div className="record-card-header">
                <div className="record-stack">
                  <strong>{resolveBookingTitle(booking, services, professionals)}</strong>
                  <span>{resolveClientName(booking.clientId, clients)}</span>
                </div>
                <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                  {formatBookingStatus(booking.status)}
                </span>
              </div>

              <div className="record-meta">
                <span>{formatDateTime(booking.startAt)}</span>
                <span>{service ? formatCurrency(service.precoBase) : "Preco nao encontrado"}</span>
                <span>{professional?.nome ?? "Profissional nao encontrado"}</span>
              </div>

              {paymentIntent ? (
                <div className="record-meta">
                  <span className={`status-pill is-${resolvePaymentIntentTone(paymentIntent.status)}`}>
                    Pagamento {formatPaymentIntentStatus(paymentIntent.status)}
                  </span>
                  {paymentIntent.paymentId ? (
                    <span className="status-pill is-neutral">MP {paymentIntent.paymentId}</span>
                  ) : (
                    <span className="status-pill is-neutral">Sem `paymentId` conciliado</span>
                  )}
                </div>
              ) : null}

              {booking.status === "aguardando pagamento" ? (
                <p className="helper">
                  Este horario segue bloqueado aguardando a conciliacao do pagamento online.
                </p>
              ) : null}

              {actions.length || canSyncPayment ? (
                <div className="record-card-actions">
                  {canRescheduleBooking(booking) ? (
                    <button
                      className="secondary-button"
                      disabled={isBusy}
                      onClick={() => handleOpenAgendaBooking(booking)}
                      type="button"
                    >
                      Reagendar
                    </button>
                  ) : null}
                  {actions.map((action) => (
                    <button
                      className={resolveActionButtonClassName(action.tone)}
                      disabled={isBusy}
                      key={action.label}
                      onClick={() => void handleBookingStatusAction(booking.id, action.nextStatus)}
                      type="button"
                    >
                      {action.label}
                    </button>
                  ))}
                  {paymentIntent && canSyncPayment ? (
                    <button
                      className="secondary-button"
                      disabled={isBusy}
                      onClick={() => void handlePaymentSync(paymentIntent)}
                      type="button"
                    >
                      Atualizar pagamento
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="helper">Nenhuma acao operacional adicional para este status.</p>
              )}
            </article>
          );
        })}
      </>
    );
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
              <span>Leitura derivada de booking real</span>
              {entry.lastCashEntry ? (
                <span>
                  Ultimo movimento financeiro {formatDateTime(entry.lastCashEntry.occurredAt)}
                </span>
              ) : (
                <span>Nenhum movimento financeiro persistido</span>
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
    return (
      <EntitySection
        title="Lista e editor de servicos"
        description="Cadastro real de servicos e de politica comercial sem misturar agenda, equipe ou operacao diaria."
      >
        <div className="editor-layout">
          <div className="entity-list">
            {services.length ? (
              services.map((service) => (
                <button
                  className={service.id === selectedServiceId ? "entity-card is-active" : "entity-card"}
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  type="button"
                >
                  <strong>{service.nome}</strong>
                  <span>
                    {service.duracaoMin} min - {formatCurrency(service.precoBase)}
                  </span>
                  <small>
                    {service.paymentPolicy.collectionMode === "none"
                      ? "Reserva imediata"
                      : service.paymentPolicy.collectionMode}
                  </small>
                </button>
              ))
            ) : (
              <p className="empty-state">Nenhum servico cadastrado ainda.</p>
            )}
          </div>

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
          </form>
        </div>
      </EntitySection>
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
    return (
      <section className="view-stack operational-view-v2">
        <section className="dashboard-toolbar">
          <div>
            <h2>Operacao de Hoje</h2>
            <p className="helper">{formatAgendaDayLabel(agendaDate)}</p>
          </div>
          <div className="operational-day-switch">
            <button className="secondary-button" onClick={() => handleAgendaDateShift(-1)} type="button">
              Ontem
            </button>
            <button
              className={agendaDate === formatDateInputValue(new Date()) ? "secondary-button is-active" : "secondary-button"}
              onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
              type="button"
            >
              Hoje
            </button>
            <button className="secondary-button" onClick={() => handleAgendaDateShift(1)} type="button">
              Amanha
            </button>
          </div>
        </section>

        <section className="dashboard-metric-grid operational-metric-grid">
          <article className="dashboard-metric-card">
            <div className="dashboard-metric-copy">
              <p>Agendados</p>
              <strong>{filteredDayAgendaBookings.length}</strong>
              <span>No recorte diario selecionado</span>
            </div>
          </article>
          <article className="dashboard-metric-card">
            <div className="dashboard-metric-copy">
              <p>Finalizados</p>
              <strong>{filteredDayAgendaBookings.filter((booking) => booking.status === "concluido").length}</strong>
              <span>Atendimentos concluidos</span>
            </div>
          </article>
          <article className="dashboard-metric-card">
            <div className="dashboard-metric-copy">
              <p>No-Shows</p>
              <strong>{filteredDayAgendaBookings.filter((booking) => booking.status === "faltou").length}</strong>
              <span>Clientes ausentes</span>
            </div>
          </article>
          <article className="dashboard-metric-card">
            <div className="dashboard-metric-copy">
              <p>Previsao Faturar</p>
              <strong>
                {formatCurrency(
                  filteredDayAgendaBookings.reduce(
                    (total, booking) =>
                      total +
                      (services.find((service) => service.id === booking.serviceId)?.precoBase ?? 0),
                    0
                  )
                )}
              </strong>
              <span>Valor bruto das bookings do dia</span>
            </div>
          </article>
        </section>

        <section className="dashboard-surface operational-list-surface">
          <div className="dashboard-surface-header">
            <div>
              <h3>Lista de Atendimentos</h3>
              <p>Timeline operacional com status, cliente, profissional e acoes reais do runtime.</p>
            </div>
            <div className="operational-legend">
              <span className="status-pill is-warning">
                <Clock className="w-3 h-3" />
                Pendente
              </span>
              <span className="status-pill is-info">
                <CheckCircle className="w-3 h-3" />
                Confirmado
              </span>
              <span className="status-pill is-success">
                <Check className="w-3 h-3" />
                Concluido
              </span>
            </div>
          </div>

          <div className="operational-list">
            {filteredDayAgendaBookings.length ? (
              filteredDayAgendaBookings.map((booking) => {
                const service = services.find((item) => item.id === booking.serviceId);
                const professional = professionals.find((item) => item.id === booking.professionalId);
                const paymentIntent = paymentIntents.find((item) => item.bookingId === booking.id);
                const actions = resolveBookingActions(booking);
                const canSyncPayment = paymentIntent !== undefined && paymentIntent.status !== "approved";

                let rowClassName = "operational-row";
                let statusBadge = (
                  <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                    {formatBookingStatus(booking.status)}
                  </span>
                );

                if (booking.status === "concluido") {
                  rowClassName += " is-muted";
                  statusBadge = (
                    <span className="status-pill is-success">
                      <Check className="w-3 h-3" />
                      Concluido
                    </span>
                  );
                } else if (booking.status === "faltou") {
                  rowClassName += " is-danger";
                  statusBadge = (
                    <span className="status-pill is-danger">
                      <XCircle className="w-3 h-3" />
                      No-Show
                    </span>
                  );
                } else if (booking.status === "confirmado") {
                  statusBadge = (
                    <span className="status-pill is-info">
                      <CheckCircle className="w-3 h-3" />
                      Confirmado
                    </span>
                  );
                } else if (booking.status === "pendente" || booking.status === "aguardando pagamento") {
                  statusBadge = (
                    <span className="status-pill is-warning">
                      <Clock className="w-3 h-3" />
                      {formatBookingStatus(booking.status)}
                    </span>
                  );
                }

                return (
                  <article className={rowClassName} key={booking.id}>
                    <div className="operational-row-main">
                      <div className="operational-row-time">
                        {formatClockTime(booking.startAt)}
                      </div>
                      <div className="operational-row-copy">
                        <div className="operational-row-heading">
                          <strong>{resolveClientName(booking.clientId, clients)}</strong>
                          <span>
                            {service?.nome ?? "Servico"}  |  Prof: <b>{professional?.nome ?? "Profissional"}</b>
                          </span>
                        </div>
                        <div className="operational-row-statuses">
                          {statusBadge}
                          {paymentIntent && isApprovedPaymentIntent(paymentIntent.status) ? (
                            <span className="status-pill is-success">
                              <CreditCard className="w-3 h-3" />
                              Pago antecipado
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="operational-row-side">
                      <div className="operational-row-price">
                        <strong>{service ? formatCurrency(service.precoBase) : "Sem preco"}</strong>
                        <span>{resolveClientPhone(booking.clientId, clients)}</span>
                      </div>
                      <div className="operational-row-actions">
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
                        {booking.status === "pendente" ? (
                          <button className="secondary-button" type="button">
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp (nao funcional)
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            ) : (
              <p className="empty-state">Nenhum atendimento encontrado para {formatAgendaDayLabel(agendaDate)}.</p>
            )}
          </div>
        </section>
      </section>
    );
  }

  function renderDashboardView(): JSX.Element {
    const retentionRate =
      clientPortfolioSummary.activeCount > 0
        ? clientPortfolioSummary.returningCount / clientPortfolioSummary.activeCount
        : 0;
    const todayBookings = bookings.filter((booking) => isSameCalendarDay(booking.startAt, new Date()));
    const todayPendingCount = todayBookings.filter(
      (booking) => booking.status === "pendente" || booking.status === "aguardando pagamento"
    ).length;
    const todayConfirmedCount = todayBookings.filter((booking) => booking.status === "confirmado").length;
    const dashboardTabs: ReadonlyArray<{
      readonly id: DashboardWorkspaceTab;
      readonly label: string;
      readonly icon: LucideIcon;
    }> = [
      { id: "executive", label: "Resumo executivo", icon: LayoutDashboard },
      { id: "agenda", label: "Agenda da semana", icon: CalendarDays },
      { id: "clients", label: "Clientes e retorno", icon: Users }
    ];

    return (
      <DocumentViewLayout
        className="dashboard-document-view"
        eyebrow="Dashboard"
        title="Dashboard central"
        subtitle={`${tenant?.nome ?? "Tenant nao carregado"} · leitura executiva e distribuicao de fluxo do negocio.`}
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
            {publicBookingUrl ? (
              <a className="secondary-button button-link" href={publicBookingUrl} rel="noreferrer" target="_blank">
                Abrir booking
              </a>
            ) : null}
            <button className="secondary-button" onClick={() => navigateTo("relatorios")} type="button">
              Abrir relatorios
            </button>
          </div>
        }
        header={
          <DocumentHeader
            fields={[
              {
                id: "tenant",
                label: "Tenant",
                value: tenant?.nome ?? "Tenant nao carregado"
              },
              {
                id: "slug",
                label: "Slug publica",
                value: tenant?.slug ? `/${tenant.slug}` : "Nao publicada"
              },
              {
                id: "today-bookings",
                label: "Agenda hoje",
                value: `${bookingSummary.today} booking(s)`
              },
              {
                id: "timezone",
                label: "Timezone",
                value: tenant?.timezone ?? "-"
              }
              ,
              {
                id: "range",
                label: "Janela ativa",
                value: resolveDashboardRangeLabel(dashboardRange)
              }
            ]}
          />
        }
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
                            <span>{entry.email || "Sem e-mail visivel"}</span>
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
          ) : (
            <>
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
            </>
          )
        }
        aside={
          <div className="dashboard-aside-stack">
            <EntityAsideSummary
              title={dashboardWorkspaceTab === "agenda" ? "Radar da semana" : "Base real do tenant"}
              description={
                dashboardWorkspaceTab === "agenda"
                  ? "Capacidade e ocupacao da equipe publicada."
                  : "Leitura curta da base real para orientar a proxima navegacao."
              }
              items={
                dashboardWorkspaceTab === "agenda"
                  ? [
                      {
                        id: "capacity",
                        label: "Capacidade total",
                        value: formatMinutesAsHours(weekCapacitySummary.totalMinutes),
                        description: "Disponibilidade derivada da equipe publicada."
                      },
                      {
                        id: "booked",
                        label: "Horas ocupadas",
                        value: formatMinutesAsHours(weekCapacitySummary.bookedMinutes),
                        description: `${weekCapacitySummary.bookingsCount} booking(s) distribuidas na semana.`
                      },
                      {
                        id: "free",
                        label: "Horas livres",
                        value: formatMinutesAsHours(weekCapacitySummary.freeMinutes),
                        description:
                          weekCapacitySummary.totalMinutes > 0
                            ? `${formatUtilization(weekCapacitySummary.bookedMinutes, weekCapacitySummary.totalMinutes)} de ocupacao`
                            : "Sem disponibilidade publicada."
                      },
                      {
                        id: "open",
                        label: "Bookings em aberto",
                        value: weekCapacitySummary.openBookings,
                        description: "Pendencias operacionais ainda vivas na agenda."
                      }
                    ]
                  : [
                      {
                        id: "services",
                        label: "Servicos ativos",
                        value: services.length,
                        description: "Itens comerciais publicados no catalogo."
                      },
                      {
                        id: "professionals",
                        label: "Profissionais publicados",
                        value: professionals.length,
                        description: "Equipe visivel na agenda e no booking."
                      },
                      {
                        id: "today-bookings",
                        label: "Agendamentos para hoje",
                        value: bookingSummary.today,
                        description: "Fila operacional do dia corrente."
                      },
                      {
                        id: "clients",
                        label: "Clientes capturados",
                        value: clients.length,
                        description: "Base formada a partir da jornada publica."
                      }
                    ]
              }
            />

            <EntityAsideSummary
              title="Acessos rapidos"
              description="Rotas mais uteis a partir desta visao."
              items={[
                {
                  id: "operacional",
                  label: "Operacao diaria",
                  description: "Confirmar, concluir e reagendar atendimentos.",
                  action: (
                    <button className="secondary-button" onClick={() => navigateTo("operacional")} type="button">
                      Abrir
                    </button>
                  )
                },
                {
                  id: "agenda",
                  label: "Agenda",
                  description: "Dia, semana e calendario mensal com capacidade.",
                  action: (
                    <button className="secondary-button" onClick={() => navigateTo("agenda")} type="button">
                      Abrir
                    </button>
                  )
                },
                {
                  id: "clientes",
                  label: "Clientes",
                  description: "Retorno e historico operacional por cliente.",
                  action: (
                    <button className="secondary-button" onClick={() => navigateTo("clientes")} type="button">
                      Abrir
                    </button>
                  )
                },
                {
                  id: "booking",
                  label: "Booking publico",
                  description: publicBookingUrl || "Slug ainda nao publicada.",
                  action: publicBookingUrl ? (
                    <a className="secondary-button button-link" href={publicBookingUrl} rel="noreferrer" target="_blank">
                      Abrir
                    </a>
                  ) : (
                    <span className="helper-chip">Sem link</span>
                  )
                }
              ]}
            />
          </div>
        }
      />
    );
  }

  function renderAgendaView(): JSX.Element {
    return (
      <section className="view-stack">
        <section className="workspace-grid">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Agenda / calendario</p>
                <h2>Timeline operacional publicada</h2>
              </div>
              <span className="status-pill is-warning">Parcial</span>
            </div>

            <p className="helper">
              A lista cronologica de bookings ja existe. A grade visual de calendario completo, com drag-and-drop e reagendamento, ainda nao faz parte do contrato atual.
            </p>

            <div className="mode-switch">
              <button
                className={bookingFilter === "today" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("today")}
                type="button"
              >
                Hoje
              </button>
              <button
                className={bookingFilter === "open" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("open")}
                type="button"
              >
                Em aberto
              </button>
              <button
                className={bookingFilter === "all" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setBookingFilter("all")}
                type="button"
              >
                Tudo
              </button>
            </div>

            <div className="records-column">{renderAgendaRecords()}</div>
          </article>

          <aside className="panel aside-panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Lacunas</p>
                <h3>O que ainda falta nesta tela</h3>
              </div>
            </div>

            <div className="records-column">
              <div className="list-card">
                <strong>Calendario mensal/semanal (nao funcional)</strong>
                <p>Sem componente de grade e sem endpoint dedicado para ocupacao agregada.</p>
              </div>
              <div className="list-card">
                <strong>Reagendamento visual (nao funcional)</strong>
                <p>A API atual aceita mutacao de booking, mas o shell ainda nao expoe UX de mover horario em calendario.</p>
              </div>
              <div className="list-card">
                <strong>Capacidade e horas ociosas (nao funcional)</strong>
                <p>Nao existe consolidacao semanal para calcular o insight do mock com confiabilidade.</p>
              </div>
            </div>
          </aside>
        </section>
      </section>
    );
  }

  function renderAgendaWeekView(): JSX.Element {
    return (
      <>
        <div className="records-grid capacity-grid">
          <div className="stat-card">
            <span>Capacidade semanal</span>
            <strong>{formatMinutesAsHours(weekCapacitySummary.totalMinutes)}</strong>
            <small>{filteredWeekProfessionals.length} profissional(is) no recorte</small>
          </div>
          <div className="stat-card">
            <span>Horas ocupadas</span>
            <strong>{formatMinutesAsHours(weekCapacitySummary.bookedMinutes)}</strong>
            <small>{weekCapacitySummary.bookingsCount} booking(s) distribuidas</small>
          </div>
          <div className="stat-card">
            <span>Horas livres</span>
            <strong>{formatMinutesAsHours(weekCapacitySummary.freeMinutes)}</strong>
            <small>{weekCapacitySummary.totalMinutes > 0 ? formatUtilization(weekCapacitySummary.bookedMinutes, weekCapacitySummary.totalMinutes) : "Sem disponibilidade publicada"}</small>
          </div>
          <div className="stat-card">
            <span>Em aberto na semana</span>
            <strong>{weekCapacitySummary.openBookings}</strong>
            <small>Confirmadas, pendentes e aguardando pagamento</small>
          </div>
        </div>

        <section className="agenda-week-layout">
          <article className="panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Calendario semanal</p>
                <h3>Grade densa por profissional</h3>
              </div>
              <span className="status-pill is-warning">Parcial</span>
            </div>

            {isLoadingWeeklyAvailability ? (
              <p className="helper">Carregando disponibilidade semanal da equipe...</p>
            ) : filteredWeekProfessionals.length ? (
              <div className="week-grid-shell">
                <div className="week-grid">
                  <div className="week-grid-header is-professional">Profissional</div>
                  {agendaWeekDates.map((date) => {
                    const daySummary = weekDaySummaries.find((item) => item.date === date);
                    return (
                      <div className="week-grid-header" key={date}>
                        <strong>{formatAgendaDayLabel(date)}</strong>
                        <small>
                          {formatMinutesAsHours(daySummary?.bookedMinutes ?? 0)}
                          {" / "}
                          {formatMinutesAsHours(daySummary?.totalMinutes ?? 0)}
                        </small>
                      </div>
                    );
                  })}

                  {filteredWeekProfessionals.map((professional) => {
                    const professionalSummary = weekProfessionalSummaries.find(
                      (item) => item.professionalId === professional.id
                    );

                    return (
                      <Fragment key={professional.id}>
                        <div className="week-professional-cell">
                          <strong>{professional.nome}</strong>
                          <small>
                            {formatMinutesAsHours(professionalSummary?.bookedMinutes ?? 0)}
                            {" / "}
                            {formatMinutesAsHours(professionalSummary?.totalMinutes ?? 0)}
                          </small>
                        </div>

                        {agendaWeekDates.map((date) => {
                          const cell = buildWeekGridCell(
                            date,
                            professional.id,
                            filteredWeekBookings,
                            weeklyAvailabilityByProfessional
                          );
                          return (
                            <div className="week-day-cell" key={`${professional.id}-${date}`}>
                              <div className="week-day-cell-meta">
                                <span className="status-pill is-neutral">
                                  {cell.rule ? `${cell.rule.faixa.startTime} - ${cell.rule.faixa.endTime}` : "Sem escala"}
                                </span>
                                <span className={`status-pill is-${resolveUtilizationTone(cell.bookedMinutes, cell.totalMinutes)}`}>
                                  {cell.totalMinutes > 0
                                    ? `${formatUtilization(cell.bookedMinutes, cell.totalMinutes)} ocupacao`
                                    : "Sem capacidade"}
                                </span>
                              </div>

                              <div className="week-bookings-list">
                                {cell.bookings.length ? (
                                  cell.bookings.map((booking) => {
                                    const service = services.find((item) => item.id === booking.serviceId);
                                    return (
                                      <button
                                        className="week-booking-chip"
                                        key={booking.id}
                                        onClick={() => handleOpenAgendaWeekBooking(booking)}
                                        type="button"
                                      >
                                        <strong>{formatTimeRange(booking.startAt, booking.endAt)}</strong>
                                        <span>{service?.nome ?? "Servico"}</span>
                                        <small>{resolveClientName(booking.clientId, clients)}</small>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <p className="helper">Sem booking</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="empty-state">Nenhum profissional publicado para montar a grade semanal.</p>
            )}
          </article>

          <aside className="panel aside-panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Capacidade</p>
                <h3>Leitura agregada da semana</h3>
              </div>
            </div>

            <div className="records-column">
              {weekDaySummaries.map((summary) => (
                <div className="list-card" key={summary.date}>
                  <strong>{formatAgendaDayLabel(summary.date)}</strong>
                  <div className="record-meta">
                    <span className="status-pill is-neutral">
                      {formatMinutesAsHours(summary.bookedMinutes)} / {formatMinutesAsHours(summary.totalMinutes)}
                    </span>
                    <span className={`status-pill is-${resolveUtilizationTone(summary.bookedMinutes, summary.totalMinutes)}`}>
                      {summary.totalMinutes > 0
                        ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                        : "Sem capacidade"}
                    </span>
                  </div>
                  <p>
                    {summary.bookingsCount} booking(s) na data, {summary.openBookings} em aberto.
                  </p>
                </div>
              ))}

              <div className="list-card">
                <strong>Lacunas desta tela</strong>
                <p>Drag-and-drop, bloqueios por excecao e alertas preditivos continuam fora do contrato atual.</p>
              </div>
            </div>
          </aside>
        </section>
      </>
    );
  }

  function renderAgendaMonthView(): JSX.Element {
    return (
      <>
        <div className="records-grid capacity-grid">
          <div className="stat-card">
            <span>Capacidade do mes</span>
            <strong>{formatMinutesAsHours(monthCapacitySummary.totalMinutes)}</strong>
            <small>{currentMonthCells.length} dia(s) no recorte atual</small>
          </div>
          <div className="stat-card">
            <span>Horas ocupadas</span>
            <strong>{formatMinutesAsHours(monthCapacitySummary.bookedMinutes)}</strong>
            <small>{monthCapacitySummary.bookingsCount} booking(s) no mes</small>
          </div>
          <div className="stat-card">
            <span>Horas livres</span>
            <strong>{formatMinutesAsHours(monthCapacitySummary.freeMinutes)}</strong>
            <small>
              {monthCapacitySummary.totalMinutes > 0
                ? formatUtilization(monthCapacitySummary.bookedMinutes, monthCapacitySummary.totalMinutes)
                : "Sem disponibilidade publicada"}
            </small>
          </div>
          <div className="stat-card">
            <span>Em aberto no mes</span>
            <strong>{monthCapacitySummary.openBookings}</strong>
            <small>Confirmadas, pendentes e aguardando pagamento</small>
          </div>
        </div>

        <section className="agenda-month-layout">
          <article className="panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Calendario mensal</p>
                <h3>Visao navegavel do mes operacional</h3>
              </div>
              <span className="status-pill is-success">Funcional</span>
            </div>

            <div className="month-grid">
              {weekdayLabels.map((label) => (
                <div className="month-grid-header" key={label}>
                  <strong>{label}</strong>
                </div>
              ))}

              {agendaMonthCells.map((cell) => (
                <button
                  className={[
                    "month-day-cell",
                    cell.inCurrentMonth ? "" : "is-muted",
                    cell.date === selectedMonthCell?.date ? "is-active" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={cell.date}
                  onClick={() => handleOpenAgendaMonthDate(cell.date, cell.bookings)}
                  type="button"
                >
                  <div className="month-day-header">
                    <strong>{formatAgendaMonthDayNumber(cell.date)}</strong>
                    <span className={`status-pill is-${resolveUtilizationTone(cell.bookedMinutes, cell.totalMinutes)}`}>
                      {cell.bookingsCount} booking(s)
                    </span>
                  </div>
                  <div className="record-meta">
                    <span>{cell.openBookings} em aberto</span>
                    <span>{cell.completedBookings} concluidas</span>
                  </div>
                  <small>
                    {cell.totalMinutes > 0
                      ? `${formatMinutesAsHours(cell.bookedMinutes)} / ${formatMinutesAsHours(cell.totalMinutes)}`
                      : "Sem capacidade"}
                  </small>
                </button>
              ))}
            </div>
          </article>

          <aside className="panel aside-panel">
            <div className="panel-header compact">
              <div>
                <p className="eyebrow">Dia selecionado</p>
                <h3>{selectedMonthCell ? formatAgendaDayLabel(selectedMonthCell.date) : "Sem data"}</h3>
              </div>
            </div>

            {selectedMonthCell ? (
              <div className="records-column">
                <div className="list-card">
                  <strong>Resumo do dia</strong>
                  <div className="record-meta">
                    <span className="status-pill is-info">{selectedMonthCell.bookingsCount} booking(s)</span>
                    <span className="status-pill is-success">{selectedMonthCell.completedBookings} concluidas</span>
                    <span className="status-pill is-neutral">{selectedMonthCell.openBookings} em aberto</span>
                  </div>
                  <p>
                    {selectedMonthCell.totalMinutes > 0
                      ? `${formatMinutesAsHours(selectedMonthCell.bookedMinutes)} ocupadas de ${formatMinutesAsHours(selectedMonthCell.totalMinutes)}`
                      : "Sem disponibilidade publicada para este dia."}
                  </p>
                </div>

                <div className="list-card">
                  <strong>Atendimentos do dia</strong>
                  {selectedMonthCell.bookings.length ? (
                    <div className="records-column detail-list">
                      {selectedMonthCell.bookings.slice(0, 6).map((booking) => (
                        <button
                          className="detail-item detail-button"
                          key={booking.id}
                          onClick={() => handleOpenAgendaWeekBooking(booking)}
                          type="button"
                        >
                          <div className="record-card-header">
                            <strong>{resolveBookingTitle(booking, services, professionals)}</strong>
                            <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                              {formatBookingStatus(booking.status)}
                            </span>
                          </div>
                          <div className="record-meta">
                            <span>{formatTimeRange(booking.startAt, booking.endAt)}</span>
                            <span>{resolveClientName(booking.clientId, clients)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p>Nenhuma booking encontrada para esta data.</p>
                  )}
                </div>

                <div className="button-row">
                  <button
                    className="secondary-button"
                    onClick={() => setAgendaViewMode("day")}
                    type="button"
                  >
                    Abrir dia
                  </button>
                </div>

                <div className="list-card">
                  <strong>Lacunas desta tela</strong>
                  <p>Drag-and-drop, bloqueios por excecao e alertas preditivos continuam fora do contrato atual.</p>
                </div>
              </div>
            ) : (
              <p className="empty-state">Selecione um dia do calendario para abrir o resumo operacional.</p>
            )}
          </aside>
        </section>
      </>
    );
  }

  function renderAgendaDayMasterDetail(): JSX.Element {
    const selectedService = services.find((item) => item.id === selectedAgendaBooking?.serviceId);
    const selectedProfessional = professionals.find(
      (item) => item.id === selectedAgendaBooking?.professionalId
    );
    const selectedClient = clients.find((item) => item.id === selectedAgendaBooking?.clientId);

    return (
      <MasterDetailLayout
        className="agenda-master-detail"
        eyebrow="Operacao diaria"
        title="Timeline e detalhe da booking"
        subtitle="Selecione um item da agenda para abrir o detalhe documental e reagendar por slot real."
        masterTitle="Atendimentos do dia"
        masterDescription={`Recorte de ${formatAgendaDayLabel(agendaDate)} com leitura operacional em tempo real.`}
        master={
          filteredDayAgendaBookings.length ? (
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
                    onClick={() => handleAgendaBookingSelection(booking)}
                    type="button"
                  >
                    <div className="timeline-card-header">
                      <strong className="timeline-card-time">
                        {formatTimeRange(booking.startAt, booking.endAt)}
                      </strong>
                      <span className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}>
                        {formatBookingStatus(booking.status)}
                      </span>
                    </div>
                    <div className="record-stack">
                      <strong>{service?.nome ?? "Servico"}</strong>
                      <span>{resolveClientName(booking.clientId, clients)}</span>
                    </div>
                    <div className="record-meta">
                      <span>{professional?.nome ?? "Profissional nao encontrado"}</span>
                      {paymentIntent ? (
                        <span className={`status-pill is-${resolvePaymentIntentTone(paymentIntent.status)}`}>
                          Pagamento {formatPaymentIntentStatus(paymentIntent.status)}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">
              Nenhum atendimento encontrado para {formatAgendaDayLabel(agendaDate)} neste recorte.
            </p>
          )
        }
        detailTitle={selectedAgendaBooking ? "Document view da booking" : "Nenhuma booking selecionada"}
        detailDescription={
          selectedAgendaBooking ?
            "Leitura documental da booking com status, pagamento vinculado e reagendamento por slot real."
          : "Selecione uma booking do dia para abrir o detalhe e reagendar."
        }
        detail={
          selectedAgendaBooking ? (
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
                      value: selectedAgendaPaymentIntent ?
                        formatPaymentIntentStatus(selectedAgendaPaymentIntent.status)
                      : "Sem payment intent",
                      helper: selectedAgendaPaymentIntent?.paymentId ?
                        `MP ${selectedAgendaPaymentIntent.paymentId}`
                      : "Nao existe pagamento vinculado para esta booking.",
                      tone: selectedAgendaPaymentIntent ?
                        (resolvePaymentIntentTone(selectedAgendaPaymentIntent.status) as "info" | "success" | "warning" | "danger")
                      : undefined
                    },
                    {
                      id: "client-phone",
                      label: "Contato",
                      value: selectedClient?.telefone || "Sem telefone",
                      helper: selectedClient?.email ?? "Sem e-mail visivel"
                    }
                  ]}
                />
              }
              tabs={
                <DocumentTabs
                  tabs={[
                    { id: "schedule", label: "Agenda", active: true },
                    { id: "payment", label: "Pagamento" },
                    { id: "gaps", label: "Lacunas" }
                  ]}
                />
              }
              items={
                <>
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
                      description: selectedAgendaPaymentIntent ?
                        formatPaymentIntentStatus(selectedAgendaPaymentIntent.status)
                      : "Sem payment intent nesta booking."
                    }
                  ]}
                />
              }
              impactPanel={
                <DocumentImpactPanel
                  sections={[
                    {
                      id: "agenda-impact",
                      title: "Impacto operacional",
                      tone: "success",
                      items: [
                        "O reagendamento usa slots reais da disponibilidade do profissional.",
                        "A agenda administrativa continua refletindo o status atual da booking."
                      ]
                    },
                    {
                      id: "agenda-gap",
                      title: "Lacunas desta tela",
                      tone: "warning",
                      items: [
                        "Drag-and-drop, bloqueios por excecao e alertas preditivos continuam sem contrato dedicado.",
                        "Nao existe timeline persistida de eventos da booking neste corte."
                      ]
                    }
                  ]}
                />
              }
            />
          ) : undefined
        }
        emptyDetail={<p className="empty-state">Selecione uma booking do dia para abrir o detalhe e reagendar.</p>}
      />
    );
  }

  function renderAgendaViewV2(): JSX.Element {

    if (isAgendaDayMode(agendaViewMode)) {
      return (
        <section className="view-stack">
          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Agenda / calendario</p>
                <h2>Agenda diaria, semanal e mensal</h2>
              </div>
              <span className="status-pill is-warning">Parcial</span>
            </div>

            <p className="helper">
              O shell agora opera a linha do dia com selecao de booking e reagendamento por slot real, alem de uma grade semanal de capacidade por profissional e uma visao mensal navegavel. Drag-and-drop continua fora do corte.
            </p>

            <div className="timeline-toolbar">
              <div className="button-row">
                <button
                  className={agendaViewMode === "day" ? "secondary-button is-active" : "secondary-button"}
                  onClick={() => setAgendaViewMode("day")}
                  type="button"
                >
                  Dia
                </button>
                <button
                  className={agendaViewMode === "week" ? "secondary-button is-active" : "secondary-button"}
                  onClick={() => setAgendaViewMode("week")}
                  type="button"
                >
                  Semana
                </button>
                <button
                  className={agendaViewMode === "month" ? "secondary-button is-active" : "secondary-button"}
                  onClick={() => setAgendaViewMode("month")}
                  type="button"
                >
                  Mes
                </button>
              </div>

              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => handleAgendaDateShift(-1)}
                  type="button"
                >
                  Dia anterior
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
                  type="button"
                >
                  Hoje
                </button>
                <button
                  className="secondary-button"
                  onClick={() => handleAgendaDateShift(1)}
                  type="button"
                >
                  Proximo dia
                </button>
              </div>

              <div className="field timeline-date-field">
                <label htmlFor="agenda-date">Data da agenda</label>
                <input
                  id="agenda-date"
                  onChange={(event) => setAgendaDate(event.target.value)}
                  type="date"
                  value={agendaDate}
                />
              </div>

              <div className="field timeline-date-field">
                <label htmlFor="agenda-professional-filter">Profissional</label>
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
              </div>
            </div>

            <div className="record-meta">
              <span className="status-pill is-neutral">{formatAgendaDayLabel(agendaDate)}</span>
              <span className="status-pill is-info">{agendaDaySummary.total} booking(s) no dia</span>
              <span className="status-pill is-info">Em aberto {agendaDaySummary.open}</span>
              <span className="status-pill is-success">Confirmadas {agendaDaySummary.confirmed}</span>
            </div>
          </article>

          {renderAgendaDayMasterDetail()}
        </section>
      );
    }

    return (
      <section className="view-stack">
        <article className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Agenda / calendario</p>
              <h2>Agenda diaria, semanal e mensal</h2>
            </div>
            <span className="status-pill is-warning">Parcial</span>
          </div>

          <p className="helper">
            O shell agora opera a linha do dia com selecao de booking e reagendamento por slot real, alem de uma grade semanal de capacidade por profissional e uma visao mensal navegavel. Drag-and-drop continua fora do corte.
          </p>

          <div className="timeline-toolbar">
            <div className="button-row">
              <button
                className={agendaViewMode === "day" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setAgendaViewMode("day")}
                type="button"
              >
                Dia
              </button>
              <button
                className={agendaViewMode === "week" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setAgendaViewMode("week")}
                type="button"
              >
                Semana
              </button>
              <button
                className={agendaViewMode === "month" ? "secondary-button is-active" : "secondary-button"}
                onClick={() => setAgendaViewMode("month")}
                type="button"
              >
                Mes
              </button>
            </div>

            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => handleAgendaDateShift(-1)}
                type="button"
              >
                {agendaViewMode === "week" ? "Semana anterior" : "Mes anterior"}
              </button>
              <button
                className="secondary-button"
                onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
                type="button"
              >
                {agendaViewMode === "week" ? "Esta semana" : "Este mes"}
              </button>
              <button
                className="secondary-button"
                onClick={() => handleAgendaDateShift(1)}
                type="button"
              >
                {agendaViewMode === "week" ? "Proxima semana" : "Proximo mes"}
              </button>
            </div>

            <div className="field timeline-date-field">
              <label htmlFor="agenda-date">Data da agenda</label>
              <input
                id="agenda-date"
                onChange={(event) => setAgendaDate(event.target.value)}
                type="date"
                value={agendaDate}
              />
            </div>

            <div className="field timeline-date-field">
              <label htmlFor="agenda-professional-filter">Profissional</label>
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
            </div>
          </div>

          {agendaViewMode === "week" ? (
            <div className="record-meta">
              <span className="status-pill is-neutral">{formatAgendaWeekLabel(agendaWeekDates)}</span>
              <span className="status-pill is-info">
                {formatMinutesAsHours(weekCapacitySummary.bookedMinutes)} ocupadas
              </span>
              <span className="status-pill is-success">
                {formatMinutesAsHours(weekCapacitySummary.freeMinutes)} livres
              </span>
              <span className="status-pill is-info">{weekCapacitySummary.bookingsCount} booking(s) na semana</span>
            </div>
          ) : (
            <div className="record-meta">
              <span className="status-pill is-neutral">{formatAgendaMonthLabel(agendaDate)}</span>
              <span className="status-pill is-info">{monthCapacitySummary.bookingsCount} booking(s) no mes</span>
              <span className="status-pill is-success">
                {formatMinutesAsHours(monthCapacitySummary.freeMinutes)} livres
              </span>
              <span className="status-pill is-info">Em aberto {monthCapacitySummary.openBookings}</span>
            </div>
          )}
        </article>

        {agendaViewMode === "week" ? (
          renderAgendaWeekView()
        ) : (
          renderAgendaMonthView()
        )}
      </section>
    );
  }

  function renderCatalogView(): JSX.Element {
    const selectedService = services.find((service) => service.id === selectedServiceId);
    const isCreatingService = !selectedServiceId;
    const acceptedMethodsLabel = serviceForm.acceptedMethods.length
      ? serviceForm.acceptedMethods.join(" | ")
      : "Sem meio explicito";
    const chargingModeLabel =
      serviceForm.collectionMode === "none" ? "Reserva imediata" : serviceForm.collectionMode;
    const checkoutModeLabel =
      serviceForm.collectionMode === "none" ? "Sem checkout" : serviceForm.checkoutMode;
    const servicesWithSignal = services.filter((service) => service.exigeSinal).length;
    const immediateServices = services.filter((service) => !service.exigeSinal).length;

    return (
      <EntityViewLayout
        className="catalog-entity-view"
        eyebrow="Catalogo"
        title={isCreatingService ? "Novo servico" : selectedService?.nome ?? "Editar servico"}
        subtitle={
          isCreatingService ?
            "Cadastre um novo servico e defina a politica comercial antes de publica-lo na jornada do cliente."
          : "Entity view do servico com identidade, cobranca e meios aceitos ligados ao runtime real."
        }
        statusBadge={
          isCreatingService ? (
            <ViewBadge tone="info">Novo cadastro</ViewBadge>
          ) : (
            <ViewBadge tone={selectedService?.status === "active" ? "success" : "warning"}>
              {selectedService?.status ?? serviceForm.status}
            </ViewBadge>
          )
        }
        pageActions={
          <button
            className="secondary-button"
            onClick={() => {
              setSelectedServiceId("");
              setServiceForm(defaultServiceForm);
            }}
            type="button"
          >
            Novo servico
          </button>
        }
        identityCard={
          <EntityIdentityCard
            title="Identidade comercial"
            description="Resumo do servico selecionado ou do cadastro em andamento."
            fields={[
              {
                id: "service-name",
                label: "Servico",
                value: serviceForm.nome || selectedService?.nome || "Novo servico"
              },
              {
                id: "service-status",
                label: "Status",
                value: selectedService?.status ?? serviceForm.status
              },
              {
                id: "service-duration",
                label: "Duracao",
                value: `${serviceForm.duracaoMin || selectedService?.duracaoMin || 0} min`
              },
              {
                id: "service-price",
                label: "Preco base",
                value: formatCurrency(Number(serviceForm.precoBase || selectedService?.precoBase || 0))
              },
              {
                id: "service-collection",
                label: "Cobranca",
                value: chargingModeLabel,
                helper: checkoutModeLabel
              },
              {
                id: "service-methods",
                label: "Meios aceitos",
                value: acceptedMethodsLabel,
                helper: "Meios usados quando o servico exige pagamento antecipado."
              }
            ]}
          />
        }
        sections={
          <>
            {renderCatalogPanel()}

            <EntitySection
              title="Politica comercial atual"
              description="Leitura rapida do mix atual do catalogo publicado."
            >
              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <strong>{services.length}</strong>
                  <span>Servicos no catalogo</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{servicesWithSignal}</strong>
                  <span>Com sinal antecipado</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{immediateServices}</strong>
                  <span>Reserva imediata</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{professionals.length}</strong>
                  <span>Profissionais para vinculo operacional</span>
                </div>
              </div>
            </EntitySection>
          </>
        }
        aside={
          <div className="catalog-aside-stack">
            <EntityAsideSummary
              title="Escopo funcional desta rota"
              description="O que o runtime atual realmente permite manter aqui."
              items={[
                {
                  id: "catalog-services",
                  label: "Servicos e preco",
                  description: "Ja ligados ao runtime com status, duracao, preco e politica de pagamento.",
                  active: true
                },
                {
                  id: "catalog-policies",
                  label: "Politica de cobranca",
                  description: "Sinal, checkout e meios aceitos fazem parte do payload real do servico.",
                  active: true
                },
                {
                  id: "catalog-publication",
                  label: "Publicacao implicita",
                  description: "A publicacao acontece pela slug e pelos servicos ativos vinculados a profissionais.",
                  active: true
                }
              ]}
            />

            <EntityAsideSummary
              title="Fora do corte atual"
              description="Itens sugeridos pela referencia, mas sem entidade ou contrato proprio no AgendaAI de hoje."
              items={[
                {
                  id: "catalog-products",
                  label: "Produtos, kits e combos",
                  description: "Ainda nao existem contratos dedicados para essas entidades."
                },
                {
                  id: "catalog-addons",
                  label: "Add-ons e bundles",
                  description: "O catalogo atual opera apenas servicos unitarios."
                },
                {
                  id: "catalog-publication-flow",
                  label: "Fluxo editorial de publicacao",
                  description: "Ainda nao existe workflow separado de rascunho, publicacao e revisao."
                }
              ]}
            />
          </div>
        }
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
    const reportsSourceLabel = reportsReadModel ? "Read model do backend" : "Fallback local";
    const reportsSourceHelper = reportsReadModelError
      ? `Leitura dedicada indisponivel; fallback local ativo. ${reportsReadModelError}`
      : isLoadingReportsReadModel
        ? "Atualizando o read model dedicado sem interromper a leitura."
        : reportsReadModel
          ? "Metricas e buckets vieram do endpoint dedicado de reporting."
          : "Sem read model carregado nesta sessao.";

    return (
      <DocumentViewLayout
        className="reports-document-view"
        eyebrow="Leitura comparativa"
        title={tenant?.nome ?? "Tenant nao carregado"}
        subtitle="Relatorios essenciais do tenant com recorte por periodo, servico, profissional e retorno."
        statusBadge={
          <ViewBadge tone="warning">
            {reportsComparisonEnabled ? "Comparativo parcial ativo" : "Sem comparativo no historico total"}
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
          </div>
        }
        header={
          <DocumentHeader
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
              { id: "source", label: "Fonte da leitura", value: reportsSourceLabel }
            ]}
          />
        }
        summary={
          <DocumentSummaryCards
            metrics={[
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
                id: "online",
                label: "Entrada online aprovada",
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
        }
        tabs={
          <DocumentTabs
            tabs={[
              { id: "overview", label: "Receita e agenda", active: true },
              { id: "groups", label: "Servicos e equipe" },
              { id: "retention", label: "Retorno e lacunas" }
            ]}
          />
        }
        items={
          <>
            {isLoadingReportsReadModel ? (
              <div className="feedback-banner is-info">Atualizando read model de relatorios...</div>
            ) : null}
            {reportsReadModelError ? (
              <div className="feedback-banner is-error">{reportsReadModelError}</div>
            ) : null}

            <div className="workspace-grid">
              <EntitySection
                title="Receita e agenda por servico"
                description="Agrupamento por servico com bookings, concluidos, clientes unicos e ticket."
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

              <EntitySection
                title="Performance por profissional"
                description="Leitura da equipe com o mesmo recorte aplicado ao modulo."
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
            </div>

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
                            <span>{entry.email || "Sem e-mail visivel"}</span>
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
          </>
        }
        aside={
          <div className="dashboard-aside-stack">
            <EntityAsideSummary
              title="Leitura deste recorte"
              description="Contexto aplicado antes da interpretacao dos indicadores."
              items={[
                {
                  id: "range-context",
                  label: "Periodo",
                  value: resolveDashboardRangeLabel(reportsRange),
                  description: "Base principal da comparacao de agenda e receita.",
                  active: true
                },
                {
                  id: "service-context",
                  label: "Servico",
                  value: selectedReportService?.nome ?? "Todos",
                  description: "Refina o agrupamento sem criar contrato paralelo.",
                  active: reportsServiceFilter !== "all"
                },
                {
                  id: "professional-context",
                  label: "Profissional",
                  value: selectedReportProfessional?.nome ?? "Todos",
                  description: "Mantem a visao coerente com a agenda operacional.",
                  active: reportsProfessionalFilter !== "all"
                },
                {
                  id: "window-context",
                  label: "Janela de retorno",
                  value: resolveClientReturnWindowLabel(activeClientRecurrence.window),
                  description: "Usada pelo read model para buckets e clientes inativos."
                }
              ]}
            />

            <EntityAsideSummary
              title="Capacidade do modulo hoje"
              description="Estado atual da fonte e das leituras realmente existentes."
              items={[
                {
                  id: "source-state",
                  label: "Fonte da leitura",
                  value: reportsSourceLabel,
                  description: reportsSourceHelper,
                  active: Boolean(reportsReadModel)
                },
                {
                  id: "comparison-state",
                  label: "Comparativo historico",
                  value: reportsComparisonEnabled ? "Ativo" : "Indisponivel",
                  description:
                    reportsComparisonEnabled
                      ? "Compara contra o mesmo recorte imediatamente anterior."
                      : "No historico total, o shell nao promete comparacao consolidada.",
                  active: reportsComparisonEnabled
                },
                {
                  id: "buckets-state",
                  label: "Buckets de retorno",
                  value: activeClientRecurrence.returnBuckets.length,
                  description: "Faixas simples geradas pelo read model atual.",
                  active: activeClientRecurrence.returnBuckets.length > 0
                },
                {
                  id: "financial-state",
                  label: "Base financeira minima",
                  value: formatCurrency(activeReportCurrent.recognizedRevenue),
                  description: "Receita reconhecida e entrada online ja leem `cash entries` minimas."
                }
              ]}
            />
          </div>
        }
        impactPanel={
          <DocumentImpactPanel
            sections={[
              {
                id: "reports-supported",
                title: "Sustentado hoje pelo runtime",
                tone: "success",
                items: [
                  "Comparativo contra periodo anterior quando o recorte permite.",
                  "Agrupamentos por servico e profissional sustentados pelo mesmo payload do modulo.",
                  "Buckets de retorno, clientes inativos e financeiro minimo apoiados pelo read model atual."
                ]
              },
              {
                id: "reports-gaps",
                title: "O que ainda continua parcial",
                tone: "warning",
                items: [
                  "Cohort, score de risco e previsao de reativacao ainda nao existem neste modulo.",
                  "Exportacao e conciliacao contabil completa continuam fora do corte.",
                  "O modulo informa o estado atual do negocio, mas nao substitui um data mart analitico dedicado."
                ]
              }
            ]}
          />
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
        subtitle="Lista derivada do booking publico, com leitura operacional do cliente sem misturar cohort, mensagens e automacoes fora do corte."
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
              <span className="helper-chip">Leitura derivada de booking</span>
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
                  helper: "Soma da receita persistida minima por cliente.",
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
            `${formatClientSegment(resolveClientSegment(selectedClientInsight, clientReturnWindow), clientReturnWindow)} com historico essencial, receita persistida minima e lacunas explicitas do CRM atual.`
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
            { id: "gaps", label: "Lacunas" }
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
            <p className="helper">Nenhuma booking encontrada para este cliente.</p>
          )}
        </EntitySection>

        <EntitySection
          title="Movimentos financeiros persistidos"
          description="Persistencia minima de receita reconhecida e reflexos online ja vinculados ao cliente."
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
            <p className="helper">Nenhum movimento persistido ainda para este cliente.</p>
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
              title: "Leituras suportadas hoje",
              tone: "success",
              items: [
                "Carteira derivada da jornada publica real.",
                `Janela ativa de retorno: ${resolveClientReturnWindowLabel(clientReturnWindow)}.`,
                "Receita persistida minima e historico recente de bookings no mesmo detalhe."
              ]
            },
            {
              id: "crm-gaps",
              title: "Fora do corte atual",
              tone: "warning",
              items: [
                "Ainda nao existe integracao de WhatsApp, score de risco ou cohort dedicado.",
                "O shell nao possui playbook automatico de reativacao nem timeline persistida de interacoes."
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
              description="Parametros de operacao e publicacao expostos no runtime atual."
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
              title="Taxonomia desta area"
              description="O que esta organizado aqui hoje e tem manutencao continua no runtime."
              items={[
                {
                  id: "settings-profile",
                  label: "Publicacao e slug",
                  description: "Nome, slug e URL publica do tenant.",
                  active: true
                },
                {
                  id: "settings-branding",
                  label: "Branding minimo",
                  description: "Mensagem curta da marca e cor de destaque.",
                  active: true
                },
                {
                  id: "settings-payments",
                  label: "Pagamentos",
                  description: "Mercado Pago, callbacks e modo de checkout.",
                  value: paymentForm.status,
                  active: true
                },
                {
                  id: "settings-runtime",
                  label: "Ambiente administrativo",
                  description: "API base, timezone e publicacao do tenant.",
                  active: true
                }
              ]}
            />

            <EntityAsideSummary
              title="Fora do corte atual"
              description="Itens sugeridos pela referencia visual, mas ainda sem lastro completo no runtime."
              items={[
                {
                  id: "settings-subscription",
                  label: "Assinatura AgendaAI",
                  description: "Billing do proprio SaaS ainda nao existe no projeto."
                },
                {
                  id: "settings-webhooks",
                  label: "Webhooks e observabilidade avancada",
                  description: "Hoje o owner edita URLs e credenciais, mas ainda nao existe painel de eventos nem health check."
                },
                {
                  id: "settings-profile-wide",
                  label: "Perfil amplo do negocio",
                  description: "O runtime atual ainda nao possui um update amplo de tenant alem de slug e branding minimo."
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
        className={`admin-sidebar-v2${isSidebarOpen ? " is-open" : ""}${isSidebarCollapsed ? " is-collapsed" : ""}`}
      >
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-brand-main">
            <div className="admin-sidebar-brand-mark">
              <CalendarDays className="w-5 h-5" />
            </div>
            {!isSidebarCollapsed ? (
              <div className="admin-sidebar-brand-copy">
                <strong>AgendaAI</strong>
              </div>
            ) : null}
          </div>
          <button
            aria-label={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}
            className="admin-sidebar-collapse"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            type="button"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="admin-sidebar-nav no-scrollbar">
          {adminNavigationSections.map((section) => (
            <div className="admin-sidebar-group" key={section.label}>
              {!isSidebarCollapsed ? (
                <p className="admin-sidebar-group-label">{section.label}</p>
              ) : (
                <div className="admin-sidebar-group-divider" />
              )}
              {section.routes.map((route) => {
                const definition = adminRouteDefinitions[route];
                const Icon = definition.icon;
                return (
                  <button
                    className={currentRoute === route ? "admin-sidebar-link is-active" : "admin-sidebar-link"}
                    key={route}
                    onClick={() => navigateTo(route)}
                    title={isSidebarCollapsed ? definition.label : undefined}
                    type="button"
                  >
                    <span className="admin-sidebar-link-icon">
                      <Icon className="w-5 h-5" />
                    </span>
                    {!isSidebarCollapsed ? (
                      <span className="admin-sidebar-link-copy">
                        <strong>{definition.label}</strong>
                      </span>
                    ) : null}
                  </button>
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
            {!isSidebarCollapsed ? (
              <>
                <div className="admin-sidebar-profile-copy">
                  <strong>{sidebarProfileName}</strong>
                  <span>{sidebarProfileEmail || "Sem e-mail visivel"}</span>
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
              </>
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
            <div className="admin-topbar-title">
              {currentRoute === "profissionais" ? null : <p>{currentRouteDefinition.eyebrow}</p>}
              <strong>{currentRouteDefinition.label}</strong>
            </div>
          </div>

          <div className="admin-topbar-actions">
            <div className="admin-topbar-search">
              <Search className="w-4 h-4" />
              <span>Buscar cliente...</span>
            </div>
            <button className="admin-icon-button" type="button">
              <Bell className="w-5 h-5" />
            </button>
            <button className="admin-primary-action" onClick={() => navigateTo("agenda")} type="button">
              <Plus className="w-4 h-4" />
              Novo Agendamento
            </button>
          </div>
        </header>

        <section className={currentRoute === "profissionais" ? "admin-stage-content is-professionals-route" : "admin-stage-content"}>
          {currentRoute !== "profissionais" ? (
            <section className="admin-page-hero">
              <div className="admin-page-hero-copy">
                <p className="eyebrow">{currentRouteDefinition.eyebrow}</p>
                <h1>{currentRouteDefinition.title}</h1>
                <p className="description">{currentRouteDefinition.description}</p>
              </div>
              <div className="admin-page-hero-actions">
                <button className="secondary-button" disabled={isBusy} onClick={handleRefreshClick} type="button">
                  Atualizar
                </button>
                <button className="secondary-button" onClick={() => setSessionToken("")} type="button">
                  Sair
                </button>
              </div>
            </section>
          ) : null}

          <section className="admin-content">
          {feedback ? <div className={`feedback-banner is-${feedback.tone}`}>{feedback.message}</div> : null}
          {bootError ? <div className="feedback-banner is-error">{bootError}</div> : null}
          {renderCurrentView()}
          </section>
        </section>
      </div>
    </main>
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

function filterAgendaBookings(bookings: readonly Booking[], filter: BookingFilter): Booking[] {
  return [...bookings]
    .filter((booking) => {
      if (filter === "today") {
        return isSameCalendarDay(booking.startAt, new Date());
      }
      if (filter === "open") {
        return isOpenBookingStatus(booking.status);
      }
      return true;
    })
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
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
  readonly totalMinutes: number;
  readonly bookedMinutes: number;
}> {
  return professionals.map((professional) => {
    const totalMinutes = dates.reduce((total, date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      const rule = availabilityByProfessional[professional.id]?.find((item) => item.weekday === weekday);
      return total + calculateRuleDurationMinutes(rule);
    }, 0);
    const bookedMinutes = bookings
      .filter((booking) => booking.professionalId === professional.id && booking.status !== "cancelado")
      .reduce((total, booking) => total + calculateBookingDurationMinutes(booking), 0);

    return {
      professionalId: professional.id,
      totalMinutes,
      bookedMinutes
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

function isAgendaDayMode(mode: AgendaViewMode): boolean {
  return mode === "day";
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

function formatAgendaMonthDayNumber(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(
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
