// Creator Dashboard shared components
// Import from "@/components/creator-dashboard" for all shared page patterns

export {
  PageState,
  PageStateSkeleton,
  ModuleEmptyState,
  type PageStateVariant,
} from "./page-state"

export {
  PageHeader,
  StatsGrid,
  ActionBar,
  PageShell,
  ContentGrid,
  Section,
} from "./page-framework"

export { CreateContentMenu } from "./create-content-menu"

export * from "./create-flow"

export {
  ModulePage,
  type ModulePageAction,
  type ModulePageMetric,
  type ModulePageTab,
} from "./module-page"

export {
  AttentionQueue,
  type AttentionQueueItem,
} from "./attention-queue"

export { RevenueSnapshot } from "./revenue-snapshot"

export {
  ContentSnapshot,
  type ContentSnapshotRow,
} from "./content-snapshot"

export {
  ConfirmDialog,
  TOAST_MESSAGES,
} from "./shared-dialogs"

export { CREATOR_TERMS } from "./terminology"

// Onboarding & Activation (Section 13)
export {
  SetupChecklist,
  DEFAULT_CREATOR_CHECKLIST,
  type ChecklistItem,
  type ChecklistItemStatus,
} from "./onboarding/setup-checklist"

export {
  NextBestAction,
  getSmartSuggestions,
  type NextAction,
  type ActionPriority,
  type ActionCategory,
} from "./onboarding/next-best-action"

export {
  ContextualNudge,
  WorkspaceHealthIndicator,
  type NudgeType,
  type WorkspaceHealth,
} from "./onboarding/contextual-nudge"

// Empty States (Section 16)
export {
  EmptyStateEducation,
  EMPTY_STATE_CONTENT,
  type EmptyStateType,
} from "./empty-states/empty-state-education"

// Analytics Components (Section 9)
export { MetricCard } from "./analytics/metric-card"

export {
  SummaryMetricsBar,
  QuickStat,
  type SummaryMetric,
} from "./analytics/summary-metrics"

export {
  DetailPanel,
  DetailRow,
  DetailSection,
} from "./analytics/detail-panel"

// Forms & Workflows (Section 8)
export {
  FormSection,
  FormActions,
  FormCard,
} from "./forms/standard-form"

export {
  StepIndicator,
  type Step,
} from "./forms/step-indicator"

export {
  DestructiveConfirmation,
  SuccessToastContent,
  type DestructiveActionType,
} from "./forms/confirmation-dialog"

// Monetization (Section 10)
export { BalanceCard } from "./monetization/balance-card"

// Notifications (Section 11)
export {
  NotificationItem,
  type NotificationPriority,
  type NotificationType,
} from "./notifications/notification-item"

// Team & Permissions (Section 12)
export {
  PermissionGuard,
  RoleBadge,
} from "./team/permission-guard"

// Accessibility (Section 15)
export {
  useFocusTrap,
  useKeyboardNavigation,
  useLiveAnnouncer,
  useFocusVisible,
  SkipLink,
  AccessibleField,
  AccessibleTable,
  ACCESSIBILITY_REQUIREMENTS,
} from "./accessibility/accessibility-utils"
