export const baseEnvKeys = ["APP_ENV", "NODE_ENV"] as const;

export const adminWebEnvKeys = ["VITE_API_BASE_URL"] as const;
export const bookingWebEnvKeys = ["NEXT_PUBLIC_API_BASE_URL"] as const;
export const marketingSiteEnvKeys = ["PUBLIC_SITE_URL"] as const;

export const configFoundation = {
  packageName: "@agendaai/config",
  linting: "prettier + tsc",
  note: "Environment contracts iniciais definidos na Sprint 0."
} as const;

