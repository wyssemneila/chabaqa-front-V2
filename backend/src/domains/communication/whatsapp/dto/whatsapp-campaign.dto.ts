import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WhatsappAudienceType,
  WhatsappMessageType,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { WhatsappAutomationTrigger } from '@/infrastructure/database/schemas/communication/whatsapp-automation.schema';

export class ImportWhatsappContactDto {
  @ApiProperty({ example: 'Amina Ben Salem' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  name: string;

  @ApiProperty({ example: '+21650123456' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  phoneE164: string;

  @ApiPropertyOptional({ example: '507f1f77bcf86cd799439011' })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({ example: ['vip', 'launch'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    default: true,
    description: 'Must be true to mark this contact as opted in.',
  })
  @IsOptional()
  @IsBoolean()
  optIn?: boolean;

  @ApiPropertyOptional({ example: 'manual_import' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  consentSource?: string;

  @ApiPropertyOptional({
    example: 'Customer opted in during checkout on 2026-06-22.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  consentProof?: string;

  @ApiPropertyOptional({ example: 'admin_attestation' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  consentMethod?: string;
}

export class ImportWhatsappContactsDto {
  @ApiProperty({ type: [ImportWhatsappContactDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportWhatsappContactDto)
  contacts: ImportWhatsappContactDto[];
}

export class WhatsappAudiencePreviewDto {
  @ApiProperty({ enum: WhatsappAudienceType })
  @IsEnum(WhatsappAudienceType)
  targetAudience: WhatsappAudienceType;

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439011'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  customAudienceIds?: string[];

  @ApiPropertyOptional({ minimum: 1, maximum: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;
}

export class CreateWhatsappCampaignDto {
  @ApiProperty({ example: 'Course Launch Announcement' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  @IsMongoId()
  communityId: string;

  @ApiPropertyOptional({
    enum: WhatsappMessageType,
    default: WhatsappMessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(WhatsappMessageType)
  messageType?: WhatsappMessageType;

  @ApiProperty({
    example: 'Our new course is live. Reply if you need help joining.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  body: string;

  @ApiPropertyOptional({ example: 'Launch week offer' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiPropertyOptional({
    enum: WhatsappAudienceType,
    default: WhatsappAudienceType.ALL_MEMBERS,
  })
  @IsOptional()
  @IsEnum(WhatsappAudienceType)
  targetAudience?: WhatsappAudienceType;

  @ApiPropertyOptional({ example: ['507f1f77bcf86cd799439011'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  customAudienceIds?: string[];

  @ApiPropertyOptional({ example: '2026-06-20T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;
}

export class UpdateWhatsappCampaignDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsEnum(WhatsappMessageType)
  messageType?: WhatsappMessageType;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  body?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsEnum(WhatsappAudienceType)
  targetAudience?: WhatsappAudienceType;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  customAudienceIds?: string[];

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @IsOptional()
  @IsObject()
  templateData?: Record<string, any>;
}

export class WhatsappCampaignQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  status?: string;
}

export class RenderWhatsappPreviewDto {
  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsObject()
  mergeData?: Record<string, any>;
}

export class CreateWhatsappAutomationDto {
  @ApiProperty({ example: 'Welcome new members' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(160)
  name: string;

  @ApiProperty({ enum: WhatsappAutomationTrigger })
  @IsEnum(WhatsappAutomationTrigger)
  trigger: WhatsappAutomationTrigger;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  delayHours?: number;

  @ApiProperty({ example: 'Welcome {{name}}. Happy to have you here.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  body: string;

  @ApiPropertyOptional({
    enum: WhatsappMessageType,
    default: WhatsappMessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(WhatsappMessageType)
  messageType?: WhatsappMessageType;

  @ApiPropertyOptional({ example: 'Welcome' })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateWhatsappAutomationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsEnum(WhatsappAutomationTrigger)
  trigger?: WhatsappAutomationTrigger;

  @IsOptional()
  @IsNumber()
  @Min(0)
  delayHours?: number;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  body?: string;

  @IsOptional()
  @IsEnum(WhatsappMessageType)
  messageType?: WhatsappMessageType;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
