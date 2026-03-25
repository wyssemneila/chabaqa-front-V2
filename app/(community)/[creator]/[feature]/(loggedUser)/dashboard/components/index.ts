export {
  DashboardProvider,
  useDashboard,
  RequireDashboardAccess,
  type DashboardContextValue,
} from "./dashboard-context";

export { DashboardNav } from "./dashboard-nav";
export { DashboardShell } from "./dashboard-shell";

export {
  DashboardSection,
  StatCard,
  ActionCard,
  ActionCard as DashboardCard,
  DashboardLoading,
  DashboardEmpty,
  DashboardError,
  DashboardUnauthorized,
  BackendRequiredPlaceholder,
} from "./dashboard-cards";
