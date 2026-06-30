import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

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

  enqueue(type: string, payload: Record<string, unknown>, error: unknown): void {
    const id = `${type}:${String(payload.eventId || payload.paymentId || Date.now())}`;
    const current = this.jobs.get(id);
    const attempts = (current?.attempts || 0) + 1;
    if (attempts > 5) {
      this.logger.error(`Webhook retry dead-lettered: ${id}`);
      this.jobs.delete(id);
      return;
    }

    const delayMs = Math.min(15 * 60_000, 30_000 * 2 ** (attempts - 1));
    this.jobs.set(id, {
      id,
      type,
      payload,
      attempts,
      nextAttemptAt: new Date(Date.now() + delayMs),
      lastError: error instanceof Error ? error.message : String(error),
    });
    this.logger.warn(`Webhook retry queued: ${id} attempt=${attempts}`);
  }

  getStats() {
    return {
      queued: this.jobs.size,
      due: Array.from(this.jobs.values()).filter((job) => job.nextAttemptAt <= new Date()).length,
      jobs: Array.from(this.jobs.values()).map(({ id, type, attempts, nextAttemptAt, lastError }) => ({ id, type, attempts, nextAttemptAt, lastError })),
    };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  processDueJobs(): void {
    const now = new Date();
    for (const job of this.jobs.values()) {
      if (job.nextAttemptAt <= now) {
        this.logger.warn(`Webhook retry due: ${job.id}. Manual replay endpoint/worker should process this job.`);
      }
    }
  }
}
