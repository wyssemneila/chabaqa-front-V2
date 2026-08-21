import { EmailCampaignType } from '@/infrastructure/database/schemas/communication/email-campaign.schema';

export type MarketingTemplateTone =
  | 'announcement'
  | 'editorial'
  | 'urgent'
  | 'supportive'
  | 'premium'
  | 'conversion';

export type MarketingTemplateChannel = 'email' | 'message';

export type MarketingEmailTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  type: EmailCampaignType;
  contentType?: 'event' | 'challenge' | 'cours' | 'product' | 'session' | 'all';
  tone: MarketingTemplateTone;
  channelCompatibility: MarketingTemplateChannel[];
  subject: string;
  content: string;
  isHtml: boolean;
  recommendedVariables: string[];
  audienceHint: string;
  bestFor: string[];
};

const wrapper = (badge: string, title: string, body: string, ctaLabel: string, ctaUrl = '{{communityUrl}}') => `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;background:#ffffff;">
    <div style="padding:20px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb;">
      <p style="margin:0 0 8px 0;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#4f46e5;font-weight:700;">${badge}</p>
      <h1 style="margin:0;color:#0f172a;font-size:24px;line-height:1.25;">${title}</h1>
    </div>
    <div style="padding:24px;color:#334155;font-size:15px;line-height:1.7;">
      ${body}
      <div style="margin:22px 0 8px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">${ctaLabel}</a>
      </div>
      <p style="margin:16px 0 0 0;color:#64748b;font-size:13px;">Sent by {{communityName}} on {{currentDate}}</p>
    </div>
  </div>
`;

export const MARKETING_EMAIL_TEMPLATES: MarketingEmailTemplate[] = [
  {
    id: 'community-announcement-rich',
    name: 'Community Announcement',
    description: 'A polished update for all members with community-level personalization.',
    category: 'announcement',
    type: EmailCampaignType.ANNOUNCEMENT,
    tone: 'announcement',
    channelCompatibility: ['email', 'message'],
    subject: 'New update from {{communityName}}, {{userFirstName}}',
    content: wrapper(
      'Community Update',
      'A new update is ready inside {{communityName}}.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>We just added a new update for members of <strong>{{communityName}}</strong>. You are one of {{communityMemberCount}} members building here.</p>
        <p>Open the community to see the latest posts, resources, and next actions prepared for you.</p>
      `,
      'Open Community',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'communityName', 'communityMemberCount', 'communityUrl', 'currentDate'],
    audienceHint: 'All current community members.',
    bestFor: ['general updates', 'creator notes', 'member-wide announcements'],
  },
  {
    id: 'weekly-member-digest',
    name: 'Weekly Member Digest',
    description: 'Editorial digest for keeping members aware of what changed.',
    category: 'newsletter',
    type: EmailCampaignType.NEWSLETTER,
    tone: 'editorial',
    channelCompatibility: ['email'],
    subject: '{{communityName}} digest for {{currentMonth}}',
    content: wrapper(
      'Weekly Digest',
      'Here is what is moving in {{communityName}}.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>This week inside <strong>{{communityName}}</strong>, there are new learning moments, member updates, and opportunities to continue your progress.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">Courses available: <strong>{{courseCount}}</strong></td></tr>
          <tr><td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">Events available: <strong>{{eventCount}}</strong></td></tr>
          <tr><td style="padding:10px 0;">Products available: <strong>{{productCount}}</strong></td></tr>
        </table>
      `,
      'Read The Digest',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'communityName', 'currentMonth', 'courseCount', 'eventCount', 'productCount', 'communityUrl'],
    audienceHint: 'All members or engaged members from the last 30 days.',
    bestFor: ['newsletters', 'weekly recaps', 'content roundups'],
  },
  {
    id: 'content-launch',
    name: 'Content Launch',
    description: 'Launch any course, product, event, session, or challenge with precise content fields.',
    category: 'content',
    type: EmailCampaignType.CUSTOM,
    contentType: 'all',
    tone: 'conversion',
    channelCompatibility: ['email', 'message'],
    subject: 'New {{contentTypeLabel}}: {{contentTitle}}',
    content: wrapper(
      'New {{contentTypeLabel}}',
      '{{contentTitle}} is now available.',
      `
        <p>Hi {{userFirstName}},</p>
        <p><strong>{{contentTitle}}</strong> is live inside {{communityName}}.</p>
        <p>{{contentDescription}}</p>
        <p>Price: <strong>{{contentPrice}} {{contentCurrency}}</strong></p>
      `,
      'View {{contentTypeLabel}}',
      '{{contentUrl}}',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'contentTypeLabel', 'contentTitle', 'contentDescription', 'contentPrice', 'contentCurrency', 'contentUrl'],
    audienceHint: 'Members interested in a selected content item.',
    bestFor: ['course launches', 'event announcements', 'product launches', 'new sessions'],
  },
  {
    id: 'course-progress-rescue',
    name: 'Course Progress Rescue',
    description: 'A precise learning nudge based on learner progress and enrollment age.',
    category: 'learning',
    type: EmailCampaignType.COURSE_PROGRESS_REMINDER,
    contentType: 'cours',
    tone: 'supportive',
    channelCompatibility: ['email', 'message'],
    subject: '{{userFirstName}}, you are {{courseProgressPct}}% through {{courseTitle}}',
    content: wrapper(
      'Learning Progress',
      'Keep going with {{courseTitle}}.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>You enrolled in <strong>{{courseTitle}}</strong> {{courseEnrolledDays}} days ago and have completed <strong>{{courseProgressPct}}%</strong>.</p>
        <p>You have {{courseRemainingChapters}} chapter(s) left. A focused session today can move you forward.</p>
      `,
      'Continue Course',
      '{{contentUrl}}',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'courseTitle', 'courseProgressPct', 'courseEnrolledDays', 'courseRemainingChapters', 'contentUrl'],
    audienceHint: 'Learners below a completion threshold after a set number of days.',
    bestFor: ['course completion', 'learner retention', 'progress nudges'],
  },
  {
    id: 'inactive-winback',
    name: 'Inactive Member Winback',
    description: 'Reactivation email using exact inactivity data where available.',
    category: 'reactivation',
    type: EmailCampaignType.INACTIVE_USER_REACTIVATION,
    tone: 'supportive',
    channelCompatibility: ['email', 'message'],
    subject: 'We saved your place in {{communityName}}, {{userFirstName}}',
    content: wrapper(
      'Welcome Back',
      'A lot has moved since your last visit.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>It has been <strong>{{daysSinceLastLogin}}</strong> days since your last visit to {{communityName}}.</p>
        <p>Come back to catch up on new content, member discussions, and the next steps prepared for you.</p>
      `,
      'Return To Community',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'communityName', 'daysSinceLastLogin', 'lastLoginDate', 'communityUrl'],
    audienceHint: 'Members marked as reactivation targets.',
    bestFor: ['inactive users', 'retention campaigns', 'member recovery'],
  },
  {
    id: 'event-reminder-rich',
    name: 'Event Reminder',
    description: 'Event reminder with date, time, location, and ticket context.',
    category: 'event',
    type: EmailCampaignType.EVENT_REMINDER,
    contentType: 'event',
    tone: 'urgent',
    channelCompatibility: ['email', 'message'],
    subject: 'Reminder: {{contentTitle}} starts on {{eventStartDate}}',
    content: wrapper(
      'Event Reminder',
      '{{contentTitle}} is coming up.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>Your next event in {{communityName}} starts on <strong>{{eventStartDate}}</strong> at <strong>{{eventStartTime}}</strong>.</p>
        <p>Location: {{eventLocation}}</p>
      `,
      'View Event',
      '{{contentUrl}}',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'contentTitle', 'eventStartDate', 'eventStartTime', 'eventLocation', 'contentUrl'],
    audienceHint: 'All members or event registrants when the frontend adds that filter.',
    bestFor: ['event reminders', 'webinars', 'live workshops'],
  },
  {
    id: 'product-offer',
    name: 'Product Offer',
    description: 'Conversion-focused product promotion with price and feature variables.',
    category: 'commerce',
    type: EmailCampaignType.PROMOTION,
    contentType: 'product',
    tone: 'premium',
    channelCompatibility: ['email', 'message'],
    subject: '{{contentTitle}} is ready for {{communityName}} members',
    content: wrapper(
      'Member Offer',
      'A resource built for your next step.',
      `
        <p>Hi {{userFirstName}},</p>
        <p><strong>{{contentTitle}}</strong> is available now.</p>
        <p>{{contentDescription}}</p>
        <p>Member price: <strong>{{contentPrice}} {{contentCurrency}}</strong></p>
      `,
      'Get The Product',
      '{{contentUrl}}',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'contentTitle', 'contentDescription', 'contentPrice', 'contentCurrency', 'contentUrl'],
    audienceHint: 'Members who have not purchased the selected product yet.',
    bestFor: ['digital products', 'resource packs', 'limited offers'],
  },
  {
    id: 'welcome-onboarding',
    name: 'Welcome Onboarding',
    description: 'Automated welcome email for new community members.',
    category: 'automation',
    type: EmailCampaignType.WELCOME,
    tone: 'announcement',
    channelCompatibility: ['email'],
    subject: 'Welcome to {{communityName}}, {{userFirstName}}',
    content: wrapper(
      'Welcome',
      'You are now part of {{communityName}}.',
      `
        <p>Hi {{userFirstName}},</p>
        <p>Welcome to <strong>{{communityName}}</strong>. Start by exploring the community home, introducing yourself, and opening the resources prepared for new members.</p>
      `,
      'Start Here',
    ),
    isHtml: true,
    recommendedVariables: ['userFirstName', 'communityName', 'communityUrl', 'currentDate'],
    audienceHint: 'New members immediately after joining.',
    bestFor: ['welcome automation', 'onboarding', 'new members'],
  },
];
