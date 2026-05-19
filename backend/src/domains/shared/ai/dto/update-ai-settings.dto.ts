import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UpdateAiSettingsDto {
  @IsOptional()
  @IsBoolean()
  courseTutorEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  supportAgentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  learningPathsEnabled?: boolean;

  @IsOptional()
  @IsString()
  providerOverride?: string;

  @IsOptional()
  @IsBoolean()
  agentsEnabled?: boolean;

  @IsOptional()
  @IsMongoId()
  defaultConciergeAgentId?: string;

  @IsOptional()
  @IsBoolean()
  cofounderEnabled?: boolean;
}
