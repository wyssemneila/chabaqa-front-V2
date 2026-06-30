import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import {
  CommunityIdFrom,
  RequireCommunityPermission,
} from '@/domains/community/access/community-permission.decorator';
import { CommunityPermission } from '@/shared/permissions';
import {
  CreateWhatsappSessionDto,
  RequestWhatsappPairingCodeDto,
  SendWhatsappTestMessageDto,
} from '@/domains/communication/whatsapp/dto/whatsapp-session.dto';
import { WhatsappSessionService } from '@/domains/communication/whatsapp/whatsapp-session.service';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';

@Controller('whatsapp/community/:communityId')
@UseGuards(JwtAuthGuard, CommunityPermissionGuard)
@RequireCommunityPermission(CommunityPermission.MARKETING_MANAGE)
@CommunityIdFrom({ type: 'param', name: 'communityId' })
@ApiTags('WhatsApp')
@ApiBearerAuth()
export class WhatsappSessionController {
  constructor(
    private readonly sessionService: WhatsappSessionService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Get('health')
  @ApiOperation({
    summary: 'Get WhatsApp integration health for this community',
  })
  getHealth() {
    return this.sessionService.getHealth();
  }

  @Get('session')
  @ApiOperation({ summary: 'Get WhatsApp session for a community' })
  getSession(@Param('communityId') communityId: string) {
    return this.sessionService.getSession(communityId);
  }

  @Post('session')
  @ApiOperation({ summary: 'Create WhatsApp session for a community' })
  createSession(
    @Request() req,
    @Param('communityId') communityId: string,
    @Body() dto: CreateWhatsappSessionDto,
  ) {
    return this.sessionService.createSession(
      req.user._id,
      communityId,
      dto.name,
    );
  }

  @Post('session/start')
  @ApiOperation({
    summary: 'Start WhatsApp session and prepare QR/pairing flow',
  })
  startSession(@Request() req, @Param('communityId') communityId: string) {
    return this.sessionService.startSession(req.user._id, communityId);
  }

  @Get('session/qr')
  @ApiOperation({ summary: 'Get WhatsApp QR code for session linking' })
  getQr(@Param('communityId') communityId: string) {
    return this.sessionService.getQr(communityId);
  }

  @Post('session/pairing-code')
  @ApiOperation({ summary: 'Request WhatsApp pairing code' })
  requestPairingCode(
    @Param('communityId') communityId: string,
    @Body() dto: RequestWhatsappPairingCodeDto,
  ) {
    return this.sessionService.requestPairingCode(communityId, dto.phoneNumber);
  }

  @Post('session/disconnect')
  @ApiOperation({ summary: 'Disconnect WhatsApp session' })
  disconnect(@Param('communityId') communityId: string) {
    return this.sessionService.disconnect(communityId);
  }

  @Post('test-message')
  @ApiOperation({ summary: 'Send a WhatsApp test message' })
  sendTestMessage(
    @Param('communityId') communityId: string,
    @Body() dto: SendWhatsappTestMessageDto,
  ) {
    return this.whatsappService.sendTestMessage(
      communityId,
      dto.phoneE164,
      dto.body,
    );
  }
}
