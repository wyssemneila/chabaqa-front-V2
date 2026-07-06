import { Module, Global } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringService } from '@/shared/services/monitoring.service';
import { HealthController } from '@/shared/controllers/health.controller';
import { MetricsController } from '@/shared/controllers/metrics.controller';
import { WebhookRetryService } from '@/shared/services/webhook-retry.service';
import { CacheModule } from '@/infrastructure/cache/cache.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProcessedWebhookEvent,
  ProcessedWebhookEventSchema,
} from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';

@Global()
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      gracefulShutdownTimeoutMs: 1000,
    }),
    CacheModule,
    MongooseModule.forFeature([
      { name: ProcessedWebhookEvent.name, schema: ProcessedWebhookEventSchema },
    ]),
  ],
  controllers: [HealthController, MetricsController],
  providers: [MonitoringService, WebhookRetryService],
  exports: [MonitoringService, WebhookRetryService],
})
export class MonitoringModule {}
