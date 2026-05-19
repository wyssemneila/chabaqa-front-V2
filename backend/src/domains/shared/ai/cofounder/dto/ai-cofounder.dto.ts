import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class BuildCommunityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  niche: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  audience: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  promise: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  price?: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  currency?: string;
}

export class CreateLaunchPlanDto {
  @IsMongoId()
  communityId: string;

  @IsEnum([7, 14, 30])
  durationDays: 7 | 14 | 30;

  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  goal: string;
}

export class CommunityFlowDto {
  @IsMongoId()
  communityId: string;
}

export class PublishDraftDto {
  @IsString()
  @IsNotEmpty()
  draftType: string;

  draftPayload: Record<string, any>;

  confirm: boolean;
}
