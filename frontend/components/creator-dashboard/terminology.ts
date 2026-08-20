export const CREATOR_TERMS = {
  modules: {
    overview: "Overview", communities: "Communities", analytics: "Analytics",
    courses: "Courses", challenges: "Challenges", sessions: "Sessions",
    events: "Events", products: "Products", posts: "Posts",
    subscriptions: "Subscriptions", payouts: "Payouts", manualPayments: "Manual Payments",
    emailCampaigns: "Email Campaigns", affiliates: "Affiliates", contacts: "Contacts",
    messages: "Messages", whatsapp: "WhatsApp", team: "Team & Roles",
    notifications: "Notifications", integrations: "Integrations", customize: "Customize",
    help: "Help & Support",
  },
  status: {
    draft: "Draft", published: "Published", live: "Live", scheduled: "Scheduled",
    active: "Active", inactive: "Inactive", archived: "Archived", completed: "Completed",
    cancelled: "Cancelled", pending: "Pending", paused: "Paused", expired: "Expired",
  },
  actions: {
    create: "Create", edit: "Edit", delete: "Delete", publish: "Publish",
    unpublish: "Unpublish", duplicate: "Duplicate", archive: "Archive", restore: "Restore",
    save: "Save Changes", saveDraft: "Save as Draft", cancel: "Cancel", confirm: "Confirm",
    export: "Export", import: "Import", invite: "Invite", remove: "Remove",
    viewDetails: "View Details", manage: "Manage", configure: "Configure",
  },
  monetization: {
    revenue: "Revenue", totalRevenue: "Total Revenue", availableBalance: "Available Balance",
    pendingPayout: "Pending Payout", paidOut: "Paid Out", subscription: "Subscription",
    plan: "Plan", monthlyPrice: "Monthly Price", trial: "Free Trial", trialDays: "Trial Period",
    subscriber: "Subscriber", mrr: "Monthly Recurring Revenue", churnRate: "Cancellation Rate",
    lifetime: "Lifetime Value", refund: "Refund", requestPayout: "Request Payout",
    payoutHistory: "Payout History", manualPayment: "Record Payment",
  },
  team: {
    owner: "Owner", admin: "Admin", moderator: "Moderator", editor: "Editor",
    member: "Member", invite: "Invite Team Member", role: "Role",
    permissions: "Permissions", removeAccess: "Remove Access",
  },
  community: {
    community: "Community", members: "Members", memberCount: "Member Count",
    switchCommunity: "Switch Community", createCommunity: "Create Community",
    communitySettings: "Community Settings", leaveCommunity: "Leave Community",
  },
  replacements: {
    "Course Manager": "Courses", "Challenge Manager": "Challenges",
    "Session Manager": "Sessions", "Post Editor": "Posts",
    "Community Members": "Members", "Landing Page": "Customize",
    Settings: "Community Settings",
  },
} as const
