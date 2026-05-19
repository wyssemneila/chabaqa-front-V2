import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  AiAgentSurface,
  AiAgentTone,
  AiAgentType,
} from '@/infrastructure/database/schemas/ai/ai-agent.schema';

class AiAgentEscalationDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsEnum(['support_queue', 'creator_dm', 'staff_role'])
  target?: 'support_queue' | 'creator_dm' | 'staff_role';

  @IsOptional()
  @IsEnum(['admin', 'support'])
  staffRole?: 'admin' | 'support';
}

export class CreateAiAgentDto {
  @IsEnum(AiAgentType)
  type: AiAgentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  bio?: string;

  @IsOptional()
  @IsEnum(AiAgentTone)
  tone?: AiAgentTone;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  systemPromptOverride?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(AiAgentSurface, { each: true })
  enabledSurfaces?: AiAgentSurface[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AiAgentEscalationDto)
  escalation?: AiAgentEscalationDto;
}

export class UpdateAiAgentDto extends PartialType(CreateAiAgentDto) {
  @IsOptional()
  @IsEnum(['active', 'paused'])
  status?: 'active' | 'paused';
}

export class ChatWithAiAgentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}
