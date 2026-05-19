import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import type { AiTutorMode } from '@/domains/shared/ai/ai-tutor.types';

export class AskQuestionDto {
  @IsOptional()
  @IsEnum(['chat', 'summary', 'quiz', 'simplify'])
  mode?: AiTutorMode;

  @ValidateIf((o) => (o.mode || 'chat') === 'chat')
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2000)
  question?: string;
}
