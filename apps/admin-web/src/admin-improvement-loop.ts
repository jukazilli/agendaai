import type { AdminRole } from "@agendaai/contracts";

import type { AdminRoute, PersonaBlueprintId } from "./admin-shell-config";

export type ImprovementModule =
  | "shell"
  | "dashboard"
  | "agenda"
  | "financeiro"
  | "clientes"
  | "catalogo"
  | "profissionais"
  | "relatorios"
  | "booking-web";

export type ImprovementTaskStatus =
  | "backlog"
  | "active"
  | "validated"
  | "done";

export type ValidationMethod = "docs" | "search" | "lint" | "build" | "browser";
export type ValidationStatus = "pending" | "passed" | "failed";

export interface ImprovementTask {
  readonly id: string;
  readonly wave: number;
  readonly title: string;
  readonly module: ImprovementModule;
  readonly targetRoles: readonly AdminRole[];
  readonly targetPersonas: readonly PersonaBlueprintId[];
  readonly routeScope: readonly AdminRoute[];
  readonly status: ImprovementTaskStatus;
  readonly confusion: 1 | 2 | 3 | 4 | 5;
  readonly frequency: 1 | 2 | 3 | 4 | 5;
  readonly revenueImpact: 1 | 2 | 3 | 4 | 5;
  readonly dependencyRisk: 1 | 2 | 3 | 4 | 5;
  readonly outcome: string;
}

export interface TheoryRecord {
  readonly id: string;
  readonly wave: number;
  readonly module: ImprovementModule;
  readonly targetPersonas: readonly PersonaBlueprintId[];
  readonly routeScope: readonly AdminRoute[];
  readonly mainJob: string;
  readonly whyCurrentUiFails: string;
  readonly chosenPattern: string;
  readonly acceptanceCriteria: readonly string[];
  readonly externalReferences: readonly string[];
}

export interface ValidationRecord {
  readonly id: string;
  readonly wave: number;
  readonly date: string;
  readonly scope: string;
  readonly method: ValidationMethod;
  readonly status: ValidationStatus;
  readonly evidence: string;
}

export const adminFrontendImprovementBacklog = [
  {
    id: "wave-01-personas-rbac-shell",
    wave: 1,
    title: "Personas, capability matrix e navegacao por papel",
    module: "shell",
    targetRoles: ["owner", "manager", "staff"],
    targetPersonas: [
      "owner-operator",
      "manager-front-desk",
      "staff-collaborator"
    ],
    routeScope: [
      "dashboard",
      "financeiro",
      "relatorios",
      "agenda",
      "catalogo",
      "profissionais",
      "clientes",
      "configuracoes"
    ],
    status: "active",
    confusion: 5,
    frequency: 5,
    revenueImpact: 5,
    dependencyRisk: 5,
    outcome:
      "Separar cockpit, operacao e governanca antes de aprofundar as telas."
  },
  {
    id: "wave-02-dashboard",
    wave: 2,
    title: "Dashboard owner cockpit com cashflow-first",
    module: "dashboard",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "manager-front-desk"],
    routeScope: ["dashboard"],
    status: "backlog",
    confusion: 4,
    frequency: 4,
    revenueImpact: 5,
    dependencyRisk: 4,
    outcome: "Deixar o dashboard como leitura executiva, nao como tela mista."
  },
  {
    id: "wave-03-agenda",
    wave: 3,
    title: "Agenda operacional com calendario dominante e acoes no topo",
    module: "agenda",
    targetRoles: ["owner", "manager", "staff"],
    targetPersonas: [
      "owner-operator",
      "manager-front-desk",
      "staff-collaborator"
    ],
    routeScope: ["agenda"],
    status: "backlog",
    confusion: 5,
    frequency: 5,
    revenueImpact: 5,
    dependencyRisk: 4,
    outcome:
      "Transformar a agenda no centro operacional sem ruido de implantacao."
  },
  {
    id: "wave-04-financeiro",
    wave: 4,
    title: "Financeiro browse plus documento com baixa e reversao claras",
    module: "financeiro",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "finance-admin"],
    routeScope: ["financeiro"],
    status: "backlog",
    confusion: 4,
    frequency: 4,
    revenueImpact: 5,
    dependencyRisk: 4,
    outcome:
      "Apoiar recebimento, pagamento e fechamento sem formularios espalhados."
  },
  {
    id: "wave-05-clientes",
    wave: 5,
    title: "Clientes em master-detail com retenção e receita",
    module: "clientes",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "manager-front-desk"],
    routeScope: ["clientes"],
    status: "backlog",
    confusion: 4,
    frequency: 4,
    revenueImpact: 4,
    dependencyRisk: 3,
    outcome: "Entregar CRM basico orientado ao retorno do cliente."
  },
  {
    id: "wave-06-catalogo",
    wave: 6,
    title: "Catalogo com browse denso e popup de registro",
    module: "catalogo",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "manager-front-desk"],
    routeScope: ["catalogo"],
    status: "backlog",
    confusion: 3,
    frequency: 4,
    revenueImpact: 4,
    dependencyRisk: 3,
    outcome:
      "Organizar servicos como cadastro base sem competir com a agenda."
  },
  {
    id: "wave-07-profissionais",
    wave: 7,
    title: "Profissionais em master-detail com frentes de servicos e agenda",
    module: "profissionais",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "manager-front-desk"],
    routeScope: ["profissionais"],
    status: "backlog",
    confusion: 3,
    frequency: 4,
    revenueImpact: 4,
    dependencyRisk: 3,
    outcome:
      "Separar cadastro, servicos e disponibilidade em workspaces consistentes."
  },
  {
    id: "wave-08-relatorios",
    wave: 8,
    title: "Relatorios com builder, dock tabs e sem hero redundante",
    module: "relatorios",
    targetRoles: ["owner", "manager"],
    targetPersonas: ["owner-operator", "manager-front-desk"],
    routeScope: ["relatorios"],
    status: "backlog",
    confusion: 3,
    frequency: 3,
    revenueImpact: 4,
    dependencyRisk: 3,
    outcome:
      "Concentrar leitura gerencial em workspace dedicado sem disputar a operacao."
  },
  {
    id: "wave-09-booking-web",
    wave: 9,
    title: "Adocao do booking-web apos estabilizar o admin",
    module: "booking-web",
    targetRoles: ["owner", "manager", "staff"],
    targetPersonas: ["public-client"],
    routeScope: [],
    status: "backlog",
    confusion: 3,
    frequency: 5,
    revenueImpact: 5,
    dependencyRisk: 2,
    outcome: "Finalizar jornada publica mobile-first sem vazamento do backoffice."
  }
] as const satisfies ReadonlyArray<ImprovementTask>;

export const adminFrontendTheoryRecords = [
  {
    id: "theory-wave-01-shell-rbac",
    wave: 1,
    module: "shell",
    targetPersonas: [
      "owner-operator",
      "manager-front-desk",
      "staff-collaborator"
    ],
    routeScope: [
      "dashboard",
      "financeiro",
      "relatorios",
      "agenda",
      "catalogo",
      "profissionais",
      "clientes",
      "configuracoes"
    ],
    mainJob:
      "Abrir cada papel ja dentro do workspace certo, sem menu poluido ou acao morta.",
    whyCurrentUiFails:
      "O shell trata owner, manager e staff como o mesmo operador, o que aumenta carga cognitiva, polui navegacao e enfraquece a leitura do produto como ferramenta poderosa.",
    chosenPattern:
      "Capability matrix local, rotas filtradas por papel, default route por papel e simulacao DEV sem alterar contratos do backend.",
    acceptanceCriteria: [
      "Owner continua com shell completo.",
      "Manager perde configuracoes sensiveis, mas mantem operacao, leitura gerencial e financeiro.",
      "Staff entra direto em agenda e nao ve modulos administrativos.",
      "Navegacao nao exibe rota ou acao sem permissao.",
      "O papel efetivo pode ser inspecionado e simulado em DEV."
    ],
    externalReferences: [
      "https://squareup.com/help/us/en/article/5194-create-and-edit-team-members",
      "https://www.mindbodyonline.com/business/education/support",
      "https://tdn.totvs.com"
    ]
  }
] as const satisfies ReadonlyArray<TheoryRecord>;

export const adminFrontendValidationPlan = [
  {
    id: "wave-01-docs-check",
    wave: 1,
    date: "2026-03-30",
    scope: "Personas, shell e RBAC do admin",
    method: "docs",
    status: "pending",
    evidence: "Validar aderencia com docs/03_navegacao_e_shell e ADR de auth."
  },
  {
    id: "wave-01-search-check",
    wave: 1,
    date: "2026-03-30",
    scope: "Permissoes e padroes operacionais de referencia",
    method: "search",
    status: "pending",
    evidence: "Registrar search log oficial para Square, Mindbody e TOTVS."
  },
  {
    id: "wave-01-lint",
    wave: 1,
    date: "2026-03-30",
    scope: "admin-web",
    method: "lint",
    status: "pending",
    evidence: "pnpm --filter @agendaai/admin-web lint"
  },
  {
    id: "wave-01-build",
    wave: 1,
    date: "2026-03-30",
    scope: "admin-web",
    method: "build",
    status: "pending",
    evidence: "pnpm --filter @agendaai/admin-web build"
  },
  {
    id: "wave-01-browser",
    wave: 1,
    date: "2026-03-30",
    scope: "Owner, manager e staff em shell real",
    method: "browser",
    status: "pending",
    evidence: "Smoke local com bootstrap real e override DEV para role."
  }
] as const satisfies ReadonlyArray<ValidationRecord>;
