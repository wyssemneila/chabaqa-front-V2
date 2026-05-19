import {
  IsArray,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export type AiCreateDraftType =
  | 'course'
  | 'challenge'
  | 'event'
  | 'product'
  | 'session';

export class CreateWithAiDto {
  @IsEnum(['course', 'challenge', 'event', 'product', 'session'])
  type: AiCreateDraftType;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1200)
  idea: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  audience: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  outcome: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  niche?: string;

  @IsOptional()
  @IsIn(['beginner', 'intermediate', 'advanced'])
  difficulty?: 'beginner' | 'intermediate' | 'advanced';

  @IsOptional()
  @IsIn(['free', 'paid'])
  monetization?: 'free' | 'paid';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  price?: number;

  @IsOptional()
  @IsIn(['USD', 'EUR', 'TND'])
  currency?: 'USD' | 'EUR' | 'TND';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  includes?: string[];
}
