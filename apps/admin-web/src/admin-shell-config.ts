import {
  BookOpen,
  CalendarDays,
  DollarSign,
  LayoutDashboard,
  ListTodo,
  Settings,
  TrendingUp,
  UserCircle,
  Users,
  type LucideIcon
} from "lucide-react";

import { adminRoles, type AdminRole } from "@agendaai/contracts";

export type AdminRoute =
  | "dashboard"
  | "financeiro"
  | "relatorios"
  | "operacional"
  | "agenda"
  | "catalogo"
  | "profissionais"
  | "clientes"
  | "configuracoes";

export type PersonaBlueprintId =
  | "owner-operator"
  | "manager-front-desk"
  | "finance-admin"
  | "staff-collaborator"
  | "public-client";

export type AdminShellAction =
  | "open-shell-context"
  | "open-shell-pulse"
  | "create-booking"
  | "search-clients-directory"
  | "open-public-booking"
  | "open-configuracoes"
  | "open-report-builder";

export interface AdminRouteDefinition {
  readonly label: string;
  readonly shortLabel: string;
  readonly section: "Gestao do negocio" | "Dia a dia" | "Administracao";
  readonly icon: LucideIcon;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly stage: "funcional" | "parcial";
}

export interface AdminNavigationSection {
  readonly label: AdminRouteDefinition["section"];
  readonly routes: readonly AdminRoute[];
}

export interface PersonaBlueprint {
  readonly id: PersonaBlueprintId;
  readonly role: AdminRole | "public";
  readonly label: string;
  readonly summary: string;
  readonly mainJobs: readonly string[];
  readonly primaryModules: readonly string[];
  readonly economicCustomer?: boolean;
}

export interface AdminRouteVisibilityRule {
  readonly route: AdminRoute;
  readonly roles: readonly AdminRole[];
}

export interface AdminActionRule {
  readonly action: AdminShellAction;
  readonly roles: readonly AdminRole[];
  readonly summary: string;
}

export interface RoleCapabilityMatrix {
  readonly role: AdminRole;
  readonly defaultRoute: AdminRoute;
  readonly visibleRoutes: readonly AdminRoute[];
  readonly enabledActions: readonly AdminShellAction[];
  readonly personaId: Extract<PersonaBlueprintId, "owner-operator" | "manager-front-desk" | "staff-collaborator">;
}

export const defaultAdminRoute: AdminRoute = "dashboard";

export const adminRouteDefinitions = {
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
} as const satisfies Record<AdminRoute, AdminRouteDefinition>;

const baseAdminNavigationSections = [
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
] as const satisfies ReadonlyArray<AdminNavigationSection>;

export const personaBlueprints = [
  {
    id: "owner-operator",
    role: "owner",
    label: "Owner-operator",
    summary:
      "Compra o sistema, responde pelo caixa e precisa de uma cabine unica para operar, publicar e decidir.",
    mainJobs: [
      "Publicar o negocio e manter o booking confiavel.",
      "Monitorar a agenda e a receita do dia sem trocar de shell.",
      "Ler sinais de retorno, capacidade e caixa para decidir rapido."
    ],
    primaryModules: [
      "dashboard",
      "agenda",
      "financeiro",
      "clientes",
      "configuracoes",
      "relatorios"
    ],
    economicCustomer: true
  },
  {
    id: "manager-front-desk",
    role: "manager",
    label: "Manager / front-desk lead",
    summary:
      "Conduz a operacao do dia, corrige agenda, atende cliente e administra equipe sem entrar na governanca do tenant.",
    mainJobs: [
      "Fechar a agenda do dia com rapidez.",
      "Corrigir booking, cliente, equipe e servico sem navegar em excesso.",
      "Ler o minimo gerencial necessario para destravar a operacao."
    ],
    primaryModules: [
      "agenda",
      "dashboard",
      "financeiro",
      "clientes",
      "catalogo",
      "profissionais",
      "relatorios"
    ]
  },
  {
    id: "finance-admin",
    role: "manager",
    label: "Financeiro / administrativo",
    summary:
      "Arquétipo operacional dentro do papel manager, orientado a browse, documento, baixa, reversao e conciliacao.",
    mainJobs: [
      "Receber, pagar, reverter e fechar caixa.",
      "Manter bancos, saldos e titulos sem navegar por telas decorativas.",
      "Apoiar o owner com leitura rapida de caixa."
    ],
    primaryModules: ["financeiro", "agenda", "dashboard"]
  },
  {
    id: "staff-collaborator",
    role: "staff",
    label: "Staff / colaborador",
    summary:
      "Executa o atendimento. Precisa abrir a agenda certa, achar o booking e agir sem ruído administrativo.",
    mainJobs: [
      "Visualizar a propria carga do dia.",
      "Atualizar estado de booking e dados operacionais.",
      "Consultar contexto basico do cliente sem abrir um CRM completo."
    ],
    primaryModules: ["agenda"]
  },
  {
    id: "public-client",
    role: "public",
    label: "Cliente publico",
    summary:
      "Quer reservar rapido no mobile, confiar no negocio e nao cair em linguagem de backoffice.",
    mainJobs: [
      "Escolher servico, profissional e horario rapidamente.",
      "Concluir a reserva sem vazar complexidade administrativa."
    ],
    primaryModules: ["booking-web"]
  }
] as const satisfies ReadonlyArray<PersonaBlueprint>;

export const adminRouteVisibilityRules = [
  { route: "dashboard", roles: ["owner", "manager"] },
  { route: "financeiro", roles: ["owner", "manager"] },
  { route: "relatorios", roles: ["owner", "manager"] },
  { route: "operacional", roles: ["owner", "manager", "staff"] },
  { route: "agenda", roles: ["owner", "manager", "staff"] },
  { route: "catalogo", roles: ["owner", "manager"] },
  { route: "profissionais", roles: ["owner", "manager"] },
  { route: "clientes", roles: ["owner", "manager"] },
  { route: "configuracoes", roles: ["owner"] }
] as const satisfies ReadonlyArray<AdminRouteVisibilityRule>;

export const adminActionRules = [
  {
    action: "open-shell-context",
    roles: ["owner", "manager", "staff"],
    summary: "Abrir contexto operacional do tenant."
  },
  {
    action: "open-shell-pulse",
    roles: ["owner", "manager", "staff"],
    summary: "Abrir painel rapido com pendencias e atalhos."
  },
  {
    action: "create-booking",
    roles: ["owner", "manager", "staff"],
    summary: "Criar booking de balcao pela agenda."
  },
  {
    action: "search-clients-directory",
    roles: ["owner", "manager"],
    summary: "Abrir o diretório completo de clientes pelo shell."
  },
  {
    action: "open-public-booking",
    roles: ["owner", "manager", "staff"],
    summary: "Abrir o booking publico do tenant."
  },
  {
    action: "open-configuracoes",
    roles: ["owner"],
    summary: "Abrir configuracoes do tenant e parametros sensiveis."
  },
  {
    action: "open-report-builder",
    roles: ["owner", "manager"],
    summary: "Abrir a frente de relatorios e builder sem expor configuracoes."
  }
] as const satisfies ReadonlyArray<AdminActionRule>;

export const roleCapabilityMatrix = {
  owner: {
    role: "owner",
    defaultRoute: "dashboard",
    visibleRoutes: [
      "dashboard",
      "financeiro",
      "relatorios",
      "agenda",
      "catalogo",
      "profissionais",
      "clientes",
      "configuracoes"
    ],
    enabledActions: [
      "open-shell-context",
      "open-shell-pulse",
      "create-booking",
      "search-clients-directory",
      "open-public-booking",
      "open-configuracoes",
      "open-report-builder"
    ],
    personaId: "owner-operator"
  },
  manager: {
    role: "manager",
    defaultRoute: "agenda",
    visibleRoutes: [
      "dashboard",
      "financeiro",
      "relatorios",
      "agenda",
      "catalogo",
      "profissionais",
      "clientes"
    ],
    enabledActions: [
      "open-shell-context",
      "open-shell-pulse",
      "create-booking",
      "search-clients-directory",
      "open-public-booking",
      "open-report-builder"
    ],
    personaId: "manager-front-desk"
  },
  staff: {
    role: "staff",
    defaultRoute: "agenda",
    visibleRoutes: ["agenda"],
    enabledActions: [
      "open-shell-context",
      "open-shell-pulse",
      "create-booking",
      "open-public-booking"
    ],
    personaId: "staff-collaborator"
  }
} as const satisfies Record<AdminRole, RoleCapabilityMatrix>;

export const adminNavigationSections = baseAdminNavigationSections;

export function isAdminRoute(value: string): value is AdminRoute {
  return Object.prototype.hasOwnProperty.call(adminRouteDefinitions, value);
}

export function isAdminRole(value: string): value is AdminRole {
  return (adminRoles as readonly string[]).includes(value);
}

export function normalizeAdminRoute(route: AdminRoute): AdminRoute {
  return route === "operacional" ? "agenda" : route;
}

export function resolveDefaultAdminRouteForRole(role: AdminRole): AdminRoute {
  return roleCapabilityMatrix[role].defaultRoute;
}

export function getRoleCapabilities(role: AdminRole): RoleCapabilityMatrix {
  return roleCapabilityMatrix[role];
}

export function getVisibleAdminRoutes(role: AdminRole): readonly AdminRoute[] {
  return getRoleCapabilities(role).visibleRoutes;
}

export function canRoleAccessRoute(role: AdminRole, route: AdminRoute): boolean {
  return getVisibleAdminRoutes(role).includes(normalizeAdminRoute(route));
}

export function canRolePerformAction(
  role: AdminRole,
  action: AdminShellAction
): boolean {
  return getRoleCapabilities(role).enabledActions.includes(action);
}

export function getAdminNavigationSectionsForRole(
  role: AdminRole
): ReadonlyArray<AdminNavigationSection> {
  return baseAdminNavigationSections
    .map((section) => ({
      ...section,
      routes: section.routes.filter((route) => canRoleAccessRoute(role, route))
    }))
    .filter((section) => section.routes.length > 0);
}

export function resolvePersonaByRole(role: AdminRole): PersonaBlueprint {
  return (
    personaBlueprints.find(
      (persona) => persona.id === roleCapabilityMatrix[role].personaId
    ) ?? personaBlueprints[0]
  );
}

export function resolveAdminRoleLabel(role: AdminRole): string {
  switch (role) {
    case "owner":
      return "Owner";
    case "manager":
      return "Gestor";
    case "staff":
      return "Colaborador";
    default:
      return role;
  }
}
