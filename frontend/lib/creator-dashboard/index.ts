// Creator Dashboard Library Utilities
// Import from "@/lib/creator-dashboard" for terminology and design rules

export {
  MODULE_NAMES,
  STATUS_LABELS,
  ACTION_LABELS,
  MONETIZATION_TERMS,
  TEAM_TERMS,
  COMMUNITY_TERMS,
  getStatusLabel,
  getActionLabel,
  formatCurrency,
  formatDate,
  formatNumber,
} from "./terminology"

export {
  PAGE_TITLE_RULES,
  BREADCRUMB_RULES,
  HEADER_ACTION_RULES,
  TAB_RULES,
  SEARCH_FILTER_RULES,
  DATA_DISPLAY_RULES,
  QUICK_ACTION_RULES,
  BULK_ACTION_RULES,
  CONFIRMATION_RULES,
  SUCCESS_FEEDBACK_RULES,
  INLINE_HELP_RULES,
  PLACEHOLDER_FEATURE_RULES,
  RULE_SCOPE,
  buildBreadcrumbs,
  type BreadcrumbItem,
} from "./design-system-rules"

export {
  CREATOR_EMPTY_STATE_DEFINITIONS,
  getCreatorEmptyStateDefinition,
  type CreatorEmptyStateAction,
  type CreatorEmptyStateDefinition,
  type CreatorEmptyStateModule,
  type CreatorIcon,
} from "./empty-state-definitions"
