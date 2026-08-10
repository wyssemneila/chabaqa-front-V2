import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { DmService } from '@/domains/communication/dm/dm.service';
import { DmBroadcastService } from '@/domains/communication/dm/dm-broadcast.service';
import { DmAutomationTrigger } from '@/infrastructure/database/schemas/communication/dm-automation.schema';
import { AdminGuard } from '@/domains/auth/guards/admin.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService, FileType } from '@/domains/shared/upload/upload.service';
import { MediaPurpose } from '@/domains/content/media/media.types';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { EditDmMessageDto, ReactDmMessageDto, SendDmMessageDto, TypingDmDto } from '@/domains/communication/dm/dto/dm-message.dto';
import { DmConversationAccessGuard } from '@/domains/communication/dm/guards/dm-conversation-access.guard';

const DM_ATTACHMENT_MAX_BYTES = 100 * 1024 * 1024;
const DM_ATTACHMENT_ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  '.mp4', '.mov', '.webm',
  '.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt',
  '.mp3', '.wav', '.ogg', '.aac', '.flac',
]);

const dmAttachmentStorage = diskStorage({
  destination: (_req, file, cb) => {
    const extension = extname(file.originalname || '').toLowerCase();
    let folder = join(process.cwd(), 'uploads', 'document');

    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
      folder = join(process.cwd(), 'uploads', 'image');
    } else if (['.mp4', '.mov', '.webm'].includes(extension)) {
      folder = join(process.cwd(), 'uploads', 'video');
    } else if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(extension)) {
      folder = join(process.cwd(), 'uploads', 'audio');
    }

    cb(null, folder);
  },
  filename: (_req, file, cb) => {
    const extension = extname(file.originalname || '');
    cb(null, `${Date.now()}-${uuidv4()}${extension}`);
  },
});

const dmAttachmentUploadOptions = {
  storage: dmAttachmentStorage,
  limits: { fileSize: DM_ATTACHMENT_MAX_BYTES },
  fileFilter: (_req: any, file: Express.Multer.File, cb: Function) => {
    const extension = extname(file.originalname || '').toLowerCase();
    if (!DM_ATTACHMENT_ALLOWED_EXTENSIONS.has(extension)) {
      cb(new BadRequestException('Unsupported direct-message attachment type'), false);
      return;
    }
    cb(null, true);
  },
};

@ApiTags('Direct Messages')
@Controller('dm')
export class DmController {
  constructor(
    private readonly dmService: DmService,
    private readonly uploadService: UploadService,
    private readonly broadcastService: DmBroadcastService,
  ) {}
  private getRequestUserId(req: any): string {
    return (req?.user?._id || req?.user?.userId || req?.user?.sub || req?.user?.id || '').toString();
  }

  private isAdminRequest(req: any): boolean {
    const role = String(req?.user?.role || '').toLowerCase();
    return req?.user?.isAdmin === true || ['admin', 'super_admin', 'moderator'].includes(role);
  }

  @Post('community/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Démarrer une conversation avec le créateur de la communauté' })
  async startCommunityConversation(@Body('communityId') communityId: string, @Request() req: any) {
    const conv = await this.dmService.startCommunityConversation(this.getRequestUserId(req), communityId);
    return { conversation: conv };
  }

  @Post('peer/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Démarrer une conversation avec un autre membre de la communauté' })
  async startPeerConversation(@Body() body: { communityId: string; targetUserId: string }, @Request() req: any) {
    const conv = await this.dmService.startPeerConversation(
      this.getRequestUserId(req),
      body.targetUserId,
      body.communityId
    );
    return { conversation: conv };
  }

  @Post('session/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Démarrer une conversation temporaire avec le mentor de session' })
  async startSessionConversation(@Body() body: { bookingId: string }, @Request() req: any) {
    const conv = await this.dmService.startSessionConversation(
      this.getRequestUserId(req),
      body.bookingId,
    );
    return { conversation: conv };
  }

  @Post('help/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Démarrer une conversation d'aide avec un admin" })
  async startHelpConversation(@Request() req: any) {
    const conv = await this.dmService.startHelpConversation(this.getRequestUserId(req));
    return { conversation: conv };
  }

  @Get('inbox')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les conversations' })
  async listInbox(@Query('type') type: 'community' | 'help' | 'peer' | 'session', @Query('page') page = 1, @Query('limit') limit = 20, @Request() req: any) {
    return this.dmService.listInbox(this.getRequestUserId(req), type, Number(page), Number(limit));
  }

  @Get('broadcasts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List DM broadcasts for a community' })
  async listBroadcasts(@Query('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listBroadcasts(communityId, this.getRequestUserId(req));
  }

  @Post('broadcasts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a DM broadcast draft' })
  async createBroadcast(
    @Body() body: { communityId: string; title?: string; body: string },
    @Request() req: any,
  ) {
    return this.broadcastService.createBroadcast(this.getRequestUserId(req), body);
  }

  @Get('broadcasts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a DM broadcast' })
  async getBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.getBroadcast(id, this.getRequestUserId(req));
  }

  @Post('broadcasts/:id/send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send a DM broadcast to all community members' })
  async sendBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.sendBroadcast(id, this.getRequestUserId(req));
  }

  @Delete('broadcasts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a DM broadcast draft' })
  async deleteBroadcast(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.deleteBroadcast(id, this.getRequestUserId(req));
  }

  @Get('automations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List DM automations for a community' })
  async listAutomations(@Query('communityId') communityId: string, @Request() req: any) {
    return this.broadcastService.listAutomations(communityId, this.getRequestUserId(req));
  }

  @Post('automations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a DM automation' })
  async createAutomation(
    @Body()
    body: {
      communityId: string;
      name: string;
      trigger: DmAutomationTrigger;
      delayHours?: number;
      body: string;
    },
    @Request() req: any,
  ) {
    return this.broadcastService.createAutomation(this.getRequestUserId(req), body);
  }

  @Patch('automations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a DM automation' })
  async updateAutomation(
    @Param('id') id: string,
    @Body()
    body: Partial<{ name: string; trigger: DmAutomationTrigger; delayHours: number; body: string; isActive: boolean }>,
    @Request() req: any,
  ) {
    return this.broadcastService.updateAutomation(id, this.getRequestUserId(req), body);
  }

  @Patch('automations/:id/toggle')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle DM automation active state' })
  async toggleAutomation(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.toggleAutomation(id, this.getRequestUserId(req));
  }

  @Delete('automations/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a DM automation' })
  async deleteAutomation(@Param('id') id: string, @Request() req: any) {
    return this.broadcastService.deleteAutomation(id, this.getRequestUserId(req));
  }

  @Get(':conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les messages d\'une conversation' })
  async listMessages(@Param('conversationId') conversationId: string, @Query('page') page = 1, @Query('limit') limit = 30, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    const userId = (req.user?._id || req.user?.userId || req.user?.sub || req.user?.id || '').toString();
    return this.dmService.listMessagesRich(conversationId, userId, Number(page), Number(limit), { isAdmin });
  }

  @Post(':conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Envoyer un message' })
  @Throttle({ default: { ttl: 60, limit: 20 } } as any)
  async sendMessage(@Param('conversationId') conversationId: string, @Body() body: SendDmMessageDto, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    const message = await this.dmService.sendMessageRich(conversationId, this.getRequestUserId(req), body, { isAdmin });
    return { message };
  }

  @Get(':conversationId/messages/search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rechercher dans les messages d\'une conversation' })
  async searchMessages(
    @Param('conversationId') conversationId: string,
    @Query('q') q: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.searchMessages(conversationId, this.getRequestUserId(req), q, Number(page), Number(limit), { isAdmin });
  }

  @Get(':conversationId/messages/pinned')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les messages épinglés' })
  async listPinnedMessages(@Param('conversationId') conversationId: string, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.listPinnedMessages(conversationId, this.getRequestUserId(req), { isAdmin });
  }

  @Patch(':conversationId/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier un message envoyé' })
  async editMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() body: EditDmMessageDto,
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.editMessage(conversationId, messageId, this.getRequestUserId(req), body.text, { isAdmin });
  }

  @Delete(':conversationId/messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Supprimer un message pour soi ou pour tout le monde' })
  async deleteMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Query('scope') scope: 'me' | 'everyone' = 'me',
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.deleteMessage(conversationId, messageId, this.getRequestUserId(req), scope, { isAdmin });
  }

  @Post(':conversationId/messages/:messageId/reactions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ajouter, changer ou retirer une réaction emoji sur un message' })
  async reactToMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body() body: ReactDmMessageDto,
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.toggleReaction(conversationId, messageId, this.getRequestUserId(req), body.emoji, { isAdmin });
  }

  @Patch(':conversationId/messages/:messageId/pin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Épingler ou désépingler un message' })
  async pinMessage(
    @Param('conversationId') conversationId: string,
    @Param('messageId') messageId: string,
    @Body('pinned') pinned: any = true,
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    const shouldPin = pinned === false || pinned === 'false' ? false : true;
    return this.dmService.pinMessage(conversationId, messageId, this.getRequestUserId(req), shouldPin, { isAdmin });
  }

  @Post(':conversationId/attachments')
  @UseGuards(JwtAuthGuard, DmConversationAccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Uploader une pièce jointe et l\'envoyer dans la conversation' })
  @UseInterceptors(FileInterceptor('file', dmAttachmentUploadOptions))
  async uploadAttachment(
    @Param('conversationId') conversationId: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any
  ) {
    if (!file) {
      return { message: 'Aucun fichier' };
    }
    const processed = await this.uploadService.processUploadedFile(file, file.filename, {
      userId: req.user._id || req.user.userId,
      purpose: MediaPurpose.DM_ATTACHMENT,
      entityType: 'conversation',
      entityId: conversationId,
    });
    const attachmentType: 'image' | 'file' | 'video' =
      processed.type === FileType.IMAGE ? 'image' : processed.type === FileType.VIDEO ? 'video' : 'file';
    const isAdmin = this.isAdminRequest(req);
    const message = await this.dmService.sendMessageRich(conversationId, this.getRequestUserId(req), {
      attachments: [{
        url: processed.url,
        type: attachmentType,
        size: processed.size,
        name: file.originalname,
        mimeType: file.mimetype,
      }]
    }, { isAdmin });
    return { message };
  }

  @Patch(':conversationId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Marquer comme lu' })
  async markRead(@Param('conversationId') conversationId: string, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.markReadRich(conversationId, this.getRequestUserId(req), { isAdmin });
  }

  @Post(':conversationId/typing')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Diffuser l\'indicateur de saisie' })
  async typing(@Param('conversationId') conversationId: string, @Body() body: TypingDmDto, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.emitTyping(conversationId, this.getRequestUserId(req), body.isTyping, { isAdmin });
  }

  @Patch(':conversationId/workflow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a conversation status or label' })
  async updateWorkflow(
    @Param('conversationId') conversationId: string,
    @Body() body: { workflowStatus?: 'open' | 'waiting_on_member' | 'resolved' | 'archived'; label?: string | null },
    @Request() req: any,
  ) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.updateConversationWorkflow(conversationId, this.getRequestUserId(req), body, { isAdmin });
  }

  @Patch(':conversationId/mute')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mute or unmute a conversation for the authenticated user' })
  async setMuted(@Param('conversationId') conversationId: string, @Body('muted') muted: any, @Request() req: any) {
    const isAdmin = this.isAdminRequest(req);
    return this.dmService.setConversationMuted(conversationId, this.getRequestUserId(req), muted !== false && muted !== 'false', { isAdmin });
  }

  @Get('help/queue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lister les fils d\'aide non assignés (admin)' })
  async helpQueue() {
    return this.dmService.listUnassignedHelpThreads();
  }

  @Patch('help/:conversationId/assign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assigner un fil d\'aide (admin)' })
  async assignHelp(@Param('conversationId') conversationId: string, @Request() req: any) {
    // Assumes req.user has role 'admin' (role guard can be added later)
    return this.dmService.assignHelpThread(conversationId, this.getRequestUserId(req));
  }

  @Get(':conversationId/admin')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtenir les informations de l\'admin pour une conversation d\'aide' })
  async getHelpAdmin(@Param('conversationId') conversationId: string, @Request() req: any) {
    const admin = await this.dmService.getHelpConversationAdmin(
      conversationId,
      this.getRequestUserId(req),
      { isAdmin: this.isAdminRequest(req) },
    );
    return { admin };
  }
}
