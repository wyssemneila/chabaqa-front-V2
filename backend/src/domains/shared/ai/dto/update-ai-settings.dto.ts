import { IsBoolean, IsOptional, IsString } from 'class-validator';

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

}
