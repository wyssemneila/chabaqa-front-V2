import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpenWaWebhookDto } from '@/domains/communication/whatsapp/dto/openwa-webhook.dto';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';

@Controller('whatsapp/openwa')
@ApiTags('WhatsApp Webhooks')
export class WhatsappWebhookController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Receive OpenWA webhook events' })
  handleWebhook(
    @Body() dto: OpenWaWebhookDto,
    @Headers('x-webhook-secret') webhookSecret?: string,
    @Headers('x-openwa-webhook-secret') legacySecret?: string,
  ) {
    return this.whatsappService.handleOpenWaWebhook(
      dto,
      webhookSecret || legacySecret,
    );
  }
}
