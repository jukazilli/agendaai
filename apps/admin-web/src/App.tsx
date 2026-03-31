import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type JSX,
  type ReactNode
} from "react";
import {
  format as formatDateFns,
  getDay,
  parse as parseDateFns,
  startOfWeek
} from "date-fns";
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
  type AdminFinancialReadModel,
  defaultServicePaymentPolicy,
  paymentChargeTypeValues,
  paymentCheckoutModeValues,
  paymentCollectionModeValues,
  paymentMethodValues,
  paymentProviderStatusValues,
  professionalStatusValues,
  serviceStatusValues,
  type AdminReportsReadModel,
  type AvailabilityRule,
  type Bank,
  type BankBalance,
  type BankMovement,
  type Booking,
  type CashClose,
  type CashEntry,
  type Client,
  type CreateTenantCommand,
  type ExpenseSchedule,
  type PaymentIntent,
  type Professional,
  type ReportBuilderCatalog,
  type ReportDefinition,
  type ReportingGroupSummary,
  type ReportingMetricSummary,
  type RevenueSchedule,
  type Service,
  type ProfessionalStatus,
  type ServiceStatus,
  type TenantPaymentSettings
} from "@agendaai/contracts";

import {
  type AvailabilitySlot,
  AdminApiError,
  type CashClosePreviewItemPayload,
  type CashClosePreviewPayload,
  DEFAULT_ADMIN_API_BASE_URL,
  type AdminBootstrapPayload,
  createReportDefinition,
  createBooking,
  createBank,
  createBankBalance,
  createBankMovement,
  createCashClose,
  createClient,
  createExpenseSchedule,
  createProfessional,
  createRevenueSchedule,
  createService,
  createTenantOnboarding,
  executeReportDefinition as executeAdminReportDefinition,
  fetchAdminFinancialReadModel,
  fetchReportBuilderCatalog,
  fetchAdminReportsReadModel,
  fetchAvailabilitySlots,
  fetchAdminBootstrap,
  fetchCashClosePreview,
  fetchProfessionalAvailability,
  listReportDefinitions,
  loginAdmin,
  deleteBank,
  deleteBankBalance,
  deleteExpenseSchedule,
  deleteRevenueSchedule,
  reverseBankMovement,
  resolveAdminApiBaseUrl,
  savePaymentSettings,
  saveProfessionalAvailability,
  syncPaymentIntent,
  payBankMovement,
  receiveBankMovement,
  transferBankMovement,
  updateBooking,
  updateBank,
  updateBankBalance,
  updateBankMovementRecord,
  updateExpenseSchedule,
  deleteService,
  updateProfessional,
  updateRevenueSchedule,
  updateService,
  updateTenantBranding,
  updateTenantSlug
} from "./lib/admin-api";
import { createFallbackReportBuilderCatalog } from "./lib/report-builder-fallback";
import {
  ReportsBuilderWorkspace,
  type ReportsBuilderLookupRow,
  type ReportsBuilderMenuItem,
  type ReportsBuilderTabState
} from "./reports-builder-workspace";
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
  | "financeiro"
  | "relatorios"
  | "operacional"
  | "agenda"
  | "catalogo"
  | "profissionais"
  | "clientes"
  | "configuracoes";
type AgendaViewMode = "day" | "week" | "month";
type DashboardRange = "7d" | "30d" | "all";
type DashboardWorkspaceTab = "cashflow" | "agenda" | "radar";
type FinanceWorkspaceTab =
  | "cashflow"
  | "banks"
  | "balances"
  | "revenues"
  | "expenses"
  | "movements"
  | "close";
type FinancialSituationFilter = "all" | "aberto" | "baixado";
type CashflowMovementStatusFilter =
  | "all"
  | "previsto"
  | "lancado"
  | "estornado";
type CashflowOriginFilter =
  | "all"
  | "manual"
  | "agenda"
  | "receita"
  | "despesa"
  | "fechar_caixa";
type OperationalWorkspaceTab =
  | "overview"
  | "pending"
  | "confirmed"
  | "completed"
  | "noshow";
type ServiceWorkspaceMode = "browse" | "view" | "edit" | "new";
type ProfessionalWorkspaceMode = "profile" | "services" | "availability";
type ProfessionalRecordDialogMode =
  | "closed"
  | "new"
  | "view"
  | "edit"
  | "toggle-status";
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
  readonly status: ServiceStatus;
  readonly collectionMode: PaymentCollectionMode;
  readonly checkoutMode: PaymentCheckoutMode;
  readonly chargeType: PaymentChargeType;
  readonly fixedAmount: string;
  readonly percentage: string;
  readonly acceptedMethods: PaymentMethod[];
}

interface ProfessionalFormState {
  readonly nome: string;
  readonly status: ProfessionalStatus;
  readonly especialidades: string[];
  readonly bankId: string;
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

interface BankFormState {
  readonly codigo: string;
  readonly bacenCode: string;
  readonly nomeBanco: string;
  readonly agencia: string;
  readonly conta: string;
  readonly ativo: boolean;
}

interface BankBalanceFormState {
  readonly codigo: string;
  readonly bankId: string;
  readonly saldoInicial: string;
  readonly dataSaldoInicial: string;
  readonly observacao: string;
}

interface RevenueFormState {
  readonly codigo: string;
  readonly descricao: string;
  readonly valor: string;
  readonly dataVencimento: string;
  readonly tipo: "unica" | "recorrente";
  readonly recorrencia: "semanal" | "mensal";
  readonly quantidadeOcorrencias: string;
  readonly diaSemanaVencimento: string;
  readonly bankId: string;
  readonly baixaAutomatica: "sim" | "nao";
}

interface ExpenseFormState {
  readonly codigo: string;
  readonly descricao: string;
  readonly valor: string;
  readonly dataVencimento: string;
  readonly tipo: "unica" | "recorrente";
  readonly recorrencia: "semanal" | "mensal";
  readonly quantidadeOcorrencias: string;
  readonly diaSemanaVencimento: string;
  readonly beneficiarioNome: string;
  readonly bankId: string;
  readonly baixaAutomatica: "sim" | "nao";
}

interface ReceiveMovementFormState {
  readonly bankIdDestino: string;
  readonly valor: string;
  readonly historico: string;
  readonly dataMovimento: string;
}

interface PayMovementFormState {
  readonly bankIdOrigem: string;
  readonly valor: string;
  readonly historico: string;
  readonly dataMovimento: string;
  readonly beneficiarioNome: string;
}

interface TransferMovementFormState {
  readonly bankIdOrigem: string;
  readonly bankIdDestino: string;
  readonly valor: string;
  readonly historico: string;
  readonly dataMovimento: string;
}

interface ManualMovementFormState {
  readonly tipo: Exclude<BankMovement["tipo"], "estorno">;
  readonly bankIdOrigem: string;
  readonly bankIdDestino: string;
  readonly valor: string;
  readonly historico: string;
  readonly beneficiarioNome: string;
  readonly dataMovimento: string;
}

interface CashCloseFormState {
  readonly bankId: string;
  readonly dateFrom: string;
  readonly dateTo: string;
}

interface ReverseMovementFormState {
  readonly historico: string;
  readonly dataMovimento: string;
}

type FinanceDialogMode = "create" | "view" | "edit";

interface FinanceBrowseFiltersState {
  readonly cashflow: {
    readonly range: DashboardRange;
    readonly bankId: string;
    readonly situation: FinancialSituationFilter;
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly movementStatus: CashflowMovementStatusFilter;
    readonly type: "all" | BankMovement["tipo"];
    readonly origin: CashflowOriginFilter;
    readonly query: string;
  };
  readonly banks: {
    readonly query: string;
    readonly status: "all" | "active" | "inactive";
  };
  readonly balances: {
    readonly query: string;
    readonly bankId: string;
  };
  readonly revenues: {
    readonly query: string;
    readonly bankId: string;
    readonly status: "all" | RevenueSchedule["status"];
    readonly dateFrom: string;
    readonly dateTo: string;
  };
  readonly expenses: {
    readonly query: string;
    readonly bankId: string;
    readonly status: "all" | ExpenseSchedule["status"];
    readonly dateFrom: string;
    readonly dateTo: string;
  };
  readonly movements: {
    readonly query: string;
    readonly bankId: string;
    readonly status: "all" | BankMovement["status"];
    readonly dateFrom: string;
    readonly dateTo: string;
  };
  readonly close: {
    readonly bankId: string;
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly status: "all" | CashClose["status"];
  };
}

interface AgendaFilterDraftState {
  readonly date: string;
  readonly professionalId: string;
  readonly status: "all" | Booking["status"];
  readonly serviceId: string;
  readonly pendingOnly: boolean;
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
    description:
      "Resumo do periodo para receita, volume, ticket e fila em aberto.",
    badge: "Core"
  },
  {
    key: "services",
    label: "Receita e servicos",
    group: "Comercial",
    description:
      "Mix de servicos, receita reconhecida, ticket e clientes unicos."
  },
  {
    key: "team",
    label: "Equipe e produtividade",
    group: "Operacao",
    description:
      "Leitura do resultado por profissional, sem misturar agenda diaria."
  },
  {
    key: "retention",
    label: "Retorno e retencao",
    group: "Clientes",
    description:
      "Base com retorno, sem retorno, recorrencia e clientes em risco."
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

const reportBuilderMenuMeta = {
  "RPT-EXECUTIVE": {
    group: "Gestao",
    label: "Visao executiva",
    description: "Resumo do negocio no recorte ativo."
  },
  "RPT-REVENUE": {
    group: "Comercial",
    label: "Receita e servicos",
    description: "Faturamento, ticket e mix de servicos."
  },
  "RPT-TEAM": {
    group: "Equipe",
    label: "Equipe e produtividade",
    description: "Leitura por profissional e capacidade entregue."
  },
  "RPT-OPERATIONS": {
    group: "Operacao",
    label: "Pendencias operacionais",
    description: "Fila que ainda pede tratamento operacional."
  },
  "RPT-RETENTION": {
    group: "Clientes",
    label: "Retorno e retencao",
    description: "Retorno, recorrencia e inatividade da base."
  },
  "RPT-WEEK": {
    group: "Capacidade",
    label: "Radar semanal",
    description: "Carga da semana para redistribuir operacao."
  },
  "RPT-MONTH": {
    group: "Capacidade",
    label: "Visao mensal",
    description: "Leitura consolidada do mes por dia."
  },
  "RPT-SERVICE-CATALOG": {
    group: "Cadastros",
    label: "Cadastro de servicos",
    description: "Catalogo comercial, preco, duracao e cobranca."
  },
  "RPT-PROFESSIONAL-REGISTRY": {
    group: "Cadastros",
    label: "Cadastro de profissionais",
    description: "Equipe cadastrada, situacao e servicos vinculados."
  },
  "RPT-PAYMENTS": {
    group: "Financeiro",
    label: "Pagamentos e cobranca",
    description: "Cobrancas online ligadas aos atendimentos."
  }
} as const satisfies Record<
  string,
  { group: string; label: string; description: string }
>;

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
  (import.meta.env.VITE_BOOKING_BASE_URL as string | undefined)?.trim() ||
  "http://127.0.0.1:3000";
const ADMIN_SHELL_COMPACT_BREAKPOINT = 1100;
const weekdayLabels = [
  "Dom",
  "Seg",
  "Ter",
  "Qua",
  "Qui",
  "Sex",
  "Sab"
] as const;
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
const defaultAdminRoute: AdminRoute = "dashboard";
const adminRouteDefinitions: Record<AdminRoute, AdminRouteDefinition> = {
  dashboard: {
    label: "Dashboard",
    shortLabel: "DG",
    section: "Gestao do negocio",
    icon: LayoutDashboard,
    eyebrow: "Gestao do negocio",
    title: "Dashboard",
    description:
      "Fluxo de caixa, agenda da semana e radar operacional do negocio.",
    stage: "parcial"
  },
  financeiro: {
    label: "Financeiro",
    shortLabel: "FN",
    section: "Gestao do negocio",
    icon: DollarSign,
    eyebrow: "Gestao do negocio",
    title: "Financeiro",
    description: "Bancos, saldos, receitas, despesas e movimentos bancarios.",
    stage: "funcional"
  },
  relatorios: {
    label: "Relatorios",
    shortLabel: "RL",
    section: "Gestao do negocio",
    icon: TrendingUp,
    eyebrow: "Gestao do negocio",
    title: "Relatorios essenciais do tenant",
    description:
      "Comparativos por periodo, retorno e insights de capacidade sem disputar a operacao da agenda.",
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
    title: "Cadastro de profissionais",
    description:
      "Tela exclusiva para visualizar, incluir, alterar e bloquear profissionais. Vinculos com servicos e agenda ficam em frentes dedicadas.",
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
    routes: ["dashboard", "financeiro", "relatorios"]
  },
  {
    label: "Dia a dia",
    routes: ["agenda"]
  },
  {
    label: "Administracao",
    routes: ["catalogo", "profissionais", "clientes", "configuracoes"]
  }
];

function resolveAdminRouteStageTone(
  stage: AdminRouteDefinition["stage"]
): "success" | "warning" {
  return stage === "funcional" ? "success" : "warning";
}

function formatAdminRouteStage(
  stage: AdminRouteDefinition["stage"]
): string {
  return stage === "funcional" ? "Funcional" : "Parcial";
}

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

const defaultBankForm: BankFormState = {
  codigo: "",
  bacenCode: "001",
  nomeBanco: "",
  agencia: "",
  conta: "",
  ativo: true
};

const defaultBankBalanceForm: BankBalanceFormState = {
  codigo: "",
  bankId: "",
  saldoInicial: "0",
  dataSaldoInicial: formatDateInputValue(new Date()),
  observacao: ""
};

const defaultRevenueForm: RevenueFormState = {
  codigo: "",
  descricao: "",
  valor: "0",
  dataVencimento: formatDateInputValue(new Date()),
  tipo: "unica",
  recorrencia: "semanal",
  quantidadeOcorrencias: "1",
  diaSemanaVencimento: String(new Date().getDay()),
  bankId: "",
  baixaAutomatica: "nao"
};

const defaultExpenseForm: ExpenseFormState = {
  codigo: "",
  descricao: "",
  valor: "0",
  dataVencimento: formatDateInputValue(new Date()),
  tipo: "unica",
  recorrencia: "semanal",
  quantidadeOcorrencias: "1",
  diaSemanaVencimento: String(new Date().getDay()),
  beneficiarioNome: "",
  bankId: "",
  baixaAutomatica: "nao"
};

const defaultReceiveMovementForm: ReceiveMovementFormState = {
  bankIdDestino: "",
  valor: "0",
  historico: "",
  dataMovimento: new Date().toISOString().slice(0, 16)
};

const defaultPayMovementForm: PayMovementFormState = {
  bankIdOrigem: "",
  valor: "0",
  historico: "",
  dataMovimento: new Date().toISOString().slice(0, 16),
  beneficiarioNome: ""
};

const defaultTransferMovementForm: TransferMovementFormState = {
  bankIdOrigem: "",
  bankIdDestino: "",
  valor: "0",
  historico: "",
  dataMovimento: new Date().toISOString().slice(0, 16)
};

const defaultManualMovementForm: ManualMovementFormState = {
  tipo: "ajuste",
  bankIdOrigem: "",
  bankIdDestino: "",
  valor: "0",
  historico: "",
  beneficiarioNome: "",
  dataMovimento: new Date().toISOString().slice(0, 16)
};

const defaultCashCloseForm: CashCloseFormState = {
  bankId: "",
  dateFrom: formatDateInputValue(new Date()),
  dateTo: formatDateInputValue(new Date())
};

const defaultReverseMovementForm: ReverseMovementFormState = {
  historico: "",
  dataMovimento: new Date().toISOString().slice(0, 16)
};

const defaultFinanceBrowseFilters: FinanceBrowseFiltersState = {
  cashflow: {
    range: "30d",
    bankId: "all",
    situation: "all",
    dateFrom: "",
    dateTo: "",
    movementStatus: "all",
    type: "all",
    origin: "all",
    query: ""
  },
  banks: {
    query: "",
    status: "all"
  },
  balances: {
    query: "",
    bankId: "all"
  },
  revenues: {
    query: "",
    bankId: "all",
    status: "all",
    dateFrom: "",
    dateTo: ""
  },
  expenses: {
    query: "",
    bankId: "all",
    status: "all",
    dateFrom: "",
    dateTo: ""
  },
  movements: {
    query: "",
    bankId: "all",
    status: "all",
    dateFrom: "",
    dateTo: ""
  },
  close: {
    bankId: "all",
    dateFrom: formatDateInputValue(new Date()),
    dateTo: formatDateInputValue(new Date()),
    status: "all"
  }
};

const defaultAgendaFilterDraft = (
  dateValue: string
): AgendaFilterDraftState => ({
  date: dateValue,
  professionalId: "all",
  status: "all",
  serviceId: "all",
  pendingOnly: false
});

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

const defaultProfessionalForm: ProfessionalFormState = {
  nome: "",
  status: "active",
  especialidades: [],
  bankId: ""
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

interface WorkspaceRecordModalProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly children: ReactNode;
  readonly footer?: ReactNode;
  readonly onClose: () => void;
}

function WorkspaceRecordModal({
  title,
  subtitle,
  children,
  footer,
  onClose
}: WorkspaceRecordModalProps): JSX.Element {
  return (
    <div
      className="workspace-record-overlay"
      role="presentation"
      onClick={onClose}
    >
      <section
        aria-label={title}
        className="workspace-record-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="workspace-record-modal-header">
          <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button" onClick={onClose} type="button">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="workspace-record-modal-body">{children}</div>
        {footer ? (
          <div className="workspace-record-modal-footer">{footer}</div>
        ) : null}
      </section>
    </div>
  );
}

const brlCurrencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function normalizeCurrencyInputValue(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return "";
  }
  return (Number(digits) / 100).toFixed(2);
}

function formatCurrencyInputValue(value: string): string {
  if (!value.trim()) {
    return "";
  }

  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return "";
  }
  return brlCurrencyFormatter.format(amount);
}

function buildCashClosePreviewSelectionKey(
  sourceType: string,
  sourceId: string
): string {
  return `${sourceType}:${sourceId}`;
}

function resolveNextSlotSuggestion(
  slots: readonly AvailabilitySlot[],
  referenceStartAt: string
): AvailabilitySlot | null {
  const orderedSlots = [...slots].sort((left, right) =>
    left.startAt.localeCompare(right.startAt)
  );
  return (
    orderedSlots.find((slot) => slot.startAt >= referenceStartAt) ??
    orderedSlots[0] ??
    null
  );
}

function CurrencyInput({
  disabled,
  required,
  value,
  onValueChange
}: {
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly value: string;
  readonly onValueChange: (value: string) => void;
}): JSX.Element {
  return (
    <input
      disabled={disabled}
      inputMode="numeric"
      required={required}
      type="text"
      value={formatCurrencyInputValue(value)}
      onChange={(event) =>
        onValueChange(normalizeCurrencyInputValue(event.target.value))
      }
    />
  );
}

function buildReportsBuilderMenuItems(
  catalog: ReportBuilderCatalog | null
): ReportsBuilderMenuItem[] {
  if (!catalog) {
    return [];
  }

  return catalog.systemDefinitions.map((definition) => {
    const meta =
      reportBuilderMenuMeta[
        definition.code as keyof typeof reportBuilderMenuMeta
      ];
    return {
      code: definition.code,
      label: meta?.label ?? definition.name,
      group: meta?.group ?? "Relatorios",
      description:
        meta?.description ??
        definition.description ??
        "Abrir relatorio em dock tab dedicada."
    };
  });
}

function groupReportsBuilderMenuItems(
  items: readonly ReportsBuilderMenuItem[]
): Array<[string, ReportsBuilderMenuItem[]]> {
  const grouped = new Map<string, ReportsBuilderMenuItem[]>();

  items.forEach((item) => {
    const current = grouped.get(item.group) ?? [];
    current.push(item);
    grouped.set(item.group, current);
  });

  return Array.from(grouped.entries());
}

function createReportBuilderTabId(definition: ReportDefinition): string {
  return definition.source === "system"
    ? `system:${definition.code}`
    : `saved:${definition.id}`;
}

function cloneReportDefinition(definition: ReportDefinition): ReportDefinition {
  return JSON.parse(JSON.stringify(definition)) as ReportDefinition;
}

function isMissingReportBuilderRoute(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 404;
}

function createDefaultReportsPaneFilters(
  window: ClientReturnWindow
): ReportsPaneFilters {
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

function describeLookupRange(
  from: string,
  to: string,
  emptyLabel: string
): string {
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

function describeDateWindow(
  from: string,
  to: string,
  fallbackLabel: string
): string {
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
    option.searchTerms.some(
      (term) => normalizeLookupValue(term) === normalizedQuery
    )
  );
  if (exactIndex >= 0) {
    return exactIndex;
  }

  const fuzzyIndex = options.findIndex((option) =>
    option.searchTerms.some((term) =>
      normalizeLookupValue(term).includes(normalizedQuery)
    )
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
  return (
    valueIndex >= Math.min(start, end) && valueIndex <= Math.max(start, end)
  );
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
      isWithinLookupRange(
        booking.serviceId,
        services,
        filters.serviceFrom,
        filters.serviceTo
      )
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

      return [
        client.nome,
        client.telefone,
        client.id,
        `${client.nome} | ${client.telefone}`
      ].some((term) =>
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

  const maxRevenue =
    Math.max(...data.map((item) => item.recognizedRevenue), 1) * 1.2;
  const maxBookings =
    Math.max(...data.map((item) => item.bookingsCount), 1) * 1.2;
  const width = 820;
  const height = 280;
  const paddingX = 42;
  const paddingY = 22;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2 - 20;

  const getX = (index: number) =>
    paddingX + index * (chartWidth / Math.max(data.length - 1, 1));
  const getRevenueY = (value: number) =>
    paddingY + chartHeight - (value / maxRevenue) * chartHeight;
  const getBookingsY = (value: number) =>
    paddingY + chartHeight - (value / maxBookings) * chartHeight;

  const revenuePath = data
    .map(
      (item, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getRevenueY(item.recognizedRevenue)}`
    )
    .join(" ");
  const revenueArea = `${revenuePath} L ${getX(data.length - 1)} ${paddingY + chartHeight} L ${getX(0)} ${paddingY + chartHeight} Z`;
  const bookingsPath = data
    .map(
      (item, index) =>
        `${index === 0 ? "M" : "L"} ${getX(index)} ${getBookingsY(item.bookingsCount)}`
    )
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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="dashboard-chart-svg"
          role="img"
        >
          <defs>
            <linearGradient
              id="agendaaiRevenueArea"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
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
                    <g
                      transform={`translate(${x > width / 2 ? x - 146 : x + 14}, ${paddingY + 8})`}
                    >
                      <rect
                        width="132"
                        height="72"
                        rx="12"
                        fill="rgba(15, 23, 42, 0.96)"
                      />
                      <text
                        x="12"
                        y="24"
                        className="dashboard-chart-tooltip-title"
                      >
                        {item.label}
                      </text>
                      <text
                        x="12"
                        y="44"
                        className="dashboard-chart-tooltip-revenue"
                      >
                        {formatCurrency(item.recognizedRevenue)}
                      </text>
                      <text
                        x="12"
                        y="61"
                        className="dashboard-chart-tooltip-bookings"
                      >
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

function normalizeAdminRoute(route: AdminRoute): AdminRoute {
  return route === "operacional" ? "agenda" : route;
}

function readAdminRouteFromHash(): AdminRoute {
  if (typeof window === "undefined") {
    return defaultAdminRoute;
  }

  const hash = window.location.hash.replace(/^#\/?/, "").trim().toLowerCase();
  return isAdminRoute(hash) ? normalizeAdminRoute(hash) : defaultAdminRoute;
}

export function App() {
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(
    readAdminRouteFromHash
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState(() =>
    loadStoredValue(API_BASE_STORAGE_KEY, DEPLOY_ADMIN_API_BASE_URL)
  );
  const [sessionToken, setSessionToken] = useState(() =>
    loadStoredValue(SESSION_STORAGE_KEY, "")
  );
  const [adminProfile, setAdminProfile] = useState(() => ({
    name: loadStoredValue(ADMIN_PROFILE_NAME_STORAGE_KEY, ""),
    email: loadStoredValue(ADMIN_PROFILE_EMAIL_STORAGE_KEY, "")
  }));
  const [bootstrap, setBootstrap] = useState<AdminBootstrapPayload | null>(
    null
  );
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [dashboardRange, setDashboardRange] = useState<DashboardRange>("30d");
  const [dashboardWorkspaceTab, setDashboardWorkspaceTab] =
    useState<DashboardWorkspaceTab>("cashflow");
  const [dashboardProfessionalFilter, setDashboardProfessionalFilter] =
    useState("all");
  const [financeBrowseFilters, setFinanceBrowseFilters] =
    useState<FinanceBrowseFiltersState>(defaultFinanceBrowseFilters);
  const [isCashflowFilterModalOpen, setIsCashflowFilterModalOpen] =
    useState(false);
  const [cashflowFilterDraft, setCashflowFilterDraft] = useState<
    FinanceBrowseFiltersState["cashflow"]
  >(defaultFinanceBrowseFilters.cashflow);
  const [isCashflowBankLookupOpen, setIsCashflowBankLookupOpen] =
    useState(false);
  const [financialReadModel, setFinancialReadModel] =
    useState<AdminFinancialReadModel | null>(null);
  const [financeWorkspaceTab, setFinanceWorkspaceTab] =
    useState<FinanceWorkspaceTab>("cashflow");
  const [isCashCloseComposerOpen, setIsCashCloseComposerOpen] = useState(false);
  const [financeModal, setFinanceModal] = useState<
    | null
    | "bank"
    | "balance"
    | "revenue"
    | "expense"
    | "receive"
    | "pay"
    | "transfer"
    | "movement"
    | "close"
  >(null);
  const [financeModalMode, setFinanceModalMode] =
    useState<FinanceDialogMode>("create");
  const [editingBankId, setEditingBankId] = useState("");
  const [editingBalanceId, setEditingBalanceId] = useState("");
  const [editingRevenueId, setEditingRevenueId] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState("");
  const [editingMovementId, setEditingMovementId] = useState("");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedBalanceId, setSelectedBalanceId] = useState("");
  const [selectedRevenueId, setSelectedRevenueId] = useState("");
  const [selectedExpenseId, setSelectedExpenseId] = useState("");
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [selectedCashCloseId, setSelectedCashCloseId] = useState("");
  const [bankForm, setBankForm] = useState<BankFormState>(defaultBankForm);
  const [bankBalanceForm, setBankBalanceForm] = useState<BankBalanceFormState>(
    defaultBankBalanceForm
  );
  const [revenueForm, setRevenueForm] =
    useState<RevenueFormState>(defaultRevenueForm);
  const [expenseForm, setExpenseForm] =
    useState<ExpenseFormState>(defaultExpenseForm);
  const [receiveMovementForm, setReceiveMovementForm] =
    useState<ReceiveMovementFormState>(defaultReceiveMovementForm);
  const [payMovementForm, setPayMovementForm] = useState<PayMovementFormState>(
    defaultPayMovementForm
  );
  const [transferMovementForm, setTransferMovementForm] =
    useState<TransferMovementFormState>(defaultTransferMovementForm);
  const [manualMovementForm, setManualMovementForm] =
    useState<ManualMovementFormState>(defaultManualMovementForm);
  const [cashCloseForm, setCashCloseForm] =
    useState<CashCloseFormState>(defaultCashCloseForm);
  const [cashClosePreview, setCashClosePreview] =
    useState<CashClosePreviewPayload | null>(null);
  const [selectedCashClosePreviewKeys, setSelectedCashClosePreviewKeys] =
    useState<string[]>([]);
  const [isLoadingCashClosePreview, setIsLoadingCashClosePreview] =
    useState(false);
  const [cashClosePreviewRequestKey, setCashClosePreviewRequestKey] =
    useState(0);
  const [reverseMovementForm, setReverseMovementForm] =
    useState<ReverseMovementFormState>(defaultReverseMovementForm);
  const [deleteTarget, setDeleteTarget] = useState<null | {
    readonly kind: "bank" | "balance" | "revenue" | "expense";
    readonly id: string;
    readonly label: string;
  }>(null);
  const [reverseTarget, setReverseTarget] = useState<null | {
    readonly kind: "movement" | "agenda";
    readonly movementId: string;
    readonly label: string;
  }>(null);
  const [agendaSettlementTarget, setAgendaSettlementTarget] =
    useState<Booking | null>(null);
  const [receiveTarget, setReceiveTarget] = useState<null | {
    readonly revenueId?: string;
    readonly cashEntryId?: string;
  }>(null);
  const [payTarget, setPayTarget] = useState<null | {
    readonly expenseId?: string;
  }>(null);
  const [isProfessionalBankLookupOpen, setIsProfessionalBankLookupOpen] =
    useState(false);
  const [isProfessionalLookupOpen, setIsProfessionalLookupOpen] =
    useState(false);
  const [professionalRecordDialogMode, setProfessionalRecordDialogMode] =
    useState<ProfessionalRecordDialogMode>("closed");
  const [professionalBrowseSearch, setProfessionalBrowseSearch] = useState("");
  const [professionalBrowseStatusFilter, setProfessionalBrowseStatusFilter] =
    useState<ProfessionalStatus | "all">("all");
  const [professionalServicesSearch, setProfessionalServicesSearch] =
    useState("");
  const [
    professionalServicesStatusFilter,
    setProfessionalServicesStatusFilter
  ] = useState<ServiceStatus | "all">("all");
  const [isAgendaFilterModalOpen, setIsAgendaFilterModalOpen] = useState(false);
  const [agendaFilterDraft, setAgendaFilterDraft] =
    useState<AgendaFilterDraftState>(() =>
      defaultAgendaFilterDraft(formatDateInputValue(new Date()))
    );
  const [operationalWorkspaceTab, setOperationalWorkspaceTab] =
    useState<OperationalWorkspaceTab>("overview");
  const [isShellContextOpen, setIsShellContextOpen] = useState(false);
  const [isShellPulseOpen, setIsShellPulseOpen] = useState(false);
  const [isCounterBookingModalOpen, setIsCounterBookingModalOpen] =
    useState(false);
  const [isAgendaBookingModalOpen, setIsAgendaBookingModalOpen] =
    useState(false);
  const [counterBookingStep, setCounterBookingStep] =
    useState<CounterBookingStep>("service");
  const [counterBookingServiceId, setCounterBookingServiceId] = useState("");
  const [counterBookingProfessionalId, setCounterBookingProfessionalId] =
    useState("");
  const [counterBookingDate, setCounterBookingDate] = useState(() =>
    formatDateInputValue(new Date())
  );
  const [counterBookingSlots, setCounterBookingSlots] = useState<
    AvailabilitySlot[]
  >([]);
  const [
    counterBookingPreferredSlotStartAt,
    setCounterBookingPreferredSlotStartAt
  ] = useState("");
  const [counterBookingSlotStartAt, setCounterBookingSlotStartAt] =
    useState("");
  const [isLoadingCounterBookingSlots, setIsLoadingCounterBookingSlots] =
    useState(false);
  const [counterBookingForm, setCounterBookingForm] =
    useState<CounterBookingFormState>(defaultCounterBookingForm);
  const [counterBookingError, setCounterBookingError] = useState<string | null>(
    null
  );
  const [
    counterBookingConflictSuggestion,
    setCounterBookingConflictSuggestion
  ] = useState<null | {
    readonly slot: AvailabilitySlot;
    readonly message: string;
  }>(null);
  const [isSubmittingCounterBooking, setIsSubmittingCounterBooking] =
    useState(false);
  const [counterBookingReceipt, setCounterBookingReceipt] =
    useState<CounterBookingReceipt | null>(null);
  const [reportsRange, setReportsRange] = useState<DashboardRange>("30d");
  const [reportsServiceFilter, setReportsServiceFilter] = useState("all");
  const [reportsProfessionalFilter, setReportsProfessionalFilter] =
    useState("all");
  const [reportsReadModel, setReportsReadModel] =
    useState<AdminReportsReadModel | null>(null);
  const [reportsReadModelError, setReportsReadModelError] = useState<
    string | null
  >(null);
  const [isLoadingReportsReadModel, setIsLoadingReportsReadModel] =
    useState(false);
  const [clientReturnWindow, setClientReturnWindow] =
    useState<ClientReturnWindow>("30d");
  const [clientSegmentFilter, setClientSegmentFilter] =
    useState<ClientSegmentFilter>("all");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [loginForm, setLoginForm] = useState({
    email: "owner@agendaai.demo",
    password: "agendaai-demo"
  });
  const [openRouteTabs, setOpenRouteTabs] = useState<AdminRoute[]>([
    defaultAdminRoute
  ]);
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
  const [brandingForm, setBrandingForm] =
    useState<BrandingFormState>(defaultBrandingForm);
  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>(defaultPaymentForm);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceWorkspaceMode, setServiceWorkspaceMode] =
    useState<ServiceWorkspaceMode>("browse");
  const [isServiceDeleteDialogOpen, setIsServiceDeleteDialogOpen] =
    useState(false);
  const [serviceForm, setServiceForm] =
    useState<ServiceFormState>(defaultServiceForm);
  const [selectedProfessionalId, setSelectedProfessionalId] = useState("");
  const [isCreatingProfessional, setIsCreatingProfessional] = useState(false);
  const [professionalWorkspaceMode, setProfessionalWorkspaceMode] =
    useState<ProfessionalWorkspaceMode>("profile");
  const [agendaStatusFilter, setAgendaStatusFilter] =
    useState<AgendaFilterDraftState["status"]>("all");
  const [agendaServiceFilter, setAgendaServiceFilter] = useState("all");
  const [agendaPendingOnlyFilter, setAgendaPendingOnlyFilter] = useState(false);
  const [professionalForm, setProfessionalForm] =
    useState<ProfessionalFormState>(defaultProfessionalForm);
  const [availabilityDays, setAvailabilityDays] = useState<
    AvailabilityDayState[]
  >(createDefaultAvailabilityDays());
  const [agendaViewMode, setAgendaViewMode] = useState<AgendaViewMode>("day");
  const [isAgendaDrawerOpen, setIsAgendaDrawerOpen] = useState(true);
  const [agendaDate, setAgendaDate] = useState(() =>
    formatDateInputValue(new Date())
  );
  const [agendaProfessionalFilter, setAgendaProfessionalFilter] =
    useState("all");
  const [selectedAgendaBookingId, setSelectedAgendaBookingId] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState(() =>
    formatDateInputValue(new Date())
  );
  const [agendaSlots, setAgendaSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedAgendaSlotStartAt, setSelectedAgendaSlotStartAt] =
    useState("");
  const [isLoadingAgendaSlots, setIsLoadingAgendaSlots] = useState(false);
  const [
    weeklyAvailabilityByProfessional,
    setWeeklyAvailabilityByProfessional
  ] = useState<Record<string, AvailabilityRule[]>>({});
  const [isLoadingWeeklyAvailability, setIsLoadingWeeklyAvailability] =
    useState(false);
  const [reportsWorkspaceTab, setReportsWorkspaceTab] =
    useState<ReportsWorkspaceTab>("overview");
  const [reportsOpenTabs, setReportsOpenTabs] = useState<ReportsWorkspaceTab[]>(
    ["overview"]
  );
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);
  const [isReportsContextVisible, setIsReportsContextVisible] = useState(false);
  const [reportsAgendaWorkspaceTab, setReportsAgendaWorkspaceTab] =
    useState<ReportsAgendaWorkspaceTab>("week");
  const [reportsFiltersByTab, setReportsFiltersByTab] = useState<
    Partial<Record<ReportsWorkspaceTab, ReportsPaneFilters>>
  >({});
  const [reportsFilterDraft, setReportsFilterDraft] =
    useState<ReportsPaneFilters | null>(null);
  const [isReportsFilterModalOpen, setIsReportsFilterModalOpen] =
    useState(false);
  const [reportsLookupFieldId, setReportsLookupFieldId] = useState<
    string | null
  >(null);
  const [reportsLookupQuery, setReportsLookupQuery] = useState("");
  const financialRange = financeBrowseFilters.cashflow.range;
  const financialSituation = financeBrowseFilters.cashflow.situation;
  const financialBankFilter = financeBrowseFilters.cashflow.bankId;
  const [reportsCatalog, setReportsCatalog] =
    useState<ReportBuilderCatalog | null>(null);
  const [savedReportDefinitions, setSavedReportDefinitions] = useState<
    ReportDefinition[]
  >([]);
  const [reportBuilderTabs, setReportBuilderTabs] = useState<
    ReportsBuilderTabState[]
  >([]);
  const [activeReportBuilderTabId, setActiveReportBuilderTabId] = useState("");
  const [reportsBuilderError, setReportsBuilderError] = useState<string | null>(
    null
  );
  const [isLoadingReportsBuilder, setIsLoadingReportsBuilder] = useState(false);
  const didAutoOpenDefaultReportTabRef = useRef(false);
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
    setOpenRouteTabs((current) =>
      current.includes(currentRoute) ? current : [...current, currentRoute]
    );
  }, [currentRoute]);

  useEffect(() => {
    setReportsOpenTabs((current) =>
      current.includes(reportsWorkspaceTab)
        ? current
        : [...current, reportsWorkspaceTab]
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
      setIsAgendaDrawerOpen(false);
    }

    const syncShellMode = () => {
      const nextCompactShell =
        window.innerWidth <= ADMIN_SHELL_COMPACT_BREAKPOINT;
      if (nextCompactShell === isCompactShell) {
        return;
      }

      isCompactShell = nextCompactShell;
      setIsCompactShell(nextCompactShell);
      setIsSidebarOpen(false);
      setIsAgendaDrawerOpen(!nextCompactShell);
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
      setFeedback((current) =>
        current?.message === feedback.message ? null : current
      );
    }, 3600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [feedback]);

  useEffect(() => {
    if (!sessionToken) {
      setBootstrap(null);
      setFinancialReadModel(null);
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
      setFinancialReadModel(null);
      return;
    }

    let ignore = false;

    async function loadFinancialReadModel() {
      try {
        const nextReadModel = await fetchAdminFinancialReadModel(
          apiBaseUrl,
          sessionToken,
          {
            range: financialRange,
            bankId:
              financialBankFilter !== "all" ? financialBankFilter : undefined,
            situation: financialSituation
          }
        );
        if (!ignore) {
          setFinancialReadModel(nextReadModel);
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

    void loadFinancialReadModel();
    return () => {
      ignore = true;
    };
  }, [
    apiBaseUrl,
    financialBankFilter,
    financialRange,
    financialSituation,
    sessionToken
  ]);

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
        const nextReadModel = await fetchAdminReportsReadModel(
          apiBaseUrl,
          sessionToken,
          {
            range: reportsRange,
            serviceId:
              reportsServiceFilter !== "all" ? reportsServiceFilter : undefined,
            professionalId:
              reportsProfessionalFilter !== "all"
                ? reportsProfessionalFilter
                : undefined,
            returnWindow: clientReturnWindow
          }
        );

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
    if (!sessionToken) {
      setReportsCatalog(null);
      setSavedReportDefinitions([]);
      setReportBuilderTabs([]);
      setActiveReportBuilderTabId("");
      setReportsBuilderError(null);
      setIsLoadingReportsBuilder(false);
      didAutoOpenDefaultReportTabRef.current = false;
      return;
    }

    let ignore = false;
    setIsLoadingReportsBuilder(true);

    async function loadReportBuilderAssets() {
      try {
        let nextCatalog: ReportBuilderCatalog | null = null;
        let nextDefinitions: ReportDefinition[] = [];

        try {
          nextCatalog = await fetchReportBuilderCatalog(
            apiBaseUrl,
            sessionToken
          );
        } catch (error) {
          if (
            isMissingReportBuilderRoute(error) &&
            bootstrap?.session.tenant.id
          ) {
            nextCatalog = createFallbackReportBuilderCatalog(
              bootstrap.session.tenant.id
            );
            setFeedback({
              tone: "info",
              message:
                "O backend atual ainda nao expoe o catalogo do builder. A UI abriu em modo de compatibilidade local."
            });
          } else {
            throw error;
          }
        }

        try {
          nextDefinitions = await listReportDefinitions(
            apiBaseUrl,
            sessionToken
          );
        } catch (error) {
          if (isMissingReportBuilderRoute(error)) {
            nextDefinitions = [];
          } else {
            throw error;
          }
        }

        if (ignore) {
          return;
        }

        setReportsCatalog(nextCatalog);
        setSavedReportDefinitions(nextDefinitions);
        setReportsBuilderError(null);
      } catch (error) {
        if (ignore) {
          return;
        }
        if (error instanceof AdminApiError && error.status === 401) {
          setSessionToken("");
        }
        setReportsCatalog(
          bootstrap?.session.tenant.id
            ? createFallbackReportBuilderCatalog(bootstrap.session.tenant.id)
            : null
        );
        setSavedReportDefinitions([]);
        setReportsBuilderError(
          isMissingReportBuilderRoute(error)
            ? "O backend atual ainda nao expoe as rotas do builder. Atualize o api-rest para liberar modelos salvos e execucao remota."
            : toErrorMessage(error)
        );
      } finally {
        if (!ignore) {
          setIsLoadingReportsBuilder(false);
        }
      }
    }

    void loadReportBuilderAssets();
    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, bootstrap, sessionToken]);

  useEffect(() => {
    if (currentRoute !== "relatorios") {
      return;
    }
    if (didAutoOpenDefaultReportTabRef.current) {
      return;
    }
    if (!reportsCatalog || reportsCatalog.systemDefinitions.length === 0) {
      return;
    }
    if (reportBuilderTabs.length > 0 || activeReportBuilderTabId) {
      return;
    }

    didAutoOpenDefaultReportTabRef.current = true;
    openSystemReportBuilderTab(reportsCatalog.systemDefinitions[0].code);
  }, [
    activeReportBuilderTabId,
    currentRoute,
    reportBuilderTabs.length,
    reportsCatalog
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

    const service = selectedServiceId
      ? bootstrap.services.find((item) => item.id === selectedServiceId)
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

    const professional = selectedProfessionalId
      ? bootstrap.professionals.find(
          (item) => item.id === selectedProfessionalId
        )
      : undefined;
    if (professional) {
      setProfessionalForm({
        nome: professional.nome,
        status: professional.status,
        especialidades: [...professional.especialidades],
        bankId: professional.bankId ?? ""
      });
    } else if (!isCreatingProfessional) {
      setProfessionalForm({
        ...defaultProfessionalForm,
        especialidades: [...defaultProfessionalForm.especialidades]
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
        const rules = await fetchProfessionalAvailability(
          apiBaseUrl,
          sessionToken,
          selectedProfessionalId
        );
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
          nextProfessionals.map(
            async (professional) =>
              [
                professional.id,
                await fetchProfessionalAvailability(
                  apiBaseUrl,
                  sessionToken,
                  professional.id
                )
              ] as const
          )
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
  const publicBookingUrl = tenant
    ? `${BOOKING_BASE_URL.replace(/\/+$/, "")}/${tenant.slug}`
    : "";
  const sidebarProfileName = adminProfile.name || tenant?.nome || "Admin";
  const sidebarProfileEmail = adminProfile.email || "";
  const services = bootstrap?.services ?? [];
  const professionals = bootstrap?.professionals ?? [];
  const clients = bootstrap?.clients ?? [];
  const bookings = bootstrap?.bookings ?? [];
  const paymentIntents = bootstrap?.paymentIntents ?? [];
  const cashEntries = bootstrap?.cashEntries ?? [];
  const banks = bootstrap?.banks ?? [];
  const bankBalances = bootstrap?.bankBalances ?? [];
  const revenueSchedules = bootstrap?.revenueSchedules ?? [];
  const expenseSchedules = bootstrap?.expenseSchedules ?? [];
  const bankMovements = bootstrap?.bankMovements ?? [];
  const cashCloses = bootstrap?.cashCloses ?? [];
  const activeFinancialReadModel =
    financialReadModel ?? bootstrap?.financialReadModel ?? null;
  const selectedBank = banks.find((entry) => entry.id === selectedBankId);
  const selectedBalance = bankBalances.find(
    (entry) => entry.id === selectedBalanceId
  );
  const selectedRevenue = revenueSchedules.find(
    (entry) => entry.id === selectedRevenueId
  );
  const selectedExpense = expenseSchedules.find(
    (entry) => entry.id === selectedExpenseId
  );
  const selectedMovement = bankMovements.find(
    (entry) => entry.id === selectedMovementId
  );
  const selectedCashClose = cashCloses.find(
    (entry) => entry.id === selectedCashCloseId
  );
  const bookableServices = services.filter(
    (service) => service.status === "active"
  );
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
  const counterBookingClientMatch = findMatchingClient(
    clients,
    counterBookingForm
  );
  const dashboardBookings = filterBookingsByRange(bookings, dashboardRange);
  const revenueEntries = buildRevenueEntries(
    dashboardBookings,
    services,
    professionals,
    clients,
    paymentIntents,
    cashEntries
  );
  const dashboardRevenueSummary = summarizeRevenueEntries(
    revenueEntries,
    dashboardBookings
  );
  const previousDashboardBookings =
    dashboardRange === "all"
      ? []
      : filterBookingsByRange(bookings, dashboardRange, 1);
  const previousDashboardRevenueSummary = summarizeRevenueEntries(
    buildRevenueEntries(
      previousDashboardBookings,
      services,
      professionals,
      clients,
      paymentIntents,
      cashEntries
    ),
    previousDashboardBookings
  );
  const dashboardAnchorDate = formatDateInputValue(new Date());
  const dashboardWeekDates = buildAgendaWeekDates(dashboardAnchorDate);
  const dashboardWeekBookings = filterBookingsByDates(
    bookings,
    dashboardWeekDates
  );
  const dashboardWeekProfessionals =
    dashboardProfessionalFilter === "all"
      ? professionals
      : professionals.filter(
          (professional) => professional.id === dashboardProfessionalFilter
        );
  const dashboardFilteredWeekBookings =
    dashboardProfessionalFilter === "all"
      ? dashboardWeekBookings
      : dashboardWeekBookings.filter(
          (booking) => booking.professionalId === dashboardProfessionalFilter
        );
  const dashboardWeekCapacitySummary = summarizeWeekCapacity(
    dashboardFilteredWeekBookings,
    dashboardWeekDates,
    dashboardWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
  const dashboardWeekDaySummaries = buildWeekDaySummaries(
    dashboardFilteredWeekBookings,
    dashboardWeekDates,
    dashboardWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
  const dashboardWeekProfessionalSummaries = buildWeekProfessionalSummaries(
    dashboardFilteredWeekBookings,
    dashboardWeekDates,
    dashboardWeekProfessionals,
    weeklyAvailabilityByProfessional
  );
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
  const reportRevenueSummary = summarizeRevenueEntries(
    reportRevenueEntries,
    reportBookings
  );
  const previousReportRevenueSummary = summarizeRevenueEntries(
    buildRevenueEntries(
      previousReportBookings,
      services,
      professionals,
      clients,
      paymentIntents,
      cashEntries
    ),
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
  const todayBookings = bookings.filter((booking) =>
    isSameCalendarDay(booking.startAt, new Date())
  );
  const todayPendingCount = todayBookings.filter(
    (booking) =>
      booking.status === "pendente" || booking.status === "aguardando pagamento"
  ).length;
  const todayConfirmedCount = todayBookings.filter(
    (booking) => booking.status === "confirmado"
  ).length;
  const bookingHasPendingReceipt = (booking: Booking): boolean => {
    const recognizedCashEntry = cashEntries.find(
      (entry) =>
        entry.bookingId === booking.id &&
        entry.kind === "recognized_revenue" &&
        entry.status === "open"
    );
    if (!recognizedCashEntry) {
      return false;
    }
    return !bankMovements.some(
      (movement) =>
        movement.sourceType === "cash_entry" &&
        movement.sourceId === recognizedCashEntry.id &&
        movement.status === "lancado" &&
        !movement.reversedMovementId
    );
  };
  const matchesAgendaFilters = (booking: Booking): boolean => {
    if (
      agendaProfessionalFilter !== "all" &&
      booking.professionalId !== agendaProfessionalFilter
    ) {
      return false;
    }
    if (agendaStatusFilter !== "all" && booking.status !== agendaStatusFilter) {
      return false;
    }
    if (
      agendaServiceFilter !== "all" &&
      booking.serviceId !== agendaServiceFilter
    ) {
      return false;
    }
    if (agendaPendingOnlyFilter && !bookingHasPendingReceipt(booking)) {
      return false;
    }
    return true;
  };
  const dayAgendaBookings = filterBookingsByDate(bookings, agendaDate);
  const filteredDayAgendaBookings =
    dayAgendaBookings.filter(matchesAgendaFilters);
  const clientInsights = buildClientInsights(
    clients,
    bookings,
    services,
    cashEntries
  );
  const filteredClientInsights = filterClientInsights(
    clientInsights,
    clientSegmentFilter,
    clientReturnWindow
  );
  const clientPortfolioSummary = summarizeClientPortfolio(
    clientInsights,
    clientReturnWindow
  );
  const inactiveClientInsights = filterClientInsights(
    clientInsights,
    "inactive",
    clientReturnWindow
  );
  const fallbackReportCurrent = buildReportMetricSummary(
    reportBookings,
    services,
    paymentIntents,
    cashEntries
  );
  const fallbackReportPrevious =
    reportsRange === "all"
      ? undefined
      : buildReportMetricSummary(
          previousReportBookings,
          services,
          paymentIntents,
          cashEntries
        );
  const activeReportCurrent =
    reportsReadModel?.current ?? fallbackReportCurrent;
  const activeReportPrevious =
    reportsReadModel?.previous ?? fallbackReportPrevious;
  const activeReportServiceSummaries =
    reportsReadModel?.services ?? reportServiceSummaries;
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
  const shellAttentionCount =
    todayPendingCount +
    pendingPaymentCount +
    clientPortfolioSummary.inactiveCount;
  const selectedAgendaBooking =
    filteredDayAgendaBookings.find(
      (booking) => booking.id === selectedAgendaBookingId
    ) ?? bookings.find((booking) => booking.id === selectedAgendaBookingId);
  const selectedAgendaPaymentIntent = paymentIntents.find(
    (intent) => intent.bookingId === selectedAgendaBooking?.id
  );
  const selectedAgendaCashEntry = selectedAgendaBooking
    ? cashEntries.find(
        (entry) =>
          entry.bookingId === selectedAgendaBooking.id &&
          entry.kind === "recognized_revenue" &&
          entry.status === "open"
      )
    : undefined;
  const selectedAgendaBankMovement = selectedAgendaCashEntry
    ? bankMovements.find(
        (movement) =>
          movement.sourceType === "cash_entry" &&
          movement.sourceId === selectedAgendaCashEntry.id &&
          movement.status === "lancado" &&
          !movement.reversedMovementId
      )
    : undefined;
  const selectedClientInsight =
    filteredClientInsights.find(
      (entry) => entry.client.id === selectedClientId
    ) ?? filteredClientInsights[0];
  const selectedClientBookings = selectedClientInsight
    ? bookings
        .filter(
          (booking) => booking.clientId === selectedClientInsight.client.id
        )
        .sort((left, right) => right.startAt.localeCompare(left.startAt))
    : [];
  const selectedClientCashEntries = selectedClientInsight
    ? cashEntries
        .filter((entry) => entry.clientId === selectedClientInsight.client.id)
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
    : [];
  const agendaDaySummary = summarizeDayBookings(filteredDayAgendaBookings);
  const agendaWeekDates = buildAgendaWeekDates(agendaDate);
  const weekAgendaBookings = filterBookingsByDates(bookings, agendaWeekDates);
  const filteredWeekProfessionals =
    agendaProfessionalFilter === "all"
      ? professionals
      : professionals.filter(
          (professional) => professional.id === agendaProfessionalFilter
        );
  const filteredWeekBookings = weekAgendaBookings.filter(matchesAgendaFilters);
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
    bookings.filter(matchesAgendaFilters),
    agendaProfessionalFilter === "all"
      ? professionals
      : professionals.filter(
          (professional) => professional.id === agendaProfessionalFilter
        ),
    weeklyAvailabilityByProfessional,
    agendaProfessionalFilter
  );
  const currentMonthCells = agendaMonthCells.filter(
    (cell) => cell.inCurrentMonth
  );
  const monthCapacitySummary = summarizeMonthCapacity(currentMonthCells);
  const selectedMonthCell =
    agendaMonthCells.find((cell) => cell.date === agendaDate) ??
    currentMonthCells[0];
  const filteredAgendaCalendarBookings = bookings.filter(matchesAgendaFilters);
  const agendaCalendarEvents: AgendaCalendarEvent[] =
    filteredAgendaCalendarBookings.map((booking) => ({
      id: booking.id,
      title: `${resolveClientName(booking.clientId, clients)} - ${resolveServiceName(booking.serviceId, services)}`,
      start: new Date(booking.startAt),
      end: new Date(booking.endAt),
      resource: booking
    }));
  const selectedAgendaCalendarEvent =
    agendaCalendarEvents.find(
      (event) => event.resource.id === selectedAgendaBooking?.id
    ) ?? null;
  const reportsInsightAnchorDate = formatDateInputValue(new Date());
  const reportsInsightProfessionals =
    reportsProfessionalFilter === "all"
      ? professionals
      : professionals.filter(
          (professional) => professional.id === reportsProfessionalFilter
        );
  const reportsInsightBookings =
    reportsProfessionalFilter === "all"
      ? bookings
      : bookings.filter(
          (booking) => booking.professionalId === reportsProfessionalFilter
        );
  const reportsInsightWeekDates = buildAgendaWeekDates(
    reportsInsightAnchorDate
  );
  const reportsInsightWeekBookings = filterBookingsByDates(
    reportsInsightBookings,
    reportsInsightWeekDates
  );
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
  const reportsInsightWeekProfessionalSummaries =
    buildWeekProfessionalSummaries(
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
  const reportsInsightCurrentMonthCells = reportsInsightMonthCells.filter(
    (cell) => cell.inCurrentMonth
  );
  const reportsInsightMonthCapacitySummary = summarizeMonthCapacity(
    reportsInsightCurrentMonthCells
  );

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
      !filteredClientInsights.some(
        (entry) => entry.client.id === selectedClientId
      )
    ) {
      setSelectedClientId(nextClientId);
    }
  }, [filteredClientInsights, selectedClientId]);

  useEffect(() => {
    if (agendaProfessionalFilter === "all") {
      return;
    }

    if (
      !professionals.some(
        (professional) => professional.id === agendaProfessionalFilter
      )
    ) {
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

    if (
      !filteredDayAgendaBookings.some(
        (booking) => booking.id === selectedAgendaBookingId
      )
    ) {
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
    if (!banks.length) {
      if (selectedBankId) {
        setSelectedBankId("");
      }
      return;
    }

    if (!selectedBankId || !banks.some((bank) => bank.id === selectedBankId)) {
      setSelectedBankId(banks[0].id);
    }
  }, [banks, selectedBankId]);

  useEffect(() => {
    if (!bankBalances.length) {
      if (selectedBalanceId) {
        setSelectedBalanceId("");
      }
      return;
    }

    if (
      !selectedBalanceId ||
      !bankBalances.some((balance) => balance.id === selectedBalanceId)
    ) {
      setSelectedBalanceId(bankBalances[0].id);
    }
  }, [bankBalances, selectedBalanceId]);

  useEffect(() => {
    if (!revenueSchedules.length) {
      if (selectedRevenueId) {
        setSelectedRevenueId("");
      }
      return;
    }

    if (
      !selectedRevenueId ||
      !revenueSchedules.some((entry) => entry.id === selectedRevenueId)
    ) {
      setSelectedRevenueId(revenueSchedules[0].id);
    }
  }, [revenueSchedules, selectedRevenueId]);

  useEffect(() => {
    if (!expenseSchedules.length) {
      if (selectedExpenseId) {
        setSelectedExpenseId("");
      }
      return;
    }

    if (
      !selectedExpenseId ||
      !expenseSchedules.some((entry) => entry.id === selectedExpenseId)
    ) {
      setSelectedExpenseId(expenseSchedules[0].id);
    }
  }, [expenseSchedules, selectedExpenseId]);

  useEffect(() => {
    if (!bankMovements.length) {
      if (selectedMovementId) {
        setSelectedMovementId("");
      }
      return;
    }

    if (
      !selectedMovementId ||
      !bankMovements.some((entry) => entry.id === selectedMovementId)
    ) {
      setSelectedMovementId(bankMovements[0].id);
    }
  }, [bankMovements, selectedMovementId]);

  useEffect(() => {
    if (!cashCloses.length) {
      if (selectedCashCloseId) {
        setSelectedCashCloseId("");
      }
      return;
    }

    if (
      !selectedCashCloseId ||
      !cashCloses.some((entry) => entry.id === selectedCashCloseId)
    ) {
      setSelectedCashCloseId(cashCloses[0].id);
    }
  }, [cashCloses, selectedCashCloseId]);

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

          const currentBookingSlot = slots.find(
            (slot) => slot.startAt === booking.startAt
          );
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

    if (
      !bookableServices.some(
        (service) => service.id === counterBookingServiceId
      )
    ) {
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

    if (
      !counterBookingProfessionals.some(
        (professional) => professional.id === counterBookingProfessionalId
      )
    ) {
      setCounterBookingProfessionalId(counterBookingProfessionals[0].id);
    }
  }, [
    counterBookingProfessionalId,
    counterBookingProfessionals,
    isCounterBookingModalOpen
  ]);

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

          if (counterBookingPreferredSlotStartAt) {
            const suggestedSlot = resolveNextSlotSuggestion(
              slots,
              counterBookingPreferredSlotStartAt
            );
            if (suggestedSlot) {
              return suggestedSlot.startAt;
            }
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
    counterBookingPreferredSlotStartAt,
    counterBookingProfessionalId,
    counterBookingServiceId,
    isCounterBookingModalOpen,
    sessionToken
  ]);

  useEffect(() => {
    if (
      !isCashCloseComposerOpen ||
      !sessionToken ||
      !cashCloseForm.bankId ||
      !cashCloseForm.dateFrom ||
      !cashCloseForm.dateTo
    ) {
      setCashClosePreview(null);
      setSelectedCashClosePreviewKeys([]);
      setIsLoadingCashClosePreview(false);
      return;
    }

    let ignore = false;
    setIsLoadingCashClosePreview(true);

    void fetchCashClosePreview(apiBaseUrl, sessionToken, {
      bankId: cashCloseForm.bankId,
      dateFrom: cashCloseForm.dateFrom,
      dateTo: cashCloseForm.dateTo
    })
      .then((preview) => {
        if (ignore) {
          return;
        }
        setCashClosePreview(preview);
        setSelectedCashClosePreviewKeys(
          preview.pending.map((entry) =>
            buildCashClosePreviewSelectionKey(entry.sourceType, entry.sourceId)
          )
        );
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setCashClosePreview(null);
        setSelectedCashClosePreviewKeys([]);
        setFeedback({
          tone: "error",
          message: toErrorMessage(error)
        });
      })
      .finally(() => {
        if (!ignore) {
          setIsLoadingCashClosePreview(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [
    apiBaseUrl,
    cashCloseForm.bankId,
    cashCloseForm.dateFrom,
    cashCloseForm.dateTo,
    cashClosePreviewRequestKey,
    isCashCloseComposerOpen,
    sessionToken
  ]);

  async function refreshAdminState(): Promise<void> {
    if (!sessionToken) {
      return;
    }
    const [nextBootstrap, nextFinancialReadModel] = await Promise.all([
      fetchAdminBootstrap(apiBaseUrl, sessionToken),
      fetchAdminFinancialReadModel(apiBaseUrl, sessionToken, {
        range: financialRange,
        bankId: financialBankFilter !== "all" ? financialBankFilter : undefined,
        situation: financialSituation
      })
    ]);
    setBootstrap(nextBootstrap);
    setFinancialReadModel(nextFinancialReadModel);
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

  function closeFinanceModal(): void {
    setFinanceModal(null);
    setFinanceModalMode("create");
    setIsCashCloseComposerOpen(false);
    setCashClosePreview(null);
    setSelectedCashClosePreviewKeys([]);
    setIsLoadingCashClosePreview(false);
    setEditingBankId("");
    setEditingBalanceId("");
    setEditingRevenueId("");
    setEditingExpenseId("");
    setEditingMovementId("");
    setAgendaSettlementTarget(null);
    setReceiveTarget(null);
    setPayTarget(null);
  }

  function openBankModal(
    bank?: Bank,
    mode: FinanceDialogMode = bank ? "edit" : "create"
  ): void {
    setFinanceModalMode(mode);
    setEditingBankId(bank?.id ?? "");
    setBankForm(
      bank
        ? {
            codigo: bank.codigo,
            bacenCode: bank.bacenCode,
            nomeBanco: bank.nomeBanco,
            agencia: bank.agencia,
            conta: bank.conta,
            ativo: bank.ativo
          }
        : defaultBankForm
    );
    setFinanceModal("bank");
  }

  function openBankBalanceModal(
    balance?: BankBalance,
    mode: FinanceDialogMode = balance ? "edit" : "create"
  ): void {
    setFinanceModalMode(mode);
    setEditingBalanceId(balance?.id ?? "");
    setBankBalanceForm(
      balance
        ? {
            codigo: balance.codigo,
            bankId: balance.bankId,
            saldoInicial: String(balance.saldoInicial),
            dataSaldoInicial: balance.dataSaldoInicial,
            observacao: balance.observacao ?? ""
          }
        : {
            ...defaultBankBalanceForm,
            bankId: banks[0]?.id ?? ""
          }
    );
    setFinanceModal("balance");
  }

  function openRevenueModal(
    revenue?: RevenueSchedule,
    mode: FinanceDialogMode = revenue ? "edit" : "create"
  ): void {
    setFinanceModalMode(mode);
    setEditingRevenueId(revenue?.id ?? "");
    setRevenueForm(
      revenue
        ? {
            codigo: revenue.codigo,
            descricao: revenue.descricao,
            valor: String(revenue.valor),
            dataVencimento: revenue.dataVencimento,
            tipo: revenue.tipo,
            recorrencia: revenue.recorrencia ?? "semanal",
            quantidadeOcorrencias: String(revenue.quantidadeOcorrencias ?? 1),
            diaSemanaVencimento: String(
              revenue.diaSemanaVencimento ?? new Date().getDay()
            ),
            bankId: revenue.bankId ?? "",
            baixaAutomatica: revenue.baixaAutomatica ?? "nao"
          }
        : defaultRevenueForm
    );
    setFinanceModal("revenue");
  }

  function openExpenseModal(
    expense?: ExpenseSchedule,
    mode: FinanceDialogMode = expense ? "edit" : "create"
  ): void {
    setFinanceModalMode(mode);
    setEditingExpenseId(expense?.id ?? "");
    setExpenseForm(
      expense
        ? {
            codigo: expense.codigo,
            descricao: expense.descricao,
            valor: String(expense.valor),
            dataVencimento: expense.dataVencimento,
            tipo: expense.tipo,
            recorrencia: expense.recorrencia ?? "semanal",
            quantidadeOcorrencias: String(expense.quantidadeOcorrencias ?? 1),
            diaSemanaVencimento: String(
              expense.diaSemanaVencimento ?? new Date().getDay()
            ),
            beneficiarioNome: expense.beneficiarioNome ?? "",
            bankId: expense.bankId ?? "",
            baixaAutomatica: expense.baixaAutomatica ?? "nao"
          }
        : defaultExpenseForm
    );
    setFinanceModal("expense");
  }

  function openReceiveModal(): void {
    setFinanceModalMode("create");
    setReceiveTarget(null);
    setAgendaSettlementTarget(null);
    setReceiveMovementForm({
      ...defaultReceiveMovementForm,
      bankIdDestino: banks[0]?.id ?? ""
    });
    setFinanceModal("receive");
  }

  function openPayModal(): void {
    setFinanceModalMode("create");
    setPayTarget(null);
    setPayMovementForm({
      ...defaultPayMovementForm,
      bankIdOrigem: banks[0]?.id ?? ""
    });
    setFinanceModal("pay");
  }

  function openTransferModal(): void {
    setFinanceModalMode("create");
    setTransferMovementForm({
      ...defaultTransferMovementForm,
      bankIdOrigem: banks[0]?.id ?? "",
      bankIdDestino: banks[1]?.id ?? banks[0]?.id ?? ""
    });
    setFinanceModal("transfer");
  }

  function openManualMovementModal(
    movement?: BankMovement,
    mode: FinanceDialogMode = movement ? "edit" : "create"
  ): void {
    setFinanceModalMode(mode);
    setReceiveTarget(null);
    setPayTarget(null);
    setAgendaSettlementTarget(null);
    setEditingMovementId(movement?.id ?? "");
    setManualMovementForm(
      movement
        ? {
            tipo: movement.tipo === "estorno" ? "ajuste" : movement.tipo,
            bankIdOrigem: movement.bankIdOrigem ?? "",
            bankIdDestino: movement.bankIdDestino ?? "",
            valor: String(movement.valor),
            historico: movement.historico,
            beneficiarioNome: movement.beneficiarioNome ?? "",
            dataMovimento: movement.dataMovimento.slice(0, 16)
          }
        : {
            ...defaultManualMovementForm,
            bankIdOrigem: banks[0]?.id ?? "",
            bankIdDestino: banks[1]?.id ?? banks[0]?.id ?? ""
          }
    );
    setFinanceModal("movement");
  }

  function openCashCloseModal(
    cashClose?: CashClose,
    mode: FinanceDialogMode = cashClose ? "view" : "create"
  ): void {
    if (!cashClose && mode === "create") {
      navigateTo("financeiro");
      setFinanceWorkspaceTab("close");
      setIsCashCloseComposerOpen(true);
      setCashCloseForm({
        bankId:
          financeBrowseFilters.close.bankId !== "all"
            ? financeBrowseFilters.close.bankId
            : (banks[0]?.id ?? ""),
        dateFrom: financeBrowseFilters.close.dateFrom,
        dateTo: financeBrowseFilters.close.dateTo
      });
      setFinanceModal(null);
      return;
    }

    setFinanceModalMode(mode);
    setIsCashCloseComposerOpen(false);
    setCashCloseForm({
      bankId:
        cashClose?.bankId ??
        (financeBrowseFilters.close.bankId !== "all"
          ? financeBrowseFilters.close.bankId
          : (banks[0]?.id ?? "")),
      dateFrom: cashClose?.dateFrom ?? financeBrowseFilters.close.dateFrom,
      dateTo: cashClose?.dateTo ?? financeBrowseFilters.close.dateTo
    });
    setFinanceModal("close");
  }

  function openCashflowFilterModal(): void {
    setCashflowFilterDraft({ ...financeBrowseFilters.cashflow });
    setIsCashflowFilterModalOpen(true);
  }

  function openAgendaFilterModal(): void {
    setAgendaFilterDraft({
      date: agendaDate,
      professionalId: agendaProfessionalFilter,
      status: agendaStatusFilter,
      serviceId: agendaServiceFilter,
      pendingOnly: agendaPendingOnlyFilter
    });
    setIsAgendaFilterModalOpen(true);
  }

  async function handleSaveBank(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      if (editingBankId) {
        await updateBank(apiBaseUrl, sessionToken, editingBankId, {
          codigo: bankForm.codigo || undefined,
          bacenCode: bankForm.bacenCode,
          nomeBanco: bankForm.nomeBanco,
          agencia: bankForm.agencia,
          conta: bankForm.conta,
          ativo: bankForm.ativo
        });
      } else {
        await createBank(apiBaseUrl, sessionToken, {
          codigo: bankForm.codigo || undefined,
          bacenCode: bankForm.bacenCode,
          nomeBanco: bankForm.nomeBanco,
          agencia: bankForm.agencia,
          conta: bankForm.conta,
          ativo: bankForm.ativo
        });
      }
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Banco salvo." });
    });
  }

  async function handleSaveBankBalance(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      if (editingBalanceId) {
        await updateBankBalance(apiBaseUrl, sessionToken, editingBalanceId, {
          codigo: bankBalanceForm.codigo || undefined,
          saldoInicial: Number(bankBalanceForm.saldoInicial),
          dataSaldoInicial: bankBalanceForm.dataSaldoInicial,
          observacao: bankBalanceForm.observacao || undefined
        });
      } else {
        await createBankBalance(apiBaseUrl, sessionToken, {
          codigo: bankBalanceForm.codigo || undefined,
          bankId: bankBalanceForm.bankId,
          saldoInicial: Number(bankBalanceForm.saldoInicial),
          dataSaldoInicial: bankBalanceForm.dataSaldoInicial,
          observacao: bankBalanceForm.observacao || undefined
        });
      }
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Saldo inicial salvo." });
    });
  }

  async function handleSaveRevenue(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        codigo: revenueForm.codigo || undefined,
        descricao: revenueForm.descricao,
        valor: Number(revenueForm.valor),
        dataVencimento: revenueForm.dataVencimento,
        tipo: revenueForm.tipo,
        recorrencia:
          revenueForm.tipo === "recorrente"
            ? revenueForm.recorrencia
            : undefined,
        quantidadeOcorrencias:
          revenueForm.tipo === "recorrente"
            ? Number(revenueForm.quantidadeOcorrencias)
            : undefined,
        diaSemanaVencimento:
          revenueForm.tipo === "recorrente"
            ? Number(revenueForm.diaSemanaVencimento)
            : undefined,
        bankId: revenueForm.bankId || undefined,
        baixaAutomatica: revenueForm.baixaAutomatica
      };
      if (editingRevenueId) {
        await updateRevenueSchedule(
          apiBaseUrl,
          sessionToken,
          editingRevenueId,
          payload
        );
      } else {
        await createRevenueSchedule(apiBaseUrl, sessionToken, payload);
      }
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Receita salva." });
    });
  }

  async function handleSaveExpense(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        codigo: expenseForm.codigo || undefined,
        descricao: expenseForm.descricao,
        valor: Number(expenseForm.valor),
        dataVencimento: expenseForm.dataVencimento,
        tipo: expenseForm.tipo,
        recorrencia:
          expenseForm.tipo === "recorrente"
            ? expenseForm.recorrencia
            : undefined,
        quantidadeOcorrencias:
          expenseForm.tipo === "recorrente"
            ? Number(expenseForm.quantidadeOcorrencias)
            : undefined,
        diaSemanaVencimento:
          expenseForm.tipo === "recorrente"
            ? Number(expenseForm.diaSemanaVencimento)
            : undefined,
        beneficiarioNome: expenseForm.beneficiarioNome || undefined,
        bankId: expenseForm.bankId || undefined,
        baixaAutomatica: expenseForm.baixaAutomatica
      };
      if (editingExpenseId) {
        await updateExpenseSchedule(
          apiBaseUrl,
          sessionToken,
          editingExpenseId,
          payload
        );
      } else {
        await createExpenseSchedule(apiBaseUrl, sessionToken, payload);
      }
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Despesa salva." });
    });
  }

  async function handleReceiveMovement(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      await receiveBankMovement(apiBaseUrl, sessionToken, {
        bankIdDestino: receiveMovementForm.bankIdDestino,
        valor: Number(receiveMovementForm.valor),
        historico: receiveMovementForm.historico,
        dataMovimento: new Date(
          receiveMovementForm.dataMovimento
        ).toISOString(),
        revenueId: receiveTarget?.revenueId,
        cashEntryId: receiveTarget?.cashEntryId
      });
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Recebimento lancado." });
    });
  }

  async function handlePayMovement(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      await payBankMovement(apiBaseUrl, sessionToken, {
        bankIdOrigem: payMovementForm.bankIdOrigem,
        valor: Number(payMovementForm.valor),
        historico: payMovementForm.historico,
        dataMovimento: new Date(payMovementForm.dataMovimento).toISOString(),
        beneficiarioNome: payMovementForm.beneficiarioNome || undefined,
        expenseId: payTarget?.expenseId
      });
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Pagamento lancado." });
    });
  }

  async function handleTransferMovement(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      await transferBankMovement(apiBaseUrl, sessionToken, {
        bankIdOrigem: transferMovementForm.bankIdOrigem,
        bankIdDestino: transferMovementForm.bankIdDestino,
        valor: Number(transferMovementForm.valor),
        historico: transferMovementForm.historico,
        dataMovimento: new Date(
          transferMovementForm.dataMovimento
        ).toISOString()
      });
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({ tone: "success", message: "Transferencia lancada." });
    });
  }

  async function handleSaveManualMovement(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        tipo: manualMovementForm.tipo,
        bankIdOrigem: manualMovementForm.bankIdOrigem || undefined,
        bankIdDestino: manualMovementForm.bankIdDestino || undefined,
        valor: Number(manualMovementForm.valor),
        historico: manualMovementForm.historico,
        beneficiarioNome: manualMovementForm.beneficiarioNome || undefined,
        dataMovimento: new Date(manualMovementForm.dataMovimento).toISOString()
      };

      if (editingMovementId) {
        await updateBankMovementRecord(
          apiBaseUrl,
          sessionToken,
          editingMovementId,
          payload
        );
      } else {
        await createBankMovement(apiBaseUrl, sessionToken, payload);
      }

      await refreshAdminState();
      closeFinanceModal();
      setFeedback({
        tone: "success",
        message: editingMovementId
          ? "Movimento atualizado."
          : "Movimento incluido."
      });
    });
  }

  async function handleReverseMovement(): Promise<void> {
    if (!reverseTarget) {
      return;
    }

    await runAction(async () => {
      await reverseBankMovement(
        apiBaseUrl,
        sessionToken,
        reverseTarget.movementId,
        {
          historico: reverseMovementForm.historico || undefined,
          dataMovimento: reverseMovementForm.dataMovimento
            ? new Date(reverseMovementForm.dataMovimento).toISOString()
            : undefined
        }
      );
      await refreshAdminState();
      setReverseTarget(null);
      setReverseMovementForm(defaultReverseMovementForm);
      setFeedback({
        tone: "success",
        message: "Estorno registrado com movimento inverso."
      });
    });
  }

  async function handleDeleteFinanceRecord(): Promise<void> {
    if (!deleteTarget) {
      return;
    }

    await runAction(async () => {
      switch (deleteTarget.kind) {
        case "bank":
          await deleteBank(apiBaseUrl, sessionToken, deleteTarget.id);
          setSelectedBankId("");
          break;
        case "balance":
          await deleteBankBalance(apiBaseUrl, sessionToken, deleteTarget.id);
          setSelectedBalanceId("");
          break;
        case "revenue":
          await deleteRevenueSchedule(
            apiBaseUrl,
            sessionToken,
            deleteTarget.id
          );
          setSelectedRevenueId("");
          break;
        case "expense":
          await deleteExpenseSchedule(
            apiBaseUrl,
            sessionToken,
            deleteTarget.id
          );
          setSelectedExpenseId("");
          break;
      }

      await refreshAdminState();
      setDeleteTarget(null);
      setFeedback({ tone: "success", message: "Registro removido." });
    });
  }

  async function handleCreateCashClose(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();
    if (!selectedCashClosePreviewKeys.length) {
      setFeedback({
        tone: "error",
        message: "Selecione pelo menos um item pendente para fechar o caixa."
      });
      return;
    }

    await runAction(async () => {
      const selectedItems: Array<{
        readonly sourceType:
          | "revenue_schedule"
          | "expense_schedule"
          | "cash_entry";
        readonly sourceId: string;
      }> =
        cashClosePreview?.pending
          .filter((entry) =>
            selectedCashClosePreviewKeys.includes(
              buildCashClosePreviewSelectionKey(
                entry.sourceType,
                entry.sourceId
              )
            )
          )
          .map((entry) => ({
            sourceType: entry.sourceType,
            sourceId: entry.sourceId
          })) ?? [];

      await createCashClose(apiBaseUrl, sessionToken, {
        ...cashCloseForm,
        items: selectedItems
      });
      await refreshAdminState();
      closeFinanceModal();
      setFeedback({
        tone: "success",
        message: "Fechamento de caixa concluido."
      });
    });
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const session = await loginAdmin(
        apiBaseUrl,
        loginForm.email,
        loginForm.password
      );
      setSessionToken(session.token);
      setAdminProfile({
        name: resolveAdminDisplayName(loginForm.email),
        email: loginForm.email.trim().toLowerCase()
      });
      setFeedback({
        tone: "success",
        message: "Sessao administrativa aberta."
      });
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
      setFeedback({
        tone: "success",
        message: `Negocio ${onboarding.tenant.nome} criado e autenticado.`
      });
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
      await updateTenantBranding(
        apiBaseUrl,
        sessionToken,
        buildBrandingPayload(brandingForm)
      );
      await refreshAdminState();
      setFeedback({ tone: "success", message: "Branding minimo atualizado." });
    });
  }

  async function handleSavePayments(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      await savePaymentSettings(
        apiBaseUrl,
        sessionToken,
        buildPaymentPayload(paymentForm)
      );
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: "Configuracao do Mercado Pago salva."
      });
    });
  }

  async function handleSaveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runAction(async () => {
      const payload = buildServicePayload(serviceForm);
      const service = selectedServiceId
        ? await updateService(
            apiBaseUrl,
            sessionToken,
            selectedServiceId,
            payload
          )
        : await createService(apiBaseUrl, sessionToken, payload);
      setSelectedServiceId(service.id);
      setServiceWorkspaceMode("view");
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: selectedServiceId ? "Servico atualizado." : "Servico criado."
      });
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
      setIsServiceDeleteDialogOpen(false);
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
      const professional = isEditingProfessional
        ? await updateProfessional(
            apiBaseUrl,
            sessionToken,
            selectedProfessionalId,
            {
              nome: professionalForm.nome.trim(),
              status: professionalForm.status,
              especialidades: [...professionalForm.especialidades],
              bankId: professionalForm.bankId || undefined
            }
          )
        : await createProfessional(apiBaseUrl, sessionToken, {
            nome: professionalForm.nome.trim(),
            especialidades: [...professionalForm.especialidades],
            bankId: professionalForm.bankId || undefined
          });
      setIsCreatingProfessional(false);
      setIsProfessionalBankLookupOpen(false);
      setSelectedProfessionalId(professional.id);
      setProfessionalRecordDialogMode("closed");
      setProfessionalWorkspaceMode("profile");
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: isEditingProfessional
          ? "Profissional atualizado."
          : "Profissional criado."
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
        throw new Error(
          "Defina ao menos um dia com horario valido para publicar a agenda."
        );
      }
      await saveProfessionalAvailability(
        apiBaseUrl,
        sessionToken,
        selectedProfessionalId,
        rules
      );
      setFeedback({
        tone: "success",
        message: "Disponibilidade semanal salva."
      });
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

  async function handlePaymentSync(
    paymentIntent: PaymentIntent
  ): Promise<void> {
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

    const nextSlot = agendaSlots.find(
      (slot) => slot.startAt === selectedAgendaSlotStartAt
    );
    if (!nextSlot) {
      setFeedback({
        tone: "error",
        message:
          "Escolha um novo horario disponivel antes de salvar o reagendamento."
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

  function openCounterBookingModal(prefill?: {
    readonly date?: string;
    readonly professionalId?: string;
    readonly slotStartAt?: string;
  }): void {
    setCounterBookingStep("service");
    setCounterBookingServiceId(bookableServices[0]?.id ?? "");
    setCounterBookingProfessionalId(prefill?.professionalId ?? "");
    setCounterBookingDate(prefill?.date ?? formatDateInputValue(new Date()));
    setCounterBookingSlots([]);
    setCounterBookingPreferredSlotStartAt(prefill?.slotStartAt ?? "");
    setCounterBookingSlotStartAt("");
    setCounterBookingForm(defaultCounterBookingForm);
    setCounterBookingError(null);
    setCounterBookingConflictSuggestion(null);
    setCounterBookingReceipt(null);
    setIsShellContextOpen(false);
    setIsCounterBookingModalOpen(true);
  }

  function closeCounterBookingModal(): void {
    setIsCounterBookingModalOpen(false);
    setCounterBookingError(null);
    setCounterBookingConflictSuggestion(null);
  }

  function handleCounterBookingGoToStep(step: CounterBookingStep): void {
    if (
      !isCounterBookingStepAvailable(
        step,
        counterBookingSelectedService,
        counterBookingSelectedProfessional,
        counterBookingSelectedSlot
      )
    ) {
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
      setCounterBookingError(
        resolveCounterBookingStepValidationMessage(counterBookingStep)
      );
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

  async function handleSubmitCounterBooking(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (
      !counterBookingSelectedService ||
      !counterBookingSelectedProfessional ||
      !counterBookingSelectedSlot
    ) {
      setCounterBookingError(
        "Selecione servico, profissional e horario antes de salvar."
      );
      return;
    }

    if (
      !isCounterBookingStepComplete(
        "client",
        counterBookingSelectedService,
        counterBookingSelectedProfessional,
        counterBookingSelectedSlot,
        counterBookingForm
      )
    ) {
      setCounterBookingError(
        resolveCounterBookingStepValidationMessage("client")
      );
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
      if (
        error instanceof AdminApiError &&
        (error.code === "slot_unavailable" ||
          error.code === "booking_conflict") &&
        counterBookingSelectedService &&
        counterBookingSelectedProfessional
      ) {
        try {
          const nextSlots = await fetchAvailabilitySlots(
            apiBaseUrl,
            sessionToken,
            {
              serviceId: counterBookingSelectedService.id,
              professionalId: counterBookingSelectedProfessional.id,
              date: counterBookingDate
            }
          );
          setCounterBookingSlots(nextSlots);
          const suggestedSlot = resolveNextSlotSuggestion(
            nextSlots,
            counterBookingSelectedSlot.startAt
          );
          if (suggestedSlot) {
            setCounterBookingConflictSuggestion({
              slot: suggestedSlot,
              message:
                "Esse horario esta ocupado. Ajustar para a proxima janela disponivel?"
            });
            setCounterBookingError(
              "O horario escolhido ficou indisponivel enquanto voce montava o agendamento."
            );
            return;
          }
        } catch {
          // fallback para a mensagem original do backend
        }
      }

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
    const normalizedRoute = normalizeAdminRoute(route);
    const nextHash = `#${normalizedRoute}`;
    if (typeof window !== "undefined" && window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
    setCurrentRoute(normalizedRoute);
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
        const fallbackRoute =
          nextTabs[nextTabs.length - 1] ?? defaultAdminRoute;
        window.setTimeout(() => navigateTo(fallbackRoute), 0);
      }

      return nextTabs;
    });
  }

  function openReportsWorkspaceTab(tab: ReportsWorkspaceTab): void {
    setReportsWorkspaceTab(tab);
    setReportsOpenTabs((current) =>
      current.includes(tab) ? current : [...current, tab]
    );
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

  async function reloadSavedReportBuilderDefinitions(): Promise<
    ReportDefinition[]
  > {
    if (!sessionToken) {
      setSavedReportDefinitions([]);
      return [];
    }

    try {
      const nextDefinitions = await listReportDefinitions(
        apiBaseUrl,
        sessionToken
      );
      setSavedReportDefinitions(nextDefinitions);
      return nextDefinitions;
    } catch (error) {
      if (isMissingReportBuilderRoute(error)) {
        setSavedReportDefinitions([]);
        return [];
      }
      throw error;
    }
  }

  function activateReportBuilderTab(tabId: string): void {
    setActiveReportBuilderTabId(tabId);
    navigateTo("relatorios");
  }

  function closeReportBuilderTab(tabId: string): void {
    setReportBuilderTabs((current) => {
      if (current.length <= 1) {
        return current;
      }

      const nextTabs = current.filter((tab) => tab.id !== tabId);
      if (tabId === activeReportBuilderTabId) {
        const fallback = nextTabs[nextTabs.length - 1];
        window.setTimeout(
          () => setActiveReportBuilderTabId(fallback?.id ?? ""),
          0
        );
      }
      return nextTabs;
    });
  }

  function updateReportBuilderDefinition(
    tabId: string,
    definition: ReportDefinition
  ): void {
    setReportBuilderTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              label: definition.name,
              definition,
              dirty: true
            }
          : tab
      )
    );
  }

  async function executeReportBuilderTab(
    tabId: string,
    definitionOverride?: ReportDefinition
  ): Promise<void> {
    if (!sessionToken) {
      return;
    }

    const baseTab = reportBuilderTabs.find((tab) => tab.id === tabId);
    const definition = definitionOverride ?? baseTab?.definition;
    if (!definition) {
      return;
    }

    setReportBuilderTabs((current) =>
      current.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              isLoading: true,
              error: null
            }
          : tab
      )
    );

    try {
      const result = await executeAdminReportDefinition(
        apiBaseUrl,
        sessionToken,
        {
          definition
        }
      );
      setReportBuilderTabs((current) =>
        current.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                result,
                isLoading: false,
                error: null
              }
            : tab
        )
      );
    } catch (error) {
      const message = isMissingReportBuilderRoute(error)
        ? "O backend atual ainda nao expoe a execucao do builder. Atualize o api-rest para liberar este relatorio."
        : toErrorMessage(error);
      if (error instanceof AdminApiError && error.status === 401) {
        setSessionToken("");
      }
      setReportBuilderTabs((current) =>
        current.map((tab) =>
          tab.id === tabId
            ? {
                ...tab,
                isLoading: false,
                error: message
              }
            : tab
        )
      );
      setFeedback({
        tone: "error",
        message
      });
    }
  }

  function openSystemReportBuilderTab(reportCode: string): void {
    const definition = reportsCatalog?.systemDefinitions.find(
      (entry) => entry.code === reportCode
    );
    if (!definition) {
      return;
    }

    const cloned = cloneReportDefinition(definition);
    const tabId = createReportBuilderTabId(cloned);
    let shouldExecute = false;

    setReportBuilderTabs((current) => {
      const existing = current.find((tab) => tab.id === tabId);
      shouldExecute = !existing || existing.result === null;
      if (existing) {
        return current;
      }
      return [
        ...current,
        {
          id: tabId,
          label: cloned.name,
          definition: cloned,
          result: null,
          isLoading: false,
          error: null,
          dirty: false
        }
      ];
    });

    setActiveReportBuilderTabId(tabId);
    setIsReportsMenuOpen(false);
    navigateTo("relatorios");
    if (shouldExecute) {
      void executeReportBuilderTab(tabId, cloned);
    }
  }

  function openSavedReportBuilderTab(definitionId: string): void {
    const definition = savedReportDefinitions.find(
      (entry) => entry.id === definitionId
    );
    if (!definition) {
      return;
    }

    const cloned = cloneReportDefinition(definition);
    const tabId = createReportBuilderTabId(cloned);
    let shouldExecute = false;

    setReportBuilderTabs((current) => {
      const existing = current.find((tab) => tab.id === tabId);
      shouldExecute = !existing || existing.result === null;
      if (existing) {
        return current;
      }
      return [
        ...current,
        {
          id: tabId,
          label: cloned.name,
          definition: cloned,
          result: null,
          isLoading: false,
          error: null,
          dirty: false
        }
      ];
    });

    setActiveReportBuilderTabId(tabId);
    navigateTo("relatorios");
    if (shouldExecute) {
      void executeReportBuilderTab(tabId, cloned);
    }
  }

  async function saveReportBuilderTab(
    tabId: string,
    name: string,
    description: string
  ): Promise<void> {
    if (!sessionToken) {
      return;
    }

    const tab = reportBuilderTabs.find((entry) => entry.id === tabId);
    if (!tab) {
      return;
    }

    const draftDefinition: ReportDefinition = {
      ...tab.definition,
      id: crypto.randomUUID(),
      code: tab.definition.code,
      source: "saved",
      name,
      description,
      locked: false
    };

    try {
      const persisted = await createReportDefinition(
        apiBaseUrl,
        sessionToken,
        draftDefinition
      );
      await reloadSavedReportBuilderDefinitions();
      const nextTabId = createReportBuilderTabId(persisted);

      setReportBuilderTabs((current) =>
        current.map((entry) =>
          entry.id === tabId
            ? {
                ...entry,
                id: nextTabId,
                label: persisted.name,
                definition: persisted,
                dirty: false,
                error: null
              }
            : entry
        )
      );
      setActiveReportBuilderTabId(nextTabId);
      setFeedback({
        tone: "success",
        message: "Modelo de relatorio salvo."
      });
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) {
        setSessionToken("");
      }
      setFeedback({
        tone: "error",
        message: isMissingReportBuilderRoute(error)
          ? "O backend atual ainda nao expoe persistencia de modelos do builder."
          : toErrorMessage(error)
      });
    }
  }

  function resolveReportsPaneFilters(
    tab: ReportsWorkspaceTab = reportsWorkspaceTab
  ): ReportsPaneFilters {
    return (
      reportsFiltersByTab[tab] ??
      createDefaultReportsPaneFilters(clientReturnWindow)
    );
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

  function applyCashflowFilterDraft(): void {
    setFinanceBrowseFilters((current) => ({
      ...current,
      cashflow: { ...cashflowFilterDraft }
    }));
    setIsCashflowFilterModalOpen(false);
    setIsCashflowBankLookupOpen(false);
  }

  function clearCashflowFilters(): void {
    const cleared = {
      ...defaultFinanceBrowseFilters.cashflow,
      bankId: "all"
    };
    setCashflowFilterDraft(cleared);
    setFinanceBrowseFilters((current) => ({
      ...current,
      cashflow: cleared
    }));
    setIsCashflowFilterModalOpen(false);
    setIsCashflowBankLookupOpen(false);
  }

  function applyAgendaFilters(): void {
    setAgendaDate(agendaFilterDraft.date);
    setAgendaProfessionalFilter(agendaFilterDraft.professionalId);
    setAgendaStatusFilter(agendaFilterDraft.status);
    setAgendaServiceFilter(agendaFilterDraft.serviceId);
    setAgendaPendingOnlyFilter(agendaFilterDraft.pendingOnly);
    setIsAgendaFilterModalOpen(false);
  }

  function clearAgendaFilters(): void {
    const cleared = defaultAgendaFilterDraft(agendaDate);
    setAgendaFilterDraft(cleared);
    setAgendaProfessionalFilter(cleared.professionalId);
    setAgendaStatusFilter(cleared.status);
    setAgendaServiceFilter(cleared.serviceId);
    setAgendaPendingOnlyFilter(cleared.pendingOnly);
    setIsAgendaFilterModalOpen(false);
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

  function resetProfessionalDraft(): void {
    setProfessionalForm({
      ...defaultProfessionalForm,
      especialidades: [...defaultProfessionalForm.especialidades]
    });
    setAvailabilityDays(createDefaultAvailabilityDays());
  }

  function selectProfessionalRecord(professionalId: string): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(professionalId);
    setProfessionalRecordDialogMode("closed");
  }

  function openProfessionalProfileWorkspace(professionalId?: string): void {
    setProfessionalWorkspaceMode("profile");
    setProfessionalRecordDialogMode("closed");
    setIsCreatingProfessional(false);

    if (professionalId) {
      setSelectedProfessionalId(professionalId);
    }

    scrollProfessionalsWorkspaceIntoView();
  }

  function openNewProfessionalDialog(): void {
    setProfessionalWorkspaceMode("profile");
    setIsCreatingProfessional(true);
    setSelectedProfessionalId("");
    setIsProfessionalBankLookupOpen(false);
    resetProfessionalDraft();
    setProfessionalRecordDialogMode("new");
    scrollProfessionalsWorkspaceIntoView();
  }

  function openProfessionalRecordDialog(
    mode: Exclude<ProfessionalRecordDialogMode, "closed" | "new">,
    professionalId?: string
  ): void {
    const targetProfessionalId = professionalId ?? selectedProfessionalId;
    if (!targetProfessionalId) {
      return;
    }

    setProfessionalWorkspaceMode("profile");
    setIsCreatingProfessional(false);
    setSelectedProfessionalId(targetProfessionalId);
    setIsProfessionalBankLookupOpen(false);
    setProfessionalRecordDialogMode(mode);
  }

  function closeProfessionalRecordDialog(): void {
    setIsCreatingProfessional(false);
    setIsProfessionalBankLookupOpen(false);
    setProfessionalRecordDialogMode("closed");
  }

  function selectServiceRecord(serviceId: string): void {
    setSelectedServiceId(serviceId);
    if (serviceWorkspaceMode === "new") {
      setServiceWorkspaceMode("browse");
    }
  }

  function openServiceWorkspace(
    mode: Exclude<ServiceWorkspaceMode, "browse">,
    serviceId?: string
  ): void {
    setIsServiceDeleteDialogOpen(false);
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
    setIsServiceDeleteDialogOpen(false);
  }

  function openProfessionalAvailabilityWorkspace(
    professionalId?: string
  ): void {
    setIsCreatingProfessional(false);
    setProfessionalRecordDialogMode("closed");
    if (professionalId) {
      setSelectedProfessionalId(professionalId);
    }
    setProfessionalWorkspaceMode("availability");
    scrollProfessionalsWorkspaceIntoView();
  }

  function openProfessionalServicesWorkspace(professionalId?: string): void {
    if (professionalId) {
      setIsCreatingProfessional(false);
      setSelectedProfessionalId(professionalId);
    }

    setProfessionalRecordDialogMode("closed");
    setProfessionalWorkspaceMode("services");
    scrollProfessionalsWorkspaceIntoView();
  }

  function clearSelectedProfessional(): void {
    setIsCreatingProfessional(false);
    setSelectedProfessionalId("");
    setIsProfessionalBankLookupOpen(false);
    setProfessionalRecordDialogMode("closed");
  }

  async function handleToggleProfessionalStatus(): Promise<void> {
    const professional = professionals.find(
      (item) => item.id === selectedProfessionalId
    );
    if (!professional) {
      return;
    }

    const nextStatus: ProfessionalStatus =
      professional.status === "active" ? "inactive" : "active";

    await runAction(async () => {
      await updateProfessional(apiBaseUrl, sessionToken, professional.id, {
        nome: professional.nome.trim(),
        status: nextStatus,
        especialidades: [...professional.especialidades],
        bankId: professional.bankId || undefined
      });
      setProfessionalRecordDialogMode("closed");
      await refreshAdminState();
      setFeedback({
        tone: nextStatus === "inactive" ? "info" : "success",
        message:
          nextStatus === "inactive"
            ? "Profissional bloqueado."
            : "Profissional reativado."
      });
    });
  }

  async function handleToggleProfessionalServiceLink(
    serviceId: string
  ): Promise<void> {
    if (!selectedProfessionalId) {
      setFeedback({
        tone: "error",
        message:
          "Selecione um profissional antes de alterar os servicos vinculados."
      });
      return;
    }

    const nextServiceIds = toggleArrayValue(
      professionalForm.especialidades,
      serviceId
    );

    await runAction(async () => {
      await updateProfessional(
        apiBaseUrl,
        sessionToken,
        selectedProfessionalId,
        {
          nome: professionalForm.nome.trim(),
          status: professionalForm.status,
          especialidades: nextServiceIds,
          bankId: professionalForm.bankId || undefined
        }
      );
      setProfessionalForm((current) => ({
        ...current,
        especialidades: nextServiceIds
      }));
      await refreshAdminState();
      setFeedback({
        tone: "success",
        message: "Amarracao de servicos atualizada."
      });
    });
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
      setFeedback({
        tone: "info",
        message: "Painel administrativo atualizado."
      });
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

  function openAgendaBookingModal(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setIsAgendaBookingModalOpen(true);
  }

  function closeAgendaBookingModal(): void {
    setIsAgendaBookingModalOpen(false);
  }

  function handleOpenAgendaBooking(booking: Booking): void {
    handleAgendaBookingSelection(booking);
    setAgendaViewMode("day");
    navigateTo("agenda");
  }

  function handleAgendaCalendarSlotSelection(start: Date): void {
    const now = new Date();
    if (start.getTime() < now.getTime()) {
      setFeedback({
        tone: "error",
        message: "Nao e possivel criar agendamento em horario passado."
      });
      return;
    }

    const nextDate = formatDateInputValue(start);
    setAgendaDate(nextDate);
    openCounterBookingModal({
      date: nextDate,
      professionalId:
        agendaProfessionalFilter !== "all"
          ? agendaProfessionalFilter
          : undefined,
      slotStartAt:
        agendaViewMode === "month"
          ? undefined
          : formatLocalDateTimeOffsetValue(start)
    });
  }

  function renderClientRecords(entries: readonly ClientInsight[]): JSX.Element {
    if (!entries.length) {
      return <p className="empty-state">Nenhum cliente cadastrado ainda.</p>;
    }

    return (
      <>
        {entries.map((entry) => {
          const segment = resolveClientSegment(entry, clientReturnWindow);
          const isSelected =
            entry.client.id === selectedClientInsight?.client.id;
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
                <span
                  className={`status-pill is-${resolveClientSegmentTone(segment)}`}
                >
                  {formatClientSegment(segment, clientReturnWindow)}
                </span>
                <span className="status-pill is-neutral">
                  {entry.totalBookings} booking(s)
                </span>
                <span className="status-pill is-info">
                  Em aberto {entry.openBookings}
                </span>
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
                    {entry.lastBooking
                      ? formatDateTime(entry.lastBooking.startAt)
                      : "Sem booking"}
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
                    Ultimo movimento financeiro{" "}
                    {formatDateTime(entry.lastCashEntry.occurredAt)}
                  </span>
                ) : (
                  <span>Nenhum movimento financeiro visivel</span>
                )}
              </div>
            </button>
          );
        })}
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
              <a
                className="secondary-button button-link"
                href={publicBookingUrl}
                rel="noreferrer"
                target="_blank"
              >
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
      brandingForm.tagline.trim() ||
      "Agendamentos rapidos, claros e prontos para o celular.";

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
              <span>
                {publicBookingUrl ||
                  "Publique uma slug para visualizar o link."}
              </span>
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
                  setPaymentForm({
                    ...paymentForm,
                    publicKey: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Access token</span>
              <input
                type="password"
                value={paymentForm.accessToken}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    accessToken: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Collector ID</span>
              <input
                type="text"
                value={paymentForm.collectorId}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    collectorId: event.target.value
                  })
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
                  setPaymentForm({
                    ...paymentForm,
                    backSuccess: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Back pending</span>
              <input
                type="url"
                value={paymentForm.backPending}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    backPending: event.target.value
                  })
                }
              />
            </label>
            <label className="field">
              <span>Back failure</span>
              <input
                type="url"
                value={paymentForm.backFailure}
                onChange={(event) =>
                  setPaymentForm({
                    ...paymentForm,
                    backFailure: event.target.value
                  })
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
                setPaymentForm({
                  ...paymentForm,
                  binaryMode: event.target.checked
                })
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
    const selectedService =
      services.find((service) => service.id === selectedServiceId) ?? null;
    const isViewingService =
      serviceWorkspaceMode === "view" && Boolean(selectedService);
    const isEditingService =
      serviceWorkspaceMode === "edit" && Boolean(selectedService);
    const isCreatingService = serviceWorkspaceMode === "new";
    const canOpenSelectedService = Boolean(selectedService);
    const activeModalTitle = isCreatingService
      ? "Novo servico"
      : isEditingService
        ? `Editar ${selectedService?.nome ?? "servico"}`
        : `Visualizar ${selectedService?.nome ?? "servico"}`;
    const activeModalSubtitle = isCreatingService
      ? "Preencha os dados do cadastro e salve o novo servico."
      : isEditingService
        ? "Ajuste os dados do servico sem sair da tela principal do catalogo."
        : "Leitura rapida do cadastro comercial selecionado.";
    const catalogColumns = [
      { key: "codigo", label: "Codigo" },
      { key: "servico", label: "Servico" },
      { key: "duracao", label: "Duracao" },
      { key: "preco", label: "Preco" },
      { key: "cobranca", label: "Cobranca" },
      { key: "status", label: "Status" }
    ] as const;
    const catalogRows = services.map((service, index) => {
      const collectionLabel =
        service.paymentPolicy.collectionMode === "none"
          ? "Reserva imediata"
          : service.paymentPolicy.collectionMode;

      return {
        id: service.id,
        selected: service.id === selectedServiceId,
        onClick: () => selectServiceRecord(service.id),
        cells: [
          {
            key: "codigo",
            value: service.codigo || String(index + 1).padStart(2, "0")
          },
          {
            key: "servico",
            value: `${service.nome} | ${formatMinutesAsHours(service.duracaoMin)}`
          },
          { key: "duracao", value: `${service.duracaoMin} min` },
          { key: "preco", value: formatCurrency(service.precoBase) },
          { key: "cobranca", value: collectionLabel },
          {
            key: "status",
            value: (
              <span
                className={`status-pill is-${service.status === "active" ? "success" : "warning"}`}
              >
                {formatServiceStatus(service.status)}
              </span>
            )
          }
        ]
      };
    });
    const catalogPreviewFields = selectedService
      ? [
          {
            id: "codigo",
            label: "Codigo",
            value: selectedService.codigo || "Nao definido"
          },
          {
            id: "status",
            label: "Status",
            value: formatServiceStatus(selectedService.status)
          },
          {
            id: "duracao",
            label: "Duracao",
            value: formatMinutesAsHours(selectedService.duracaoMin)
          },
          {
            id: "preco",
            label: "Preco base",
            value: formatCurrency(selectedService.precoBase)
          },
          {
            id: "cobranca",
            label: "Cobranca",
            value:
              selectedService.paymentPolicy.collectionMode === "none"
                ? "Reserva imediata"
                : selectedService.paymentPolicy.collectionMode
          },
          {
            id: "checkout",
            label: "Checkout",
            value: selectedService.paymentPolicy.checkoutMode
          },
          {
            id: "meios",
            label: "Meios aceitos",
            value:
              selectedService.paymentPolicy.acceptedMethods.join(" | ") ||
              "Nao definidos"
          }
        ]
      : [];

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
              <button
                className="secondary-button is-danger"
                disabled={!canOpenSelectedService}
                onClick={() => setIsServiceDeleteDialogOpen(true)}
                type="button"
              >
                Excluir
              </button>
            </div>
          }
        >
          <div className="catalog-browse-shell">
            {renderFinanceBrowseTable(
              catalogColumns,
              catalogRows,
              "Nenhum servico cadastrado ainda."
            )}
          </div>
        </EntitySection>

        {isViewingService || isEditingService || isCreatingService ? (
          <WorkspaceRecordModal
            subtitle={activeModalSubtitle}
            title={activeModalTitle}
            onClose={() => closeServiceWorkspace()}
          >
            {isViewingService && selectedService ? (
              <div className="catalog-record-preview-grid">
                {catalogPreviewFields.map((field) => (
                  <div className="catalog-preview-item" key={field.id}>
                    <span className="catalog-preview-item-label">
                      {field.label}
                    </span>
                    <strong className="catalog-preview-item-value">
                      {field.value}
                    </strong>
                  </div>
                ))}
              </div>
            ) : (
              <form className="stack-form" onSubmit={handleSaveService}>
                <div className="form-grid">
                  <label className="field">
                    <span>Nome</span>
                    <input
                      required
                      type="text"
                      value={serviceForm.nome}
                      onChange={(event) =>
                        setServiceForm({
                          ...serviceForm,
                          nome: event.target.value
                        })
                      }
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
                        setServiceForm({
                          ...serviceForm,
                          duracaoMin: event.target.value
                        })
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
                        setServiceForm({
                          ...serviceForm,
                          precoBase: event.target.value
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Status</span>
                    <select
                      value={serviceForm.status}
                      onChange={(event) =>
                        setServiceForm({
                          ...serviceForm,
                          status: event.target.value as ServiceStatus
                        })
                      }
                    >
                      {serviceStatusValues.map((status) => (
                        <option key={status} value={status}>
                          {formatServiceStatus(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Cobranca</span>
                    <select
                      value={serviceForm.collectionMode}
                      onChange={(event) =>
                        setServiceForm({
                          ...serviceForm,
                          collectionMode: event.target
                            .value as PaymentCollectionMode
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
                          checkoutMode: event.target
                            .value as PaymentCheckoutMode
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
                          setServiceForm({
                            ...serviceForm,
                            fixedAmount: event.target.value
                          })
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
                          setServiceForm({
                            ...serviceForm,
                            percentage: event.target.value
                          })
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
                            acceptedMethods: toggleArrayValue(
                              serviceForm.acceptedMethods,
                              method
                            )
                          })
                        }
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </fieldset>

                <div className="catalog-form-footer">
                  <div className="button-row">
                    {!isCreatingService && selectedService ? (
                      <button
                        className="secondary-button"
                        onClick={() =>
                          openServiceWorkspace("view", selectedService.id)
                        }
                        type="button"
                      >
                        Visualizar
                      </button>
                    ) : null}
                    <button
                      className="secondary-button"
                      onClick={() => closeServiceWorkspace()}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className="primary-button"
                      disabled={isBusy}
                      type="submit"
                    >
                      {selectedService ? "Salvar servico" : "Criar servico"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </WorkspaceRecordModal>
        ) : null}

        {isServiceDeleteDialogOpen && selectedService ? (
          <WorkspaceRecordModal
            subtitle="Essa acao remove o cadastro comercial selecionado."
            title={`Excluir ${selectedService.nome}`}
            footer={
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={() => setIsServiceDeleteDialogOpen(false)}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="secondary-button is-danger"
                  disabled={isBusy}
                  onClick={() => void handleDeleteSelectedService()}
                  type="button"
                >
                  Confirmar exclusao
                </button>
              </div>
            }
            onClose={() => setIsServiceDeleteDialogOpen(false)}
          >
            <div className="workspace-record-delete-copy">
              <strong>
                {selectedService.codigo} | {selectedService.nome}
              </strong>
              <p>
                O servico sera removido do catalogo. Se ele estiver vinculado a
                profissionais, revise a equipe depois da exclusao.
              </p>
            </div>
          </WorkspaceRecordModal>
        ) : null}
      </>
    );
  }

  function renderProfessionalBankLookupModal(): JSX.Element | null {
    if (!isProfessionalBankLookupOpen) {
      return null;
    }

    return (
      <WorkspaceRecordModal
        subtitle="Selecione o banco padrao do profissional."
        title="Banco padrao"
        onClose={() => setIsProfessionalBankLookupOpen(false)}
      >
        <div className="stack-form">
          {renderFinanceBrowseTable(
            [
              { key: "codigo", label: "Codigo" },
              { key: "banco", label: "Banco" },
              { key: "bacen", label: "BACEN" },
              { key: "conta", label: "Agencia / Conta" }
            ],
            banks.map((bank) => ({
              id: bank.id,
              selected: bank.id === professionalForm.bankId,
              onClick: () => {
                setProfessionalForm((current) => ({
                  ...current,
                  bankId: bank.id
                }));
                setIsProfessionalBankLookupOpen(false);
              },
              cells: [
                { key: "codigo", value: bank.codigo },
                { key: "banco", value: bank.nomeBanco },
                { key: "bacen", value: bank.bacenCode },
                { key: "conta", value: `${bank.agencia}/${bank.conta}` }
              ]
            })),
            "Nenhum banco disponivel."
          )}
        </div>
      </WorkspaceRecordModal>
    );
  }

  function renderProfessionalRecordDialog(): JSX.Element | null {
    if (professionalRecordDialogMode === "closed") {
      return null;
    }

    const selectedProfessional =
      professionals.find(
        (professional) => professional.id === selectedProfessionalId
      ) ?? null;
    const selectedProfessionalBank =
      banks.find(
        (bank) =>
          bank.id === professionalForm.bankId ||
          bank.id === selectedProfessional?.bankId
      ) ?? null;
    const linkedServiceNames = selectedProfessional
      ? resolveProfessionalServiceNames(selectedProfessional, services)
      : professionalForm.especialidades
          .map(
            (serviceId) =>
              services.find((service) => service.id === serviceId)?.nome
          )
          .filter((value): value is string => Boolean(value));
    const availabilitySummary = selectedProfessionalId
      ? resolveAvailabilitySummary(
          weeklyAvailabilityByProfessional[selectedProfessionalId] ?? []
        )
      : "Sem horarios configurados";
    const isViewingProfessional = professionalRecordDialogMode === "view";
    const isEditingProfessional = professionalRecordDialogMode === "edit";
    const isCreatingProfessionalRecord = professionalRecordDialogMode === "new";
    const isTogglingStatus = professionalRecordDialogMode === "toggle-status";
    const formId = "professional-record-form";
    const modalTitle = isCreatingProfessionalRecord
      ? "Incluir profissional"
      : isViewingProfessional
        ? `Visualizar ${selectedProfessional?.nome ?? "profissional"}`
        : isEditingProfessional
          ? `Alterar ${selectedProfessional?.nome ?? "profissional"}`
          : selectedProfessional?.status === "inactive"
            ? `Reativar ${selectedProfessional.nome}`
            : `Bloquear ${selectedProfessional?.nome ?? "profissional"}`;
    const modalSubtitle = isCreatingProfessionalRecord
      ? "Use esta tela apenas para dados cadastrais do profissional."
      : isViewingProfessional
        ? "Consulta rapida do cadastro selecionado."
        : isEditingProfessional
          ? "Edite somente o cadastro base. Servicos e agenda ficam em frentes dedicadas."
          : selectedProfessional?.status === "inactive"
            ? "Esta acao volta a liberar o cadastro para operacao."
            : "Esta acao impede novos usos operacionais do profissional sem apagar historico.";
    const previewFields = [
      {
        id: "codigo",
        label: "Codigo",
        value: selectedProfessional?.codigo ?? "Novo cadastro"
      },
      {
        id: "nome",
        label: "Nome",
        value:
          selectedProfessional?.nome ||
          professionalForm.nome ||
          "Profissional nao selecionado"
      },
      {
        id: "status",
        label: "Status",
        value: formatProfessionalStatus(
          selectedProfessional?.status ?? professionalForm.status
        )
      },
      {
        id: "banco",
        label: "Banco padrao",
        value: selectedProfessionalBank?.nomeBanco ?? "Nao definido"
      },
      {
        id: "servicos",
        label: "Servicos vinculados",
        value: `${linkedServiceNames.length}`
      },
      {
        id: "agenda",
        label: "Janela da agenda",
        value: availabilitySummary
      }
    ] as const;

    if (
      (isViewingProfessional || isEditingProfessional || isTogglingStatus) &&
      !selectedProfessional
    ) {
      return null;
    }

    return (
      <>
        <WorkspaceRecordModal
          subtitle={modalSubtitle}
          title={modalTitle}
          onClose={closeProfessionalRecordDialog}
        >
          {isViewingProfessional ? (
            <div className="catalog-record-preview-grid">
              {previewFields.map((field) => (
                <div className="catalog-preview-item" key={field.id}>
                  <span className="catalog-preview-item-label">
                    {field.label}
                  </span>
                  <strong className="catalog-preview-item-value">
                    {field.value}
                  </strong>
                </div>
              ))}
            </div>
          ) : isTogglingStatus ? (
            <div className="stack-form">
              <div className="catalog-record-preview-grid">
                {previewFields.map((field) => (
                  <div className="catalog-preview-item" key={field.id}>
                    <span className="catalog-preview-item-label">
                      {field.label}
                    </span>
                    <strong className="catalog-preview-item-value">
                      {field.value}
                    </strong>
                  </div>
                ))}
              </div>
              <p className="professional-record-status-copy">
                {selectedProfessional?.status === "inactive"
                  ? "O cadastro voltara para a operacao normal, preservando seus vinculos atuais."
                  : "O cadastro sera marcado como inativo, preservando historico e vinculos ja existentes."}
              </p>
              <div className="button-row">
                <button
                  className="secondary-button"
                  onClick={closeProfessionalRecordDialog}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  disabled={isBusy}
                  onClick={() => void handleToggleProfessionalStatus()}
                  type="button"
                >
                  {selectedProfessional?.status === "inactive"
                    ? "Reativar profissional"
                    : "Bloquear profissional"}
                </button>
              </div>
            </div>
          ) : (
            <form
              className="stack-form professional-record-form"
              id={formId}
              onSubmit={handleSaveProfessional}
            >
              <div className="form-grid">
                <label className="field">
                  <span>Nome</span>
                  <input
                    required
                    type="text"
                    value={professionalForm.nome}
                    onChange={(event) =>
                      setProfessionalForm({
                        ...professionalForm,
                        nome: event.target.value
                      })
                    }
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    value={professionalForm.status}
                    onChange={(event) =>
                      setProfessionalForm({
                        ...professionalForm,
                        status: event.target.value as ProfessionalStatus
                      })
                    }
                  >
                    {professionalStatusValues.map((status) => (
                      <option key={status} value={status}>
                        {formatProfessionalStatus(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field field-wide">
                  <span>Banco padrao</span>
                  <div className="lookup-inline-field">
                    <input
                      readOnly
                      type="text"
                      value={
                        selectedProfessionalBank
                          ? `${selectedProfessionalBank.codigo} | ${selectedProfessionalBank.nomeBanco} ${selectedProfessionalBank.agencia}/${selectedProfessionalBank.conta}`
                          : "Sem banco vinculado"
                      }
                    />
                    <button
                      className="secondary-button"
                      onClick={() => setIsProfessionalBankLookupOpen(true)}
                      type="button"
                    >
                      Buscar
                    </button>
                    <button
                      className="secondary-button"
                      disabled={!professionalForm.bankId}
                      onClick={() =>
                        setProfessionalForm((current) => ({
                          ...current,
                          bankId: ""
                        }))
                      }
                      type="button"
                    >
                      Limpar
                    </button>
                  </div>
                </label>
              </div>

              <div className="professional-record-caption">
                {selectedProfessional ? (
                  <>
                    <span>
                      {linkedServiceNames.length} servico(s) vinculado(s)
                    </span>
                    <span>{availabilitySummary}</span>
                  </>
                ) : (
                  <span>
                    Vinculos com servicos e agenda sao tratados nas frentes
                    exclusivas do shell.
                  </span>
                )}
              </div>

              <div className="button-row">
                {isEditingProfessional && selectedProfessional ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      openProfessionalRecordDialog(
                        "view",
                        selectedProfessional.id
                      )
                    }
                    type="button"
                  >
                    Visualizar
                  </button>
                ) : null}
                <button
                  className="secondary-button"
                  onClick={closeProfessionalRecordDialog}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  disabled={isBusy}
                  form={formId}
                  type="submit"
                >
                  {isCreatingProfessionalRecord
                    ? "Criar profissional"
                    : "Salvar profissional"}
                </button>
              </div>
            </form>
          )}
        </WorkspaceRecordModal>
        {renderProfessionalBankLookupModal()}
      </>
    );
  }

  function renderProfessionalProfileWorkspace(): JSX.Element {
    const selectedProfessional =
      professionals.find(
        (professional) => professional.id === selectedProfessionalId
      ) ?? null;
    const normalizedQuery = professionalBrowseSearch.trim().toLowerCase();
    const filteredProfessionals = professionals.filter((professional) => {
      if (
        professionalBrowseStatusFilter !== "all" &&
        professional.status !== professionalBrowseStatusFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const linkedServiceNames = resolveProfessionalServiceNames(
        professional,
        services
      );
      const professionalBank = banks.find(
        (bank) => bank.id === professional.bankId
      );
      const searchable = [
        professional.codigo,
        professional.nome,
        professionalBank?.nomeBanco ?? "",
        formatProfessionalStatus(professional.status),
        resolveProfessionalSummaryLine(linkedServiceNames)
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
    const professionalRows = filteredProfessionals.map((professional) => {
      const linkedServiceNames = resolveProfessionalServiceNames(
        professional,
        services
      );
      const professionalBank = banks.find(
        (bank) => bank.id === professional.bankId
      );

      return {
        id: professional.id,
        selected: professional.id === selectedProfessionalId,
        onClick: () => selectProfessionalRecord(professional.id),
        cells: [
          { key: "codigo", value: professional.codigo },
          { key: "nome", value: professional.nome },
          {
            key: "banco",
            value: professionalBank?.nomeBanco ?? "Sem banco"
          },
          { key: "servicos", value: `${linkedServiceNames.length} vinculo(s)` },
          {
            key: "status",
            value: (
              <span
                className={`status-pill is-${resolveProfessionalStatusTone(professional.status)}`}
              >
                {formatProfessionalStatus(professional.status)}
              </span>
            )
          }
        ]
      };
    });
    const selectedLinkedServiceNames = selectedProfessional
      ? resolveProfessionalServiceNames(selectedProfessional, services)
      : [];
    const selectedAvailabilitySummary = selectedProfessionalId
      ? resolveAvailabilitySummary(
          weeklyAvailabilityByProfessional[selectedProfessionalId] ?? []
        )
      : "Selecione um registro no browse para habilitar as acoes.";

    return (
      <>
        <article className="ag-surface-card ag-view-panel professional-registry-workspace">
          <div className="ag-view-panel-header">
            <div className="ag-view-panel-copy">
              <h3 className="ag-view-panel-title">Cadastro de profissionais</h3>
              <p className="ag-view-panel-description">
                Frente exclusiva para incluir, visualizar, alterar e bloquear
                profissionais no padrao de browse operacional.
              </p>
            </div>
            <ViewBadge tone="info">
              {filteredProfessionals.length} registro(s)
            </ViewBadge>
          </div>

          <div className="professional-registry-toolbar">
            <label className="dashboard-select">
              <span>Pesquisar</span>
              <input
                placeholder="Codigo, nome, banco ou status"
                type="search"
                value={professionalBrowseSearch}
                onChange={(event) =>
                  setProfessionalBrowseSearch(event.target.value)
                }
              />
            </label>

            <label className="dashboard-select">
              <span>Status</span>
              <select
                value={professionalBrowseStatusFilter}
                onChange={(event) =>
                  setProfessionalBrowseStatusFilter(
                    event.target.value as ProfessionalStatus | "all"
                  )
                }
              >
                <option value="all">Todos</option>
                {professionalStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {formatProfessionalStatus(status)}
                  </option>
                ))}
              </select>
            </label>

            <div className="entity-record-actions professional-registry-actions">
              <button
                className="primary-button"
                onClick={openNewProfessionalDialog}
                type="button"
              >
                Incluir
              </button>
              <button
                className="secondary-button"
                disabled={!selectedProfessionalId}
                onClick={() => openProfessionalRecordDialog("view")}
                type="button"
              >
                Visualizar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedProfessionalId}
                onClick={() => openProfessionalRecordDialog("edit")}
                type="button"
              >
                Alterar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedProfessionalId}
                onClick={() => openProfessionalRecordDialog("toggle-status")}
                type="button"
              >
                {selectedProfessional?.status === "inactive"
                  ? "Reativar"
                  : "Bloquear"}
              </button>
            </div>
          </div>

          <div className="professional-registry-selection">
            <span>
              {selectedProfessional
                ? `${selectedProfessional.codigo} | ${selectedProfessional.nome}`
                : "Selecione uma linha do browse para habilitar as acoes do cadastro."}
            </span>
            <span>
              {selectedProfessional
                ? `${selectedLinkedServiceNames.length} servico(s) | ${selectedAvailabilitySummary}`
                : `${filteredProfessionals.length} registro(s) visivel(is) no filtro atual.`}
            </span>
          </div>

          <div className="professionals-browse-shell professional-registry-browse-shell">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "nome", label: "Profissional" },
                { key: "banco", label: "Banco padrao" },
                { key: "servicos", label: "Servicos" },
                { key: "status", label: "Status" }
              ],
              professionalRows,
              "Nenhum profissional encontrado."
            )}
          </div>
        </article>

        {renderProfessionalRecordDialog()}
      </>
    );
  }

  function renderProfessionalAvailabilityWorkspace(): JSX.Element {
    const selectedProfessional = professionals.find(
      (professional) => professional.id === selectedProfessionalId
    );
    const availabilitySummary = resolveAvailabilitySummary(
      weeklyAvailabilityByProfessional[selectedProfessionalId] ?? []
    );
    const linkedServiceNames = selectedProfessional
      ? resolveProfessionalServiceNames(selectedProfessional, services)
      : [];
    const formId = "professional-availability-form";
    const linkedServicesLabel = linkedServiceNames.length
      ? linkedServiceNames.join(" | ")
      : "Sem servicos vinculados";

    return (
      <div className="professionals-detail-stack">
        <DocumentHeader
          fields={[
            {
              id: "availability-professional-code",
              label: "Codigo",
              value: selectedProfessional?.codigo ?? "Nao definido"
            },
            {
              id: "availability-professional-name",
              label: "Profissional",
              value: selectedProfessional?.nome ?? "Nao selecionado"
            },
            {
              id: "availability-professional-status",
              label: "Status",
              value: selectedProfessional
                ? formatProfessionalStatus(selectedProfessional.status)
                : "Nao definido"
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

        <form
          className="professional-availability-form professional-master-detail-form"
          id={formId}
          onSubmit={handleSaveAvailability}
        >
          <EntitySection
            title="Janela semanal"
            description="Cada linha altera a disponibilidade semanal persistida para o profissional selecionado."
          >
            <div className="professional-availability-grid">
              {availabilityDays.map((day) => (
                <div
                  className="professional-availability-row"
                  key={day.weekday}
                >
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
                Cadastro de profissionais
              </button>
              {selectedProfessionalId ? (
                <button
                  className="secondary-button"
                  onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                  type="button"
                >
                  Ver agenda real
                </button>
              ) : null}
              {selectedProfessionalId ? (
                <button
                  className="secondary-button"
                  onClick={() =>
                    openProfessionalServicesWorkspace(selectedProfessionalId)
                  }
                  type="button"
                >
                  Profissionais x Servicos
                </button>
              ) : null}
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
        </form>
      </div>
    );
  }

  function renderProfessionalServicesWorkspace(): JSX.Element {
    const selectedProfessional =
      professionals.find(
        (professional) => professional.id === selectedProfessionalId
      ) ?? null;
    const linkedServiceNames = selectedProfessional
      ? resolveProfessionalServiceNames(selectedProfessional, services)
      : [];
    const selectedProfessionalBank =
      banks.find(
        (bank) =>
          bank.id === professionalForm.bankId ||
          bank.id === selectedProfessional?.bankId
      ) ?? null;
    const normalizedQuery = professionalServicesSearch.trim().toLowerCase();
    const filteredServices = services.filter((service) => {
      if (
        professionalServicesStatusFilter !== "all" &&
        service.status !== professionalServicesStatusFilter
      ) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const searchable = [
        service.codigo,
        service.nome,
        formatServiceStatus(service.status),
        String(service.duracaoMin),
        formatCurrency(service.precoBase)
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });

    return (
      <div className="professionals-detail-stack">
        <DocumentHeader
          fields={[
            {
              id: "service-links-code",
              label: "Codigo",
              value: selectedProfessional?.codigo ?? "Selecione um profissional"
            },
            {
              id: "service-links-professional",
              label: "Profissional",
              value: selectedProfessional?.nome ?? "Sem profissional carregado"
            },
            {
              id: "service-links-count",
              label: "Servicos vinculados",
              value: String(professionalForm.especialidades.length)
            },
            {
              id: "service-links-bank",
              label: "Banco padrao",
              value: selectedProfessionalBank?.nomeBanco ?? "Nao definido"
            }
          ]}
        />

        <article className="ag-surface-card ag-view-panel professional-service-workspace">
          <div className="ag-view-panel-header">
            <div className="ag-view-panel-copy">
              <h3 className="ag-view-panel-title">Profissionais x Servicos</h3>
              <p className="ag-view-panel-description">
                Use a consulta padrao para selecionar o profissional e marque os
                servicos que ele pode atender.
              </p>
            </div>
            <ViewBadge tone="info">
              {filteredServices.length} servico(s)
            </ViewBadge>
          </div>

          <div className="professional-service-toolbar">
            <label className="dashboard-select field-wide">
              <span>Profissional</span>
              <div className="lookup-inline-field">
                <input
                  readOnly
                  type="text"
                  value={
                    selectedProfessional
                      ? `${selectedProfessional.codigo} | ${selectedProfessional.nome}`
                      : "Selecione um profissional"
                  }
                />
                <button
                  className="secondary-button"
                  onClick={() => setIsProfessionalLookupOpen(true)}
                  type="button"
                >
                  <Search className="w-4 h-4" />
                  Buscar
                </button>
                <button
                  className="secondary-button"
                  disabled={!selectedProfessionalId}
                  onClick={() => clearSelectedProfessional()}
                  type="button"
                >
                  Limpar
                </button>
              </div>
            </label>

            <label className="dashboard-select">
              <span>Pesquisar servico</span>
              <input
                placeholder="Codigo, nome ou status"
                type="search"
                value={professionalServicesSearch}
                onChange={(event) =>
                  setProfessionalServicesSearch(event.target.value)
                }
              />
            </label>

            <label className="dashboard-select">
              <span>Status</span>
              <select
                value={professionalServicesStatusFilter}
                onChange={(event) =>
                  setProfessionalServicesStatusFilter(
                    event.target.value as ServiceStatus | "all"
                  )
                }
              >
                <option value="all">Todos</option>
                {serviceStatusValues.map((status) => (
                  <option key={status} value={status}>
                    {formatServiceStatus(status)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedProfessional ? (
            <>
              <div className="professional-service-summary">
                <span>
                  {linkedServiceNames.length} servico(s) atualmente vinculados
                </span>
                <span>
                  {linkedServiceNames.length
                    ? linkedServiceNames.join(" | ")
                    : "Nenhum servico vinculado ainda."}
                </span>
              </div>

              <div className="professional-service-browse-shell">
                <div className="finance-browse-shell professional-service-browse">
                  <div
                    className="finance-browse-row finance-browse-header"
                    role="row"
                  >
                    <span className="finance-browse-cell" role="columnheader">
                      Vincular
                    </span>
                    <span className="finance-browse-cell" role="columnheader">
                      Codigo
                    </span>
                    <span className="finance-browse-cell" role="columnheader">
                      Servico
                    </span>
                    <span className="finance-browse-cell" role="columnheader">
                      Duracao
                    </span>
                    <span className="finance-browse-cell" role="columnheader">
                      Preco
                    </span>
                    <span className="finance-browse-cell" role="columnheader">
                      Status
                    </span>
                  </div>
                  <div className="finance-browse-body professional-service-browse-body">
                    {filteredServices.length ? (
                      filteredServices.map((service) => {
                        const isLinked =
                          professionalForm.especialidades.includes(service.id);

                        return (
                          <label
                            className={
                              isLinked
                                ? "finance-browse-row professional-service-browse-row is-selected"
                                : "finance-browse-row professional-service-browse-row"
                            }
                            key={service.id}
                          >
                            <span className="finance-browse-cell professional-service-toggle-cell">
                              <input
                                checked={isLinked}
                                disabled={isBusy}
                                type="checkbox"
                                onChange={() =>
                                  void handleToggleProfessionalServiceLink(
                                    service.id
                                  )
                                }
                              />
                            </span>
                            <span className="finance-browse-cell">
                              {service.codigo}
                            </span>
                            <span className="finance-browse-cell">
                              <strong>{service.nome}</strong>
                            </span>
                            <span className="finance-browse-cell">
                              {formatMinutesAsHours(service.duracaoMin)}
                            </span>
                            <span className="finance-browse-cell">
                              {formatCurrency(service.precoBase)}
                            </span>
                            <span className="finance-browse-cell">
                              <span
                                className={`status-pill is-${service.status === "active" ? "success" : "warning"}`}
                              >
                                {formatServiceStatus(service.status)}
                              </span>
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      <div className="empty-state finance-browse-empty">
                        Nenhum servico encontrado para o filtro atual.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="professional-editor-footer">
                <div className="professional-editor-summary">
                  <span>
                    Marcacao imediata salva o vinculo no backend atual.
                  </span>
                  <span>
                    Use busca, status e rolagem para trabalhar lotes maiores sem
                    sair da tela.
                  </span>
                </div>
                <div className="button-row">
                  <button
                    className="secondary-button"
                    onClick={() => setProfessionalWorkspaceMode("profile")}
                    type="button"
                  >
                    Cadastro de profissionais
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      openProfessionalAvailabilityWorkspace(
                        selectedProfessional.id
                      )
                    }
                    type="button"
                  >
                    Profissionais x Agenda
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() =>
                      openProfessionalAgenda(selectedProfessional.id)
                    }
                    type="button"
                  >
                    Ver agenda real
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state professional-service-empty">
              Use a lupa do cabecalho para escolher o profissional e abrir a
              amarracao com servicos.
            </div>
          )}
        </article>
      </div>
    );
  }

  function renderProfessionalLookupModal(): JSX.Element | null {
    if (!isProfessionalLookupOpen) {
      return null;
    }

    const lookupColumns = [
      { key: "codigo", label: "Codigo" },
      { key: "profissional", label: "Profissional" },
      { key: "servicos", label: "Servicos" },
      { key: "status", label: "Status" }
    ] as const;
    const lookupRows = professionals.map((professional) => {
      const linkedServiceNames = resolveProfessionalServiceNames(
        professional,
        services
      );

      return {
        id: professional.id,
        selected: professional.id === selectedProfessionalId,
        onClick: () => {
          selectProfessionalRecord(professional.id);
          setIsProfessionalLookupOpen(false);
          scrollProfessionalsWorkspaceIntoView();
        },
        cells: [
          { key: "codigo", value: professional.codigo },
          { key: "profissional", value: professional.nome },
          { key: "servicos", value: `${linkedServiceNames.length} vinculo(s)` },
          {
            key: "status",
            value: (
              <span
                className={`status-pill is-${resolveProfessionalStatusTone(professional.status)}`}
              >
                {formatProfessionalStatus(professional.status)}
              </span>
            )
          }
        ]
      };
    });

    return (
      <WorkspaceRecordModal
        subtitle="Escolha o profissional para carregar as frentes exclusivas de servicos ou agenda."
        title="Selecionar profissional"
        onClose={() => setIsProfessionalLookupOpen(false)}
      >
        <div className="stack-form professionals-browse-shell">
          {renderFinanceBrowseTable(
            lookupColumns,
            lookupRows,
            "Nenhum profissional disponivel."
          )}
        </div>
      </WorkspaceRecordModal>
    );
  }

  function renderProfessionalsView(): JSX.Element {
    const selectedProfessional =
      professionals.find(
        (professional) => professional.id === selectedProfessionalId
      ) ?? null;
    const linkedServiceNames = selectedProfessional
      ? resolveProfessionalServiceNames(selectedProfessional, services)
      : [];
    const professionalsWithLinks = professionals.filter(
      (professional) => professional.especialidades.length > 0
    ).length;
    const activeProfessionals = professionals.filter(
      (professional) => professional.status === "active"
    ).length;
    const selectedProfessionalStatusTone = selectedProfessional
      ? resolveProfessionalStatusTone(selectedProfessional.status)
      : "neutral";
    const workspaceTitle =
      professionalWorkspaceMode === "services"
        ? "Profissionais x Servicos"
        : professionalWorkspaceMode === "availability"
          ? "Profissionais x Agenda"
          : "Cadastro de profissionais";

    return (
      <>
        <DocumentViewLayout
          className="professional-document-view"
          eyebrow="Equipe"
          header={null}
          title="Profissionais"
          subtitle="Cadastro de profissionais em frente exclusiva, com servicos e agenda separados em workspaces proprios."
          statusBadge={
            <ViewBadge
              tone={
                selectedProfessionalStatusTone as
                  | "neutral"
                  | "info"
                  | "success"
                  | "warning"
                  | "danger"
              }
            >
              {selectedProfessional
                ? `${selectedProfessional.nome} | ${workspaceTitle}`
                : workspaceTitle}
            </ViewBadge>
          }
          pageActions={
            <div className="professionals-page-actions">
              <button
                className="secondary-button"
                disabled={isBusy}
                onClick={handleRefreshClick}
                type="button"
              >
                Atualizar
              </button>
              {professionalWorkspaceMode !== "profile" ? (
                <button
                  className="secondary-button"
                  onClick={() => setIsProfessionalLookupOpen(true)}
                  type="button"
                >
                  Selecionar profissional
                </button>
              ) : null}
              {selectedProfessionalId &&
              professionalWorkspaceMode !== "profile" ? (
                <button
                  className="secondary-button"
                  onClick={() => {
                    openProfessionalProfileWorkspace(selectedProfessionalId);
                    openProfessionalRecordDialog(
                      "view",
                      selectedProfessionalId
                    );
                  }}
                  type="button"
                >
                  Ver cadastro
                </button>
              ) : null}
              {selectedProfessionalId ? (
                <button
                  className="secondary-button"
                  onClick={() => openProfessionalAgenda(selectedProfessionalId)}
                  type="button"
                >
                  Ver agenda real
                </button>
              ) : null}
              {professionalWorkspaceMode === "profile" ? (
                <button
                  className="primary-button"
                  onClick={openNewProfessionalDialog}
                  type="button"
                >
                  Incluir profissional
                </button>
              ) : null}
            </div>
          }
          summary={
            <DocumentSummaryCards
              metrics={[
                {
                  id: "total",
                  label: "Equipe cadastrada",
                  value: professionals.length,
                  helper: "Cadastros disponiveis para agenda e operacao.",
                  tone: "info"
                },
                {
                  id: "active",
                  label: "Ativos",
                  value: activeProfessionals,
                  helper: "Profissionais ativos no cadastro principal.",
                  tone: "success"
                },
                {
                  id: "linked",
                  label: "Com vinculos",
                  value: professionalsWithLinks,
                  helper: "Equipe com pelo menos um servico relacionado.",
                  tone: "warning"
                },
                {
                  id: "selected",
                  label: "Selecionado",
                  value: selectedProfessional?.codigo ?? "Sem foco",
                  helper: selectedProfessional
                    ? linkedServiceNames.join(" | ") ||
                      "Sem servicos vinculados."
                    : professionalWorkspaceMode === "profile"
                      ? "Use o browse do cadastro para selecionar um registro."
                      : "Abra a consulta padrao para carregar um profissional."
                }
              ]}
            />
          }
          tabs={
            <div
              aria-label="Workspace de profissionais"
              className="dashboard-tabbar professional-workspace-tabbar"
              role="tablist"
            >
              <button
                aria-selected={professionalWorkspaceMode === "profile"}
                className={
                  professionalWorkspaceMode === "profile"
                    ? "dashboard-tab-button is-active"
                    : "dashboard-tab-button"
                }
                onClick={() => setProfessionalWorkspaceMode("profile")}
                role="tab"
                type="button"
              >
                Cadastro
              </button>
              <button
                aria-selected={professionalWorkspaceMode === "services"}
                className={
                  professionalWorkspaceMode === "services"
                    ? "dashboard-tab-button is-active"
                    : "dashboard-tab-button"
                }
                onClick={() =>
                  openProfessionalServicesWorkspace(
                    selectedProfessionalId || undefined
                  )
                }
                role="tab"
                type="button"
              >
                Profissionais x Servicos
              </button>
              <button
                aria-selected={professionalWorkspaceMode === "availability"}
                className={
                  professionalWorkspaceMode === "availability"
                    ? "dashboard-tab-button is-active"
                    : "dashboard-tab-button"
                }
                onClick={() =>
                  openProfessionalAvailabilityWorkspace(
                    selectedProfessionalId || undefined
                  )
                }
                role="tab"
                type="button"
              >
                Profissionais x Agenda
              </button>
            </div>
          }
          items={
            <div
              className="professionals-workspace-stage"
              id="professionals-workspace"
            >
              {professionalWorkspaceMode === "services"
                ? renderProfessionalServicesWorkspace()
                : professionalWorkspaceMode === "availability"
                  ? renderProfessionalAvailabilityWorkspace()
                  : renderProfessionalProfileWorkspace()}
            </div>
          }
        />
        {renderProfessionalLookupModal()}
      </>
    );
  }

  function renderOperationalView(): JSX.Element {
    const isTodayView = agendaDate === formatDateInputValue(new Date());
    const pendingDayBookings = filteredDayAgendaBookings.filter((booking) =>
      isPendingBookingStatus(booking.status)
    );
    const confirmedDayBookings = filteredDayAgendaBookings.filter(
      (booking) => booking.status === "confirmado"
    );
    const completedDayBookings = filteredDayAgendaBookings.filter(
      (booking) => booking.status === "concluido"
    );
    const noShowDayBookings = filteredDayAgendaBookings.filter(
      (booking) => booking.status === "faltou"
    );
    const openDayBookings = filteredDayAgendaBookings.filter((booking) =>
      isOpenBookingStatus(booking.status)
    );
    const dayProjectedRevenue = filteredDayAgendaBookings.reduce(
      (total, booking) =>
        total +
        (services.find((service) => service.id === booking.serviceId)
          ?.precoBase ?? 0),
      0
    );
    const dayRecognizedRevenue = completedDayBookings.reduce(
      (total, booking) =>
        total + resolveRecognizedRevenueAmount(booking, services, cashEntries),
      0
    );
    const dayApprovedOnlineRevenue = completedDayBookings.reduce(
      (total, booking) => {
        const paymentIntent = paymentIntents.find(
          (item) => item.bookingId === booking.id
        );
        return (
          total +
          resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries)
        );
      },
      0
    );
    const nextOperationalBooking =
      openDayBookings[0] ?? filteredDayAgendaBookings[0];
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
      {
        id: "overview",
        label: "Resumo do dia",
        icon: ListTodo,
        count: filteredDayAgendaBookings.length
      },
      {
        id: "pending",
        label: "Pendencias",
        icon: AlertCircle,
        count: pendingDayBookings.length
      },
      {
        id: "confirmed",
        label: "Confirmados",
        icon: CheckCircle,
        count: confirmedDayBookings.length
      },
      {
        id: "completed",
        label: "Concluidos",
        icon: Check,
        count: completedDayBookings.length
      },
      {
        id: "noshow",
        label: "No-show",
        icon: XCircle,
        count: noShowDayBookings.length
      }
    ];
    const selectedOperationalProfessional = selectedAgendaBooking
      ? professionals.find(
          (professional) =>
            professional.id === selectedAgendaBooking.professionalId
        )
      : undefined;
    const selectedOperationalService = selectedAgendaBooking
      ? services.find(
          (service) => service.id === selectedAgendaBooking.serviceId
        )
      : undefined;
    const canReceiveSelectedBooking = Boolean(
      selectedAgendaBooking &&
      selectedAgendaCashEntry &&
      !selectedAgendaBankMovement
    );
    const canReverseSelectedBooking = Boolean(selectedAgendaBankMovement);

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
            const service = services.find(
              (item) => item.id === booking.serviceId
            );
            const paymentIntent = paymentIntents.find(
              (item) => item.bookingId === booking.id
            );
            const actions = resolveBookingActions(booking);
            const canSyncPayment =
              paymentIntent !== undefined &&
              paymentIntent.status !== "approved";
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
                  booking.id === selectedAgendaBookingId ? "is-selected" : "",
                  booking.status === "concluido" ? "is-muted" : "",
                  booking.status === "faltou" ? "is-danger" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={booking.id}
                onClick={() => {
                  setSelectedAgendaBookingId(booking.id);
                  setRescheduleDate(extractDatePart(booking.startAt));
                }}
              >
                <div className="record-card-header operational-record-heading">
                  <div className="record-stack operational-record-copy">
                    <strong>
                      {resolveClientName(booking.clientId, clients)}
                    </strong>
                    <span>
                      {resolveServiceName(booking.serviceId, services)} | Prof.{" "}
                      {resolveProfessionalName(
                        booking.professionalId,
                        professionals
                      )}
                    </span>
                  </div>
                  <div className="operational-record-badges">
                    <span className="status-pill is-neutral">
                      {formatTimeRange(booking.startAt, booking.endAt)}
                    </span>
                    {renderOperationalStatusBadge(booking)}
                    {paymentIntent &&
                    isApprovedPaymentIntent(paymentIntent.status) ? (
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
                      onClick={() =>
                        void handleBookingStatusAction(
                          booking.id,
                          action.nextStatus
                        )
                      }
                      type="button"
                    >
                      {action.nextStatus === "concluido" ? (
                        <Check className="w-4 h-4" />
                      ) : null}
                      {action.nextStatus === "confirmado" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : null}
                      {action.nextStatus === "faltou" ? (
                        <XCircle className="w-4 h-4" />
                      ) : null}
                      {action.label}
                    </button>
                  ))}
                  {canRescheduleBooking(booking) ? (
                    <button
                      className="secondary-button"
                      onClick={() => handleOpenAgendaBooking(booking)}
                      type="button"
                    >
                      <CalendarIcon className="w-4 h-4" />
                      Reagendar
                    </button>
                  ) : null}
                  {paymentIntent && canSyncPayment ? (
                    <button
                      className="secondary-button"
                      onClick={() => void handlePaymentSync(paymentIntent)}
                      type="button"
                    >
                      <CreditCard className="w-4 h-4" />
                      Atualizar pagamento
                    </button>
                  ) : null}
                  <button
                    className="secondary-button"
                    onClick={() => handleOpenAgendaBooking(booking)}
                    type="button"
                  >
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
        title={
          isTodayView ? "Operacao de hoje" : formatAgendaDayLabel(agendaDate)
        }
        subtitle="Pendencias, confirmacoes e encerramentos do dia organizados por visao, sem misturar toda a fila em uma unica superficie."
        statusBadge={
          <ViewBadge tone={isTodayView ? "success" : "info"}>
            {operationalFilterLabel}
          </ViewBadge>
        }
        pageActions={
          <div className="operational-document-actions">
            <div className="operational-day-switch">
              <button
                className="secondary-button"
                onClick={() => handleAgendaDateShift(-1)}
                type="button"
              >
                Ontem
              </button>
              <button
                className={
                  isTodayView
                    ? "secondary-button is-active"
                    : "secondary-button"
                }
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
                Amanha
              </button>
            </div>

            <label className="dashboard-select">
              <span>Profissional</span>
              <select
                onChange={(event) =>
                  setAgendaProfessionalFilter(event.target.value)
                }
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

            <button
              className="secondary-button"
              disabled={!selectedAgendaBooking}
              onClick={() =>
                selectedAgendaBooking
                  ? handleOpenAgendaBooking(selectedAgendaBooking)
                  : undefined
              }
              type="button"
            >
              Visualizar
            </button>
            <button
              className="secondary-button"
              disabled={!canReceiveSelectedBooking}
              onClick={() => {
                if (!selectedAgendaBooking || !selectedAgendaCashEntry) {
                  return;
                }

                setAgendaSettlementTarget(selectedAgendaBooking);
                setReceiveTarget({ cashEntryId: selectedAgendaCashEntry.id });
                setFinanceModalMode("create");
                setReceiveMovementForm({
                  bankIdDestino: selectedOperationalProfessional?.bankId ?? "",
                  valor: String(
                    resolveRecognizedRevenueAmount(
                      selectedAgendaBooking,
                      services,
                      cashEntries
                    )
                  ),
                  historico: `Recebimento ${selectedAgendaBooking.id.slice(-8).toUpperCase()} | ${selectedOperationalService?.nome ?? "Atendimento"}`,
                  dataMovimento: new Date().toISOString().slice(0, 16)
                });
                setFinanceModal("receive");
              }}
              type="button"
            >
              Receber
            </button>
            <button
              className="secondary-button"
              disabled={!canReverseSelectedBooking}
              onClick={() => {
                if (!selectedAgendaBooking || !selectedAgendaBankMovement) {
                  return;
                }

                setReverseTarget({
                  kind: "agenda",
                  movementId: selectedAgendaBankMovement.id,
                  label: `${selectedAgendaBooking.id.slice(-8).toUpperCase()} | ${resolveClientName(selectedAgendaBooking.clientId, clients)}`
                });
              }}
              type="button"
            >
              Estornar
            </button>
            <button
              className="secondary-button"
              disabled={isBusy}
              onClick={handleRefreshClick}
              type="button"
            >
              Atualizar
            </button>
            <button
              className="secondary-button"
              onClick={() => navigateTo("agenda")}
              type="button"
            >
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
                value: nextOperationalBooking
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
          <div
            aria-label="Visoes da operacao diaria"
            className="operational-tabbar"
            role="tablist"
          >
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
              actions={
                <ViewBadge tone="warning">
                  {pendingDayBookings.length} na fila
                </ViewBadge>
              }
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
              actions={
                <ViewBadge tone="info">
                  {confirmedDayBookings.length} confirmados
                </ViewBadge>
              }
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
              actions={
                <ViewBadge tone="success">
                  {completedDayBookings.length} concluidos
                </ViewBadge>
              }
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
              actions={
                <ViewBadge tone="danger">
                  {noShowDayBookings.length} no-show
                </ViewBadge>
              }
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
                actions={
                  <ViewBadge tone="info">
                    {openDayBookings.length} em aberto
                  </ViewBadge>
                }
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
                      helper:
                        "Conciliacao minima ligada a bookings concluidas.",
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

  function updateFinanceBrowseFilter<
    TTab extends keyof FinanceBrowseFiltersState
  >(tab: TTab, patch: Partial<FinanceBrowseFiltersState[TTab]>): void {
    setFinanceBrowseFilters((current) => ({
      ...current,
      [tab]: {
        ...current[tab],
        ...patch
      }
    }));
  }

  function renderDashboardView(): JSX.Element {
    const dashboardTabs: ReadonlyArray<{
      readonly id: DashboardWorkspaceTab;
      readonly label: string;
      readonly icon: LucideIcon;
    }> = [
      { id: "cashflow", label: "Fluxo de caixa", icon: DollarSign },
      { id: "agenda", label: "Agenda da semana", icon: CalendarDays },
      { id: "radar", label: "Radar da semana", icon: Activity }
    ];

    return (
      <DocumentViewLayout
        className="dashboard-document-view dashboard-document-view-financial"
        title="Dashboard"
        header={null}
        summary={null}
        tabs={
          <div
            aria-label="Visoes do dashboard"
            className="dashboard-tabbar"
            role="tablist"
          >
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
          dashboardWorkspaceTab === "cashflow" ? (
            renderFinancialCashflowPanels({
              showOpenFinanceButton: true
            })
          ) : dashboardWorkspaceTab === "agenda" ? (
            <EntitySection
              title="Agenda da semana"
              actions={
                <div className="dashboard-document-actions">
                  <label className="dashboard-select">
                    <span>Profissional</span>
                    <select
                      onChange={(event) =>
                        setDashboardProfessionalFilter(event.target.value)
                      }
                      value={dashboardProfessionalFilter}
                    >
                      <option value="all">Todos</option>
                      {professionals.map((professional) => (
                        <option key={professional.id} value={professional.id}>
                          {professional.nome}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="secondary-button"
                    onClick={() => navigateTo("agenda")}
                    type="button"
                  >
                    Abrir agenda
                  </button>
                </div>
              }
            >
              <div className="dashboard-progress-stack">
                <div className="dashboard-progress-block">
                  <div className="dashboard-progress-copy">
                    <span>Capacidade total</span>
                    <strong>
                      {formatMinutesAsHours(
                        dashboardWeekCapacitySummary.totalMinutes
                      )}
                    </strong>
                  </div>
                  <div className="dashboard-progress-bar">
                    <span style={{ width: "100%" }} />
                  </div>
                </div>
                <div className="dashboard-progress-block">
                  <div className="dashboard-progress-copy">
                    <span>Horas ocupadas</span>
                    <strong>
                      {formatMinutesAsHours(
                        dashboardWeekCapacitySummary.bookedMinutes
                      )}{" "}
                      (
                      {formatUtilization(
                        dashboardWeekCapacitySummary.bookedMinutes,
                        dashboardWeekCapacitySummary.totalMinutes
                      )}
                      )
                    </strong>
                  </div>
                  <div className="dashboard-progress-bar">
                    <span
                      className="is-info"
                      style={{
                        width: `${Math.min(
                          dashboardWeekCapacitySummary.totalMinutes > 0
                            ? (dashboardWeekCapacitySummary.bookedMinutes /
                                dashboardWeekCapacitySummary.totalMinutes) *
                                100
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
                  <span>Hoje</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{todayPendingCount}</strong>
                  <span>Pendentes</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{todayConfirmedCount}</strong>
                  <span>Confirmados</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>{dashboardWeekCapacitySummary.openBookings}</strong>
                  <span>Em aberto</span>
                </div>
              </div>
            </EntitySection>
          ) : (
            <>
              <EntitySection
                title="Radar da semana"
                actions={
                  <div className="dashboard-document-actions">
                    <label className="dashboard-select">
                      <span>Profissional</span>
                      <select
                        onChange={(event) =>
                          setDashboardProfessionalFilter(event.target.value)
                        }
                        value={dashboardProfessionalFilter}
                      >
                        <option value="all">Todos</option>
                        {professionals.map((professional) => (
                          <option key={professional.id} value={professional.id}>
                            {professional.nome}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="secondary-button"
                      onClick={() => navigateTo("relatorios")}
                      type="button"
                    >
                      Abrir relatorios
                    </button>
                  </div>
                }
              >
                <DocumentSummaryCards
                  metrics={[
                    {
                      id: "radar-capacity",
                      label: "Capacidade total",
                      value: formatMinutesAsHours(
                        dashboardWeekCapacitySummary.totalMinutes
                      )
                    },
                    {
                      id: "radar-booked",
                      label: "Horas ocupadas",
                      value: formatMinutesAsHours(
                        dashboardWeekCapacitySummary.bookedMinutes
                      ),
                      helper: `${dashboardWeekCapacitySummary.bookingsCount} booking(s)`
                    },
                    {
                      id: "radar-free",
                      label: "Horas livres",
                      value: formatMinutesAsHours(
                        dashboardWeekCapacitySummary.freeMinutes
                      )
                    },
                    {
                      id: "radar-open",
                      label: "Em aberto",
                      value: dashboardWeekCapacitySummary.openBookings
                    }
                  ]}
                />
              </EntitySection>
              <div className="dashboard-secondary-grid">
                <EntitySection title="Capacidade por dia">
                  <div className="dashboard-kpi-list">
                    {dashboardWeekDaySummaries.map((summary) => (
                      <article
                        className="dashboard-kpi-item"
                        key={summary.date}
                      >
                        <div className="dashboard-kpi-main">
                          <strong>{formatAgendaDayLabel(summary.date)}</strong>
                          <span>{summary.bookingsCount} booking(s)</span>
                        </div>
                        <div className="dashboard-kpi-side">
                          <span>
                            {formatMinutesAsHours(summary.bookedMinutes)} /{" "}
                            {formatMinutesAsHours(summary.totalMinutes)}
                          </span>
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
                <EntitySection title="Carga por profissional">
                  <div className="dashboard-kpi-list">
                    {dashboardWeekProfessionalSummaries.map((summary) => (
                      <article
                        className="dashboard-kpi-item"
                        key={summary.professionalId}
                      >
                        <div className="dashboard-kpi-main">
                          <strong>
                            {resolveProfessionalName(
                              summary.professionalId,
                              professionals
                            )}
                          </strong>
                          <span>
                            {formatMinutesAsHours(summary.bookedMinutes)}{" "}
                            ocupadas
                          </span>
                        </div>
                        <div className="dashboard-kpi-side">
                          <span>
                            {formatMinutesAsHours(summary.totalMinutes)}
                          </span>
                          <small>
                            {summary.totalMinutes > 0
                              ? `${formatUtilization(summary.bookedMinutes, summary.totalMinutes)} ocupacao`
                              : "Sem escala"}
                          </small>
                        </div>
                      </article>
                    ))}
                  </div>
                </EntitySection>
              </div>
            </>
          )
        }
        aside={null}
      />
    );
  }

  function renderFinanceiroView(): JSX.Element {
    const financeTabs: ReadonlyArray<{
      readonly id: FinanceWorkspaceTab;
      readonly label: string;
    }> = [
      { id: "cashflow", label: "Fluxo de caixa" },
      { id: "banks", label: "Bancos" },
      { id: "balances", label: "Saldos iniciais" },
      { id: "revenues", label: "Receitas" },
      { id: "expenses", label: "Despesas" },
      { id: "movements", label: "Movimentos bancarios" },
      { id: "close", label: "Fechar caixa" }
    ];

    return (
      <DocumentViewLayout
        className="dashboard-document-view dashboard-document-view-financial"
        title="Financeiro"
        header={null}
        summary={null}
        tabs={
          <div
            aria-label="Abas do financeiro"
            className="dashboard-tabbar"
            role="tablist"
          >
            {financeTabs.map((tab) => (
              <button
                aria-selected={financeWorkspaceTab === tab.id}
                className={
                  financeWorkspaceTab === tab.id
                    ? "dashboard-tab-button is-active"
                    : "dashboard-tab-button"
                }
                key={tab.id}
                onClick={() => setFinanceWorkspaceTab(tab.id)}
                role="tab"
                type="button"
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        }
        items={
          financeWorkspaceTab === "cashflow"
            ? renderFinancialCashflowPanels({ showOpenFinanceButton: false })
            : renderFinanceRegistryPanels()
        }
        aside={null}
      />
    );
  }

  function renderDashboardViewLegacy(): JSX.Element {
    return renderDashboardView();
    /*
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
    */
  }

  function renderFinancialCashflowPanels(input: {
    readonly showOpenFinanceButton: boolean;
  }): JSX.Element {
    const cashflowFilters = financeBrowseFilters.cashflow;
    const visibleBankAccounts = (
      activeFinancialReadModel?.bankAccounts ?? []
    ).filter((entry) =>
      cashflowFilters.bankId === "all"
        ? true
        : entry.bankId === cashflowFilters.bankId
    );
    const matchesCashflowDate = (value: string): boolean => {
      const dateValue = value.slice(0, 10);
      if (cashflowFilters.dateFrom && dateValue < cashflowFilters.dateFrom) {
        return false;
      }
      if (cashflowFilters.dateTo && dateValue > cashflowFilters.dateTo) {
        return false;
      }
      return true;
    };
    const matchesCashflowQuery = (value: string): boolean =>
      cashflowFilters.query.trim().length === 0 ||
      value.toLowerCase().includes(cashflowFilters.query.trim().toLowerCase());
    const matchesCashflowOrigin = (movement: BankMovement): boolean => {
      if (cashflowFilters.origin === "all") {
        return true;
      }
      if (cashflowFilters.origin === "receita") {
        return movement.sourceType === "revenue_schedule";
      }
      if (cashflowFilters.origin === "despesa") {
        return movement.sourceType === "expense_schedule";
      }
      if (cashflowFilters.origin === "agenda") {
        return (
          movement.sourceType === "cash_entry" ||
          movement.sourceType === "booking"
        );
      }
      if (cashflowFilters.origin === "fechar_caixa") {
        return movement.sourceType === "cash_close";
      }
      return [
        "manual_receipt",
        "manual_payment",
        "manual_adjustment",
        "fee",
        "transfer"
      ].includes(movement.sourceType);
    };
    const resolveMovementBankLabel = (movement: BankMovement): string => {
      const originBank = banks.find(
        (bank) => bank.id === movement.bankIdOrigem
      );
      const destinationBank = banks.find(
        (bank) => bank.id === movement.bankIdDestino
      );
      const originLabel = originBank
        ? `${originBank.codigo} | ${originBank.nomeBanco}`
        : "";
      const destinationLabel = destinationBank
        ? `${destinationBank.codigo} | ${destinationBank.nomeBanco}`
        : "";
      if (originLabel && destinationLabel) {
        return `${originLabel} -> ${destinationLabel}`;
      }
      return originLabel || destinationLabel || "Operacao";
    };
    const visibleMovements = bankMovements
      .filter((movement) => {
        const matchesBank =
          cashflowFilters.bankId === "all" ||
          movement.bankIdOrigem === cashflowFilters.bankId ||
          movement.bankIdDestino === cashflowFilters.bankId;
        const matchesStatus =
          cashflowFilters.movementStatus === "all" ||
          movement.status === cashflowFilters.movementStatus;
        const matchesType =
          cashflowFilters.type === "all" ||
          movement.tipo === cashflowFilters.type;
        return (
          matchesBank &&
          matchesStatus &&
          matchesType &&
          matchesCashflowOrigin(movement) &&
          matchesCashflowDate(movement.dataMovimento) &&
          matchesCashflowQuery(
            `${movement.codigo} ${movement.historico} ${movement.beneficiarioNome ?? ""}`
          )
        );
      })
      .sort((left, right) =>
        right.dataMovimento.localeCompare(left.dataMovimento)
      );
    const pendingCashEntryIds = new Set(
      cashEntries
        .filter((entry) => entry.status === "open")
        .filter((entry) => {
          const launchedMovement = bankMovements.find(
            (movement) =>
              movement.sourceType === "cash_entry" &&
              movement.sourceId === entry.id &&
              movement.status === "lancado" &&
              !movement.reversedMovementId
          );
          return !launchedMovement;
        })
        .map((entry) => entry.id)
    );
    const visibleReceivables =
      cashflowFilters.movementStatus === "all" ||
      cashflowFilters.movementStatus === "previsto"
        ? [
            ...revenueSchedules
              .filter((entry) => entry.status === "aberta")
              .filter((entry) =>
                cashflowFilters.bankId === "all"
                  ? true
                  : entry.bankId === cashflowFilters.bankId
              )
              .filter((entry) => matchesCashflowDate(entry.dataVencimento))
              .filter((entry) =>
                matchesCashflowQuery(`${entry.codigo} ${entry.descricao}`)
              )
              .map((entry) => ({
                id: entry.id,
                codigo: entry.codigo,
                descricao: entry.descricao,
                valor: entry.valor,
                dataVencimento: entry.dataVencimento,
                origem: entry.origem,
                pessoa: undefined as string | undefined
              })),
            ...cashEntries
              .filter((entry) => pendingCashEntryIds.has(entry.id))
              .filter((entry) => matchesCashflowDate(entry.occurredAt))
              .filter((entry) =>
                matchesCashflowQuery(`${entry.description} ${entry.id}`)
              )
              .map((entry) => ({
                id: entry.id,
                codigo: entry.id.slice(0, 8).toUpperCase(),
                descricao: entry.description,
                valor: entry.amount,
                dataVencimento: entry.occurredAt.slice(0, 10),
                origem: "agenda",
                pessoa: resolveClientName(entry.clientId, clients)
              }))
          ].sort((left, right) =>
            left.dataVencimento.localeCompare(right.dataVencimento)
          )
        : [];
    const visiblePayables =
      cashflowFilters.movementStatus === "all" ||
      cashflowFilters.movementStatus === "previsto"
        ? expenseSchedules
            .filter((entry) => entry.status === "aberta")
            .filter((entry) =>
              cashflowFilters.bankId === "all"
                ? true
                : entry.bankId === cashflowFilters.bankId
            )
            .filter((entry) => matchesCashflowDate(entry.dataVencimento))
            .filter((entry) =>
              matchesCashflowQuery(
                `${entry.codigo} ${entry.descricao} ${entry.beneficiarioNome ?? ""}`
              )
            )
            .sort((left, right) =>
              left.dataVencimento.localeCompare(right.dataVencimento)
            )
        : [];
    const consolidatedBalance = visibleBankAccounts.reduce(
      (total, entry) => total + entry.saldoAtual,
      0
    );
    const receivableTotal = visibleReceivables.reduce(
      (total, entry) => total + entry.valor,
      0
    );
    const payableTotal = visiblePayables.reduce(
      (total, entry) => total + entry.valor,
      0
    );
    const projectedBalance =
      consolidatedBalance + receivableTotal - payableTotal;

    return (
      <div className="dashboard-secondary-grid">
        <div className="financial-cashflow-toolbar">
          <div className="dashboard-document-actions">
            <button
              className="secondary-button"
              onClick={openCashflowFilterModal}
              type="button"
            >
              Filtrar
            </button>
            <button
              className="secondary-button"
              onClick={() => openBankModal()}
              type="button"
            >
              Incluir banco
            </button>
            <button
              className="secondary-button"
              onClick={() => openBankBalanceModal()}
              type="button"
            >
              Saldo inicial
            </button>
            <button
              className="secondary-button"
              onClick={openReceiveModal}
              type="button"
            >
              Receber
            </button>
            <button
              className="secondary-button"
              onClick={openPayModal}
              type="button"
            >
              Pagar
            </button>
            <button
              className="secondary-button"
              onClick={openTransferModal}
              type="button"
            >
              Transferir
            </button>
            <button
              className="secondary-button"
              onClick={() => openCashCloseModal()}
              type="button"
            >
              Fechar caixa
            </button>
            {input.showOpenFinanceButton ? (
              <button
                className="primary-button"
                onClick={() => navigateTo("financeiro")}
                type="button"
              >
                Abrir financeiro
              </button>
            ) : null}
          </div>
        </div>

        <EntitySection
          className="financial-cashflow-summary"
          title="Fluxo de caixa"
        >
          <DocumentSummaryCards
            metrics={[
              {
                id: "saldo-consolidado",
                label: "Saldo consolidado",
                value: formatCurrency(consolidatedBalance)
              },
              {
                id: "total-receber",
                label: "Total a receber",
                value: formatCurrency(receivableTotal)
              },
              {
                id: "total-pagar",
                label: "Total a pagar",
                value: formatCurrency(payableTotal)
              },
              {
                id: "saldo-projetado",
                label: "Saldo projetado",
                value: formatCurrency(projectedBalance)
              }
            ]}
          />
        </EntitySection>

        <EntitySection title="Contas e saldos">
          <div className="dashboard-mini-grid">
            {visibleBankAccounts.map((entry) => (
              <button
                className="dashboard-mini-card dashboard-mini-card-button"
                key={entry.bankId}
                onClick={() => {
                  const bank = banks.find((item) => item.id === entry.bankId);
                  if (bank) {
                    openBankModal(bank);
                  }
                }}
                type="button"
              >
                <strong>{entry.codigo}</strong>
                <span>{entry.nomeBanco}</span>
                <span>
                  {entry.agencia}/{entry.conta}
                </span>
                <span>{formatCurrency(entry.saldoAtual)}</span>
              </button>
            ))}
          </div>
        </EntitySection>

        <EntitySection title="Proximos recebimentos">
          <div className="records-column">
            {visibleReceivables.length ? (
              visibleReceivables.map((entry) => (
                <article className="record-card" key={entry.id}>
                  <div className="record-card-header">
                    <div className="record-stack">
                      <strong>{entry.descricao}</strong>
                      <span>{entry.codigo}</span>
                    </div>
                    <strong>{formatCurrency(entry.valor)}</strong>
                  </div>
                  <div className="record-meta">
                    <span>
                      Vence em {formatDateShort(entry.dataVencimento)}
                    </span>
                    <span>{entry.origem}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhum recebimento no recorte.</p>
            )}
          </div>
        </EntitySection>

        <EntitySection title="Proximos pagamentos">
          <div className="records-column">
            {visiblePayables.length ? (
              visiblePayables.map((entry) => (
                <article className="record-card" key={entry.id}>
                  <div className="record-card-header">
                    <div className="record-stack">
                      <strong>{entry.descricao}</strong>
                      <span>{entry.codigo}</span>
                    </div>
                    <strong>{formatCurrency(entry.valor)}</strong>
                  </div>
                  <div className="record-meta">
                    <span>
                      Vence em {formatDateShort(entry.dataVencimento)}
                    </span>
                    <span>{entry.beneficiarioNome ?? "Sem beneficiario"}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhum pagamento no recorte.</p>
            )}
          </div>
        </EntitySection>

        <EntitySection title="Movimentos recentes">
          <div className="records-column">
            {visibleMovements.length ? (
              visibleMovements.slice(0, 8).map((entry) => (
                <article className="record-card" key={entry.id}>
                  <div className="record-card-header">
                    <div className="record-stack">
                      <strong>{entry.historico}</strong>
                      <span>{entry.codigo}</span>
                    </div>
                    <strong>{formatCurrency(entry.valor)}</strong>
                  </div>
                  <div className="record-meta">
                    <span>{formatDateTime(entry.dataMovimento)}</span>
                    <span>{resolveMovementBankLabel(entry)}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="empty-state">Nenhum movimento encontrado.</p>
            )}
          </div>
        </EntitySection>

        <EntitySection title="Fechamentos recentes">
          <div className="records-column">
            {(cashCloses ?? []).length ? (
              cashCloses
                .slice()
                .sort((left, right) => right.dateTo.localeCompare(left.dateTo))
                .slice(0, 6)
                .map((entry) => {
                  const bank = banks.find((item) => item.id === entry.bankId);
                  return (
                    <article className="record-card" key={entry.id}>
                      <div className="record-card-header">
                        <div className="record-stack">
                          <strong>{entry.codigo}</strong>
                          <span>
                            {bank?.nomeBanco ?? "Banco"} {bank?.agencia}/
                            {bank?.conta}
                          </span>
                        </div>
                        <strong>{formatCurrency(entry.saldoFechado)}</strong>
                      </div>
                      <div className="record-meta">
                        <span>
                          {formatDateShort(entry.dateFrom)} ate{" "}
                          {formatDateShort(entry.dateTo)}
                        </span>
                        <span>{entry.status}</span>
                      </div>
                    </article>
                  );
                })
            ) : (
              <p className="empty-state">Nenhum fechamento registrado.</p>
            )}
          </div>
        </EntitySection>
      </div>
    );
  }

  function renderFinanceBrowseTable(
    columns: readonly {
      readonly key: string;
      readonly label: string;
      readonly className?: string;
    }[],
    rows: readonly {
      readonly id: string;
      readonly selected?: boolean;
      readonly cells: readonly {
        readonly key: string;
        readonly value: JSX.Element | string;
        readonly className?: string;
      }[];
      readonly onClick: () => void;
    }[],
    emptyMessage: string
  ): JSX.Element {
    const browseStyle = {
      "--finance-browse-columns": String(columns.length)
    } as CSSProperties;

    return (
      <div className="finance-browse-shell" style={browseStyle}>
        <div className="finance-browse-row finance-browse-header" role="row">
          {columns.map((column) => (
            <span
              className={column.className ?? "finance-browse-cell"}
              key={column.key}
              role="columnheader"
            >
              {column.label}
            </span>
          ))}
        </div>
        <div className="finance-browse-body">
          {rows.length ? (
            rows.map((row) => (
              <button
                className={
                  row.selected
                    ? "finance-browse-row is-selected"
                    : "finance-browse-row"
                }
                key={row.id}
                onClick={row.onClick}
                type="button"
              >
                {row.cells.map((cell) => (
                  <span
                    className={cell.className ?? "finance-browse-cell"}
                    key={cell.key}
                  >
                    {cell.value}
                  </span>
                ))}
              </button>
            ))
          ) : (
            <div className="empty-state finance-browse-empty">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderCashCloseComposer(): JSX.Element | null {
    if (!isCashCloseComposerOpen) {
      return null;
    }

    const pendingPreviewItems = cashClosePreview?.pending ?? [];
    const settledPreviewItems = cashClosePreview?.settled ?? [];

    return (
      <EntitySection
        className="finance-cash-close-workspace"
        title="Conferencia do caixa"
      >
        <form
          className="stack-form"
          onSubmit={(event) => void handleCreateCashClose(event)}
        >
          <div className="finance-toolbar-row">
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Banco</span>
                <select
                  required
                  value={cashCloseForm.bankId}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      bankId: event.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco} {bank.agencia}/
                      {bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-select">
                <span>Data de</span>
                <input
                  required
                  type="date"
                  value={cashCloseForm.dateFrom}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      dateFrom: event.target.value
                    }))
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Data ate</span>
                <input
                  required
                  type="date"
                  value={cashCloseForm.dateTo}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      dateTo: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <div className="finance-toolbar-actions">
              <button
                className="secondary-button"
                onClick={() =>
                  setCashClosePreviewRequestKey((current) => current + 1)
                }
                type="button"
              >
                Atualizar conferencia
              </button>
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={isBusy || !selectedCashClosePreviewKeys.length}
                type="submit"
              >
                Fechar caixa
              </button>
            </div>
          </div>

          {isLoadingCashClosePreview ? (
            <div className="dashboard-mini-card">
              <strong>Carregando conferencia</strong>
              <span>
                Aguarde enquanto os pendentes e os itens ja baixados sao
                consolidados.
              </span>
            </div>
          ) : (
            <div className="cash-close-preview-grid is-expanded">
              <section className="cash-close-preview-panel">
                <div className="cash-close-preview-header">
                  <div>
                    <strong>Pendentes de baixa</strong>
                    <span>
                      {selectedCashClosePreviewKeys.length} marcado(s)
                    </span>
                  </div>
                </div>
                {pendingPreviewItems.length ? (
                  <div className="cash-close-preview-list">
                    {pendingPreviewItems.map((entry) => {
                      const key = buildCashClosePreviewSelectionKey(
                        entry.sourceType,
                        entry.sourceId
                      );
                      const isChecked =
                        selectedCashClosePreviewKeys.includes(key);
                      return (
                        <label
                          className="cash-close-preview-item is-pending"
                          key={key}
                        >
                          <input
                            checked={isChecked}
                            type="checkbox"
                            onChange={() =>
                              setSelectedCashClosePreviewKeys((current) =>
                                current.includes(key)
                                  ? current.filter((item) => item !== key)
                                  : [...current, key]
                              )
                            }
                          />
                          <div className="cash-close-preview-copy">
                            <strong>{entry.descricao}</strong>
                            <span>
                              {entry.tipo === "entrada" ? "Receita" : "Despesa"}{" "}
                              · {formatDateShort(entry.dataReferencia)}
                            </span>
                          </div>
                          <span className="cash-close-preview-value">
                            {formatCurrency(entry.valor)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="empty-state">
                    Nenhum item pendente para este banco e periodo.
                  </p>
                )}
              </section>

              <section className="cash-close-preview-panel">
                <div className="cash-close-preview-header">
                  <div>
                    <strong>Ja baixados no periodo</strong>
                    <span>{settledPreviewItems.length} item(ns)</span>
                  </div>
                </div>
                {settledPreviewItems.length ? (
                  <div className="cash-close-preview-list">
                    {settledPreviewItems.map((entry) => (
                      <div
                        className="cash-close-preview-item is-settled"
                        key={`${entry.sourceType}:${entry.sourceId}:${entry.movementId ?? "settled"}`}
                      >
                        <div className="cash-close-preview-copy">
                          <strong>{entry.descricao}</strong>
                          <span>
                            {entry.tipo === "entrada" ? "Recebido" : "Pago"} ·{" "}
                            {formatDateShort(entry.dataReferencia)}
                          </span>
                        </div>
                        <span className="cash-close-preview-value">
                          {formatCurrency(entry.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state">
                    Nenhum item baixado neste periodo.
                  </p>
                )}
              </section>
            </div>
          )}
        </form>
      </EntitySection>
    );
  }

  function renderFinanceRegistryPanels(): JSX.Element {
    const bankQuery = financeBrowseFilters.banks.query.trim().toLowerCase();
    const filteredBanks = banks.filter((bank) => {
      const matchesQuery =
        bankQuery.length === 0 ||
        `${bank.codigo} ${bank.nomeBanco} ${bank.bacenCode} ${bank.agencia} ${bank.conta}`
          .toLowerCase()
          .includes(bankQuery);
      const matchesStatus =
        financeBrowseFilters.banks.status === "all" ||
        (financeBrowseFilters.banks.status === "active"
          ? bank.ativo
          : !bank.ativo);
      return matchesQuery && matchesStatus;
    });
    const filteredBalances = bankBalances.filter((balance) => {
      const bank = banks.find((entry) => entry.id === balance.bankId);
      const matchesBank =
        financeBrowseFilters.balances.bankId === "all" ||
        balance.bankId === financeBrowseFilters.balances.bankId;
      const query = financeBrowseFilters.balances.query.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        `${balance.codigo} ${bank?.nomeBanco ?? ""} ${bank?.agencia ?? ""} ${bank?.conta ?? ""}`
          .toLowerCase()
          .includes(query);
      return matchesBank && matchesQuery;
    });
    const filteredRevenues = revenueSchedules.filter((entry) => {
      const query = financeBrowseFilters.revenues.query.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        `${entry.codigo} ${entry.descricao}`.toLowerCase().includes(query);
      const matchesBank =
        financeBrowseFilters.revenues.bankId === "all" ||
        entry.bankId === financeBrowseFilters.revenues.bankId;
      const matchesStatus =
        financeBrowseFilters.revenues.status === "all" ||
        entry.status === financeBrowseFilters.revenues.status;
      const matchesFrom =
        !financeBrowseFilters.revenues.dateFrom ||
        entry.dataVencimento >= financeBrowseFilters.revenues.dateFrom;
      const matchesTo =
        !financeBrowseFilters.revenues.dateTo ||
        entry.dataVencimento <= financeBrowseFilters.revenues.dateTo;
      return (
        matchesQuery && matchesBank && matchesStatus && matchesFrom && matchesTo
      );
    });
    const filteredExpenses = expenseSchedules.filter((entry) => {
      const query = financeBrowseFilters.expenses.query.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        `${entry.codigo} ${entry.descricao} ${entry.beneficiarioNome ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesBank =
        financeBrowseFilters.expenses.bankId === "all" ||
        entry.bankId === financeBrowseFilters.expenses.bankId;
      const matchesStatus =
        financeBrowseFilters.expenses.status === "all" ||
        entry.status === financeBrowseFilters.expenses.status;
      const matchesFrom =
        !financeBrowseFilters.expenses.dateFrom ||
        entry.dataVencimento >= financeBrowseFilters.expenses.dateFrom;
      const matchesTo =
        !financeBrowseFilters.expenses.dateTo ||
        entry.dataVencimento <= financeBrowseFilters.expenses.dateTo;
      return (
        matchesQuery && matchesBank && matchesStatus && matchesFrom && matchesTo
      );
    });
    const filteredMovements = bankMovements.filter((entry) => {
      const query = financeBrowseFilters.movements.query.trim().toLowerCase();
      const matchesQuery =
        query.length === 0 ||
        `${entry.codigo} ${entry.historico} ${entry.beneficiarioNome ?? ""}`
          .toLowerCase()
          .includes(query);
      const matchesBank =
        financeBrowseFilters.movements.bankId === "all" ||
        entry.bankIdOrigem === financeBrowseFilters.movements.bankId ||
        entry.bankIdDestino === financeBrowseFilters.movements.bankId;
      const matchesStatus =
        financeBrowseFilters.movements.status === "all" ||
        entry.status === financeBrowseFilters.movements.status;
      const movementDate = entry.dataMovimento.slice(0, 10);
      const matchesFrom =
        !financeBrowseFilters.movements.dateFrom ||
        movementDate >= financeBrowseFilters.movements.dateFrom;
      const matchesTo =
        !financeBrowseFilters.movements.dateTo ||
        movementDate <= financeBrowseFilters.movements.dateTo;
      return (
        matchesQuery && matchesBank && matchesStatus && matchesFrom && matchesTo
      );
    });
    const filteredCashCloses = cashCloses.filter((entry) => {
      const matchesBank =
        financeBrowseFilters.close.bankId === "all" ||
        entry.bankId === financeBrowseFilters.close.bankId;
      const matchesStatus =
        financeBrowseFilters.close.status === "all" ||
        entry.status === financeBrowseFilters.close.status;
      const matchesFrom = entry.dateFrom >= financeBrowseFilters.close.dateFrom;
      const matchesTo = entry.dateTo <= financeBrowseFilters.close.dateTo;
      return matchesBank && matchesStatus && matchesFrom && matchesTo;
    });

    if (financeWorkspaceTab === "banks") {
      return (
        <div className="finance-document-stack">
          <div className="finance-toolbar-row">
            <div className="finance-toolbar-actions">
              <button
                className="primary-button"
                onClick={() => openBankModal(undefined, "create")}
                type="button"
              >
                Incluir
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBank}
                onClick={() =>
                  selectedBank ? openBankModal(selectedBank, "view") : undefined
                }
                type="button"
              >
                Visualizar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBank}
                onClick={() =>
                  selectedBank ? openBankModal(selectedBank, "edit") : undefined
                }
                type="button"
              >
                Alterar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBank}
                onClick={() =>
                  selectedBank
                    ? setDeleteTarget({
                        kind: "bank",
                        id: selectedBank.id,
                        label: `${selectedBank.codigo} | ${selectedBank.nomeBanco}`
                      })
                    : undefined
                }
                type="button"
              >
                Excluir
              </button>
            </div>
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Buscar</span>
                <input
                  value={financeBrowseFilters.banks.query}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("banks", {
                      query: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Situacao</span>
                <select
                  value={financeBrowseFilters.banks.status}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("banks", {
                      status: event.target
                        .value as FinanceBrowseFiltersState["banks"]["status"]
                    })
                  }
                >
                  <option value="all">Todos</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                </select>
              </label>
            </div>
          </div>
          <EntitySection title="Bancos">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "nome", label: "Banco" },
                { key: "bacen", label: "BACEN" },
                { key: "conta", label: "Agencia / Conta" },
                { key: "situacao", label: "Situacao" }
              ],
              filteredBanks.map((bank) => ({
                id: bank.id,
                selected: bank.id === selectedBankId,
                onClick: () => setSelectedBankId(bank.id),
                cells: [
                  { key: "codigo", value: bank.codigo },
                  { key: "nome", value: bank.nomeBanco },
                  { key: "bacen", value: bank.bacenCode },
                  { key: "conta", value: `${bank.agencia}/${bank.conta}` },
                  { key: "situacao", value: bank.ativo ? "Ativo" : "Inativo" }
                ]
              })),
              "Nenhum banco encontrado."
            )}
          </EntitySection>
        </div>
      );
    }

    if (financeWorkspaceTab === "balances") {
      return (
        <div className="finance-document-stack">
          <div className="finance-toolbar-row">
            <div className="finance-toolbar-actions">
              <button
                className="primary-button"
                onClick={() => openBankBalanceModal(undefined, "create")}
                type="button"
              >
                Incluir
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBalance}
                onClick={() =>
                  selectedBalance
                    ? openBankBalanceModal(selectedBalance, "view")
                    : undefined
                }
                type="button"
              >
                Visualizar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBalance}
                onClick={() =>
                  selectedBalance
                    ? openBankBalanceModal(selectedBalance, "edit")
                    : undefined
                }
                type="button"
              >
                Alterar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedBalance}
                onClick={() =>
                  selectedBalance
                    ? setDeleteTarget({
                        kind: "balance",
                        id: selectedBalance.id,
                        label: `${selectedBalance.codigo} | ${formatCurrency(selectedBalance.saldoInicial)}`
                      })
                    : undefined
                }
                type="button"
              >
                Excluir
              </button>
            </div>
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Buscar</span>
                <input
                  value={financeBrowseFilters.balances.query}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("balances", {
                      query: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Banco</span>
                <select
                  value={financeBrowseFilters.balances.bankId}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("balances", {
                      bankId: event.target.value
                    })
                  }
                >
                  <option value="all">Todos</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <EntitySection title="Saldos iniciais">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "banco", label: "Banco" },
                { key: "saldoInicial", label: "Saldo inicial" },
                { key: "saldoAtual", label: "Saldo atual" },
                { key: "data", label: "Data" }
              ],
              filteredBalances.map((balance) => {
                const bank = banks.find((item) => item.id === balance.bankId);
                return {
                  id: balance.id,
                  selected: balance.id === selectedBalanceId,
                  onClick: () => setSelectedBalanceId(balance.id),
                  cells: [
                    { key: "codigo", value: balance.codigo },
                    {
                      key: "banco",
                      value: `${bank?.nomeBanco ?? "Banco"} ${bank?.agencia ?? ""}/${bank?.conta ?? ""}`
                    },
                    {
                      key: "saldoInicial",
                      value: formatCurrency(balance.saldoInicial)
                    },
                    {
                      key: "saldoAtual",
                      value: formatCurrency(balance.saldoAtual)
                    },
                    {
                      key: "data",
                      value: formatDateShort(balance.dataSaldoInicial)
                    }
                  ]
                };
              }),
              "Nenhum saldo inicial encontrado."
            )}
          </EntitySection>
        </div>
      );
    }

    if (financeWorkspaceTab === "revenues") {
      return (
        <div className="finance-document-stack">
          <div className="finance-toolbar-row">
            <div className="finance-toolbar-actions">
              <button
                className="primary-button"
                onClick={() => openRevenueModal(undefined, "create")}
                type="button"
              >
                Incluir
              </button>
              <button
                className="secondary-button"
                disabled={!selectedRevenue}
                onClick={() =>
                  selectedRevenue
                    ? openRevenueModal(selectedRevenue, "view")
                    : undefined
                }
                type="button"
              >
                Visualizar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedRevenue}
                onClick={() =>
                  selectedRevenue
                    ? openRevenueModal(selectedRevenue, "edit")
                    : undefined
                }
                type="button"
              >
                Alterar
              </button>
              <button
                className="secondary-button"
                disabled={
                  !selectedRevenue || selectedRevenue.status !== "aberta"
                }
                onClick={() => {
                  if (!selectedRevenue) return;
                  setReceiveTarget({ revenueId: selectedRevenue.id });
                  setAgendaSettlementTarget(null);
                  setReceiveMovementForm({
                    bankIdDestino: selectedRevenue.bankId ?? banks[0]?.id ?? "",
                    valor: String(selectedRevenue.valor),
                    historico: selectedRevenue.descricao,
                    dataMovimento: new Date().toISOString().slice(0, 16)
                  });
                  setFinanceModalMode("create");
                  setFinanceModal("receive");
                }}
                type="button"
              >
                Receber
              </button>
              <button
                className="secondary-button"
                disabled={!selectedRevenue?.baixaMovementId}
                onClick={() => {
                  if (!selectedRevenue?.baixaMovementId) return;
                  setReverseTarget({
                    kind: "movement",
                    movementId: selectedRevenue.baixaMovementId,
                    label: `${selectedRevenue.codigo} | ${selectedRevenue.descricao}`
                  });
                }}
                type="button"
              >
                Estornar
              </button>
              <button
                className="secondary-button"
                disabled={
                  !selectedRevenue || selectedRevenue.status !== "aberta"
                }
                onClick={() =>
                  selectedRevenue
                    ? setDeleteTarget({
                        kind: "revenue",
                        id: selectedRevenue.id,
                        label: `${selectedRevenue.codigo} | ${selectedRevenue.descricao}`
                      })
                    : undefined
                }
                type="button"
              >
                Excluir
              </button>
            </div>
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Buscar</span>
                <input
                  value={financeBrowseFilters.revenues.query}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("revenues", {
                      query: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Banco</span>
                <select
                  value={financeBrowseFilters.revenues.bankId}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("revenues", {
                      bankId: event.target.value
                    })
                  }
                >
                  <option value="all">Todos</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-select">
                <span>Situacao</span>
                <select
                  value={financeBrowseFilters.revenues.status}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("revenues", {
                      status: event.target
                        .value as FinanceBrowseFiltersState["revenues"]["status"]
                    })
                  }
                >
                  <option value="all">Todas</option>
                  <option value="aberta">Aberta</option>
                  <option value="recebida">Recebida</option>
                  <option value="estornada">Estornada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
              <label className="dashboard-select">
                <span>Data de</span>
                <input
                  type="date"
                  value={financeBrowseFilters.revenues.dateFrom}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("revenues", {
                      dateFrom: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Data ate</span>
                <input
                  type="date"
                  value={financeBrowseFilters.revenues.dateTo}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("revenues", {
                      dateTo: event.target.value
                    })
                  }
                />
              </label>
            </div>
          </div>
          <EntitySection title="Receitas">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "descricao", label: "Historico" },
                { key: "valor", label: "Valor" },
                { key: "vencimento", label: "Vencimento" },
                { key: "parcelas", label: "Parcelas" },
                { key: "banco", label: "Banco" },
                { key: "situacao", label: "Situacao" }
              ],
              filteredRevenues.map((entry) => ({
                id: entry.id,
                selected: entry.id === selectedRevenueId,
                onClick: () => setSelectedRevenueId(entry.id),
                cells: [
                  { key: "codigo", value: entry.codigo },
                  { key: "descricao", value: entry.descricao },
                  { key: "valor", value: formatCurrency(entry.valor) },
                  {
                    key: "vencimento",
                    value: formatDateShort(entry.dataVencimento)
                  },
                  {
                    key: "parcelas",
                    value: `${entry.ocorrenciaIndice ?? 1}/${entry.ocorrenciaTotal ?? 1}`
                  },
                  {
                    key: "banco",
                    value:
                      banks.find((bank) => bank.id === entry.bankId)?.codigo ??
                      "-"
                  },
                  { key: "situacao", value: entry.status }
                ]
              })),
              "Nenhuma receita encontrada."
            )}
          </EntitySection>
        </div>
      );
    }

    if (financeWorkspaceTab === "expenses") {
      return (
        <div className="finance-document-stack">
          <div className="finance-toolbar-row">
            <div className="finance-toolbar-actions">
              <button
                className="primary-button"
                onClick={() => openExpenseModal(undefined, "create")}
                type="button"
              >
                Incluir
              </button>
              <button
                className="secondary-button"
                disabled={!selectedExpense}
                onClick={() =>
                  selectedExpense
                    ? openExpenseModal(selectedExpense, "view")
                    : undefined
                }
                type="button"
              >
                Visualizar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedExpense}
                onClick={() =>
                  selectedExpense
                    ? openExpenseModal(selectedExpense, "edit")
                    : undefined
                }
                type="button"
              >
                Alterar
              </button>
              <button
                className="secondary-button"
                disabled={
                  !selectedExpense || selectedExpense.status !== "aberta"
                }
                onClick={() => {
                  if (!selectedExpense) return;
                  setPayTarget({ expenseId: selectedExpense.id });
                  setPayMovementForm({
                    bankIdOrigem: selectedExpense.bankId ?? banks[0]?.id ?? "",
                    valor: String(selectedExpense.valor),
                    historico: selectedExpense.descricao,
                    dataMovimento: new Date().toISOString().slice(0, 16),
                    beneficiarioNome: selectedExpense.beneficiarioNome ?? ""
                  });
                  setFinanceModalMode("create");
                  setFinanceModal("pay");
                }}
                type="button"
              >
                Pagar
              </button>
              <button
                className="secondary-button"
                disabled={!selectedExpense?.baixaMovementId}
                onClick={() => {
                  if (!selectedExpense?.baixaMovementId) return;
                  setReverseTarget({
                    kind: "movement",
                    movementId: selectedExpense.baixaMovementId,
                    label: `${selectedExpense.codigo} | ${selectedExpense.descricao}`
                  });
                }}
                type="button"
              >
                Estornar
              </button>
              <button
                className="secondary-button"
                disabled={
                  !selectedExpense || selectedExpense.status !== "aberta"
                }
                onClick={() =>
                  selectedExpense
                    ? setDeleteTarget({
                        kind: "expense",
                        id: selectedExpense.id,
                        label: `${selectedExpense.codigo} | ${selectedExpense.descricao}`
                      })
                    : undefined
                }
                type="button"
              >
                Excluir
              </button>
            </div>
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Buscar</span>
                <input
                  value={financeBrowseFilters.expenses.query}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("expenses", {
                      query: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Banco</span>
                <select
                  value={financeBrowseFilters.expenses.bankId}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("expenses", {
                      bankId: event.target.value
                    })
                  }
                >
                  <option value="all">Todos</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-select">
                <span>Situacao</span>
                <select
                  value={financeBrowseFilters.expenses.status}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("expenses", {
                      status: event.target
                        .value as FinanceBrowseFiltersState["expenses"]["status"]
                    })
                  }
                >
                  <option value="all">Todas</option>
                  <option value="aberta">Aberta</option>
                  <option value="paga">Paga</option>
                  <option value="estornada">Estornada</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </label>
              <label className="dashboard-select">
                <span>Data de</span>
                <input
                  type="date"
                  value={financeBrowseFilters.expenses.dateFrom}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("expenses", {
                      dateFrom: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Data ate</span>
                <input
                  type="date"
                  value={financeBrowseFilters.expenses.dateTo}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("expenses", {
                      dateTo: event.target.value
                    })
                  }
                />
              </label>
            </div>
          </div>
          <EntitySection title="Despesas">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "descricao", label: "Historico" },
                { key: "valor", label: "Valor" },
                { key: "vencimento", label: "Vencimento" },
                { key: "parcelas", label: "Parcelas" },
                { key: "banco", label: "Banco" },
                { key: "situacao", label: "Situacao" }
              ],
              filteredExpenses.map((entry) => ({
                id: entry.id,
                selected: entry.id === selectedExpenseId,
                onClick: () => setSelectedExpenseId(entry.id),
                cells: [
                  { key: "codigo", value: entry.codigo },
                  { key: "descricao", value: entry.descricao },
                  { key: "valor", value: formatCurrency(entry.valor) },
                  {
                    key: "vencimento",
                    value: formatDateShort(entry.dataVencimento)
                  },
                  {
                    key: "parcelas",
                    value: `${entry.ocorrenciaIndice ?? 1}/${entry.ocorrenciaTotal ?? 1}`
                  },
                  {
                    key: "banco",
                    value:
                      banks.find((bank) => bank.id === entry.bankId)?.codigo ??
                      "-"
                  },
                  { key: "situacao", value: entry.status }
                ]
              })),
              "Nenhuma despesa encontrada."
            )}
          </EntitySection>
        </div>
      );
    }

    if (financeWorkspaceTab === "close") {
      return (
        <div className="finance-document-stack">
          <div className="finance-toolbar-row">
            <div className="finance-toolbar-actions">
              <button
                className="primary-button"
                onClick={() => openCashCloseModal()}
                type="button"
              >
                Fechar caixa
              </button>
              <button
                className="secondary-button"
                disabled={!selectedCashClose}
                onClick={() =>
                  selectedCashClose
                    ? openCashCloseModal(selectedCashClose, "view")
                    : undefined
                }
                type="button"
              >
                Visualizar
              </button>
            </div>
            <div className="finance-filter-row">
              <label className="dashboard-select">
                <span>Banco</span>
                <select
                  value={financeBrowseFilters.close.bankId}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("close", {
                      bankId: event.target.value
                    })
                  }
                >
                  <option value="all">Todos</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dashboard-select">
                <span>Data de</span>
                <input
                  type="date"
                  value={financeBrowseFilters.close.dateFrom}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("close", {
                      dateFrom: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Data ate</span>
                <input
                  type="date"
                  value={financeBrowseFilters.close.dateTo}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("close", {
                      dateTo: event.target.value
                    })
                  }
                />
              </label>
              <label className="dashboard-select">
                <span>Situacao</span>
                <select
                  value={financeBrowseFilters.close.status}
                  onChange={(event) =>
                    updateFinanceBrowseFilter("close", {
                      status: event.target
                        .value as FinanceBrowseFiltersState["close"]["status"]
                    })
                  }
                >
                  <option value="all">Todas</option>
                  <option value="fechado">Fechado</option>
                  <option value="estornado">Estornado</option>
                </select>
              </label>
            </div>
          </div>
          {renderCashCloseComposer()}
          <EntitySection title="Fechamentos do caixa">
            {renderFinanceBrowseTable(
              [
                { key: "codigo", label: "Codigo" },
                { key: "banco", label: "Banco" },
                { key: "periodo", label: "Periodo" },
                { key: "recebido", label: "Recebido" },
                { key: "pago", label: "Pago" },
                { key: "saldo", label: "Saldo" },
                { key: "situacao", label: "Situacao" }
              ],
              filteredCashCloses.map((entry) => {
                const bank = banks.find((item) => item.id === entry.bankId);
                return {
                  id: entry.id,
                  selected: entry.id === selectedCashCloseId,
                  onClick: () => setSelectedCashCloseId(entry.id),
                  cells: [
                    { key: "codigo", value: entry.codigo },
                    {
                      key: "banco",
                      value: bank
                        ? `${bank.codigo} | ${bank.nomeBanco}`
                        : "Banco nao encontrado"
                    },
                    {
                      key: "periodo",
                      value: `${formatDateShort(entry.dateFrom)} ate ${formatDateShort(entry.dateTo)}`
                    },
                    {
                      key: "recebido",
                      value: formatCurrency(entry.totalEntradas)
                    },
                    { key: "pago", value: formatCurrency(entry.totalSaidas) },
                    { key: "saldo", value: formatCurrency(entry.saldoFechado) },
                    { key: "situacao", value: entry.status }
                  ]
                };
              }),
              "Nenhum fechamento encontrado."
            )}
          </EntitySection>
        </div>
      );
    }

    return (
      <div className="finance-document-stack">
        <div className="finance-toolbar-row">
          <div className="finance-toolbar-actions">
            <button
              className="primary-button"
              onClick={() => openManualMovementModal(undefined, "create")}
              type="button"
            >
              Incluir
            </button>
            <button
              className="secondary-button"
              disabled={!selectedMovement}
              onClick={() =>
                selectedMovement
                  ? openManualMovementModal(selectedMovement, "view")
                  : undefined
              }
              type="button"
            >
              Visualizar
            </button>
            <button
              className="secondary-button"
              disabled={!selectedMovement}
              onClick={() =>
                selectedMovement
                  ? openManualMovementModal(selectedMovement, "edit")
                  : undefined
              }
              type="button"
            >
              Alterar
            </button>
            <button
              className="secondary-button"
              disabled={
                !selectedMovement ||
                selectedMovement.status === "estornado" ||
                Boolean(selectedMovement.reversedMovementId)
              }
              onClick={() =>
                selectedMovement
                  ? setReverseTarget({
                      kind: "movement",
                      movementId: selectedMovement.id,
                      label: `${selectedMovement.codigo} | ${selectedMovement.historico}`
                    })
                  : undefined
              }
              type="button"
            >
              Estornar
            </button>
          </div>
          <div className="finance-filter-row">
            <label className="dashboard-select">
              <span>Buscar</span>
              <input
                value={financeBrowseFilters.movements.query}
                onChange={(event) =>
                  updateFinanceBrowseFilter("movements", {
                    query: event.target.value
                  })
                }
              />
            </label>
            <label className="dashboard-select">
              <span>Banco</span>
              <select
                value={financeBrowseFilters.movements.bankId}
                onChange={(event) =>
                  updateFinanceBrowseFilter("movements", {
                    bankId: event.target.value
                  })
                }
              >
                <option value="all">Todos</option>
                {banks.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.codigo} | {bank.nomeBanco}
                  </option>
                ))}
              </select>
            </label>
            <label className="dashboard-select">
              <span>Situacao</span>
              <select
                value={financeBrowseFilters.movements.status}
                onChange={(event) =>
                  updateFinanceBrowseFilter("movements", {
                    status: event.target
                      .value as FinanceBrowseFiltersState["movements"]["status"]
                  })
                }
              >
                <option value="all">Todas</option>
                <option value="previsto">Previsto</option>
                <option value="lancado">Lancado</option>
                <option value="estornado">Estornado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </label>
            <label className="dashboard-select">
              <span>Data de</span>
              <input
                type="date"
                value={financeBrowseFilters.movements.dateFrom}
                onChange={(event) =>
                  updateFinanceBrowseFilter("movements", {
                    dateFrom: event.target.value
                  })
                }
              />
            </label>
            <label className="dashboard-select">
              <span>Data ate</span>
              <input
                type="date"
                value={financeBrowseFilters.movements.dateTo}
                onChange={(event) =>
                  updateFinanceBrowseFilter("movements", {
                    dateTo: event.target.value
                  })
                }
              />
            </label>
          </div>
        </div>
        <EntitySection title="Movimentos bancarios">
          {renderFinanceBrowseTable(
            [
              { key: "codigo", label: "Codigo" },
              { key: "data", label: "Data" },
              { key: "tipo", label: "Tipo" },
              { key: "historico", label: "Historico" },
              { key: "origem", label: "Banco origem" },
              { key: "destino", label: "Banco destino" },
              { key: "valor", label: "Valor" },
              { key: "situacao", label: "Situacao" },
              { key: "source", label: "Origem" }
            ],
            filteredMovements.map((entry) => {
              const originBank = banks.find(
                (item) => item.id === entry.bankIdOrigem
              );
              const destinationBank = banks.find(
                (item) => item.id === entry.bankIdDestino
              );

              return {
                id: entry.id,
                selected: entry.id === selectedMovementId,
                onClick: () => setSelectedMovementId(entry.id),
                cells: [
                  { key: "codigo", value: entry.codigo },
                  { key: "data", value: formatDateTime(entry.dataMovimento) },
                  { key: "tipo", value: formatBankMovementType(entry.tipo) },
                  { key: "historico", value: entry.historico },
                  {
                    key: "origem",
                    value: originBank
                      ? `${originBank.codigo} | ${originBank.nomeBanco}`
                      : "-"
                  },
                  {
                    key: "destino",
                    value: destinationBank
                      ? `${destinationBank.codigo} | ${destinationBank.nomeBanco}`
                      : "-"
                  },
                  { key: "valor", value: formatCurrency(entry.valor) },
                  {
                    key: "situacao",
                    value: formatBankMovementStatus(entry.status)
                  },
                  {
                    key: "source",
                    value: formatBankMovementSource(entry.sourceType)
                  }
                ]
              };
            }),
            "Nenhum movimento encontrado."
          )}
        </EntitySection>
      </div>
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
        <aside
          className="shell-context-sheet"
          role="dialog"
          aria-label="Contexto do tenant"
        >
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
                <span>
                  {tenant?.slug ? `/${tenant.slug}` : "Nao publicada"}
                </span>
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
              <a
                className="secondary-button button-link"
                href={publicBookingUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir booking
              </a>
            ) : null}
            <button
              className="secondary-button"
              onClick={() => navigateTo("configuracoes")}
              type="button"
            >
              Abrir configuracoes
            </button>
            <button
              className="secondary-button"
              disabled={isBusy}
              onClick={handleRefreshClick}
              type="button"
            >
              Atualizar painel
            </button>
            <button
              className="secondary-button"
              onClick={() => setSessionToken("")}
              type="button"
            >
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
        <aside
          className="shell-context-sheet shell-pulse-sheet"
          role="dialog"
          aria-label="Painel rapido do shell"
        >
          <div className="shell-context-sheet-header">
            <div>
              <p className="eyebrow">Painel rapido</p>
              <h2>Atenções e atalhos</h2>
              <p className="description">
                Leitura curta do que pede ação agora, sem abrir outra tela só
                para descobrir prioridade.
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
                tone:
                  clientPortfolioSummary.inactiveCount > 0
                    ? "warning"
                    : undefined
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
                <small>
                  {resolveClientReturnWindowLabel(clientReturnWindow)}
                </small>
              </div>
            </article>
          </div>

          <div className="shell-context-sheet-actions shell-pulse-actions">
            <button
              className="secondary-button"
              onClick={() => navigateTo("operacional")}
              type="button"
            >
              Abrir operacao
            </button>
            <button
              className="secondary-button"
              onClick={() => navigateTo("agenda")}
              type="button"
            >
              Abrir agenda
            </button>
            <button
              className="secondary-button"
              onClick={openClientsDirectoryFromShell}
              type="button"
            >
              Abrir clientes
            </button>
            <button
              className="secondary-button"
              onClick={() => navigateTo("relatorios")}
              type="button"
            >
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
        available: Boolean(
          counterBookingSelectedService && counterBookingSelectedProfessional
        )
      },
      {
        id: "client" as CounterBookingStep,
        step: "04",
        label: "Cliente",
        complete: Boolean(
          counterBookingForm.nome &&
          counterBookingForm.telefone &&
          counterBookingForm.email
        ),
        available: Boolean(
          counterBookingSelectedService &&
          counterBookingSelectedProfessional &&
          counterBookingSelectedSlot
        )
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
          <section
            className="counter-booking-modal"
            role="dialog"
            aria-label="Novo agendamento"
          >
            <div className="counter-booking-modal-header">
              <div>
                <p className="eyebrow">Novo agendamento</p>
                <h2>Reserva criada no balcão</h2>
              </div>
              <button
                className="admin-icon-button"
                onClick={closeCounterBookingModal}
                type="button"
              >
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
                    helper: formatBookingStatus(
                      counterBookingReceipt.booking.status
                    ),
                    tone: "success"
                  },
                  {
                    id: "receipt-schedule",
                    label: "Horario",
                    value: formatDateTime(
                      counterBookingReceipt.booking.startAt
                    ),
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
                <button
                  className="secondary-button"
                  onClick={() => openCounterBookingModal()}
                  type="button"
                >
                  Novo agendamento
                </button>
                <button
                  className="admin-primary-action"
                  onClick={handleOpenCounterBookingInAgenda}
                  type="button"
                >
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
        <section
          className="counter-booking-modal"
          role="dialog"
          aria-label="Novo agendamento"
        >
          <div className="counter-booking-modal-header">
            <div>
              <p className="eyebrow">Novo agendamento</p>
              <h2>Agendar cliente no balcão</h2>
              <p className="description">
                Mesma jornada do booking publico, mas persistida pelo admin com
                contrato interno.
              </p>
            </div>
            <button
              className="admin-icon-button"
              onClick={closeCounterBookingModal}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            className="counter-booking-form"
            onSubmit={(event) => void handleSubmitCounterBooking(event)}
          >
            <div
              className="counter-booking-progress"
              aria-label="Etapas do agendamento"
            >
              {progressSteps.map((step) => (
                <button
                  aria-current={
                    counterBookingStep === step.id ? "step" : undefined
                  }
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
                        <p>
                          Comece pelo atendimento que será marcado no balcão.
                        </p>
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
                            onClick={() =>
                              setCounterBookingServiceId(service.id)
                            }
                            type="button"
                          >
                            <strong>{service.nome}</strong>
                            <span>{service.duracaoMin} min</span>
                            <small>{formatCurrency(service.precoBase)}</small>
                          </button>
                        ))
                      ) : (
                        <p className="empty-state">
                          Publique ao menos um servico ativo no catalogo.
                        </p>
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
                        <p>
                          Mostramos apenas a equipe compativel com o servico
                          selecionado.
                        </p>
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
                            onClick={() =>
                              setCounterBookingProfessionalId(professional.id)
                            }
                            type="button"
                          >
                            <strong>{professional.nome}</strong>
                            <span>
                              {resolveProfessionalSummaryLine(
                                resolveProfessionalServiceNames(
                                  professional,
                                  services
                                )
                              )}
                            </span>
                            <small>
                              {formatProfessionalStatus(professional.status)}
                            </small>
                          </button>
                        ))
                      ) : (
                        <p className="empty-state">
                          Nenhum profissional ativo atende esse servico.
                        </p>
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
                        <p>
                          Os slots saem da disponibilidade real do profissional
                          no admin.
                        </p>
                      </div>
                    </div>

                    <label className="field">
                      <span>Data</span>
                      <input
                        min={formatDateInputValue(new Date())}
                        type="date"
                        value={counterBookingDate}
                        onChange={(event) =>
                          setCounterBookingDate(event.target.value)
                        }
                      />
                    </label>

                    {isLoadingCounterBookingSlots ? (
                      <p className="helper">
                        Carregando horarios disponiveis...
                      </p>
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
                            onClick={() =>
                              setCounterBookingSlotStartAt(slot.startAt)
                            }
                            type="button"
                          >
                            {slot.startTime}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">
                        Nenhum slot disponivel para esta data.
                      </p>
                    )}
                  </section>
                ) : null}

                {counterBookingStep === "client" ? (
                  <section className="counter-booking-step-card">
                    <div className="counter-booking-step-heading">
                      <span>04</span>
                      <div>
                        <h3>Dados do cliente</h3>
                        <p>
                          Se a base ja tiver esse cliente, o admin reutiliza o
                          cadastro automaticamente.
                        </p>
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
                            setCounterBookingForm({
                              ...counterBookingForm,
                              nome: event.target.value
                            })
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
                            setCounterBookingForm({
                              ...counterBookingForm,
                              telefone: event.target.value
                            })
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
                            setCounterBookingForm({
                              ...counterBookingForm,
                              email: event.target.value
                            })
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
                            setCounterBookingForm({
                              ...counterBookingForm,
                              origem: event.target.value
                            })
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
                              status: event.target
                                .value as CounterBookingFormState["status"]
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
                          O cadastro de {counterBookingClientMatch.nome} sera
                          reutilizado para evitar duplicidade.
                        </span>
                      </div>
                    ) : null}
                  </section>
                ) : null}

                {counterBookingError ? (
                  <div className="feedback-banner is-error">
                    {counterBookingError}
                  </div>
                ) : null}
                {counterBookingConflictSuggestion ? (
                  <div className="feedback-banner is-warning counter-booking-conflict-banner">
                    <span>{counterBookingConflictSuggestion.message}</span>
                    <div className="button-row">
                      <button
                        className="secondary-button"
                        onClick={() => {
                          setCounterBookingSlotStartAt(
                            counterBookingConflictSuggestion.slot.startAt
                          );
                          setCounterBookingConflictSuggestion(null);
                          setCounterBookingError(
                            `Horario ajustado para ${formatTimeRange(
                              counterBookingConflictSuggestion.slot.startAt,
                              counterBookingConflictSuggestion.slot.endAt
                            )}.`
                          );
                        }}
                        type="button"
                      >
                        Sim
                      </button>
                      <button
                        className="secondary-button"
                        onClick={() =>
                          setCounterBookingConflictSuggestion(null)
                        }
                        type="button"
                      >
                        Nao
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="counter-booking-footer">
                  <button
                    className="secondary-button"
                    onClick={closeCounterBookingModal}
                    type="button"
                  >
                    Cancelar
                  </button>
                  <div className="counter-booking-footer-actions">
                    {counterBookingStep !== "service" ? (
                      <button
                        className="secondary-button"
                        onClick={handleCounterBookingPreviousStep}
                        type="button"
                      >
                        Voltar
                      </button>
                    ) : null}
                    {counterBookingStep !== "client" ? (
                      <button
                        className="admin-primary-action"
                        onClick={handleCounterBookingNextStep}
                        type="button"
                      >
                        Continuar
                      </button>
                    ) : (
                      <button
                        className="admin-primary-action"
                        disabled={isSubmittingCounterBooking}
                        type="submit"
                      >
                        {isSubmittingCounterBooking
                          ? "Salvando..."
                          : "Salvar agendamento"}
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
                            resolveProfessionalServiceNames(
                              counterBookingSelectedProfessional,
                              services
                            )
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
                        ? formatTimeRange(
                            counterBookingSelectedSlot.startAt,
                            counterBookingSelectedSlot.endAt
                          )
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
                  <p>
                    O agendamento nasce pelo admin sem abrir checkout publico e
                    continua respeitando disponibilidade e conflito de slot.
                  </p>
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

    const selectedService = services.find(
      (item) => item.id === selectedAgendaBooking.serviceId
    );
    const selectedClient = clients.find(
      (item) => item.id === selectedAgendaBooking.clientId
    );

    return (
      <>
        <button
          aria-label="Fechar detalhe da booking"
          className="agenda-booking-overlay"
          onClick={closeAgendaBookingModal}
          type="button"
        />
        <section
          className="agenda-booking-modal"
          role="dialog"
          aria-label="Detalhe da booking"
        >
          <div className="agenda-booking-modal-header">
            <div>
              <p className="eyebrow">Detalhe da booking</p>
              <h2>{selectedService?.nome ?? "Booking selecionada"}</h2>
              <p className="description">
                {selectedClient?.nome ?? "Cliente"} em{" "}
                {formatTimeRange(
                  selectedAgendaBooking.startAt,
                  selectedAgendaBooking.endAt
                )}
                .
              </p>
            </div>
            <button
              className="admin-icon-button"
              onClick={closeAgendaBookingModal}
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="agenda-booking-modal-body">
            {renderAgendaBookingDocument()}
          </div>
        </section>
      </>
    );
  }

  function renderCashflowFilterModal(): JSX.Element | null {
    if (!isCashflowFilterModalOpen) {
      return null;
    }

    const filteredBankRows = banks
      .filter(
        (bank) =>
          cashflowFilterDraft.query.trim().length === 0 ||
          `${bank.codigo} ${bank.nomeBanco} ${bank.agencia} ${bank.conta}`
            .toLowerCase()
            .includes(cashflowFilterDraft.query.trim().toLowerCase())
      )
      .map((bank) => ({
        id: bank.id,
        selected: cashflowFilterDraft.bankId === bank.id,
        onClick: () => {
          setCashflowFilterDraft((current) => ({
            ...current,
            bankId: bank.id
          }));
          setIsCashflowBankLookupOpen(false);
        },
        cells: [
          { key: "codigo", value: bank.codigo },
          { key: "base", value: bank.nomeBanco },
          { key: "descricao", value: `${bank.agencia}/${bank.conta}` }
        ]
      }));

    return (
      <WorkspaceRecordModal
        onClose={() => setIsCashflowFilterModalOpen(false)}
        title="Filtros do fluxo de caixa"
      >
        <div className="stack-form">
          <div className="form-grid">
            <label className="field">
              <span>Data de</span>
              <input
                type="date"
                value={cashflowFilterDraft.dateFrom}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    dateFrom: event.target.value
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Data ate</span>
              <input
                type="date"
                value={cashflowFilterDraft.dateTo}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    dateTo: event.target.value
                  }))
                }
              />
            </label>
            <label className="field field-wide">
              <span>Banco</span>
              <div className="lookup-field-shell">
                <input
                  readOnly
                  value={
                    cashflowFilterDraft.bankId === "all"
                      ? "Todos"
                      : (resolveBankLabel(cashflowFilterDraft.bankId, banks) ??
                        "Banco nao encontrado")
                  }
                />
                <button
                  className="secondary-button"
                  onClick={() => setIsCashflowBankLookupOpen(true)}
                  type="button"
                >
                  Buscar
                </button>
                {cashflowFilterDraft.bankId !== "all" ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      setCashflowFilterDraft((current) => ({
                        ...current,
                        bankId: "all"
                      }))
                    }
                    type="button"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
            </label>
            <label className="field">
              <span>Situacao</span>
              <select
                value={cashflowFilterDraft.movementStatus}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    movementStatus: event.target
                      .value as CashflowMovementStatusFilter
                  }))
                }
              >
                <option value="all">Todas</option>
                <option value="previsto">Previsto</option>
                <option value="lancado">Lancado</option>
                <option value="estornado">Estornado</option>
              </select>
            </label>
            <label className="field">
              <span>Tipo</span>
              <select
                value={cashflowFilterDraft.type}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    type: event.target
                      .value as FinanceBrowseFiltersState["cashflow"]["type"]
                  }))
                }
              >
                <option value="all">Todos</option>
                <option value="entrada">Entrada</option>
                <option value="saida">Saida</option>
                <option value="transferencia">Transferencia</option>
                <option value="ajuste">Ajuste</option>
                <option value="taxa">Taxa</option>
              </select>
            </label>
            <label className="field">
              <span>Origem</span>
              <select
                value={cashflowFilterDraft.origin}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    origin: event.target.value as CashflowOriginFilter
                  }))
                }
              >
                <option value="all">Todas</option>
                <option value="manual">Manual</option>
                <option value="agenda">Agenda</option>
                <option value="receita">Receita</option>
                <option value="despesa">Despesa</option>
                <option value="fechar_caixa">Fechar caixa</option>
              </select>
            </label>
            <label className="field field-wide">
              <span>Buscar</span>
              <input
                value={cashflowFilterDraft.query}
                onChange={(event) =>
                  setCashflowFilterDraft((current) => ({
                    ...current,
                    query: event.target.value
                  }))
                }
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={clearCashflowFilters}
              type="button"
            >
              Limpar filtros
            </button>
            <button
              className="secondary-button"
              onClick={() => setIsCashflowFilterModalOpen(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              onClick={applyCashflowFilterDraft}
              type="button"
            >
              Aplicar filtros
            </button>
          </div>
          {isCashflowBankLookupOpen ? (
            <WorkspaceRecordModal
              onClose={() => setIsCashflowBankLookupOpen(false)}
              title="Selecionar banco"
            >
              {renderFinanceBrowseTable(
                [
                  { key: "codigo", label: "Codigo" },
                  { key: "base", label: "Base" },
                  { key: "descricao", label: "Descricao" }
                ],
                filteredBankRows,
                "Nenhum banco encontrado."
              )}
            </WorkspaceRecordModal>
          ) : null}
        </div>
      </WorkspaceRecordModal>
    );
  }

  function renderAgendaFilterModal(): JSX.Element | null {
    if (!isAgendaFilterModalOpen) {
      return null;
    }

    return (
      <WorkspaceRecordModal
        onClose={() => setIsAgendaFilterModalOpen(false)}
        title="Filtros da agenda"
      >
        <div className="stack-form">
          <div className="form-grid">
            <label className="field">
              <span>Data</span>
              <input
                type="date"
                value={agendaFilterDraft.date}
                onChange={(event) =>
                  setAgendaFilterDraft((current) => ({
                    ...current,
                    date: event.target.value
                  }))
                }
              />
            </label>
            <label className="field">
              <span>Profissional</span>
              <select
                value={agendaFilterDraft.professionalId}
                onChange={(event) =>
                  setAgendaFilterDraft((current) => ({
                    ...current,
                    professionalId: event.target.value
                  }))
                }
              >
                <option value="all">Todos os profissionais</option>
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Status</span>
              <select
                value={agendaFilterDraft.status}
                onChange={(event) =>
                  setAgendaFilterDraft((current) => ({
                    ...current,
                    status: event.target
                      .value as AgendaFilterDraftState["status"]
                  }))
                }
              >
                <option value="all">Todos</option>
                <option value="pendente">Pendente</option>
                <option value="aguardando pagamento">
                  Aguardando pagamento
                </option>
                <option value="confirmado">Confirmado</option>
                <option value="concluido">Concluido</option>
                <option value="cancelado">Cancelado</option>
                <option value="faltou">Faltou</option>
              </select>
            </label>
            <label className="field">
              <span>Servico</span>
              <select
                value={agendaFilterDraft.serviceId}
                onChange={(event) =>
                  setAgendaFilterDraft((current) => ({
                    ...current,
                    serviceId: event.target.value
                  }))
                }
              >
                <option value="all">Todos os servicos</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-wide agenda-filter-checkbox">
              <span>Somente com pagamento pendente</span>
              <input
                checked={agendaFilterDraft.pendingOnly}
                onChange={(event) =>
                  setAgendaFilterDraft((current) => ({
                    ...current,
                    pendingOnly: event.target.checked
                  }))
                }
                type="checkbox"
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={clearAgendaFilters}
              type="button"
            >
              Limpar filtros
            </button>
            <button
              className="secondary-button"
              onClick={() => setIsAgendaFilterModalOpen(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="primary-button"
              onClick={applyAgendaFilters}
              type="button"
            >
              Aplicar filtros
            </button>
          </div>
        </div>
      </WorkspaceRecordModal>
    );
  }

  function renderFinanceModal(): JSX.Element | null {
    if (!financeModal) {
      return null;
    }

    const isReadOnly = financeModalMode === "view";

    if (financeModal === "bank") {
      return (
        <WorkspaceRecordModal
          onClose={closeFinanceModal}
          subtitle="Codigo, BACEN, agencia e conta."
          title={
            financeModalMode === "view"
              ? "Visualizar banco"
              : editingBankId
                ? "Alterar banco"
                : "Incluir banco"
          }
        >
          <form
            className="stack-form"
            onSubmit={(event) => void handleSaveBank(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span>Codigo</span>
                <input
                  disabled={isReadOnly}
                  value={bankForm.codigo}
                  onChange={(event) =>
                    setBankForm((current) => ({
                      ...current,
                      codigo: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>BACEN</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={bankForm.bacenCode}
                  onChange={(event) =>
                    setBankForm((current) => ({
                      ...current,
                      bacenCode: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Nome do banco</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={bankForm.nomeBanco}
                  onChange={(event) =>
                    setBankForm((current) => ({
                      ...current,
                      nomeBanco: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Agencia</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={bankForm.agencia}
                  onChange={(event) =>
                    setBankForm((current) => ({
                      ...current,
                      agencia: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Conta</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={bankForm.conta}
                  onChange={(event) =>
                    setBankForm((current) => ({
                      ...current,
                      conta: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                {isReadOnly ? "Fechar" : "Cancelar"}
              </button>
              {!isReadOnly ? (
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
                  Salvar
                </button>
              ) : null}
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    if (financeModal === "balance") {
      return (
        <WorkspaceRecordModal
          onClose={closeFinanceModal}
          subtitle="Selecione o banco e informe o saldo inicial."
          title={
            financeModalMode === "view"
              ? "Visualizar saldo inicial"
              : editingBalanceId
                ? "Alterar saldo inicial"
                : "Saldo inicial"
          }
        >
          <form
            className="stack-form"
            onSubmit={(event) => void handleSaveBankBalance(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span>Codigo</span>
                <input
                  disabled={isReadOnly}
                  value={bankBalanceForm.codigo}
                  onChange={(event) =>
                    setBankBalanceForm((current) => ({
                      ...current,
                      codigo: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Banco</span>
                <select
                  disabled={isReadOnly}
                  required
                  value={bankBalanceForm.bankId}
                  onChange={(event) =>
                    setBankBalanceForm((current) => ({
                      ...current,
                      bankId: event.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.nomeBanco} {bank.agencia}/{bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Saldo inicial</span>
                <CurrencyInput
                  disabled={isReadOnly}
                  required
                  value={bankBalanceForm.saldoInicial}
                  onValueChange={(value) =>
                    setBankBalanceForm((current) => ({
                      ...current,
                      saldoInicial: value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Data</span>
                <input
                  disabled={isReadOnly}
                  required
                  type="date"
                  value={bankBalanceForm.dataSaldoInicial}
                  onChange={(event) =>
                    setBankBalanceForm((current) => ({
                      ...current,
                      dataSaldoInicial: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                {isReadOnly ? "Fechar" : "Cancelar"}
              </button>
              {!isReadOnly ? (
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
                  Salvar
                </button>
              ) : null}
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    if (financeModal === "revenue" || financeModal === "expense") {
      const isRevenue = financeModal === "revenue";
      const form = isRevenue ? revenueForm : expenseForm;
      return (
        <WorkspaceRecordModal
          onClose={closeFinanceModal}
          subtitle={
            isRevenue
              ? "Descricao, vencimento, valor, banco e baixa automatica."
              : "Descricao, vencimento, valor, banco e baixa automatica."
          }
          title={
            isRevenue
              ? financeModalMode === "view"
                ? "Visualizar receita"
                : editingRevenueId
                  ? "Alterar receita"
                  : "Incluir receita"
              : financeModalMode === "view"
                ? "Visualizar despesa"
                : editingExpenseId
                  ? "Alterar despesa"
                  : "Incluir despesa"
          }
        >
          <form
            className="stack-form"
            onSubmit={(event) =>
              void (isRevenue
                ? handleSaveRevenue(event)
                : handleSaveExpense(event))
            }
          >
            <div className="form-grid">
              <label className="field">
                <span>Codigo</span>
                <input
                  disabled={isReadOnly}
                  value={form.codigo}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          codigo: event.target.value
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          codigo: event.target.value
                        })
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Descricao</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={form.descricao}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          descricao: event.target.value
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          descricao: event.target.value
                        })
                  }
                />
              </label>
              <label className="field">
                <span>Valor</span>
                <CurrencyInput
                  disabled={isReadOnly}
                  required
                  value={form.valor}
                  onValueChange={(value) =>
                    isRevenue
                      ? setRevenueForm({ ...revenueForm, valor: value })
                      : setExpenseForm({ ...expenseForm, valor: value })
                  }
                />
              </label>
              <label className="field">
                <span>Vencimento</span>
                <input
                  disabled={isReadOnly}
                  required
                  type="date"
                  value={form.dataVencimento}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          dataVencimento: event.target.value
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          dataVencimento: event.target.value
                        })
                  }
                />
              </label>
              <label className="field">
                <span>Tipo</span>
                <select
                  disabled={isReadOnly}
                  value={form.tipo}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          tipo: event.target.value as RevenueFormState["tipo"]
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          tipo: event.target.value as ExpenseFormState["tipo"]
                        })
                  }
                >
                  <option value="unica">Unica</option>
                  <option value="recorrente">Recorrente</option>
                </select>
              </label>
              <label className="field">
                <span>Banco</span>
                <select
                  disabled={isReadOnly}
                  value={form.bankId}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          bankId: event.target.value
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          bankId: event.target.value
                        })
                  }
                >
                  <option value="">Sem banco definido</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco} {bank.agencia}/
                      {bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Baixa automatica</span>
                <select
                  disabled={isReadOnly}
                  value={form.baixaAutomatica}
                  onChange={(event) =>
                    isRevenue
                      ? setRevenueForm({
                          ...revenueForm,
                          baixaAutomatica: event.target
                            .value as RevenueFormState["baixaAutomatica"]
                        })
                      : setExpenseForm({
                          ...expenseForm,
                          baixaAutomatica: event.target
                            .value as ExpenseFormState["baixaAutomatica"]
                        })
                  }
                >
                  <option value="nao">Nao</option>
                  <option value="sim">Sim</option>
                </select>
              </label>
              {form.tipo === "recorrente" ? (
                <>
                  <label className="field">
                    <span>Recorrencia</span>
                    <select
                      disabled={isReadOnly}
                      value={form.recorrencia}
                      onChange={(event) =>
                        isRevenue
                          ? setRevenueForm({
                              ...revenueForm,
                              recorrencia: event.target
                                .value as RevenueFormState["recorrencia"]
                            })
                          : setExpenseForm({
                              ...expenseForm,
                              recorrencia: event.target
                                .value as ExpenseFormState["recorrencia"]
                            })
                      }
                    >
                      <option value="semanal">Semanal</option>
                      <option value="mensal">Mensal</option>
                    </select>
                  </label>
                  <label className="field">
                    <span>Ocorrencias</span>
                    <input
                      disabled={isReadOnly}
                      min="1"
                      type="number"
                      value={form.quantidadeOcorrencias}
                      onChange={(event) =>
                        isRevenue
                          ? setRevenueForm({
                              ...revenueForm,
                              quantidadeOcorrencias: event.target.value
                            })
                          : setExpenseForm({
                              ...expenseForm,
                              quantidadeOcorrencias: event.target.value
                            })
                      }
                    />
                  </label>
                </>
              ) : null}
              {!isRevenue ? (
                <label className="field field-wide">
                  <span>Beneficiario</span>
                  <input
                    disabled={isReadOnly}
                    value={expenseForm.beneficiarioNome}
                    onChange={(event) =>
                      setExpenseForm({
                        ...expenseForm,
                        beneficiarioNome: event.target.value
                      })
                    }
                  />
                </label>
              ) : null}
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                {isReadOnly ? "Fechar" : "Cancelar"}
              </button>
              {!isReadOnly ? (
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
                  Salvar
                </button>
              ) : null}
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    if (financeModal === "movement") {
      return (
        <WorkspaceRecordModal
          onClose={closeFinanceModal}
          subtitle="Movimento de caixa ja ocorrido ou programado por data."
          title={
            financeModalMode === "view"
              ? "Visualizar movimento"
              : editingMovementId
                ? "Alterar movimento"
                : "Incluir movimento"
          }
        >
          <form
            className="stack-form"
            onSubmit={(event) => void handleSaveManualMovement(event)}
          >
            <div className="form-grid">
              <label className="field">
                <span>Tipo</span>
                <select
                  disabled={isReadOnly}
                  value={manualMovementForm.tipo}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      tipo: event.target
                        .value as ManualMovementFormState["tipo"]
                    }))
                  }
                >
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saida</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="ajuste">Ajuste</option>
                  <option value="taxa">Taxa</option>
                </select>
              </label>
              <label className="field">
                <span>Banco origem</span>
                <select
                  disabled={isReadOnly}
                  value={manualMovementForm.bankIdOrigem}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      bankIdOrigem: event.target.value
                    }))
                  }
                >
                  <option value="">Nao se aplica</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco} {bank.agencia}/
                      {bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Banco destino</span>
                <select
                  disabled={isReadOnly}
                  value={manualMovementForm.bankIdDestino}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      bankIdDestino: event.target.value
                    }))
                  }
                >
                  <option value="">Nao se aplica</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco} {bank.agencia}/
                      {bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Valor</span>
                <CurrencyInput
                  disabled={isReadOnly}
                  required
                  value={manualMovementForm.valor}
                  onValueChange={(value) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      valor: value
                    }))
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Historico</span>
                <input
                  disabled={isReadOnly}
                  required
                  value={manualMovementForm.historico}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      historico: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field field-wide">
                <span>Beneficiario</span>
                <input
                  disabled={isReadOnly}
                  value={manualMovementForm.beneficiarioNome}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      beneficiarioNome: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Data do movimento</span>
                <input
                  disabled={isReadOnly}
                  required
                  type="datetime-local"
                  value={manualMovementForm.dataMovimento}
                  onChange={(event) =>
                    setManualMovementForm((current) => ({
                      ...current,
                      dataMovimento: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                {isReadOnly ? "Fechar" : "Cancelar"}
              </button>
              {!isReadOnly ? (
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
                  Salvar
                </button>
              ) : null}
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    if (financeModal === "close") {
      const pendingPreviewItems = cashClosePreview?.pending ?? [];
      const settledPreviewItems = cashClosePreview?.settled ?? [];

      return (
        <WorkspaceRecordModal
          onClose={closeFinanceModal}
          subtitle={
            financeModalMode === "view"
              ? "Leitura do fechamento ja realizado."
              : "Selecione banco e periodo para fechar o caixa."
          }
          title={
            financeModalMode === "view"
              ? "Visualizar fechamento"
              : "Fechar caixa"
          }
        >
          <form
            className="stack-form"
            onSubmit={(event) => void handleCreateCashClose(event)}
          >
            {financeModalMode === "view" && selectedCashClose ? (
              <div className="dashboard-mini-grid">
                <div className="dashboard-mini-card">
                  <strong>{selectedCashClose.codigo}</strong>
                  <span>Codigo</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>
                    {formatCurrency(selectedCashClose.totalEntradas)}
                  </strong>
                  <span>Total recebido</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>
                    {formatCurrency(selectedCashClose.totalSaidas)}
                  </strong>
                  <span>Total pago</span>
                </div>
                <div className="dashboard-mini-card">
                  <strong>
                    {formatCurrency(selectedCashClose.saldoFechado)}
                  </strong>
                  <span>Saldo fechado</span>
                </div>
              </div>
            ) : null}
            <div className="form-grid">
              <label className="field field-wide">
                <span>Banco</span>
                <select
                  disabled={financeModalMode === "view"}
                  required
                  value={cashCloseForm.bankId}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      bankId: event.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.codigo} | {bank.nomeBanco} {bank.agencia}/
                      {bank.conta}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Data de</span>
                <input
                  disabled={financeModalMode === "view"}
                  required
                  type="date"
                  value={cashCloseForm.dateFrom}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      dateFrom: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Data ate</span>
                <input
                  disabled={financeModalMode === "view"}
                  required
                  type="date"
                  value={cashCloseForm.dateTo}
                  onChange={(event) =>
                    setCashCloseForm((current) => ({
                      ...current,
                      dateTo: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            {financeModalMode !== "view" ? (
              isLoadingCashClosePreview ? (
                <div className="dashboard-mini-card">
                  <strong>Carregando conferencia</strong>
                  <span>
                    Aguarde enquanto os pendentes e os itens ja baixados sao
                    consolidados.
                  </span>
                </div>
              ) : (
                <div className="cash-close-preview-grid">
                  <section className="cash-close-preview-panel">
                    <div className="cash-close-preview-header">
                      <div>
                        <strong>Pendentes</strong>
                        <span>
                          {selectedCashClosePreviewKeys.length} marcado(s)
                        </span>
                      </div>
                    </div>
                    {pendingPreviewItems.length ? (
                      <div className="cash-close-preview-list">
                        {pendingPreviewItems.map((entry) => {
                          const key = buildCashClosePreviewSelectionKey(
                            entry.sourceType,
                            entry.sourceId
                          );
                          const isChecked =
                            selectedCashClosePreviewKeys.includes(key);
                          return (
                            <label
                              className="cash-close-preview-item is-pending"
                              key={key}
                            >
                              <input
                                checked={isChecked}
                                type="checkbox"
                                onChange={() =>
                                  setSelectedCashClosePreviewKeys((current) =>
                                    current.includes(key)
                                      ? current.filter((item) => item !== key)
                                      : [...current, key]
                                  )
                                }
                              />
                              <div className="cash-close-preview-copy">
                                <strong>{entry.descricao}</strong>
                                <span>
                                  {entry.tipo === "entrada"
                                    ? "Receita"
                                    : "Despesa"}{" "}
                                  · {formatDateShort(entry.dataReferencia)}
                                </span>
                              </div>
                              <span className="cash-close-preview-value">
                                {formatCurrency(entry.valor)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="empty-state">
                        Nenhum item pendente para este banco e periodo.
                      </p>
                    )}
                  </section>

                  <section className="cash-close-preview-panel">
                    <div className="cash-close-preview-header">
                      <div>
                        <strong>Ja baixados</strong>
                        <span>{settledPreviewItems.length} item(ns)</span>
                      </div>
                    </div>
                    {settledPreviewItems.length ? (
                      <div className="cash-close-preview-list">
                        {settledPreviewItems.map((entry) => (
                          <div
                            className="cash-close-preview-item is-settled"
                            key={`${entry.sourceType}:${entry.sourceId}:${entry.movementId ?? "settled"}`}
                          >
                            <div className="cash-close-preview-copy">
                              <strong>{entry.descricao}</strong>
                              <span>
                                {entry.tipo === "entrada" ? "Recebido" : "Pago"}{" "}
                                · {formatDateShort(entry.dataReferencia)}
                              </span>
                            </div>
                            <span className="cash-close-preview-value">
                              {formatCurrency(entry.valor)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="empty-state">
                        Nenhum item baixado neste periodo.
                      </p>
                    )}
                  </section>
                </div>
              )
            ) : null}
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={closeFinanceModal}
                type="button"
              >
                {financeModalMode === "view" ? "Fechar" : "Cancelar"}
              </button>
              {financeModalMode !== "view" ? (
                <button
                  className="primary-button"
                  disabled={isBusy || !selectedCashClosePreviewKeys.length}
                  type="submit"
                >
                  Fechar caixa
                </button>
              ) : null}
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    const movementTitle =
      financeModal === "receive"
        ? "Receber"
        : financeModal === "pay"
          ? "Pagar"
          : "Transferir";

    return (
      <WorkspaceRecordModal onClose={closeFinanceModal} title={movementTitle}>
        <form
          className="stack-form"
          onSubmit={(event) =>
            void (financeModal === "receive"
              ? handleReceiveMovement(event)
              : financeModal === "pay"
                ? handlePayMovement(event)
                : handleTransferMovement(event))
          }
        >
          <div className="form-grid">
            {financeModal === "receive" ? (
              <label className="field">
                <span>Banco</span>
                <select
                  required
                  value={receiveMovementForm.bankIdDestino}
                  onChange={(event) =>
                    setReceiveMovementForm((current) => ({
                      ...current,
                      bankIdDestino: event.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.nomeBanco} {bank.agencia}/{bank.conta}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="field">
                <span>Banco origem</span>
                <select
                  required
                  value={
                    financeModal === "pay"
                      ? payMovementForm.bankIdOrigem
                      : transferMovementForm.bankIdOrigem
                  }
                  onChange={(event) =>
                    financeModal === "pay"
                      ? setPayMovementForm((current) => ({
                          ...current,
                          bankIdOrigem: event.target.value
                        }))
                      : setTransferMovementForm((current) => ({
                          ...current,
                          bankIdOrigem: event.target.value
                        }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.nomeBanco} {bank.agencia}/{bank.conta}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {financeModal === "transfer" ? (
              <label className="field">
                <span>Banco destino</span>
                <select
                  required
                  value={transferMovementForm.bankIdDestino}
                  onChange={(event) =>
                    setTransferMovementForm((current) => ({
                      ...current,
                      bankIdDestino: event.target.value
                    }))
                  }
                >
                  <option value="">Selecione</option>
                  {banks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.nomeBanco} {bank.agencia}/{bank.conta}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="field">
              <span>Valor</span>
              <CurrencyInput
                required
                value={
                  financeModal === "receive"
                    ? receiveMovementForm.valor
                    : financeModal === "pay"
                      ? payMovementForm.valor
                      : transferMovementForm.valor
                }
                onValueChange={(value) =>
                  financeModal === "receive"
                    ? setReceiveMovementForm((current) => ({
                        ...current,
                        valor: value
                      }))
                    : financeModal === "pay"
                      ? setPayMovementForm((current) => ({
                          ...current,
                          valor: value
                        }))
                      : setTransferMovementForm((current) => ({
                          ...current,
                          valor: value
                        }))
                }
              />
            </label>
            <label className="field field-wide">
              <span>Historico</span>
              <input
                required
                value={
                  financeModal === "receive"
                    ? receiveMovementForm.historico
                    : financeModal === "pay"
                      ? payMovementForm.historico
                      : transferMovementForm.historico
                }
                onChange={(event) =>
                  financeModal === "receive"
                    ? setReceiveMovementForm((current) => ({
                        ...current,
                        historico: event.target.value
                      }))
                    : financeModal === "pay"
                      ? setPayMovementForm((current) => ({
                          ...current,
                          historico: event.target.value
                        }))
                      : setTransferMovementForm((current) => ({
                          ...current,
                          historico: event.target.value
                        }))
                }
              />
            </label>
            {financeModal === "pay" ? (
              <label className="field field-wide">
                <span>Beneficiario</span>
                <input
                  value={payMovementForm.beneficiarioNome}
                  onChange={(event) =>
                    setPayMovementForm((current) => ({
                      ...current,
                      beneficiarioNome: event.target.value
                    }))
                  }
                />
              </label>
            ) : null}
            <label className="field">
              <span>Data do movimento</span>
              <input
                required
                type="datetime-local"
                value={
                  financeModal === "receive"
                    ? receiveMovementForm.dataMovimento
                    : financeModal === "pay"
                      ? payMovementForm.dataMovimento
                      : transferMovementForm.dataMovimento
                }
                onChange={(event) =>
                  financeModal === "receive"
                    ? setReceiveMovementForm((current) => ({
                        ...current,
                        dataMovimento: event.target.value
                      }))
                    : financeModal === "pay"
                      ? setPayMovementForm((current) => ({
                          ...current,
                          dataMovimento: event.target.value
                        }))
                      : setTransferMovementForm((current) => ({
                          ...current,
                          dataMovimento: event.target.value
                        }))
                }
              />
            </label>
          </div>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={closeFinanceModal}
              type="button"
            >
              Cancelar
            </button>
            <button className="primary-button" disabled={isBusy} type="submit">
              Salvar
            </button>
          </div>
        </form>
      </WorkspaceRecordModal>
    );
  }

  function renderFinanceActionDialogs(): JSX.Element | null {
    if (deleteTarget) {
      return (
        <WorkspaceRecordModal
          onClose={() => setDeleteTarget(null)}
          subtitle="A exclusao so vale para registros ainda nao liquidados nem consolidados."
          title="Excluir registro"
        >
          <div className="stack-form">
            <div className="workspace-record-delete-copy">
              <strong>{deleteTarget.label}</strong>
              <p>
                Se houver reflexo financeiro consolidado, a acao correta passa a
                ser estornar.
              </p>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={isBusy}
                onClick={() => void handleDeleteFinanceRecord()}
                type="button"
              >
                Confirmar exclusao
              </button>
            </div>
          </div>
        </WorkspaceRecordModal>
      );
    }

    if (reverseTarget) {
      return (
        <WorkspaceRecordModal
          onClose={() => setReverseTarget(null)}
          subtitle="O estorno gera um movimento inverso e preserva o historico original."
          title="Estornar movimento"
        >
          <form
            className="stack-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleReverseMovement();
            }}
          >
            <div className="workspace-record-delete-copy">
              <strong>{reverseTarget.label}</strong>
            </div>
            <div className="form-grid">
              <label className="field field-wide">
                <span>Historico do estorno</span>
                <input
                  value={reverseMovementForm.historico}
                  onChange={(event) =>
                    setReverseMovementForm((current) => ({
                      ...current,
                      historico: event.target.value
                    }))
                  }
                />
              </label>
              <label className="field">
                <span>Data do estorno</span>
                <input
                  required
                  type="datetime-local"
                  value={reverseMovementForm.dataMovimento}
                  onChange={(event) =>
                    setReverseMovementForm((current) => ({
                      ...current,
                      dataMovimento: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <div className="button-row">
              <button
                className="secondary-button"
                onClick={() => setReverseTarget(null)}
                type="button"
              >
                Cancelar
              </button>
              <button
                className="primary-button"
                disabled={isBusy}
                type="submit"
              >
                Confirmar estorno
              </button>
            </div>
          </form>
        </WorkspaceRecordModal>
      );
    }

    return null;
  }

  function renderAgendaBookingDocument(): JSX.Element | null {
    if (!selectedAgendaBooking) {
      return null;
    }

    const selectedService = services.find(
      (item) => item.id === selectedAgendaBooking.serviceId
    );
    const selectedProfessional = professionals.find(
      (item) => item.id === selectedAgendaBooking.professionalId
    );
    const selectedClient = clients.find(
      (item) => item.id === selectedAgendaBooking.clientId
    );

    return (
      <DocumentViewLayout
        className="agenda-booking-document"
        eyebrow="Booking selecionada"
        title={selectedService?.nome ?? "Servico nao encontrado"}
        subtitle={`${selectedClient?.nome ?? "Cliente"} com ${selectedProfessional?.nome ?? "profissional nao encontrado"}`}
        documentNumber={selectedAgendaBooking.id.slice(-8).toUpperCase()}
        statusBadge={
          <ViewBadge
            tone={
              resolveBookingStatusTone(selectedAgendaBooking.status) as
                | "neutral"
                | "info"
                | "success"
                | "warning"
                | "danger"
            }
          >
            {formatBookingStatus(selectedAgendaBooking.status)}
          </ViewBadge>
        }
        header={
          <DocumentHeader
            fields={[
              {
                id: "schedule",
                label: "Horario",
                value: formatTimeRange(
                  selectedAgendaBooking.startAt,
                  selectedAgendaBooking.endAt
                )
              },
              {
                id: "date",
                label: "Data",
                value: formatAgendaDayLabel(
                  extractDatePart(selectedAgendaBooking.startAt)
                )
              },
              {
                id: "client",
                label: "Cliente",
                value: selectedClient?.nome ?? "Cliente nao encontrado"
              },
              {
                id: "professional",
                label: "Profissional",
                value:
                  selectedProfessional?.nome ?? "Profissional nao encontrado"
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
                value: selectedService
                  ? formatCurrency(selectedService.precoBase)
                  : "--",
                helper: "Preco base derivado do catalogo ativo.",
                tone: "success"
              },
              {
                id: "service-duration",
                label: "Duracao",
                value: selectedService
                  ? formatMinutesAsHours(selectedService.duracaoMin)
                  : "--",
                helper: "Tempo previsto para a agenda."
              },
              {
                id: "payment-status",
                label: "Pagamento",
                value: selectedAgendaPaymentIntent
                  ? formatPaymentIntentStatus(
                      selectedAgendaPaymentIntent.status
                    )
                  : "Sem payment intent",
                helper: selectedAgendaPaymentIntent?.paymentId
                  ? `MP ${selectedAgendaPaymentIntent.paymentId}`
                  : "Nao existe pagamento vinculado para esta booking.",
                tone: selectedAgendaPaymentIntent
                  ? (resolvePaymentIntentTone(
                      selectedAgendaPaymentIntent.status
                    ) as "info" | "success" | "warning" | "danger")
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
                <span
                  className={`status-pill is-${resolveBookingStatusTone(selectedAgendaBooking.status)}`}
                >
                  {formatBookingStatus(selectedAgendaBooking.status)}
                </span>
                <span className="status-pill is-neutral">
                  {formatTimeRange(
                    selectedAgendaBooking.startAt,
                    selectedAgendaBooking.endAt
                  )}
                </span>
                {selectedAgendaPaymentIntent ? (
                  <span
                    className={`status-pill is-${resolvePaymentIntentTone(selectedAgendaPaymentIntent.status)}`}
                  >
                    Pagamento{" "}
                    {formatPaymentIntentStatus(
                      selectedAgendaPaymentIntent.status
                    )}
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
                          slot.startAt === selectedAgendaSlotStartAt
                            ? "secondary-button is-active"
                            : "secondary-button"
                        }
                        key={slot.startAt}
                        onClick={() =>
                          setSelectedAgendaSlotStartAt(slot.startAt)
                        }
                        type="button"
                      >
                        {slot.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="helper">
                    Nenhum slot disponivel para esta data.
                  </p>
                )}

                <div className="button-row">
                  <button
                    className="primary-button"
                    disabled={
                      isBusy ||
                      isLoadingAgendaSlots ||
                      !selectedAgendaSlotStartAt ||
                      selectedAgendaSlotStartAt ===
                        selectedAgendaBooking.startAt
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
                description: selectedAgendaPaymentIntent
                  ? formatPaymentIntentStatus(
                      selectedAgendaPaymentIntent.status
                    )
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
      <article className="ag-surface-card ag-view-panel agenda-workspace-panel agenda-workspace-panel-full agenda-bookings-panel">
        <div className="agenda-panel-header">
          <div>
            <h3>{formatAgendaDayLabel(agendaDate)}</h3>
          </div>
          <ViewBadge tone="info">
            {filteredDayAgendaBookings.length} booking(s)
          </ViewBadge>
        </div>

        <div className="ag-master-detail-body agenda-bookings-body">
          {filteredDayAgendaBookings.length ? (
            <div className="records-column agenda-bookings-list">
              {filteredDayAgendaBookings.map((booking) => {
                const service = services.find(
                  (item) => item.id === booking.serviceId
                );
                const professional = professionals.find(
                  (item) => item.id === booking.professionalId
                );
                const paymentIntent = paymentIntents.find(
                  (item) => item.bookingId === booking.id
                );

                return (
                  <button
                    className={
                      booking.id === selectedAgendaBooking?.id
                        ? "entity-card timeline-card is-active"
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
                      <span
                        className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}
                      >
                        {formatBookingStatus(booking.status)}
                      </span>
                    </div>
                    <div className="record-stack">
                      <strong>
                        {resolveClientName(booking.clientId, clients)}
                      </strong>
                      <span>
                        {service?.nome ?? "Servico"} |{" "}
                        {professional?.nome ?? "Profissional nao encontrado"}
                      </span>
                    </div>
                    <div className="record-meta">
                      <span>
                        {service
                          ? formatCurrency(service.precoBase)
                          : "Preco nao encontrado"}
                      </span>
                      {paymentIntent ? (
                        <span
                          className={`status-pill is-${resolvePaymentIntentTone(paymentIntent.status)}`}
                        >
                          Pagamento{" "}
                          {formatPaymentIntentStatus(paymentIntent.status)}
                        </span>
                      ) : (
                        <span className="status-pill is-neutral">
                          Sem payment intent
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty-state">
              Nenhum atendimento encontrado para{" "}
              {formatAgendaDayLabel(agendaDate)} neste recorte.
            </p>
          )}
        </div>
      </article>
    );
  }

  function renderAgendaCalendarWorkspace(): JSX.Element {
    const agendaCalendarDate = parseDateFns(
      agendaDate,
      "yyyy-MM-dd",
      new Date()
    );
    const visibleCalendarLabel =
      agendaViewMode === "day"
        ? formatAgendaDayLabel(agendaDate)
        : agendaViewMode === "week"
          ? formatAgendaWeekLabel(agendaWeekDates)
          : formatAgendaMonthLabel(agendaDate);

    return (
      <article className="ag-surface-card ag-view-panel agenda-workspace-panel agenda-calendar-panel agenda-workspace-panel-full">
        <div className="agenda-panel-header">
          <div>
            <h3>{visibleCalendarLabel}</h3>
          </div>
          <ViewBadge tone="success">
            {agendaCalendarEvents.length} evento(s)
          </ViewBadge>
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
            onNavigate={(nextDate) =>
              setAgendaDate(formatDateFns(nextDate, "yyyy-MM-dd"))
            }
            onSelectEvent={(event) => openAgendaBookingModal(event.resource)}
            onSelectSlot={(slotInfo) =>
              handleAgendaCalendarSlotSelection(slotInfo.start)
            }
            onView={(view) => {
              if (view === "day" || view === "week" || view === "month") {
                setAgendaViewMode(view);
              }
            }}
            popup
            selectable
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
    const agendaViewTabs: ReadonlyArray<{
      readonly id: AgendaViewMode;
      readonly label: string;
    }> = [
      { id: "day", label: "Dia" },
      { id: "week", label: "Semana" },
      { id: "month", label: "Mes" }
    ];
    const activeAgendaBookings =
      agendaViewMode === "day"
        ? filteredDayAgendaBookings
        : agendaViewMode === "week"
          ? filteredWeekBookings
          : currentMonthCells.flatMap((cell) => cell.bookings);
    const activeAgendaSummary = {
      total: activeAgendaBookings.length,
      open: activeAgendaBookings.filter((booking) =>
        isOpenBookingStatus(booking.status)
      ).length,
      confirmed: activeAgendaBookings.filter(
        (booking) => booking.status === "confirmado"
      ).length,
      completed: activeAgendaBookings.filter(
        (booking) => booking.status === "concluido"
      ).length
    };
    const activeAgendaLabel =
      agendaViewMode === "day"
        ? formatAgendaDayLabel(agendaDate)
        : agendaViewMode === "week"
          ? formatAgendaWeekLabel(agendaWeekDates)
          : formatAgendaMonthLabel(agendaDate);
    const navigationLabels =
      agendaViewMode === "week"
        ? {
            previous: "Semana anterior",
            current: "Esta semana",
            next: "Proxima semana"
          }
        : agendaViewMode === "month"
          ? {
              previous: "Mes anterior",
              current: "Este mes",
              next: "Proximo mes"
            }
          : { previous: "Dia anterior", current: "Hoje", next: "Proximo dia" };
    const selectedOperationalProfessional = selectedAgendaBooking
      ? professionals.find(
          (professional) =>
            professional.id === selectedAgendaBooking.professionalId
        )
      : undefined;
    const selectedOperationalService = selectedAgendaBooking
      ? services.find(
          (service) => service.id === selectedAgendaBooking.serviceId
        )
      : undefined;
    const canReceiveSelectedBooking = Boolean(
      selectedAgendaBooking &&
      selectedAgendaCashEntry &&
      !selectedAgendaBankMovement
    );
    const canReverseSelectedBooking = Boolean(selectedAgendaBankMovement);

    return (
      <DocumentViewLayout
        className="agenda-document-view agenda-unified-document"
        header={null}
        title="Agenda"
        statusBadge={<ViewBadge tone="info">{activeAgendaLabel}</ViewBadge>}
        pageActions={
          <div className="agenda-page-actions">
            <div className="mode-switch">
              <button
                className="secondary-button"
                onClick={() => handleAgendaDateShift(-1)}
                type="button"
              >
                {navigationLabels.previous}
              </button>
              <button
                className="secondary-button"
                onClick={() => setAgendaDate(formatDateInputValue(new Date()))}
                type="button"
              >
                {navigationLabels.current}
              </button>
              <button
                className="secondary-button"
                onClick={() => handleAgendaDateShift(1)}
                type="button"
              >
                {navigationLabels.next}
              </button>
            </div>

            <div
              aria-label="Visao da agenda"
              className="dashboard-tabbar agenda-subtabbar"
              role="tablist"
            >
              {agendaViewTabs.map((tab) => (
                <button
                  aria-selected={agendaViewMode === tab.id}
                  className={
                    agendaViewMode === tab.id
                      ? "dashboard-tab-button is-active"
                      : "dashboard-tab-button"
                  }
                  key={tab.id}
                  onClick={() => setAgendaViewMode(tab.id)}
                  role="tab"
                  type="button"
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              className="secondary-button"
              onClick={() => setIsAgendaDrawerOpen((current) => !current)}
              type="button"
            >
              {isAgendaDrawerOpen ? "Ocultar fila" : "Mostrar fila"}
            </button>
            <button
              className="secondary-button"
              onClick={openAgendaFilterModal}
              type="button"
            >
              Filtrar
            </button>
            <button
              className="secondary-button"
              disabled={isBusy}
              onClick={handleRefreshClick}
              type="button"
            >
              Atualizar
            </button>
            <button
              className="primary-button"
              onClick={() => openCounterBookingModal()}
              type="button"
            >
              Novo agendamento
            </button>
          </div>
        }
        summary={
          <DocumentSummaryCards
            metrics={[
              {
                id: "total",
                label: "No recorte",
                value: activeAgendaSummary.total,
                tone: "info"
              },
              {
                id: "open",
                label: "Em aberto",
                value: activeAgendaSummary.open,
                tone: "warning"
              },
              {
                id: "confirmed",
                label: "Confirmados",
                value: activeAgendaSummary.confirmed,
                tone: "info"
              },
              {
                id: "completed",
                label: "Concluidos",
                value: activeAgendaSummary.completed,
                tone: "success"
              }
            ]}
          />
        }
        items={
          <div
            className={
              isAgendaDrawerOpen
                ? "agenda-unified-layout"
                : "agenda-unified-layout is-drawer-hidden"
            }
          >
            <div className="agenda-unified-main">
              {renderAgendaCalendarWorkspace()}
            </div>
            {isAgendaDrawerOpen ? (
              <aside className="agenda-unified-drawer">
                <article className="ag-surface-card ag-view-panel agenda-selection-panel">
                  <div className="agenda-panel-header">
                    <div>
                      <h3>Selecionado</h3>
                    </div>
                    {selectedAgendaBooking ? (
                      <ViewBadge
                        tone={
                          resolveBookingStatusTone(
                            selectedAgendaBooking.status
                          ) as
                            | "neutral"
                            | "info"
                            | "success"
                            | "warning"
                            | "danger"
                        }
                      >
                        {formatBookingStatus(selectedAgendaBooking.status)}
                      </ViewBadge>
                    ) : null}
                  </div>
                  {selectedAgendaBooking ? (
                    <div className="records-column">
                      <div className="record-stack">
                        <strong>
                          {resolveClientName(
                            selectedAgendaBooking.clientId,
                            clients
                          )}
                        </strong>
                        <span>
                          {selectedOperationalService?.nome ?? "Servico"} |{" "}
                          {selectedOperationalProfessional?.nome ??
                            "Profissional"}
                        </span>
                      </div>
                      <div className="record-meta">
                        <span>
                          {formatTimeRange(
                            selectedAgendaBooking.startAt,
                            selectedAgendaBooking.endAt
                          )}
                        </span>
                        <span>
                          {formatCurrency(
                            resolveRecognizedRevenueAmount(
                              selectedAgendaBooking,
                              services,
                              cashEntries
                            ) ||
                              (selectedOperationalService?.precoBase ?? 0)
                          )}
                        </span>
                      </div>
                      <div className="button-row">
                        <button
                          className="secondary-button"
                          onClick={() =>
                            openAgendaBookingModal(selectedAgendaBooking)
                          }
                          type="button"
                        >
                          Visualizar
                        </button>
                        <button
                          className="secondary-button"
                          disabled={!canReceiveSelectedBooking}
                          onClick={() => {
                            if (
                              !selectedAgendaBooking ||
                              !selectedAgendaCashEntry
                            ) {
                              return;
                            }
                            setAgendaSettlementTarget(selectedAgendaBooking);
                            setReceiveTarget({
                              cashEntryId: selectedAgendaCashEntry.id
                            });
                            setFinanceModalMode("create");
                            setReceiveMovementForm({
                              bankIdDestino:
                                selectedOperationalProfessional?.bankId ?? "",
                              valor: String(
                                resolveRecognizedRevenueAmount(
                                  selectedAgendaBooking,
                                  services,
                                  cashEntries
                                )
                              ),
                              historico: `Recebimento ${selectedAgendaBooking.id.slice(-8).toUpperCase()} | ${selectedOperationalService?.nome ?? "Atendimento"}`,
                              dataMovimento: new Date()
                                .toISOString()
                                .slice(0, 16)
                            });
                            setFinanceModal("receive");
                          }}
                          type="button"
                        >
                          Receber
                        </button>
                        <button
                          className="secondary-button"
                          disabled={!canReverseSelectedBooking}
                          onClick={() => {
                            if (
                              !selectedAgendaBooking ||
                              !selectedAgendaBankMovement
                            ) {
                              return;
                            }
                            setReverseTarget({
                              kind: "agenda",
                              movementId: selectedAgendaBankMovement.id,
                              label: `${selectedAgendaBooking.id.slice(-8).toUpperCase()} | ${resolveClientName(selectedAgendaBooking.clientId, clients)}`
                            });
                          }}
                          type="button"
                        >
                          Estornar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="empty-state">
                      Selecione um atendimento na fila para abrir as acoes.
                    </p>
                  )}
                </article>
                {renderAgendaListWorkspace()}
              </aside>
            ) : null}
          </div>
        }
      />
    );
  }

  function renderCatalogView(): JSX.Element {
    const selectedService =
      services.find((service) => service.id === selectedServiceId) ?? null;
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
    const reportBuilderMenuGroups = groupReportsBuilderMenuItems(
      buildReportsBuilderMenuItems(reportsCatalog)
    );

    const lookupRows: {
      readonly service: ReportsBuilderLookupRow[];
      readonly professional: ReportsBuilderLookupRow[];
      readonly client: ReportsBuilderLookupRow[];
    } = {
      service: [...services]
        .sort((left, right) => left.nome.localeCompare(right.nome))
        .map((service) => ({
          id: service.id,
          value: service.id,
          code: service.codigo,
          primary: service.nome,
          secondary: service.status,
          searchText: `${service.codigo} ${service.nome} ${service.status} ${service.id}`
        })),
      professional: [...professionals]
        .sort((left, right) => left.nome.localeCompare(right.nome))
        .map((professional) => ({
          id: professional.id,
          value: professional.id,
          code: professional.codigo,
          primary: professional.nome,
          secondary: professional.status,
          searchText: `${professional.codigo} ${professional.nome} ${professional.status} ${professional.id}`
        })),
      client: [...clients]
        .sort((left, right) => left.nome.localeCompare(right.nome))
        .map((client) => ({
          id: client.id,
          value: client.id,
          code: client.codigo,
          primary: client.nome,
          secondary: client.telefone,
          searchText: `${client.codigo} ${client.nome} ${client.telefone} ${client.id}`
        }))
    };

    return (
      <ReportsBuilderWorkspace
        activeTabId={activeReportBuilderTabId}
        catalog={reportsCatalog}
        error={reportsBuilderError}
        isLoading={isLoadingReportsBuilder}
        isMenuOpen={isReportsMenuOpen}
        lookupRows={lookupRows}
        menuGroups={reportBuilderMenuGroups}
        onActivateTab={activateReportBuilderTab}
        onCloseMenu={() => setIsReportsMenuOpen(false)}
        onCloseTab={closeReportBuilderTab}
        onExecuteTab={(tabId) => void executeReportBuilderTab(tabId)}
        onOpenMenu={() => setIsReportsMenuOpen(true)}
        onOpenSavedDefinition={openSavedReportBuilderTab}
        onOpenSystemDefinition={openSystemReportBuilderTab}
        onSaveTab={(tabId, name, description) =>
          void saveReportBuilderTab(tabId, name, description)
        }
        onToggleMenu={() => setIsReportsMenuOpen((current) => !current)}
        onUpdateDefinition={updateReportBuilderDefinition}
        openTabs={reportBuilderTabs}
        savedModels={savedReportDefinitions}
        showMenuButton={isCompactShell}
      />
    );
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
                onChange={(event) =>
                  setClientReturnWindow(
                    event.target.value as ClientReturnWindow
                  )
                }
                value={clientReturnWindow}
              >
                <option value="30d">30 dias</option>
                <option value="60d">60 dias</option>
                <option value="90d">90 dias</option>
              </select>
            </label>

            <div className="mode-switch">
              <button
                className={
                  clientSegmentFilter === "all"
                    ? "secondary-button is-active"
                    : "secondary-button"
                }
                onClick={() => setClientSegmentFilter("all")}
                type="button"
              >
                Todos
              </button>
              <button
                className={
                  clientSegmentFilter === "returning"
                    ? "secondary-button is-active"
                    : "secondary-button"
                }
                onClick={() => setClientSegmentFilter("returning")}
                type="button"
              >
                Retorno
              </button>
              <button
                className={
                  clientSegmentFilter === "inactive"
                    ? "secondary-button is-active"
                    : "secondary-button"
                }
                onClick={() => setClientSegmentFilter("inactive")}
                type="button"
              >
                Sem retorno
              </button>
              <button
                className={
                  clientSegmentFilter === "never_completed"
                    ? "secondary-button is-active"
                    : "secondary-button"
                }
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
                    clientInsights.reduce(
                      (total, entry) => total + entry.recognizedRevenue,
                      0
                    )
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
        detailTitle={
          selectedClientInsight
            ? selectedClientInsight.client.nome
            : "Nenhum cliente selecionado"
        }
        detailDescription={
          selectedClientInsight
            ? `${formatClientSegment(resolveClientSegment(selectedClientInsight, clientReturnWindow), clientReturnWindow)} com historico recente, receita registrada e contexto de relacionamento para a operacao.`
            : "Selecione um cliente da carteira para abrir o detalhe operacional."
        }
        detail={
          selectedClientInsight ? renderSelectedClientDetail() : undefined
        }
        emptyDetail={
          <p className="empty-state">
            Selecione um cliente da carteira para abrir o detalhe operacional.
          </p>
        }
      />
    );
  }

  function renderSelectedClientDetail(): JSX.Element {
    if (!selectedClientInsight) {
      return <></>;
    }

    const segment = resolveClientSegment(
      selectedClientInsight,
      clientReturnWindow
    );

    return (
      <div className="client-detail-document">
        <div className="record-meta">
          <ViewBadge tone={resolveClientSegmentTone(segment)}>
            {formatClientSegment(segment, clientReturnWindow)}
          </ViewBadge>
          <ViewBadge tone="info">
            {selectedClientInsight.totalBookings} booking(s)
          </ViewBadge>
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
              value: selectedClientInsight.lastBooking
                ? formatDateTime(selectedClientInsight.lastBooking.startAt)
                : "Sem booking"
            },
            {
              id: "last-completed",
              label: "Ultimo concluido",
              value: selectedClientInsight.lastCompletedBooking
                ? formatDateTime(
                    selectedClientInsight.lastCompletedBooking.endAt
                  )
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
              helper: selectedClientInsight.lastCashEntry
                ? formatDateTime(selectedClientInsight.lastCashEntry.occurredAt)
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
                    <strong>
                      {resolveBookingTitle(booking, services, professionals)}
                    </strong>
                    <span
                      className={`status-pill is-${resolveBookingStatusTone(booking.status)}`}
                    >
                      {formatBookingStatus(booking.status)}
                    </span>
                  </div>
                  <div className="record-meta">
                    <span>{formatDateTime(booking.startAt)}</span>
                    <span>
                      {formatTimeRange(booking.startAt, booking.endAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="helper">
              Este cliente ainda nao possui agendamentos visiveis neste recorte.
            </p>
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
                    <span
                      className={`status-pill is-${entry.status === "open" ? "success" : "warning"}`}
                    >
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
            <p className="helper">
              Ainda nao ha movimentos financeiros visiveis para este cliente.
            </p>
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
              description: selectedClientInsight.lastBooking
                ? `${formatDateTime(selectedClientInsight.lastBooking.startAt)} | ${formatBookingStatus(selectedClientInsight.lastBooking.status)}`
                : "Nenhuma booking registrada."
            },
            {
              id: "timeline-last-completed",
              title: "Ultimo atendimento concluido",
              description: selectedClientInsight.lastCompletedBooking
                ? `${formatDateTime(selectedClientInsight.lastCompletedBooking.endAt)} | sem retorno ha ${formatDaysSince(selectedClientInsight.lastCompletedBooking.endAt)}`
                : "Cliente ainda sem atendimento concluido."
            },
            {
              id: "timeline-last-cash-entry",
              title: "Ultimo movimento financeiro",
              description: selectedClientInsight.lastCashEntry
                ? `${formatCashEntryKind(selectedClientInsight.lastCashEntry.kind)} | ${formatCurrency(selectedClientInsight.lastCashEntry.amount)}`
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
              <a
                className="secondary-button button-link"
                href={publicBookingUrl}
                rel="noreferrer"
                target="_blank"
              >
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
                value: (
                  <ViewBadge tone={paymentStatusTone}>
                    {paymentForm.status}
                  </ViewBadge>
                ),
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
                  description:
                    "Nome do negocio, slug e URL publica do booking.",
                  active: true
                },
                {
                  id: "settings-branding",
                  label: "Branding minimo",
                  description:
                    "Mensagem curta da marca e cor de destaque do tenant.",
                  active: true
                },
                {
                  id: "settings-payments",
                  label: "Pagamentos",
                  description:
                    "Mercado Pago, callbacks e modo de checkout publicado.",
                  value: paymentForm.status,
                  active: true
                },
                {
                  id: "settings-runtime",
                  label: "Ambiente do tenant",
                  description:
                    "API base, timezone e estado atual de publicacao.",
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
                  description:
                    "Cobranca da propria plataforma ainda nao fica disponivel aqui."
                },
                {
                  id: "settings-webhooks",
                  label: "Eventos e observabilidade",
                  description:
                    "URLs e credenciais existem, mas ainda nao ha painel de eventos ou health check."
                },
                {
                  id: "settings-profile-wide",
                  label: "Perfil ampliado do negocio",
                  description:
                    "Campos mais amplos do tenant ainda nao ficam centralizados nesta tela."
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
      case "financeiro":
        return renderFinanceiroView();
      case "relatorios":
        return renderReportsViewV2();
      case "operacional":
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
        return renderAgendaViewV2();
    }
  }

  const currentRouteDefinition = adminRouteDefinitions[currentRoute];
  const showTopbarEyebrow =
    currentRoute !== "profissionais" && currentRoute !== "dashboard";
  const currentRouteStageTone = resolveAdminRouteStageTone(
    currentRouteDefinition.stage
  );
  const sidebarReportsMenuGroups = groupReportsBuilderMenuItems(
    buildReportsBuilderMenuItems(reportsCatalog)
  );

  if (!sessionToken) {
    return (
      <main className="shell auth-shell">
        <section className="hero-block">
          <p className="eyebrow">AgendaAI / admin-web</p>
          <h1>Onboarding, catalogo, equipe e operacao do dia.</h1>
          <p className="description">
            O cliente final agenda pela slug publica. Aqui o owner cria o
            negocio, configura servicos, liga Mercado Pago, monta a equipe e
            acompanha a agenda operacional.
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
                  className={
                    authMode === "login"
                      ? "secondary-button is-active"
                      : "secondary-button"
                  }
                  onClick={() => setAuthMode("login")}
                  type="button"
                >
                  Login
                </button>
                <button
                  className={
                    authMode === "onboarding"
                      ? "secondary-button is-active"
                      : "secondary-button"
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
                onChange={(event) =>
                  setApiBaseUrl(resolveAdminApiBaseUrl(event.target.value))
                }
              />
            </label>

            {feedback ? (
              <div className={`feedback-banner is-${feedback.tone}`}>
                {feedback.message}
              </div>
            ) : null}

            {authMode === "login" ? (
              <form className="stack-form" onSubmit={handleLogin}>
                <label className="field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm({ ...loginForm, email: event.target.value })
                    }
                  />
                </label>
                <label className="field">
                  <span>Senha</span>
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm({
                        ...loginForm,
                        password: event.target.value
                      })
                    }
                  />
                </label>
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
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
                        setOnboardingForm({
                          ...onboardingForm,
                          nome: event.target.value
                        })
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
                        setOnboardingForm({
                          ...onboardingForm,
                          timezone: event.target.value
                        })
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
                        setOnboardingForm({
                          ...onboardingForm,
                          adminNome: event.target.value
                        })
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
                        setOnboardingForm({
                          ...onboardingForm,
                          adminEmail: event.target.value
                        })
                      }
                    />
                  </label>
                  <label className="field">
                    <span>Telefone</span>
                    <input
                      type="tel"
                      value={onboardingForm.adminTelefone}
                      onChange={(event) =>
                        setOnboardingForm({
                          ...onboardingForm,
                          adminTelefone: event.target.value
                        })
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
                        setOnboardingForm({
                          ...onboardingForm,
                          senha: event.target.value
                        })
                      }
                    />
                  </label>
                </div>
                <button
                  className="primary-button"
                  disabled={isBusy}
                  type="submit"
                >
                  {isBusy ? "Criando..." : "Criar negocio e entrar"}
                </button>
              </form>
            )}
          </article>

          <aside className="panel aside-panel">
            <div className="list-card">
              <strong>Duas visoes</strong>
              <p>
                Booking publico para o cliente e shell admin para implantar e
                operar o negocio.
              </p>
            </div>
            <div className="list-card">
              <strong>Credenciais demo</strong>
              <p>
                `owner@agendaai.demo` com `agendaai-demo` depois da seed do
                `api-rest`.
              </p>
            </div>
            <div className="list-card">
              <strong>Ponto atual</strong>
              <p>
                Checkout Pro publico ligado e agenda admin entrando em operacao.
              </p>
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

        <aside className={`admin-sidebar-v2${isSidebarOpen ? " is-open" : ""}`}>
          <div className="admin-sidebar-brand">
            <div className="admin-sidebar-brand-main">
              <div className="admin-sidebar-brand-mark">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div className="admin-sidebar-brand-copy">
                <span>Shell administrativo</span>
                <strong>AgendaAI</strong>
              </div>
            </div>
            <span className="admin-sidebar-brand-chip">
              {tenant?.slug ? `/${tenant.slug}` : "Sem slug"}
            </span>
          </div>

          <div className="admin-sidebar-tenant-card">
            <div className="admin-sidebar-tenant-copy">
              <strong>{tenant?.nome ?? "Tenant administrativo"}</strong>
              <span>
                {tenant
                  ? `${tenant.timezone ?? "Timezone pendente"} • ${publicBookingUrl ? "booking publicado" : "booking pendente"}`
                  : "Conecte um tenant para liberar os modulos operacionais."}
              </span>
            </div>
            {publicBookingUrl ? (
              <a
                className="admin-sidebar-tenant-link"
                href={publicBookingUrl}
                rel="noreferrer"
                target="_blank"
              >
                Abrir booking publico
              </a>
            ) : null}
          </div>

          <nav className="admin-sidebar-nav no-scrollbar">
            {adminNavigationSections.map((section) => (
              <div className="admin-sidebar-group" key={section.label}>
                <div className="admin-sidebar-group-header">
                  <p className="admin-sidebar-group-label">{section.label}</p>
                  <span className="admin-sidebar-group-count">
                    {section.routes.length}
                  </span>
                </div>
                {section.routes.map((route) => {
                  const definition = adminRouteDefinitions[route];
                  const Icon = definition.icon;
                  const sidebarButton = (
                    <button
                      className={
                        currentRoute === route
                          ? "admin-sidebar-link is-active"
                          : "admin-sidebar-link"
                      }
                      key={route}
                      onClick={() => navigateTo(route)}
                      title={definition.label}
                      type="button"
                    >
                      <span className="admin-sidebar-link-icon">
                        <Icon className="w-5 h-5" />
                      </span>
                      <span className="admin-sidebar-link-copy">
                        <small>
                          {definition.shortLabel} /{" "}
                          {formatAdminRouteStage(definition.stage)}
                        </small>
                        <strong>{definition.label}</strong>
                        <span>{definition.title}</span>
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
                            <span>
                              Escolha a visao gerencial que quer abrir no
                              workspace.
                            </span>
                          </div>

                          {sidebarReportsMenuGroups.map(([group, items]) => (
                            <section
                              className="admin-sidebar-flyout-group"
                              key={group}
                            >
                              <span className="admin-sidebar-flyout-group-title">
                                {group}
                              </span>
                              <div className="admin-sidebar-flyout-items">
                                {items.map((item) => (
                                  <button
                                    className="admin-sidebar-flyout-item"
                                    key={item.code}
                                    onClick={() =>
                                      openSystemReportBuilderTab(item.code)
                                    }
                                    type="button"
                                  >
                                    <div className="admin-sidebar-flyout-item-row">
                                      <strong>{item.label}</strong>
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
            <div className="admin-topbar-shell-row">
              <div className="admin-topbar-main">
                <button
                  className="admin-topbar-menu"
                  onClick={() => setIsSidebarOpen(true)}
                  type="button"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="admin-topbar-route">
                  {showTopbarEyebrow ? (
                    <span className="admin-topbar-eyebrow">
                      {currentRouteDefinition.eyebrow}
                    </span>
                  ) : null}
                  <div className="admin-topbar-route-heading">
                    <strong>{currentRouteDefinition.title}</strong>
                    <ViewBadge tone={currentRouteStageTone}>
                      {formatAdminRouteStage(currentRouteDefinition.stage)}
                    </ViewBadge>
                  </div>
                  <p>{currentRouteDefinition.description}</p>
                </div>
              </div>

              <div className="admin-topbar-actions">
                <button
                  aria-label="Abrir clientes para buscar cliente"
                  className={
                    "admin-icon-button admin-topbar-utility"
                  }
                  onClick={openClientsDirectoryFromShell}
                  title="Buscar cliente"
                  type="button"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  aria-label="Abrir painel rapido"
                  className={
                    isShellPulseOpen
                      ? "admin-icon-button admin-topbar-utility is-active"
                      : "admin-icon-button admin-topbar-utility"
                  }
                  data-count={
                    shellAttentionCount > 0
                      ? Math.min(shellAttentionCount, 99)
                      : undefined
                  }
                  onClick={toggleShellPulsePanel}
                  title="Alertas"
                  type="button"
                >
                  <Bell className="w-5 h-5" />
                </button>
                {tenant ? (
                  <button
                    aria-label="Abrir contexto"
                    className={
                      isShellContextOpen
                        ? "admin-icon-button admin-topbar-utility is-active"
                        : "admin-icon-button admin-topbar-utility"
                    }
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
                  onClick={() => openCounterBookingModal()}
                  title="Novo agendamento"
                  type="button"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div
                  aria-label={`Perfil ${sidebarProfileName}`}
                  className="admin-topbar-avatar"
                  title={sidebarProfileName}
                >
                  {resolveProfessionalInitials(sidebarProfileName)}
                </div>
              </div>
            </div>

            <div className="admin-workspace-bar">
              <div
                aria-label="Abas do workspace"
                className="admin-route-strip"
                role="tablist"
              >
                {openRouteTabs.map((route) => {
                  const definition = adminRouteDefinitions[route];

                  return (
                    <div
                      aria-selected={currentRoute === route}
                      className={
                        currentRoute === route
                          ? "admin-route-tab is-active"
                          : "admin-route-tab"
                      }
                      key={route}
                      role="tab"
                    >
                      <button
                        className="admin-route-tab-trigger"
                        onClick={() => navigateTo(route)}
                        type="button"
                      >
                        <span className="admin-route-tab-dot" />
                        <span className="admin-route-tab-label">
                          {definition.label}
                        </span>
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

              <div className="admin-workspace-meta">
                <span className="admin-workspace-meta-item">
                  <span className="admin-workspace-meta-label">Tenant</span>
                  <strong>{tenant?.nome ?? sidebarProfileName}</strong>
                </span>
                <span className="admin-workspace-meta-item">
                  <span className="admin-workspace-meta-label">Slug</span>
                  <strong>{tenant?.slug ? `/${tenant.slug}` : "Pendente"}</strong>
                </span>
                {publicBookingUrl ? (
                  <a
                    className="admin-workspace-link"
                    href={publicBookingUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Abrir booking
                  </a>
                ) : null}
              </div>
            </div>
          </header>

          <section
            className={
              currentRoute === "profissionais"
                ? "admin-stage-content is-professionals-route"
                : "admin-stage-content"
            }
          >
            <section className="admin-content">
              {feedback ? (
                <div className={`feedback-banner is-${feedback.tone}`}>
                  {feedback.message}
                </div>
              ) : null}
              {bootError ? (
                <div className="feedback-banner is-error">{bootError}</div>
              ) : null}
              {renderCurrentView()}
            </section>
          </section>
        </div>
      </main>
      {renderShellPulsePanel()}
      {renderShellContextPanel()}
      {renderCounterBookingModal()}
      {renderAgendaBookingModal()}
      {renderCashflowFilterModal()}
      {renderAgendaFilterModal()}
      {renderFinanceModal()}
      {renderFinanceActionDialogs()}
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
    defaultInstallments: settings.defaultInstallments
      ? String(settings.defaultInstallments)
      : "1",
    expirationMinutes: settings.expirationMinutes
      ? String(settings.expirationMinutes)
      : "30",
    binaryMode: settings.binaryMode
  };
}

function toBrandingForm(branding?: {
  tagline?: string;
  accentColor?: string;
}): BrandingFormState {
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
    fixedAmount: service.paymentPolicy.fixedAmount
      ? String(service.paymentPolicy.fixedAmount)
      : "",
    percentage: service.paymentPolicy.percentage
      ? String(service.paymentPolicy.percentage)
      : "30",
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
  status: ServiceStatus;
} {
  const precoBase = parseRequiredNumber(form.precoBase, "precoBase");
  const percentage =
    form.chargeType === "percentage"
      ? (parseOptionalNumber(form.percentage) ??
        (form.collectionMode === "full" ? 100 : 30))
      : undefined;
  const fixedAmount =
    form.chargeType === "fixed"
      ? (parseOptionalNumber(form.fixedAmount) ?? precoBase)
      : undefined;

  return {
    nome: form.nome.trim(),
    duracaoMin: parseRequiredInteger(form.duracaoMin, "duracaoMin"),
    precoBase,
    exigeSinal: form.collectionMode !== "none",
    status: form.status,
    paymentPolicy: {
      ...defaultServicePaymentPolicy,
      collectionMode: form.collectionMode,
      provider: form.collectionMode === "none" ? undefined : "mercado_pago",
      checkoutMode:
        form.collectionMode === "none" ? undefined : form.checkoutMode,
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
    today: bookings.filter((booking) =>
      isSameCalendarDay(booking.startAt, new Date())
    ).length,
    open: bookings.filter((booking) => isOpenBookingStatus(booking.status))
      .length,
    confirmed: bookings.filter((booking) => booking.status === "confirmado")
      .length,
    completed: bookings.filter((booking) => booking.status === "concluido")
      .length
  };
}

function filterBookingsByRange(
  bookings: readonly Booking[],
  range: DashboardRange,
  offsetPeriods = 0
): Booking[] {
  if (range === "all") {
    return [...bookings].sort((left, right) =>
      right.startAt.localeCompare(left.startAt)
    );
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
      if (
        professionalFilter !== "all" &&
        booking.professionalId !== professionalFilter
      ) {
        return false;
      }
      return true;
    })
    .sort((left, right) => right.startAt.localeCompare(left.startAt));
}

function filterBookingsByDate(
  bookings: readonly Booking[],
  date: string
): Booking[] {
  return [...bookings]
    .filter((booking) => extractDatePart(booking.startAt) === date)
    .sort((left, right) => left.startAt.localeCompare(right.startAt));
}

function summarizeDayBookings(bookings: readonly Booking[]): DayBookingSummary {
  return {
    total: bookings.length,
    open: bookings.filter((booking) => isOpenBookingStatus(booking.status))
      .length,
    confirmed: bookings.filter((booking) => booking.status === "confirmado")
      .length
  };
}

function filterBookingsByDates(
  bookings: readonly Booking[],
  dates: readonly string[]
): Booking[] {
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
  const monthStart = new Date(
    anchor.getFullYear(),
    anchor.getMonth(),
    1,
    12,
    0,
    0
  );
  const monthEnd = new Date(
    anchor.getFullYear(),
    anchor.getMonth() + 1,
    0,
    12,
    0,
    0
  );
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const cells: MonthCalendarCell[] = [];
  for (
    let cursor = new Date(gridStart);
    cursor <= gridEnd;
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const date = formatDateInputValue(cursor);
    const dayBookings = bookings
      .filter((booking) => extractDatePart(booking.startAt) === date)
      .filter((booking) =>
        professionalFilter === "all"
          ? true
          : booking.professionalId === professionalFilter
      )
      .sort((left, right) => left.startAt.localeCompare(right.startAt));
    const weekday = new Date(`${date}T12:00:00`).getDay();
    const totalMinutes = professionals.reduce((total, professional) => {
      const rule = availabilityByProfessional[professional.id]?.find(
        (item) => item.weekday === weekday
      );
      return total + calculateRuleDurationMinutes(rule);
    }, 0);

    cells.push({
      date,
      inCurrentMonth: cursor.getMonth() === anchor.getMonth(),
      bookings: dayBookings,
      bookingsCount: dayBookings.length,
      openBookings: dayBookings.filter((booking) =>
        isOpenBookingStatus(booking.status)
      ).length,
      completedBookings: dayBookings.filter(
        (booking) => booking.status === "concluido"
      ).length,
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
  const rule = availabilityByProfessional[professionalId]?.find(
    (item) => item.weekday === weekday
  );
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
    bookedMinutes: cellBookings.reduce(
      (total, booking) => total + calculateBookingDurationMinutes(booking),
      0
    ),
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
            availabilityByProfessional[professional.id]?.find(
              (rule) => rule.weekday === weekday
            )
          ),
        0
      )
    );
  }, 0);
  const bookedMinutes = bookings
    .filter((booking) => booking.status !== "cancelado")
    .reduce(
      (total, booking) => total + calculateBookingDurationMinutes(booking),
      0
    );

  return {
    totalMinutes,
    bookedMinutes,
    freeMinutes: Math.max(totalMinutes - bookedMinutes, 0),
    bookingsCount: bookings.length,
    openBookings: bookings.filter((booking) =>
      isOpenBookingStatus(booking.status)
    ).length
  };
}

function summarizeMonthCapacity(
  cells: readonly MonthCalendarCell[]
): WeekCapacitySummary {
  return cells.reduce<WeekCapacitySummary>(
    (summary, cell) => ({
      totalMinutes: summary.totalMinutes + cell.totalMinutes,
      bookedMinutes: summary.bookedMinutes + cell.bookedMinutes,
      freeMinutes:
        summary.freeMinutes +
        Math.max(cell.totalMinutes - cell.bookedMinutes, 0),
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
      (booking) =>
        extractDatePart(booking.startAt) === date &&
        booking.status !== "cancelado"
    );
    const totalMinutes = professionals.reduce((total, professional) => {
      const rule = availabilityByProfessional[professional.id]?.find(
        (item) => item.weekday === weekday
      );
      return total + calculateRuleDurationMinutes(rule);
    }, 0);

    return {
      date,
      totalMinutes,
      bookedMinutes: dayBookings.reduce(
        (total, booking) => total + calculateBookingDurationMinutes(booking),
        0
      ),
      bookingsCount: dayBookings.length,
      openBookings: dayBookings.filter((booking) =>
        isOpenBookingStatus(booking.status)
      ).length
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
    const professionalBookings = bookings.filter(
      (booking) => booking.professionalId === professional.id
    );
    const totalMinutes = dates.reduce((total, date) => {
      const weekday = new Date(`${date}T12:00:00`).getDay();
      const rule = availabilityByProfessional[professional.id]?.find(
        (item) => item.weekday === weekday
      );
      return total + calculateRuleDurationMinutes(rule);
    }, 0);
    const bookedMinutes = professionalBookings
      .filter((booking) => booking.status !== "cancelado")
      .reduce(
        (total, booking) => total + calculateBookingDurationMinutes(booking),
        0
      );

    return {
      professionalId: professional.id,
      professionalName: professional.nome,
      totalMinutes,
      bookedMinutes,
      bookingsCount: professionalBookings.length,
      openBookings: professionalBookings.filter((booking) =>
        isOpenBookingStatus(booking.status)
      ).length
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
      const completedBookings = clientBookings.filter(
        (booking) => booking.status === "concluido"
      );
      const clientCashEntries = cashEntries
        .filter(
          (entry) => entry.clientId === client.id && entry.status === "open"
        )
        .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
      const recognizedRevenue = completedBookings.reduce(
        (total, booking) =>
          total +
          resolveRecognizedRevenueAmount(booking, services, cashEntries),
        0
      );

      return {
        client,
        totalBookings: clientBookings.length,
        openBookings: clientBookings.filter((booking) =>
          isOpenBookingStatus(booking.status)
        ).length,
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
        return {
          ...summary,
          returningCount: summary.returningCount + 1,
          activeCount: summary.activeCount + 1
        };
      }
      if (segment === "inactive") {
        return {
          ...summary,
          inactiveCount: summary.inactiveCount + 1,
          activeCount: summary.activeCount + 1
        };
      }
      return {
        ...summary,
        neverCompletedCount: summary.neverCompletedCount + 1
      };
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

  const daysSinceLastCompleted = calculateDaysSinceIso(
    entry.lastCompletedBooking.endAt
  );
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
      const professional = professionals.find(
        (item) => item.id === booking.professionalId
      );
      const client = clients.find((item) => item.id === booking.clientId);
      const paymentIntent = paymentIntents.find(
        (item) => item.bookingId === booking.id
      );
      const recognizedCashEntry = findOpenCashEntry(
        cashEntries,
        booking.id,
        "recognized_revenue"
      );
      const onlinePaymentCashEntry = findOpenCashEntry(
        cashEntries,
        booking.id,
        "online_payment"
      );

      return {
        booking,
        service,
        professional,
        client,
        paymentIntent,
        recognizedCashEntry,
        onlinePaymentCashEntry,
        recognizedAmount: resolveRecognizedRevenueAmount(
          booking,
          services,
          cashEntries
        ),
        approvedOnlineAmount: resolveApprovedOnlineAmount(
          booking,
          paymentIntent,
          cashEntries
        )
      };
    })
    .sort((left, right) =>
      right.booking.endAt.localeCompare(left.booking.endAt)
    );
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
  const cashEntryAmount = findOpenCashEntry(
    cashEntries,
    booking.id,
    "online_payment"
  )?.amount;
  if (cashEntryAmount !== undefined) {
    return cashEntryAmount;
  }

  return paymentIntent && isApprovedPaymentIntent(paymentIntent.status)
    ? paymentIntent.amount
    : 0;
}

function summarizeRevenueEntries(
  entries: readonly RevenueEntry[],
  bookings: readonly Booking[]
): DashboardRevenueSummary {
  const recognizedRevenue = entries.reduce(
    (total, entry) => total + entry.recognizedAmount,
    0
  );
  const approvedOnlineRevenue = entries.reduce(
    (total, entry) => total + entry.approvedOnlineAmount,
    0
  );
  const completedCount = entries.length;
  const uniqueClients = new Set(entries.map((entry) => entry.booking.clientId))
    .size;
  const noShowCount = bookings.filter(
    (booking) => booking.status === "faltou"
  ).length;
  const cancelledCount = bookings.filter(
    (booking) => booking.status === "cancelado"
  ).length;

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
  const completedBookings = bookings.filter(
    (booking) => booking.status === "concluido"
  );
  const recognizedRevenue = completedBookings.reduce((total, booking) => {
    return (
      total + resolveRecognizedRevenueAmount(booking, services, cashEntries)
    );
  }, 0);
  const approvedOnlineRevenue = completedBookings.reduce((total, booking) => {
    const paymentIntent = paymentIntents.find(
      (item) => item.bookingId === booking.id
    );
    return (
      total + resolveApprovedOnlineAmount(booking, paymentIntent, cashEntries)
    );
  }, 0);

  return {
    bookingsCount: bookings.length,
    completedCount: completedBookings.length,
    cancelledCount: bookings.filter((booking) => booking.status === "cancelado")
      .length,
    noShowCount: bookings.filter((booking) => booking.status === "faltou")
      .length,
    recognizedRevenue,
    approvedOnlineRevenue,
    averageTicket:
      completedBookings.length > 0
        ? recognizedRevenue / completedBookings.length
        : 0,
    uniqueClients: new Set(bookings.map((booking) => booking.clientId)).size
  };
}

function buildServiceReportSummaries(
  bookings: readonly Booking[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportGroupSummary[] {
  const grouped = new Map<
    string,
    ReportGroupSummary & { readonly clientIds: Set<string> }
  >();

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
    const paymentIntent = paymentIntents.find(
      (item) => item.bookingId === booking.id
    );
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

function buildProfessionalReportSummaries(
  bookings: readonly Booking[],
  professionals: readonly Professional[],
  services: readonly Service[],
  paymentIntents: readonly PaymentIntent[],
  cashEntries: readonly CashEntry[]
): ReportGroupSummary[] {
  const grouped = new Map<
    string,
    ReportGroupSummary & { readonly clientIds: Set<string> }
  >();

  for (const booking of bookings) {
    const professional = professionals.find(
      (item) => item.id === booking.professionalId
    );
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
    const paymentIntent = paymentIntents.find(
      (item) => item.bookingId === booking.id
    );
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
    const dayBookings = bookings.filter(
      (booking) => extractDatePart(booking.startAt) === dateKey
    );
    const recognizedRevenue = dayBookings.reduce((total, booking) => {
      if (booking.status !== "concluido") {
        return total;
      }
      return (
        total + resolveRecognizedRevenueAmount(booking, services, cashEntries)
      );
    }, 0);

    points.push({
      label: new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit"
      }).format(anchor),
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
  return (
    booking.status === "pendente" ||
    booking.status === "aguardando pagamento" ||
    booking.status === "confirmado"
  );
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
  const professional = professionals.find(
    (item) => item.id === booking.professionalId
  );
  return `${service?.nome ?? "Servico"} - ${professional?.nome ?? "Profissional"}`;
}

function resolveClientName(
  clientId: string,
  clients: readonly Client[]
): string {
  return clients.find((client) => client.id === clientId)?.nome ?? "Cliente";
}

function resolveClientPhone(
  clientId: string,
  clients: readonly Client[]
): string {
  return (
    clients.find((client) => client.id === clientId)?.telefone ?? "Sem telefone"
  );
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

function formatBankMovementType(type: BankMovement["tipo"]): string {
  switch (type) {
    case "entrada":
      return "Entrada";
    case "saida":
      return "Saida";
    case "transferencia":
      return "Transferencia";
    case "ajuste":
      return "Ajuste";
    case "taxa":
      return "Taxa";
    case "estorno":
      return "Estorno";
    default:
      return type;
  }
}

function resolveBankLabel(
  bankId: string | undefined,
  banks: readonly Bank[]
): string | undefined {
  if (!bankId) {
    return undefined;
  }
  const bank = banks.find((entry) => entry.id === bankId);
  if (!bank) {
    return undefined;
  }
  return `${bank.codigo} | ${bank.nomeBanco} ${bank.agencia}/${bank.conta}`;
}

function formatBankMovementStatus(status: BankMovement["status"]): string {
  switch (status) {
    case "previsto":
      return "Previsto";
    case "lancado":
      return "Lancado";
    case "estornado":
      return "Estornado";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
}

function formatBankMovementSource(
  sourceType: BankMovement["sourceType"]
): string {
  switch (sourceType) {
    case "revenue_schedule":
      return "Receita";
    case "expense_schedule":
      return "Despesa";
    case "cash_entry":
      return "Agenda";
    case "transfer":
      return "Transferencia";
    case "manual_receipt":
      return "Recebimento manual";
    case "manual_payment":
      return "Pagamento manual";
    case "manual_adjustment":
      return "Ajuste manual";
    case "fee":
      return "Taxa";
    case "cash_close":
      return "Fechar caixa";
    case "reversal":
      return "Estorno";
    case "booking":
      return "Booking";
    default:
      return sourceType;
  }
}

function isOpenBookingStatus(status: Booking["status"]): boolean {
  return (
    status === "pendente" ||
    status === "aguardando pagamento" ||
    status === "confirmado"
  );
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

function formatLocalDateTimeOffsetValue(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  const seconds = String(value.getSeconds()).padStart(2, "0");
  const offsetMinutes = -value.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0");
  const offsetRemainder = String(absoluteOffset % 60).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetRemainder}`;
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
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0
  ).getDate();
  date.setDate(Math.min(dayOfMonth, lastDay));
  return formatDateInputValue(date);
}

function formatAgendaDayLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(`${value}T12:00:00`));
}

function formatAgendaMonthLabel(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateShort(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(`${value}T12:00:00`));
}

function formatClockTime(value: string): string {
  const normalizedValue = value.includes("T")
    ? new Date(value)
    : new Date(`2000-01-01T${value.length === 5 ? `${value}:00` : value}`);
  return new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" }).format(
    normalizedValue
  );
}

function formatTimeRange(startAt: string, endAt: string): string {
  const formatter = new Intl.DateTimeFormat("pt-BR", { timeStyle: "short" });
  return `${formatter.format(new Date(startAt))} - ${formatter.format(new Date(endAt))}`;
}

function formatAgendaWeekLabel(dates: readonly string[]): string {
  if (dates.length === 0) {
    return "Semana sem datas";
  }

  const formatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short"
  });
  const startLabel = formatter.format(new Date(`${dates[0]}T12:00:00`));
  const endLabel = formatter.format(
    new Date(`${dates[dates.length - 1]}T12:00:00`)
  );
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

function resolveCounterBookingStepValidationMessage(
  step: CounterBookingStep
): string {
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

function resolveNextCounterBookingStep(
  step: CounterBookingStep
): CounterBookingStep | null {
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

function resolvePreviousCounterBookingStep(
  step: CounterBookingStep
): CounterBookingStep | null {
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
  return calculateClockDurationMinutes(
    rule.faixa.startTime,
    rule.faixa.endTime
  );
}

function calculateClockDurationMinutes(
  startTime: string,
  endTime: string
): number {
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

function formatUtilization(
  bookedMinutes: number,
  totalMinutes: number
): string {
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

function resolveUtilizationTone(
  bookedMinutes: number,
  totalMinutes: number
): string {
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
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "AG";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
}

function resolveServiceName(
  serviceId: string,
  services: readonly Service[]
): string {
  return (
    services.find((service) => service.id === serviceId)?.nome ?? "Servico"
  );
}

function resolveProfessionalName(
  professionalId: string,
  professionals: readonly Professional[]
): string {
  return (
    professionals.find((professional) => professional.id === professionalId)
      ?.nome ?? "Profissional"
  );
}

function getSupportedProfessionalsForService(
  professionals: readonly Professional[],
  serviceId: string
): Professional[] {
  if (!serviceId) {
    return [...professionals];
  }

  return professionals.filter((professional) =>
    professional.especialidades.includes(serviceId)
  );
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
    .map(
      (serviceId) => services.find((service) => service.id === serviceId)?.nome
    )
    .filter((value): value is string => Boolean(value));
}

function resolveProfessionalSummaryLine(
  serviceNames: readonly string[]
): string {
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

function formatServiceStatus(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized === "active" || normalized === "ativo") {
    return "Ativo";
  }
  if (normalized === "inactive" || normalized === "inativo") {
    return "Inativo";
  }
  if (!status.trim()) {
    return "Sem status";
  }

  return `${status.trim().slice(0, 1).toUpperCase()}${status.trim().slice(1)}`;
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

function resolveAvailabilitySummary(
  rules: readonly AvailabilityRule[]
): string {
  if (!rules.length) {
    return "Sem horarios";
  }

  return `${rules.length} dia(s) ativos`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function toggleArrayValue<T extends string>(
  items: readonly T[],
  candidate: T
): T[] {
  return items.includes(candidate)
    ? items.filter((item) => item !== candidate)
    : [...items, candidate];
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
  return error instanceof Error
    ? error.message
    : "Falha inesperada na operacao administrativa.";
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
