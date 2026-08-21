import { IsObject, IsOptional, IsString } from 'class-validator';

export class OpenWaWebhookDto {
  @IsOptional()
  @IsString()
  event?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  messageId?: string;

  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  timestamp?: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsString()
  deliveryId?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}
