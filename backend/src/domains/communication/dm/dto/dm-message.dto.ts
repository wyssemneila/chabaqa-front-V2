import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class DmAttachmentDto {
  @ApiProperty({ example: 'https://api.chabaqa.io/uploads/image/example.jpg' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ enum: ['image', 'file', 'video'] })
  @IsString()
  @IsIn(['image', 'file', 'video'])
  type: 'image' | 'file' | 'video';

  @ApiProperty({ example: 123456 })
  @IsNumber()
  @Min(0)
  size: number;

  @ApiPropertyOptional({ example: 'brief.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'image/jpeg' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @ApiPropertyOptional({ example: 1280 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  width?: number;

  @ApiPropertyOptional({ example: 720 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  height?: number;
}

export class SendDmMessageDto {
  @ApiPropertyOptional({ example: 'Hello, can you review this?' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @ApiPropertyOptional({ type: [DmAttachmentDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DmAttachmentDto)
  attachments?: DmAttachmentDto[];

  @ApiPropertyOptional({ description: 'Message ID being replied to' })
  @IsOptional()
  @IsString()
  replyToMessageId?: string;

  @ApiPropertyOptional({ description: 'Client-generated idempotency key for optimistic sends' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  clientRequestId?: string;
}

export class EditDmMessageDto {
  @ApiProperty({ example: 'Updated message text' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text: string;
}

export class ReactDmMessageDto {
  @ApiProperty({ description: 'Emoji reaction to toggle', example: '👍', maxLength: 16 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  emoji: string;
}

export class TypingDmDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  isTyping: boolean;
}
