import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export const CREATOR_DISCOVERY_SOURCES = [
  'instagram_tiktok',
  'search',
  'friend_creator',
  'youtube_podcast',
  'event',
  'other',
  'prefer_not_to_say',
] as const;

export class CreatorDashboardOnboardingDto {
  @IsOptional()
  @IsIn(CREATOR_DISCOVERY_SOURCES)
  readonly discoverySource?: typeof CREATOR_DISCOVERY_SOURCES[number];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  readonly dashboardTourStep?: number;

  @IsOptional()
  @IsBoolean()
  readonly dashboardTourCompleted?: boolean;
}
