import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ProcessedWebhookEvent,
  ProcessedWebhookEventDocument,
  ProcessedWebhookEventStatus,
} from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';

type RetryJob = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  attempts: number;
  nextAttemptAt: Date;
  lastError?: string;
};

@Injectable()
export class WebhookRetryService {
  private readonly logger = new Logger(WebhookRetryService.name);
  private readonly jobs = new Map<string, RetryJob>();
  private readonly maxAttempts = 5;

  constructor(
    @InjectModel(ProcessedWebhookEvent.name)
    private readonly processedWebhookEventModel: Model<ProcessedWebhookEventDocument>,
  ) {}

  async enqueue(type: string, payload: Record<string, unknown>, error: unknown): Promise<void> {
    const id = `${type}:${String(payload.eventId || payload.paymentId || Date.now())}`;
    const current = this.jobs.get(id);
    const attempts = (current?.attempts || 0) + 1;
    if (attempts > this.maxAttempts) {
      this.logger.error(`Webhook retry dead-lettered: ${id}`);
      this.jobs.delete(id);
      await this.markDurableRetryState(type, payload, attempts, error, undefined, true);
      return;
    }

    const delayMs = Math.min(15 * 60_000, 30_000 * 2 ** (attempts - 1));
    const nextAttemptAt = new Date(Date.now() + delayMs);
    this.jobs.set(id, {
      id,
      type,
      payload,
      attempts,
      nextAttemptAt,
      lastError: error instanceof Error ? error.message : String(error),
    });
    await this.markDurableRetryState(type, payload, attempts, error, nextAttemptAt, false);
    this.logger.warn(`Webhook retry queued: ${id} attempt=${attempts}`);
  }

  getStats() {
    return {
      queued: this.jobs.size,
      due: Array.from(this.jobs.values()).filter((job) => job.nextAttemptAt <= new Date()).length,
      jobs: Array.from(this.jobs.values()).map(({ id, type, attempts, nextAttemptAt, lastError }) => ({ id, type, attempts, nextAttemptAt, lastError })),
    };
  }

  private async markDurableRetryState(
    type: string,
    payload: Record<string, unknown>,
    attempts: number,
    error: unknown,
    nextAttemptAt?: Date,
    deadLettered = false,
  ): Promise<void> {
    const eventId = String(payload.eventId || '');
    if (!eventId) return;

    const now = new Date();
    const message = error instanceof Error ? error.message : String(error || 'Webhook processing failed');
    await this.processedWebhookEventModel.updateOne(
      { provider: type, eventId },
      {
        $set: {
          provider: type,
          eventId,
          eventType: String(payload.eventType || 'unknown'),
          status: ProcessedWebhookEventStatus.FAILED,
          failedAt: now,
          lastAttemptAt: now,
          attempts,
          nextAttemptAt: deadLettered ? undefined : nextAttemptAt,
          deadLetteredAt: deadLettered ? now : undefined,
          error: message,
          metadata: {
            retryQueued: !deadLettered,
            deadLettered,
            maxAttempts: this.maxAttempts,
          },
        },
      },
      { upsert: true },
    );
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processDueJobs(): Promise<void> {
    const now = new Date();
    for (const job of this.jobs.values()) {
      if (job.nextAttemptAt <= now) {
        this.logger.warn(`Webhook retry due: ${job.id}. Manual replay endpoint/worker should process this job.`);
      }
    }

    const dueDurableJobs = await this.processedWebhookEventModel
      .find({
        status: ProcessedWebhookEventStatus.FAILED,
        nextAttemptAt: { $lte: now },
        deadLetteredAt: { $exists: false },
      })
      .sort({ nextAttemptAt: 1 })
      .limit(50)
      .lean()
      .exec();

    for (const job of dueDurableJobs) {
      this.logger.warn(
        `Durable webhook retry due: ${job.provider}:${job.eventId} type=${job.eventType} attempts=${job.attempts || 0}`,
      );
    }
  }
}
