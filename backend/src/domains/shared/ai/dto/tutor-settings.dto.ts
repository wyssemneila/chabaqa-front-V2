import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCourseTutorSettingsDto {
  @IsOptional()
  @IsBoolean()
  aiTutorEnabled?: boolean;
}

export class UpdateChapterTutorSettingsDto {
  @IsOptional()
  @IsBoolean()
  aiTutorEnabled?: boolean;
}
