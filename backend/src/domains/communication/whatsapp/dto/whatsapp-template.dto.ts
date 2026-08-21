import { IsArray, IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  WhatsappMessageType,
} from '@/infrastructure/database/schemas/communication/whatsapp-campaign.schema';
import { WhatsappTemplateCategory } from '@/infrastructure/database/schemas/communication/whatsapp-template.schema';

export class CreateWhatsappTemplateDto {
  @IsMongoId()
  communityId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name: string;

  @IsOptional()
  @IsEnum(WhatsappMessageType)
  messageType?: WhatsappMessageType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  caption?: string;

  @IsOptional()
  @IsString()
  mediaAssetId?: string;

  @IsOptional()
  @IsEnum(WhatsappTemplateCategory)
  category?: WhatsappTemplateCategory;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  variables?: string[];
}
