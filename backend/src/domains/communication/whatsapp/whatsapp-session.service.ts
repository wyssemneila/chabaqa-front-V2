import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Community, CommunityDocument } from '@/infrastructure/database/schemas/community/community.schema';
import {
  WhatsappSession,
  WhatsappSessionDocument,
  WhatsappSessionStatus,
} from '@/infrastructure/database/schemas/communication/whatsapp-session.schema';
import { OpenWaClientService, OpenWaSessionResponse } from '@/domains/communication/whatsapp/openwa-client.service';

@Injectable()
export class WhatsappSessionService {
  constructor(
    @InjectModel(WhatsappSession.name)
    private readonly sessionModel: Model<WhatsappSessionDocument>,
    @InjectModel(Community.name)
    private readonly communityModel: Model<CommunityDocument>,
    private readonly openWaClient: OpenWaClientService,
  ) {}

  async getSession(communityId: string): Promise<WhatsappSessionDocument | null> {
    const session = await this.sessionModel.findOne({ communityId: new Types.ObjectId(communityId) }).exec();
    if (!session?.openwaSessionId) return session;
    return this.syncOpenWaStatus(session);
  }

  async createSession(creatorId: string, communityId: string, requestedName?: string): Promise<WhatsappSessionDocument> {
    const existing = await this.sessionModel.findOne({ communityId: new Types.ObjectId(communityId) }).exec();
    if (existing) return existing;

    const community = await this.communityModel.findById(communityId).select('name slug').lean();
    if (!community) {
      throw new NotFoundException('Community not found');
    }

    const safeName = (requestedName || `chabaqa-${community.slug || communityId}`).replace(/[^a-zA-Z0-9_-]/g, '-');
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

  async startSession(creatorId: string, communityId: string): Promise<WhatsappSessionDocument> {
    let session = await this.getSession(communityId);
    if (!session) {
      session = await this.createSession(creatorId, communityId);
    }
    if (!session.openwaSessionId) {
      throw new BadRequestException('WhatsApp session is missing OpenWA session id');
    }
    if ([WhatsappSessionStatus.QR_PENDING, WhatsappSessionStatus.PAIRING_PENDING, WhatsappSessionStatus.READY].includes(session.status)) {
      return session;
    }

    session.status = WhatsappSessionStatus.STARTING;
    session.lastError = undefined;
    await session.save();

    try {
      const started = await this.openWaClient.startSession(session.openwaSessionId);
      session.status = this.mapOpenWaStatus(started.status, WhatsappSessionStatus.QR_PENDING);
      session.phone = started.phone || session.phone;
      session.pushName = started.pushName || session.pushName;
      session.lastSyncedAt = new Date();
      return session.save();
    } catch (error: any) {
      if (String(error?.message || '').toLowerCase().includes('timeout')) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError = 'OpenWA is still starting this WhatsApp session. The QR code will appear shortly.';
        session.lastSyncedAt = new Date();
        return session.save();
      }
      throw error;
    }
  }

  async getQr(communityId: string): Promise<{ session: WhatsappSessionDocument; qrCodeData?: string }> {
    const session = await this.requireSession(communityId);
    if (!session.openwaSessionId) {
      throw new BadRequestException('WhatsApp session is not linked to OpenWA');
    }
    try {
      const qr = await this.openWaClient.getQr(session.openwaSessionId);
      session.qrCodeData = qr.dataUrl || qr.qrCode || qr.qr || session.qrCodeData;
      session.status = qr.status ? this.mapOpenWaStatus(qr.status, WhatsappSessionStatus.QR_PENDING) : WhatsappSessionStatus.QR_PENDING;
      session.lastError = undefined;
      session.lastSyncedAt = new Date();
      await session.save();
      return { session, qrCodeData: session.qrCodeData };
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('already authenticated') || message.includes('no qr code needed')) {
        session.status = WhatsappSessionStatus.READY;
        session.qrCodeData = undefined;
        session.lastError = undefined;
        session.lastSyncedAt = new Date();
        await session.save();
        return { session };
      }
      if (message.includes('qr code is not ready') || message.includes('not ready yet')) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError = 'QR code is not ready yet. Please wait a moment.';
        session.lastSyncedAt = new Date();
        await session.save();
        return { session };
      }
      throw error;
    }
  }

  async requestPairingCode(communityId: string, phoneNumber: string): Promise<WhatsappSessionDocument> {
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
      const result = await this.openWaClient.requestPairingCode(session.openwaSessionId, phoneNumber);
      session.pairingCode = result.pairingCode || result.code || session.pairingCode;
      session.status = WhatsappSessionStatus.PAIRING_PENDING;
      session.phone = phoneNumber;
      session.lastError = undefined;
      session.lastSyncedAt = new Date();
      return session.save();
    } catch (error: any) {
      const message = String(error?.message || '').toLowerCase();
      if (message.includes('already authenticated') || message.includes('already connected') || message.includes('no pairing')) {
        session.status = WhatsappSessionStatus.READY;
        session.pairingCode = undefined;
        session.lastError = undefined;
        session.lastSyncedAt = new Date();
        return session.save();
      }
      if (message.includes('not ready') || message.includes('qr')) {
        session.status = WhatsappSessionStatus.STARTING;
        session.lastError = 'Pairing code is not ready yet. Please wait a moment.';
        session.lastSyncedAt = new Date();
        return session.save();
      }
      throw error;
    }
  }

  async disconnect(communityId: string): Promise<WhatsappSessionDocument> {
    const session = await this.requireSession(communityId);
    if (session.openwaSessionId) {
      await this.openWaClient.stopSession(session.openwaSessionId).catch((error) => {
        session.lastError = error?.message || 'Failed to stop OpenWA session';
      });
    }
    session.status = WhatsappSessionStatus.DISCONNECTED;
    session.lastSyncedAt = new Date();
    return session.save();
  }

  async requireReadySession(communityId: string): Promise<WhatsappSessionDocument> {
    const session = await this.requireSession(communityId);
    const synced = await this.syncOpenWaStatus(session);
    if (synced.status !== WhatsappSessionStatus.READY) {
      throw new BadRequestException('WhatsApp session is not connected');
    }
    return synced;
  }

  async markFromWebhook(openwaSessionId: string | undefined, status: WhatsappSessionStatus, error?: string): Promise<void> {
    if (!openwaSessionId) return;
    await this.sessionModel.updateOne(
      { openwaSessionId },
      {
        $set: {
          status,
          lastError: error,
          lastSyncedAt: new Date(),
        },
      },
    );
  }

  private async requireSession(communityId: string): Promise<WhatsappSessionDocument> {
    const session = await this.sessionModel.findOne({ communityId: new Types.ObjectId(communityId) }).exec();
    if (!session) {
      throw new NotFoundException('WhatsApp session not found');
    }
    return session;
  }

  private async syncOpenWaStatus(session: WhatsappSessionDocument): Promise<WhatsappSessionDocument> {
    if (!session.openwaSessionId) return session;
    try {
      const openwa = await this.openWaClient.getSession(session.openwaSessionId);
      session.status = this.mapOpenWaStatus(openwa.status, session.status);
      session.phone = openwa.phone || session.phone;
      session.pushName = openwa.pushName || session.pushName;
      session.lastError = openwa.lastError || session.lastError;
      session.lastSyncedAt = new Date();
      return session.save();
    } catch (error: any) {
      session.lastError = error?.message || 'Failed to sync OpenWA session';
      session.lastSyncedAt = new Date();
      await session.save();
      return session;
    }
  }

  private mapOpenWaStatus(status?: string, fallback = WhatsappSessionStatus.NOT_CREATED): WhatsappSessionStatus {
    const normalized = String(status || '').toLowerCase();
    if (['ready', 'authenticated', 'connected'].includes(normalized)) return WhatsappSessionStatus.READY;
    if (['qr', 'qr_pending', 'qr_ready'].includes(normalized)) return WhatsappSessionStatus.QR_PENDING;
    if (['starting', 'initializing', 'loading'].includes(normalized)) return WhatsappSessionStatus.STARTING;
    if (['disconnected', 'stopped', 'closed'].includes(normalized)) return WhatsappSessionStatus.DISCONNECTED;
    if (['failed', 'auth_failed', 'error'].includes(normalized)) return WhatsappSessionStatus.FAILED;
    return fallback;
  }
}
