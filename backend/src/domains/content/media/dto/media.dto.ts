import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsHash, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { MediaPurpose, MediaVisibility } from '@/domains/content/media/media.types';

export class MediaUploadBodyDto {
  @ApiPropertyOptional({ enum: MediaPurpose, default: MediaPurpose.GENERIC })
  @IsOptional()
  @IsEnum(MediaPurpose)
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @ApiPropertyOptional({ enum: MediaVisibility })
  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: string;
}

export class MediaPresignDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  size: number;

  @ApiProperty({ description: 'SHA-256 checksum of the upload, encoded as lowercase hexadecimal' })
  @IsHash('sha256')
  checksum: string;

  @ApiPropertyOptional({ enum: MediaPurpose, default: MediaPurpose.GENERIC })
  @IsOptional()
  @IsEnum(MediaPurpose)
  purpose?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @ApiPropertyOptional({ enum: MediaVisibility })
  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: string;
}

export class MediaCompleteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  storageKey: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  size: number;

  @ApiPropertyOptional({ enum: MediaPurpose, default: MediaPurpose.GENERIC })
  @IsOptional()
  @IsEnum(MediaPurpose)
  purpose?: string;

  @ApiProperty({ description: 'SHA-256 checksum of the upload, encoded as lowercase hexadecimal' })
  @IsHash('sha256')
  checksum: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  entityType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entityId?: string;

  @ApiPropertyOptional({ enum: MediaVisibility })
  @IsOptional()
  @IsEnum(MediaVisibility)
  visibility?: string;
}
