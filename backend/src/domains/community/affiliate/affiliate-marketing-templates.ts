export type AffiliateTemplateChannel = 'email' | 'message' | 'social' | 'in_app';

export type AffiliateMarketingTemplate = {
  id: string;
  title: string;
  category: 'recruitment' | 'activation' | 'promotion' | 'performance' | 'payout' | 'retention';
  icon: string;
  goal: string;
  channels: AffiliateTemplateChannel[];
  audienceSegment: string;
  subject?: string;
  content: string;
  ctaLabel: string;
  recommendedVariables: string[];
  recommendedFilters: Record<string, any>;
};

export const AFFILIATE_MARKETING_TEMPLATES: AffiliateMarketingTemplate[] = [
  {
    id: 'partner-invite-premium',
    title: 'Premium Partner Invite',
    category: 'recruitment',
    icon: 'UserPlus',
    goal: 'Invite high-fit partners with clear commission and trust details.',
    channels: ['email', 'message'],
    audienceSegment: 'Creators, alumni, and power members who already trust the offer.',
    subject: 'Partner with {{creatorName}} and earn {{primaryCommissionPercent}}%',
    content:
      'Hi {{partnerName}}, I am opening {{programName}} for selected partners. You can share {{bestTargetLabel}} with your audience and earn {{primaryCommissionPercent}}% for every qualified sale. The cookie lasts {{cookieWindowDays}} days and commissions unlock after {{holdDays}} days. Your tracking link: {{affiliateLink}}',
    ctaLabel: 'Send invite',
    recommendedVariables: [
      'partnerName',
      'creatorName',
      'programName',
      'primaryCommissionPercent',
      'bestTargetLabel',
      'cookieWindowDays',
      'holdDays',
      'affiliateLink',
    ],
    recommendedFilters: { partnerStatus: 'prospect', minAudienceFitScore: 70 },
  },
  {
    id: 'first-link-activation',
    title: 'First Link Activation',
    category: 'activation',
    icon: 'Link2',
    goal: 'Get approved partners to publish their first affiliate link.',
    channels: ['email', 'message', 'in_app'],
    audienceSegment: 'Approved partners with no clicks or no generated link.',
    subject: 'Your {{programName}} link is ready',
    content:
      'Hi {{partnerName}}, your affiliate setup is ready. Start with this link: {{affiliateLink}}. The strongest angle right now is {{bestTargetLabel}}, with {{primaryCommissionPercent}}% commission and {{cookieWindowDays}} day attribution.',
    ctaLabel: 'Activate partner',
    recommendedVariables: [
      'partnerName',
      'programName',
      'affiliateLink',
      'bestTargetLabel',
      'primaryCommissionPercent',
      'cookieWindowDays',
    ],
    recommendedFilters: { partnerStatus: 'approved', clickCount: 0 },
  },
  {
    id: 'content-promo-kit',
    title: 'Content Promo Kit',
    category: 'promotion',
    icon: 'Rocket',
    goal: 'Give partners a ready-to-send launch message for a course, product, event, or challenge.',
    channels: ['email', 'message', 'social'],
    audienceSegment: 'Active partners promoting a selected content target.',
    subject: 'Promo kit for {{bestTargetLabel}}',
    content:
      '{{partnerName}}, here is the short pitch: {{bestTargetLabel}} helps {{targetAudienceLabel}} get a concrete result faster. Share {{affiliateLink}} and use UTM campaign {{utmCampaign}} so we can track performance precisely. Current conversion rate: {{conversionRatePct}}%.',
    ctaLabel: 'Share promo kit',
    recommendedVariables: [
      'partnerName',
      'bestTargetLabel',
      'targetAudienceLabel',
      'affiliateLink',
      'utmCampaign',
      'conversionRatePct',
    ],
    recommendedFilters: { partnerStatus: 'approved', contentType: 'best_available' },
  },
  {
    id: 'top-partner-boost',
    title: 'Top Partner Boost',
    category: 'performance',
    icon: 'Trophy',
    goal: 'Reward high performers and push the next campaign while momentum is high.',
    channels: ['email', 'message'],
    audienceSegment: 'Partners with recent conversions or top commission.',
    subject: '{{topPartnerName}}, you are leading {{programName}}',
    content:
      '{{topPartnerName}}, your current commission is {{topPartnerCommissionDT}} TND from {{topPartnerConversions}} conversions. The best source is {{bestSourceLabel}}. Double down with {{affiliateLink}} this week and aim for {{nextMilestoneCommissionDT}} TND.',
    ctaLabel: 'Send performance nudge',
    recommendedVariables: [
      'topPartnerName',
      'programName',
      'topPartnerCommissionDT',
      'topPartnerConversions',
      'bestSourceLabel',
      'affiliateLink',
      'nextMilestoneCommissionDT',
    ],
    recommendedFilters: { partnerStatus: 'approved', sortBy: 'commissionDT' },
  },
  {
    id: 'pending-payout-trust',
    title: 'Pending Payout Trust',
    category: 'payout',
    icon: 'Wallet',
    goal: 'Explain hold windows and payout readiness clearly to protect partner trust.',
    channels: ['email', 'message', 'in_app'],
    audienceSegment: 'Partners with pending or approved commission.',
    subject: 'Your affiliate commission status',
    content:
      'Hi {{partnerName}}, your pending commission is {{pendingCommissionDT}} TND and approved commission is {{approvedCommissionDT}} TND. Commissions unlock after {{holdDays}} days so refunds and disputes are handled cleanly. Next release estimate: {{nextReleaseDate}}.',
    ctaLabel: 'Send payout update',
    recommendedVariables: [
      'partnerName',
      'pendingCommissionDT',
      'approvedCommissionDT',
      'holdDays',
      'nextReleaseDate',
    ],
    recommendedFilters: { hasPendingCommission: true },
  },
  {
    id: 'stalled-clicks-rescue',
    title: 'Stalled Clicks Rescue',
    category: 'retention',
    icon: 'RotateCcw',
    goal: 'Recover partners who drive clicks but no conversions.',
    channels: ['email', 'message'],
    audienceSegment: 'Partners or sources with clicks and low conversion rate.',
    subject: 'A better angle for {{bestTargetLabel}}',
    content:
      '{{partnerName}}, your link has {{clickCount}} clicks and {{conversionCount}} conversions. Try sending people directly to {{bestTargetLabel}} with this link: {{affiliateLink}}. Keep the promise specific and use the source tag {{bestSourceLabel}} so we can compare the next push.',
    ctaLabel: 'Send optimization tip',
    recommendedVariables: [
      'partnerName',
      'clickCount',
      'conversionCount',
      'bestTargetLabel',
      'affiliateLink',
      'bestSourceLabel',
    ],
    recommendedFilters: { minClicks: 20, maxConversionRatePct: 2 },
  },
];

export const extractAffiliateTemplateTokens = (template: string): string[] => {
  const tokens = new Set<string>();
  const pattern = /{{\s*([\w.]+)\s*}}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(template)) !== null) {
    tokens.add(match[1]);
  }
  return Array.from(tokens).sort();
};

export const renderAffiliateTemplate = (
  template: string,
  variables: Record<string, any>,
): string => template.replace(/{{\s*([\w.]+)\s*}}/g, (_, key) => {
  const value = variables[key];
  return value === undefined || value === null ? '' : String(value);
});
