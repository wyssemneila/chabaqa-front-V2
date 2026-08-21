/**
 * Community Staff Roles & Permissions — Frontend mirror of backend constants.
 * Keep in sync with chabaqa-backend/src/common/permissions/community-roles.constants.ts
 */

// ── Roles ──────────────────────────────────────────────────────────────────

/** Roles that can be stored on a CommunityStaff record */
export type CommunityStaffRole = 'admin' | 'moderator' | 'support';

/** All possible community-level roles (including derived ones) */
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'support' | 'member' | 'none';

export const COMMUNITY_STAFF_ROLES: CommunityStaffRole[] = ['admin', 'moderator', 'support'];

export const COMMUNITY_ROLES: CommunityRole[] = [
  'owner',
  'admin',
  'moderator',
  'support',
  'member',
  'none',
];

// ── Permissions ────────────────────────────────────────────────────────────

export const CommunityPermission = {
  COMMUNITY_MANAGE_SETTINGS: 'community.manage_settings',
  ROLES_MANAGE: 'roles.manage',
  MEMBERS_VIEW: 'members.view',
  MEMBERS_MANAGE: 'members.manage',
  POSTS_MODERATE: 'posts.moderate',
  CONTENT_MANAGE: 'content.manage',
  MARKETING_MANAGE: 'marketing.manage',
  ANALYTICS_VIEW: 'analytics.view',
  FINANCE_VIEW: 'finance.view',
  AFFILIATES_MANAGE: 'affiliates.manage',
  SUPPORT_MANAGE: 'support.manage',
} as const;

export type CommunityPermissionValue =
  (typeof CommunityPermission)[keyof typeof CommunityPermission];

// ── Role → Permission mapping ──────────────────────────────────────────────

const ALL_PERMISSIONS = Object.values(CommunityPermission);

export const ROLE_PERMISSIONS: Record<CommunityRole, readonly CommunityPermissionValue[]> = {
  owner: ALL_PERMISSIONS,
  admin: ALL_PERMISSIONS,
  moderator: [
    CommunityPermission.MEMBERS_VIEW,
    CommunityPermission.POSTS_MODERATE,
  ],
  support: [
    CommunityPermission.MEMBERS_VIEW,
    CommunityPermission.SUPPORT_MANAGE,
  ],
  member: [],
  none: [],
};

// ── Role hierarchy (lower index = higher authority) ────────────────────────

export const ROLE_HIERARCHY: CommunityRole[] = [
  'owner',
  'admin',
  'moderator',
  'support',
  'member',
  'none',
];

// ── Display helpers ────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<CommunityRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Moderator',
  support: 'Support',
  member: 'Member',
  none: 'None',
};

export const ROLE_COLORS: Record<CommunityRole, string> = {
  owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  admin: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  moderator: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  support: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  member: 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
  none: 'bg-gray-50 text-gray-500',
};

export const PERMISSION_LABELS: Record<CommunityPermissionValue, string> = {
  [CommunityPermission.COMMUNITY_MANAGE_SETTINGS]: 'Manage Settings',
  [CommunityPermission.ROLES_MANAGE]: 'Manage Roles',
  [CommunityPermission.MEMBERS_VIEW]: 'View Members',
  [CommunityPermission.MEMBERS_MANAGE]: 'Manage Members',
  [CommunityPermission.POSTS_MODERATE]: 'Moderate Posts',
  [CommunityPermission.CONTENT_MANAGE]: 'Manage Content',
  [CommunityPermission.MARKETING_MANAGE]: 'Marketing',
  [CommunityPermission.ANALYTICS_VIEW]: 'View Analytics',
  [CommunityPermission.FINANCE_VIEW]: 'View Finance',
  [CommunityPermission.AFFILIATES_MANAGE]: 'Manage Affiliates',
  [CommunityPermission.SUPPORT_MANAGE]: 'Support',
};

// ── Utility functions ──────────────────────────────────────────────────────

export function roleHasPermission(
  role: CommunityRole,
  permission: CommunityPermissionValue,
): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export function roleRank(role: CommunityRole): number {
  const idx = ROLE_HIERARCHY.indexOf(role);
  return idx === -1 ? ROLE_HIERARCHY.length : idx;
}

export function isHigherRole(a: CommunityRole, b: CommunityRole): boolean {
  return roleRank(a) < roleRank(b);
}
