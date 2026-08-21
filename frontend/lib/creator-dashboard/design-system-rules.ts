/**
 * Creator Dashboard Design System Rules (Section 14)
 * Global UX rules and standards for consistent behavior across all modules.
 */

export const PAGE_TITLE_RULES = {
  separator: ' | ',
  suffix: ' - Chabaqa Creator',
};

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export const BREADCRUMB_RULES = {
  maxDepth: 4,
  homeLabel: 'Dashboard',
  homePath: '/creator/dashboard',
  maxLabelLength: 30,
};

export function buildBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  const home: BreadcrumbItem = { label: BREADCRUMB_RULES.homeLabel, href: BREADCRUMB_RULES.homePath };
  const truncatedItems = items.map((item, index) => ({
    ...item,
    label: item.label.length > BREADCRUMB_RULES.maxLabelLength ? item.label.slice(0, BREADCRUMB_RULES.maxLabelLength) + '...' : item.label,
    href: index === items.length - 1 ? undefined : item.href,
  }));
  return [home, ...truncatedItems].slice(0, BREADCRUMB_RULES.maxDepth);
}

export const HEADER_ACTION_RULES = {
  maxVisibleActions: 3,
};

export const TAB_RULES = {
  maxVisibleTabs: 6,
  maxLabelWords: 2,
};

export const SEARCH_FILTER_RULES = {
  searchDebounceMs: 300,
  minSearchLength: 2,
};

export const DATA_DISPLAY_RULES = {
  defaultPageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
};

export const QUICK_ACTION_RULES = {
  quickActions: ['edit', 'duplicate', 'archive', 'delete', 'view', 'copyLink'],
};

export const BULK_ACTION_RULES = {
  bulkActions: ['archive', 'delete', 'export', 'changeStatus'],
};

export const CONFIRMATION_RULES = {
  destructiveActions: ['delete', 'archive', 'remove', 'cancel', 'suspend'],
  requireTypingFor: ['delete-community', 'delete-account'],
};

export const SUCCESS_FEEDBACK_RULES = {
  toastDurationMs: 4000,
  toastPosition: 'bottom-right' as const,
};

export const INLINE_HELP_RULES = {
  tooltipDelayMs: 500,
};

export const PLACEHOLDER_FEATURE_RULES = {
  labels: {
    comingSoon: 'Coming Soon',
    beta: 'Beta',
    preview: 'Preview',
    deprecated: 'Deprecated',
  },
};

export const RULE_SCOPE = {
  global: [
    'page-titles', 'breadcrumbs', 'header-action-placement', 'confirmation-dialogs',
    'success-feedback', 'empty-states', 'error-states', 'loading-states', 'terminology',
  ],
  moduleSpecific: [
    'card-layout', 'detail-panel-content', 'chart-types', 'filter-options', 'sort-options', 'bulk-action-options',
  ],
};
