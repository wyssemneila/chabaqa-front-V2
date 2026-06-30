import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { createClient } from 'redis';
import { WhatsappCampaignSendJobPayload } from '@/domains/communication/whatsapp/whatsapp.jobs';

const REDIS_READY_LIST = 'whatsapp-campaigns:ready';
const REDIS_SCHEDULED_ZSET = 'whatsapp-campaigns:scheduled';
const REDIS_PAYLOAD_HASH = 'whatsapp-campaigns:payloads';

@Injectable()
export class WhatsappQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(WhatsappQueueService.name);
  private client: any = null;
  private connectingPromise: Promise<any> | null = null;

  private isDisabled(): boolean {
    return process.env.NODE_ENV === 'test' || process.env.REDIS_ENABLED === 'false';
  }

  async queueCampaignSend(
    payload: WhatsappCampaignSendJobPayload,
    scheduledAt?: Date,
  ): Promise<{ queued: true; jobId: string; delayMs: number }> {
    if (this.isDisabled()) {
      return { queued: true, jobId: `whatsapp-campaign-send:${payload.campaignId}`, delayMs: 0 };
    }

    const client = await this.getClient();
    const delayMs = Math.max(0, (scheduledAt?.getTime() || Date.now()) - Date.now());
    await this.removeScheduledCampaignSend(payload.campaignId);
    await client.hSet(REDIS_PAYLOAD_HASH, payload.campaignId, JSON.stringify(payload));

    if (delayMs > 0) {
      await client.zAdd(REDIS_SCHEDULED_ZSET, [{ score: Date.now() + delayMs, value: payload.campaignId }]);
    } else {
      await client.rPush(REDIS_READY_LIST, payload.campaignId);
    }

    const jobId = `whatsapp-campaign-send:${payload.campaignId}`;
    this.logger.log(`Queued WhatsApp campaign ${payload.campaignId} (delayMs=${delayMs})`);
    return { queued: true, jobId, delayMs };
  }

  async removeScheduledCampaignSend(campaignId: string): Promise<boolean> {
    if (this.isDisabled()) return false;

    const client = await this.getClient();
    const removedScheduled = await client.zRem(REDIS_SCHEDULED_ZSET, campaignId);
    await client.lRem(REDIS_READY_LIST, 0, campaignId);
    return removedScheduled > 0;
  }

  async moveDueScheduledToReady(nowMs: number = Date.now()): Promise<number> {
    if (this.isDisabled()) return 0;

    const client = await this.getClient();
    const dueCampaignIds = await client.zRangeByScore(REDIS_SCHEDULED_ZSET, 0, nowMs);
    if (dueCampaignIds.length === 0) return 0;
    const multi = client.multi();
    multi.zRem(REDIS_SCHEDULED_ZSET, dueCampaignIds);
    multi.rPush(REDIS_READY_LIST, dueCampaignIds);
    await multi.exec();
    return dueCampaignIds.length;
  }

  async dequeueReadyJobs(maxCount = 5): Promise<WhatsappCampaignSendJobPayload[]> {
    if (this.isDisabled()) return [];

    const client = await this.getClient();
    const jobs: WhatsappCampaignSendJobPayload[] = [];

    for (let index = 0; index < maxCount; index += 1) {
      const campaignId = await client.lPop(REDIS_READY_LIST);
      if (!campaignId) break;
      const payloadRaw = await client.hGet(REDIS_PAYLOAD_HASH, campaignId);
      if (!payloadRaw) {
        jobs.push({ campaignId, requestedBy: 'system', trigger: 'scheduled', attempt: 0 });
        continue;
      }
      try {
        jobs.push(JSON.parse(payloadRaw) as WhatsappCampaignSendJobPayload);
      } catch {
        jobs.push({ campaignId, requestedBy: 'system', trigger: 'scheduled', attempt: 0 });
      }
    }

    return jobs;
  }

  async clearJob(campaignId: string): Promise<void> {
    if (this.isDisabled()) return;

    const client = await this.getClient();
    await client.hDel(REDIS_PAYLOAD_HASH, campaignId);
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  private async getClient(): Promise<any> {
    if (this.client?.isOpen) return this.client;
    if (this.connectingPromise) return this.connectingPromise;

    this.connectingPromise = (async () => {
      const host = process.env.REDIS_HOST || '127.0.0.1';
      const port = Number(process.env.REDIS_PORT || 6379);
      const password = process.env.REDIS_PASSWORD || undefined;
      const db = Number(process.env.REDIS_DB || 0);
      const client = createClient({
        socket: { host, port, reconnectStrategy: false },
        password,
        database: db,
      });
      client.on('error', (error: Error) => this.logger.error(`Redis queue error: ${error.message}`));
      client.on('end', () => {
        this.client = null;
      });
      await client.connect();
      this.client = client;
      return client;
    })();

    try {
      return await this.connectingPromise;
    } finally {
      this.connectingPromise = null;
    }
  }
}
