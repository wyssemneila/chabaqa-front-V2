# Creator Dashboard UX Remediation Prompt (Web View Only)

## Scope
This prompt is intentionally limited to the desktop/web experience of the Creator Dashboard. Do not address mobile redesigns, mobile breakpoints, or mobile-native interaction patterns. If mobile is mentioned at all, treat it only as out of scope for this document.

## Product Context
The Creator Dashboard is a multi-module web backoffice for creators. It includes:

- Overview dashboard
- Communities
- Analytics
- Content management: Courses, Challenges, Sessions, Events, Products, Posts
- Monetization: Subscriptions, Payouts, Manual Payments
- Marketing: Emails, Affiliates, Contacts, Messages, WhatsApp
- Team & Roles
- Notifications
- Integrations
- Help
- Community customization

This is an operational SaaS workspace, not a marketing site. The UX must optimize for clarity, trust, speed, repeat use, and low cognitive load for creators managing content, community, revenue, and operations.

## Current Web UX Gaps To Fix

### Critical
- The desktop information architecture is fragmented across modules that behave like separate products.
- Navigation mixes complete features, partial features, placeholder routes, and external-context links without a clear state system.
- Community selection is a hidden global dependency and causes inconsistent behavior between pages.
- Loading, empty, no-results, no-permission, error, and unavailable states are inconsistent across the dashboard.
- The dashboard lacks a unified operating model for creators moving between content, monetization, marketing, analytics, and community management.

### High Priority
- Similar modules use different page templates, headers, tabs, filters, and action placement.
- Creation flows for courses, products, sessions, challenges, and events are inconsistent in structure and terminology.
- Analytics is dense and likely overwhelming, with insufficient progressive disclosure.
- Monetization language is not clear enough for non-expert creators.
- Notifications appear more like an inbox than an action-driving workflow system.
- RBAC and permissions likely hide features without explaining why they are unavailable.
- Posts and community-feed navigation are ambiguous from a creator-management perspective.
- Placeholder and soon-to-ship features reduce trust when presented alongside live features.

### Medium Priority
- There is no unified quick-actions model for common creator tasks.
- Cross-page continuity is weak after create, edit, publish, or switch-community actions.
- Search, filtering, tabs, and data-display patterns vary too much between modules.
- Settings are fragmented across several areas with no coherent administration model.
- Empty states likely do not teach users the next best action.
- The dashboard lacks strong orientation aids such as consistent breadcrumbs, section framing, and action hierarchy.

### Low Priority / Polish
- Success feedback patterns are not standardized.
- Bulk actions are likely inconsistent across content modules.
- Archive, duplicate, and recovery workflows may be inconsistent or underexposed.
- Cross-module relationships are not surfaced clearly enough, for example content performance vs revenue vs payout visibility.

## Objective
Produce a complete professional UX remediation plan and implementation specification for the Creator Dashboard web experience only.

The result must help a product designer and frontend team make the creator dashboard feel like one coherent system instead of a collection of separate feature pages.

## Required Output Structure

### 1. Executive Summary
Provide a concise summary of the most important UX problems in the desktop creator dashboard and the strategic direction for fixing them.

### 2. UX Audit By Severity
Break down all identified issues into:
- Critical
- High
- Medium
- Low

For each issue include:
- Problem
- Why it matters
- User impact
- Recommended fix

### 3. Information Architecture Redesign
Redesign the web information architecture so creators can clearly understand the difference between:
- Running the business
- Managing content
- Managing community
- Managing revenue
- Managing growth and outreach
- Configuring workspace settings

Define the ideal top-level section model and what belongs in each section.

### 4. Navigation Redesign
Redesign the sidebar and local navigation for desktop web.

Include:
- Primary navigation groups
- Secondary navigation patterns
- Rules for when to use expandable groups
- Rules for active states
- Rules for badges, counts, alerts, and “coming soon” items
- Rules for features that are permission-restricted
- Rules for links that leave the current management context

### 5. Community Context Model
Define a consistent desktop UX model for community switching.

Include:
- Where the active community is shown
- How switching behaves
- What reloads vs what persists
- What users see when no community is selected
- What users see when they lose access
- How to prevent confusion when content belongs to different communities

### 6. Standard Creator Page Framework
Define a standardized page template system for desktop web pages across all modules.

Include the recommended structure for pages such as:
- Overview
- List/index pages
- Detail/manage pages
- Create/edit flows
- Analytics-heavy pages
- Settings/configuration pages

For each template specify:
- Header layout
- Context strip
- Primary actions
- Secondary actions
- Filters/search placement
- Content region structure
- Supporting panels or sidebars

### 7. Standard State System
Create one shared UX system for these desktop states:
- Loading
- Refreshing
- Empty state
- No results
- Error
- No permission
- No active community selected
- Unavailable feature
- Coming soon

For each state provide:
- Visual treatment
- Page behavior
- Recommended copy style
- CTA behavior

### 8. Creation and Editing Workflow Standardization
Standardize the desktop creation/editing UX for:
- Courses
- Challenges
- Sessions
- Events
- Products

Define a shared framework for:
- Step naming
- Progress indicators
- Validation
- Save draft behavior
- Publish behavior
- Exit behavior
- Review screens
- Error recovery
- Post-publish confirmation

Also specify what may remain module-specific.

### 9. Analytics Simplification Strategy
Redesign the analytics experience for web so it is usable for both casual and advanced creators.

Include:
- Recommended information hierarchy
- Default views
- Progressive disclosure model
- Comparison modes
- Export placement
- Terminology cleanup
- How to connect analytics to recommended actions

### 10. Monetization UX Rewrite
Redesign the monetization area for desktop web.

Clarify the UX and terminology differences between:
- Subscriptions
- Payouts
- Manual Payments
- Revenue summaries
- Available balance
- Payment history

Include recommendations for:
- Information hierarchy
- Alerts and warnings
- Credential/setup states
- Request flows
- Trust-building patterns

### 11. Notifications As Actionable Workflow
Redesign notifications so they help creators take action quickly.

Include:
- Grouping model
- Priority model
- Read/unread behavior
- Bulk actions
- Jump-to-related-task patterns
- Notification preferences UX
- When a notification should become a task, banner, inbox item, or inline alert

### 12. Team and Roles UX Improvements
Improve the web UX for staff management and permissions.

Include:
- Role visibility
- Permission explanations
- Invite flow clarity
- Safe destructive actions
- Why a feature is hidden or disabled
- How to explain role differences without overwhelming the user

### 13. Onboarding and Activation Framework
Design a desktop onboarding model for first-time creators.

Include:
- Setup checklist
- Recommended first-run sequence
- Contextual nudges
- Empty-state education
- “Next best action” components
- Signals that the workspace is healthy, incomplete, or blocked

### 14. Cross-Module Design System Rules
Define global UX rules for the creator dashboard web interface.

Include standards for:
- Naming
- Page titles
- Breadcrumbs
- Header actions
- Tabs
- Search and filters
- Tables and cards
- Summary metrics
- Detail panels
- Quick actions
- Bulk actions
- Destructive confirmations
- Success feedback
- Inline help
- Placeholder features

Clearly separate:
- Global standards that must be shared across every module
- Module-specific flexibility that is allowed

### 15. Accessibility Requirements
Provide web accessibility requirements for the creator dashboard.

Include:
- Keyboard navigation
- Focus management
- Tab order
- Contrast
- Error messaging
- Form labeling
- Table accessibility
- Notification accessibility
- Dialog and drawer behavior

### 16. Empty-State Copy Strategy
Provide a reusable copy framework for web empty states.

Include example copy for:
- No communities yet
- No courses yet
- No products yet
- No events yet
- No sessions yet
- No payouts yet
- No notifications yet
- No analytics data yet
- No team members yet
- No permission

### 17. Microcopy and Terminology Dictionary
Create a terminology dictionary to standardize the creator dashboard language.

Include recommended naming rules for:
- Modules
- Statuses
- Actions
- Monetization language
- Team/role language
- Community-management language

Also list any ambiguous terms that should be replaced.

### 18. Page-By-Page Fix List
Provide a page-by-page remediation checklist for every creator dashboard area:
- Overview dashboard
- Communities
- Analytics
- Courses
- Challenges
- Sessions
- Events
- Products
- Posts
- Monetization: subscriptions, payouts, manual payments
- Marketing: emails, affiliates, contacts, messages, WhatsApp
- Team & Roles
- Notifications
- Integrations
- Help
- Customization

For each page include:
- Current likely UX issue types
- Recommended structural fixes
- Recommended content and interaction fixes
- Priority level

### 19. Phased Roadmap
Provide a migration-friendly delivery roadmap for a live product.

Use these phases:
- Phase 1: quick wins
- Phase 2: structural UX normalization
- Phase 3: strategic redesign improvements

For each phase include:
- Goals
- What changes ship
- Dependencies
- Expected user impact

### 20. Final Unified Design Specification
End with a single implementation-ready design specification for the desktop creator dashboard.

It must be written so product design and frontend engineering teams can act on it directly.

## Quality Requirements
- Focus only on desktop/web UX.
- Do not spend time proposing mobile layouts or mobile interactions.
- Be concrete and implementation-oriented.
- Avoid generic design advice.
- Prefer operational SaaS dashboard patterns over consumer or marketing-site patterns.
- Reduce ambiguity, context switching, and cognitive load.
- Preserve migration-friendliness for an existing live product.
- Call out what must be standardized globally.
- Call out what can remain module-specific.
- Include example wireframe structure descriptions for major page types.
- Include example microcopy where useful.
- Include rules for unfinished or unavailable features so they do not damage trust.

## Final Instruction
Write the output as a professional UX/product specification for a real web application, not as casual advice. The result should read like a document a senior product designer, product manager, and frontend lead could use immediately to plan and execute the remediation of the Creator Dashboard web experience.
