export const SOCIAL_PLATFORMS = [
  'instagram',
  'facebook',
  'linkedin',
  'twitter',
  'youtube',
  'tiktok',
  'github',
  'website',
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export type UserSocialLinks = Partial<Record<SocialPlatform, string>>;

export function normalizeSocialUrl(value?: string): string {
  const raw = (value || '').trim();
  if (!raw) return '';
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export function cleanSocialLinks(input?: UserSocialLinks | null): UserSocialLinks {
  const links = input || {};
  const normalized: UserSocialLinks = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const value = normalizeSocialUrl(links[platform]);
    if (!value) continue;
    normalized[platform] = value;
  }
  return normalized;
}
