import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Community,
  CommunityDocument,
} from '@/infrastructure/database/schemas/community/community.schema';
import {
  WhatsappSession,
  WhatsappSessionDocument,
  WhatsappSessionStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-session.schema';
import {
  OpenWaClientService,
  OpenWaSessionResponse,
} from '@/domains/communication/whatsapp/openwa-client.service';

@Injectable()
export class WhatsappSessionService {
  private readonly logger = new Logger(WhatsappSessionService.name);

  constructor(
    @InjectModel(WhatsappSession.name)
    private readonly sessionModel: Model<WhatsappSessionDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    private readonly openWaClient: OpenWaClientService,
  ) {}

  async getSession(
    communityId: string,
  ): Promise<WhatsappSessionDocument | null> {
    const session = await this.sessionModel
      .findOne({ communityId: new Types.ObjectId(communityId) })
      .exec();
    if (!session?.openwaSessionId) return session;
    return this.syncOpenWaStatus(session);
  }

  async createSession(
    creatorId: string,
    communityId: string,
    requestedName?: string,
  ): Promise<WhatsappSessionDocument> {
    const existing = await this.sessionModel
      .findOne({ communityId: new Types.ObjectId(communityId) })
      .exec();
    if (existing) return existing;

    const community = await this.communityModel
      .findById(communityId)
      .select('name slug')
      .lean();
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const safeName = (
      requestedName || `chabaqa-${community.slug || communityId}`
    )
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    if (safeName.length < 3) {
      throw new BadRequestException(
        'WhatsApp session name must contain 3 to 50 letters, numbers, or hyphens',
      );
    }
    const created = await this.openWaClient.createSession(safeName);

    return new this.sessionModel({
      communityId: new Types.ObjectId(communityId),
      creatorId: new Types.ObjectId(creatorId),
      openwaSessionId: created.id,
      name: created.name || safeName,
      status: this.mapOpenWaStatus(created.status),
      phone: created.phone,
      pushName: created.pushName,
      lastSyncedAt: new Date(),
    }).save();
  }

  async startSession(
    creatorId: string,
    communityId: string,
  ): Promise<WhatsappSessionDocument> {
    let session = await this.getSession(communityId);
    if (!session) {
      session = await this.createSession(creatorId, communityId);
    }
    if (!session.openwaSessionId) {
      throw new BadRequestException(
        'WhatsApp session is missing OpenWA session id',
      );
    }
    if (
      [
        WhatsappSessionStatus.QR_PENDING,
        WhatsappSessionStatus.PAIRING_PENDING,
        WhatsappSessionStatus.READY,
      ].includes(session.status)
    ) {
      return session;
    }

    session.status = WhatsappSessionStatus.STARTING;
    session.lastError = undefined;
    await session.save();

    try {
      const started = await this.openWaClient.startSession(
        session.openwaSessionId,
      );
      session.status = this.mapOpenWaStatus(
        started.status,
        WhatsappSessionStatus.QR_PENDING,
      );
      session.phone = started.phone || session.phone;
      session.pushName = started.pushName || session.pushName;
      session.connectedAt =
        session.status === WhatsappSessionStatus.READY
          ? session.connectedAt || new Date()
          : session.connectedAt;
      session.lastSyncedAt = new Date();
      await this.registerWebhook(session);
      return session.save();
    } catch (error: any) {
      if (this.isMissingOpenWaSession(error)) {
        const replacement = await this.replaceMissingOpenWaSession(
          session,
          creatorId,
          communityId,
        );
        return this.startSession(creatorId, String(replacement.communityId));
      }
      if (
        String(error?.message || '')
          .toLowerCase()
          .includes('timeout')
      ) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError =
          'OpenWA is still starting this WhatsApp session. The QR code will appear shortly.';
        session.lastSyncedAt = new Date();
        return session.save();
      }
      session.status = WhatsappSessionStatus.FAILED;
      session.lastError = error?.message || 'Failed to start OpenWA session';
      session.lastSyncedAt = new Date();
      await session.save();
      throw error;
    }
  }

  async getQr(
    communityId: string,
  ): Promise<{ session: WhatsappSessionDocument; qrCodeData?: string }> {
    const session = await this.requireSession(communityId);
    if (!session.openwaSessionId) {
      throw new BadRequestException('WhatsApp session is not linked to OpenWA');
    }
    try {
      const qr = await this.openWaClient.getQr(session.openwaSessionId);
      session.qrCodeData =
        qr.dataUrl || qr.qrCode || qr.qr || session.qrCodeData;
      session.status = qr.status
        ? this.mapOpenWaStatus(qr.status, WhatsappSessionStatus.QR_PENDING)
        : WhatsappSessionStatus.QR_PENDING;
      session.lastError = undefined;
      session.lastSyncedAt = new Date();
      await session.save();
      return { session, qrCodeData: session.qrCodeData };
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (
        message.includes('already authenticated') ||
        message.includes('no qr code needed')
      ) {
        session.status = WhatsappSessionStatus.READY;
        session.connectedAt = session.connectedAt || new Date();
        session.qrCodeData = undefined;
        session.lastError = undefined;
        session.lastSyncedAt = new Date();
        await this.registerWebhook(session);
        await session.save();
        return { session };
      }
      if (
        message.includes('qr code is not ready') ||
        message.includes('not ready yet')
      ) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError = 'QR code is not ready yet. Please wait a moment.';
        session.lastSyncedAt = new Date();
        await session.save();
        return { session };
      }
      throw error;
    }
  }

  async requestPairingCode(
    communityId: string,
    phoneNumber: string,
  ): Promise<WhatsappSessionDocument> {
    const session = await this.requireSession(communityId);
    if (!session.openwaSessionId) {
      throw new BadRequestException('WhatsApp session is not linked to OpenWA');
    }
    if (session.status === WhatsappSessionStatus.READY) {
      session.pairingCode = undefined;
      session.lastError = undefined;
      session.lastSyncedAt = new Date();
      return session.save();
    }
    try {
      const normalizedPhoneNumber = this.normalizePairingPhoneNumber(phoneNumber);
      const result = await this.openWaClient.requestPairingCode(
        session.openwaSessionId,
        normalizedPhoneNumber,
      );
      session.pairingCode =
        result.pairingCode || result.code || session.pairingCode;
      session.status = WhatsappSessionStatus.PAIRING_PENDING;
      session.phone = phoneNumber;
      session.lastError = undefined;
      session.lastSyncedAt = new Date();
      return session.save();
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (
        message.includes('already authenticated') ||
        message.includes('already connected') ||
        message.includes('no pairing')
      ) {
        session.status = WhatsappSessionStatus.READY;
        session.connectedAt = session.connectedAt || new Date();
        session.pairingCode = undefined;
        session.lastError = undefined;
        session.lastSyncedAt = new Date();
        await this.registerWebhook(session);
        return session.save();
      }
      if (message.includes('not ready') || message.includes('qr')) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError =
          'Pairing code is not ready yet. Please wait a moment.';
        session.lastSyncedAt = new Date();
        return session.save();
      }
      throw error;
    }
  }

  async disconnect(communityId: string): Promise<WhatsappSessionDocument> {
    const session = await this.requireSession(communityId);
    if (session.openwaSessionId) {
      await this.openWaClient
        .stopSession(session.openwaSessionId)
        .catch((error) => {
          session.lastError = error?.message || 'Failed to stop OpenWA session';
        });
    }
    session.status = WhatsappSessionStatus.DISCONNECTED;
    session.lastSyncedAt = new Date();
    return session.save();
  }

  async requireReadySession(
    communityId: string,
  ): Promise<WhatsappSessionDocument> {
    const session = await this.requireSession(communityId);
    const synced = await this.syncOpenWaStatus(session, true);
    if (synced.status !== WhatsappSessionStatus.READY) {
      throw new BadRequestException('WhatsApp session is not connected');
    }
    return synced;
  }

  async getSessionByOpenWaId(
    openwaSessionId: string,
  ): Promise<WhatsappSessionDocument | null> {
    return this.sessionModel.findOne({ openwaSessionId }).exec();
  }

  async markFromWebhook(
    openwaSessionId: string | undefined,
    status: WhatsappSessionStatus,
    error?: string,
  ): Promise<void> {
    if (!openwaSessionId) return;
    const set: Record<string, any> = {
      status,
      lastError: error,
      lastSyncedAt: new Date(),
    };
    if (status === WhatsappSessionStatus.READY) set.connectedAt = new Date();
    await this.sessionModel.updateOne({ openwaSessionId }, { $set: set });
  }

  async markOpenWaStatusFromWebhook(
    openwaSessionId: string | undefined,
    openwaStatus: string,
    error?: string,
  ): Promise<void> {
    await this.markFromWebhook(
      openwaSessionId,
      this.mapOpenWaStatus(openwaStatus, WhatsappSessionStatus.FAILED),
      error,
    );
  }

  async getHealth(): Promise<any> {
    const [openwa, sessions] = await Promise.all([
      this.openWaClient.health(),
      this.sessionModel.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);
    return {
      enabled: this.openWaClient.isEnabled(),
      openwa,
      sessions: sessions.reduce((acc: Record<string, number>, row: any) => {
        acc[row._id || 'unknown'] = row.count;
        return acc;
      }, {}),
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async reconcileActiveSessions(): Promise<void> {
    if (!this.openWaClient.isEnabled()) return;
    const sessions = await this.sessionModel
      .find({
        openwaSessionId: { $exists: true, $ne: null },
        status: {
          $in: [
            WhatsappSessionStatus.STARTING,
            WhatsappSessionStatus.QR_PENDING,
            WhatsappSessionStatus.PAIRING_PENDING,
            WhatsappSessionStatus.READY,
          ],
        },
      })
      .limit(50)
      .exec();

    for (const session of sessions) {
      try {
        await this.syncOpenWaStatus(session);
        await this.registerWebhook(session);
      } catch (error: any) {
        this.logger.warn(
          `WhatsApp session reconcile failed for ${session.openwaSessionId}: ${error?.message || error}`,
        );
      }
    }
  }

  private async requireSession(
    communityId: string,
  ): Promise<WhatsappSessionDocument> {
    const session = await this.sessionModel
      .findOne({ communityId: new Types.ObjectId(communityId) })
      .exec();
    if (!session) {
      throw new NotFoundException('WhatsApp session not found');
    }
    return session;
  }

  private isMissingOpenWaSession(error: any): boolean {
    const message = String(error?.message || '').toLowerCase();
    return message.includes('session with id') && message.includes('not found');
  }

  private async replaceMissingOpenWaSession(
    session: WhatsappSessionDocument,
    creatorId: string,
    communityId: string,
  ): Promise<WhatsappSessionDocument> {
    const community = await this.communityModel
      .findById(communityId)
      .select('slug')
      .lean();
    const fallbackName = `chabaqa-${community?.slug || communityId}`
      .replace(/[^a-zA-Z0-9-]/g, '-')
      .slice(0, 50);
    const created = await this.openWaClient.createSession(session.name || fallbackName);
    session.creatorId = new Types.ObjectId(creatorId);
    session.openwaSessionId = created.id;
    session.name = created.name || session.name || fallbackName;
    session.status = this.mapOpenWaStatus(created.status, WhatsappSessionStatus.NOT_CREATED);
    session.phone = undefined;
    session.pushName = undefined;
    session.qrCodeData = undefined;
    session.pairingCode = undefined;
    session.connectedAt = undefined;
    session.lastWebhookRegisteredAt = undefined;
    session.lastError = undefined;
    session.lastSyncedAt = new Date();
    return session.save();
  }

  private normalizePairingPhoneNumber(phoneNumber: string): string {
    const digits = String(phoneNumber || '').replace(/\D/g, '');
    if (digits.length < 6 || digits.length > 15) {
      throw new BadRequestException(
        'Phone number must be in international format with 6 to 15 digits, for example 21650123456.',
      );
    }
    return digits;
  }

  private async syncOpenWaStatus(
    session: WhatsappSessionDocument,
    throwOnError = false,
  ): Promise<WhatsappSessionDocument> {
    if (!session.openwaSessionId) return session;
    try {
      const openwa = await this.openWaClient.getSession(
        session.openwaSessionId,
      );
      session.status = this.mapOpenWaStatus(openwa.status, session.status);
      session.phone = openwa.phone || session.phone;
      session.pushName = openwa.pushName || session.pushName;
      session.lastError = openwa.lastError || session.lastError;
      session.lastSyncedAt = new Date();
      session.lastHealthCheckAt = new Date();
      if (session.status === WhatsappSessionStatus.READY) {
        session.connectedAt = session.connectedAt || new Date();
      }
      return session.save();
    } catch (error: any) {
      session.lastError = error?.message || 'Failed to sync OpenWA session';
      session.lastSyncedAt = new Date();
      await session.save();
      if (throwOnError) throw error;
      return session;
    }
  }

  private async registerWebhook(
    session: WhatsappSessionDocument,
  ): Promise<void> {
    const webhookUrl = String(process.env.OPENWA_WEBHOOK_URL || '').trim();
    if (!webhookUrl || !session.openwaSessionId) return;

    const lastRegisteredAt = session.lastWebhookRegisteredAt
      ? new Date(session.lastWebhookRegisteredAt).getTime()
      : 0;
    if (lastRegisteredAt && Date.now() - lastRegisteredAt < 10 * 60 * 1000)
      return;

    try {
      await this.openWaClient.createWebhook(session.openwaSessionId, {
        url: webhookUrl,
        secret:
          String(process.env.OPENWA_WEBHOOK_SECRET || '').trim() || undefined,
      });
      session.lastWebhookRegisteredAt = new Date();
      session.lastError = undefined;
    } catch (error: any) {
      session.lastError = error?.message || 'Failed to register OpenWA webhook';
      this.logger.warn(
        `Failed to register OpenWA webhook for ${session.openwaSessionId}: ${session.lastError}`,
      );
    }
  }

  private mapOpenWaStatus(
    status?: string,
    fallback = WhatsappSessionStatus.NOT_CREATED,
  ): WhatsappSessionStatus {
    const normalized = String(status || '').toLowerCase();
    if (['ready', 'authenticated', 'connected'].includes(normalized))
      return WhatsappSessionStatus.READY;
    if (['qr', 'qr_pending', 'qr_ready'].includes(normalized))
      return WhatsappSessionStatus.QR_PENDING;
    if (
      ['created', 'starting', 'initializing', 'authenticating', 'loading'].includes(
        normalized,
      )
    )
      return WhatsappSessionStatus.STARTING;
    if (['disconnected', 'stopped', 'closed'].includes(normalized))
      return WhatsappSessionStatus.DISCONNECTED;
    if (
      ['failed', 'auth_failed', 'action_required', 'error'].includes(normalized)
    )
      return WhatsappSessionStatus.FAILED;
    return fallback;
  }
}
