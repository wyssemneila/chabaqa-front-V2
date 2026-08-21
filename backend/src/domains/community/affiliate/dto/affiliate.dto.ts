import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TrackableContentType } from '@/infrastructure/database/schemas/learning/content-tracking.schema';

export class CreateProgramDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  communityId?: string;

  @ApiPropertyOptional({ description: 'Public/internal program name for dashboards and templates' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ description: 'Short program positioning or partner-facing description' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: ['community', 'creator', 'content'] })
  @IsEnum(['community', 'creator', 'content'])
  scopeType: 'community' | 'creator' | 'content';

  @ApiPropertyOptional({ enum: Object.values(TrackableContentType) })
  @IsOptional()
  @IsEnum(TrackableContentType)
  scopeContentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scopeContentId?: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  cookieWindowDays?: number;

  @ApiPropertyOptional({ default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  holdDays?: number;

  @ApiPropertyOptional({ enum: ['last_click', 'first_click'], default: 'last_click' })
  @IsOptional()
  @IsEnum(['last_click', 'first_click'])
  attributionModel?: 'last_click' | 'first_click';

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoApprovePartners?: boolean;

  @ApiPropertyOptional({ description: 'Partner-facing terms or payout rules' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  terms?: string;
}

export class UpdateProgramDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiPropertyOptional({ enum: ['active', 'paused'] })
  @IsOptional()
  @IsEnum(['active', 'paused'])
  status?: 'active' | 'paused';

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(365)
  cookieWindowDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(90)
  holdDays?: number;

  @ApiPropertyOptional({ enum: ['last_click', 'first_click'] })
  @IsOptional()
  @IsEnum(['last_click', 'first_click'])
  attributionModel?: 'last_click' | 'first_click';

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoApprovePartners?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  terms?: string;
}

export class InvitePartnerDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  customCommissionPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdatePartnerDto {
  @ApiProperty({ enum: ['approved', 'rejected', 'paused'] })
  @IsEnum(['approved', 'rejected', 'paused'])
  status: 'approved' | 'rejected' | 'paused';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  customCommissionPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  couponCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class CreateLinkDto {
  @ApiProperty()
  @IsMongoId()
  programId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  partnerUserId?: string;

  @ApiProperty({ description: 'Relative path starting with /' })
  @IsString()
  targetPath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ enum: Object.values(TrackableContentType) })
  @IsOptional()
  @IsEnum(TrackableContentType)
  targetContentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetContentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  communityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  campaignName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmCampaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmContent?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

export class CreatePartnerLinkDto {
  @ApiProperty()
  @IsMongoId()
  programId: string;

  @ApiProperty({ description: 'Relative path starting with /' })
  @IsString()
  targetPath: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ enum: Object.values(TrackableContentType) })
  @IsOptional()
  @IsEnum(TrackableContentType)
  targetContentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  targetContentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  communityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  campaignName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  utmMedium?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmCampaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmTerm?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(160)
  utmContent?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tags?: string[];
}

export class RequestPayoutDto {
  @ApiProperty({ minimum: 1 })
  @IsNumber()
  @Min(1)
  amountDT: number;

  @ApiProperty({ enum: ['bank_transfer', 'paypal', 'stripe'] })
  @IsEnum(['bank_transfer', 'paypal', 'stripe'])
  method: 'bank_transfer' | 'paypal' | 'stripe';

  @ApiPropertyOptional({ description: 'Bank details, PayPal email, or Stripe account ID' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AdminPayoutActionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class StatsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  to?: string;
}

export class AffiliateMarketingQueryDto extends StatsQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  communityId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  programId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  partnerUserId?: string;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly'], default: 'daily' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly'])
  interval?: 'daily' | 'weekly' | 'monthly';

  @ApiPropertyOptional({ description: 'Fallback lookback days when from/to are omitted', example: '30' })
  @IsOptional()
  @IsString()
  days?: string;

  @ApiPropertyOptional({ description: 'Leaderboard/dimension limit', example: '10' })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiPropertyOptional({ description: 'Include backend affiliate message/email templates', example: 'true' })
  @IsOptional()
  @IsString()
  includeTemplates?: string;
}

export class AffiliateCommissionPreviewDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  programId?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commissionPercent?: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amountDT: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  creatorNetDT?: number;
}
