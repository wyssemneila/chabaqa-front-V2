import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  WHATSAPP_CAMPAIGN_MAX_RETRY_ATTEMPTS,
  WHATSAPP_CAMPAIGN_RETRY_BASE_DELAY_MS,
  WhatsappCampaignSendJobPayload,
} from '@/domains/communication/whatsapp/whatsapp.jobs';
import { WhatsappQueueService } from '@/domains/communication/whatsapp/whatsapp.queue';
import { WhatsappService } from '@/domains/communication/whatsapp/whatsapp.service';

@Injectable()
export class WhatsappProcessor {
  private readonly logger = new Logger(WhatsappProcessor.name);
  private isProcessing = false;

  constructor(
    private readonly queueService: WhatsappQueueService,
    private readonly whatsappService: WhatsappService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const movedCount = await this.queueService.moveDueScheduledToReady();
      if (movedCount > 0) {
        this.logger.log(`Moved ${movedCount} due WhatsApp campaigns to ready queue`);
      }
      const jobs = await this.queueService.dequeueReadyJobs(5);
      for (const job of jobs) {
        await this.process(job);
      }
    } catch (error: any) {
      this.logger.warn(`WhatsApp queue processing error: ${error?.message || error}`);
    } finally {
      this.isProcessing = false;
    }
  }

  async process(job: WhatsappCampaignSendJobPayload): Promise<void> {
    const attempt = job.attempt || 0;
    try {
      await this.whatsappService.executeSendCampaignJob(job);
      await this.queueService.clearJob(job.campaignId).catch(() => undefined);
    } catch (error: any) {
      const nextAttempt = attempt + 1;
      const errorMessage = error?.message || 'Unknown WhatsApp queue processing error';
      if (nextAttempt < WHATSAPP_CAMPAIGN_MAX_RETRY_ATTEMPTS) {
        const delayMs = WHATSAPP_CAMPAIGN_RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        await this.queueService.queueCampaignSend(
          {
            campaignId: job.campaignId,
            requestedBy: job.requestedBy || 'system',
            trigger: 'retry',
            attempt: nextAttempt,
          },
          new Date(Date.now() + delayMs),
        );
        return;
      }
      this.logger.error(`WhatsApp campaign ${job.campaignId} failed: ${errorMessage}`);
      await this.whatsappService.markCampaignSendFailed(job.campaignId, errorMessage).catch(() => undefined);
      await this.queueService.clearJob(job.campaignId).catch(() => undefined);
    }
  }
}
