import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class CreateWhatsappSessionDto {
  @ApiPropertyOptional({ example: 'motion-masters-whatsapp' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
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
