import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsHexColor,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const CUSTOM_DOMAIN_REGEX =
  /^(?!:\/\/)(?!.*\/)(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const toOptionalTrimmedString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toOptionalStringArray = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const normalized = value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  return normalized;
};

const toSafeBrandSections = (value: unknown): Record<string, unknown>[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const allowedTypes = new Set(['text', 'image', 'video', 'quote', 'stats', 'cta', 'link']);
  return value.slice(0, 20).flatMap((item, index) => {
    if (!item || typeof item !== 'object') return [];
    const source = item as Record<string, unknown>;
    const title = typeof source.title === 'string' ? source.title.trim().slice(0, 160) : '';
    const content = typeof source.content === 'string' ? source.content.trim().slice(0, 4000) : '';
    if (!title && !content) return [];
    return [{
      id: typeof source.id === 'string' ? source.id.trim().slice(0, 100) : `section-${index + 1}`,
      type: typeof source.type === 'string' && allowedTypes.has(source.type) ? source.type : 'text',
      title: title || `Section ${index + 1}`,
      content,
      visible: source.visible !== false,
      order: typeof source.order === 'number' && Number.isFinite(source.order) ? Math.max(0, Math.min(100, source.order)) : index,
    }];
  });
};

export enum CommunityPriceType {
  FREE = 'free',
  ONE_TIME = 'one-time',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export enum CommunityType {
  COMMUNITY = 'community',
  COURSE = 'course',
  CHALLENGE = 'challenge',
  EVENT = 'event',
  ONE_TO_ONE = 'oneToOne',
  PRODUCT = 'product',
}

export enum HeaderStyle {
  DEFAULT = 'default',
  CENTERED = 'centered',
  MINIMAL = 'minimal',
}

export enum ContentWidth {
  NARROW = 'narrow',
  NORMAL = 'normal',
  WIDE = 'wide',
  FULL = 'full',
}

export class UpdateCommunitySocialLinksDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  twitter?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  instagram?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  linkedin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  discord?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  behance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  github?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  facebook?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  youtube?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  tiktok?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  website?: string;
}

export class UpdateCommunitySettingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  primaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsHexColor()
  secondaryColor?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  welcomeMessage?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toOptionalStringArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(160, { each: true })
  features?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toOptionalStringArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(220, { each: true })
  benefits?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  heroBackground?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(40)
  template?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(100)
  fontFamily?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 32 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(32)
  borderRadius?: number;

  @ApiPropertyOptional({ enum: ['solid', 'soft', 'gradient', 'image'] })
  @IsOptional()
  @IsEnum(['solid', 'soft', 'gradient', 'image'])
  backgroundStyle?: string;

  @ApiPropertyOptional({ enum: ['centered', 'split', 'media-left', 'media-right'] })
  @IsOptional()
  @IsEnum(['centered', 'split', 'media-left', 'media-right'])
  heroLayout?: string;

  @ApiPropertyOptional({ enum: HeaderStyle })
  @IsOptional()
  @IsEnum(HeaderStyle)
  headerStyle?: string;

  @ApiPropertyOptional({ enum: ContentWidth })
  @IsOptional()
  @IsEnum(ContentWidth)
  contentWidth?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showHero?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showFeatures?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showPosts?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showBenefits?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showTestimonials?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  showStats?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowInvites?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enableParallax?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toOptionalStringArray(value))
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(1000, { each: true })
  gallery?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  videoUrl?: string;

  @ApiPropertyOptional({ type: [Object] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @Transform(({ value }) => toSafeBrandSections(value))
  customSections?: Record<string, unknown>[];

  @ApiPropertyOptional({
    description: 'Versioned Brand Studio configuration. Arbitrary CSS and JavaScript are intentionally unsupported.',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  brand?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(160)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Custom domain without protocol/path. Example: ai.chabaqa.io',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => {
    const normalized = toOptionalTrimmedString(value);
    return normalized ? normalized.toLowerCase() : undefined;
  })
  @ValidateIf((_, value) => value !== '')
  @Matches(CUSTOM_DOMAIN_REGEX, {
    message: 'customDomain must be a valid hostname without protocol or path',
  })
  customDomain?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(10000)
  headerScripts?: string;

  @ApiPropertyOptional({ type: UpdateCommunitySocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCommunitySocialLinksDto)
  socialLinks?: UpdateCommunitySocialLinksDto;
}

export class UpdateCommunityCustomizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(5000)
  longDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @Transform(({ value }) => toOptionalStringArray(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Transform(({ value }) => toOptionalTrimmedString(value))
  @IsString()
  @MaxLength(1000)
  logo?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000000)
  price?: number;

  @ApiPropertyOptional({ enum: CommunityPriceType })
  @IsOptional()
  @IsEnum(CommunityPriceType)
  priceType?: string;

  @ApiPropertyOptional({ enum: CommunityType })
  @IsOptional()
  @IsEnum(CommunityType)
  type?: string;

  @ApiPropertyOptional({ type: UpdateCommunitySettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateCommunitySettingsDto)
  settings?: UpdateCommunitySettingsDto;
}
