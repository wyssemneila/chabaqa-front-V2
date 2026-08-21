import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateWhatsappSessionDto {
  @ApiPropertyOptional({ example: 'motion-masters-whatsapp' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[A-Za-z0-9-]+$/, {
    message: 'name may contain only letters, numbers, and hyphens',
  })
  name?: string;
}

export class RequestWhatsappPairingCodeDto {
  @ApiProperty({ example: '+21650123456' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}

export class SendWhatsappTestMessageDto {
  @ApiProperty({ example: '+21650123456' })
  @IsPhoneNumber(undefined)
  phoneE164: string;

  @ApiProperty({ example: 'Hello from Chabaqa WhatsApp.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  body: string;
}
