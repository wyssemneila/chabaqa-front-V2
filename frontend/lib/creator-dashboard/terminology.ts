/**
 * Creator Dashboard Terminology Dictionary (Section 17)
 *
 * Standardized language across all creator dashboard modules.
 */

export const MODULE_NAMES = {
  dashboard: 'Dashboard',
  communities: 'Communities',
  analytics: 'Analytics',
  courses: 'Courses',
  challenges: 'Challenges',
  sessions: 'Sessions',
  events: 'Events',
  products: 'Products',
  posts: 'Posts',
  monetization: 'Monetization',
  subscriptions: 'Subscriptions',
  payouts: 'Payouts',
  marketing: 'Marketing',
  emails: 'Emails',
  affiliates: 'Affiliates',
  contacts: 'Contacts',
  messaging: 'Messages',
  whatsapp: 'WhatsApp',
  team: 'Team',
  notifications: 'Notifications',
  integrations: 'Integrations',
  help: 'Help',
  settings: 'Settings',
} as const;

export const STATUS_LABELS = {
  draft: 'Draft',
  published: 'Published',
  scheduled: 'Scheduled',
  archived: 'Archived',
  unpublished: 'Unpublished',
  active: 'Active',
  inactive: 'Inactive',
  pending: 'Pending',
  invited: 'Invited',
  suspended: 'Suspended',
  paid: 'Paid',
  unpaid: 'Unpaid',
  refunded: 'Refunded',
  failed: 'Failed',
  processing: 'Processing',
  available: 'Available',
  pendingClearance: 'Pending Clearance',
  withdrawn: 'Withdrawn',
  onHold: 'On Hold',
  upcoming: 'Upcoming',
  live: 'Live',
  ended: 'Ended',
  cancelled: 'Cancelled',
  notStarted: 'Not Started',
  inProgress: 'In Progress',
  completed: 'Completed',
} as const;

export const ACTION_LABELS = {
  create: 'Create',
  add: 'Add',
  new: 'New',
  edit: 'Edit',
  update: 'Update',
  save: 'Save',
  saveChanges: 'Save Changes',
  saveDraft: 'Save Draft',
  publish: 'Publish',
  unpublish: 'Unpublish',
  schedule: 'Schedule',
  delete: 'Delete',
  remove: 'Remove',
  archive: 'Archive',
  discard: 'Discard',
  view: 'View',
  open: 'Open',
  manage: 'Manage',
  details: 'Details',
  invite: 'Invite',
  resendInvite: 'Resend Invite',
  cancelInvite: 'Cancel Invite',
  requestPayout: 'Request Payout',
  withdraw: 'Withdraw',
  refund: 'Refund',
  export: 'Export',
  import: 'Import',
  duplicate: 'Duplicate',
  preview: 'Preview',
  share: 'Share',
  copy: 'Copy',
  copyLink: 'Copy Link',
  download: 'Download',
  upload: 'Upload',
  filter: 'Filter',
  search: 'Search',
  sort: 'Sort',
  refresh: 'Refresh',
  retry: 'Retry',
  cancel: 'Cancel',
  confirm: 'Confirm',
  done: 'Done',
  close: 'Close',
  back: 'Back',
  next: 'Next',
  skip: 'Skip',
  continue: 'Continue',
  finish: 'Finish',
  submit: 'Submit',
  apply: 'Apply',
  reset: 'Reset',
  clear: 'Clear',
  selectAll: 'Select All',
  deselectAll: 'Deselect All',
} as const;

export const MONETIZATION_TERMS = {
  availableBalance: 'Available Balance',
  pendingBalance: 'Pending Balance',
  totalEarnings: 'Total Earnings',
  lifetimeRevenue: 'Lifetime Revenue',
  payout: 'Payout',
  payoutMethod: 'Payout Method',
  payoutSchedule: 'Payout Schedule',
  minimumPayout: 'Minimum Payout',
  subscription: 'Subscription',
  subscriber: 'Subscriber',
  monthlyRecurring: 'Monthly Recurring',
  annualRecurring: 'Annual Recurring',
  churnRate: 'Churn Rate',
  oneTimePayment: 'One-Time Payment',
  recurringPayment: 'Recurring Payment',
  platformFee: 'Platform Fee',
  processingFee: 'Processing Fee',
  netRevenue: 'Net Revenue',
  grossRevenue: 'Gross Revenue',
} as const;

export const TEAM_TERMS = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Moderator',
  editor: 'Editor',
  viewer: 'Viewer',
  member: 'Member',
  teamMember: 'Team Member',
  staff: 'Staff',
  collaborator: 'Collaborator',
  permission: 'Permission',
  accessLevel: 'Access Level',
  role: 'Role',
} as const;

export const COMMUNITY_TERMS = {
  community: 'Community',
  member: 'Member',
  members: 'Members',
  activeMember: 'Active Member',
  newMember: 'New Member',
  memberSince: 'Member Since',
  publicCommunity: 'Public',
  privateCommunity: 'Private',
  paidCommunity: 'Paid',
  freeCommunity: 'Free',
  engagement: 'Engagement',
  activity: 'Activity',
  lastActive: 'Last Active',
} as const;

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
}

export function getActionLabel(action: string): string {
  return ACTION_LABELS[action as keyof typeof ACTION_LABELS] || action;
}

export function formatCurrency(amountInCents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountInCents / 100);
}

export function formatDate(date: Date | string, style: 'short' | 'long' | 'relative' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (style === 'relative') {
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    if (days < 30) return Math.floor(days / 7) + ' weeks ago';
    if (days < 365) return Math.floor(days / 30) + ' months ago';
    return Math.floor(days / 365) + ' years ago';
  }
  return d.toLocaleDateString('en-US', { month: style === 'long' ? 'long' : 'short', day: 'numeric', year: 'numeric' });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}
